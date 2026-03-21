package indexer

import (
	"os"
	"path/filepath"
	"testing"
)

func TestBuildIndexGroupsAndSortsPuzzlesFromCatalogMetadata(t *testing.T) {
	dir := t.TempDir()

	writePuzzle(t, dir, "b.json", `{
  "id": "b",
  "title": "Beta",
  "difficulty": 2,
  "board": { "width": 3, "height": 3 },
  "blocks": [
    { "id": "A", "cells": [[0,0]], "movable": true, "appearance": { "type": "plain", "color": "#f00" } }
  ],
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#f00" } }, "col": 2, "row": 2 }] },
  "catalog": {
    "group": { "id": "g2", "title": "Second", "order": 20 },
    "order": 20
  }
}`)
	writePuzzle(t, dir, "a.json", `{
  "id": "a",
  "title": "Alpha",
  "source": "original",
  "difficulty": 2,
  "min_moves": 7,
  "board": { "width": 3, "height": 3 },
  "blocks": [
    { "id": "A", "cells": [[0,0]], "movable": true, "appearance": { "type": "plain", "color": "#f00" } }
  ],
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#f00" } }, "col": 2, "row": 2 }] },
  "catalog": {
    "group": { "id": "g1", "title": "First", "order": 10 },
    "order": 20
  }
}`)
	writePuzzle(t, dir, "c.json", `{
  "id": "c",
  "title": "Gamma",
  "board": { "width": 3, "height": 3 },
  "blocks": [
    { "id": "A", "cells": [[0,0]], "movable": true, "appearance": { "type": "plain", "color": "#f00" } }
  ],
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#f00" } }, "col": 2, "row": 2 }] },
  "catalog": {
    "group": { "id": "g1", "title": "First", "order": 10 },
    "order": 10
  }
}`)
	writePuzzle(t, dir, "index.json", `{"version":2,"groups":[]}`)

	index, err := BuildIndex(dir)
	if err != nil {
		t.Fatalf("BuildIndex returned error: %v", err)
	}

	if index.Version != 2 {
		t.Fatalf("Version = %d, want 2", index.Version)
	}
	if len(index.Groups) != 2 {
		t.Fatalf("len(Groups) = %d, want 2", len(index.Groups))
	}
	if index.Groups[0].ID != "g1" || index.Groups[0].Title != "First" {
		t.Fatalf("first group = %+v, want g1/First", index.Groups[0])
	}
	if got := []string{index.Groups[0].Items[0].ID, index.Groups[0].Items[1].ID}; got[0] != "c" || got[1] != "a" {
		t.Fatalf("first group item order = %v, want [c a]", got)
	}
	if index.Groups[1].ID != "g2" || len(index.Groups[1].Items) != 1 || index.Groups[1].Items[0].ID != "b" {
		t.Fatalf("second group = %+v, want g2 with b", index.Groups[1])
	}
	if index.Groups[0].Items[1].Source != "original" {
		t.Fatalf("source not preserved")
	}
	if index.Groups[0].Items[1].MinMoves == nil || *index.Groups[0].Items[1].MinMoves != 7 {
		t.Fatalf("min_moves not preserved")
	}
	if index.Groups[0].Items[1].Difficulty == nil || *index.Groups[0].Items[1].Difficulty != 2 {
		t.Fatalf("difficulty not preserved")
	}
}

func TestBuildIndexRequiresCatalogMetadata(t *testing.T) {
	dir := t.TempDir()
	writePuzzle(t, dir, "broken.json", `{
  "id": "broken",
  "title": "Broken",
  "board": { "width": 3, "height": 3 },
  "blocks": [
    { "id": "A", "cells": [[0,0]], "movable": true, "appearance": { "type": "plain", "color": "#f00" } }
  ],
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#f00" } }, "col": 2, "row": 2 }] }
}`)

	_, err := BuildIndex(dir)
	if err == nil || err.Error() == "" {
		t.Fatalf("BuildIndex error = %v, want missing catalog error", err)
	}
}

func TestWriteIndexFileWritesCanonicalIndexJSON(t *testing.T) {
	dir := t.TempDir()
	writePuzzle(t, dir, "alpha.json", `{
  "id": "alpha",
  "title": "Alpha",
  "board": { "width": 3, "height": 3 },
  "blocks": [
    { "id": "A", "cells": [[0,0]], "movable": true, "appearance": { "type": "plain", "color": "#f00" } }
  ],
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#f00" } }, "col": 2, "row": 2 }] },
  "catalog": {
    "group": { "id": "group-a", "title": "Group A" }
  }
}`)

	if err := WriteIndexFile(dir); err != nil {
		t.Fatalf("WriteIndexFile returned error: %v", err)
	}

	data, err := os.ReadFile(filepath.Join(dir, "index.json"))
	if err != nil {
		t.Fatalf("ReadFile(index.json) returned error: %v", err)
	}
	if string(data) == "" {
		t.Fatal("index.json was empty")
	}
}

func TestBuildIndexRejectsInvalidPuzzleJSON(t *testing.T) {
	dir := t.TempDir()
	writePuzzle(t, dir, "broken.json", `{
  "id": "broken",
  "title": "Broken",
  "board": { "width": 3, "height": 3 },
  "blocks": [
    { "id": "A", "cells": [[0,0]], "movable": true, "appearance": { "type": "text", "color": "#f00", "value": "A", "text_color": "blue" } }
  ],
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#f00" } }, "col": 2, "row": 2 }] },
  "catalog": {
    "group": { "id": "group-a", "title": "Group A" }
  }
}`)

	_, err := BuildIndex(dir)
	if err == nil || err.Error() == "" {
		t.Fatalf("BuildIndex error = %v, want validation error", err)
	}
}

func writePuzzle(t *testing.T, dir string, name string, body string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(dir, name), []byte(body), 0644); err != nil {
		t.Fatalf("WriteFile(%s) returned error: %v", name, err)
	}
}
