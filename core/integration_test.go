package core

import (
	"encoding/json"
	"testing"
)

// integrationPuzzle — 4×4 board:
//
//	col:  0  1  2  3
//	row 0: .  .  .  .
//	row 1: .  .  B  .   B = blocker (movable, vertical)
//	row 2: A  A  B  .   A = car (movable, horizontal)
//	row 3: .  .  .  .
//
// Win: move A to the right edge target at row 2.
//
// Solution (3 moves):
//  1. B up  → B at {2,0},{2,1}   (clears {2,2})
//  2. A right → {1,2},{2,2}
//  3. A right → {2,2},{3,2}      (wins at edge target)
const integrationJSON = `{
  "id": "integ-001",
  "title": "Integration Test Puzzle",
  "source": "test",
  "difficulty": 1,
  "min_moves": 3,
  "board": {"width": 4, "height": 4},
  "blocks": [
    {"id": "A", "movable": true, "cells": [[0,2],[1,2]], "appearance": {"type":"plain","color":"#f00"}},
    {"id": "B", "movable": true, "cells": [[2,1],[2,2]], "appearance": {"type":"plain","color":"#00f"}}
  ],
  "win_condition": {"type": "position", "positions": [{"match": {"appearance":{"color":"#f00"}, "shape":[[0,0],[1,0]]}, "col": 2, "row": 2}]}
}`

func loadIntegrationPuzzle(t *testing.T) (*LoadResult, *GameState) {
	t.Helper()
	result, err := LoadPuzzle([]byte(integrationJSON))
	if err != nil {
		t.Fatalf("LoadPuzzle failed: %v", err)
	}
	return result, result.State
}

func TestIntegration_LoadMetadata(t *testing.T) {
	result, _ := loadIntegrationPuzzle(t)
	if result.Meta.ID != "integ-001" {
		t.Errorf("Meta.ID = %q, want %q", result.Meta.ID, "integ-001")
	}
	if result.Meta.MinMoves != 3 {
		t.Errorf("Meta.MinMoves = %d, want 3", result.Meta.MinMoves)
	}
	if result.Meta.Difficulty != 1 {
		t.Errorf("Meta.Difficulty = %d, want 1", result.Meta.Difficulty)
	}
}

func TestIntegration_InitialState(t *testing.T) {
	_, gs := loadIntegrationPuzzle(t)
	if gs.GetMoveCount() != 0 {
		t.Errorf("initial MoveCount = %d, want 0", gs.GetMoveCount())
	}
	if gs.CheckWin() {
		t.Error("puzzle should not be won at start")
	}
	if len(gs.Blocks) != 2 {
		t.Errorf("block count = %d, want 2", len(gs.Blocks))
	}
}

func TestIntegration_BlockedMove(t *testing.T) {
	_, gs := loadIntegrationPuzzle(t)
	// B is at {2,1},{2,2}. A is at {0,2},{1,2}.
	// Moving A right would place A's lead cell at {2,2} — occupied by B.
	if gs.CanMove("A", DirRight) {
		t.Error("A right should be blocked by B at {2,2}")
	}
	if gs.TryMove("A", DirRight) {
		t.Error("TryMove right should fail due to B blocking")
	}
	if gs.GetMoveCount() != 0 {
		t.Error("failed move must not increment MoveCount")
	}
}

func TestIntegration_PlayToWin(t *testing.T) {
	_, gs := loadIntegrationPuzzle(t)

	solution := []struct {
		block string
		dir   Direction
	}{
		{"B", DirUp},
		{"A", DirRight},
		{"A", DirRight},
	}

	for i, m := range solution {
		if !gs.TryMove(m.block, m.dir) {
			t.Fatalf("move %d: TryMove(%q, %s) returned false", i+1, m.block, m.dir)
		}
		if gs.GetMoveCount() != i+1 {
			t.Errorf("move %d: MoveCount = %d, want %d", i+1, gs.GetMoveCount(), i+1)
		}
	}

	if !gs.CheckWin() {
		t.Error("puzzle should be won after solution sequence")
	}
	snap := gs.GetState()
	if !snap.Won {
		t.Error("GetState.Won should be true after win")
	}
	if snap.MoveCount != 3 {
		t.Errorf("GetState.MoveCount = %d, want 3", snap.MoveCount)
	}
}

func TestIntegration_UndoFromWin(t *testing.T) {
	_, gs := loadIntegrationPuzzle(t)
	gs.TryMove("B", DirUp)
	gs.TryMove("A", DirRight)
	gs.TryMove("A", DirRight) // won

	if !gs.Undo() {
		t.Fatal("Undo should succeed")
	}
	if gs.CheckWin() {
		t.Error("should not be won after undo")
	}
	if gs.GetMoveCount() != 2 {
		t.Errorf("MoveCount after undo = %d, want 2", gs.GetMoveCount())
	}
}

func TestIntegration_Reset(t *testing.T) {
	_, gs := loadIntegrationPuzzle(t)
	gs.TryMove("B", DirUp)
	gs.TryMove("A", DirRight)
	gs.TryMove("A", DirRight)
	gs.Reset()

	if gs.GetMoveCount() != 0 {
		t.Errorf("MoveCount after Reset = %d, want 0", gs.GetMoveCount())
	}
	a := gs.Blocks["A"]
	if a.Cells[0] != (Cell{0, 2}) || a.Cells[1] != (Cell{1, 2}) {
		t.Errorf("A not restored after Reset: %v", a.Cells)
	}
	b := gs.Blocks["B"]
	if b.Cells[0] != (Cell{2, 1}) || b.Cells[1] != (Cell{2, 2}) {
		t.Errorf("B not restored after Reset: %v", b.Cells)
	}
	if gs.CheckWin() {
		t.Error("should not be won after Reset")
	}
	if gs.Undo() {
		t.Error("Undo after Reset should return false (history cleared)")
	}
}

func TestIntegration_RoundTripJSON(t *testing.T) {
	var pj puzzleJSON
	if err := json.Unmarshal([]byte(integrationJSON), &pj); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if pj.ID != "integ-001" || pj.Board.Width != 4 || pj.Board.Height != 4 {
		t.Errorf("unexpected parsed values: id=%q w=%d h=%d", pj.ID, pj.Board.Width, pj.Board.Height)
	}
	if len(pj.Blocks) != 2 {
		t.Errorf("block count = %d, want 2", len(pj.Blocks))
	}
}
