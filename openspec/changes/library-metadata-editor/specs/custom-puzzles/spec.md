## MODIFIED Requirements

### Requirement: Custom puzzle collection
The system SHALL maintain a persistent collection of user-created puzzles in localStorage under `sliding-puzzle-custom`.

The collection SHALL store canonical puzzle gameplay data keyed by puzzle `id`, together with local metadata needed for browsing and metadata editing.

Saving a puzzle whose id already exists SHALL replace the existing local record.

#### Scenario: Add to library saves the puzzle
- **WHEN** the user activates Add to Library in Puzzle Authoring
- **THEN** the puzzle SHALL be saved to localStorage with its local metadata
- **AND** it SHALL appear in My Puzzles immediately

#### Scenario: Saving an existing ID replaces it
- **WHEN** the user saves a puzzle whose id already exists
- **THEN** the existing local record SHALL be updated in place

### Requirement: My Puzzles section in the browser
The system SHALL display a My Puzzles section below the built-in library groups when at least one custom puzzle exists.

Each custom puzzle card SHALL provide:
- Click to play
- Edit to open Puzzle Authoring
- Delete with confirmation

The card metadata SHALL be resolved from the custom puzzle's local metadata record rather than from canonical puzzle gameplay JSON.

#### Scenario: My Puzzles section appears after saving
- **WHEN** the user saves their first custom puzzle
- **THEN** a My Puzzles section SHALL appear with that puzzle listed

### Requirement: Library metadata editor includes custom puzzles
The Library Metadata Editor SHALL include local custom puzzles alongside built-in puzzles.

Edits to custom puzzle metadata made there SHALL remain browser-local and SHALL NOT be included in `Export updated index`.

#### Scenario: Custom puzzle appears in metadata editor
- **WHEN** the user opens Edit library metadata after creating a custom puzzle
- **THEN** the custom puzzle SHALL appear as a local row in the metadata editor
- **AND** exporting the built-in index SHALL exclude that row
