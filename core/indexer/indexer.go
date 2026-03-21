package indexer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	core "github.com/keithmaguire/sliding-puzzle/core"
)

type PuzzleIndex struct {
	Version    int             `json:"version"`
	Registries IndexRegistries `json:"registries"`
	Puzzles    []IndexEntry    `json:"puzzles"`
}

type IndexRegistries struct {
	Sources      []string            `json:"sources"`
	Difficulties []int               `json:"difficulties"`
	Groups       []IndexGroupCatalog `json:"groups"`
}

type IndexGroupCatalog struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type IndexEntry struct {
	ID         string `json:"id"`
	File       string `json:"file"`
	Title      string `json:"title"`
	Source     string `json:"source"`
	Difficulty int    `json:"difficulty"`
	GroupID    string `json:"group_id"`
	MinMoves   *int   `json:"min_moves,omitempty"`
}

type puzzleFile struct {
	ID       string `json:"id"`
	MinMoves *int   `json:"min_moves,omitempty"`
}

const (
	IndexVersion          = 3
	PlaceholderSource     = "Unknown"
	PlaceholderDifficulty = 1
	PlaceholderGroupID    = "generated-group"
	PlaceholderGroupTitle = "Generated"
)

func BuildIndex(puzzlesDir string) (PuzzleIndex, error) {
	pattern := filepath.Join(puzzlesDir, "*.json")
	paths, err := filepath.Glob(pattern)
	if err != nil {
		return PuzzleIndex{}, fmt.Errorf("glob puzzle files: %w", err)
	}

	entries := make([]IndexEntry, 0, len(paths))
	seenIDs := make(map[string]string, len(paths))

	for _, path := range paths {
		if filepath.Base(path) == "index.json" {
			continue
		}

		entry, err := readPuzzleEntry(path)
		if err != nil {
			return PuzzleIndex{}, err
		}
		if existingPath, exists := seenIDs[entry.ID]; exists {
			return PuzzleIndex{}, fmt.Errorf("%s: duplicate puzzle id %q also used by %s", path, entry.ID, existingPath)
		}
		seenIDs[entry.ID] = path
		entries = append(entries, entry)
	}

	sort.Slice(entries, func(i, j int) bool {
		if entries[i].GroupID != entries[j].GroupID {
			return entries[i].GroupID < entries[j].GroupID
		}
		if entries[i].Title != entries[j].Title {
			return entries[i].Title < entries[j].Title
		}
		return entries[i].ID < entries[j].ID
	})

	return PuzzleIndex{
		Version: IndexVersion,
		Registries: IndexRegistries{
			Sources:      []string{PlaceholderSource},
			Difficulties: []int{PlaceholderDifficulty},
			Groups: []IndexGroupCatalog{
				{
					ID:    PlaceholderGroupID,
					Title: PlaceholderGroupTitle,
				},
			},
		},
		Puzzles: entries,
	}, nil
}

func WriteIndexFile(puzzlesDir string) error {
	index, err := BuildIndex(puzzlesDir)
	if err != nil {
		return err
	}

	var buf bytes.Buffer
	encoder := json.NewEncoder(&buf)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(index); err != nil {
		return fmt.Errorf("marshal index: %w", err)
	}

	indexPath := filepath.Join(puzzlesDir, "index.json")
	if err := os.WriteFile(indexPath, buf.Bytes(), 0644); err != nil {
		return fmt.Errorf("write %s: %w", indexPath, err)
	}
	return nil
}

func readPuzzleEntry(path string) (IndexEntry, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return IndexEntry{}, fmt.Errorf("read %s: %w", path, err)
	}

	var puzzle puzzleFile
	if err := json.Unmarshal(data, &puzzle); err != nil {
		return IndexEntry{}, fmt.Errorf("parse %s: %w", path, err)
	}
	if _, err := core.LoadPuzzle(data); err != nil {
		return IndexEntry{}, fmt.Errorf("validate %s: %w", path, err)
	}

	if strings.TrimSpace(puzzle.ID) == "" {
		return IndexEntry{}, fmt.Errorf("%s: puzzle is missing id", path)
	}

	return IndexEntry{
		ID:         puzzle.ID,
		File:       filepath.Base(path),
		Title:      placeholderTitle(puzzle.ID),
		Source:     PlaceholderSource,
		Difficulty: PlaceholderDifficulty,
		GroupID:    PlaceholderGroupID,
		MinMoves:   puzzle.MinMoves,
	}, nil
}

func placeholderTitle(id string) string {
	parts := strings.FieldsFunc(id, func(r rune) bool {
		return r == '-' || r == '_'
	})
	if len(parts) == 0 {
		return "Untitled Puzzle"
	}
	for i, part := range parts {
		runes := []rune(strings.ToLower(part))
		if len(runes) == 0 {
			continue
		}
		runes[0] = []rune(strings.ToUpper(string(runes[0])))[0]
		parts[i] = string(runes)
	}
	return strings.Join(parts, " ")
}
