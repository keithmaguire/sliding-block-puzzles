## Overview

This change makes the app-managed metadata editor the only supported way to construct and maintain the built-in library index. It also removes compatibility logic that accepted older puzzle or custom-storage shapes.

## Decisions

### Decision: Reject legacy custom-storage shapes

Custom puzzles stored in localStorage must already use the current `{ puzzle, metadata }` record format. Older shapes are ignored rather than migrated.

Rationale:
- removes silent compatibility code
- keeps storage and tests aligned with the current contract

### Decision: Reject superseded puzzle-file metadata on import

Puzzle JSON imported through the app must match the current canonical gameplay contract. Superseded fields such as `title`, `source`, `difficulty`, and `catalog` are not accepted as import inputs.

Rationale:
- prevents the app from continuing to normalize older file shapes
- keeps authoring/import behavior aligned with the current spec

### Decision: Build built-in index rows inside the metadata editor

The metadata editor will support importing one or more current-format puzzle JSON files and creating or refreshing built-in index rows from them.

Imported rows will derive:
- `id` from the puzzle JSON
- `file` from the imported filename
- `min_moves` from the puzzle JSON when present
- initial title/group/source/difficulty from current registry defaults, to be refined in the editor before export

The editor will also allow removing built-in rows so the exported `index.json` can be fully curated in-app.

### Decision: Remove CLI index generation from the supported workflow

Build commands must not regenerate `puzzles/index.json`. The curated index artifact is maintained outside the build through the metadata editor and exported explicitly by an admin.

## Resulting Workflow

1. Create or edit a puzzle in Puzzle Authoring.
2. Export gameplay JSON.
3. Place that JSON file in `puzzles/`.
4. Open Edit library metadata.
5. Import the puzzle JSON file into the editor.
6. Update title, source, difficulty, and group values.
7. Export updated `index.json`.
8. Replace `puzzles/index.json`.
