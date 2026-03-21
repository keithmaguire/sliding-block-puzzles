## ADDED Requirements

### Requirement: Solved state is persisted to localStorage on win
The system SHALL write to localStorage when a puzzle is solved. The stored entry SHALL include the puzzle ID and the move count at the time of solving.

#### Scenario: Solve a puzzle for the first time
- **WHEN** CheckWin returns true for puzzle "h-042" with move count 15
- **THEN** localStorage SHALL contain an entry for "h-042" with `{ "solved": true, "bestMoves": 15 }`

### Requirement: Best move count updates when player beats their previous score
The system SHALL update the stored best move count when the player solves a puzzle with fewer moves than their previous best.

#### Scenario: Player beats their record
- **WHEN** puzzle "h-042" is already stored with bestMoves: 15
- **AND** the player solves it again with 12 moves
- **THEN** localStorage SHALL update "h-042" to `{ "solved": true, "bestMoves": 12 }`

#### Scenario: Player does not beat their record
- **WHEN** the player solves with more moves than the stored best
- **THEN** the stored best move count SHALL remain unchanged

### Requirement: Progress is loaded from localStorage on startup
The system SHALL read all stored progress from localStorage when the app initialises, making it available to the puzzle browser before any puzzle is loaded.

#### Scenario: Returning player sees previous progress
- **WHEN** the player reopens the app after having solved some puzzles
- **THEN** the puzzle browser immediately shows solved indicators without requiring any additional action

### Requirement: Progress is stored under a namespaced localStorage key
The system SHALL store all progress data under a single key (e.g., `"sliding-puzzle-progress"`) as a JSON object mapping puzzle ID to progress entry. This avoids polluting the localStorage namespace.

#### Scenario: Progress stored under correct key
- **WHEN** a puzzle is solved
- **THEN** `localStorage.getItem("sliding-puzzle-progress")` returns a JSON object containing the puzzle's entry
