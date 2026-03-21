## Approach

All styling remains inline React `CSSProperties` or a single `index.css` global sheet — no new CSS-in-JS library. CSS custom properties defined on `:root` in `index.css` provide the design tokens; components reference them via `var(--token)`.

## Design Tokens

```
--bg:          #0f1117          (page background)
--surface:     #1a1d27          (cards, panels)
--surface-hi:  #22263a          (hover state)
--border:      rgba(255,255,255,0.10)
--border-hi:   rgba(255,255,255,0.22)
--accent:      #5c7cfa          (interactive highlights, selection ring)
--text:        #e8eaf0          (primary text)
--text-dim:    rgba(232,234,240,0.55)  (secondary / metadata)
--radius-sm:   6px
--radius-md:   10px
--radius-lg:   16px
```

## Font

Use the CSS system font stack with Inter preferred:

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

Load Inter via `<link rel="preconnect">` + Google Fonts or use the local system copy — no bundled font file required.

## Component Notes

**PuzzleBrowser**
- Header: app title left, `?` button right, horizontal rule or bottom border below.
- Puzzle cards: `--surface` background, `--border` border, lift to `--surface-hi` + `--border-hi` on hover, `--radius-md`.
- Solved badge: subtle `#27ae60` tinted chip (not just a colour change on the star line).

**GameScreen**
- Top bar: `← Back` left, puzzle title centred, `?` right — use flexbox with `flex: 1` on title span.
- HUD: pill-style button group (Undo · Reset) with a divider between move counter and buttons.
- Win banner: full-width banner below board, deep green background, large move count, par delta line.

**DocPage / DocSelector**
- Max content width 680 px, generous horizontal padding on small screens.
- `<pre>` blocks: slightly lighter background from `--bg`, left accent border in `--accent`.
- DocSelector cards: same card style as PuzzleBrowser puzzle cards.

## Migration

1. Add tokens + font import to `index.css`.
2. Update each component file to use `var(--token)` in its existing inline style objects.
3. No changes to props or component logic.
