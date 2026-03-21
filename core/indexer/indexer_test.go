package indexer

import (
	"os"
	"path/filepath"
	"testing"
)

func TestBuildIndexBuildsFlatCatalogWithPlaceholderRegistries(t *testing.T) {
	dir := t.TempDir()

	writePuzzle(t, dir, "b.json", `{
  "id": "b",
  "title": "Beta",
  "board": { "width": 3, "height": 3 },
  "blocks": [
    { "id": "A", "cells": [[0,0]], "movable": true, "appearance": { "type": "plain", "color": "#f00" } }
  ],
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#f00" } }, "col": 2, "row": 2 }] }
}`)
	writePuzzle(t, dir, "a.json", `{
  "id": "a",
  "title": "Alpha",
  "min_moves": 7,
  "board": { "width": 3, "height": 3 },
  "blocks": [
    { "id": "A", "cells": [[0,0]], "movable": true, "appearance": { "type": "plain", "color": "#f00" } }
  ],
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#f00" } }, "col": 2, "row": 2 }] }
}`)
	writePuzzle(t, dir, "c.json", `{
  "id": "c",
  "title": "Gamma",
  "board": { "width": 3, "height": 3 },
  "blocks": [
    { "id": "A", "cells": [[0,0]], "movable": true, "appearance": { "type": "plain", "color": "#f00" } }
  ],
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#f00" } }, "col": 2, "row": 2 }] }
}`)
	writePuzzle(t, dir, "index.json", `{"version":3,"registries":{"sources":[],"difficulties":[],"groups":[]},"puzzles":[]}`)

	index, err := BuildIndex(dir)
	if err != nil {
		t.Fatalf("BuildIndex returned error: %v", err)
	}

	if index.Version != IndexVersion {
		t.Fatalf("Version = %d, want %d", index.Version, IndexVersion)
	}
	if got := index.Registries.Sources; len(got) != 1 || got[0] != PlaceholderSource {
		t.Fatalf("Sources = %v, want [%q]", got, PlaceholderSource)
	}
	if got := index.Registries.Difficulties; len(got) != 1 || got[0] != PlaceholderDifficulty {
		t.Fatalf("Difficulties = %v, want [%d]", got, PlaceholderDifficulty)
	}
	if len(index.Registries.Groups) != 1 || index.Registries.Groups[0].ID != PlaceholderGroupID || index.Registries.Groups[0].Title != PlaceholderGroupTitle {
		t.Fatalf("Groups = %+v, want placeholder group", index.Registries.Groups)
	}
	if len(index.Puzzles) != 3 {
		t.Fatalf("len(Puzzles) = %d, want 3", len(index.Puzzles))
	}
	if got := []string{index.Puzzles[0].ID, index.Puzzles[1].ID, index.Puzzles[2].ID}; got[0] != "a" || got[1] != "b" || got[2] != "c" {
		t.Fatalf("puzzle order = %v, want [a b c]", got)
	}
	if index.Puzzles[0].Title != "A" || index.Puzzles[0].Source != PlaceholderSource || index.Puzzles[0].Difficulty != PlaceholderDifficulty || index.Puzzles[0].GroupID != PlaceholderGroupID {
		t.Fatalf("first puzzle = %+v, want placeholder metadata", index.Puzzles[0])
	}
	if index.Puzzles[0].MinMoves == nil || *index.Puzzles[0].MinMoves != 7 {
		t.Fatalf("min_moves not preserved")
	}
	if index.Puzzles[1].Title != "B" || index.Puzzles[2].Title != "C" {
		t.Fatalf("placeholder titles = %q, %q, want B/C", index.Puzzles[1].Title, index.Puzzles[2].Title)
	}
}

func TestBuildIndexRequiresUniquePuzzleIDs(t *testing.T) {
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
	writePuzzle(t, dir, "duplicate.json", `{
  "id": "broken",
  "title": "Duplicate Broken",
  "board": { "width": 3, "height": 3 },
  "blocks": [
    { "id": "A", "cells": [[0,0]], "movable": true, "appearance": { "type": "plain", "color": "#0f0" } }
  ],
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#0f0" } }, "col": 2, "row": 2 }] }
}`)

	_, err := BuildIndex(dir)
	if err == nil || err.Error() == "" {
		t.Fatalf("BuildIndex error = %v, want duplicate id error", err)
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
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#f00" } }, "col": 2, "row": 2 }] }
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
  "win_condition": { "type": "position", "positions": [{ "match": { "appearance": { "color": "#f00" } }, "col": 2, "row": 2 }] }
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
