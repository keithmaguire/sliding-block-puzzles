## MODIFIED Requirements

### Requirement: PuzzleJSON contract defines canonical top-level structure
Canonical `PuzzleJSON` SHALL describe gameplay only.

Legacy puzzle-file metadata fields such as `title`, `source`, `difficulty`, and `catalog` SHALL NOT be part of the canonical import/export contract.

#### Scenario: Import rejects superseded metadata fields
- **WHEN** the user imports puzzle JSON into the app
- **THEN** the import path SHALL reject superseded metadata fields rather than normalizing them

### Requirement: Built-in puzzle metadata is index-owned
Built-in browse metadata SHALL be maintained through `puzzles/index.json` and the app-managed metadata editor.

#### Scenario: Built-in index rows are created in-app
- **WHEN** an admin wants to add a built-in puzzle to the index
- **THEN** the supported workflow SHALL use the metadata editor to import current-format puzzle JSON and create or refresh the index row
