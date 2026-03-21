## 1. App View State and Navigation

- [x] 1.1 Replace `activePuzzle: PuzzleJSON | null` in `App.tsx` with a discriminated union view state covering `browser`, `game`, `doc-selector`, and the three doc page types
- [x] 1.2 Implement `DocSelector` component listing all three doc pages with name and description, navigating to the selected page on click
- [x] 1.3 Add a help/docs icon button to `PuzzleBrowser` header that navigates to the doc selector
- [x] 1.4 Add a help/docs icon button to `GameScreen` header that navigates to the doc selector (preserving game view state on return)
- [x] 1.5 Verify round-trip navigation: browser → doc selector → doc page → back → browser, and game → doc page → back → game (state preserved)

## 2. Shared DocPage Layout Component

- [x] 2.1 Implement `DocPage` component with: title prop, Back button (calls `onBack`), scrollable content area, constrained max-width, readable typography (line-height, font-size)
- [x] 2.2 Add a `<code>` / `<pre>` style for code blocks within DocPage content

## 3. How to Play Page

- [x] 3.1 Implement `HowToPlay` component using `DocPage` layout
- [x] 3.2 Write Block Selection section: click/tap to select, visual highlight, click another block to change selection, Escape to deselect
- [x] 3.3 Write Drag Interaction section: drag direction, half-cell commit threshold, snap-back on early release
- [x] 3.4 Write Keyboard Controls section: arrow keys move selected block, shake animation on blocked move, Escape deselects
- [x] 3.5 Write HUD Controls section: move counter, par (when shown), Undo (disabled at zero moves), Reset, Back
- [x] 3.6 Write Win Screen section: win notification appearance, move count, par comparison, Play Again and Back to Browser buttons

## 4. Puzzle Format Reference Page

- [x] 4.1 Implement `PuzzleFormatReference` component using `DocPage` layout
- [x] 4.2 Write index.json section: object schema (id, title, file, optional source/difficulty/par), required vs optional fields, code example
- [x] 4.3 Write Puzzle File top-level fields section: required (id, title, board, blocks, win_condition) and optional (source, difficulty, par)
- [x] 4.4 Write Board section: width/height (integers ≥ 2), irregular shapes via void blocks, code example
- [x] 4.5 Write Blocks section: all fields (id, cells, color, movable, type, label) with types and required indicators, void block behaviour, code example
- [x] 4.6 Write Label section: text vs svg types, value field, SVG coordinate space (~64×64 px), code examples for both
- [x] 4.7 Write Win Conditions section with a subsection for each type: position, multi_position (including word puzzle note), adjacency, exit (including gap axis explanation); each with field table and code example

## 5. App Architecture Page

- [x] 5.1 Implement `AppArchitecture` component using `DocPage` layout
- [x] 5.2 Write Go Core section: model.go (Board, Block, Cell, WinCondition variants, GameState), loader.go (LoadPuzzle, validation), engine.go (CanMove, TryMove, Undo, Reset, GetState, GetMoveCount, CheckWin)
- [x] 5.3 Write WASM Exports section: core/cmd/wasm/main.go, the seven exported functions (loadPuzzle, tryMove, undo, reset, getState, checkWin, getMoveCount) with args and return shapes, JSON envelope format
- [x] 5.4 Write React Layer section: useWasm hook, PuzzleApi typed wrappers, PuzzleBrowser, GameScreen, Board/BlockShape, useGameControls, progress.ts — each with a one-line role description
- [x] 5.5 Write Data Flow section: index.json fetch → puzzle file fetch → loadPuzzle WASM call → Go GameState → getState → JSON → React state → SVG render
- [x] 5.6 Write Build Pipeline section: `make wasm` (Go WASM binary + wasm_exec.js → web/public/), `make build` (npm run build → static web/dist/), `make test` (Go tests), `make serve` (local preview)
