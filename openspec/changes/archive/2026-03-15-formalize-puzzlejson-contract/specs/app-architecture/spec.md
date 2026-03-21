## MODIFIED Requirements

### Requirement: App Architecture page describes the Go core layers
The system SHALL provide an App Architecture page that describes the three Go core files:
- `model.go` — data types: `Board`, `Cell`, `Block`, `BlockType`, `Label`, `LabelType`, `Direction`, `GameState`; the public win condition types (`PositionCondition`, `MultiPositionCondition`, `AdjacencyCondition`, `ShapePositionCondition`, `AnyOfCondition`, `DescriptionOnlyCondition`) each implementing the `WinCondition` interface; `normaliseShape` and `shapesEqual` helpers for shape matching; `CheckWin` delegating to the active condition
- `loader.go` — `LoadPuzzle(data []byte)` parsing JSON into `GameState`; validation of required fields, board dimensions, block cell bounds, block overlaps, label types, and win condition structure; support for canonical `win_condition` and compatibility `win_conditions`
- `engine.go` — `CanMove`, `TryMove` (with undo snapshot), `Undo`, `Reset`, `GetState`, `GetMoveCount`, `CheckWin`

#### Scenario: Go core layers described
- **WHEN** the user navigates to the App Architecture page
- **THEN** the page SHALL describe the purpose of model.go, loader.go, and engine.go

### Requirement: App Architecture page describes the React layer
The system SHALL describe the React frontend structure:
- `useWasm` hook — loads `wasm_exec.js` and the WASM binary, exposes `status` (`'loading'|'ready'|'error'`) and `PuzzleApi`
- `PuzzleApi` — typed wrappers that call globalThis WASM functions and parse JSON responses
- `PuzzleBrowser` — fetches `index.json`, parses v2 hierarchical or legacy flat format, renders `GroupSection` components recursively, manages custom puzzles and hidden-puzzle state from localStorage
- `GroupSection` — collapsible folder component rendered recursively for nested groups; shows puzzle count when collapsed
- `GameScreen` — orchestrates puzzle lifecycle: load via `loadPuzzle`, move/undo/reset via `PuzzleApi`, win detection, progress recording, inline setup interactions, and manual completion for `description_only` puzzles
- `Board` / `BlockShape` — SVG rendering of grid (64px cell size) and blocks with labels (text or SVG), selection highlight (white 3px border), optional removable-block outline, shake animation class
- `WinPreview` — small SVG (22px cells) showing the target state derived from the win condition where a preview is engine-derivable
- `useGameControls` — keyboard (Arrow, Shift+Arrow, Escape) and pointer-event drag handling; direction locking; 0.5-cell commit threshold; scale-aware SVG drag
- `PuzzleJSON` TypeScript types — frontend representation of the canonical puzzle format, including advanced win conditions and authoring-related fields
- `progress.ts` — localStorage read/write under `sliding-puzzle-progress`
- `customPuzzles.ts` — localStorage CRUD for `sliding-puzzle-custom` and `sliding-puzzle-hidden`

#### Scenario: React components listed
- **WHEN** the user reads the React section
- **THEN** the page SHALL name each major component/hook/module with a one-line description of its role
