package core

import (
	"testing"
	"time"
)

func TestSolveHonorsMovementConstraintsInClonedStates(t *testing.T) {
	color := "#f00"
	gs := newTestState(2, 3, map[string]*Block{
		"A": {
			ID:       "A",
			Movable:  true,
			Movement: "horizontal",
			Cells:    []Cell{{0, 0}},
			Appearance: Appearance{
				Type:  AppearanceTypePlain,
				Color: color,
			},
		},
	}, &PositionCondition{
		Positions: []PositionTarget{{
			Match: PhysicalMatch{
				Appearance: &AppearanceCriteria{Color: &color},
			},
			Col: 0,
			Row: 2,
		}},
	})

	if got := Solve(gs, 100*time.Millisecond); got != -1 {
		t.Fatalf("Solve() = %d, want -1; horizontal block must not solve by moving down in cloned states", got)
	}
}
