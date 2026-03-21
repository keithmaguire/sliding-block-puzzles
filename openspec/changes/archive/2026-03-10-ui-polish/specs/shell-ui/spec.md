## MODIFIED Requirements

### Requirement: Design tokens defined as CSS custom properties
The system SHALL define a set of CSS custom properties on `:root` in `index.css` covering background, surface, surface-hover, border, border-hover, accent, primary text, and dimmed text colours, plus a consistent border-radius scale (`--radius-sm`, `--radius-md`, `--radius-lg`).

#### Scenario: Token visible at runtime
- **WHEN** the app is rendered in a browser
- **THEN** `getComputedStyle(document.documentElement).getPropertyValue('--accent')` SHALL return a non-empty string

### Requirement: Consistent typography
The system SHALL use Inter (with system-ui fallback) as the base font across all non-board surfaces. Body text SHALL use `--text` colour. Secondary metadata (source, difficulty, par) SHALL use `--text-dim`.

### Requirement: PuzzleBrowser visual polish
The system SHALL render PuzzleBrowser with:
- A styled header row containing the app title and `?` help button separated by flex spacer.
- Puzzle list cards with `--surface` background, `--border` border, `--radius-md` corners, and a hover state that lifts to `--surface-hi` / `--border-hi`.
- A solved badge rendered as a small tinted chip (not only a colour change).

### Requirement: GameScreen visual polish
The system SHALL render GameScreen with:
- A top bar where `← Back` is left-aligned, the puzzle title is centred (flex-1 span), and `?` is right-aligned.
- HUD controls (Undo, Reset) grouped as a pill-style button pair with a visual separator from the move counter.
- A win banner that spans the full content width with a deep green background, a large bold move count, and a par comparison line when par is defined.

### Requirement: DocPage and DocSelector visual polish
The system SHALL render documentation pages with:
- Content width constrained to 680 px with `--surface` panel background.
- `<pre>` code blocks styled with a left accent border in `--accent` colour.
- DocSelector page cards matching PuzzleBrowser card style (same tokens, hover lift).

### Requirement: Interactive element focus rings
Every interactive element (buttons, cards) SHALL display a visible focus ring using `--accent` colour when focused via keyboard navigation.
