## Why

The current shell UI — puzzle browser, game screen header/HUD, win notification, and documentation pages — uses minimal inline styles that feel functional but not polished. Elevating the visual design to match the quality of a published web game improves first impressions for players and puzzle authors alike.

## What Changes

- **Typography**: Adopt a refined font stack (Inter or similar system variable font) with consistent size scale, weight, and letter-spacing across all UI surfaces.
- **Colour system**: Define a small set of CSS custom properties for background, surface, border, accent, and text tones. Replace scattered `rgba()` literals with these tokens throughout.
- **PuzzleBrowser**: Styled header with brand name, difficulty star polish, solved badge design, hover/focus states on puzzle cards.
- **GameScreen HUD**: Refined button group (move counter, Undo, Reset) with better visual hierarchy; the `← Back` and `?` buttons styled as icon-text buttons rather than plain bordered boxes.
- **Win notification**: More celebratory appearance — prominent solved message, clear par comparison, polished action buttons.
- **DocPage / DocSelector**: Improved card affordance, readable line-length constraint, subtle section dividers, better code block contrast.
- **Global**: Richer background (subtle gradient or texture), smooth focus ring on all interactive elements, consistent border-radius scale.

## Capabilities

### Modified Capabilities

- `puzzle-browser-display`: Enhanced visual presentation of puzzle list and header.
- `game-hud`: Refined move counter and control button layout.
- `doc-navigation`: Polished DocSelector card list and DocPage layout.

## Non-goals

- The puzzle board and block rendering are out of scope — visual changes there risk confusing players about interactive areas.
- No new features or behavioural changes — purely presentational.
- No external CSS framework dependency (Tailwind, MUI, etc.).
