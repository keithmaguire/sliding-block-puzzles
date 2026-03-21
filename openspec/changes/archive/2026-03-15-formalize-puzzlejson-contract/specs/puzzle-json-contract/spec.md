## ADDED Requirements

### Requirement: PuzzleJSON contract defines canonical top-level structure
The system SHALL define a canonical serialized puzzle object named `PuzzleJSON`.

A canonical `PuzzleJSON` SHALL contain:
- `id` — required string identifier
- `title` — required display string
- `board` — required object with `width` and `height`
- `blocks` — required array of block objects
- `win_condition` — required win-condition object

A canonical `PuzzleJSON` MAY additionally contain:
- `source` — optional attribution string
- `difficulty` — optional integer 1–5
- `min_moves` — optional integer move target
- `win_description` — optional player-facing explanation of the goal
- `setup_options` — optional setup behavior object

#### Scenario: Canonical top-level fields are defined
- **WHEN** an author reads the PuzzleJSON contract
- **THEN** the contract SHALL clearly distinguish required and optional top-level fields

### Requirement: PuzzleJSON contract defines setup_options
The system SHALL define `setup_options` as an optional object with these fields:
- `allow_shuffle` — optional boolean
- `removable_blocks` — optional array of block IDs

#### Scenario: setup_options fields are documented
- **WHEN** an author reads the setup options section
- **THEN** the contract SHALL list `allow_shuffle` and `removable_blocks` with their meanings and types

### Requirement: PuzzleJSON contract defines block semantics and invariants
The system SHALL define a block object with:
- `id` — required unique string within the puzzle
- `cells` — required array of `[col, row]` pairs
- `color` — required CSS color string
- `movable` — required boolean
- `type` — optional `"normal"` or `"void"`; default `"normal"`
- `label` — optional label object

The contract SHALL state these invariants:
- block IDs are unique within a puzzle
- each block has at least one cell
- all cells are within board bounds
- no two blocks overlap
- void blocks are always treated as immovable for gameplay semantics

#### Scenario: Block invariants are defined
- **WHEN** an author reads the block section
- **THEN** the contract SHALL state the uniqueness, non-overlap, bounds, and void-block rules

### Requirement: PuzzleJSON contract defines the full public win-condition union
The system SHALL define the public `win_condition` union with these supported types:
- `position`
- `multi_position`
- `adjacency`
- `shape_position`
- `any_of`
- `description_only`

#### Scenario: Full win-condition union is listed
- **WHEN** an author reads the win-condition section
- **THEN** all six supported win-condition types SHALL be listed as part of the public contract

### Requirement: Edge goals use position, not a distinct exit type
The canonical public contract SHALL model edge-reaching goals as ordinary `position` win conditions.

The contract SHALL state that any exit-like visual treatment is represented by puzzle geometry and block styling rather than a distinct win-condition type.

#### Scenario: Edge goals are documented canonically as position
- **WHEN** an author reads the position win-condition section
- **THEN** the contract SHALL state that goals at the board edge use `position`
- **AND** the contract SHALL NOT require a separate public `exit` win-condition type

### Requirement: any_of is a first-class public win condition
The system SHALL define `any_of` as a win condition with:
- `type: "any_of"`
- `conditions` — required non-empty array of nested win-condition objects

An `any_of` win condition SHALL be satisfied when any nested condition is satisfied.

#### Scenario: any_of semantics are documented
- **WHEN** an author reads the `any_of` section
- **THEN** the contract SHALL state that satisfying any nested condition wins the puzzle

### Requirement: description_only is a first-class public win condition
The system SHALL define `description_only` as a win condition with:
- `type: "description_only"`

A `description_only` puzzle SHALL rely on player judgment rather than engine-verified board state. The contract SHALL state that such puzzles are intended to be accompanied by `win_description` for the player-facing goal text.

#### Scenario: description_only semantics are documented
- **WHEN** an author reads the `description_only` section
- **THEN** the contract SHALL state that completion is player-judged rather than engine-verified

### Requirement: Canonical representation uses win_condition
The canonical serialized format SHALL use the top-level `win_condition` field.

For puzzles with multiple alternative ways to win, the canonical representation SHALL use:
- `win_condition: { "type": "any_of", "conditions": [...] }`

#### Scenario: Multiple win paths use any_of canonically
- **WHEN** an author wants to express multiple alternative ways to win
- **THEN** the canonical contract SHALL represent them with `win_condition.type = "any_of"`

### Requirement: win_conditions is compatibility input only
The system MAY accept a top-level `win_conditions` array as compatibility input.

When accepted, `win_conditions` SHALL be interpreted as equivalent to:
- `win_condition: { "type": "any_of", "conditions": [...] }`

The contract SHALL mark `win_conditions` as non-canonical and compatibility-only.

#### Scenario: Compatibility form is distinguished from canonical form
- **WHEN** an author reads the compatibility rules
- **THEN** the contract SHALL state that `win_conditions` may be accepted but is not the canonical serialized representation

### Requirement: PuzzleJSON contract defines index formats and canonical form
The system SHALL define:
- canonical `puzzles/index.json` format as v2 hierarchical object form with `version: 2` and `groups`
- legacy compatibility input as a flat array of index entries without `version`

The contract SHALL mark the flat array as compatibility-only rather than canonical.

#### Scenario: Index canonical vs compatibility forms are distinguished
- **WHEN** an author reads the index contract
- **THEN** the hierarchical v2 format SHALL be identified as canonical and the flat array SHALL be identified as compatibility-only
