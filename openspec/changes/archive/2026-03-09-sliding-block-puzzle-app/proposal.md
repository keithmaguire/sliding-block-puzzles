## Why

Edward Hornden's *Sliding Blocks Puzzles* is a rich collection of up to 200 hand-crafted puzzles with no existing interactive digital implementation. A web app lets players engage with these puzzles on any device, tracks their progress, and handles the full variety of block shapes and win conditions the book contains.

## What Changes

- Introduce a Go core library for puzzle state, move validation, and win-condition evaluation, compiled to WebAssembly
- Introduce a React/TypeScript web UI with an SVG-based game board supporting drag-and-drop (mouse + touch) and keyboard interaction
- Define a JSON puzzle format supporting arbitrary block shapes (tetrominoes, corners, L-pieces, etc.), SVG labels on blocks, fixed obstacles, and multiple win condition types
- Ship a puzzle browser with solved/move-count tracking persisted in localStorage
- Encode puzzles from the Hornden book (up to 200) as static JSON files

## Capabilities

### New Capabilities

- `puzzle-model`: Core data model for boards, blocks (arbitrary cell sets), labels, and fixed obstacles
- `win-conditions`: Flexible win condition system supporting position, multi-position, adjacency, word, and exit types
- `move-engine`: Move validation and execution for arbitrarily-shaped sliding blocks
- `puzzle-format`: JSON schema for encoding puzzles including optional par move count
- `game-ui`: SVG-based interactive board with drag/touch and keyboard input
- `puzzle-browser`: Puzzle selection screen with progress and move-count display
- `progress-tracking`: localStorage-based persistence of solved state and best move counts

### Modified Capabilities

## Impact

- New project: no existing code affected
- Runtime dependencies: Go standard library, React, TypeScript, Vite
- Go compiled to WASM; served as static files (no server required at runtime)
- Puzzle data: up to 200 static JSON files fetched directly by the browser
