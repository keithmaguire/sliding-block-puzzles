package core

import "testing"

func TestBoardInBounds(t *testing.T) {
	b := Board{Width: 4, Height: 3}
	cases := []struct {
		cell Cell
		want bool
	}{
		{Cell{0, 0}, true},
		{Cell{3, 2}, true},
		{Cell{4, 0}, false},
		{Cell{0, 3}, false},
		{Cell{-1, 0}, false},
		{Cell{0, -1}, false},
	}
	for _, c := range cases {
		if got := b.InBounds(c.cell); got != c.want {
			t.Errorf("InBounds(%v) = %v, want %v", c.cell, got, c.want)
		}
	}
}

func TestParseDirection(t *testing.T) {
	for _, s := range []string{"up", "down", "left", "right"} {
		d, err := ParseDirection(s)
		if err != nil {
			t.Errorf("ParseDirection(%q) unexpected error: %v", s, err)
		}
		if string(d) != s {
			t.Errorf("ParseDirection(%q) = %q, want %q", s, d, s)
		}
	}
	if _, err := ParseDirection("diagonal"); err == nil {
		t.Error("ParseDirection(diagonal) should return error")
	}
}

func TestDirectionDelta(t *testing.T) {
	cases := []struct {
		dir    Direction
		dc, dr int
	}{
		{DirUp, 0, -1},
		{DirDown, 0, 1},
		{DirLeft, -1, 0},
		{DirRight, 1, 0},
	}
	for _, c := range cases {
		dc, dr := c.dir.Delta()
		if dc != c.dc || dr != c.dr {
			t.Errorf("%s.Delta() = (%d,%d), want (%d,%d)", c.dir, dc, dr, c.dc, c.dr)
		}
	}
}

func TestPositionConditionWithAppearanceCriteria(t *testing.T) {
	red := "#f00"
	blocks := map[string]*Block{
		"A": {ID: "A", Cells: []Cell{{2, 3}}, Appearance: Appearance{Type: AppearanceTypePlain, Color: red}},
		"B": {ID: "B", Cells: []Cell{{1, 3}}, Appearance: Appearance{Type: AppearanceTypePlain, Color: "#00f"}},
	}
	cond := &PositionCondition{Positions: []PositionTarget{{Match: PhysicalMatch{Appearance: &AppearanceCriteria{Color: &red}}, Col: 2, Row: 3}}}
	if !cond.Evaluate(Board{Width: 4, Height: 5}, blocks) {
		t.Error("PositionCondition should be satisfied")
	}
	blocks["A"].Cells[0] = Cell{1, 3}
	if cond.Evaluate(Board{Width: 4, Height: 5}, blocks) {
		t.Error("PositionCondition should not be satisfied after move")
	}
}

func TestPositionConditionWithMixedPhysicalMatching(t *testing.T) {
	red := "#f00"
	blocks := map[string]*Block{
		"A": {ID: "A", Cells: []Cell{{0, 0}}, Appearance: Appearance{Type: AppearanceTypePlain, Color: red}},
		"B": {ID: "B", Cells: []Cell{{2, 1}, {2, 2}, {3, 2}}, Appearance: Appearance{Type: AppearanceTypePlain, Color: "#00f"}},
	}
	cond := &PositionCondition{Positions: []PositionTarget{
		{Match: PhysicalMatch{Appearance: &AppearanceCriteria{Color: &red}}, Col: 0, Row: 0},
		{Match: PhysicalMatch{Shape: [][2]int{{0, 0}, {0, 1}, {1, 1}}}, Col: 2, Row: 1},
	}}
	if !cond.Evaluate(Board{Width: 5, Height: 5}, blocks) {
		t.Error("PositionCondition should be satisfied")
	}
	blocks["B"].Cells = []Cell{{3, 1}, {3, 2}, {4, 2}}
	if cond.Evaluate(Board{Width: 5, Height: 5}, blocks) {
		t.Error("PositionCondition should not be satisfied when one target is wrong")
	}
}

func TestPositionConditionWithShapeMatch(t *testing.T) {
	lShape := [][2]int{{0, 0}, {0, 1}, {1, 1}}
	blocks := map[string]*Block{
		"A": {ID: "A", Cells: []Cell{{2, 1}, {2, 2}, {3, 2}}, Movable: true},
		"B": {ID: "B", Cells: []Cell{{0, 0}, {0, 1}}, Movable: true},
	}

	cond := &PositionCondition{Positions: []PositionTarget{{Match: PhysicalMatch{Shape: lShape}, Col: 2, Row: 1}}}
	if !cond.Evaluate(Board{Width: 5, Height: 5}, blocks) {
		t.Error("shape match should match block A at (2,1)")
	}

	blocks["A"].Cells = []Cell{{0, 0}, {0, 1}, {1, 1}}
	if cond.Evaluate(Board{Width: 5, Height: 5}, blocks) {
		t.Error("shape match should not match when the block is at the wrong target position")
	}
}

func TestPositionConditionWithRepeatedAppearanceCriteria(t *testing.T) {
	textType := AppearanceTypeText
	value := "T"
	white := "white"
	match := PhysicalMatch{Appearance: &AppearanceCriteria{Type: &textType, Value: &value, TextColor: &white}}
	blocks := map[string]*Block{
		"T1": {ID: "T1", Cells: []Cell{{0, 0}}, Appearance: Appearance{Type: AppearanceTypeText, Value: "T", TextColor: "white"}},
		"T2": {ID: "T2", Cells: []Cell{{1, 0}}, Appearance: Appearance{Type: AppearanceTypeText, Value: "T", TextColor: "white"}},
	}
	cond := &PositionCondition{Positions: []PositionTarget{
		{Match: match, Col: 0, Row: 0},
		{Match: match, Col: 1, Row: 0},
	}}
	if !cond.Evaluate(Board{Width: 2, Height: 1}, blocks) {
		t.Error("multi-position should allow interchangeable repeated appearance-matched blocks")
	}

	delete(blocks, "T2")
	if cond.Evaluate(Board{Width: 2, Height: 1}, blocks) {
		t.Error("multi-position should fail when only one matching block is available")
	}
}

func TestAppearanceCriteriaMatchesCanonicalAppearance(t *testing.T) {
	textType := AppearanceTypeText
	value := "X"
	white := "white"
	criteria := &AppearanceCriteria{Type: &textType, Value: &value, TextColor: &white}
	if !criteria.Matches(Appearance{Type: AppearanceTypeText, Color: "#06b6d4", Value: "X", TextColor: "white"}) {
		t.Error("appearance criteria should match canonical text appearance")
	}
	if criteria.Matches(Appearance{Type: AppearanceTypeText, Color: "#06b6d4", Value: "X", TextColor: "black"}) {
		t.Error("appearance criteria should not match different text color")
	}
}

func TestNormaliseShape(t *testing.T) {
	a := normaliseShape([]Cell{{2, 1}, {2, 2}, {3, 2}})
	b := normaliseShape([]Cell{{0, 0}, {0, 1}, {1, 1}})
	if !shapesEqual(a, b) {
		t.Errorf("expected same normalised shape, got %v vs %v", a, b)
	}
	rotated := normaliseShape([]Cell{{0, 0}, {1, 0}, {0, 1}})
	if shapesEqual(a, rotated) {
		t.Error("rotated shape should not equal original")
	}
}
