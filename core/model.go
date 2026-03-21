package core

import "fmt"

// Cell is a grid coordinate (col, row), zero-indexed from top-left.
type Cell struct {
	Col int
	Row int
}

// Board holds the dimensions of the puzzle grid.
type Board struct {
	Width  int
	Height int
}

// InBounds reports whether c lies within the board bounding box.
func (b Board) InBounds(c Cell) bool {
	return c.Col >= 0 && c.Row >= 0 && c.Col < b.Width && c.Row < b.Height
}

// AppearanceType distinguishes plain fills, text decorations, and SVG fragments.
type AppearanceType string

const (
	AppearanceTypePlain AppearanceType = "plain"
	AppearanceTypeText  AppearanceType = "text"
	AppearanceTypeSVG   AppearanceType = "svg"
)

// Appearance describes how a block is rendered and what value it exposes for matching.
type Appearance struct {
	Type      AppearanceType
	Color     string
	Value     string
	TextColor string
}

// Block is a named, shaped game piece on the board.
type Block struct {
	ID         string
	Cells      []Cell
	Movable    bool
	Appearance Appearance
}

// Direction represents one of the four cardinal slide directions.
type Direction string

const (
	DirUp    Direction = "up"
	DirDown  Direction = "down"
	DirLeft  Direction = "left"
	DirRight Direction = "right"
)

// Delta returns the (dCol, dRow) offset for a direction.
func (d Direction) Delta() (int, int) {
	switch d {
	case DirUp:
		return 0, -1
	case DirDown:
		return 0, 1
	case DirLeft:
		return -1, 0
	case DirRight:
		return 1, 0
	default:
		return 0, 0
	}
}

// ParseDirection converts a string to a Direction, returning an error if unknown.
func ParseDirection(s string) (Direction, error) {
	switch Direction(s) {
	case DirUp, DirDown, DirLeft, DirRight:
		return Direction(s), nil
	default:
		return "", fmt.Errorf("unknown direction %q: must be up, down, left, or right", s)
	}
}

// WinConditionType identifies which win evaluator to use.
type WinConditionType string

const (
	WinTypePosition        WinConditionType = "position"
	WinTypeAdjacency       WinConditionType = "adjacency"
	WinTypeAnyOf           WinConditionType = "any_of"
	WinTypeDescriptionOnly WinConditionType = "description_only"
)

// WinCondition is implemented by each concrete win condition type.
type WinCondition interface {
	Type() WinConditionType
	// Evaluate returns true when the current board state satisfies the condition.
	Evaluate(board Board, blocks map[string]*Block) bool
}

type AppearanceCriteria struct {
	Type      *AppearanceType
	Color     *string
	Value     *string
	TextColor *string
}

func (c *AppearanceCriteria) Matches(appearance Appearance) bool {
	if c == nil {
		return true
	}
	if c.Type != nil && appearance.Type != *c.Type {
		return false
	}
	if c.Color != nil && appearance.Color != *c.Color {
		return false
	}
	if c.Value != nil && appearance.Value != *c.Value {
		return false
	}
	if c.TextColor != nil && appearance.TextColor != *c.TextColor {
		return false
	}
	return true
}

type PhysicalMatch struct {
	Appearance *AppearanceCriteria
	Shape      [][2]int
}

func (m PhysicalMatch) Matches(block *Block) bool {
	if block == nil {
		return false
	}
	if m.Appearance != nil && !m.Appearance.Matches(block.Appearance) {
		return false
	}
	if len(m.Shape) > 0 && !shapesEqual(normaliseShape(block.Cells), m.Shape) {
		return false
	}
	return true
}

type PositionTarget struct {
	Match PhysicalMatch
	Col   int
	Row   int
}

// PositionCondition is satisfied when a one-to-one assignment exists between
// authored targets and blocks occupying those target positions.
type PositionCondition struct {
	Positions []PositionTarget
}

func (w *PositionCondition) Type() WinConditionType { return WinTypePosition }

func (w *PositionCondition) Evaluate(_ Board, blocks map[string]*Block) bool {
	candidates := make([][]string, len(w.Positions))
	for i, target := range w.Positions {
		for id, block := range blocks {
			if len(block.Cells) == 0 || !target.Match.Matches(block) {
				continue
			}
			if topLeft(block) == (Cell{Col: target.Col, Row: target.Row}) {
				candidates[i] = append(candidates[i], id)
			}
		}
		if len(candidates[i]) == 0 {
			return false
		}
	}

	used := make(map[string]bool, len(blocks))
	return assignTargets(candidates, used, 0)
}

// AdjacencyCondition is satisfied when an authored target arrangement appears
// anywhere on the board under a single translation.
type AdjacencyCondition struct {
	Positions []PositionTarget
}

func (w *AdjacencyCondition) Type() WinConditionType { return WinTypeAdjacency }

func (w *AdjacencyCondition) Evaluate(_ Board, blocks map[string]*Block) bool {
	if len(w.Positions) < 2 {
		return false
	}
	anchor := w.Positions[0]
	for _, block := range blocks {
		if len(block.Cells) == 0 || !anchor.Match.Matches(block) {
			continue
		}
		top := topLeft(block)
		dc := top.Col - anchor.Col
		dr := top.Row - anchor.Row

		candidates := make([][]string, len(w.Positions))
		for i, target := range w.Positions {
			expected := Cell{Col: target.Col + dc, Row: target.Row + dr}
			for id, candidate := range blocks {
				if len(candidate.Cells) == 0 || !target.Match.Matches(candidate) {
					continue
				}
				if topLeft(candidate) == expected {
					candidates[i] = append(candidates[i], id)
				}
			}
			if len(candidates[i]) == 0 {
				candidates = nil
				break
			}
		}
		if len(candidates) > 0 && assignTargets(candidates, make(map[string]bool, len(blocks)), 0) {
			return true
		}
	}
	return false
}

// normaliseShape translates cells so the minimum col and row are both 0, then
// sorts the result so shapes can be compared for equality.
func normaliseShape(cells []Cell) [][2]int {
	if len(cells) == 0 {
		return nil
	}
	minC, minR := cells[0].Col, cells[0].Row
	for _, c := range cells[1:] {
		if c.Col < minC {
			minC = c.Col
		}
		if c.Row < minR {
			minR = c.Row
		}
	}
	norm := make([][2]int, len(cells))
	for i, c := range cells {
		norm[i] = [2]int{c.Col - minC, c.Row - minR}
	}
	// Insertion sort is fine for the small cell counts typical in puzzles.
	for i := 1; i < len(norm); i++ {
		key := norm[i]
		j := i - 1
		for j >= 0 && (norm[j][1] > key[1] || (norm[j][1] == key[1] && norm[j][0] > key[0])) {
			norm[j+1] = norm[j]
			j--
		}
		norm[j+1] = key
	}
	return norm
}

func shapesEqual(a, b [][2]int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func topLeft(block *Block) Cell {
	if block == nil || len(block.Cells) == 0 {
		return Cell{}
	}
	minC, minR := block.Cells[0].Col, block.Cells[0].Row
	for _, c := range block.Cells[1:] {
		if c.Col < minC {
			minC = c.Col
		}
		if c.Row < minR {
			minR = c.Row
		}
	}
	return Cell{Col: minC, Row: minR}
}

func assignTargets(candidates [][]string, used map[string]bool, idx int) bool {
	if idx >= len(candidates) {
		return true
	}
	for _, blockID := range candidates[idx] {
		if used[blockID] {
			continue
		}
		used[blockID] = true
		if assignTargets(candidates, used, idx+1) {
			return true
		}
		delete(used, blockID)
	}
	return false
}

// AnyOfCondition is satisfied when at least one of its sub-conditions is satisfied.
type AnyOfCondition struct {
	Conditions []WinCondition
}

func (w *AnyOfCondition) Type() WinConditionType { return WinTypeAnyOf }

func (w *AnyOfCondition) Evaluate(board Board, blocks map[string]*Block) bool {
	for _, c := range w.Conditions {
		if c.Evaluate(board, blocks) {
			return true
		}
	}
	return false
}

// DescriptionOnlyCondition never auto-evaluates to true.
// The player declares victory manually via the UI.
type DescriptionOnlyCondition struct{}

func (w *DescriptionOnlyCondition) Type() WinConditionType { return WinTypeDescriptionOnly }

func (w *DescriptionOnlyCondition) Evaluate(_ Board, _ map[string]*Block) bool { return false }

// CheckWin reports whether the current board state satisfies the puzzle's win condition.
func (gs *GameState) CheckWin() bool {
	if gs.Win == nil {
		return false
	}
	return gs.Win.Evaluate(gs.Board, gs.Blocks)
}

// snapshot captures the position of every block for undo purposes.
type snapshot map[string][]Cell

// GameState is the full mutable state of a puzzle in play.
type GameState struct {
	Board     Board
	Blocks    map[string]*Block
	Win       WinCondition
	MoveCount int
	history   []snapshot // stack of pre-move snapshots for undo
	initial   snapshot   // positions at load time for reset
}
