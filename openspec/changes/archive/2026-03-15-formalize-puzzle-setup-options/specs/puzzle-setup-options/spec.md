## ADDED Requirements

### Requirement: setup_options is a public extensible puzzle field
The system SHALL treat `setup_options` as a public optional field in `PuzzleJSON`.

The system SHALL currently support these `setup_options` fields:
- `allow_shuffle` — optional boolean
- `removable_blocks` — optional array of block IDs

The contract SHALL state that additional `setup_options` fields may be added in future.

#### Scenario: Current setup_options fields are documented
- **WHEN** an author reads the setup-options contract
- **THEN** the contract SHALL list `allow_shuffle` and `removable_blocks` as the currently supported fields

#### Scenario: setup_options is described as extensible
- **WHEN** an author reads the setup-options contract
- **THEN** the contract SHALL state that additional setup fields may be introduced in future

### Requirement: setup_options are presented inline on the game screen
The system SHALL present supported setup interactions on the game screen itself before the first move.

The system SHALL NOT require a separate pre-game setup screen for the current supported setup fields.

#### Scenario: Puzzle with setup options starts directly into gameplay
- **WHEN** the player starts a puzzle that defines supported `setup_options`
- **THEN** the system SHALL enter the puzzle-playing screen directly
- **AND** any available setup interactions SHALL be presented inline there before the first move

#### Scenario: Puzzle without setup options starts normally
- **WHEN** the player starts a puzzle that does not define supported `setup_options`
- **THEN** the system SHALL enter gameplay without any setup-specific UI

### Requirement: allow_shuffle enables inline shuffled legal starts
When `setup_options.allow_shuffle` is `true`, the game screen SHALL allow the player to shuffle the puzzle before making the first move.

The shuffled start SHALL preserve each affected block's shape and SHALL not place blocks out of bounds or overlapping other occupied cells.

#### Scenario: Shuffle option is offered inline
- **WHEN** the puzzle defines `allow_shuffle: true`
- **THEN** the game screen SHALL present a shuffle action before the first move

#### Scenario: Shuffled start is legal
- **WHEN** the player shuffles the puzzle before the first move
- **THEN** the resulting puzzle state SHALL preserve block shapes
- **AND** no block SHALL be out of bounds or overlapping another occupied cell

### Requirement: removable_blocks enables inline block removal before the first move
When `setup_options.removable_blocks` is present, the game screen SHALL allow the player to remove any listed block by clicking it before making the first move.

Only block IDs listed in `removable_blocks` SHALL be removable through this inline interaction.

#### Scenario: Removable blocks are clearly indicated on the board
- **WHEN** the puzzle defines `removable_blocks`
- **THEN** the game screen SHALL visually indicate which blocks can still be removed before play begins

#### Scenario: Clicking a removable block removes it
- **WHEN** the player clicks a listed removable block before making the first move
- **THEN** that block SHALL be removed from the current puzzle state immediately
- **AND** that block SHALL no longer be shown as removable

#### Scenario: Non-listed blocks cannot be removed inline
- **WHEN** the player clicks a block that is not listed in `removable_blocks`
- **THEN** the system SHALL NOT remove that block as part of setup behavior

#### Scenario: Removable outlines disappear after play begins
- **WHEN** the player makes the first move of the puzzle
- **THEN** any remaining removable-block indicators SHALL disappear
- **AND** no further inline removals SHALL be available for that run

### Requirement: Setup choices are part of normal gameplay
The system SHALL treat puzzles started after setup choices as normal gameplay for that puzzle.

The system SHALL NOT distinguish setup-based starts as a separate variant-play mode for progress tracking or solve recording.

#### Scenario: Setup-based play is normal play
- **WHEN** the player starts a puzzle after choosing shuffle or removable-block options
- **THEN** the game SHALL treat the resulting run as a normal play session for that puzzle

### Requirement: Progress records normally after setup choices
If the player solves a puzzle after using supported setup options, the system SHALL record progress for that puzzle exactly as it does for any other solve.

Best move count comparisons SHALL use the resulting move count directly.

#### Scenario: Shuffled solve records progress normally
- **WHEN** the player solves a puzzle after starting with shuffle enabled
- **THEN** the puzzle's solved state and best move count SHALL be updated using the normal progress rules

#### Scenario: Block-removal solve records progress normally
- **WHEN** the player solves a puzzle after removing removable blocks before the first move
- **THEN** the puzzle's solved state and best move count SHALL be updated using the normal progress rules
