## Why

The current puzzle format is described inconsistently across OpenSpec, in-app documentation, `puzzles/README.md`, and the actual loader/runtime types. That drift makes the format harder to author against, harder to explain, and especially confusing around advanced win conditions and authoring-related fields.

## What Changes

- Add a formal **`puzzle-json-contract`** capability that defines the canonical serialized puzzle model, including structural fields, semantic meaning, invariants, and canonical representation rules.
- Document `any_of` and `description_only` as first-class public win condition types rather than implementation-only behavior.
- Choose a single canonical representation for multi-way wins: `win_condition` with recursive `any_of`, while treating top-level `win_conditions` as non-canonical compatibility input.
- Update the Puzzle Format Reference to align with the actual runtime format, including `setup_options`, `win_description`, advanced win conditions, and canonical vs legacy forms.
- Update architecture documentation so the documented runtime and frontend data model match the real loader and TypeScript types.
- **BREAKING** Retire stale or contradictory format guidance in `puzzles/README.md` and in-app docs where it conflicts with the canonical contract.

## Capabilities

### New Capabilities
- `puzzle-json-contract`: Canonical definition of `PuzzleJSON`, puzzle index formats, win condition unions, invariants, and compatibility/canonicalization rules.

### Modified Capabilities
- `puzzle-format-reference`: Replace incomplete format guidance with the formal `PuzzleJSON` contract and canonical format rules.
- `app-architecture`: Update the documented runtime/frontend model so it matches the supported puzzle fields and win condition types.
- `how-to-play`: Clarify player-facing behavior for manual-completion puzzles that use general statements rather than engine-checked win conditions.

## Impact

- Go loader contract and validation expectations
- TypeScript puzzle model and in-app documentation
- Puzzle authoring/import/export expectations
- `puzzles/README.md` and any other hand-authored format references
- Future ability to add a machine-readable JSON Schema derived from the formal contract
