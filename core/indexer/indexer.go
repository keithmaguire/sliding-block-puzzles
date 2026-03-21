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
	Version int           `json:"version"`
	Groups  []PuzzleGroup `json:"groups"`
}

type PuzzleGroup struct {
	ID    string       `json:"id"`
	Title string       `json:"title"`
	Items []IndexEntry `json:"items"`
}

type IndexEntry struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	File       string `json:"file"`
	Source     string `json:"source,omitempty"`
	Difficulty *int   `json:"difficulty,omitempty"`
	MinMoves   *int   `json:"min_moves,omitempty"`
}

type puzzleFile struct {
	ID         string         `json:"id"`
	Title      string         `json:"title"`
	Source     string         `json:"source,omitempty"`
	Difficulty *int           `json:"difficulty,omitempty"`
	MinMoves   *int           `json:"min_moves,omitempty"`
	Catalog    *catalogConfig `json:"catalog"`
}

type catalogConfig struct {
	Group catalogGroup `json:"group"`
	Order *int         `json:"order,omitempty"`
}

type catalogGroup struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Order *int   `json:"order,omitempty"`
}

type groupedEntry struct {
	groupID    string
	groupTitle string
	groupOrder int
	itemOrder  int
	entry      IndexEntry
}

func BuildIndex(puzzlesDir string) (PuzzleIndex, error) {
	pattern := filepath.Join(puzzlesDir, "*.json")
	paths, err := filepath.Glob(pattern)
	if err != nil {
		return PuzzleIndex{}, fmt.Errorf("glob puzzle files: %w", err)
	}

	grouped := map[string][]groupedEntry{}
	groupMeta := map[string]catalogGroup{}

	for _, path := range paths {
		if filepath.Base(path) == "index.json" {
			continue
		}

		entry, err := readPuzzleEntry(path)
		if err != nil {
			return PuzzleIndex{}, err
		}

		grouped[entry.groupID] = append(grouped[entry.groupID], entry)
		if existing, ok := groupMeta[entry.groupID]; ok {
			if existing.Title != entry.groupTitle {
				return PuzzleIndex{}, fmt.Errorf("%s: catalog.group.title mismatch for group %q", path, entry.groupID)
			}
			continue
		}
		groupMeta[entry.groupID] = catalogGroup{
			ID:    entry.groupID,
			Title: entry.groupTitle,
			Order: intPtr(entry.groupOrder),
		}
	}

	groupIDs := make([]string, 0, len(grouped))
	for groupID := range grouped {
		groupIDs = append(groupIDs, groupID)
	}
	sort.Slice(groupIDs, func(i, j int) bool {
		gi := groupMeta[groupIDs[i]]
		gj := groupMeta[groupIDs[j]]
		if derefInt(gi.Order) != derefInt(gj.Order) {
			return derefInt(gi.Order) < derefInt(gj.Order)
		}
		if gi.Title != gj.Title {
			return gi.Title < gj.Title
		}
		return gi.ID < gj.ID
	})

	groups := make([]PuzzleGroup, 0, len(groupIDs))
	for _, groupID := range groupIDs {
		items := grouped[groupID]
		sort.Slice(items, func(i, j int) bool {
			if items[i].itemOrder != items[j].itemOrder {
				return items[i].itemOrder < items[j].itemOrder
			}
			if items[i].entry.Title != items[j].entry.Title {
				return items[i].entry.Title < items[j].entry.Title
			}
			return items[i].entry.ID < items[j].entry.ID
		})

		leafs := make([]IndexEntry, 0, len(items))
		for _, item := range items {
			leafs = append(leafs, item.entry)
		}

		meta := groupMeta[groupID]
		groups = append(groups, PuzzleGroup{
			ID:    meta.ID,
			Title: meta.Title,
			Items: leafs,
		})
	}

	return PuzzleIndex{
		Version: 2,
		Groups:  groups,
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

func readPuzzleEntry(path string) (groupedEntry, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return groupedEntry{}, fmt.Errorf("read %s: %w", path, err)
	}

	var puzzle puzzleFile
	if err := json.Unmarshal(data, &puzzle); err != nil {
		return groupedEntry{}, fmt.Errorf("parse %s: %w", path, err)
	}
	if _, err := core.LoadPuzzle(data); err != nil {
		return groupedEntry{}, fmt.Errorf("validate %s: %w", path, err)
	}

	if strings.TrimSpace(puzzle.ID) == "" {
		return groupedEntry{}, fmt.Errorf("%s: puzzle is missing id", path)
	}
	if strings.TrimSpace(puzzle.Title) == "" {
		return groupedEntry{}, fmt.Errorf("%s: puzzle %q is missing title", path, puzzle.ID)
	}
	if puzzle.Catalog == nil {
		return groupedEntry{}, fmt.Errorf("%s: puzzle %q is missing catalog metadata", path, puzzle.ID)
	}
	if strings.TrimSpace(puzzle.Catalog.Group.ID) == "" {
		return groupedEntry{}, fmt.Errorf("%s: puzzle %q is missing catalog.group.id", path, puzzle.ID)
	}
	if strings.TrimSpace(puzzle.Catalog.Group.Title) == "" {
		return groupedEntry{}, fmt.Errorf("%s: puzzle %q is missing catalog.group.title", path, puzzle.ID)
	}

	return groupedEntry{
		groupID:    puzzle.Catalog.Group.ID,
		groupTitle: puzzle.Catalog.Group.Title,
		groupOrder: derefInt(puzzle.Catalog.Group.Order),
		itemOrder:  derefInt(puzzle.Catalog.Order),
		entry: IndexEntry{
			ID:         puzzle.ID,
			Title:      puzzle.Title,
			File:       filepath.Base(path),
			Source:     puzzle.Source,
			Difficulty: puzzle.Difficulty,
			MinMoves:   puzzle.MinMoves,
		},
	}, nil
}

func derefInt(v *int) int {
	if v == nil {
		return 0
	}
	return *v
}

func intPtr(v int) *int {
	return &v
}
