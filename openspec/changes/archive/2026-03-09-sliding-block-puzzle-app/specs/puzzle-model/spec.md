## ADDED Requirements

### Requirement: Board is a fixed-size rectangular bounding box
The system SHALL represent the game board as a rectangular grid of integer dimensions (width × height in cells), indexed from (0,0) at top-left. Irregular board shapes are expressed by placing void blocks within the bounding box to mark non-playable areas. The board has no default size; each puzzle defines its own dimensions.

#### Scenario: Board created from puzzle definition
- **WHEN** a puzzle is loaded with `"board": { "width": 5, "height": 4 }`
- **THEN** the board has exactly 5 columns and 4 rows

#### Scenario: Irregular board via void blocks
- **WHEN** a 4×3 board has void blocks placed at (3,0) and (3,2)
- **THEN** the playable area forms an irregular shape with those two cells inactive

### Requirement: Block is a named set of cells with properties
The system SHALL represent each block as a unique ID, a list of occupied cell coordinates (relative to the board origin once placed), a color, a movable flag, and an optional label.

#### Scenario: Block occupies multiple cells
- **WHEN** a block has `"cells": [[0,0],[1,0],[0,1]]`
- **THEN** the block occupies an L-shaped region of 3 cells

#### Scenario: Fixed block cannot move
- **WHEN** a block has `"movable": false`
- **THEN** the block SHALL NOT be movable by any player action

#### Scenario: Block without a label renders without decoration
- **WHEN** a block has `"label": null`
- **THEN** the block renders as a plain colored shape with no text or SVG overlay

### Requirement: Void blocks mark non-playable cells within the board
The system SHALL support a block type `"void"` that marks one or more cells as non-playable area. A void block SHALL always be immovable regardless of its `movable` field, SHALL render with a visually distinct inactive style (not as a colored game piece), and SHALL block movement like any other fixed block. Void blocks MAY have any cell shape, enabling arbitrary irregular board outlines and notches.

#### Scenario: Void block is always immovable
- **WHEN** a block has `"type": "void"`
- **THEN** TryMove on that block SHALL return an error regardless of any `movable` value

#### Scenario: Protrusion modeled by expanding bounding box with void blocks
- **WHEN** a 3×4 board has a 1×2 protrusion on the right modeled as a 4×4 bounding box with void blocks at (3,0) and (3,3)
- **THEN** only cells (3,1) and (3,2) in column 3 are active playable cells

#### Scenario: Notch modeled by void block inside bounding box
- **WHEN** a void block occupies cell (4,0) inside a 5×3 board
- **THEN** cell (4,0) is inactive and no other block may enter it

### Requirement: Block label is either text or an SVG fragment
The system SHALL support two label types on a block: `"text"` (a short string rendered as readable text) and `"svg"` (an arbitrary SVG fragment rendered within the block's bounding box).

#### Scenario: Text label on a block
- **WHEN** a block has `"label": { "type": "text", "value": "A" }`
- **THEN** the letter "A" SHALL be rendered centered within the block

#### Scenario: SVG label on a block
- **WHEN** a block has `"label": { "type": "svg", "value": "<path d='...' />" }`
- **THEN** the SVG fragment SHALL be rendered within the block's bounding box

### Requirement: No two blocks may occupy the same cell
The system SHALL enforce that all blocks' cell lists are disjoint at all times. A puzzle that violates this on load SHALL be rejected with an error.

#### Scenario: Overlapping blocks on load
- **WHEN** a puzzle JSON contains two blocks whose cell lists share a coordinate
- **THEN** LoadPuzzle SHALL return a non-empty error string

### Requirement: All block cells must lie within the board bounding box
The system SHALL reject any puzzle where a block's cell lies outside the board dimensions (col ≥ width, row ≥ height, or any coordinate negative).

#### Scenario: Block cell out of bounds
- **WHEN** a block cell has col ≥ board width or row ≥ board height, or any coordinate is negative
- **THEN** LoadPuzzle SHALL return a non-empty error string
