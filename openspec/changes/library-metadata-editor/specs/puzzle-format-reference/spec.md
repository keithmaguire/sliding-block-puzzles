## MODIFIED Requirements

### Requirement: Puzzle Format Reference page documents the index.json canonical format
The system SHALL document the canonical `puzzles/index.json` format as a JSON object with:
- `version`
- `registries`
- `puzzles`

`registries` SHALL contain:
- allowed numeric `difficulties`
- allowed `groups`, each with a system-managed `id` and editable `title`

Each puzzle entry in `puzzles` SHALL contain:
- `id`
- `file`
- `title`
- `source`
- `difficulty`
- `group_id`
- optional browser-facing derived fields such as `min_moves`

The page SHALL explain that puzzle rows join to puzzle files by `id`, and that group titles are resolved through the group registry rather than stored independently on each row.

#### Scenario: Index format displayed
- **WHEN** the user reads the index section
- **THEN** the page SHALL identify the canonical index object as the required format
- **AND** it SHALL describe the embedded registries and flat puzzle rows

### Requirement: Puzzle Format Reference page documents puzzle file top-level fields
The system SHALL document the required and optional top-level fields of a puzzle JSON file.

Required canonical fields:
- `id`
- `board`
- `blocks`
- `win_condition`

Optional fields:
- `win_description`
- `setup_options`

The page SHALL explain that browser-facing metadata such as `title`, `source`, `difficulty`, and grouping are documented under `index.json` rather than under puzzle files.

#### Scenario: Required vs optional fields clearly distinguished
- **WHEN** the user reads the puzzle file section
- **THEN** the page SHALL clearly separate required and optional fields with examples
- **AND** it SHALL state that shipped-library metadata belongs to `index.json`

### Requirement: Puzzle Format Reference page documents the index-maintenance workflow
The system SHALL document how the exported puzzle JSON and exported `index.json` fit into the repository maintenance workflow.

The page SHALL explain that:
- Puzzle Authoring exports puzzle gameplay JSON files.
- Built-in puzzle JSON files are added to `puzzles/` outside the app.
- Edit library metadata imports puzzle JSON files and manages the built-in index in-app.
- `Export updated index` produces the replacement `puzzles/index.json` file that is copied into the repository outside the app.

#### Scenario: Index maintenance workflow documented
- **WHEN** the user reads the maintenance guidance
- **THEN** the page SHALL explain how puzzle export, metadata-editor import, in-app metadata editing, and index export fit together
