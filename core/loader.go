package core

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
)

// puzzleJSON is the top-level JSON structure of a puzzle file.
type puzzleJSON struct {
	ID             string          `json:"id"`
	Title          string          `json:"title"`
	Source         string          `json:"source"`
	Difficulty     int             `json:"difficulty"`
	MinMoves       int             `json:"min_moves"`
	WinDescription string          `json:"win_description"`
	SetupOptions   json.RawMessage `json:"setup_options"`
	Board          boardJSON       `json:"board"`
	Blocks         []blockJSON     `json:"blocks"`
	WinCondition   json.RawMessage `json:"win_condition"`
}

type boardJSON struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type blockJSON struct {
	ID         string          `json:"id"`
	Cells      [][2]int        `json:"cells"`
	Movable    bool            `json:"movable"`
	Appearance *appearanceJSON `json:"appearance"`
}

type appearanceJSON struct {
	Type      string `json:"type"`
	Color     string `json:"color"`
	Value     string `json:"value"`
	TextColor string `json:"text_color"`
}

// winTypeProbe extracts just the type discriminator from a win_condition object.
type winTypeProbe struct {
	Type string `json:"type"`
}

// winPositionJSON is the JSON shape for type "position".
type winPositionJSON struct {
	Type      string `json:"type"`
	Positions []struct {
		Match json.RawMessage `json:"match"`
		Col   int             `json:"col"`
		Row   int             `json:"row"`
	} `json:"positions"`
}

// winAdjacencyJSON is the JSON shape for type "adjacency".
type winAdjacencyJSON struct {
	Type      string `json:"type"`
	Positions []struct {
		Match json.RawMessage `json:"match"`
		Col   int             `json:"col"`
		Row   int             `json:"row"`
	} `json:"positions"`
}

// PuzzleMeta holds the non-gameplay metadata from a puzzle file.
type PuzzleMeta struct {
	ID         string
	Title      string
	Source     string
	Difficulty int
	MinMoves   int // 0 means not set
}

// LoadResult is returned by LoadPuzzle.
type LoadResult struct {
	State *GameState
	Meta  PuzzleMeta
}

// LoadPuzzle parses a puzzle JSON byte slice into a GameState ready for play.
// Returns a non-nil error for any validation failure.
func LoadPuzzle(data []byte) (*LoadResult, error) {
	var pj puzzleJSON
	if err := strictUnmarshal(data, &pj); err != nil {
		return nil, fmt.Errorf("invalid puzzle JSON: %w", err)
	}

	// Required fields
	if pj.ID == "" {
		return nil, fmt.Errorf("puzzle missing required field: id")
	}
	if pj.WinCondition == nil {
		return nil, fmt.Errorf("puzzle missing required field: win_condition")
	}

	// Board
	if pj.Board.Width < 2 || pj.Board.Height < 2 {
		return nil, fmt.Errorf("board width and height must each be ≥ 2")
	}
	board := Board{Width: pj.Board.Width, Height: pj.Board.Height}

	// Blocks
	blocks, err := parseBlocks(pj.Blocks, board)
	if err != nil {
		return nil, err
	}

	// Win condition
	win, werr := parseWinCondition(pj.WinCondition, true)
	if werr != nil {
		return nil, werr
	}
	if requiresWinDescription(win) && pj.WinDescription == "" {
		return nil, fmt.Errorf("description_only win_condition requires win_description")
	}

	// Build initial snapshot for reset
	initial := make(snapshot, len(blocks))
	for id, b := range blocks {
		cells := make([]Cell, len(b.Cells))
		copy(cells, b.Cells)
		initial[id] = cells
	}

	state := &GameState{
		Board:   board,
		Blocks:  blocks,
		Win:     win,
		initial: initial,
	}

	return &LoadResult{
		State: state,
		Meta: PuzzleMeta{
			ID:         pj.ID,
			Title:      pj.Title,
			Source:     pj.Source,
			Difficulty: pj.Difficulty,
			MinMoves:   pj.MinMoves,
		},
	}, nil
}

func parseBlocks(bjs []blockJSON, board Board) (map[string]*Block, error) {
	blocks := make(map[string]*Block, len(bjs))
	// Track occupied cells for overlap detection
	occupied := make(map[[2]int]string)

	for _, bj := range bjs {
		if bj.ID == "" {
			return nil, fmt.Errorf("block missing required field: id")
		}
		if _, dup := blocks[bj.ID]; dup {
			return nil, fmt.Errorf("duplicate block id: %q", bj.ID)
		}
		if len(bj.Cells) == 0 {
			return nil, fmt.Errorf("block %q has no cells", bj.ID)
		}

		if bj.Appearance == nil {
			return nil, fmt.Errorf("block %q missing required field: appearance", bj.ID)
		}

		// Parse cells
		cells := make([]Cell, len(bj.Cells))
		for i, rc := range bj.Cells {
			c := Cell{Col: rc[0], Row: rc[1]}
			if !board.InBounds(c) {
				return nil, fmt.Errorf("block %q cell %v is outside board bounds (%dx%d)",
					bj.ID, c, board.Width, board.Height)
			}
			key := [2]int{c.Col, c.Row}
			if ownerID, exists := occupied[key]; exists {
				return nil, fmt.Errorf("blocks %q and %q overlap at cell (%d,%d)",
					ownerID, bj.ID, c.Col, c.Row)
			}
			occupied[key] = bj.ID
			cells[i] = c
		}

		appearance, err := parseAppearanceJSON(bj.ID, bj.Appearance)
		if err != nil {
			return nil, err
		}

		blocks[bj.ID] = &Block{
			ID:         bj.ID,
			Cells:      cells,
			Movable:    bj.Movable,
			Appearance: appearance,
		}
	}

	return blocks, nil
}

func parseAppearanceJSON(blockID string, appearance *appearanceJSON) (Appearance, error) {
	switch AppearanceType(appearance.Type) {
	case AppearanceTypePlain:
		if appearance.TextColor != "" {
			return Appearance{}, fmt.Errorf("block %q plain appearance must not specify text_color", blockID)
		}
		if appearance.Value != "" {
			return Appearance{}, fmt.Errorf("block %q plain appearance must not specify value", blockID)
		}
	case AppearanceTypeText:
		switch appearance.TextColor {
		case "", "white", "black":
			// allowed
		default:
			return Appearance{}, fmt.Errorf("block %q has invalid appearance text_color %q", blockID, appearance.TextColor)
		}
	case AppearanceTypeSVG:
		if appearance.TextColor != "" {
			return Appearance{}, fmt.Errorf("block %q svg appearance must not specify text_color", blockID)
		}
	case "":
		return Appearance{}, fmt.Errorf("block %q appearance missing required field: type", blockID)
	default:
		return Appearance{}, fmt.Errorf("block %q has unknown appearance type %q", blockID, appearance.Type)
	}

	if appearance.Color == "" {
		return Appearance{}, fmt.Errorf("block %q appearance missing required field: color", blockID)
	}
	if (appearance.Type == string(AppearanceTypeText) || appearance.Type == string(AppearanceTypeSVG)) && appearance.Value == "" {
		return Appearance{}, fmt.Errorf("block %q %s appearance missing required field: value", blockID, appearance.Type)
	}

	return Appearance{
		Type:      AppearanceType(appearance.Type),
		Color:     appearance.Color,
		Value:     appearance.Value,
		TextColor: defaultTextColor(appearance.Type, appearance.TextColor),
	}, nil
}

func parseWinCondition(raw json.RawMessage, allowAnyOf bool) (WinCondition, error) {
	var probe winTypeProbe
	if err := json.Unmarshal(raw, &probe); err != nil {
		return nil, fmt.Errorf("win_condition must be a JSON object: %w", err)
	}

	switch WinConditionType(probe.Type) {
	case WinTypePosition:
		var w winPositionJSON
		if err := strictUnmarshal(raw, &w); err != nil {
			return nil, fmt.Errorf("invalid position win_condition: %w", err)
		}
		if len(w.Positions) == 0 {
			return nil, fmt.Errorf("position win_condition requires at least one target")
		}
		targets := make([]PositionTarget, len(w.Positions))
		for i, p := range w.Positions {
			match, err := parsePhysicalMatch(p.Match)
			if err != nil {
				return nil, fmt.Errorf("position positions[%d] match: %w", i, err)
			}
			targets[i] = PositionTarget{Match: match, Col: p.Col, Row: p.Row}
		}
		return &PositionCondition{Positions: targets}, nil

	case WinTypeAdjacency:
		var w winAdjacencyJSON
		if err := strictUnmarshal(raw, &w); err != nil {
			return nil, fmt.Errorf("invalid adjacency win_condition: %w", err)
		}
		if len(w.Positions) < 2 {
			return nil, fmt.Errorf("adjacency win_condition requires at least two positions")
		}
		targets := make([]PositionTarget, len(w.Positions))
		for i, p := range w.Positions {
			match, err := parsePhysicalMatch(p.Match)
			if err != nil {
				return nil, fmt.Errorf("adjacency positions[%d] match: %w", i, err)
			}
			targets[i] = PositionTarget{Match: match, Col: p.Col, Row: p.Row}
		}
		return &AdjacencyCondition{Positions: targets}, nil

	case WinTypeAnyOf:
		if !allowAnyOf {
			return nil, fmt.Errorf("nested any_of win_condition is not supported")
		}
		var w struct {
			Conditions []json.RawMessage `json:"conditions"`
		}
		if err := json.Unmarshal(raw, &w); err != nil {
			return nil, fmt.Errorf("invalid any_of win_condition: %w", err)
		}
		if len(w.Conditions) == 0 {
			return nil, fmt.Errorf("any_of win_condition requires at least one condition")
		}
		conditions := make([]WinCondition, 0, len(w.Conditions))
		for i, c := range w.Conditions {
			wc, err := parseWinCondition(c, false)
			if err != nil {
				return nil, fmt.Errorf("any_of conditions[%d]: %w", i, err)
			}
			conditions = append(conditions, wc)
		}
		return &AnyOfCondition{Conditions: conditions}, nil

	case WinTypeDescriptionOnly:
		return &DescriptionOnlyCondition{}, nil

	case "":
		return nil, fmt.Errorf("win_condition missing required field: type")

	default:
		return nil, fmt.Errorf("unknown win_condition type %q: must be position, adjacency, any_of, or description_only", probe.Type)
	}
}

func parsePhysicalMatch(raw json.RawMessage) (PhysicalMatch, error) {
	if len(raw) == 0 {
		return PhysicalMatch{}, fmt.Errorf("missing required field: match")
	}
	var payload struct {
		Appearance *appearanceCriteriaJSON `json:"appearance"`
		Shape      [][2]int               `json:"shape"`
	}
	if err := strictUnmarshal(raw, &payload); err != nil {
		return PhysicalMatch{}, fmt.Errorf("match must be a JSON object: %w", err)
	}
	if payload.Appearance == nil && len(payload.Shape) == 0 {
		return PhysicalMatch{}, fmt.Errorf("match requires appearance and/or shape")
	}

	criteria, err := parseAppearanceCriteria(payload.Appearance)
	if err != nil {
		return PhysicalMatch{}, err
	}

	match := PhysicalMatch{Appearance: criteria}
	if len(payload.Shape) > 0 {
		cells := make([]Cell, len(payload.Shape))
		for i, s := range payload.Shape {
			cells[i] = Cell{Col: s[0], Row: s[1]}
		}
		match.Shape = normaliseShape(cells)
	}
	return match, nil
}

type appearanceCriteriaJSON struct {
	Type      *string `json:"type"`
	Color     *string `json:"color"`
	Value     *string `json:"value"`
	TextColor *string `json:"text_color"`
}

func parseAppearanceCriteria(raw *appearanceCriteriaJSON) (*AppearanceCriteria, error) {
	if raw == nil {
		return nil, nil
	}
	if raw.Type == nil && raw.Color == nil && raw.Value == nil && raw.TextColor == nil {
		return nil, fmt.Errorf("match appearance requires at least one field")
	}

	criteria := &AppearanceCriteria{}
	if raw.Type != nil {
		t := AppearanceType(*raw.Type)
		switch t {
		case AppearanceTypePlain, AppearanceTypeText, AppearanceTypeSVG:
			criteria.Type = &t
		default:
			return nil, fmt.Errorf("match appearance has unknown type %q", *raw.Type)
		}
	}
	if raw.Color != nil {
		if *raw.Color == "" {
			return nil, fmt.Errorf("match appearance color must be non-empty")
		}
		criteria.Color = raw.Color
	}
	if raw.Value != nil {
		if *raw.Value == "" {
			return nil, fmt.Errorf("match appearance value must be non-empty")
		}
		criteria.Value = raw.Value
	}
	if raw.TextColor != nil {
		switch *raw.TextColor {
		case "white", "black":
			criteria.TextColor = raw.TextColor
		default:
			return nil, fmt.Errorf("match appearance text_color must be white or black")
		}
	}

	if criteria.Type != nil {
		switch *criteria.Type {
		case AppearanceTypePlain:
			if criteria.Value != nil {
				return nil, fmt.Errorf("plain match appearance must not specify value")
			}
			if criteria.TextColor != nil {
				return nil, fmt.Errorf("plain match appearance must not specify text_color")
			}
		case AppearanceTypeSVG:
			if criteria.TextColor != nil {
				return nil, fmt.Errorf("svg match appearance must not specify text_color")
			}
		case AppearanceTypeText:
			if criteria.TextColor == nil {
				white := "white"
				criteria.TextColor = &white
			}
		}
	}

	return criteria, nil
}

func defaultTextColor(appearanceType string, textColor string) string {
	if appearanceType == string(AppearanceTypeText) && textColor == "" {
		return "white"
	}
	return textColor
}

func strictUnmarshal(data []byte, dst any) error {
	decoder := json.NewDecoder(strings.NewReader(string(data)))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		return err
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		if err == nil {
			return fmt.Errorf("unexpected trailing JSON content")
		}
		return err
	}
	return nil
}

func requiresWinDescription(win WinCondition) bool {
	switch w := win.(type) {
	case *DescriptionOnlyCondition:
		return true
	case *AnyOfCondition:
		for _, condition := range w.Conditions {
			if requiresWinDescription(condition) {
				return true
			}
		}
	}
	return false
}
