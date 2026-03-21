## MODIFIED Requirements

### Requirement: Exported puzzle JSON is gameplay-only
The supported built-in workflow SHALL no longer mention CLI index-generation steps.

#### Scenario: Built-in export workflow is documented
- **WHEN** the user reads the built-in authoring workflow
- **THEN** the workflow SHALL say to import the exported puzzle JSON into the metadata editor and export `index.json` there
