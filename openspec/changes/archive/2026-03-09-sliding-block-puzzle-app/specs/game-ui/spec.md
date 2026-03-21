## ADDED Requirements

### Requirement: Board renders as an SVG element sized to its bounding box
The system SHALL render the game board as an `<svg>` element whose viewBox matches the board's width × height bounding box. The board background renders as a uniform playable surface. Each block is a `<g>` group containing one `<rect>` per occupied cell, plus the block's label fragment (if present).

#### Scenario: Board renders correct cell count
- **WHEN** a puzzle with 3 blocks totalling 7 cells is loaded
- **THEN** the SVG SHALL contain 7 `<rect>` elements across 3 block `<g>` groups (void block rects not counted as game pieces)

#### Scenario: SVG label renders inside block group
- **WHEN** a block has an SVG label
- **THEN** the label fragment SHALL appear as a child of the block's `<g>` element, scaled to fit the block's bounding box

### Requirement: Void blocks render as inactive board area
The system SHALL render void-type blocks visually distinct from playable game pieces — using an inactive fill (e.g. matching the area outside the board, or a dark neutral) with no label, no border highlight, and no interaction affordance.

#### Scenario: Void block renders as background
- **WHEN** a void-type block occupies cells (3,0) and (3,3) on a 4×4 board
- **THEN** those cells render in the inactive style, making the board appear L-shaped or notched

#### Scenario: Void block is not interactive
- **WHEN** the player clicks or drags on a void block's cells
- **THEN** no selection occurs and no drag interaction begins

### Requirement: Drag to move (mouse and touch)
The system SHALL allow the player to drag a movable block using pointer events. The block SHALL snap to grid positions and only move in directions validated by the Go core. On pointer-up with displacement ≥ 0.5 cells, the move commits; otherwise the block snaps back to its original position.

#### Scenario: Successful drag commit
- **WHEN** the player drags block A rightward by more than half a cell width and the move is valid
- **THEN** block A's position updates one cell to the right and the move count increments

#### Scenario: Drag into occupied cell snaps back
- **WHEN** the player drags block A toward an occupied cell
- **THEN** the block SHALL not move past the last valid position and snaps back on release

#### Scenario: Touch drag works identically to mouse drag
- **WHEN** a touch start, touch move, touch end sequence is performed on a block
- **THEN** the block moves identically to the equivalent mouse drag

### Requirement: Keyboard interaction — select and move
The system SHALL allow the player to select a block by clicking/tapping it (a selected block is visually highlighted), then move it with arrow keys. Each arrow key press attempts one cell of movement in that direction.

#### Scenario: Select and move with keyboard
- **WHEN** the player clicks block B then presses the right arrow key
- **THEN** TryMove("B", "right") is called; if valid, block B moves and move count increments

#### Scenario: Arrow key on invalid direction does nothing
- **WHEN** the selected block cannot move in the pressed arrow direction
- **THEN** no move is made and the move count is unchanged; a brief visual indication of the blocked move SHOULD be shown

#### Scenario: Clicking another block changes selection
- **WHEN** block A is selected and the player clicks block C
- **THEN** block C becomes the selected block and block A loses highlight

#### Scenario: Escape key deselects
- **WHEN** a block is selected and the player presses Escape
- **THEN** no block is selected

### Requirement: Keyboard interaction — Shift+Arrow to navigate selection
The system SHALL allow the player to cycle the selection between movable blocks using Shift+Arrow keys, without moving any block. This enables full keyboard-only play.

Selection targeting: given the current selected block's centroid (or the board centre when nothing is selected), the system SHALL pick the nearest movable block whose centroid lies in the pressed direction (i.e. dominantly along that axis). If no candidate exists in that direction, the key press has no effect.

#### Scenario: Shift+Arrow selects adjacent block
- **WHEN** block A is selected and Shift+Right is pressed
- **THEN** the movable block whose centroid is furthest to the right of A (and nearest in the perpendicular axis) becomes selected; no move is made and move count is unchanged

#### Scenario: Shift+Arrow with nothing selected picks nearest block
- **WHEN** no block is selected and Shift+Right is pressed
- **THEN** the leftmost movable block (nearest to the left edge, so most ready to be moved right) becomes selected

#### Scenario: Shift+Arrow with no candidate in that direction does nothing
- **WHEN** the selected block has no other movable block to its right
- **THEN** Shift+Right has no effect and the current selection is unchanged

#### Scenario: Shift+Arrow does not count as a move
- **WHEN** the player presses Shift+Right to change selection
- **THEN** the move count SHALL remain unchanged

### Requirement: Move counter display
The system SHALL display the current move count prominently during gameplay. If the puzzle has a `par` value, it SHALL also be displayed for reference.

#### Scenario: Move count updates after each move
- **WHEN** a move succeeds
- **THEN** the displayed move count increments immediately

#### Scenario: Par displayed when available
- **WHEN** a puzzle has `par: 18`
- **THEN** the UI displays both the current move count and "Par: 18"

### Requirement: Reset button
The system SHALL provide a reset control that calls Reset() on the Go core and re-renders the board at initial positions with move count 0.

#### Scenario: Reset restores board
- **WHEN** the player activates the reset control after 5 moves
- **THEN** all blocks return to initial positions and the move count displays 0

### Requirement: Undo button
The system SHALL provide an undo control that calls Undo() on the Go core and re-renders the board at the previous state.

#### Scenario: Undo reverses last move
- **WHEN** the player activates undo after a move
- **THEN** the board reverts one move and the move count decrements by 1

#### Scenario: Undo disabled at start
- **WHEN** no moves have been made
- **THEN** the undo control SHALL be visually disabled and have no effect when activated

### Requirement: Win notification
The system SHALL display a win notification when CheckWin returns true. The notification SHALL show the final move count and, if a par is set, compare the player's score to par.

#### Scenario: Win state reached
- **WHEN** a move causes CheckWin to return true
- **THEN** the win notification appears showing the move count

#### Scenario: Win with par comparison
- **WHEN** the player solves a puzzle with par 18 in 15 moves
- **THEN** the notification indicates the player beat par

### Requirement: SVG board is touch-action disabled
The system SHALL set `touch-action: none` on the SVG element to prevent browser scroll interference during touch drag.

#### Scenario: Touch drag does not scroll page
- **WHEN** the player touches and drags on the SVG board on a mobile device
- **THEN** the page SHALL NOT scroll during the drag gesture
