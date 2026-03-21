package core

import "testing"

// newTestState builds a minimal GameState for engine tests without going
// through LoadPuzzle (avoids JSON coupling).
func newTestState(width, height int, blocks map[string]*Block, win WinCondition) *GameState {
	initial := make(snapshot, len(blocks))
	for id, b := range blocks {
		cells := make([]Cell, len(b.Cells))
		copy(cells, b.Cells)
		initial[id] = cells
	}
	return &GameState{
		Board:   Board{Width: width, Height: height},
		Blocks:  blocks,
		Win:     win,
		initial: initial,
	}
}

func TestCanMove_NormalBlock(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{1, 1}}},
	}, nil)
	if !gs.CanMove("A", DirRight) {
		t.Error("should be able to move into empty space")
	}
	if !gs.CanMove("A", DirLeft) {
		t.Error("should be able to move left into empty space")
	}
}

func TestCanMove_FixedBlock(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: false, Cells: []Cell{{1, 1}}},
	}, nil)
	if gs.CanMove("A", DirRight) {
		t.Error("fixed block must not move")
	}
}

func TestCanMove_FixedBlockByFlag(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"V": {ID: "V", Movable: false, Cells: []Cell{{0, 0}}},
	}, nil)
	if gs.CanMove("V", DirRight) {
		t.Error("fixed block must not be movable by player")
	}
}

func TestCanMove_BlockedByOther(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{1, 1}}},
		"B": {ID: "B", Movable: true, Cells: []Cell{{2, 1}}},
	}, nil)
	if gs.CanMove("A", DirRight) {
		t.Error("A is blocked by B to the right")
	}
	if !gs.CanMove("A", DirLeft) {
		t.Error("A should be able to move left")
	}
}

func TestCanMove_BoardEdge(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{0, 0}}},
	}, nil)
	if gs.CanMove("A", DirLeft) {
		t.Error("should not be able to move off the left edge")
	}
	if gs.CanMove("A", DirUp) {
		t.Error("should not be able to move off the top edge")
	}
}

func TestCanMove_UnknownBlock(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{}, nil)
	if gs.CanMove("X", DirRight) {
		t.Error("unknown block ID should return false")
	}
}

func TestTryMove_Success(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{1, 1}}},
	}, nil)
	if !gs.TryMove("A", DirRight) {
		t.Fatal("TryMove should succeed")
	}
	if gs.Blocks["A"].Cells[0] != (Cell{2, 1}) {
		t.Errorf("block moved to wrong position: %v", gs.Blocks["A"].Cells[0])
	}
	if gs.MoveCount != 1 {
		t.Errorf("MoveCount = %d, want 1", gs.MoveCount)
	}
}

func TestTryMove_Fail(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{1, 1}}},
		"B": {ID: "B", Movable: true, Cells: []Cell{{2, 1}}},
	}, nil)
	if gs.TryMove("A", DirRight) {
		t.Error("TryMove should fail when blocked")
	}
	if gs.MoveCount != 0 {
		t.Errorf("MoveCount should still be 0, got %d", gs.MoveCount)
	}
}

func TestUndo(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{1, 1}}},
	}, nil)
	gs.TryMove("A", DirRight)
	gs.TryMove("A", DirDown)
	if gs.MoveCount != 2 {
		t.Fatalf("expected 2 moves, got %d", gs.MoveCount)
	}

	if !gs.Undo() {
		t.Error("Undo should succeed")
	}
	if gs.Blocks["A"].Cells[0] != (Cell{2, 1}) {
		t.Errorf("after first undo: %v, want {2,1}", gs.Blocks["A"].Cells[0])
	}
	if gs.MoveCount != 1 {
		t.Errorf("MoveCount = %d, want 1", gs.MoveCount)
	}

	gs.Undo()
	if gs.Blocks["A"].Cells[0] != (Cell{1, 1}) {
		t.Errorf("after second undo: %v, want {1,1}", gs.Blocks["A"].Cells[0])
	}
	if gs.MoveCount != 0 {
		t.Errorf("MoveCount = %d, want 0", gs.MoveCount)
	}
}

func TestUndo_EmptyHistory(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{}, nil)
	if gs.Undo() {
		t.Error("Undo on empty history should return false")
	}
}

func TestReset(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{1, 1}}},
	}, nil)
	gs.TryMove("A", DirRight)
	gs.TryMove("A", DirRight)
	gs.Reset()

	if gs.Blocks["A"].Cells[0] != (Cell{1, 1}) {
		t.Errorf("after Reset: %v, want {1,1}", gs.Blocks["A"].Cells[0])
	}
	if gs.MoveCount != 0 {
		t.Errorf("MoveCount after Reset = %d, want 0", gs.MoveCount)
	}
	if gs.Undo() {
		t.Error("Undo after Reset should return false (history cleared)")
	}
}

func TestRestoreState(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{1, 1}}},
		"B": {ID: "B", Movable: false, Cells: []Cell{{3, 3}}},
	}, nil)
	gs.TryMove("A", DirRight)

	err := gs.RestoreState(map[string][]Cell{
		"A": {{Col: 2, Row: 2}},
		"B": {{Col: 0, Row: 0}},
	}, 7)
	if err != nil {
		t.Fatalf("RestoreState returned error: %v", err)
	}
	if gs.Blocks["A"].Cells[0] != (Cell{2, 2}) {
		t.Errorf("A after restore = %v, want {2,2}", gs.Blocks["A"].Cells[0])
	}
	if gs.Blocks["B"].Cells[0] != (Cell{0, 0}) {
		t.Errorf("B after restore = %v, want {0,0}", gs.Blocks["B"].Cells[0])
	}
	if gs.MoveCount != 7 {
		t.Errorf("MoveCount after restore = %d, want 7", gs.MoveCount)
	}
	if gs.Undo() {
		t.Error("Undo after RestoreState should return false (history cleared)")
	}
	gs.Reset()
	if gs.Blocks["A"].Cells[0] != (Cell{1, 1}) {
		t.Errorf("A after reset = %v, want original start {1,1}", gs.Blocks["A"].Cells[0])
	}
}

func TestRestoreStateRejectsInvalidSnapshots(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{1, 1}}},
		"B": {ID: "B", Movable: false, Cells: []Cell{{3, 3}}},
	}, nil)

	if err := gs.RestoreState(map[string][]Cell{
		"A": {{Col: 0, Row: 0}},
	}, 1); err == nil {
		t.Fatal("RestoreState should reject missing blocks")
	}
	if err := gs.RestoreState(map[string][]Cell{
		"A": {{Col: 0, Row: 0}},
		"B": {{Col: 0, Row: 0}},
	}, 1); err == nil {
		t.Fatal("RestoreState should reject overlapping blocks")
	}
	if err := gs.RestoreState(map[string][]Cell{
		"A": {{Col: 4, Row: 0}},
		"B": {{Col: 3, Row: 3}},
	}, 1); err == nil {
		t.Fatal("RestoreState should reject out-of-bounds cells")
	}
	if err := gs.RestoreState(map[string][]Cell{
		"A": {{Col: 0, Row: 0}},
		"B": {{Col: 3, Row: 3}},
	}, -1); err == nil {
		t.Fatal("RestoreState should reject negative move counts")
	}
}

func TestGetMoveCount(t *testing.T) {
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{0, 0}}},
	}, nil)
	gs.TryMove("A", DirRight)
	gs.TryMove("A", DirRight)
	if gs.GetMoveCount() != 2 {
		t.Errorf("GetMoveCount = %d, want 2", gs.GetMoveCount())
	}
}

func TestGetState(t *testing.T) {
	color := "#f00"
	win := &PositionCondition{Positions: []PositionTarget{{Match: PhysicalMatch{Appearance: &AppearanceCriteria{Color: &color}}, Col: 2, Row: 1}}}
	gs := newTestState(4, 4, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{1, 1}}, Appearance: Appearance{Type: AppearanceTypePlain, Color: color}},
	}, win)
	gs.TryMove("A", DirRight)

	snap := gs.GetState()
	if snap.MoveCount != 1 {
		t.Errorf("snapshot MoveCount = %d, want 1", snap.MoveCount)
	}
	if !snap.Won {
		t.Error("should report Won after moving to win position")
	}
	// Mutating snapshot must not affect game state.
	snap.Blocks["A"][0] = Cell{0, 0}
	if gs.Blocks["A"].Cells[0] != (Cell{2, 1}) {
		t.Error("mutating StateSnapshot.Blocks affected live GameState")
	}
}

func TestEdgePositionWin(t *testing.T) {
	// Block wins by reaching the right edge inside the board.
	color := "#f00"
	win := &PositionCondition{Positions: []PositionTarget{{Match: PhysicalMatch{Appearance: &AppearanceCriteria{Color: &color}}, Col: 2, Row: 0}}}
	gs := newTestState(3, 3, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{1, 0}}, Appearance: Appearance{Type: AppearanceTypePlain, Color: color}},
	}, win)

	if !gs.CanMove("A", DirRight) {
		t.Error("block should be able to move to the edge target")
	}
	gs.TryMove("A", DirRight)
	if gs.CheckWin() != true {
		t.Error("should win after reaching the edge target")
	}
}

func TestMultiCellBlockMove(t *testing.T) {
	// Horizontal 2-cell block moves right.
	gs := newTestState(5, 3, map[string]*Block{
		"A": {ID: "A", Movable: true, Cells: []Cell{{1, 1}, {2, 1}}},
	}, nil)
	if !gs.TryMove("A", DirRight) {
		t.Fatal("multi-cell block should move right")
	}
	if gs.Blocks["A"].Cells[0] != (Cell{2, 1}) || gs.Blocks["A"].Cells[1] != (Cell{3, 1}) {
		t.Errorf("wrong positions after move: %v", gs.Blocks["A"].Cells)
	}
}
