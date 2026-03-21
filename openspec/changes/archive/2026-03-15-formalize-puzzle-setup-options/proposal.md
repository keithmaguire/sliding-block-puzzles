## Why

The game already supports pre-play puzzle setup through `setup_options`, including shuffling pieces and optionally removing blocks before starting. That behavior is part of normal gameplay today, but it does not yet have a clear product contract, which makes the expected behavior around setup, progress recording, and future evolution harder to reason about.

## What Changes

- Add a new **`puzzle-setup-options`** capability that defines the public `setup_options` format and the pre-game setup workflow.
- Document `allow_shuffle` and `removable_blocks` as the currently supported public setup options.
- Define when the setup screen appears, how the player configures setup choices, and how those choices affect the started puzzle.
- Clarify that setup-based starts are part of normal gameplay, not a separate variant mode.
- Clarify that solves after shuffle/removal record progress exactly like any other solve for the puzzle.
- Mark `setup_options` as an extensible public format that may gain additional fields in future.

## Capabilities

### New Capabilities
- `puzzle-setup-options`: Public contract for `setup_options`, the pre-game setup UI, and normal progress behavior after setup choices.

### Modified Capabilities
- `custom-puzzles`: Clarify that solve progress records normally even when a puzzle was started through setup options.
- `how-to-play`: Explain the pre-game setup step for puzzles that support shuffling or removable blocks.
- `puzzle-json-contract`: Reference `setup_options` as a public but extensible part of `PuzzleJSON`.

## Impact

- `PuzzleJSON` documentation and import/export expectations
- Pre-game setup UI and gameplay flow
- Progress recording semantics
- In-app help/documentation for puzzles with configurable starts
