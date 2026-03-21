## ADDED Requirements

### Requirement: App is installable as a Progressive Web App
The system SHALL be installable as a PWA on desktop and mobile browsers. It SHALL include a Web App Manifest with a display mode of `standalone`, a short name, a theme colour, and icons at 192×192 and 512×512. The app SHALL register a service worker that caches all static assets (JS bundles, WASM binary, puzzle JSON files, icons) so that the app is fully playable offline after the first load.

#### Scenario: Install prompt appears
- **WHEN** a user visits the app in a supporting browser (Chrome, Edge, Safari iOS)
- **THEN** the browser SHALL offer an "Add to Home Screen" or install prompt

#### Scenario: App opens in standalone mode
- **WHEN** the user launches the installed app
- **THEN** it SHALL open without browser chrome (no address bar, no tabs)

#### Scenario: Offline play
- **WHEN** the user has previously loaded the app and then goes offline
- **THEN** all puzzles SHALL still be playable with no network errors

### Requirement: App icons
The system SHALL provide placeholder app icons at 192×192 and 512×512 PNG, plus an SVG source icon, suitable for replacement with final artwork.

#### Scenario: Icon shown on home screen
- **WHEN** the user installs the app
- **THEN** a puzzle-themed icon SHALL appear on their home screen or app drawer
