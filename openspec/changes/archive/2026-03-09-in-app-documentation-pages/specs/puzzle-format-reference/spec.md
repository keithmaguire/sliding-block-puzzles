## ADDED Requirements

### Requirement: Puzzle Format Reference page documents index.json
The system SHALL provide a Puzzle Format Reference page that documents the `puzzles/index.json` schema: an array of entry objects each with `id`, `title`, `file`, and optional `source`, `difficulty`, `par`. It SHALL include a rendered example.

#### Scenario: index.json schema displayed
- **WHEN** the user navigates to the Puzzle Format Reference page
- **THEN** the page SHALL show the index.json object structure with field names, types, and which are required

#### Scenario: index.json example rendered
- **WHEN** the user reads the index.json section
- **THEN** the page SHALL show a code example of a valid index.json entry

### Requirement: Puzzle Format Reference page documents puzzle file top-level fields
The system SHALL document the required and optional top-level fields of a puzzle JSON file: `id`, `title`, `board`, `blocks`, `win_condition` (required); `source`, `difficulty`, `par` (optional).

#### Scenario: Required fields listed
- **WHEN** the user reads the puzzle file section
- **THEN** the page SHALL clearly identify which top-level fields are required and which are optional

### Requirement: Puzzle Format Reference page documents the board object
The system SHALL document the `board` object fields (`width`, `height`, both integers ≥ 2) and explain that irregular shapes are modelled via void-type blocks rather than board-level fields.

#### Scenario: Board dimensions documented
- **WHEN** the user reads the board section
- **THEN** the page SHALL state the minimum value of 2 for both dimensions and explain the void-block approach to irregular shapes

### Requirement: Puzzle Format Reference page documents block fields
The system SHALL document each field of a block entry: `id` (unique string), `cells` (array of [col, row] pairs, zero-indexed from top-left), `color` (CSS color), `movable` (boolean), `type` (optional, `"normal"` or `"void"`), `label` (optional object). It SHALL include a rendered example block.

#### Scenario: All block fields documented
- **WHEN** the user reads the blocks section
- **THEN** the page SHALL list every block field with its type and whether it is required

#### Scenario: Void block behaviour explained
- **WHEN** the user reads the blocks section
- **THEN** the page SHALL explain that void blocks are always immovable, render as inactive area, and block movement like any fixed piece

### Requirement: Puzzle Format Reference page documents the label object
The system SHALL document the `label` object: `type` must be `"text"` or `"svg"`, `value` is the string content. It SHALL note that SVG content should use a ~64×64 coordinate space.

#### Scenario: Label types documented
- **WHEN** the user reads the label section
- **THEN** the page SHALL show examples of both text and SVG label objects

### Requirement: Puzzle Format Reference page documents all four win condition types
The system SHALL document each win condition type with its fields and a rendered JSON example:
- `position`: `block`, `col`, `row`
- `multi_position`: `positions` array of `{block, col, row}`; note that word puzzles are a special case using text-labeled blocks
- `adjacency`: `block_a`, `block_b`
- `exit`: `block`, `edge` (`"top"/"bottom"/"left"/"right"`), `gap_start`, `gap_end`

#### Scenario: All four win condition types shown
- **WHEN** the user reads the win condition section
- **THEN** the page SHALL display a subsection for each of the four types with field descriptions and a code example

#### Scenario: Exit gap axis explained
- **WHEN** the user reads the exit win condition section
- **THEN** the page SHALL explain that gap_start/gap_end are in the perpendicular axis (row for left/right edges, col for top/bottom edges)
