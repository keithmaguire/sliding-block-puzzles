## ADDED Requirements

### Requirement: App Architecture page describes the Go core layers
The system SHALL provide an App Architecture page that describes the three Go core files: `model.go` (data types: Board, Block, Cell, WinCondition variants, GameState), `loader.go` (JSON deserialisation and validation via LoadPuzzle), and `engine.go` (move logic: CanMove, TryMove, Undo, Reset, GetState, GetMoveCount, CheckWin).

#### Scenario: Go core layers described
- **WHEN** the user navigates to the App Architecture page
- **THEN** the page SHALL describe the purpose of model.go, loader.go, and engine.go in the Go core

### Requirement: App Architecture page describes the WASM export surface
The system SHALL document the WASM module entry point (`core/cmd/wasm/main.go`) and the seven functions it exposes on `globalThis`: `loadPuzzle`, `tryMove`, `undo`, `reset`, `getState`, `checkWin`, `getMoveCount`. It SHALL describe the JSON envelope response format (`ok`, `blocks`, `moveCount`, `won`, `error`).

#### Scenario: WASM exports listed
- **WHEN** the user reads the WASM section
- **THEN** the page SHALL list each exported function with its arguments and return shape

#### Scenario: Response envelope described
- **WHEN** the user reads the WASM section
- **THEN** the page SHALL show the JSON envelope structure shared by all state-returning functions

### Requirement: App Architecture page describes the React layer
The system SHALL describe the React frontend structure:
- `useWasm` hook: loads wasm_exec.js and the WASM binary, exposes `status` and `PuzzleApi`
- `PuzzleApi`: typed wrappers that call globalThis functions and parse JSON responses
- `PuzzleBrowser`: fetches index.json, renders puzzle list with progress indicators
- `GameScreen`: orchestrates puzzle lifecycle (load, move, undo, reset, win detection)
- `Board` / `BlockShape`: SVG rendering of grid and blocks with labels
- `useGameControls`: keyboard and pointer-event drag handling
- `progress.ts`: localStorage read/write under `sliding-puzzle-progress`

#### Scenario: React components listed
- **WHEN** the user reads the React section
- **THEN** the page SHALL name each major component/hook with a one-line description of its role

### Requirement: App Architecture page describes the data flow
The system SHALL include a data flow description covering the path from puzzle JSON file through the system to SVG rendering: index.json fetch → puzzle file fetch → `loadPuzzle` WASM call → `GameState` in Go → `GetState` → JSON response → React state → Board/BlockShape SVG render.

#### Scenario: Data flow path described
- **WHEN** the user reads the data flow section
- **THEN** the page SHALL describe the sequence from puzzle file to rendered SVG in sufficient detail for a developer to trace a bug through the stack

### Requirement: App Architecture page describes the build pipeline
The system SHALL describe the build steps: `make wasm` compiles the Go WASM binary and copies `wasm_exec.js` into `web/public/`; `make build` runs `npm run build` to produce a fully static `web/dist/` containing JS bundles, WASM binary, and puzzle JSON files.

#### Scenario: Build steps documented
- **WHEN** the user reads the build section
- **THEN** the page SHALL explain the make targets and what each produces
