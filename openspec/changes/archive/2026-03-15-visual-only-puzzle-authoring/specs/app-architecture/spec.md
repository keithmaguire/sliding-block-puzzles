## MODIFIED Requirements

### Requirement: App Architecture page describes the React layer
The system SHALL describe the React frontend structure:
- `useWasm` hook — loads `wasm_exec.js` and the WASM binary, exposes `status` (`'loading'|'ready'|'error'`) and `PuzzleApi`
- `PuzzleApi` — typed wrappers that call globalThis WASM functions and parse JSON responses
- `PuzzleBrowser` — fetches `index.json`, parses v2 hierarchical or legacy flat format, renders `GroupSection` components recursively, manages custom puzzles and hidden-puzzle state from localStorage
- `GroupSection` — collapsible folder component rendered recursively for nested groups; shows puzzle count when collapsed
- `GameScreen` — orchestrates puzzle lifecycle: load via `loadPuzzle`, move/undo/reset via `PuzzleApi`, win detection, progress recording, and inline setup interactions
- `Board` / `BlockShape` — SVG rendering of grid (64px cell size) and blocks with labels (text or SVG), selection highlight (white 3px border), optional removable-block outlines, shake animation class
- `WinPreview` — small SVG (22px cells) showing the target state derived from the win condition; renders fixed obstacles for concrete goal states
- `useGameControls` — keyboard (Arrow, Shift+Arrow, Escape) and pointer-event drag handling; direction locking; 0.5-cell commit threshold; scale-aware SVG drag
- `PuzzleAuthoring` — visual-only authoring workflow for creating, editing, importing, exporting, testing, and saving puzzles
- `PuzzleEditorVisual` — grid painter; block management; win-condition controls; converts to/from `PuzzleJSON`
- `progress.ts` — localStorage read/write under `sliding-puzzle-progress`
- `customPuzzles.ts` — localStorage CRUD for `sliding-puzzle-custom` and `sliding-puzzle-hidden`

#### Scenario: React components listed
- **WHEN** the user reads the React section
- **THEN** the page SHALL name each major component/hook/module with a one-line description of its role

### Requirement: App Architecture page describes the data flow
The system SHALL include a data flow description covering the path from puzzle selection to gameplay and authoring:
1. `PuzzleBrowser` fetches `index.json` → parses groups → renders `GroupSection` tree
2. User either selects a puzzle to play or opens Puzzle Authoring via Create/Edit
3. Editing an existing puzzle loads `PuzzleJSON` into `PuzzleEditorVisual`; importing JSON validates the payload and replaces the current authoring state
4. `PuzzleAuthoring` exports or saves the current `PuzzleJSON`, and Try It opens the game flow with the authored puzzle
5. `GameScreen` calls `loadPuzzle(jsonString)` → Go `LoadPuzzle` validates and builds `GameState` → returns JSON envelope
6. React stores block positions from the envelope in state → passes to `Board`
7. `Board` renders `BlockShape` per block; `useGameControls` handles interaction
8. On move: `tryMove(id, dir)` → `GameState.TryMove` → new envelope → React state update → re-render
9. On win: `checkWin()` returns true → `recordProgress()` → win notification rendered

#### Scenario: Data flow path described
- **WHEN** the user reads the data flow section
- **THEN** the page SHALL describe the sequence from puzzle selection or authoring through SVG render in sufficient detail to trace a bug through the stack
