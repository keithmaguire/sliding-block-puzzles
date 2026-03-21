## ADDED Requirements

### Requirement: Library metadata editor manages puzzle metadata as a flat table
The system SHALL provide an in-browser Library Metadata Editor for all puzzles visible to the app.

The editor SHALL display one row per indexed puzzle and SHALL include:
- read-only puzzle `id`
- row origin indicator distinguishing built-in index-backed puzzles from local custom puzzles
- read-only puzzle `file` for built-in index-backed puzzles
- editable `title`
- editable `source`
- editable numeric `difficulty`
- editable group selection
- optional read-only derived fields such as `min_moves`

The editor SHALL operate on the complete puzzle set rather than on per-group subsets.

#### Scenario: Full library appears in one table
- **WHEN** an admin opens Edit library metadata
- **THEN** the app SHALL display all built-in and local custom puzzles in a spreadsheet-like table

### Requirement: Controlled registries define allowed metadata values
The system SHALL treat `source`, numeric `difficulty`, and groups as controlled metadata backed by registries embedded in `index.json`.

The system SHALL provide a separate metadata-management interface for editing:
- allowed sources
- allowed numeric difficulties
- allowed groups by editable title

The system SHALL manage group IDs internally and SHALL NOT require direct user editing of `group.id`.

#### Scenario: Group titles are edited through the registry
- **WHEN** an admin edits the allowed groups
- **THEN** the app SHALL allow editing group titles
- **AND** the corresponding internal group IDs SHALL remain system-managed

### Requirement: Puzzle rows must reference only allowed registry values
Each puzzle row in the Library Metadata Editor SHALL reference only values that exist in the current registries for:
- `source`
- `difficulty`
- `group`

The editor SHALL prevent export while any row references a value outside the registries.

#### Scenario: Invalid registry reference blocks export
- **GIVEN** at least one puzzle row references a source, difficulty, or group not present in the current registries
- **WHEN** the admin attempts to export the catalog
- **THEN** the system SHALL reject the export

### Requirement: Export updated index writes the complete built-in catalog artifact
The Library Metadata Editor SHALL provide an `Export updated index` action.

The export SHALL write a complete replacement `index.json` file containing:
- the current registries
- the current flat built-in puzzle rows
- the current index version

The export SHALL NOT write puzzle JSON files.
The export SHALL NOT include local custom puzzle rows.

#### Scenario: Export produces a replacement index file
- **WHEN** the admin activates Export updated index with a valid catalog
- **THEN** the app SHALL download the complete `index.json` file

### Requirement: Built-in catalog rows are created in the metadata editor
The system SHALL support creating or refreshing built-in `index.json` rows by importing current-format puzzle JSON files into the Library Metadata Editor.

Imported built-in rows SHALL:
- use puzzle `id` as the stable join key
- record the built-in puzzle `file`
- receive valid metadata values drawn from the current registries
- become editable in the same table as existing built-in rows

#### Scenario: Import produces an editable built-in catalog row
- **WHEN** an admin adds a puzzle JSON file to `puzzles/` and imports that file into Edit library metadata
- **THEN** the editor SHALL include a built-in row for that puzzle
- **AND** the row SHALL use valid metadata that can be refined before export
