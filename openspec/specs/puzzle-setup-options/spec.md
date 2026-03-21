## Capability: puzzle-setup-options

Optional pre-move setup interactions that occur inline on the game screen.

---

## ADDED Requirements

### Requirement: setup_options is a public extensible puzzle field
The system SHALL treat `setup_options` as a public optional part of PuzzleJSON.

The currently supported fields SHALL be:
- `allow_shuffle`
- `removable_blocks`

The contract SHALL state that additional setup fields may be added in future.

#### Scenario: setup_options is documented as extensible
- **WHEN** an author reads the setup-options capability
- **THEN** it SHALL list the current fields and note that more may be introduced later

### Requirement: setup interactions are presented inline on the game screen
The system SHALL present supported setup interactions on the game screen before the first move.

The system SHALL NOT require a separate setup screen for current setup fields.
The system SHALL present current setup interactions in the control area below the puzzle so that they may disappear after the first move without shifting the board vertically.

#### Scenario: Puzzle with setup options starts directly into gameplay
- **WHEN** the player starts a puzzle with supported setup options
- **THEN** the system SHALL enter gameplay directly
- **AND** present setup interactions inline before the first move

### Requirement: allow_shuffle enables inline shuffled legal starts
When `setup_options.allow_shuffle` is true, the game screen SHALL offer a shuffle action before the first move.

The resulting state SHALL preserve block shapes and remain in-bounds and non-overlapping.

#### Scenario: Shuffle option is offered inline
- **WHEN** the puzzle defines `allow_shuffle: true`
- **THEN** the game screen SHALL present a shuffle action before the first move

### Requirement: removable_blocks enables inline block removal before the first move
When `setup_options.removable_blocks` is present, the game screen SHALL allow the player to remove any listed block by clicking it before the first move.

Only listed blocks SHALL be removable through this interaction.

#### Scenario: Removable blocks are clearly indicated
- **WHEN** the puzzle defines `removable_blocks`
- **THEN** the game screen SHALL visually indicate which blocks can still be removed before play begins

#### Scenario: Clicking a removable block removes it
- **WHEN** the player clicks a listed removable block before the first move
- **THEN** that block SHALL be removed immediately

### Requirement: Setup choices are part of normal gameplay
The system SHALL treat puzzles started after setup choices as normal gameplay for that puzzle.

The system SHALL NOT distinguish setup-based starts as a separate variant mode for progress tracking or solve recording.

#### Scenario: Setup-based play is normal play
- **WHEN** the player solves a puzzle after setup choices
- **THEN** the run SHALL be treated as normal gameplay for progress purposes
