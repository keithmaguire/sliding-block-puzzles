package core

import (
	"strings"
	"testing"
)

func minimalPuzzle(winCondition string) string {
	return `{
		"id": "test-001",
		"title": "Test Puzzle",
		"board": {"width": 4, "height": 4},
		"blocks": [
			{"id": "A", "cells": [[0,0],[1,0]], "movable": true, "appearance": {"type":"plain","color":"#ff0000"}},
			{"id": "B", "cells": [[0,1]], "movable": true, "appearance": {"type":"plain","color":"#0000ff"}}
		],
		"win_condition": ` + winCondition + `
	}`
}

func minimalPuzzleWithExtraFields(extraFields string, winCondition string) string {
	return `{
		"id": "test-001",
		"title": "Test Puzzle",
		` + extraFields + `,
		"board": {"width": 4, "height": 4},
		"blocks": [
			{"id": "A", "cells": [[0,0],[1,0]], "movable": true, "appearance": {"type":"plain","color":"#ff0000"}},
			{"id": "B", "cells": [[0,1]], "movable": true, "appearance": {"type":"plain","color":"#0000ff"}}
		],
		"win_condition": ` + winCondition + `
	}`
}

func mustLoad(t *testing.T, jsonStr string) *LoadResult {
	t.Helper()
	r, err := LoadPuzzle([]byte(jsonStr))
	if err != nil {
		t.Fatalf("LoadPuzzle failed: %v", err)
	}
	return r
}

func mustFail(t *testing.T, jsonStr string, wantSubstr string) {
	t.Helper()
	_, err := LoadPuzzle([]byte(jsonStr))
	if err == nil {
		t.Fatalf("LoadPuzzle should have failed but succeeded")
	}
	if !strings.Contains(err.Error(), wantSubstr) {
		t.Fatalf("error %q does not contain %q", err.Error(), wantSubstr)
	}
}

func TestLoadMinimalValid(t *testing.T) {
	r := mustLoad(t, minimalPuzzle(`{"type":"adjacency","positions":[{"match":{"appearance":{"color":"#ff0000"}},"col":0,"row":0},{"match":{"appearance":{"color":"#0000ff"}},"col":1,"row":0}]}`))
	if r.Meta.ID != "test-001" {
		t.Errorf("ID = %q, want test-001", r.Meta.ID)
	}
	if len(r.State.Blocks) != 2 {
		t.Errorf("block count = %d, want 2", len(r.State.Blocks))
	}
}

func TestLoadMeta(t *testing.T) {
	raw := `{
		"id": "h-042", "title": "The Bridge",
		"source": "Hornden p.87", "difficulty": 3, "min_moves": 18,
		"board": {"width": 3, "height": 3},
		"blocks": [{"id": "A", "cells": [[0,0]], "movable": true, "appearance": {"type":"plain","color":"#f00"}}],
		"win_condition": {"type":"position","positions":[{"match":{"appearance":{"color":"#f00"}},"col":2,"row":2}]}
	}`
	r := mustLoad(t, raw)
	if r.Meta.Source != "Hornden p.87" || r.Meta.MinMoves != 18 || r.Meta.Difficulty != 3 {
		t.Errorf("unexpected meta: %+v", r.Meta)
	}
}

func TestLoadMissingRequiredFields(t *testing.T) {
	mustFail(t, `{"title":"T","board":{"width":3,"height":3},"blocks":[],"win_condition":{"type":"position","positions":[{"match":{"appearance":{"color":"#f00"}},"col":0,"row":0}]}}`, "id")
	mustFail(t, `{"id":"x","title":"T","board":{"width":3,"height":3},"blocks":[]}`, "win_condition")
}

func TestLoadAllowsMissingTitle(t *testing.T) {
	r := mustLoad(t, `{
		"id": "x",
		"board": {"width": 3, "height": 3},
		"blocks": [{"id": "A", "cells": [[0,0]], "movable": true, "appearance": {"type":"plain","color":"#f00"}}],
		"win_condition": {"type":"position","positions":[{"match":{"appearance":{"color":"#f00"}},"col":0,"row":0}]}
	}`)
	if r.Meta.Title != "" {
		t.Fatalf("Meta.Title = %q, want empty string", r.Meta.Title)
	}
}

func TestLoadBoardAndBlockValidation(t *testing.T) {
	mustFail(t, `{"id":"x","title":"T","board":{"width":1,"height":3},"blocks":[],"win_condition":{"type":"position","positions":[{"match":{"appearance":{"color":"#f00"}},"col":0,"row":0}]}}`, "≥ 2")
	mustFail(t, `{
		"id":"x","title":"T","board":{"width":3,"height":3},
		"blocks":[{"id":"A","cells":[[3,0]],"movable":true,"appearance":{"type":"plain","color":"#f00"}}],
		"win_condition":{"type":"position","positions":[{"match":{"appearance":{"color":"#f00"}},"col":0,"row":0}]}
	}`, "outside board bounds")
	mustFail(t, `{
		"id":"x","title":"T","board":{"width":4,"height":4},
		"blocks":[
			{"id":"A","cells":[[0,0]],"movable":true,"appearance":{"type":"plain","color":"#f00"}},
			{"id":"A","cells":[[1,0]],"movable":true,"appearance":{"type":"plain","color":"#00f"}}
		],
		"win_condition":{"type":"position","positions":[{"match":{"appearance":{"color":"#f00"}},"col":0,"row":0}]}
	}`, "duplicate block id")
}

func TestLoadRejectsUnknownCanonicalFields(t *testing.T) {
	mustFail(t, minimalPuzzle(`{"type":"position","piece":"A","col":2,"row":3}`), "unknown field")
	mustFail(t, minimalPuzzle(`{"type":"position","positions":[{"piece":"A","col":1,"row":2}]}`), "unknown field")
	mustFail(t, minimalPuzzle(`{"type":"position","match":{"selector":"A"},"col":2,"row":3}`), "unknown field")
}

func TestLoadTextAndSVGAppearance(t *testing.T) {
	text := mustLoad(t, `{
		"id":"x","title":"T","board":{"width":3,"height":3},
		"blocks":[{"id":"A","cells":[[0,0]],"movable":true,"appearance":{"type":"text","color":"#f00","value":"R","text_color":"black"}}],
		"win_condition":{"type":"position","positions":[{"match":{"appearance":{"type":"text","value":"R","text_color":"black"}},"col":0,"row":0}]}
	}`)
	if text.State.Blocks["A"].Appearance.TextColor != "black" {
		t.Fatalf("expected black text color, got %+v", text.State.Blocks["A"].Appearance)
	}

	svg := mustLoad(t, `{
		"id":"x","title":"T","board":{"width":3,"height":3},
		"blocks":[{"id":"A","cells":[[0,0]],"movable":true,"appearance":{"type":"svg","color":"#f00","value":"<path d='M0 0'/>"}}],
		"win_condition":{"type":"position","positions":[{"match":{"appearance":{"type":"svg","value":"<path d='M0 0'/>"}},"col":0,"row":0}]}
	}`)
	if svg.State.Blocks["A"].Appearance.Type != AppearanceTypeSVG {
		t.Fatalf("expected svg appearance, got %+v", svg.State.Blocks["A"].Appearance)
	}
}

func TestLoadDefaultsTextAppearanceColorToWhite(t *testing.T) {
	r := mustLoad(t, `{
		"id":"x","title":"T","board":{"width":3,"height":3},
		"blocks":[{"id":"A","cells":[[0,0]],"movable":true,"appearance":{"type":"text","color":"#f00","value":"R"}}],
		"win_condition":{"type":"position","positions":[{"match":{"appearance":{"type":"text","value":"R"}},"col":0,"row":0}]}
	}`)
	if got := r.State.Blocks["A"].Appearance.TextColor; got != "white" {
		t.Fatalf("TextColor = %q, want white", got)
	}
}

func TestLoadBlockMovementConstraint(t *testing.T) {
	r := mustLoad(t, `{
		"id":"x","title":"T","board":{"width":3,"height":3},
		"blocks":[
			{"id":"A","cells":[[0,0]],"movable":true,"movement":"vertical","appearance":{"type":"plain","color":"#f00"}},
			{"id":"B","cells":[[1,0]],"movable":true,"appearance":{"type":"plain","color":"#00f"}}
		],
		"win_condition":{"type":"position","positions":[{"match":{"appearance":{"color":"#f00"}},"col":0,"row":0}]}
	}`)
	if got := r.State.Blocks["A"].Movement; got != "vertical" {
		t.Fatalf("Movement = %q, want vertical", got)
	}
	if got := r.State.Blocks["B"].Movement; got != "" {
		t.Fatalf("Movement = %q, want empty string when absent", got)
	}
}

func TestLoadRejectsInvalidBlockMovementConstraint(t *testing.T) {
	mustFail(t, `{
		"id":"x","title":"T","board":{"width":3,"height":3},
		"blocks":[{"id":"A","cells":[[0,0]],"movable":true,"movement":"diagonal","appearance":{"type":"plain","color":"#f00"}}],
		"win_condition":{"type":"position","positions":[{"match":{"appearance":{"color":"#f00"}},"col":0,"row":0}]}
	}`, `invalid movement`)
}

func TestLoadPositionWinWithAppearanceCriteria(t *testing.T) {
	r := mustLoad(t, minimalPuzzle(`{"type":"position","positions":[{"match":{"appearance":{"color":"#ff0000"}},"col":2,"row":3}]}`))
	cond, ok := r.State.Win.(*PositionCondition)
	if !ok {
		t.Fatalf("win condition type = %T, want *PositionCondition", r.State.Win)
	}
	if cond.Positions[0].Match.Appearance == nil || cond.Positions[0].Match.Appearance.Color == nil || *cond.Positions[0].Match.Appearance.Color != "#ff0000" {
		t.Fatalf("unexpected match: %#v", cond.Positions[0].Match)
	}
}

func TestLoadPositionWinWithShapeMatch(t *testing.T) {
	r := mustLoad(t, minimalPuzzle(`{"type":"position","positions":[{"match":{"shape":[[0,0],[1,0]]},"col":2,"row":2}]}`))
	cond, ok := r.State.Win.(*PositionCondition)
	if !ok {
		t.Fatalf("expected *PositionCondition, got %T", r.State.Win)
	}
	if len(cond.Positions[0].Match.Shape) != 2 {
		t.Fatalf("shape len = %d, want 2", len(cond.Positions[0].Match.Shape))
	}
}

func TestLoadPositionWinWithAppearanceAndShape(t *testing.T) {
	r := mustLoad(t, minimalPuzzle(`{"type":"position","positions":[{"match":{"appearance":{"color":"#ff0000"},"shape":[[0,0],[1,0]]},"col":2,"row":2}]}`))
	if _, ok := r.State.Win.(*PositionCondition); !ok {
		t.Fatalf("expected *PositionCondition, got %T", r.State.Win)
	}
}

func TestLoadMultiTargetPositionWin(t *testing.T) {
	r := mustLoad(t, minimalPuzzle(`{"type":"position","positions":[{"match":{"appearance":{"color":"#ff0000"}},"col":1,"row":2},{"match":{"appearance":{"color":"#0000ff"}},"col":3,"row":0}]}`))
	cond, ok := r.State.Win.(*PositionCondition)
	if !ok || len(cond.Positions) != 2 {
		t.Fatalf("unexpected position win: %#v", r.State.Win)
	}
}

func TestLoadRejectsEmptyAppearanceCriteria(t *testing.T) {
	mustFail(t, minimalPuzzle(`{"type":"position","positions":[{"match":{"appearance":{}},"col":0,"row":0}]}`), "at least one field")
}

func TestLoadRejectsInvalidAppearanceCriteria(t *testing.T) {
	mustFail(t, minimalPuzzle(`{"type":"position","positions":[{"match":{"appearance":{"type":"plain","value":"X"}},"col":0,"row":0}]}`), "plain match appearance")
	mustFail(t, minimalPuzzle(`{"type":"position","positions":[{"match":{"appearance":{"type":"text","text_color":"blue"}},"col":0,"row":0}]}`), "text_color")
}

func TestLoadRejectsMissingMatchFields(t *testing.T) {
	mustFail(t, minimalPuzzle(`{"type":"position","positions":[{"match":{},"col":0,"row":0}]}`), "appearance and/or shape")
}

func TestLoadAnyOfWinCondition(t *testing.T) {
	r := mustLoad(t, minimalPuzzle(`{
		"type":"any_of",
		"conditions":[
			{"type":"position","positions":[{"match":{"appearance":{"color":"#ff0000"}},"col":2,"row":3}]},
			{"type":"adjacency","positions":[{"match":{"appearance":{"color":"#ff0000"}},"col":0,"row":0},{"match":{"appearance":{"color":"#0000ff"}},"col":1,"row":0}]}
		]
	}`))
	cond, ok := r.State.Win.(*AnyOfCondition)
	if !ok || len(cond.Conditions) != 2 {
		t.Fatalf("unexpected any_of: %#v", r.State.Win)
	}
}

func TestLoadRejectsNestedAnyOfWinCondition(t *testing.T) {
	mustFail(t, minimalPuzzle(`{
		"type":"any_of",
		"conditions":[
			{"type":"any_of","conditions":[{"type":"position","positions":[{"match":{"appearance":{"color":"#ff0000"}},"col":1,"row":1}]}]}
		]
	}`), "nested any_of")
}

func TestLoadDescriptionOnlyRequiresWinDescription(t *testing.T) {
	mustFail(t, minimalPuzzle(`{"type":"description_only"}`), "requires win_description")
	r := mustLoad(t, minimalPuzzleWithExtraFields(`"win_description":"Decide for yourself when the arrangement is solved"`, `{"type":"description_only"}`))
	if _, ok := r.State.Win.(*DescriptionOnlyCondition); !ok {
		t.Fatalf("win condition type = %T, want *DescriptionOnlyCondition", r.State.Win)
	}
}
