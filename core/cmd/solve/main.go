// solve computes the minimum move count for one or more puzzle JSON files
// using BFS and prints the results.
//
// Usage:
//
//	go run ./cmd/solve path/to/puzzle.json [...]
//	go run ./cmd/solve -timeout 60s path/to/puzzles/*.json
//	go run ./cmd/solve -skip-solved path/to/puzzles/*.json
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/keithmaguire/sliding-puzzle/core"
)

func main() {
	timeout := flag.Duration("timeout", 5*time.Second, "BFS time limit per puzzle (e.g. 30s, 2m)")
	skipSolved := flag.Bool("skip-solved", false, "skip puzzles that already have min_moves set")
	flag.Parse()

	args := flag.Args()
	if len(args) < 1 {
		fmt.Fprintln(os.Stderr, "usage: solve [-timeout D] [-skip-solved] <puzzle.json> [...]")
		os.Exit(1)
	}

	ok := true
	for _, path := range args {
		if filepath.Base(path) == "index.json" {
			continue
		}
		if err := solveFile(path, *timeout, *skipSolved); err != nil {
			fmt.Fprintf(os.Stderr, "%s: %v\n", path, err)
			ok = false
		}
	}
	if !ok {
		os.Exit(1)
	}
}

func solveFile(path string, timeout time.Duration, skipSolved bool) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	result, err := core.LoadPuzzle(data)
	if err != nil {
		return fmt.Errorf("load: %w", err)
	}

	if skipSolved && result.Meta.MinMoves > 0 {
		fmt.Printf("%-40s  id=%-30s  min_moves=%-4d  (skipped — already set)\n",
			path, result.Meta.ID, result.Meta.MinMoves)
		return nil
	}

	start := time.Now()
	minMoves := core.Solve(result.State, timeout)
	elapsed := time.Since(start)

	if minMoves < 0 {
		fmt.Printf("%-40s  id=%-30s  min_moves=? (search limit exceeded in %s)\n",
			path, result.Meta.ID, elapsed.Round(time.Millisecond))
	} else {
		stored := result.Meta.MinMoves
		flag := ""
		if stored != 0 && stored != minMoves {
			flag = fmt.Sprintf("  [stored=%d MISMATCH]", stored)
		}
		fmt.Printf("%-40s  id=%-30s  min_moves=%-4d  (%s)%s\n",
			path, result.Meta.ID, minMoves, elapsed.Round(time.Millisecond), flag)
	}

	return writeMinMoves(path, data, minMoves)
}

// writeMinMoves rewrites the puzzle JSON file with the computed min_moves value.
// If minMoves < 0 (unsolvable within limit) the file is left unchanged.
func writeMinMoves(path string, original []byte, minMoves int) error {
	if minMoves < 0 {
		return nil
	}

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(original, &raw); err != nil {
		return fmt.Errorf("re-parse: %w", err)
	}

	val, err := json.Marshal(minMoves)
	if err != nil {
		return err
	}
	raw["min_moves"] = val

	out, err := json.MarshalIndent(raw, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}
	out = append(out, '\n')
	return os.WriteFile(path, out, 0644)
}
