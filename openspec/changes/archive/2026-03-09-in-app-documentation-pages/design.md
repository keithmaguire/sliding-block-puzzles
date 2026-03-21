## Context

The app currently has two views managed by a single `activePuzzle` state in `App.tsx`: `PuzzleBrowser` (null state) and `GameScreen` (puzzle loaded). Routing is implicit — no URL changes, no router library. Adding three doc pages requires extending this view model without introducing unnecessary complexity.

The existing React component tree is small and self-contained. Content for all three doc pages is static (no data fetching, no Go WASM involvement). The `puzzles/README.md` already contains the canonical puzzle format reference and can serve as the source of truth for the in-app equivalent.

## Goals / Non-Goals

**Goals:**
- Three navigable doc pages rendered as styled JSX in the browser.
- A consistent navigation entry point reachable from both the puzzle browser and the game screen.
- A shared `DocPage` layout component for uniform typography and padding.
- No new runtime dependencies.

**Non-Goals:**
- URL-based routing (no React Router or similar).
- Markdown parsing at runtime (content is authored directly as JSX).
- Search or table-of-contents generation.
- Internationalisation.

## Decisions

### Decision 1: Extend App.tsx view state with a discriminated union

**Chosen**: Replace `activePuzzle: PuzzleJSON | null` with a `view` discriminated union:
```ts
type View =
  | { type: 'browser' }
  | { type: 'game'; puzzle: PuzzleJSON }
  | { type: 'doc'; page: 'how-to-play' | 'puzzle-format' | 'architecture' }
```

**Rationale**: The app already uses a manual view-switching pattern. A discriminated union makes all valid states explicit and exhaustive without adding a router dependency. Extending to cover doc pages is a minimal, consistent change.

**Alternative considered**: React Router with URL paths. Rejected — overkill for a static single-page app with no deep-linking requirement and adds a dependency.

### Decision 2: Static JSX content — no markdown runtime parser

**Chosen**: Doc page content is authored as JSX (headings, paragraphs, code blocks via `<pre>`/`<code>`, tables via `<table>`).

**Rationale**: Avoids a markdown parser dependency. Content for these pages is stable and controlled. JSX gives full styling flexibility using existing patterns (inline styles, consistent with the rest of the codebase).

**Alternative considered**: Bundle `.md` files and parse with `marked` or `remark` at runtime. Rejected — adds a dependency for content that never changes dynamically.

### Decision 3: Navigation via a persistent icon button in the browser header

**Chosen**: A small `?` / info button in the `PuzzleBrowser` header opens a doc page selector (inline or as a new view). From `GameScreen`, the same button is available alongside the Back button. Doc pages include a Back button returning to the previous view.

**Rationale**: Non-intrusive; doesn't compete with puzzle content. Consistent placement in both views. No modal or overlay complexity needed.

### Decision 4: Shared DocPage layout component

**Chosen**: A `DocPage` component wraps each doc page, providing a header (title + Back button) and a scrollable content area with constrained max-width and readable typography.

**Rationale**: DRY — all three pages share identical chrome. Keeps individual page components focused on content only.

## Risks / Trade-offs

- **Content staleness** — The App Architecture page describes the codebase at a point in time. As the codebase evolves, the page may drift. Mitigation: keep the page high-level (layers and data flow), not line-by-line; note in the source file that it should be updated with structural changes.
- **Puzzle Format Reference duplication** — `puzzles/README.md` and the in-app page cover the same material. Mitigation: treat README.md as the source of truth for puzzle authors working outside the browser; the in-app page is the convenient reference for players and authors using the app.
