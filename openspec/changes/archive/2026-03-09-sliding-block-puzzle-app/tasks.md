## 1. Project Scaffolding

- [ ] 1.1 Initialise Go module (`go mod init`) in `core/`
- [ ] 1.2 Scaffold Vite + React + TypeScript project in `web/`
- [ ] 1.3 Configure Vite to serve WASM assets and copy `wasm_exec.js`
- [ ] 1.4 Add `puzzles/` directory with placeholder `index.json`
- [ ] 1.5 Add `.gitignore` entries for build outputs (`web/dist/`, `core/*.wasm`)

## 2. Go Core — Data Model

- [ ] 2.1 Define `Board` struct (width, height)
- [ ] 2.2 Define `Block` struct (id, type, cells []Cell, color, movable, label)
- [ ] 2.3 Define `Label` struct with type discriminator (text / svg) and value
- [ ] 2.4 Define `WinCondition` interface and concrete types for all 5 win condition types
- [ ] 2.5 Define `GameState` struct (board, blocks map, move count, move history stack)

## 3. Go Core — Puzzle Loading

- [ ] 3.1 Implement JSON deserialisation for puzzle files into internal model (including block type field)
- [ ] 3.2 Validate: no overlapping blocks, all block cells within board bounding box
- [ ] 3.3 Validate: label type is "text" or "svg" when present
- [ ] 3.4 Validate: win_condition type is one of the four known types
- [ ] 3.5 Return descriptive error strings for all validation failures

## 4. Go Core — Move Engine

- [ ] 4.1 Implement `CanMove(blockID, direction)` — checks adjacent cells are within bounding box and not occupied (void blocks, fixed blocks, and other movable blocks all block movement)
- [ ] 4.2 Implement `TryMove(blockID, direction)` — validates, applies move, pushes to history, returns new state JSON
- [ ] 4.3 Implement `Undo()` — pops history stack, restores previous positions, decrements move count
- [ ] 4.4 Implement `Reset()` — restores initial block positions, clears history, resets move count
- [ ] 4.5 Implement `GetState()` — serialises current board state to JSON
- [ ] 4.6 Implement `GetMoveCount()` — returns current move count

## 5. Go Core — Win Condition Evaluators

- [ ] 5.1 Implement `position` evaluator
- [ ] 5.2 Implement `multi_position` evaluator (handles word puzzles implicitly via labeled blocks at target positions)
- [ ] 5.3 Implement `adjacency` evaluator
- [ ] 5.4 Implement `exit` evaluator (block cells outside board boundary through specified gap)
- [ ] 5.5 Implement `CheckWin()` — dispatches to correct evaluator based on loaded win condition type

## 6. Go Core — WASM Exports

- [ ] 6.1 Write `main_wasm.go` exporting `LoadPuzzle`, `TryMove`, `GetState`, `Reset`, `Undo`, `CheckWin`, `GetMoveCount` via `js.Global().Set`
- [ ] 6.2 Ensure all exported functions return strings (state JSON or error) or numbers
- [ ] 6.3 Build WASM binary (`GOARCH=wasm GOOS=js go build`) and verify it loads in browser

## 7. Go Core — Tests

- [ ] 7.1 Unit tests for puzzle loading (valid, overlapping blocks, out-of-bounds, bad label type, unknown win type)
- [ ] 7.2 Unit tests for move engine (valid moves, blocked moves, undo, reset, move count)
- [ ] 7.3 Unit tests for each of the 4 win condition evaluators
- [ ] 7.4 Integration test: load a complete sample puzzle, play to win, verify CheckWin

## 8. Puzzle Format — Sample Puzzles

- [ ] 8.1 Write `puzzles/index.json` schema and 2–3 sample puzzles covering different win condition types
- [ ] 8.2 Write one puzzle using `multi_position` with text-labeled blocks whose target positions spell a word
- [ ] 8.3 Write one puzzle using an `adjacency` win condition
- [ ] 8.4 Write one puzzle using a block with an SVG label (arc or line)
- [ ] 8.5 Document the puzzle JSON format in a `puzzles/README.md` for authoring future puzzles

## 9. React — WASM Integration Layer

- [ ] 9.1 Write `useWasm` hook that loads `wasm_exec.js` and the WASM binary, exposes ready state
- [ ] 9.2 Write typed wrapper functions for each WASM export (`loadPuzzle`, `tryMove`, `getState`, `reset`, `undo`, `checkWin`, `getMoveCount`)
- [ ] 9.3 Define TypeScript types for state JSON shape returned from Go

## 10. React — Puzzle Browser Screen

- [ ] 10.1 Implement `PuzzleBrowser` component that fetches and displays `puzzles/index.json`
- [ ] 10.2 Show loading indicator while index is fetching
- [ ] 10.3 Render puzzle list with title, source, difficulty, solved indicator, best move count
- [ ] 10.4 Read progress from localStorage (`sliding-puzzle-progress` key) to populate solved state
- [ ] 10.5 Navigate to game screen on puzzle selection, passing puzzle id

## 11. React — SVG Game Board

- [ ] 11.1 Implement `Board` component rendering a `<svg>` with viewBox matching board bounding box
- [ ] 11.2 Implement `BlockShape` component rendering a `<g>` with one `<rect>` per cell, styled with block color
- [ ] 11.3 Render void-type blocks with inactive fill style; suppress interaction (no pointer events, no selection)
- [ ] 11.3 Render text labels centered within block bounding box
- [ ] 11.4 Render SVG labels as inline SVG within block bounding box, scaled to fit
- [ ] 11.5 Apply `touch-action: none` to the SVG element
- [ ] 11.6 Highlight the selected block visually (e.g., stroke or brightness)

## 12. React — Drag Interaction

- [ ] 12.1 Implement pointer-down handler: record active block and pointer start position
- [ ] 12.2 Implement pointer-move handler: compute Δx/Δy, determine intended direction, render block at nearest valid grid position along that axis
- [ ] 12.3 Call `CanMove` equivalent (or attempt TryMove speculatively) to constrain drag to valid positions
- [ ] 12.4 Implement pointer-up handler: commit move if displacement ≥ 0.5 cells, else snap back
- [ ] 12.5 Ensure drag works for both mouse and touch (single Pointer Events handler)

## 13. React — Keyboard Interaction

- [ ] 13.1 Implement click-to-select: clicking a block sets it as the selected block
- [ ] 13.2 Implement arrow key handler: calls `tryMove` with selected block and direction
- [ ] 13.3 Show brief visual feedback on blocked move (e.g., shake animation)
- [ ] 13.4 Implement Escape key to deselect current block
- [ ] 13.5 Disable keyboard handler when no block is selected

## 14. React — Game Screen HUD

- [ ] 14.1 Display current move count, updating after every move
- [ ] 14.2 Display par move count when the puzzle provides one
- [ ] 14.3 Implement Reset button wired to `reset()` WASM call
- [ ] 14.4 Implement Undo button wired to `undo()` WASM call; disable when move count is 0
- [ ] 14.5 Implement Back button returning to the puzzle browser

## 15. React — Win State and Progress Persistence

- [ ] 15.1 After every `tryMove`, call `checkWin`; if true, show win notification with move count
- [ ] 15.2 Win notification shows par comparison when par is set
- [ ] 15.3 On win, write/update `sliding-puzzle-progress` in localStorage (update bestMoves only if improved)
- [ ] 15.4 Win notification provides buttons: Back to Browser, Play Again (reset)

## 16. Build and Deployment

- [ ] 16.1 Write Makefile (or shell script) to build Go WASM and copy into `web/public/`
- [ ] 16.2 Verify `npm run build` produces a fully static `dist/` with WASM, JS, and puzzle JSON files
- [ ] 16.3 Test the production build with a local static file server
- [ ] 16.4 Document build steps in `README.md`
