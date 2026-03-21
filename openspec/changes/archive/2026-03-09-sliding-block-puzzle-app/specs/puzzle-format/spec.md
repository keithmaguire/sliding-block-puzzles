## ADDED Requirements

### Requirement: Puzzle file is valid JSON conforming to the puzzle schema
Each puzzle SHALL be a JSON object with the fields: `id` (string), `title` (string), `board` (object), `blocks` (array), and `win_condition` (object). All fields except `source`, `difficulty`, and `par` are required.

#### Scenario: Minimal valid puzzle
- **WHEN** a JSON file contains `id`, `title`, `board`, `blocks`, and `win_condition`
- **THEN** LoadPuzzle SHALL succeed and return an empty error string

#### Scenario: Missing required field
- **WHEN** a JSON file omits `win_condition`
- **THEN** LoadPuzzle SHALL return a non-empty error string

### Requirement: Board field specifies grid dimensions
The `board` object SHALL contain integer fields `width` and `height`, both ≥ 2. Irregular board shapes are expressed through void-type blocks in the `blocks` array, not through board-level fields.

#### Scenario: Valid board dimensions
- **WHEN** board is `{"width": 5, "height": 4}`
- **THEN** the board is initialised as a 5×4 grid

### Requirement: Each block entry specifies id, cells, color, movable, optional type, and optional label
Each object in the `blocks` array SHALL contain: `id` (unique string), `cells` (array of [col, row] pairs), `color` (CSS color string), `movable` (boolean). `type` is optional and defaults to `"normal"`; the only other recognised value is `"void"`. `label` is optional and may be null.

#### Scenario: Normal block with all fields
- **WHEN** a block entry has id "A", cells [[0,0],[1,0]], color "#e74c3c", movable true, label null
- **THEN** the block is created as a movable 2-cell horizontal piece with no label

#### Scenario: Void block entry
- **WHEN** a block entry has `"type": "void"` and cells [[3,0],[3,3]]
- **THEN** those cells render as inactive board area and are impassable to all other blocks

### Requirement: Label type is "text" or "svg"
When present and non-null, a label object SHALL have a `type` field of exactly `"text"` or `"svg"`, and a `value` field (string).

#### Scenario: Text label
- **WHEN** label is `{"type":"text","value":"R"}`
- **THEN** the block carries text label "R"

#### Scenario: SVG label
- **WHEN** label is `{"type":"svg","value":"<circle cx='50' cy='50' r='30'/>"}`
- **THEN** the block carries an SVG fragment for rendering

#### Scenario: Unknown label type
- **WHEN** label type is `"image"` or any value other than "text" or "svg"
- **THEN** LoadPuzzle SHALL return a non-empty error string

### Requirement: Optional metadata fields
A puzzle file MAY include: `source` (string, e.g. "Hornden p.42"), `difficulty` (integer 1–5), `par` (positive integer move count). These are informational and SHALL be included in the index.

#### Scenario: Puzzle with par
- **WHEN** a puzzle has `"par": 18`
- **THEN** the UI SHALL have access to display this as the target move count

### Requirement: Puzzle index lists all puzzles
`puzzles/index.json` SHALL be a JSON array of objects each containing at minimum: `id`, `title`, and `file` (relative path to the puzzle JSON). It MAY include `source`, `difficulty`, and `par`.

#### Scenario: Index loaded by browser
- **WHEN** the browser fetches `puzzles/index.json`
- **THEN** it receives an array with one entry per available puzzle

### Requirement: Win condition object has a type discriminator
The `win_condition` object SHALL have a `type` field whose value is one of: `"position"`, `"multi_position"`, `"adjacency"`, `"exit"`. Additional fields depend on the type as defined in the win-conditions spec. Word puzzles use `"multi_position"` with text-labeled blocks placed at target positions that spell the intended word.

#### Scenario: Unknown win condition type
- **WHEN** `win_condition.type` is an unrecognised value
- **THEN** LoadPuzzle SHALL return a non-empty error string
