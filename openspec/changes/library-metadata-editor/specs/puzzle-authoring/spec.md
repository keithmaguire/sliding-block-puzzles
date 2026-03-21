## MODIFIED Requirements

### Requirement: Puzzle Authoring entry points
The system SHALL provide Puzzle Authoring through:
- Create new puzzle from the settings/documentation section
- Edit on built-in puzzles
- Edit on custom puzzles

Create new puzzle SHALL resume the current draft if one exists, otherwise start from a blank puzzle.

#### Scenario: Create resumes current draft
- **GIVEN** an authoring draft already exists
- **WHEN** the user activates Create new puzzle
- **THEN** Puzzle Authoring SHALL reopen that draft unchanged

### Requirement: Full-fidelity visual editing
Puzzle Authoring SHALL be able to represent and edit every supported puzzle construct without requiring manual text editing.

Opening a puzzle and then exporting it SHALL preserve its authored gameplay semantics.

For shipped-library puzzles, exported puzzle JSON SHALL NOT be required to preserve browse-time catalog metadata that now belongs to `index.json`.

#### Scenario: Existing puzzle round-trips without semantic loss
- **GIVEN** a valid puzzle is opened in Puzzle Authoring
- **WHEN** the user exports it without changing its meaning
- **THEN** the resulting puzzle SHALL preserve board, blocks, appearance, movability, win condition, setup options, and gameplay semantics
- **AND** shipped-library catalog metadata SHALL be owned separately by the index

### Requirement: Exported puzzle JSON is drop-in ready for puzzles directory
Puzzle Authoring SHALL export puzzle gameplay data as standalone puzzle JSON suitable for placement into `puzzles/`.

The exported puzzle JSON SHALL NOT be the canonical owner of library metadata such as:
- `title`
- `source`
- `difficulty`
- grouping

The intended workflow for adding a built-in puzzle SHALL be:
1. export puzzle JSON from Puzzle Authoring
2. place the file into `puzzles/`
3. import the puzzle JSON into Edit library metadata
4. refine library metadata through Edit library metadata

#### Scenario: Exported puzzle joins the library through metadata editing
- **WHEN** the user exports a puzzle from Puzzle Authoring
- **THEN** the JSON SHALL be suitable for placement into `puzzles/`
- **AND** the shipped-library metadata for browser presentation SHALL be supplied later through imported and edited `index.json`
