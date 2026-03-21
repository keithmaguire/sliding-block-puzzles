## 1. Authoring Workflow Shell

- [x] 1.1 Rename or refactor the current creator flow into a visual-only Puzzle Authoring workflow with browser entry points for Create and Edit existing puzzle
- [x] 1.2 Remove the in-app text-mode UI, tab-switching behavior, and notation guide from the authoring flow
- [x] 1.3 Ensure built-in and custom puzzles both open into the same authoring workflow with the correct initial state

## 2. Authoring State and JSON Interchange

- [x] 2.1 Implement JSON import in Puzzle Authoring as a replace-current-state action with validation failure preserving the current puzzle
- [x] 2.2 Define and track clean vs dirty authoring state based on the initially opened or last successfully imported puzzle
- [x] 2.3 Add dirty-state confirmation flows for Import JSON and Clear Puzzle, while keeping Back non-destructive
- [x] 2.4 Keep JSON export, Try It, and Add to Library working from the visual-only authoring workflow

## 3. Visual Editor Fidelity

- [x] 3.1 Update the visual editor and conversion helpers to remove text-mode coupling and void-tool assumptions
- [x] 3.2 Ensure opening an existing puzzle in the visual editor preserves authored semantics across save/export, including colors, labels, movability, win conditions, setup options, and metadata
- [x] 3.3 Update browser edit actions and custom puzzle editing to target visual authoring directly rather than serialized text

## 4. Documentation, Cleanup, and Verification

- [x] 4.1 Remove obsolete text-authoring modules and dead code paths once the visual-only workflow is complete
- [x] 4.2 Update in-app architecture documentation and user-facing copy to describe visual-only authoring and JSON import/export
- [x] 4.3 Add or update tests for Create/Edit entry points, JSON import replacement behavior, dirty-state confirmations, and visual authoring round-trip fidelity
