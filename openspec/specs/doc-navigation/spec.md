## ADDED Requirements

### Requirement: Doc pages are reachable from the puzzle browser
The system SHALL provide a navigation control in the PuzzleBrowser that allows the user to open any of the three documentation pages. The control SHALL be visually unobtrusive (e.g. a small icon or text link in the header area) and SHALL not interfere with the puzzle list.

#### Scenario: Navigation control visible in browser
- **WHEN** the user is on the puzzle browser screen
- **THEN** a control SHALL be visible that opens the documentation section

#### Scenario: User reaches How to Play from browser
- **WHEN** the user activates the doc navigation control and selects How to Play
- **THEN** the How to Play page SHALL be displayed

### Requirement: Doc pages are reachable from the game screen
The system SHALL provide a navigation control in the GameScreen (e.g. alongside the Back button in the header) that allows the user to open documentation without losing their puzzle state. Returning from a doc page while a puzzle is active SHALL resume the game screen with state intact.

#### Scenario: Navigation control visible in game screen
- **WHEN** the user is on the game screen
- **THEN** a documentation navigation control SHALL be present in the header area

#### Scenario: Game state preserved when opening docs
- **WHEN** the user opens a doc page from the game screen and then returns
- **THEN** the game screen SHALL show the same puzzle with the same move count and block positions as before

### Requirement: A doc page selector lists all three documentation pages
The system SHALL provide a doc page selector view (or equivalent navigation mechanism) that lists all three pages — How to Play, Puzzle Format Reference, App Architecture — with a brief description of each, so the user can choose which page to read.

#### Scenario: All three pages listed
- **WHEN** the user activates the doc navigation control
- **THEN** all three documentation pages SHALL be listed with their names visible

### Requirement: Every doc page has a Back navigation control
The system SHALL display a Back button on every doc page that returns the user to the view they came from (puzzle browser or game screen).

#### Scenario: Back from doc page returns to browser
- **WHEN** the user opened a doc page from the puzzle browser and activates Back
- **THEN** the puzzle browser SHALL be displayed

#### Scenario: Back from doc page returns to game
- **WHEN** the user opened a doc page from the game screen and activates Back
- **THEN** the game screen SHALL be displayed with the active puzzle unchanged

### Requirement: App view state is extended to support doc pages
The system SHALL extend the application view state to represent doc page views without introducing a router dependency. The view discriminant SHALL cover: browser, game, doc-selector, and each of the three doc pages.

#### Scenario: View transitions are lossless
- **WHEN** the user navigates from game → doc → back to game
- **THEN** the active puzzle and its state SHALL be fully preserved across the round trip
