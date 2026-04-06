## Puzzle Format Reference

The Puzzle Format Reference documents the on-disk JSON structures consumed by the app so authors can create and inspect puzzles by hand or with tooling.

---

## ADDED Requirements

### Requirement: Puzzle Format Reference page documents the index.json canonical format
The system SHALL document the canonical `puzzles/index.json` format as a JSON object with:
- `version: 3`
- `registries`
- `puzzles`

An `IndexEntry` has:
- `id`
- `title`
- `file`
- `source`
- `difficulty`
- `group_id`
- optional `min_moves`

#### Scenario: Index format displayed
- **WHEN** the user reads the index section
- **THEN** the page SHALL identify the v3 flat catalog object as the required format

### Requirement: Puzzle Format Reference page documents puzzle file top-level fields
The system SHALL document the required and optional top-level fields of a puzzle JSON file.

Required canonical fields:
- `id`
- `board`
- `blocks`
- `win_condition`

Optional fields:
- `min_moves`
- `win_description`
- `setup_options`

#### Scenario: Required vs optional fields clearly distinguished
- **WHEN** the user reads the puzzle file section
- **THEN** the page SHALL clearly separate required and optional fields with examples

### Requirement: Puzzle Format Reference page documents the board object
The system SHALL document the `board` object fields — `width` and `height`, both integers greater than or equal to 2.

#### Scenario: Board dimensions documented
- **WHEN** the user reads the board section
- **THEN** the page SHALL state the minimum value of 2 for both dimensions

### Requirement: Puzzle Format Reference page documents block fields
The system SHALL document every field of a block object:

Required:
- `id`
- `cells`
- `movable`
- `appearance`

Optional:
- `movement`

The page SHALL explain `[col, row]` coordinate order, uniqueness, bounds, and non-overlap.

The page SHALL document `movement` as an optional constraint with values `"vertical"` (up/down only) and `"horizontal"` (left/right only). When absent, the block is unconstrained. When present on an immovable block, `movement` is ignored.

#### Scenario: All block fields documented with coordinate order
- **WHEN** the user reads the blocks section
- **THEN** the page SHALL list every field, clarify `[col, row]` ordering, and include an example

### Requirement: Puzzle Format Reference page documents the appearance object
The system SHALL document the `appearance` object with:
- `type`
- `color`
- optional `value`
- optional `text_color`

The page SHALL document the supported `appearance.type` values:
- `plain`
- `text`
- `svg`

The page SHALL explain that `appearance.value` is used for both visible content and selector-based win matching for text and SVG blocks.

#### Scenario: All appearance types shown with examples
- **WHEN** the user reads the appearance section
- **THEN** the page SHALL show plain, text, and SVG appearance examples

### Requirement: Puzzle Format Reference page documents background areas as ordinary blocks
The system SHALL document that inactive board regions are represented by non-movable blocks with:
- `appearance.type = "plain"`
- `appearance.color = "background"`

#### Scenario: Background area is documented canonically
- **WHEN** the user reads the block and board sections
- **THEN** the page SHALL explain that non-playable areas use fixed plain background-colored blocks

### Requirement: Puzzle Format Reference page documents setup_options
The system SHALL document `setup_options` as a public optional field.

The page SHALL document the currently supported fields:
- `allow_shuffle`
- `removable_blocks`

The page SHALL state that `setup_options` is extensible and may gain additional fields in future.

#### Scenario: setup_options documented as public and extensible
- **WHEN** the user reads the setup options section
- **THEN** the page SHALL describe the supported fields and note that more may be added later

### Requirement: Puzzle Format Reference page documents all public win condition types
The system SHALL document every supported public `win_condition` type as a subsection with fields and an example.

Public types:
1. `position`
2. `adjacency`
3. `any_of`
4. `description_only`

The page SHALL explain that edge-reaching goals are represented as ordinary `position` targets at the board edge.

The page SHALL explain that `any_of` is the way to represent multiple alternative winning paths.

The page SHALL explain that `description_only` relies on player judgment and is expected to be accompanied by `win_description`.

The page SHALL explain that `position` and `adjacency` targets use `match` objects with:
- optional `appearance` criteria
- optional `shape` criteria
- at least one required

The page SHALL explain that shape criteria match exact normalized orientation only, with translation removed but rotation and reflection treated as distinct.

#### Scenario: All public win condition types shown
- **WHEN** the user reads the win-condition section
- **THEN** the page SHALL display a subsection for each public type with field descriptions and examples

#### Scenario: Edge goals are explained as position
- **WHEN** the user reads the win-condition section
- **THEN** the page SHALL explain that edge goals are represented with `position`

#### Scenario: Multi-way representation explained
- **WHEN** the user reads the win-condition section
- **THEN** the page SHALL state that `win_condition.type = "any_of"` is how multiple alternative wins are represented

#### Scenario: Repeated letters are documented as repeated position targets
- **WHEN** the user reads the `position` section
- **THEN** the page SHALL explain that repeated text or SVG values use repeated appearance criteria with one-to-one assignment semantics

#### Scenario: Exact-orientation shape matching is documented
- **WHEN** the user reads the selector documentation
- **THEN** the page SHALL explain that `match.shape` uses exact normalized orientation and does not treat rotated or reflected shapes as equivalent
