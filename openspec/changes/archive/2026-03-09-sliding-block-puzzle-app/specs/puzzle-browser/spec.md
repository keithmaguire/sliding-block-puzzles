## ADDED Requirements

### Requirement: Puzzle browser lists all available puzzles
The system SHALL fetch `puzzles/index.json` on startup and display a browsable list or grid of all puzzles, showing at minimum: title, source reference (if present), difficulty (if present), solved indicator, and best move count (if solved).

#### Scenario: Browser shows all puzzles from index
- **WHEN** index.json contains 42 puzzle entries
- **THEN** the browser displays 42 puzzle items

#### Scenario: Solved puzzle shows checkmark and best move count
- **WHEN** a puzzle has been solved and its progress is stored in localStorage
- **THEN** its browser entry displays a solved indicator and the player's best move count

#### Scenario: Unsolved puzzle shows no progress indicator
- **WHEN** a puzzle has no stored progress
- **THEN** its browser entry shows no solved indicator

### Requirement: Selecting a puzzle loads the game screen
The system SHALL navigate to the game screen and load the selected puzzle when the player activates a puzzle entry.

#### Scenario: Player selects a puzzle
- **WHEN** the player clicks or taps a puzzle entry in the browser
- **THEN** the game screen appears with that puzzle loaded and ready to play

### Requirement: Back navigation from game screen to browser
The system SHALL provide a way to return to the puzzle browser from the game screen without losing progress data.

#### Scenario: Player returns to browser mid-puzzle
- **WHEN** the player activates the back control during a puzzle
- **THEN** the puzzle browser is shown; the in-progress puzzle state is NOT persisted (only solved state is)

### Requirement: Puzzle browser shows loading state
The system SHALL display a loading indicator while `puzzles/index.json` is being fetched.

#### Scenario: Index loading
- **WHEN** the app starts and the index fetch is in progress
- **THEN** a loading indicator is displayed instead of the puzzle list
