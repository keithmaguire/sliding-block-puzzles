## ADDED Requirements

### Requirement: Progress includes setup-based solves
The system SHALL record progress normally for puzzles solved after using supported setup options such as shuffle or removable blocks.

#### Scenario: Setup-based solve updates progress
- **WHEN** the player solves a puzzle after making inline setup choices before the first move
- **THEN** the puzzle's solved state and best move count SHALL be updated using the same rules as any other solve
