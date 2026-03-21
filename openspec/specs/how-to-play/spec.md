## ADDED Requirements

### Requirement: How to Play page explains setup interactions
The system SHALL explain that some puzzles offer optional setup interactions on the game screen before the first move.

The page SHALL describe:
- inline shuffle when enabled
- clicking highlighted removable blocks when enabled
- that these setup controls appear below the puzzle in the control area
- that runs started this way still count as normal progress

#### Scenario: Inline setup interactions described
- **WHEN** the user reads the setup section
- **THEN** the page SHALL explain shuffle and removable-block choices before the first move

### Requirement: How to Play page explains block selection
The system SHALL explain how to select a block, how the selection highlight appears, and how Escape or clicking empty board area deselects.

#### Scenario: Selection instructions shown
- **WHEN** the user reads the page
- **THEN** it SHALL explain click/tap selection and deselection

### Requirement: How to Play page explains drag interaction
The system SHALL document drag-to-move interaction including:
- half-cell threshold
- additional full-cell steps during a drag
- direction lock after the first committed move
- snap-back on early release
- scale-aware dragging

#### Scenario: Drag rules documented
- **WHEN** the user reads the drag section
- **THEN** the page SHALL describe threshold, direction lock, and snap-back behavior

### Requirement: How to Play page explains keyboard controls
The system SHALL document:
- Arrow keys moving the selected block one step
- blocked-move shake feedback
- Shift+Arrow selection navigation
- Escape deselection

#### Scenario: Keyboard controls documented
- **WHEN** the user reads the keyboard section
- **THEN** the page SHALL explain movement and selection navigation controls

### Requirement: How to Play page explains HUD controls
The system SHALL document:
- move counter and min-moves display
- Undo
- Reset
- Back
- Help

#### Scenario: HUD controls documented
- **WHEN** the user reads the HUD section
- **THEN** the page SHALL explain what each control does

### Requirement: How to Play page explains manual-completion puzzles
The system SHALL explain that some puzzles use `description_only` and therefore rely on player judgment rather than engine-verified state.

The page SHALL explain that these puzzles are completed by the player using a manual confirmation action in the UI.

#### Scenario: Manual-completion puzzles explained
- **WHEN** the user reads the win section
- **THEN** the page SHALL explain player-judged completion and the manual completion action

### Requirement: How to Play page explains the win screen
The system SHALL explain the solved notification, minimum-moves messaging, and the available actions after solving.

#### Scenario: Win notification described
- **WHEN** the user reads the win section
- **THEN** the page SHALL describe the solved message and follow-up actions
