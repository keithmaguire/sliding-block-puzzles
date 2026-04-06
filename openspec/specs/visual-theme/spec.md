## Capability: visual-theme

The visual theme system governs how colours, radii, and other design values are defined and consumed across the app, so that rethemeing requires changes in only one place.

---

## ADDED Requirements

### Requirement: CSS custom properties are the single source of truth for UI design values
All UI colours, radius values, and design tokens SHALL be defined as CSS custom properties in `web/src/index.css` under `:root`.

Components SHALL reference these tokens via `var(--token-name)` in their inline styles rather than hardcoding raw hex values or `rgba()` literals.

This ensures that a single edit to `index.css` is sufficient to retheme the entire app.

#### Scenario: Changing an accent colour propagates everywhere
- **WHEN** the value of `--accent` in `index.css` is changed
- **THEN** every component that uses `var(--accent)` or a derived accent token SHALL reflect the new value without any component-level changes

### Requirement: Token groups cover all semantic UI roles
The token system SHALL define named groups for each semantic role.

**Base surface and text:**
- `--bg` — page background
- `--surface`, `--surface-hi` — card and panel surfaces
- `--border`, `--border-hi` — default and highlighted borders
- `--text`, `--text-soft`, `--text-dim`, `--text-muted` — text hierarchy
- `--board-bg` — the puzzle board background

**Frame:**
- `--frame-bg`, `--frame-bg-hi` — outer app frame colours

**Accent (primary brand colour):**
- `--accent` — base accent
- `--accent-dim` — subtle accent tint for backgrounds and soft borders
- `--accent-glow` — accent shadow/glow
- `--accent-text` — bright accent text colour for labels on accent-tinted elements
- `--accent-border` — accent-coloured border for interactive elements
- `--accent-button-bg` — accent-tinted background for interactive elements

**Semantic states:**
- `--danger` — error text
- `--danger-dim` — error-tinted background
- `--danger-border` — error-tinted border
- `--success` — success/win text
- `--success-dim` — success-tinted background
- `--success-border` — success-tinted border

**Special:**
- `--text-on-block` — high-contrast text colour used when rendering text inside coloured puzzle blocks

**Radii:**
- `--radius-sm`, `--radius-md`, `--radius-lg`

#### Scenario: All interactive states use semantic tokens
- **WHEN** a component renders a button in a normal, active, error, or success state
- **THEN** it SHALL use the corresponding semantic token group rather than a hardcoded colour

### Requirement: Puzzle piece colour palette is defined in a single place
The palette of colours available to authors when painting puzzle pieces SHALL be defined as a single named constant (`BLOCK_COLORS`) in `web/src/components/puzzleEditorState.ts`.

Changing which colours are available in the puzzle editor SHALL require editing only that one location.

#### Scenario: Adding or removing an available piece colour requires one change
- **WHEN** a developer wants to add or remove a colour from the puzzle piece palette
- **THEN** they SHALL only need to edit `BLOCK_COLORS` in `puzzleEditorState.ts`

### Requirement: Decorative one-off colours may remain inline with a comment
Purely decorative treatments with no semantic reuse — such as the win banner's dark green gradient background — MAY remain as inline values provided they are accompanied by a comment explaining the exception.

#### Scenario: Decorative exception is annotated
- **WHEN** an inline hardcoded colour value appears outside `index.css`
- **THEN** it SHALL have an adjacent comment stating that it is a decorative one-off and not a semantic state

### Requirement: Category accent colours for documentation cards are locally scoped
Per-category accent colours used in the documentation card selector (e.g. teal for How to Play, purple for Puzzle Format Reference) are intentionally distinct visual identifiers and SHALL be grouped into a named constant object within `DocSelector.tsx` rather than promoted to global tokens.

#### Scenario: Doc card category colours are a local constant
- **WHEN** a developer reads DocSelector.tsx
- **THEN** the per-category colour pairs SHALL be found in a single named object at the top of the file
- **AND** they SHALL NOT be scattered as inline literals throughout the component
