## MODIFIED Requirements

### Requirement: Custom puzzle collection
The system SHALL support only the current custom-puzzle record shape in localStorage.

#### Scenario: Legacy localStorage shapes are ignored
- **GIVEN** `sliding-puzzle-custom` contains older record shapes
- **WHEN** the app loads custom puzzles
- **THEN** those entries SHALL be ignored rather than migrated
