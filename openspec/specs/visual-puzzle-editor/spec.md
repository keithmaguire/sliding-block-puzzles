## Capability: visual-puzzle-editor

The interactive grid-painter inside Puzzle Authoring used to create and edit puzzles visually.

---

## ADDED Requirements

### Requirement: Visual editor is the authoring surface
The system SHALL open Puzzle Authoring directly into its visual editor with a 5×4 empty grid as the default blank draft.

#### Scenario: Visual editor shown on first open
- **WHEN** the user opens Puzzle Authoring with no existing draft
- **THEN** the visual editor SHALL be shown immediately with a 5×4 empty grid

### Requirement: Tool bar
The visual editor SHALL provide:
- Erase
- per-block tools
- Undo
- + Block

The active tool SHALL be visibly highlighted.

#### Scenario: Clicking a block tool selects it and opens config
- **WHEN** the user clicks a block tool
- **THEN** that tool SHALL become active and the block config panel SHALL open

### Requirement: Visual editor provides bounded undo
The visual editor SHALL provide an Undo control that reverts recent authoring actions.

The undo history SHALL retain the three most recent authoring actions.

Supported undoable actions SHALL include at minimum:
- start-grid paint and erase actions
- win-grid paint and erase actions
- block configuration changes

#### Scenario: Undo reverts the most recent action
- **WHEN** the user performs an authoring action and then activates Undo
- **THEN** the editor SHALL restore the immediately previous editor state

#### Scenario: Undo history is limited to three actions
- **WHEN** the user performs four authoring actions in sequence
- **AND** then activates Undo four times
- **THEN** only the three most recent actions SHALL be reverted
- **AND** the earliest of the four actions SHALL remain applied

### Requirement: Grid painting
The visual editor SHALL allow click and drag painting on start and win grids.

Start grid rules:
- Erase clears
- Block tool paints that block

Immovable blocks SHALL be authored by selecting a block and disabling its `movable` setting, not through a separate Fixed painting mode.

Win grid rules:
- Erase paints don't-care
- `position` paints one or more target placements using the authored block appearance
- `adjacency` paints a relative arrangement using the authored block appearance

When painting the win grid with a block tool, the editor SHALL place the whole authored block shape and allow that placed win-grid block to be repositioned by click-and-drag.

Win-grid editing SHALL NOT collision-block dragged placements; dragged blocks MAY pass over or overwrite other win-grid placements during editing.

The visual editor SHALL NOT offer block creation while the Win Grid phase is active.

#### Scenario: Dragging paints multiple cells
- **WHEN** the user drags across cells with a tool active
- **THEN** all traversed cells SHALL be painted

#### Scenario: Clicking a block tool places a draggable win-grid block
- **WHEN** the user is in the Win Grid phase and clicks a block tool on the grid
- **THEN** the editor SHALL place that block's full authored shape on the win grid
- **AND** the user SHALL be able to drag it to a different win-grid location

### Requirement: Block config panel
The visual editor SHALL provide block appearance type, block color, appearance value, text color, movability, removable-block toggle, and delete controls for the selected block.

The visual editor SHALL provide a `background` color choice for immovable blocks so they can visually match the board background while still appearing as outlined occupied blocks.
The visual editor SHALL provide a fixed palette that includes these existing colors:
- `#f0a500`
- `#06b6d4`
- `#22c55e`
- `#ec4899`
- `#8b5cf6`
- `#fb923c`
- `#e11d48`
- `#14b8a6`
- grey `#78909c`

The visual editor SHALL additionally provide these colors:
- black `#000000`
- white `#ffffff`
- red `#ff0000`
- blue `#0000ff`
- green `#008000`

For text appearance, the visual editor SHALL allow the author to choose either white or black text.

#### Scenario: Changing a block's color updates visible cells
- **WHEN** the user changes a block color
- **THEN** the block's cells SHALL update immediately in the editor

#### Scenario: Palette exposes the full specified color set plus background
- **WHEN** the user opens the block color selector
- **THEN** the editor SHALL offer `#f0a500`, `#06b6d4`, `#22c55e`, `#ec4899`, `#8b5cf6`, `#fb923c`, `#e11d48`, `#14b8a6`, grey `#78909c`, black `#000000`, white `#ffffff`, red `#ff0000`, blue `#0000ff`, and green `#008000`
- **AND** immovable blocks SHALL also be able to use `background`

#### Scenario: Changing text color updates the block preview
- **WHEN** the user changes a text block's `text_color`
- **THEN** the block preview SHALL update immediately

#### Scenario: Switching appearance type updates available controls
- **WHEN** the user switches a block between `plain`, `text`, and `svg`
- **THEN** the editor SHALL show only the appearance fields relevant to that type

#### Scenario: Background-colored fixed block remains editable
- **WHEN** the user defines a non-movable plain block with color `background`
- **THEN** the block SHALL remain an ordinary editable block in the visual editor

### Requirement: Win condition controls
The visual editor SHALL provide controls for:
- Position
- Adjacency
- Description only

The editor SHALL NOT expose a distinct Exit win type.

#### Scenario: Edge goals are authored as position targets
- **WHEN** the user wants a goal at the board edge
- **THEN** they SHALL express it using a `position` target and board geometry

#### Scenario: Adjacency is authored as a local arrangement on the win grid
- **WHEN** the user selects `Adjacency`
- **THEN** the win grid SHALL define the relative arrangement that must appear
- **AND** the arrangement SHALL be treated as satisfiable anywhere on the board under a single translation

### Requirement: Position and adjacency targets infer matching from authored blocks
For `position` and `adjacency` win conditions, the visual editor SHALL infer each target's physical-piece matching rules from the authored block placed on the win grid rather than exposing separate per-target match controls.

The inferred match SHALL use the authored block's appearance criteria.

The inferred match SHALL additionally include exact-orientation shape criteria when shape is required to distinguish that block from another authored block with the same appearance.

#### Scenario: Win target matching is inferred from a text block
- **WHEN** the author places a text block with value `"T"` on the win grid
- **THEN** the editor SHALL derive a target match from that block's canonical appearance rather than asking the author to configure separate match fields

#### Scenario: Shape is inferred only when needed to distinguish same-appearance blocks
- **WHEN** two authored blocks share the same appearance but have different normalized shapes
- **THEN** the editor SHALL include exact shape criteria for win-grid targets derived from those blocks

### Requirement: Visual editor only relies on shape when shapes vary
The visual editor SHALL only rely on shape-based win matching when the current puzzle contains at least two distinct normalized block shapes and shape is needed to distinguish blocks that otherwise share the same appearance.

#### Scenario: Shape is not surfaced when all blocks share one shape
- **WHEN** every authored block in the puzzle has the same normalized shape
- **THEN** the editor SHALL NOT surface separate shape-matching controls

#### Scenario: Shape is used automatically when same-appearance blocks differ by shape
- **WHEN** the current puzzle contains more than one distinct normalized block shape
- **AND** two authored blocks otherwise share the same appearance
- **THEN** the editor SHALL include shape in the inferred target match for those blocks

### Requirement: Visual editor previews shape-based targets using exact orientation
When a position-based win target uses `match.shape`, the visual puzzle designer SHALL render the selector's exact normalized occupied-cell pattern at the target coordinate in the win preview.

The preview SHALL preserve the selector's encoded orientation exactly.

#### Scenario: Shape target preview shows exact orientation
- **WHEN** an author defines `match: { "shape": [[0,0],[1,0],[0,1]] }`, `col: 3`, `row: 2`
- **THEN** the designer SHALL display a three-cell L-shaped target at `(3,2)`
- **AND** the displayed target SHALL use the exact orientation `[[0,0],[1,0],[0,1]]`

#### Scenario: Rotated variant is not previewed as equivalent
- **WHEN** an author defines `match: { "shape": [[0,0],[1,0],[0,1]] }`
- **THEN** the designer SHALL NOT preview `[[0,0],[1,0],[1,1]]` as an equivalent winning target

### Requirement: Visual state to PuzzleJSON conversion
The system SHALL implement `visualStateToPuzzleJSON(state)` that converts visual editor state to valid `PuzzleJSON`.

The conversion SHALL:
1. gather block cells from the start grid
2. preserve each authored block's appearance and movability
3. build the win condition from visual win controls
4. preserve appearance criteria and optional shape criteria for position-based win targets
5. preserve metadata, appearance data, and setup options
6. preserve text color
7. overwrite the previous win-grid draft when `Copy start` is used

#### Scenario: Puzzle with multiple blocks converts correctly
- **GIVEN** a visual state with authored blocks and win condition
- **WHEN** `visualStateToPuzzleJSON` is called
- **THEN** the resulting PuzzleJSON SHALL preserve that authored meaning

#### Scenario: Copy start overwrites existing win-grid placements
- **WHEN** the user has already authored win-grid placements
- **AND** then activates `Copy start`
- **THEN** the editor SHALL replace the entire win grid with the current start-grid layout

### Requirement: PuzzleJSON to visual state conversion
The system SHALL implement `puzzleJSONToVisualState(puzzle)` that reconstructs visual editor state from `PuzzleJSON`.

Block IDs that are single uppercase letters are used as-is; others may be remapped for editor display.

Immovable blocks SHALL load back into the editor as ordinary editable blocks with `movable` disabled.

#### Scenario: Existing puzzle loads into the editor faithfully
- **GIVEN** an existing puzzle is loaded into the visual editor
- **WHEN** the editor renders
- **THEN** the grids and win controls SHALL reflect that puzzle's authored structure and goal
- **AND** text appearance SHALL preserve its authored text color

#### Scenario: Immovable background-colored blocks stay editable
- **GIVEN** a puzzle contains an immovable block colored `background`
- **WHEN** it is loaded into the visual editor
- **THEN** the block SHALL remain a selectable block with its color and movability preserved
