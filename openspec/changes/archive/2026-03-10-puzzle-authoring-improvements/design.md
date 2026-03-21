# Design: Puzzle Authoring Improvements

## puzzleToText Serializer

`web/src/puzzleToText.ts` exports `puzzleToText(puzzle: PuzzleJSON): string`.

Serialization rules:
1. Emit header fields in order: `id`, `title`, `source` (if present), `difficulty` (if present), `par` (if present).
2. For each block with a colour that differs from the palette default for that token, emit a `color.<token>: <hex>` line.
3. Reconstruct `start:` and `win:` grids from block cell positions. Empty cells become `.`; void cells become `_`.
4. For `multi_position` win conditions: derive `win:` grid by placing each winning block at its win position, leaving other movable blocks at their start position.
5. For `adjacency` win conditions: emit an `adjacency:` header field listing the block pairs; `win:` grid mirrors `start:`.
6. `exit` win conditions: not serializable — `puzzleToText` returns `null` for puzzles using exit conditions.

## Adjacency Win Condition in Parser

New optional header field:

```
adjacency: A B, C D
```

Each comma-separated pair names two block IDs that must be orthogonally adjacent in the win state. When this field is present:
- The win condition type is `adjacency`.
- The `win:` grid is still required but is ignored for win-condition derivation (it may be omitted or identical to `start:`).
- If `win:` is absent, the parser uses `start:` for both grids (fixed-block detection still applies).

## Input Validation

`parseTextPuzzle` validates:
- `color.<token>` values: must match `/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/`; invalid values return a `ParseError` with the offending line.
- Text label values: stripped of leading/trailing whitespace; if the resulting string is empty the label is omitted.

## Edit Button in PuzzleBrowser

Each puzzle card gains an "Edit" button (or icon). On click:
1. Fetch the puzzle JSON from its file URL.
2. Call `puzzleToText(puzzle)`.
3. Navigate to `PuzzleCreator` with the resulting text pre-populated.
4. If `puzzleToText` returns `null` (exit condition), show a brief error toast: "This puzzle type cannot be edited in the creator."

## d44-white-black Data Update

Current representation uses individual letter blocks (W, H, I, T, E and B, L, A, C, K). The update consolidates each word into a single 5-cell horizontal block with a text label of "WHITE" / "BLACK" and an `svg` label for multi-character display, or retains individual letters with the existing scheme — decision deferred to implementation based on label type support.
