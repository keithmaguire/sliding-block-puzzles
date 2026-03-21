## MODIFIED Requirements

### Requirement: Doc pages are reachable from the puzzle browser
The system SHALL provide a navigation control in the PuzzleBrowser that allows the user to open a combined settings/documentation section. The control SHALL use a settings-style affordance rather than a question-mark help affordance, and it SHALL not interfere with the puzzle list.

#### Scenario: Settings/documentation control visible in browser
- **WHEN** the user is on the puzzle browser screen
- **THEN** a control SHALL be visible that opens the settings/documentation section

#### Scenario: User reaches How to Play from browser
- **WHEN** the user activates the settings/documentation control and selects How to Play
- **THEN** the How to Play page SHALL be displayed

### Requirement: A doc page selector lists all three documentation pages
The system SHALL provide a settings/documentation selector view that lists all three documentation pages — How to Play, Puzzle Format Reference, App Architecture — with a brief description of each.

When opened from the puzzle browser, the selector SHALL also expose browser-level admin actions:
- Create new puzzle
- Edit library metadata

The settings/documentation area SHALL include a separate admin-workflow section that explains how to update the shipped app content outside the app.

#### Scenario: All three documentation pages listed
- **WHEN** the user activates the settings/documentation control
- **THEN** all three documentation pages SHALL be listed with their names visible

#### Scenario: Browser entry shows admin actions
- **WHEN** the user opens the settings/documentation section from the puzzle browser
- **THEN** the section SHALL also list Create new puzzle and Edit library metadata

### Requirement: Settings/documentation explains the admin update workflow
The settings/documentation area SHALL include a dedicated section explaining how built-in puzzles and the library index are updated.

That section SHALL explain this workflow:
1. create or edit a puzzle in Puzzle Authoring
2. export the puzzle JSON
3. add the exported JSON file to the repository `puzzles/` directory outside the app
4. run `make index` to regenerate `puzzles/index.json`
5. open Edit library metadata in the app
6. update titles, sources, difficulties, and groups in-app
7. export the updated `index.json`
8. replace the repository `puzzles/index.json` file outside the app

The section SHALL explain that built-in puzzle files and the built-in index are incorporated into the app outside the browser UI even though the app produces the files used for those updates.

#### Scenario: Admin workflow steps are documented
- **WHEN** the user opens the admin-workflow section in settings/documentation
- **THEN** the app SHALL explain how puzzle JSON and `index.json` are exported from the app and then copied back into the repository outside the app
