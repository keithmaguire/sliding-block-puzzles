## Why

The repo still contains two conflicting stories about puzzle metadata maintenance:
- the current app workflow centers the metadata editor and `index.json`
- build tooling, compatibility code, and several specs/docs still preserve older generator- or legacy-oriented behavior

That leaves the product and the documentation inconsistent, and it keeps obsolete compatibility code alive.

## What Changes

- Remove code paths that migrate or accept legacy custom-puzzle and puzzle-file JSON shapes.
- Make the metadata editor capable of constructing built-in index rows from imported current-format puzzle JSON files.
- Remove CLI/build-tool index regeneration from the supported workflow.
- Update in-app docs, repo docs, and OpenSpec so the app-managed index workflow is the only documented path.

## Impact

- Affected code: `customPuzzles.ts`, `puzzleTypes.ts`, `LibraryMetadataEditor.tsx`, `Makefile`, obsolete indexer/buildindex tooling
- Affected docs/specs: in-app documentation, repo `puzzles/README.md`, OpenSpec capabilities covering puzzle JSON, authoring, custom puzzles, navigation, and architecture
