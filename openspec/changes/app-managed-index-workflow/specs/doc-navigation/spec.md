## MODIFIED Requirements

### Requirement: A settings/documentation selector lists admin actions and docs
The admin workflow described from the settings/documentation selector SHALL use only the app-managed index flow.

#### Scenario: No CLI index step is shown
- **WHEN** the user reads the admin workflow guidance
- **THEN** it SHALL not instruct the user to run `make index` or any equivalent CLI index-generation step
