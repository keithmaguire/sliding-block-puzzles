## Why

The initial text-notation change established a one-way authoring pipeline: write text, parse, export JSON. This change extends the pipeline in two directions: editing existing JSON puzzles via a round-trip serializer, and expanding the parser to support `adjacency` win conditions. It also tightens input validation to reject malformed colour values before they reach the renderer.

## What Changes

- **`puzzleToText` serializer** — `web/src/puzzleToText.ts`: converts a `PuzzleJSON` back to text notation, enabling round-trip editing.
- **Edit button in PuzzleBrowser** — each puzzle card gets an Edit action that opens `PuzzleCreator` pre-populated with the serialized notation.
- **Adjacency win condition in parser** — `parseTextPuzzle` gains support for an `adjacency:` header field that authors can use to declare which blocks must be adjacent in the win state.
- **Input validation** — `parseTextPuzzle` validates `color.<token>` values as CSS hex colours and sanitizes text labels before passing them downstream.
- **Puzzle data update** — `d44-white-black.json` updated to represent WHITE and BLACK as single 5-cell blocks rather than individual letter blocks.

## Capabilities

### Extended Capabilities

- `text-notation-parse`: now accepts `adjacency:` win condition declarations and validates colour hex values.
- `puzzle-creator-ui`: now accepts an initial notation string, enabling edit-from-existing workflows.

### New Capabilities

- `puzzle-to-text`: Serialize a `PuzzleJSON` back to text notation for round-trip editing.
- `puzzle-edit-from-browser`: Open any existing puzzle in the creator for editing via the PuzzleBrowser card.

## Non-goals

- Saving edited puzzles back to `puzzles/index.json` automatically is out of scope; the author exports JSON and replaces the file manually.
- Round-trip fidelity for `exit` win conditions is out of scope (exit conditions require explicit authoring).
