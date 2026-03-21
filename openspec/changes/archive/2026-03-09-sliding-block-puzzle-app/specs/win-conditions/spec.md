## ADDED Requirements

### Requirement: Win condition type "position"
The system SHALL evaluate a `position` win condition as satisfied when a specified block's anchor cell is at a specified (col, row).

#### Scenario: Block reaches target position
- **WHEN** win condition is `{"type":"position","block":"A","col":3,"row":2}`
- **AND** block A's anchor is at (3, 2)
- **THEN** CheckWin SHALL return true

#### Scenario: Block not yet at target
- **WHEN** block A's anchor is not at the target (col, row)
- **THEN** CheckWin SHALL return false

### Requirement: Win condition type "multi_position"
The system SHALL evaluate a `multi_position` win condition as satisfied when every entry in a `positions` array is simultaneously satisfied (each named block at its target cell). Word puzzles — where labeled blocks must be arranged to spell a word — are a special case of this type: the author places the target positions such that blocks with text labels, when solved, read as the intended word.

#### Scenario: All blocks at targets
- **WHEN** win condition specifies blocks A at (1,2) and B at (3,0)
- **AND** both blocks are at their respective targets
- **THEN** CheckWin SHALL return true

#### Scenario: Only some blocks at targets
- **WHEN** block A is at its target but block B is not
- **THEN** CheckWin SHALL return false

### Requirement: Win condition type "adjacency"
The system SHALL evaluate an `adjacency` win condition as satisfied when block A has at least one cell that is directly adjacent (up, down, left, or right — not diagonal) to at least one cell of block B.

#### Scenario: Blocks adjacent
- **WHEN** win condition is `{"type":"adjacency","block_a":"X","block_b":"Y"}`
- **AND** a cell of X is directly above, below, left, or right of a cell of Y
- **THEN** CheckWin SHALL return true

#### Scenario: Blocks not touching
- **WHEN** no cell of X is orthogonally adjacent to any cell of Y
- **THEN** CheckWin SHALL return false

### Requirement: Win condition type "exit"
The system SHALL evaluate an `exit` win condition as satisfied when a specified block has moved such that all its cells are outside the board boundary, exiting through a defined gap.

#### Scenario: Block exits through gap
- **WHEN** win condition is `{"type":"exit","block":"A","edge":"right","gap_start":2,"gap_end":3}`
- **AND** block A's cells have all moved beyond the right edge through rows 2–3
- **THEN** CheckWin SHALL return true

#### Scenario: Block reaches edge but no gap defined there
- **WHEN** block A reaches the right edge but the gap is on the bottom edge
- **THEN** CheckWin SHALL return false
