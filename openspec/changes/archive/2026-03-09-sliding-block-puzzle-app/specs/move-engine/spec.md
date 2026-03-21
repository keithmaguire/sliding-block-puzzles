## ADDED Requirements

### Requirement: A block may slide in a direction if all adjacent cells are free
The system SHALL allow a move in direction D for block B if and only if every cell adjacent to B in direction D is within the board bounding box and is currently unoccupied. The board edge, void-type blocks, other fixed blocks, and other movable blocks all count as impassable. Exception: for `exit`-type win conditions, a block may move beyond the board edge through the defined gap.

#### Scenario: Valid horizontal slide
- **WHEN** TryMove is called with block "A" and direction "right"
- **AND** every cell to the right of block A's cells is within bounds and empty
- **THEN** TryMove SHALL update block A's position one cell to the right and return the new state JSON

#### Scenario: Blocked by board edge
- **WHEN** TryMove is called with block "A" and direction "left"
- **AND** at least one cell to the left of block A is outside the board bounding box
- **THEN** TryMove SHALL return an error string and leave board state unchanged

#### Scenario: Blocked by void block
- **WHEN** TryMove is called with block "A" and direction "down"
- **AND** a cell directly below one of block A's cells is occupied by a void-type block
- **THEN** TryMove SHALL return an error string and leave board state unchanged

### Requirement: Only movable blocks respond to TryMove
The system SHALL return an error when TryMove is called on a block with `movable: false`.

#### Scenario: Attempt to move a fixed block
- **WHEN** TryMove is called with the ID of a fixed block
- **THEN** TryMove SHALL return a non-empty error string

### Requirement: Directions are up, down, left, right
The system SHALL accept exactly four direction strings: `"up"`, `"down"`, `"left"`, `"right"`. Any other value SHALL return an error.

#### Scenario: Invalid direction string
- **WHEN** TryMove is called with direction `"diagonal"`
- **THEN** TryMove SHALL return a non-empty error string

### Requirement: Move count increments on each successful move
The system SHALL increment the move counter by exactly 1 each time TryMove succeeds. Reset and Undo SHALL adjust the counter accordingly.

#### Scenario: Move count after three moves
- **WHEN** three distinct TryMove calls each succeed
- **THEN** GetMoveCount SHALL return 3

#### Scenario: Failed move does not increment counter
- **WHEN** TryMove is called and returns an error
- **THEN** GetMoveCount SHALL remain unchanged

### Requirement: Undo reverses the last successful move
The system SHALL maintain a full move history stack. Undo SHALL restore the board to the state before the most recent successful move and decrement the move count by 1.

#### Scenario: Undo after one move
- **WHEN** one move has been made and Undo is called
- **THEN** the board SHALL return to its initial state and GetMoveCount SHALL return 0

#### Scenario: Undo at initial state
- **WHEN** no moves have been made and Undo is called
- **THEN** Undo SHALL return a non-empty error string and leave state unchanged

### Requirement: Reset restores the puzzle to its initial state
The system SHALL restore all block positions to their load-time values and reset the move count to 0. The move history stack SHALL be cleared.

#### Scenario: Reset after several moves
- **WHEN** Reset is called after any number of moves
- **THEN** GetState SHALL return positions identical to those after LoadPuzzle
- **AND** GetMoveCount SHALL return 0
