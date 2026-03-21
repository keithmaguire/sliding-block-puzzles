# Text Notation Format

A notation file is plain text. Lines beginning with `#` are comments and are ignored.

## Header fields

`key: value` lines before the first section keyword:

| Key | Required | Notes |
|-----|----------|-------|
| `id` | yes | Unique puzzle identifier (no spaces) |
| `title` | yes | Display name |
| `source` | no | Attribution string |
| `difficulty` | no | Integer 1–5 |
| `par` | no | Target move count |
| `color.<token>` | no | CSS colour override for a specific token, e.g. `color.W: #78909c` |

## Sections

Two section keywords introduce grid content. Each must appear exactly once:

- `start:` — initial board layout
- `win:` — target board layout (used to derive the win condition)

A grid is one or more rows of **space-separated tokens**. All rows must have the same number of tokens. Blank lines between rows are ignored.

## Token meanings

| Token | Meaning |
|-------|---------|
| `.`   | Empty cell |
| `_`   | Void cell (non-playable area) |
| Any other string | Block identifier token |

## Block formation

1. **Connected components**: adjacent cells (orthogonally) sharing the same token form one block. Non-adjacent cells with the same token form separate blocks.
2. **ID assignment**: if a token produces exactly one connected component, its ID equals the token. If it produces multiple components, they are numbered: `F1`, `F2`, …
3. **Labels**: tokens whose string length is exactly 1 (and is not `.` or `_`) receive a text label with that character.
4. **Fixed blocks**: a block is `movable: false` if its cells are identical in both `start` and `win` grids. All other blocks are `movable: true`.

## Win condition derivation

After determining which blocks are movable, the parser compares their positions in `start` vs `win`:

- Collect all movable blocks whose position differs between `start` and `win`. Call these the *changing blocks*.
- **`multi_position`**: one entry per changing block, specifying its `win` grid position (first cell of the block, top-left in bounding box).
- If no blocks change position, the notation is an error ("start and win grids are identical").

## Colour assignment

1. For each token (in order of first appearance, left-to-right, top-to-bottom in the `start` grid), assign the next colour from the built-in palette if no `color.<token>` override is provided.
2. All connected components from the same token share the same colour.

Built-in palette (16 colours, cycling if needed):

```
#e74c3c  #e67e22  #f1c40f  #2ecc71
#1abc9c  #3498db  #9b59b6  #e91e63
#78909c  #546e7a  #263238  #795548
#ff7043  #66bb6a  #42a5f5  #ab47bc
```

## Example — d44-white-black

```
id: d44-white-black
title: WHITE & BLACK
source: Hornden D44
difficulty: 3
color.W: #78909c
color.H: #78909c
color.I: #78909c
color.T: #78909c
color.E: #78909c
color.X: #e67e22
color.F: #546e7a
color.Y: #1abc9c
color.B: #263238
color.L: #263238
color.A: #263238
color.C: #263238
color.K: #263238

start:
W H I T E
X X F . Y
X F . . Y
B L A C K

win:
B L A C K
X X F . Y
X F . . Y
W H I T E
```

Parser output for this input:
- 5×4 board
- 14 blocks: W, H, I, T, E (movable, labeled, grey), X (movable, 3-cell L-shape, orange), Y (movable, 3-cell L-shape, teal), F1 (fixed, cell [3,1], dark grey), F2 (fixed, cell [1,2], dark grey), B, L, A, C, K (movable, labeled, near-black)
- Win condition: `multi_position` with 10 entries (all letter blocks swapped rows)

## Parse errors

The parser returns a `ParseError` (not throws) for:

- Missing required header field (`id` or `title`)
- Missing `start:` or `win:` section
- Rows with inconsistent token counts
- Board smaller than 2×2
- `start` and `win` grids have different dimensions
- No movable blocks change position (trivially solved)
