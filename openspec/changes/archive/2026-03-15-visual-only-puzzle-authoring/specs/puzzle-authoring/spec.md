## ADDED Requirements

### Requirement: Puzzle Authoring entry points
The system SHALL provide a Puzzle Authoring workflow accessible from the puzzle browser.

The browser SHALL provide:
- **Create** — opens Puzzle Authoring with the current authoring draft, or a blank puzzle if no draft exists yet
- **Edit** on built-in puzzles — opens the selected built-in puzzle in Puzzle Authoring
- **Edit** on custom puzzles — opens the selected custom puzzle in Puzzle Authoring

#### Scenario: First Create opens blank authoring state
- **GIVEN** no authoring draft currently exists
- **WHEN** the user activates Create from the puzzle browser
- **THEN** Puzzle Authoring SHALL open with the default blank puzzle state

#### Scenario: Create resumes the current authoring draft
- **GIVEN** an authoring draft currently exists
- **WHEN** the user activates Create from the puzzle browser
- **THEN** Puzzle Authoring SHALL open with that current draft unchanged

#### Scenario: Editing built-in puzzle opens authoring with puzzle loaded
- **WHEN** the user activates Edit on a built-in puzzle
- **THEN** Puzzle Authoring SHALL open with that built-in puzzle fully loaded

#### Scenario: Editing custom puzzle opens authoring with puzzle loaded
- **WHEN** the user activates Edit on a custom puzzle
- **THEN** Puzzle Authoring SHALL open with that custom puzzle fully loaded

### Requirement: Puzzle Authoring is visual-only
The system SHALL provide a visual editor as the only in-app puzzle editing interface.

The system SHALL NOT provide:
- a custom text-notation editor
- visual/text tab switching
- a raw JSON editor

#### Scenario: Authoring interface is visual only
- **WHEN** the user enters Puzzle Authoring
- **THEN** the current puzzle SHALL be editable entirely through the visual interface

### Requirement: Puzzle Authoring actions
Puzzle Authoring SHALL provide the following actions:
- **Try It**
- **Add to Library**
- **Import JSON**
- **Export JSON**
- **Clear Puzzle**
- **Back**

#### Scenario: Try It preserves authoring state
- **WHEN** the user activates Try It from Puzzle Authoring
- **THEN** the game screen SHALL load the current authored puzzle
- **AND** returning from the game SHALL restore Puzzle Authoring with its state intact

#### Scenario: Back preserves the current authoring draft
- **WHEN** the user activates Back from Puzzle Authoring
- **THEN** the app SHALL return to the puzzle browser
- **AND** the current Puzzle Authoring draft SHALL remain available the next time Puzzle Authoring is opened

#### Scenario: Export JSON downloads current puzzle
- **WHEN** the user activates Export JSON from Puzzle Authoring
- **THEN** the browser SHALL download the current puzzle as a JSON file named `<id>.json`

### Requirement: JSON import replaces current authoring state
Puzzle Authoring SHALL support importing a puzzle from JSON.

A successful import SHALL replace the current authoring state entirely. The system SHALL NOT merge imported puzzle data with the existing authoring state.

#### Scenario: Successful import replaces current puzzle
- **WHEN** the user imports valid puzzle JSON
- **THEN** Puzzle Authoring SHALL replace the current puzzle with the imported puzzle

#### Scenario: Invalid import preserves current puzzle
- **GIVEN** Puzzle Authoring currently contains a puzzle
- **WHEN** the user attempts to import invalid JSON or invalid puzzle data
- **THEN** the system SHALL show a validation error
- **AND** the current authoring state SHALL remain unchanged

### Requirement: Clear Puzzle resets the current draft
Puzzle Authoring SHALL provide a Clear Puzzle action that resets the current authoring draft to the default blank puzzle state.

#### Scenario: Clear Puzzle resets the draft
- **WHEN** the user activates Clear Puzzle from Puzzle Authoring
- **THEN** the current authoring draft SHALL be replaced with the default blank puzzle state
- **AND** that blank puzzle SHALL become the current persisted authoring draft

### Requirement: Dirty-state confirmation protects destructive replacement
The system SHALL track whether the current Puzzle Authoring state differs from the initially opened, last successfully imported, or last explicitly cleared puzzle state.

If the user attempts an action that would discard unsaved authoring changes, the system SHALL require confirmation before proceeding.

Discarding actions include:
- **Import JSON**
- **Clear Puzzle**

#### Scenario: Import prompts when authoring state is dirty
- **GIVEN** the current Puzzle Authoring state has unsaved changes
- **WHEN** the user activates Import JSON
- **THEN** the system SHALL show a confirmation prompt before replacing the current puzzle

#### Scenario: Cancelled confirmation preserves current state
- **GIVEN** a destructive-action confirmation is shown
- **WHEN** the user cancels
- **THEN** Puzzle Authoring SHALL remain open
- **AND** the current authoring state SHALL remain unchanged

#### Scenario: Clean state does not prompt
- **GIVEN** the current Puzzle Authoring state matches the initially opened, last successfully imported, or last explicitly cleared puzzle state
- **WHEN** the user activates Import JSON or Clear Puzzle
- **THEN** the action SHALL proceed without a dirty-state confirmation prompt

### Requirement: Full-fidelity visual editing
Puzzle Authoring SHALL be able to represent and edit every supported puzzle construct without requiring manual text editing.

Opening a puzzle in Puzzle Authoring and then saving or exporting it SHALL preserve the authored puzzle semantics.

#### Scenario: Existing puzzle round-trips through authoring without semantic loss
- **GIVEN** a valid puzzle is opened in Puzzle Authoring
- **WHEN** the user exports or saves it without changing its meaning
- **THEN** the resulting puzzle SHALL preserve its board, blocks, colors, labels, movability, win condition, setup options, and metadata

### Requirement: JSON is the only in-app interchange format
The system SHALL use `PuzzleJSON` as the only import/export format exposed within Puzzle Authoring.

#### Scenario: Import and export are JSON only
- **WHEN** the user uses Puzzle Authoring import or export actions
- **THEN** the format SHALL be JSON
- **AND** no alternate in-app text notation format SHALL be offered
