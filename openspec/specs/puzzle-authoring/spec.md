## Capability: puzzle-authoring

Visual-only in-app puzzle authoring for creating, editing, importing, exporting, testing, and saving puzzles.

---

## ADDED Requirements

### Requirement: Puzzle Authoring entry points
The system SHALL provide Puzzle Authoring from the puzzle browser through:
- Create new puzzle
- Edit on built-in puzzles
- Edit on custom puzzles

Create SHALL resume the current draft if one exists, otherwise start from a blank puzzle.

#### Scenario: Create resumes current draft
- **GIVEN** an authoring draft already exists
- **WHEN** the user activates Create
- **THEN** Puzzle Authoring SHALL reopen that draft unchanged

### Requirement: Puzzle Authoring is visual-only
The system SHALL provide a visual editor as the only in-app editing interface.

The system SHALL NOT provide:
- custom text notation editing
- visual/text tab switching
- raw JSON editing in-app

#### Scenario: Authoring interface is visual only
- **WHEN** the user enters Puzzle Authoring
- **THEN** the puzzle SHALL be editable entirely through the visual interface

### Requirement: Puzzle Authoring actions
Puzzle Authoring SHALL provide:
- Try It
- Add to Library
- Import JSON
- Export JSON
- Clear Puzzle
- Back

#### Scenario: Back preserves the current draft
- **WHEN** the user activates Back
- **THEN** the app SHALL return to the browser
- **AND** the current authoring draft SHALL remain available

#### Scenario: Try It preserves authoring state
- **WHEN** the user activates Try It
- **THEN** the game screen SHALL load the current authored puzzle
- **AND** returning SHALL restore Puzzle Authoring with its state intact

### Requirement: JSON import replaces current authoring state
Puzzle Authoring SHALL support importing a puzzle from JSON.

A successful import SHALL replace the current authoring state entirely. Failed validation SHALL leave the current state unchanged.

#### Scenario: Successful import replaces current puzzle
- **WHEN** the user imports valid puzzle JSON
- **THEN** Puzzle Authoring SHALL replace the current puzzle with the imported puzzle

### Requirement: Clear Puzzle resets the draft
Puzzle Authoring SHALL provide Clear Puzzle to replace the current draft with the default blank puzzle.

#### Scenario: Clear Puzzle resets the draft
- **WHEN** the user activates Clear Puzzle
- **THEN** the current authoring draft SHALL become the default blank puzzle

### Requirement: Dirty-state confirmation protects destructive replacement
The system SHALL track whether the current draft differs from the last clean state.

Destructive replacement actions SHALL confirm when dirty:
- Import JSON
- Clear Puzzle

Back SHALL be non-destructive and SHALL NOT discard the draft.

#### Scenario: Import prompts when dirty
- **GIVEN** the current draft has unsaved changes
- **WHEN** the user activates Import JSON
- **THEN** the system SHALL confirm before replacing the draft

### Requirement: Full-fidelity visual editing
Puzzle Authoring SHALL be able to represent and edit every supported puzzle construct without requiring manual text editing.

Opening a puzzle and then saving or exporting it SHALL preserve its authored semantics.

#### Scenario: Existing puzzle round-trips without semantic loss
- **GIVEN** a valid puzzle is opened in Puzzle Authoring
- **WHEN** the user exports or saves it without changing its meaning
- **THEN** the resulting puzzle SHALL preserve board, blocks, appearance, movability, win condition, and setup options

#### Scenario: Immovable background-colored blocks round-trip correctly
- **GIVEN** a puzzle contains an immovable plain block with `appearance.color = "background"`
- **WHEN** the user opens and re-exports it from Puzzle Authoring
- **THEN** the block SHALL remain immovable and retain its background color

### Requirement: JSON is the only in-app interchange format
The system SHALL use `PuzzleJSON` as the only import/export format exposed within Puzzle Authoring.

#### Scenario: Import and export are JSON only
- **WHEN** the user imports or exports from Puzzle Authoring
- **THEN** the format SHALL be JSON only

### Requirement: Exported puzzle JSON is gameplay-only
Puzzle Authoring SHALL export canonical gameplay `PuzzleJSON` only.

Browse-time metadata for shipped puzzles SHALL be maintained separately in `puzzles/index.json`.

#### Scenario: Exported puzzle requires separate index maintenance
- **WHEN** the user exports a puzzle from Puzzle Authoring for the built-in library
- **THEN** the JSON SHALL contain gameplay data only
- **AND** the built-in index row SHALL be added or updated separately through the app-managed metadata editor
