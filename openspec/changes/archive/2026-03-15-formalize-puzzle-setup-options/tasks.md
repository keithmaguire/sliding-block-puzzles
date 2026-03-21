## 1. Setup Options Contract Alignment

- [x] 1.1 Align `PuzzleJSON` types, import/export behavior, and runtime expectations with the public `setup_options` contract
- [x] 1.2 Ensure the current supported setup fields (`allow_shuffle`, `removable_blocks`) are handled consistently across loading, setup UI, and play start
- [x] 1.3 Add validation or defensive handling for invalid removable block IDs and unsupported setup fields as needed by the public contract

## 2. Setup Flow and Documentation

- [x] 2.1 Remove the dedicated setup screen and present current setup interactions inline on the game screen before the first move
- [x] 2.2 Update How to Play and any related user-facing docs to explain setup-capable puzzles, shuffle, and removable blocks
- [x] 2.3 Update formal format documentation so `setup_options` is clearly presented as public and extensible

## 3. Progress and Verification

- [x] 3.1 Verify that solves after using shuffle or removable-block setup choices record progress exactly like any other solve
- [x] 3.2 Add or update tests covering inline shuffle behavior, inline removable-block exclusion, and normal progress recording after setup-based starts
- [x] 3.3 Review whether any existing docs or tests still imply setup-based play is a separate variant mode and remove that distinction
