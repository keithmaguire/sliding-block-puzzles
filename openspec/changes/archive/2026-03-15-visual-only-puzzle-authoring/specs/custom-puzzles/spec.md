## MODIFIED Requirements

### Requirement: Custom puzzle collection
The system SHALL maintain a persistent collection of user-created puzzles in localStorage under the key `sliding-puzzle-custom`. The collection stores complete `PuzzleJSON` objects. Puzzles are identified by their `id` field; saving a puzzle whose `id` already exists in the collection replaces the existing entry.

#### Scenario: "Add to library" saves the puzzle
- **WHEN** the user activates "Add to library" in Puzzle Authoring
- **THEN** the puzzle SHALL be saved to localStorage
- **AND** it SHALL appear in the "My Puzzles" section of the browser immediately

#### Scenario: Saving an existing ID replaces it
- **WHEN** the user saves a puzzle whose id already exists in the collection
- **THEN** the existing entry SHALL be updated in place (not duplicated)

### Requirement: My Puzzles section in the browser
The system SHALL display a "My Puzzles" section in the Puzzle Browser below the library groups. This section SHALL only appear when at least one custom puzzle exists. Each custom puzzle SHALL be shown as a `PuzzleCard` with the same difficulty stars, min_moves badge, and solved badge as library puzzles.

Each custom puzzle card SHALL provide:
- **Click** — load and play the puzzle
- **Edit button** — open the puzzle in Puzzle Authoring for editing
- **Delete button** — remove the puzzle from the collection (two-phase confirmation)

#### Scenario: My Puzzles section appears after saving
- **WHEN** the user saves their first custom puzzle
- **THEN** a "My Puzzles" section SHALL appear in the browser with that puzzle listed

#### Scenario: Delete requires two-phase confirmation
- **WHEN** the user clicks the delete button on a custom puzzle
- **THEN** a confirmation prompt SHALL appear
- **AND** only after confirming SHALL the puzzle be removed
