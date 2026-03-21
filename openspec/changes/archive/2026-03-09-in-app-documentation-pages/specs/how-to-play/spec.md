## ADDED Requirements

### Requirement: How to Play page explains block selection
The system SHALL provide a How to Play page that explains how to select a block. It SHALL describe both click/tap selection and the visual highlight that indicates the selected block. It SHALL note that clicking another block changes selection and that Escape deselects.

#### Scenario: Page renders selection instructions
- **WHEN** the user navigates to the How to Play page
- **THEN** the page SHALL display an explanation of click/tap-to-select with a description of the selection highlight

#### Scenario: Escape key behaviour documented
- **WHEN** the user reads the How to Play page
- **THEN** the page SHALL explain that pressing Escape deselects the current block

### Requirement: How to Play page explains drag interaction
The system SHALL document the drag-to-move interaction: touching or clicking a block and dragging it in the intended direction. It SHALL explain that blocks snap to grid positions, that a move commits when the drag exceeds half a cell, and that releasing before that threshold snaps the block back.

#### Scenario: Drag commit threshold explained
- **WHEN** the user reads the drag section
- **THEN** the page SHALL state that dragging more than half a cell width/height in a direction commits the move

#### Scenario: Snap-back behaviour explained
- **WHEN** the user reads the drag section
- **THEN** the page SHALL state that releasing before the threshold snaps the block back without making a move

### Requirement: How to Play page explains keyboard controls
The system SHALL document keyboard interaction: arrow keys move the selected block one step in the pressed direction; if the move is blocked a visual shake indicates failure; Escape deselects.

#### Scenario: Arrow key controls documented
- **WHEN** the user reads the keyboard section
- **THEN** the page SHALL list the four arrow keys and state they move the selected block one step

#### Scenario: Blocked move feedback documented
- **WHEN** the user reads the keyboard section
- **THEN** the page SHALL mention that a brief shake animation indicates a blocked move

### Requirement: How to Play page explains HUD controls
The system SHALL document the game screen controls: move counter (and par when shown), Undo button (reverses the last move, disabled at zero moves), Reset button (returns all blocks to starting positions), and Back button (returns to puzzle browser).

#### Scenario: Move counter explanation
- **WHEN** the user reads the HUD section
- **THEN** the page SHALL explain that the move counter increments on each successful move and that par (when shown) is the target move count

#### Scenario: Undo and Reset explained
- **WHEN** the user reads the HUD section
- **THEN** the page SHALL explain what Undo and Reset do and note that Undo is disabled when no moves have been made

### Requirement: How to Play page explains the win screen
The system SHALL explain what happens when the puzzle is solved: a win notification appears showing the move count, a par comparison if applicable, and buttons to play again or return to the browser.

#### Scenario: Win notification described
- **WHEN** the user reads the win screen section
- **THEN** the page SHALL describe the win notification and mention the "Play Again" and "Back to Browser" options
