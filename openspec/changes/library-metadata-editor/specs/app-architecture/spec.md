## MODIFIED Requirements

### Requirement: App Architecture page describes the data flow
The system SHALL include a data flow description covering the path from puzzle selection or authoring to gameplay:
1. `make index` regenerates a flat versioned `puzzles/index.json` with registries and placeholder puzzle rows derived from puzzle files
2. `PuzzleBrowser` fetches and parses the canonical index format
3. The browser derives grouped presentation by resolving each puzzle row's `group_id` through the group registry
4. The browser also joins local custom puzzles using browser-local metadata records that wrap canonical puzzle gameplay data
5. User either selects a puzzle to play, opens Puzzle Authoring via Create new puzzle, or opens Edit library metadata from the settings/documentation section
6. Puzzle gameplay loads from puzzle JSON files or local custom records, while browse-time metadata comes from the index or local metadata wrappers
7. Editing or importing loads puzzle gameplay data into `PuzzleEditorVisual`
8. Puzzle Authoring exports puzzle JSON for external placement into `puzzles/`
9. Library metadata editing exports a replacement `index.json`
10. `GameScreen` calls `loadPuzzle`
11. React stores returned block positions and renders `Board`
12. `useGameControls` drives movement
13. Win detection and progress recording update browser state

#### Scenario: Data flow path described
- **WHEN** the user reads the data-flow section
- **THEN** the page SHALL describe the sequence from index generation and browser metadata loading through gameplay render and admin export flows
