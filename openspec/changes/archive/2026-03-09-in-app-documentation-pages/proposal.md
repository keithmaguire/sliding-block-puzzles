## Why

The app currently has no in-browser documentation — a new user has no guidance on how to play, a puzzle author has no reference for the JSON format beyond a markdown file outside the app, and a developer has no overview of the architecture without reading the source. Adding three navigable doc pages addresses all three audiences without leaving the browser.

## What Changes

- Add a **How to Play** page explaining block selection, drag and keyboard controls, HUD elements, and the win screen.
- Add a **Puzzle Format Reference** page rendering the full JSON schema (board, blocks, labels, all four win condition types, index.json) with inline examples — the browser equivalent of `puzzles/README.md`.
- Add an **App Architecture** page describing the Go WASM core (model, loader, engine), the WASM export surface, and the React layer (hooks, components, data flow).
- Add a navigation entry point (info/help button or nav bar) accessible from the puzzle browser and game screen that routes to any of the three pages.
- Add a `DocPage` layout component for consistent styled rendering of doc content.

## Capabilities

### New Capabilities

- `how-to-play`: User-facing help page — block selection, drag, keyboard, HUD controls, win screen.
- `puzzle-format-reference`: In-app puzzle JSON schema reference for puzzle authors, with examples for every field and win condition type.
- `app-architecture`: Technical reference page describing project structure, Go WASM core layers, WASM API surface, and React component/data-flow overview.
- `doc-navigation`: Consistent navigation mechanism (accessible from browser and game screen) for reaching the three doc pages and returning to the puzzle browser.

### Modified Capabilities

## Impact

- New React components: `HowToPlay.tsx`, `PuzzleFormatReference.tsx`, `AppArchitecture.tsx`, `DocPage.tsx` (shared layout).
- `App.tsx` routing extended to handle doc page views alongside browser and game views.
- No changes to Go core, WASM exports, puzzle files, or localStorage schema.
- No new dependencies required — content is static JSX.
