## MODIFIED Requirements

### Requirement: PuzzleJSON contract defines canonical top-level structure
The system SHALL define a canonical serialized puzzle object named `PuzzleJSON`.

A canonical `PuzzleJSON` SHALL contain:
- `id`
- `board`
- `blocks`
- `win_condition`

A canonical `PuzzleJSON` MAY additionally contain:
- `win_description`
- `setup_options`

Library-facing metadata such as `title`, `source`, `difficulty`, grouping, and other catalog metadata SHALL belong to `puzzles/index.json` rather than to canonical puzzle files.

#### Scenario: Canonical top-level fields are defined
- **WHEN** an author reads the PuzzleJSON contract
- **THEN** the contract SHALL clearly distinguish required and optional top-level fields
- **AND** it SHALL state that browse-time metadata is owned by the index rather than the puzzle file

### Requirement: PuzzleJSON contract defines index formats and canonical form
The system SHALL define `puzzles/index.json` as the canonical library-catalog format.

The canonical index SHALL be a versioned object containing:
- registries for controlled metadata values
- flat puzzle rows keyed by puzzle `id`

#### Scenario: Index format is defined
- **WHEN** an author reads the index contract
- **THEN** the canonical flat catalog format SHALL be identified as the required serialized structure

## REMOVED Requirements

### Requirement: Shipped puzzle files define catalog metadata
**Reason**: Shipped-library metadata now belongs to `index.json`, not to individual puzzle JSON files.
**Migration**: Place exported gameplay JSON into `puzzles/`, regenerate `index.json`, then edit and export the index separately.
