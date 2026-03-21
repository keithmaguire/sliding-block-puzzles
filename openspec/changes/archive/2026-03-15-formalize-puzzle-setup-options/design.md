## Context

The app already supports puzzle setup through `setup_options`, but the current UI uses a dedicated pre-game setup screen. The product direction is now to remove that screen entirely and present setup interactions inline on the puzzle-playing screen before the first move. This is meaningful gameplay behavior, not just an implementation detail, so it still needs a dedicated public contract describing the setup fields, inline interaction behavior, and how progress should be recorded after setup choices.

## Goals / Non-Goals

**Goals:**
- Define `setup_options` as a public but extensible part of `PuzzleJSON`.
- Specify the current supported setup fields: `allow_shuffle` and `removable_blocks`.
- Define how supported setup interactions appear inline on the game screen before the first move.
- Clarify that setup-based starts are part of normal gameplay.
- Clarify that solves after using setup options record progress normally for the puzzle.

**Non-Goals:**
- Inventing a separate variant-play concept.
- Locking `setup_options` into a permanently closed field set.
- Reintroducing a separate setup stage or modal before gameplay.
- Defining persistence of setup selections across sessions.

## Decisions

### Treat `setup_options` as a public but extensible format

`setup_options` is not an internal convenience. It affects user-visible game flow and must be documented as part of the public puzzle contract. At the same time, the field should remain evolvable so new setup controls can be added later without redesigning the contract.

Alternative considered:
- Treating `setup_options` as runtime-only behavior. Rejected because puzzle authors need to know how setup-capable puzzles behave.

### Present setup interactions inline on the game screen

The puzzle-playing screen is the only place setup interactions appear. Puzzles start directly into gameplay. Before the first move, the player may use any setup interactions supported by the puzzle:
- shuffle the puzzle if `allow_shuffle` is enabled
- remove highlighted listed blocks if `removable_blocks` is present

Alternative considered:
- Keeping a separate setup screen. Rejected because it adds unnecessary flow friction and separates setup decisions from the board they affect.

### Count setup-based solves as normal solves

Shuffling and block removal are part of the normal puzzle experience, not a separate labeled mode. Solves from those starts update progress and best move counts for the puzzle exactly like any other solve.

Alternative considered:
- Tracking setup-based solves separately. Rejected because the product direction is to keep setup as normal play rather than variant play.

### Define shuffle and removable blocks as pre-move game-screen transforms

`allow_shuffle` authorizes a randomized legal rearrangement of movable non-void blocks before the first move. `removable_blocks` authorizes the player to remove listed blocks by clicking them before the first move. These are pre-move transforms of the playable puzzle state performed inline on the game screen.

Alternative considered:
- Describing them only as UI toggles. Rejected because the contract should define the resulting gameplay state, not just the controls.

## Risks / Trade-offs

- [Future setup fields may need different UX than the current inline controls] → Mitigation: define `setup_options` as extensible and describe only current supported fields concretely.
- [Normal progress after setup may surprise players expecting “standard only” scoring] → Mitigation: document setup as part of ordinary play rather than a variant mode.
- [Shuffle legality can be underspecified] → Mitigation: describe the result as a randomized legal arrangement rather than specifying an exact algorithm.

## Migration Plan

1. Add a dedicated `puzzle-setup-options` capability covering the JSON field and inline setup workflow.
2. Update the formal `PuzzleJSON` contract to reference `setup_options` as a public extensible field.
3. Update How to Play so the inline setup interactions are explained for puzzles that support them.
4. Update progress-related specs so solves after setup choices are treated as normal solves.
5. Remove the dedicated setup screen from implementation and align tests with the inline interaction contract.

## Open Questions

- Whether future setup fields should appear in the same inline setup area or permit multiple pre-move interaction styles.
- Whether the game screen should explicitly explain that progress records normally after setup choices, or whether that belongs only in the formal contract and tests.
