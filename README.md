# Sliding Block Puzzle

A browser-based sliding block puzzle app. Puzzles are described as JSON files;
the move engine runs as a Go WebAssembly module so all logic executes locally
with no backend required.

## Features

- **Puzzle browser** — lists all available puzzles with progress indicators
  (solved, in-progress, unsolved) persisted to `localStorage`.
- **Game screen** — drag or keyboard-control blocks, track moves against par,
  undo any move, reset to start.
- **Win detection** — flexible win conditions: place a physical piece matching
  appearance criteria and optional exact shape at a position, arrange multiple
  such targets for word puzzles, bring two blocks adjacent, or rely on a manual
  completion description.
- **In-app documentation** — How to Play, Puzzle Format Reference, and App
  Architecture pages accessible from the browser and game screen.
- **Go WASM engine** — move validation, undo stack, and win checking run
  entirely in the browser via WebAssembly.

## Puzzle library

| # | Title | Type |
|---|-------|------|
| 001 | Slide Right | position |
| 002 | Park the Cars | position |
| 003 | Spell CAT | word / multi-position |
| 004 | Bring Together | adjacency |
| 005 | Arc Escape | position |
| d44 | WHITE & BLACK | word / multi-position |

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Go   | 1.21           | For the WASM engine |
| Node | 18             | For the React frontend |
| npm  | 9              | Bundled with Node |

## Getting started

```bash
# 1. Clone the repo
git clone <repo-url>
cd sliding-puzzle-claude

# 2. Install frontend dependencies
cd web && npm install && cd ..

# 3. Build everything (Go WASM + React bundle)
make build

# 4. Serve the production build
make serve
# → http://localhost:8080
```

`make serve` uses Python's built-in HTTP server. Any static file server
pointed at `web/dist/` will work equally well (see [Deployment](#deployment)).

## Development

```bash
# Compile the WASM binary and copy wasm_exec.js into web/public/
make wasm

# Start the Vite dev server with hot-module reload
cd web && npm run dev
# → http://localhost:5173
```

Rerun `make wasm` whenever the Go core changes. The dev server picks up the
new binary automatically.

## Running tests

```bash
make test       # Go unit and integration tests (core/)
```

## Make targets

| Target | Description |
|--------|-------------|
| `make build` | Generate `puzzles/index.json`, build the WASM binary, then bundle the React app → `web/dist/` |
| `make index` | Generate `puzzles/index.json` from the puzzle JSON files' `catalog` metadata |
| `make wasm`  | Compile Go WASM binary and copy `wasm_exec.js` into `web/public/` |
| `make test`  | Run Go tests |
| `make serve` | Serve `web/dist/` on `http://localhost:8080` via Python |
| `make clean` | Remove compiled WASM binary and `web/dist/` |

## Deployment

The output of `make build` is a fully static site in `web/dist/`. Deploy it
to any static hosting service:

**Any HTTP server (nginx, Apache, Caddy):**

Point the document root at `web/dist/`. No server-side logic is required.
The app is a single-page application but uses no client-side routing, so a
basic static file serve is sufficient — no URL rewrite rules needed.

```nginx
server {
    listen 80;
    root /path/to/web/dist;
    index index.html;
}
```

**Python (quick local preview):**

```bash
cd web/dist && python3 -m http.server 8080
```

**Node (serve package):**

```bash
npx serve web/dist
```

**Docker:**

```dockerfile
FROM nginx:alpine
COPY web/dist /usr/share/nginx/html
```

```bash
make build
docker build -t sliding-puzzle .
docker run -p 8080:80 sliding-puzzle
# → http://localhost:8080
```

> **Note on WASM MIME type:** some servers need to be configured to serve
> `.wasm` files as `application/wasm`. nginx ≥ 1.15.6, Caddy, and most CDNs
> handle this automatically. If you see a WASM instantiation error in the
> browser console, check your server's MIME type configuration.

## Project structure

```
core/                   Go WASM engine
  model.go              Data types: Board, Block, Cell, WinCondition, GameState
  loader.go             JSON deserialisation and validation (LoadPuzzle)
  engine.go             Move logic: CanMove, TryMove, Undo, Reset, CheckWin
  cmd/wasm/             WASM entry point — exports functions to globalThis
  *_test.go             Go tests

web/                    React frontend (TypeScript + Vite)
  src/
    App.tsx             Top-level view router
    components/         UI components (PuzzleBrowser, GameScreen, DocPage, …)
    wasm/               useWasm hook and PuzzleApi typed wrappers
    progress.ts         localStorage read/write for puzzle progress
  public/               Static assets + compiled WASM binary (gitignored)
  dist/                 Production build output (gitignored)

puzzles/                Puzzle JSON files
  index.json            Generated puzzle list loaded by the browser
  README.md             Puzzle JSON format reference

Makefile                Build, test, and serve targets
```

## Adding puzzles

1. Create a puzzle JSON file in `puzzles/` following the schema in
   [`puzzles/README.md`](puzzles/README.md).
2. Set the puzzle's top-level `catalog` metadata so the browser generator
   knows its group and order.
3. Rebuild: `make build` (or run `make index` directly).

The in-app **Puzzle Format Reference** page documents every field and win
condition type with examples.
