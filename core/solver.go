package core

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

// Solve returns the minimum number of moves required to solve the puzzle
// starting from gs's current state, using breadth-first search.
//
// It returns -1 if the puzzle cannot be solved within the time limit.
// Pass timeout = 0 to use the default of 5 seconds.
func Solve(gs *GameState, timeout time.Duration) int {
	if timeout <= 0 {
		timeout = 5 * time.Second
	}
	deadline := time.Now().Add(timeout)

	// Fast path: already solved.
	if gs.CheckWin() {
		return 0
	}

	dirs := []Direction{DirUp, DirDown, DirLeft, DirRight}

	type node struct {
		state *GameState
		moves int
	}

	start := cloneGameState(gs)
	queue := []node{{start, 0}}
	seen := map[string]bool{stateKey(start): true}

	for len(queue) > 0 {
		if time.Now().After(deadline) {
			return -1
		}
		cur := queue[0]
		queue = queue[1:]

		for id := range cur.state.Blocks {
			for _, d := range dirs {
				next := cloneGameState(cur.state)
				if !next.TryMove(id, d) {
					continue
				}
				if next.CheckWin() {
					return cur.moves + 1
				}
				k := stateKey(next)
				if !seen[k] {
					seen[k] = true
					queue = append(queue, node{next, cur.moves + 1})
				}
			}
		}
	}
	return -1
}

// stateKey serialises the positions of all blocks into a canonical string
// suitable for use as a map key.
func stateKey(gs *GameState) string {
	ids := make([]string, 0, len(gs.Blocks))
	for id := range gs.Blocks {
		ids = append(ids, id)
	}
	sort.Strings(ids)

	var sb strings.Builder
	for _, id := range ids {
		sb.WriteString(id)
		sb.WriteByte(':')
		for _, c := range gs.Blocks[id].Cells {
			fmt.Fprintf(&sb, "%d,%d;", c.Col, c.Row)
		}
		sb.WriteByte('|')
	}
	return sb.String()
}

// cloneGameState returns a deep copy of gs suitable for independent simulation.
func cloneGameState(gs *GameState) *GameState {
	blocks := make(map[string]*Block, len(gs.Blocks))
	initial := make(snapshot, len(gs.Blocks))
	for id, b := range gs.Blocks {
		cells := make([]Cell, len(b.Cells))
		copy(cells, b.Cells)
		initCells := make([]Cell, len(b.Cells))
		copy(initCells, b.Cells)
		blocks[id] = &Block{
			ID:         b.ID,
			Movable:    b.Movable,
			Appearance: b.Appearance,
			Cells:      cells,
		}
		initial[id] = initCells
	}
	return &GameState{
		Board:   gs.Board,
		Blocks:  blocks,
		Win:     gs.Win,
		initial: initial,
	}
}
