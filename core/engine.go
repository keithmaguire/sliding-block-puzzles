package core

import "fmt"

// CanMove reports whether blockID can legally move one step in dir.
// A move is legal when the block exists, is movable by the player, and every
// destination cell is in-bounds and unoccupied by another block.
func (gs *GameState) CanMove(blockID string, dir Direction) bool {
	b, ok := gs.Blocks[blockID]
	if !ok || !b.Movable {
		return false
	}
	dc, dr := dir.Delta()

	// Build occupied set from all other blocks.
	occupied := make(map[[2]int]bool)
	for id, blk := range gs.Blocks {
		if id == blockID {
			continue
		}
		for _, c := range blk.Cells {
			occupied[[2]int{c.Col, c.Row}] = true
		}
	}

	for _, c := range b.Cells {
		nc := Cell{Col: c.Col + dc, Row: c.Row + dr}
		if !gs.Board.InBounds(nc) {
			return false
		}
		if occupied[[2]int{nc.Col, nc.Row}] {
			return false
		}
	}
	return true
}

// TryMove attempts to move blockID one step in dir.
// Returns true and records the move if legal; returns false and leaves state
// unchanged if illegal.
func (gs *GameState) TryMove(blockID string, dir Direction) bool {
	if !gs.CanMove(blockID, dir) {
		return false
	}

	// Save a pre-move snapshot for undo.
	snap := make(snapshot, len(gs.Blocks))
	for id, blk := range gs.Blocks {
		cells := make([]Cell, len(blk.Cells))
		copy(cells, blk.Cells)
		snap[id] = cells
	}
	gs.history = append(gs.history, snap)

	dc, dr := dir.Delta()
	b := gs.Blocks[blockID]
	for i := range b.Cells {
		b.Cells[i].Col += dc
		b.Cells[i].Row += dr
	}
	gs.MoveCount++
	return true
}

// Undo reverts the last move. Returns false if there is nothing to undo.
func (gs *GameState) Undo() bool {
	if len(gs.history) == 0 {
		return false
	}
	snap := gs.history[len(gs.history)-1]
	gs.history = gs.history[:len(gs.history)-1]

	for id, cells := range snap {
		if blk, ok := gs.Blocks[id]; ok {
			blk.Cells = make([]Cell, len(cells))
			copy(blk.Cells, cells)
		}
	}
	gs.MoveCount--
	return true
}

// Reset restores the puzzle to its initial loaded state and clears history.
func (gs *GameState) Reset() {
	gs.history = gs.history[:0]
	gs.MoveCount = 0
	for id, cells := range gs.initial {
		if blk, ok := gs.Blocks[id]; ok {
			blk.Cells = make([]Cell, len(cells))
			copy(blk.Cells, cells)
		}
	}
}

// RestoreState replaces the current board positions with a previously saved
// snapshot and resets undo history. Reset still returns to the original loaded
// puzzle state because gs.initial is left untouched.
func (gs *GameState) RestoreState(blocks map[string][]Cell, moveCount int) error {
	if moveCount < 0 {
		return fmt.Errorf("move count cannot be negative")
	}
	if len(blocks) != len(gs.Blocks) {
		return fmt.Errorf("restore state block count mismatch")
	}

	occupied := make(map[[2]int]string, len(blocks))
	for id, blk := range gs.Blocks {
		cells, ok := blocks[id]
		if !ok {
			return fmt.Errorf("restore state missing block %q", id)
		}
		if len(cells) != len(blk.Cells) {
			return fmt.Errorf("restore state cell count mismatch for block %q", id)
		}
		for _, c := range cells {
			if !gs.Board.InBounds(c) {
				return fmt.Errorf("restore state placed block %q out of bounds", id)
			}
			key := [2]int{c.Col, c.Row}
			if other, seen := occupied[key]; seen {
				return fmt.Errorf("restore state overlaps blocks %q and %q", other, id)
			}
			occupied[key] = id
		}
	}

	for id, cells := range blocks {
		blk := gs.Blocks[id]
		blk.Cells = make([]Cell, len(cells))
		copy(blk.Cells, cells)
	}
	gs.history = gs.history[:0]
	gs.MoveCount = moveCount
	return nil
}

// GetMoveCount returns the number of moves made since load or last Reset.
func (gs *GameState) GetMoveCount() int {
	return gs.MoveCount
}

// StateSnapshot is a point-in-time view of the game state.
type StateSnapshot struct {
	Blocks    map[string][]Cell
	MoveCount int
	Won       bool
}

// GetState returns a deep copy of the current game state.
func (gs *GameState) GetState() StateSnapshot {
	blocks := make(map[string][]Cell, len(gs.Blocks))
	for id, blk := range gs.Blocks {
		cells := make([]Cell, len(blk.Cells))
		copy(cells, blk.Cells)
		blocks[id] = cells
	}
	return StateSnapshot{
		Blocks:    blocks,
		MoveCount: gs.MoveCount,
		Won:       gs.CheckWin(),
	}
}
