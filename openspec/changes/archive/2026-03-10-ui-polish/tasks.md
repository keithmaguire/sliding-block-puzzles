## 1. Design Tokens and Global Styles

- [x] 1.1 Add CSS custom properties (design tokens) to `index.css`: background, surface, surface-hover, border, border-hover, accent, text, text-dim, radius scale
- [x] 1.2 Add Inter font import (Google Fonts preconnect + stylesheet link) to `index.html` and set `font-family` on `body` in `index.css`
- [x] 1.3 Set page background to `var(--bg)` and base text colour to `var(--text)` in `index.css`

## 2. PuzzleBrowser Polish

- [x] 2.1 Restyle header row: app title left, `?` button right, flex spacer between; add a bottom border/rule below header
- [x] 2.2 Restyle puzzle cards: `var(--surface)` background, `var(--border)` border, `var(--radius-md)` corners, hover lift to `var(--surface-hi)` / `var(--border-hi)`
- [x] 2.3 Restyle solved indicator as a tinted chip (small badge, not just a colour change on the metadata line)

## 3. GameScreen HUD Polish

- [x] 3.1 Restyle top bar: `← Back` left-aligned, puzzle title centred with `flex: 1`, `?` right-aligned; consistent button style
- [x] 3.2 Restyle HUD: pill-style Undo/Reset button group; visual separator between move counter and buttons
- [x] 3.3 Restyle win banner: full-width, deep green background (`#27ae60`), large bold move count, par delta line, polished action buttons

## 4. DocPage and DocSelector Polish

- [x] 4.1 Restyle DocPage: `--surface` panel with padding and `--radius-lg` corners; `<pre>` code blocks get left accent border in `--accent`
- [x] 4.2 Restyle DocSelector cards to match PuzzleBrowser card style (same tokens, hover lift)

## 5. Focus Rings and Accessibility

- [x] 5.1 Add global focus-visible ring rule to `index.css` using `--accent` colour; remove default browser outline only where custom ring is applied
