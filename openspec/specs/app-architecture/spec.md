## ADDED Requirements

### Requirement: App Architecture page describes the Go core layers
The system SHALL provide an App Architecture page that describes the three Go core files:
- `model.go` — data types for board state, blocks, appearance, directions, and win-condition implementations used by the engine; the public contract is described in `puzzle-json-contract`
- `loader.go` — `LoadPuzzle(data []byte)` parsing JSON into `GameState`; validation of required fields, board dimensions, block bounds, overlaps, appearance structure, selector-based targets, and win-condition structure
- `engine.go` — `CanMove`, `TryMove`, `Undo`, `Reset`, `GetState`, `GetMoveCount`, and `CheckWin`

#### Scenario: Go core layers described
- **WHEN** the user navigates to the App Architecture page
- **THEN** the page SHALL describe the purpose of model.go, loader.go, and engine.go

### Requirement: App Architecture page describes the WASM export surface
The system SHALL document the WASM module entry point and the exported functions `loadPuzzle`, `tryMove`, `undo`, `reset`, `getState`, `checkWin`, and `getMoveCount`.

#### Scenario: WASM exports listed
- **WHEN** the user reads the WASM section
- **THEN** the page SHALL list each exported function with its arguments and return shape

### Requirement: App Architecture page describes the React layer
The system SHALL describe the React frontend structure:
- `useWasm`
- `PuzzleApi`
- `puzzleTypes.ts`
- `PuzzleBrowser`
- `GroupSection`
- `GameScreen`
- `Board` / `BlockShape`
- `WinPreview`
- `useGameControls`
- `PuzzleAuthoring`
- `PuzzleEditorVisual`
- `progress.ts`
- `customPuzzles.ts`

The descriptions SHALL reflect:
- visual-only authoring
- JSON import/export
- inline setup interactions before the first move
- manual completion for `description_only`

#### Scenario: React components listed
- **WHEN** the user reads the React section
- **THEN** the page SHALL name each major component, hook, or module with a one-line description of its role

### Requirement: App Architecture page describes the data flow
The system SHALL include a data flow description covering the path from puzzle selection or authoring to gameplay:
1. `PuzzleBrowser` fetches and parses the v3 flat index format with registries and puzzle rows
2. User either selects a puzzle to play or opens Puzzle Authoring via Create/Edit
3. Editing or importing loads `PuzzleJSON` into `PuzzleEditorVisual`
4. Puzzle Authoring saves, exports, or Try It hands the current `PuzzleJSON` to gameplay
5. `GameScreen` calls `loadPuzzle`
6. React stores returned block positions and renders `Board`
7. `useGameControls` drives movement
8. Win detection and progress recording update browser state

#### Scenario: Data flow path described
- **WHEN** the user reads the data-flow section
- **THEN** the page SHALL describe the sequence from puzzle selection or authoring through gameplay render

### Requirement: App Architecture page describes the build pipeline
The system SHALL describe how the Go core is built to WebAssembly and then bundled into the static web build.

The documented workflow SHALL NOT describe a CLI step that regenerates `puzzles/index.json`.

#### Scenario: Build steps documented
- **WHEN** the user reads the build section
- **THEN** the page SHALL explain the WASM build and web build steps
- **AND** it SHALL describe built-in index maintenance as an in-app workflow
