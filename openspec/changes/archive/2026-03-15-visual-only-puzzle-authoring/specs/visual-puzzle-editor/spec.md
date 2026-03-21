## MODIFIED Requirements

### Requirement: Visual editor is the default mode of the Puzzle Creator
The system SHALL open the Puzzle Creator in its visual editor. The visual editor SHALL display a 5×4 grid as the initial empty canvas.

#### Scenario: Visual editor shown on first open
- **WHEN** the user opens the Puzzle Creator
- **THEN** the visual editor SHALL be shown immediately
- **AND** a 5×4 empty grid SHALL be rendered

### Requirement: Tool bar
The visual editor SHALL provide a tool bar with the following tools:
- **Erase** — clears painted cells
- **Fixed** — paints fixed obstacle cells
- **Per-block buttons** — one button per block in the puzzle, labeled with the block's letter and a colored square; clicking selects that block as the active tool and opens its config panel
- **+ Block** — creates a new block with the next available letter (A, B, C…, up to Z) and the next color from the 8-color palette, selects it as the active tool

The active tool SHALL be visually highlighted (gold border).

#### Scenario: Clicking a block tool selects it and opens config panel
- **WHEN** the user clicks a block's tool button
- **THEN** the tool SHALL become active (gold border)
- **AND** the block config panel SHALL open on the right

#### Scenario: + Block assigns next available letter
- **WHEN** the user clicks + Block with blocks A and B already existing
- **THEN** a new block C SHALL be created and selected

### Requirement: Grid painting
The visual editor SHALL render the grid as a rectangular array of cells (40×40px each) with faint dividers. The user SHALL be able to paint cells by:
- **Click** — paint the clicked cell with the active tool
- **Click and drag** — paint all cells traversed while the mouse button is held

The active phase (Start Grid or Win Grid) determines which grid is being painted.

Start Grid painting rules:
- Erase → sets cell to empty
- Fixed → sets cell to an immovable occupied cell
- Block tool → sets cell to that block's letter

Win Grid painting rules:
- Erase / Fixed → sets cell to `?` (don't-care)
- Block tool in `position` mode → clears all previous instances of this block in the win grid, then paints the block's shape starting at the clicked cell's position
- Block tool in `multi_position` mode → sets individual cell to block letter

#### Scenario: Painting a block on Start Grid fills the cell
- **WHEN** the user clicks a cell with a block tool active and Start Grid selected
- **THEN** the clicked cell SHALL display the block's color and letter

#### Scenario: Dragging paints multiple cells
- **WHEN** the user presses on a cell and drags across several cells
- **THEN** all traversed cells SHALL be painted with the active tool

### Requirement: Visual state to PuzzleJSON conversion
The system SHALL implement a `visualStateToPuzzleJSON(state)` function that converts the visual editor's internal state to a valid `PuzzleJSON`. The conversion SHALL:
1. Gather each block's cells from the start grid
2. Group fixed cells into connected components → fixed blocks (`__fx0`, `__fx1`, …)
3. Build the win condition from `winType` + supporting fields
4. For `shape_position`: derive the shape by normalising the reference block's current cells

#### Scenario: Puzzle with two blocks converts correctly
- **GIVEN** a visual state with blocks A (2 cells) and B (3 cells) on the start grid
- **WHEN** `visualStateToPuzzleJSON` is called
- **THEN** the resulting PuzzleJSON SHALL have exactly two movable blocks with the correct cell arrays

### Requirement: PuzzleJSON to visual state conversion
The system SHALL implement a `puzzleJSONToVisualState(puzzle)` function that reconstructs the visual editor state from a `PuzzleJSON`. Block IDs that are single uppercase letters are used as-is; others are remapped to the next available letter. Fixed blocks are reconstructed from their cells.

#### Scenario: Loading an existing puzzle into the visual editor reflects its structure
- **GIVEN** an existing puzzle is loaded into the visual editor
- **WHEN** the visual editor renders
- **THEN** the grid SHALL show the correct block positions
- **AND** the win condition controls SHALL reflect the puzzle's win type
