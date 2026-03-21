## Puzzle JSON Contract

Formal contract for the serialized `PuzzleJSON` format used by the app.

---

## ADDED Requirements

### Requirement: PuzzleJSON contract defines canonical top-level structure
The system SHALL define a canonical serialized puzzle object named `PuzzleJSON`.

A canonical `PuzzleJSON` SHALL contain:
- `id`
- `board`
- `blocks`
- `win_condition`

A canonical `PuzzleJSON` MAY additionally contain:
- `min_moves`
- `win_description`
- `setup_options`

#### Scenario: Canonical top-level fields are defined
- **WHEN** an author reads the PuzzleJSON contract
- **THEN** the contract SHALL clearly distinguish required and optional top-level fields

### Requirement: PuzzleJSON contract defines block semantics and invariants
The system SHALL define a block object with:
- `id`
- `cells`
- `movable`
- `appearance`

The contract SHALL state these invariants:
- block IDs are unique within a puzzle
- each block has at least one cell
- all cells are within board bounds
- no two blocks overlap

#### Scenario: Block invariants are defined
- **WHEN** an author reads the block section
- **THEN** the contract SHALL state uniqueness, non-overlap, and bounds rules

### Requirement: PuzzleJSON contract defines block appearance
The system SHALL define an `appearance` object on every block.

The `appearance` object SHALL contain:
- `type`
- `color`

If `appearance.type` is `"text"` or `"svg"`, the object SHALL also contain:
- `value`

If `appearance.type` is `"text"`, the object MAY additionally contain:
- `text_color`

The supported `appearance.type` values SHALL be:
- `plain`
- `text`
- `svg`

The public contract SHALL allow `text_color` values of:
- `white`
- `black`

If omitted for text appearance, `text_color` SHALL default to `white`.

#### Scenario: Plain appearance defines a colored block
- **WHEN** an author defines a block with no text or SVG content
- **THEN** the block SHALL use `appearance.type = "plain"`
- **AND** the block fill SHALL come from `appearance.color`

#### Scenario: Text appearance can choose black or white text
- **WHEN** an author defines `appearance.type = "text"`
- **THEN** the contract SHALL state that `text_color` may be `white` or `black`
- **AND** omitted `text_color` SHALL mean `white`

#### Scenario: SVG appearance carries its matching value
- **WHEN** an author defines `appearance.type = "svg"`
- **THEN** the visible SVG fragment SHALL come from `appearance.value`

### Requirement: Background areas are modeled as fixed plain blocks
The system SHALL represent non-playable or visually inactive board areas using non-movable blocks with plain background appearance.

A background-area block SHALL use:
- `movable: false`
- `appearance.type: "plain"`
- `appearance.color: "background"`

#### Scenario: Inactive board area uses background appearance
- **WHEN** an author needs to represent a non-playable area inside the board bounds
- **THEN** the puzzle SHALL use a non-movable block with `appearance.type = "plain"` and `appearance.color = "background"`

### Requirement: PuzzleJSON contract defines setup_options
The system SHALL define `setup_options` as a public optional field.

The currently supported fields SHALL be:
- `allow_shuffle`
- `removable_blocks`

The contract SHALL state that `setup_options` may gain additional fields in future.

#### Scenario: setup_options fields are documented
- **WHEN** an author reads the setup options section
- **THEN** the contract SHALL list the supported fields and note that the object is extensible

### Requirement: PuzzleJSON contract defines the full public win-condition union
The system SHALL define the public `win_condition` union with these supported types:
- `position`
- `adjacency`
- `any_of`
- `description_only`

#### Scenario: Full win-condition union is listed
- **WHEN** an author reads the win-condition section
- **THEN** all four supported public win-condition types SHALL be listed

### Requirement: Edge goals use position
The canonical public contract SHALL model edge-reaching goals as ordinary `position` win conditions.

Any edge-like visual treatment SHALL be represented by puzzle geometry and block styling.

#### Scenario: Edge goals are documented canonically as position
- **WHEN** an author reads the position section
- **THEN** the contract SHALL state that edge goals use `position`

### Requirement: any_of is a first-class public win condition
The system SHALL define `any_of` as:
- `type: "any_of"`
- `conditions`: non-empty flat array of non-`any_of` win-condition objects

An `any_of` win condition SHALL be satisfied when any listed nested condition is satisfied.

#### Scenario: any_of semantics are documented
- **WHEN** an author reads the `any_of` section
- **THEN** the contract SHALL state that satisfying any listed condition wins the puzzle

### Requirement: Position-based win targets use physical-piece selectors
The system SHALL define a reusable `match` object for position-based win targets.

A canonical `match` object MAY contain:
- `appearance`
- `shape`

At least one of `appearance` or `shape` SHALL be present.

If `appearance` is present, it SHALL be an appearance-criteria object using the same field names as block `appearance`:
- `type`
- `color`
- optional `value`
- optional `text_color`

An appearance-criteria object SHALL include at least one field.

When `appearance` is present, a block SHALL match it if every field present in the criteria exactly matches the block's canonical appearance after applying contract defaults.

For text appearance matching, omitted `text_color` SHALL mean `white`.

If `shape` is present, it SHALL be a normalized occupied-cell pattern:
- coordinates are relative offsets
- the minimum column SHALL be `0`
- the minimum row SHALL be `0`
- cells SHALL be sorted in canonical row-then-column order

If both `appearance` and `shape` are present, both SHALL match the same block.

The canonical serialized format SHALL use `match` for all `position.positions` targets and all `adjacency.positions` targets.

#### Scenario: Appearance criteria matches text block
- **WHEN** a target uses `match: { "appearance": { "type": "text", "value": "T" } }`
- **AND** a block has canonical appearance `{"type":"text","color":"#06b6d4","value":"T","text_color":"white"}`
- **THEN** that block SHALL match the selector

#### Scenario: Appearance criteria matches SVG block
- **WHEN** a target uses `match: { "appearance": { "type": "svg", "value": "<path d='...' />" } }`
- **AND** a block has `appearance: { "type": "svg", "value": "<path d='...' />", "color": "#1f2937" }`
- **THEN** that block SHALL match the selector

#### Scenario: Appearance and shape may be combined
- **WHEN** a target uses `match: { "appearance": { "type": "plain", "color": "#ff0000" }, "shape": [[0,0]] }`
- **THEN** only a red single-cell plain block SHALL match the selector

### Requirement: Shape selectors match exact normalized orientation
A `match.shape` selector SHALL match by exact normalized occupied-cell pattern only.

Normalization SHALL remove translation only. Rotation and reflection SHALL NOT be treated as equivalent.

#### Scenario: Rotated shape does not match shape selector
- **WHEN** a target uses `match: { "shape": [[0,0],[1,0],[0,1]] }`
- **AND** a block has normalized occupied cells `[[0,0],[1,0],[1,1]]`
- **THEN** that block SHALL NOT match the selector

#### Scenario: Reflected shape does not match shape selector
- **WHEN** a target uses `match: { "shape": [[0,0],[1,0],[0,1]] }`
- **AND** a block has normalized occupied cells `[[0,0],[0,1],[1,1]]`
- **THEN** that block SHALL NOT match the selector

### Requirement: position win condition uses one-or-more authored targets
The system SHALL define `position` as:
- `type: "position"`
- `positions`: a non-empty array of target objects

Each target object SHALL contain:
- `match`
- `col`
- `row`

A `position` win condition SHALL be satisfied when there exists a one-to-one assignment between blocks and targets such that:
- each target is assigned exactly one block
- each assigned block matches that target's selector
- no block is assigned to more than one target
- each assigned block's top-left cell is at the target coordinate

#### Scenario: Single-target position win remains valid
- **WHEN** a puzzle defines `type: "position"` with exactly one target in `positions`
- **AND** one matching block occupies that target coordinate
- **THEN** the position win condition SHALL be satisfied

#### Scenario: Repeated appearance-matched targets are interchangeable
- **WHEN** a puzzle defines two `position.positions` targets with `match: { "appearance": { "type": "text", "value": "T" } }`
- **AND** two different blocks whose canonical appearance matches that criteria occupy those two target coordinates
- **THEN** the position win condition SHALL be satisfied
- **AND** the contract SHALL NOT require either specific matching block to occupy either specific target

#### Scenario: Position win fails when insufficient matching blocks exist
- **WHEN** a puzzle defines two `position.positions` targets with `match: { "appearance": { "type": "text", "value": "E" } }`
- **AND** only one matching block occupies one required target coordinate
- **THEN** the position win condition SHALL NOT be satisfied

#### Scenario: Position win may mix appearance-only, shape-only, and combined matching
- **WHEN** an author defines some targets using appearance-only matching, some using shape-only matching, and some using both appearance and shape in one `positions` array
- **THEN** the contract SHALL permit that combination
- **AND** evaluation SHALL use the same one-to-one assignment rule across all targets

### Requirement: adjacency win condition uses a translation-invariant authored arrangement
The system SHALL define `adjacency` as:
- `type: "adjacency"`
- `positions`: a non-empty array of at least two target objects

Each target object SHALL contain:
- `match`
- `col`
- `row`

The authored `adjacency.positions` coordinates SHALL be interpreted relative to one another rather than as absolute board coordinates.

An `adjacency` win condition SHALL be satisfied when there exists a single board translation `(dc, dr)` and a one-to-one assignment between blocks and targets such that:
- each target is assigned exactly one block
- each assigned block matches that target's selector
- no block is assigned to more than one target
- each assigned block's top-left cell is at `(target.col + dc, target.row + dr)`

#### Scenario: Adjacency arrangement may occur anywhere on the board
- **WHEN** an author defines an `adjacency.positions` arrangement with targets at relative coordinates `(0,0)` and `(1,0)`
- **AND** matching blocks occupy those relative positions at board coordinates `(3,2)` and `(4,2)`
- **THEN** the adjacency win condition SHALL be satisfied

#### Scenario: Adjacency requires one translation across all targets
- **WHEN** an author defines an `adjacency.positions` arrangement with three targets
- **AND** no single translation places all three matching blocks at the authored relative offsets
- **THEN** the adjacency win condition SHALL NOT be satisfied

### Requirement: description_only is a first-class public win condition
The system SHALL define `description_only` as a player-judged win condition.

A `description_only` puzzle SHALL require a top-level `win_description`.

#### Scenario: description_only requires win_description
- **WHEN** an author reads the `description_only` section
- **THEN** the contract SHALL state that `win_description` is required for this win type

### Requirement: Canonical representation uses win_condition
The serialized format SHALL use the top-level `win_condition` field.

Multiple alternative winning paths SHALL be represented as:
- `win_condition: { "type": "any_of", "conditions": [...] }`

#### Scenario: Multiple win paths use any_of
- **WHEN** an author wants to express multiple alternative ways to win
- **THEN** the contract SHALL represent them with `win_condition.type = "any_of"`

### Requirement: Word-style puzzles use position targets canonically
The system SHALL define word-style position puzzles canonically using `position.positions` with text appearance criteria.

Repeated values SHALL be treated as interchangeable target requirements subject only to the one-to-one assignment rule.

#### Scenario: Word puzzle with repeated letters
- **WHEN** an author defines a phrase with repeated letters such as `"UNITED STATES"`
- **AND** the target set contains repeated appearance criteria for `"T"`, `"E"`, and `"S"`
- **THEN** the puzzle SHALL be solved when matching blocks occupy all required coordinates
- **AND** the contract SHALL NOT require a specific repeated-value block to occupy a specific repeated-value slot

### Requirement: PuzzleJSON contract defines index formats and canonical form
The system SHALL define `puzzles/index.json` as the v3 flat catalog object with:
- `version: 3`
- a fixed numeric difficulty scale and group registry
- flat puzzle rows keyed by puzzle `id`

#### Scenario: Index format is defined
- **WHEN** an author reads the index contract
- **THEN** the v3 flat catalog format SHALL be identified as the required serialized structure

### Requirement: Built-in puzzle metadata is index-owned
Library-facing metadata such as title, source, difficulty, and grouping SHALL belong to `puzzles/index.json` rather than to canonical puzzle files.

#### Scenario: Puzzle file excludes browse-time metadata
- **WHEN** a puzzle JSON file is exported for placement in `puzzles/`
- **THEN** it SHALL contain gameplay data only
- **AND** built-in browse metadata SHALL be maintained separately in the index

### Requirement: Build pipeline validates shipped puzzle files
The system SHALL validate every shipped puzzle JSON file before building the app.

Validation SHALL include:
- canonical `PuzzleJSON` structure
- block and win-condition validation performed by the Go loader

#### Scenario: Invalid shipped puzzle blocks the build
- **WHEN** a shipped puzzle JSON file is invalid
- **THEN** the app build SHALL fail
