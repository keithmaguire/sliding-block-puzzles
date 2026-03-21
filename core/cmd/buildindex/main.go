package main

import (
	"fmt"
	"os"

	"github.com/keithmaguire/sliding-puzzle/core/indexer"
)

func main() {
	puzzlesDir := "../puzzles"
	if len(os.Args) > 2 {
		fmt.Fprintln(os.Stderr, "usage: buildindex [puzzles-dir]")
		os.Exit(1)
	}
	if len(os.Args) == 2 {
		puzzlesDir = os.Args[1]
	}

	if err := indexer.WriteIndexFile(puzzlesDir); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
