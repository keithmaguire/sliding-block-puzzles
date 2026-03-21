## Capability: custom-puzzles

User-created puzzles and progress tracking. Users can save puzzles to a personal collection stored in the browser, manage library visibility, and track solve history across sessions.

---

## ADDED Requirements

### Requirement: Custom puzzle collection
The system SHALL maintain a persistent collection of user-created puzzles in localStorage under `sliding-puzzle-custom`.

The collection stores records keyed by puzzle `id` with:
- canonical gameplay `PuzzleJSON`
- browser-local metadata for title, source, difficulty, and group reference

Saving a puzzle whose id already exists SHALL replace the existing entry.

#### Scenario: Add to library saves the puzzle
- **WHEN** the user activates Add to Library in Puzzle Authoring
- **THEN** the puzzle SHALL be saved to localStorage and appear in My Puzzles immediately

#### Scenario: Saving an existing ID replaces it
- **WHEN** the user saves a puzzle whose id already exists
- **THEN** the existing entry SHALL be updated in place

### Requirement: My Puzzles section in the browser
The system SHALL display a My Puzzles section below the library groups when at least one custom puzzle exists.

Each custom puzzle card SHALL provide:
- Click to play
- Edit to open Puzzle Authoring
- Delete with confirmation

#### Scenario: My Puzzles section appears after saving
- **WHEN** the user saves their first custom puzzle
- **THEN** a My Puzzles section SHALL appear with that puzzle listed

### Requirement: Hide library puzzles
The system SHALL allow users to hide built-in puzzles and later restore them from a hidden-puzzles section.

#### Scenario: Hidden puzzle disappears from browser
- **WHEN** the user hides a library puzzle
- **THEN** the puzzle SHALL no longer appear in its group

### Requirement: Solve progress tracking
The system SHALL record puzzle completion history in localStorage under `sliding-puzzle-progress`.

The stored progress SHALL track solved state and best move count by puzzle id.

Progress SHALL be recorded normally for:
- ordinary solves
- solves after shuffle
- solves after removable-block choices

#### Scenario: Solving a puzzle records progress
- **WHEN** the user solves a puzzle
- **THEN** progress SHALL record solved state and move count for that puzzle

#### Scenario: Setup-based solve updates progress normally
- **WHEN** the player solves a puzzle after inline setup choices before the first move
- **THEN** progress SHALL be updated using the same rules as any other solve

### Requirement: Progress displayed on puzzle cards
The system SHALL display solve progress on each puzzle card in the browser.

#### Scenario: Solved puzzle shows badge
- **WHEN** the user views the browser after solving a puzzle
- **THEN** that puzzle's card SHALL show the best move badge

### Requirement: Win notification shows minimum-move comparison
The system SHALL display solved messaging with:
- solved move count
- exact minimum-moves celebration only when `moveCount === min_moves`
- otherwise the minimum shown as reference

#### Scenario: Exact minimum moves achievement shown
- **WHEN** the player solves a puzzle in exactly `min_moves`
- **THEN** the win notification SHALL display the minimum-moves achievement message

### Requirement: localStorage keys are isolated
The system SHALL use distinct localStorage keys for progress, custom puzzles, and hidden puzzle ids.

Read errors SHALL be caught and treated as empty collections.

#### Scenario: Corrupted localStorage does not crash the app
- **GIVEN** corrupted JSON in a localStorage key
- **WHEN** the app loads
- **THEN** the affected collection SHALL be treated as empty and the app SHALL continue functioning
