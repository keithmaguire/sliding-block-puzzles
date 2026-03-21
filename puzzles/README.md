# PuzzleJSON Format

Puzzles are JSON files. This document describes the `PuzzleJSON`
format used by the app.

## `puzzles/index.json`

`puzzles/index.json` is generated from the puzzle JSON files in this directory.
Do not maintain it by hand. Instead, add or update each puzzle file's
top-level `catalog` metadata and then run `make index` or `make build`.

The canonical index format is a versioned hierarchical object:

```json
{
  "version": 2,
  "groups": [
    {
      "id": "beginner",
      "title": "Beginner",
      "items": [
        {
          "id": "001-slide-right",
          "title": "Slide Right",
          "file": "001-slide-right.json",
          "source": "original",
          "difficulty": 1,
          "min_moves": 4
        }
      ]
    }
  ]
}
```

Each puzzle entry inside a group's `items` array has these fields:

| Field | Required | Type | Notes |
|---|---|---|---|
| `id` | yes | string | Unique identifier, must match the puzzle file `id` |
| `title` | yes | string | Display name shown in the puzzle browser |
| `file` | yes | string | Filename relative to `puzzles/` |
| `source` | no | string | Attribution, e.g. `"Hornden p.42"` |
| `difficulty` | no | integer | `1..5` |
| `min_moves` | no | integer | Minimum move target shown in the UI |

## Canonical puzzle file

Required top-level fields:

```json
{
  "id": "001-slide-right",
  "title": "Slide Right",
  "board": { "width": 4, "height": 3 },
  "blocks": [],
  "win_condition": {}
}
```

Optional top-level fields:

- `source`
- `difficulty`
- `min_moves`
- `catalog`
- `win_description`
- `setup_options`

## `catalog`

The optional `catalog` object controls how a puzzle appears in the generated
browser index.

```json
"catalog": {
  "group": {
    "id": "advanced",
    "title": "Advanced",
    "order": 30
  },
  "order": 10
}
```

| Field | Required | Type | Notes |
|---|---|---|---|
| `group.id` | yes | string | Stable browser group identifier |
| `group.title` | yes | string | Browser-visible group heading |
| `group.order` | no | integer | Sort order for groups; lower comes first |
| `order` | no | integer | Sort order for this puzzle inside its group |

## `board`

```json
"board": { "width": 5, "height": 4 }
```

| Field | Required | Type | Notes |
|---|---|---|---|
| `width` | yes | integer | Number of columns, minimum `2` |
| `height` | yes | integer | Number of rows, minimum `2` |

The board is a rectangular bounding box.

## `blocks`

Each entry in `blocks` represents one game piece.

```json
{
  "id": "A",
  "movable": true,
  "cells": [[0, 1], [1, 1]],
  "appearance": {
    "type": "plain",
    "color": "#e74c3c"
  }
}
```

| Field | Required | Type | Notes |
|---|---|---|---|
| `id` | yes | string | Unique within the puzzle |
| `cells` | yes | array | `[[col, row], ...]`, zero-indexed from top-left |
| `movable` | yes | boolean | Whether the player can move the block |
| `appearance` | yes | object | Visual configuration for the block |

Block invariants:

- block IDs must be unique within a puzzle
- each block must contain at least one cell
- all cells must be within board bounds
- no two blocks may overlap

### `appearance`

```json
{ "type": "plain", "color": "#e74c3c" }

{ "type": "text", "value": "A", "color": "#f0a500", "text_color": "black" }

{ "type": "svg", "value": "<path d='...' />", "color": "#1f2937" }
```

| Field | Required | Type | Notes |
|---|---|---|---|
| `type` | yes | string | `"plain"`, `"text"`, or `"svg"` |
| `color` | yes | string | Fill color; use `"background"` for fixed background geometry |
| `value` | no | string | Required for `"text"` and `"svg"` |
| `text_color` | no | string | Text color for `"text"` appearances |

SVG appearances are rendered inside the block's bounding box and should use a
roughly `64x64` coordinate space.

## `setup_options`

`setup_options` is optional and controls pre-game setup behavior.

```json
"setup_options": {
  "allow_shuffle": true,
  "removable_blocks": ["X", "Y"]
}
```

| Field | Required | Type | Notes |
|---|---|---|---|
| `allow_shuffle` | no | boolean | Allow the player to shuffle movable blocks before starting |
| `removable_blocks` | no | array | Block IDs the player may remove before starting |

## `win_condition`

The canonical format always uses a single top-level `win_condition` object.

### `position`

```json
{
  "type": "position",
  "match": {
    "appearance": { "type": "plain", "color": "#e74c3c" },
    "shape": [[0, 0], [1, 0], [0, 1], [1, 1]]
  },
  "col": 3,
  "row": 2
}
```

Satisfied when a block matching the physical-piece criteria has its top-left cell at `(col, row)`.

### `position` with multiple targets

```json
{
  "type": "position",
  "positions": [
    { "match": { "appearance": { "type": "text", "value": "A" } }, "col": 1, "row": 1 },
    { "match": { "appearance": { "type": "text", "value": "B" } }, "col": 2, "row": 1 }
  ]
}
```

Satisfied when every target is occupied by a one-to-one assignment of
matching blocks. Word puzzles use text appearance criteria so repeated letters
remain interchangeable.

### `adjacency`

```json
{
  "type": "adjacency",
  "positions": [
    { "match": { "appearance": { "type": "plain", "color": "#f0a500" } }, "col": 0, "row": 0 },
    { "match": { "appearance": { "type": "plain", "color": "#06b6d4" } }, "col": 1, "row": 0 }
  ]
}
```

Satisfied when the authored relative arrangement appears anywhere on the board
under a single translation.

Edge-reaching goals are represented as ordinary `position` targets placed on
the board edge. You can frame that target area with fixed blocks colored like
the background if you want the edge goal to stand out visually.

### shape criteria

```json
{
  "type": "position",
  "match": { "shape": [[0, 0], [1, 0]] },
  "col": 3,
  "row": 2
}
```

Satisfied when any block whose exact normalised shape matches `match.shape` has
its top-left corner at `(col, row)`. Rotation and reflection are not treated as
equivalent.

### `any_of`

```json
{
  "type": "any_of",
  "conditions": [
    {
      "type": "position",
      "positions": [{
        "match": {
          "appearance": { "type": "plain", "color": "#e74c3c" },
          "shape": [[0, 0], [1, 0], [0, 1], [1, 1]]
        },
        "col": 3,
        "row": 0
      }]
    },
    {
      "type": "position",
      "positions": [{
        "match": {
          "appearance": { "type": "plain", "color": "#e74c3c" },
          "shape": [[0, 0], [1, 0], [0, 1], [1, 1]]
        },
        "col": 3,
        "row": 4
      }]
    }
  ]
}
```

Satisfied when any listed nested win condition is satisfied. This is the
canonical way to express multiple alternative winning paths.

Public contract rule: `conditions` is a flat list of non-`any_of` win
conditions, not a nested `any_of` tree.

### `description_only`

```json
{
  "win_condition": { "type": "description_only" },
  "win_description": "Arrange the pieces so no two of the same color touch."
}
```

Represents a puzzle whose completion is judged by the player rather than
engine-verified board state. These puzzles must include `win_description` so
the player knows the goal.
