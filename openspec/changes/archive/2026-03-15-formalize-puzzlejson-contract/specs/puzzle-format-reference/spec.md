## MODIFIED Requirements

### Requirement: Puzzle Format Reference page documents puzzle file top-level fields
The system SHALL document the required and optional top-level fields of a puzzle JSON file.

Required canonical fields: `id`, `title`, `board`, `blocks`, `win_condition`.
Optional fields: `source`, `difficulty`, `min_moves`, `win_description`, `setup_options`.

The page SHALL distinguish canonical fields from compatibility-only input forms.

#### Scenario: Required vs optional fields clearly distinguished
- **WHEN** the user reads the puzzle file section
- **THEN** the page SHALL clearly separate required and optional fields with examples

#### Scenario: Compatibility-only forms are identified
- **WHEN** the user reads the puzzle file section
- **THEN** the page SHALL distinguish canonical fields from accepted compatibility-only forms

### Requirement: Puzzle Format Reference page documents all public win condition types
The system SHALL document every supported `win_condition` type as a subsection with fields and a rendered JSON example.

**1. `position`** — Satisfied when a named block's top-left cell is at `(col, row)`.
Fields: `type`, `block`, `col`, `row`.

**2. `multi_position`** — Satisfied when every entry in `positions` is satisfied simultaneously.
Fields: `type`, `positions` (array of `{block, col, row}`).
Note: word puzzles use this type — text-labeled single-cell blocks spelling a word when each reaches its target position.

**3. `adjacency`** — Satisfied when any cell of `block_a` is orthogonally adjacent to any cell of `block_b`.
Fields: `type`, `block_a`, `block_b`.

**4. `shape_position`** — Satisfied when **any** movable block whose normalised cell pattern matches `shape` has its top-left corner at `(col, row)`.
Fields: `type`, `shape` (array of `[col, row]` offsets, normalised so min offset is 0 in each axis, sorted row-then-col), `col`, `row`.
Does not reference a specific block ID — matches by shape only. Two identical-shaped pieces on the board means either one reaching the target satisfies the condition.

**5. `any_of`** — Satisfied when any nested win condition is satisfied.
Fields: `type`, `conditions` (non-empty array of win-condition objects).
This is the canonical way to express multiple alternative winning paths.

**6. `description_only`** — Represents a puzzle whose completion is judged by the player rather than engine-verified board state.
Fields: `type`.
These puzzles are intended to be accompanied by `win_description`.

The page SHALL explain that edge-reaching goals use ordinary `position` targets at the board edge rather than a distinct public `exit` win type.

The page SHALL also explain that the top-level `win_conditions` array may be accepted as compatibility input but is not the canonical representation.

#### Scenario: All six public win condition types shown
- **WHEN** the user reads the win condition section
- **THEN** the page SHALL display a subsection for each of the six public types with field descriptions and a code example

#### Scenario: Edge goals are explained as position
- **WHEN** the user reads the win condition section
- **THEN** the page SHALL explain that edge goals are represented with `position`
- **AND** the page SHALL NOT present `exit` as a public canonical win-condition type

#### Scenario: any_of semantics explained
- **WHEN** the user reads the `any_of` section
- **THEN** the page SHALL explain that any nested condition satisfying wins the puzzle

#### Scenario: description_only semantics explained
- **WHEN** the user reads the `description_only` section
- **THEN** the page SHALL explain that the player judges completion rather than the engine

#### Scenario: Canonical multi-way representation explained
- **WHEN** the user reads the win condition section
- **THEN** the page SHALL state that `win_condition.type = "any_of"` is canonical and `win_conditions` is compatibility-only
