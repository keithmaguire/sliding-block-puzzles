## ADDED Requirements

### Requirement: How to Play page explains manual-completion puzzles
The system SHALL explain that some puzzles do not have an engine-verifiable win condition and instead provide a general goal statement for the player.

The page SHALL explain that these puzzles are completed by player judgment and confirmed manually in the UI.

#### Scenario: Manual-completion puzzles explained
- **WHEN** the user reads the How to Play page
- **THEN** the page SHALL state that some puzzles rely on player judgment rather than automatic board-state verification

#### Scenario: Manual completion action explained
- **WHEN** the user reads the How to Play page
- **THEN** the page SHALL explain that these puzzles are confirmed manually by the player in the UI
