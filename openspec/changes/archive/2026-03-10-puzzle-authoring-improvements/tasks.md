## 1. puzzleToText serializer (sliding-puzzle-claude-kwr)

- [x] 1.1 Create `web/src/puzzleToText.ts` exporting `puzzleToText(puzzle: PuzzleJSON): string | null`
- [x] 1.2 Serialize header fields: `id`, `title`, `source`, `difficulty`, `par`, and `color.<token>` overrides for non-default colours
- [x] 1.3 Reconstruct `start:` grid from block cell positions; empty cells → `.`, void cells → `_`
- [x] 1.4 Reconstruct `win:` grid for `multi_position` win conditions by placing each block at its win position
- [x] 1.5 Emit `adjacency:` header for `adjacency` win conditions; return `null` for `exit` win conditions
- [x] 1.6 Write round-trip tests: serialize then re-parse and compare key fields

## 2. Edit button in PuzzleBrowser (sliding-puzzle-claude-kwr)

- [x] 2.1 Add Edit button/icon to each puzzle card in `PuzzleBrowser`
- [x] 2.2 On click: fetch puzzle JSON, call `puzzleToText`, navigate to `PuzzleCreator` with pre-populated text
- [x] 2.3 Show error message if `puzzleToText` returns `null` (unsupported win condition type)

## 3. Adjacency win condition in parser (sliding-puzzle-claude-kwr)

- [x] 3.1 Add `adjacency:` header field parsing in `parseTextPuzzle`; value is comma-separated block ID pairs
- [x] 3.2 When `adjacency:` is present, produce an `adjacency` win condition; make `win:` grid optional
- [x] 3.3 Add unit tests for adjacency parsing

## 4. Input validation (sliding-puzzle-claude-kwr)

- [x] 4.1 Validate `color.<token>` values against CSS hex pattern; return `ParseError` with line context on failure
- [x] 4.2 Sanitize text label values: strip whitespace, omit label if result is empty

## 5. Puzzle data update (sliding-puzzle-claude-kwr)

- [x] 5.1 Update `puzzles/d44-white-black.json` to represent WHITE and BLACK as 5-cell blocks
