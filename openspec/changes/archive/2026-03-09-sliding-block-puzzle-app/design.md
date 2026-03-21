## Context

New project implementing Edward Hornden's *Sliding Blocks Puzzles* as a web application. No existing codebase. The puzzles involve blocks of arbitrary shapes (not just rectangles) sliding on a fixed-size grid, with win conditions that vary beyond the classic "exit" mechanic. Blocks may carry SVG-based labels (letters, arcs, lines) relevant to win conditions like spelling a word.

The project is local-only (no git remote, no server requirement at runtime).

## Goals / Non-Goals

**Goals:**
- Pure Go core for all game logic, compiled to WASM and called from the browser
- React/TypeScript frontend with SVG-based board rendering
- Support arbitrary block shapes as sets of grid cells
- Support SVG labels on blocks (text and arbitrary SVG path content)
- Support fixed (immovable) obstacle blocks
- Five win condition types: position, multi-position, adjacency, word, exit
- Grid-snapped drag interaction (mouse + touch via Pointer Events API)
- Keyboard interaction: select block, move with arrow keys
- Puzzle browser with solved/move-count display
- Progress persistence via localStorage
- Optional par move count per puzzle
- Static deployment: HTML + JS + WASM + JSON files, no server

**Non-Goals:**
- Puzzle solver / hint system
- Multiplayer or server-side state
- Puzzle editor / authoring tool (in this change)
- Rotation of blocks
- Diagonal movement
- Animated transitions beyond grid-snap feedback

## Decisions

### Decision 1: Go compiled to WASM for game logic

**Chosen**: Go → WASM, called from React via the standard `wasm_exec.js` bridge.

**Rationale**: All move validation and win-condition logic lives in one language with full type safety and testability. The Go test suite can cover the core without a browser. The WASM surface is a small set of exported functions.

**Alternative considered**: TypeScript re-implementation of game logic alongside Go. Rejected — maintaining two implementations of validation logic invites drift.

**WASM API surface**:
```
LoadPuzzle(jsonStr string) string   // returns error or ""
TryMove(blockID string, dir string) string  // returns updated state JSON or error
GetState() string                   // returns current state JSON
Reset() string                      // returns initial state JSON
Undo() string                       // returns previous state JSON
CheckWin() bool
GetMoveCount() int
```

State JSON shape returned to React:
```json
{
  "blocks": { "A": {"cells": [[0,0],[1,0]], "anchor": [0,0]} },
  "moveCount": 7,
  "won": false
}
```

### Decision 2: SVG-based board rendering in React

**Chosen**: The game board is a `<svg>` element. Each block is a `<g>` containing `<rect>` elements for its cells and the block's label SVG fragment rendered inline.

**Rationale**: SVG is the natural substrate for a grid game with decorative labels (arcs, paths, text). Scales without blur. SVG elements receive pointer events natively, simplifying hit detection. React renders and updates SVG as naturally as HTML.

**Alternative considered**: HTML5 `<canvas>` via Ebitengine compiled to WASM. Rejected — SVG labels (arbitrary paths, arcs) require rasterisation in canvas, losing crispness and complicating label authoring.

### Decision 3: Block shape as a list of cell offsets

**Chosen**: A block is defined as a list of `[col, row]` pairs relative to an anchor. The anchor is the top-left cell of the bounding box.

**Rationale**: Handles all shapes (1×1, dominoes, triominoes, corners, tetrominoes) with a single uniform representation. Move validation: for each cell in the shape, check the adjacent cell in the move direction for emptiness.

**Alternative considered**: `width × height` with a bitmask for occupied cells. Rejected — more complex and offers no benefit over the cell-list approach for this scale.

### Decision 4: Win condition as a typed discriminated union in JSON

**Chosen**: Each puzzle's `win_condition` object has a `type` field selecting the evaluation strategy. Go uses a switch on type to select the evaluator.

Types:
- `"position"` — one block at specific (col, row)
- `"multi_position"` — multiple blocks each at specific (col, row); word puzzles are a special case of this, using text-labeled blocks whose target positions spell the intended word spatially
- `"adjacency"` — block A has a cell directly adjacent to a cell of block B
- `"exit"` — a designated block reaches a gap in the board border

**Rationale**: Flexible enough for all known Hornden puzzle variants. Each evaluator is a pure function of board state.

### Decision 5: Puzzle index + flat JSON files

**Chosen**: `puzzles/index.json` lists all puzzles with id, title, source, difficulty, and optional par. Individual puzzle files live at `puzzles/h-NNN.json`. Browser fetches the index on load, then fetches individual puzzles on demand.

**Rationale**: 200 files is manageable flat. Lazy loading per-puzzle avoids loading 200 puzzles upfront. Index provides enough metadata for the browser without loading each puzzle.

### Decision 6: Drag interaction is grid-snapped, not free-floating

**Chosen**: During a drag, the block renders only at valid intermediate grid positions along the move axis. On pointer-up, if displacement exceeds half a cell, the move commits; otherwise it snaps back.

**Rationale**: Consistent with the physical puzzle metaphor. Eliminates ambiguous partial-cell states. React handles the snap rendering; Go validates whether the target position is reachable.

### Decision 7: Vite + React + TypeScript for the frontend

**Chosen**: Vite as build tool, React 18, TypeScript.

**Rationale**: Vite provides fast WASM asset handling and static build output. React's reconciler maps cleanly onto SVG updates. TypeScript catches interface mismatches at the Go/JS boundary early.

## Risks / Trade-offs

- **WASM startup latency** → Mitigate with a loading indicator; the WASM binary should be small (pure logic, no heavy deps)
- **SVG label security** — label SVG content is author-controlled (from JSON files the developer writes), not user-supplied, so XSS risk is low; document this constraint
- **localStorage quota** — 200 puzzles of metadata is negligible; no risk
- **Go/JS type boundary** — string-serialised JSON at the boundary is verbose but avoids complex memory management; acceptable at this scale
- **Pointer Events drag on iOS Safari** — requires `touch-action: none` on the SVG element; must be set explicitly

## Open Questions

- Should Undo be unlimited (full move stack) or capped (e.g., last 10 moves)?
- Should the puzzle browser support filtering by difficulty or solved status?
- Should there be a "congratulations" screen with par comparison, or an inline notification?
