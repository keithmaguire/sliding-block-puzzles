## Context

The current authoring flow mixes two different editing models: a visual editor and an in-app text-notation editor. That split creates extra state sync, extra documentation burden, and losslessness problems when moving between representations. The product direction for this change is to make the visual editor the only in-app editing surface, keep `PuzzleJSON` as the import/export format, and treat manual text editing as an out-of-app source-code workflow for advanced users.

This change crosses multiple frontend modules and spec surfaces:
- browser entry points for creating and editing puzzles
- the authoring workflow and its action bar
- custom puzzle persistence and edit flows
- JSON import/export behavior
- architecture documentation
- retirement of the custom text-notation capability

## Goals / Non-Goals

**Goals:**
- Define a single in-app authoring workflow centered on visual editing.
- Make JSON the only in-app interchange format.
- Allow both built-in and custom puzzles to be opened in the authoring workflow.
- Support JSON import as a replace-current-state action with validation and dirty-state confirmation.
- Support dirty-state confirmation before leaving authoring.
- Remove the product requirement to maintain text-notation parsing, serialization, and UI.

**Non-Goals:**
- Providing a raw JSON editor inside the app.
- Preserving backward compatibility with the text-notation workflow.
- Defining source-control workflows for editing built-in puzzle files on disk.
- Changing the Go engine or puzzle JSON schema beyond what visual authoring already needs.

## Decisions

### Use a new `puzzle-authoring` capability to describe the full workflow

The old `visual-puzzle-editor` capability describes only the editor surface, not entry points, import/export, destructive navigation, or save/test flows. A new `puzzle-authoring` capability provides a clearer product contract for the full workflow.

Alternative considered:
- Expanding `visual-puzzle-editor` only. Rejected because it would leave authoring concerns scattered across multiple specs and would not reflect the product as a unified workflow.

### Make the visual editor the only in-app editing interface

The app will no longer promise a text-notation editor or text/visual tab sync. This removes cross-representation drift and simplifies the product mental model:

`PuzzleBrowser -> Puzzle Authoring -> Game/Save/Import/Export`

Alternative considered:
- Keeping both visual and text modes. Rejected because the product now requires a single canonical authoring workflow and full-fidelity editing without maintaining a second in-app language.

### Use JSON as the only in-app import/export format

Import and export are both JSON-based. This aligns the in-app workflow with the real puzzle storage format and avoids inventing or maintaining a second canonical representation.

Alternative considered:
- Retaining text notation for import/export only. Rejected because it would preserve the same ambiguity and losslessness pressures that motivated this change.

### Model import as full replacement, not merge

Importing JSON replaces the current authoring state after successful validation. The system does not merge imported state with the current draft. This keeps authoring deterministic and avoids partial overwrite semantics.

Alternative considered:
- Field-level merge. Rejected because it is hard to explain, hard to test, and likely to produce surprising mixed puzzle states.

### Keep Puzzle Authoring as a persistent draft until explicitly replaced or cleared

The current authoring draft persists even when the user leaves Puzzle Authoring and returns to the puzzle browser or documentation. `Back` is non-destructive navigation; it hides the authoring tool but does not discard the draft. The draft is replaced only by explicit actions:
- opening a different puzzle for editing
- successfully importing JSON
- explicitly clearing the puzzle inside authoring

Alternative considered:
- Treating `Back` as destructive navigation. Rejected because the user expectation is that authoring behaves like a persistent draft, not a transient modal editor.

### Use dirty-state confirmation for destructive replacement actions

The authoring flow tracks whether the current state differs from the initially opened, last successfully imported, or last explicitly cleared puzzle. Import and Clear prompt only when the state is dirty. `Back` never prompts because it is not destructive. Invalid imports never replace the current puzzle.

Alternative considered:
- No confirmation. Rejected because import and clear can discard substantial user work.

### Keep browser-level actions focused on entry points

The browser exposes Create and Edit existing puzzle entry points. `Create` resumes the current draft if one exists, otherwise it opens a blank puzzle. Import remains inside authoring because it operates on the current authoring state and needs to participate in destructive replacement confirmation.

Alternative considered:
- Import from the browser. Rejected because it splits authoring entry behavior and replacement behavior across two different contexts.

## Risks / Trade-offs

- [Loss of in-app text shorthand] -> Mitigation: rely on JSON export/import for interchange and keep manual source editing outside the app.
- [Visual editor must now cover every supported puzzle feature] -> Mitigation: make full-fidelity visual editing an explicit requirement in the new capability.
- [Capability overlap during migration] -> Mitigation: add a new `puzzle-authoring` capability while explicitly removing the old text-authoring requirements and trimming `visual-puzzle-editor` to the editor surface.
- [Dirty-state tracking can become inconsistent if state snapshots are not well-defined] -> Mitigation: define the clean baseline as the initially opened puzzle or the most recent successfully imported puzzle.

## Migration Plan

1. Introduce `puzzle-authoring` requirements covering entry points, actions, import/export, and destructive-navigation behavior.
2. Remove the `puzzle-text-authoring` product requirements from OpenSpec.
3. Update `visual-puzzle-editor` requirements so they describe a visual-only editing surface and no longer mention void tools or text-tab sync.
4. Update `custom-puzzles` to point edit actions at the visual authoring workflow.
5. Update `app-architecture` so the documented React layer and data flow no longer reference text authoring modules.
6. Implement the workflow change, then delete obsolete text authoring code and documentation.

Rollback is straightforward at the code level while the old modules still exist, but once the old capability is removed from the product contract the intended direction is forward-only.

## Open Questions

- Whether architecture documentation should mention retired text modules during the implementation transition, or remove them entirely once the new flow lands.
- Whether the visual editor should support JSON import through file selection only, pasted JSON, or both. The spec can remain format-focused and leave the exact input control to implementation unless needed.
