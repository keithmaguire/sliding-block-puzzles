## 1. Parser module (sliding-puzzle-claude-k5t)

- [x] 1.1 Create `web/src/parseTextPuzzle.ts` exporting `parseTextPuzzle(text: string): PuzzleJSON | ParseError` and the `ParseError` type
- [x] 1.2 Implement header parsing: extract `id`, `title`, `source`, `difficulty`, `par`, and `color.<token>` overrides; return error if `id` or `title` missing
- [x] 1.3 Implement section extraction: split on `start:` and `win:` keywords; return error if either is missing
- [x] 1.4 Implement grid parsing: split rows on whitespace, validate uniform column count and ≥2×2 size, match dimensions between start and win
- [x] 1.5 Implement connected-component grouping: flood-fill per token to find contiguous cell groups; assign IDs (token if single component, token+number if multiple)
- [x] 1.6 Implement fixed-block detection: mark blocks as `movable: false` when their cells are identical in start and win
- [x] 1.7 Implement label assignment: single-character tokens (not `.` or `_`) get `{ type: "text", value: token }`
- [x] 1.8 Implement colour assignment: palette cycle by token first-appearance order; apply `color.<token>` header overrides
- [x] 1.9 Derive win condition: collect movable blocks whose position changed; build `multi_position` entries; error if no blocks change
- [x] 1.10 Write unit tests covering: d44-white-black round-trip, error cases (missing id, missing section, ragged grid, identical start/win)

## 2. PuzzleCreator view (sliding-puzzle-claude-qo6)

- [x] 2.1 Implement `PuzzleCreator.tsx` with a controlled textarea bound to notation text
- [x] 2.2 Add debounced live parse (300 ms) or explicit Parse button; display structured preview on success (board size, block count, win condition summary)
- [x] 2.3 Display inline parse errors with line/context information
- [x] 2.4 Add "Create" button to `PuzzleBrowser` header; extend `App.tsx` view state with `creator` view

## 3. Try it (sliding-puzzle-claude-2pn)

- [x] 3.1 Add "Try it" button to `PuzzleCreator` (enabled when parse succeeds); passes parsed `PuzzleJSON` to `GameScreen`
- [x] 3.2 Returning from `GameScreen` goes back to `PuzzleCreator` with notation text preserved

## 4. Export JSON (sliding-puzzle-claude-a8w)

- [x] 4.1 Add "Export JSON" button to `PuzzleCreator` (enabled when parse succeeds); triggers browser file download of `PuzzleJSON` with filename `<id>.json` using Blob URL + anchor pattern
