## Why

Writing puzzle JSON by hand is error-prone and verbose. A compact text notation lets authors sketch a puzzle as an ASCII grid, preview the parsed result live in the browser, play-test it immediately, and export the generated JSON for permanent use. This removes the friction of learning the full JSON schema for simple puzzles.

## What Changes

- **Text notation format** — a plain-text representation with header fields and `start:` / `win:` grid sections. Defined in this document.
- **`parseTextPuzzle` module** — `web/src/parseTextPuzzle.ts`: parses notation into `PuzzleJSON` or a structured `ParseError`.
- **`PuzzleCreator` view** — `web/src/components/PuzzleCreator.tsx`: textarea input, live parse feedback, structured preview, Try it and Export JSON actions.
- **App routing** — "Create" entry point in `PuzzleBrowser` header; view state extended to include `creator` view.

## Capabilities

### New Capabilities

- `text-notation-parse`: Convert compact grid text into valid `PuzzleJSON` with auto-derived win condition, block IDs, and colour assignment.
- `puzzle-creator-ui`: In-browser authoring tool with live validation, play-test, and JSON export.

## Non-goals

- `exit` and `adjacency` win conditions are not derivable from a grid diff and are out of scope.
- Editing existing JSON puzzles in the creator is out of scope (export + manual edit is the workflow).
- Saving created puzzles to the puzzle list is out of scope.
