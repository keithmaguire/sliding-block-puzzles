import { DocPage } from './DocPage'
import { Code, FieldTable, H2, H3, Pre } from './docPageContent'
import { prose } from './docPageStyles'

interface Props { onBack: () => void }

export function PuzzleFormatReference({ onBack }: Props) {
  return (
    <DocPage title="Puzzle Format Reference" onBack={onBack}>
      <div style={prose}>
        <p>
          Puzzles are plain JSON files. This page documents every field in the canonical PuzzleJSON
          contract used by the app.
        </p>

        <H2>puzzles/index.json</H2>
        <p>
          The canonical index format is a versioned hierarchical object with a <Code>version: 2</Code>{' '}
          field and a <Code>groups</Code> array. Each group has an <Code>id</Code>, <Code>title</Code>,
          and <Code>items</Code> array whose entries are either puzzle entries or nested groups.
        </p>
        <FieldTable rows={[
          { name: 'version', type: 'integer', required: true,  description: 'Must be 2 for the canonical format.' },
          { name: 'groups',  type: 'array',   required: true,  description: 'Array of group objects, each with id, title, and items.' },
        ]} />
        <Pre>{`{
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
}`}</Pre>
        <p>
          Each puzzle entry inside <Code>items</Code> has the following fields:
        </p>
        <FieldTable rows={[
          { name: 'id',         type: 'string',  required: true,  description: 'Unique identifier — must match the id inside the puzzle file.' },
          { name: 'title',      type: 'string',  required: true,  description: 'Display name shown in the puzzle browser.' },
          { name: 'file',       type: 'string',  required: true,  description: 'Filename relative to puzzles/ (e.g. "001-slide-right.json").' },
          { name: 'source',     type: 'string',  required: false, description: 'Attribution string, e.g. "Hornden p.42".' },
          { name: 'difficulty', type: 'integer', required: false, description: '1–5 star rating.' },
          { name: 'min_moves',  type: 'integer', required: false, description: 'Minimum move count displayed alongside the move counter.' },
        ]} />
        <H2>Puzzle file — top-level fields</H2>
        <p>Required canonical fields:</p>
        <FieldTable rows={[
          { name: 'id',            type: 'string',  required: true,  description: 'Unique string identifier. Must match the index.json entry.' },
          { name: 'title',         type: 'string',  required: true,  description: 'Human-readable puzzle name.' },
          { name: 'board',         type: 'object',  required: true,  description: 'Grid dimensions. See Board section.' },
          { name: 'blocks',        type: 'array',   required: true,  description: 'Array of block objects. See Blocks section.' },
          { name: 'win_condition', type: 'object',  required: true,  description: 'Win condition descriptor. See Win Conditions section.' },
        ]} />
        <p>Optional fields:</p>
        <FieldTable rows={[
          { name: 'source',          type: 'string',  required: false, description: 'Attribution.' },
          { name: 'difficulty',      type: 'integer', required: false, description: '1–5.' },
          { name: 'min_moves',       type: 'integer', required: false, description: 'Minimum move count (computed by solver).' },
          { name: 'win_description', type: 'string',  required: false, description: 'Player-facing goal text shown as "To win: …". Required for description_only puzzles.' },
          { name: 'setup_options',   type: 'object',  required: false, description: 'Setup behavior options. See Setup Options section.' },
          { name: 'catalog',         type: 'object',  required: false, description: 'Required when the file is intended to live in puzzles/. Used to generate puzzles/index.json.' },
        ]} />
        <H2>Catalog metadata</H2>
        <p>
          Puzzle files exported for placement in <Code>puzzles/</Code> should include top-level
          <Code>catalog</Code> metadata so the build can add them to the browser automatically.
        </p>
        <FieldTable rows={[
          { name: 'group.id',    type: 'string',  required: true,  description: 'Stable group identifier used in puzzles/index.json.' },
          { name: 'group.title', type: 'string',  required: true,  description: 'Displayed group heading in the browser.' },
          { name: 'group.order', type: 'integer', required: false, description: 'Optional group sort order.' },
          { name: 'order',       type: 'integer', required: false, description: 'Optional puzzle sort order within its group.' },
        ]} />
        <Pre>{`"catalog": {
  "group": { "id": "easy", "title": "easy", "order": 10 },
  "order": 20
}`}</Pre>
        <H2>Board</H2>
        <p>The board is a rectangular bounding box.</p>
        <FieldTable rows={[
          { name: 'width',  type: 'integer', required: true, description: 'Number of columns. Minimum 2.' },
          { name: 'height', type: 'integer', required: true, description: 'Number of rows. Minimum 2.' },
        ]} />
        <Pre>{`"board": { "width": 5, "height": 4 }`}</Pre>

        <H2>Blocks</H2>
        <p>
          Each entry in the <Code>blocks</Code> array represents one game piece.
          Cell coordinates are zero-indexed with <Code>[0, 0]</Code> at the top-left.
          Block IDs must be unique within a puzzle, each block must have at least one cell,
          all cells must be within board bounds, and no two blocks may overlap.
        </p>
        <FieldTable rows={[
          { name: 'id',      type: 'string',  required: true,  description: 'Unique within the puzzle.' },
          { name: 'cells',   type: 'array',   required: true,  description: 'Array of [col, row] pairs the block occupies.' },
          { name: 'movable', type: 'boolean', required: true,  description: 'Whether the player can move this block.' },
          { name: 'appearance', type: 'object', required: true, description: 'Visual configuration for the block. See Appearance section.' },
        ]} />
        <Pre>{`{
  "id": "A",
  "movable": true,
  "cells": [[0, 1], [1, 1]],
  "appearance": {
    "type": "plain",
    "color": "#e74c3c"
  }
}`}</Pre>

        <H2>Appearance</H2>
        <p>
          Every block has an <Code>appearance</Code> object. Plain blocks use it only for fill
          color. Text and SVG blocks also carry their rendered <Code>value</Code> there.
        </p>
        <FieldTable rows={[
          { name: 'type',  type: 'string', required: true, description: '"plain", "text", or "svg".' },
          { name: 'color', type: 'string', required: true, description: 'Block fill color. Use "background" for fixed background geometry.' },
          { name: 'value', type: 'string', required: false, description: 'Required for "text" and "svg" appearances.' },
          { name: 'text_color', type: 'string', required: false, description: 'For text appearances only: "white" or "black". Defaults to "white".' },
        ]} />
        <Pre>{`{ "type": "plain", "color": "#e74c3c" }

{ "type": "text", "value": "R", "color": "#f0a500", "text_color": "black" }

{ "type": "svg", "value": "<path d='M8 48 Q32 8 56 48' stroke='white' stroke-width='5' fill='none'/>", "color": "#1f2937" }`}</Pre>
        <p>
          SVG content is rendered inside the block. Use a coordinate space of approximately
          0–64 in both axes (one grid cell is 64 px).
        </p>
        <p>
          Shipped puzzle files are validated during index generation and app builds, so invalid
          puzzle JSON blocks the build rather than quietly producing a broken puzzle list.
        </p>

        <H2>Setup Options</H2>
        <p>
          The optional <Code>setup_options</Code> object controls player-visible setup behavior
          before gameplay begins.
        </p>
        <FieldTable rows={[
          { name: 'allow_shuffle',    type: 'boolean', required: false, description: 'If true, the player may shuffle movable blocks before starting.' },
          { name: 'removable_blocks', type: 'array',   required: false, description: 'Array of block IDs the player may remove from the board before starting.' },
        ]} />
        <Pre>{`"setup_options": {
  "allow_shuffle": true,
  "removable_blocks": ["X", "Y"]
}`}</Pre>

        <H2>Win Conditions</H2>
        <p>
          The <Code>win_condition</Code> object must have a <Code>type</Code> field selecting the
          evaluator. Additional fields depend on the type. Six public types are supported.
        </p>
        <p>
          For puzzles with multiple alternative winning paths, the canonical representation is{' '}
          <Code>any_of</Code> — a single <Code>win_condition</Code> with nested conditions.
        </p>

        <H3>position</H3>
        <p>Satisfied when every authored target is occupied by a one-to-one assignment of matching blocks at the specified coordinates.</p>
        <FieldTable rows={[
          { name: 'match', type: 'object',  required: true, description: 'Physical-piece match object with appearance criteria and/or exact shape.' },
          { name: 'col',   type: 'integer', required: true, description: 'Target column.' },
          { name: 'row',   type: 'integer', required: true, description: 'Target row.' },
        ]} />
        <Pre>{`{
  "type": "position",
  "positions": [{
    "match": {
      "appearance": { "type": "plain", "color": "#e74c3c" },
      "shape": [[0, 0], [1, 0], [0, 1], [1, 1]]
    },
    "col": 3,
    "row": 2
  }]
}`}</Pre>

        <H3>Multiple Targets</H3>
        <p>
          A <Code>position</Code> win can contain multiple targets. It is satisfied when every target is simultaneously occupied by a one-to-one assignment of
          matching blocks. <strong>Word puzzles</strong> use text appearance criteria so repeated
          letters remain interchangeable.
        </p>
        <FieldTable rows={[
          { name: 'positions', type: 'array', required: true, description: 'Array of { match, col, row } entries.' },
        ]} />
        <Pre>{`{
  "type": "position",
  "positions": [
    { "match": { "appearance": { "type": "text", "value": "C" } }, "col": 0, "row": 1 },
    { "match": { "appearance": { "type": "text", "value": "A" } }, "col": 1, "row": 1 },
    { "match": { "appearance": { "type": "text", "value": "T" } }, "col": 2, "row": 1 }
  ]
}`}</Pre>

        <H3>adjacency</H3>
        <p>Satisfied when the authored relative arrangement appears anywhere on the board under a single translation.</p>
        <FieldTable rows={[
          { name: 'positions', type: 'array', required: true, description: 'At least two relative { match, col, row } entries.' },
        ]} />
        <Pre>{`{
  "type": "adjacency",
  "positions": [
    { "match": { "appearance": { "type": "plain", "color": "#f0a500" } }, "col": 0, "row": 0 },
    { "match": { "appearance": { "type": "plain", "color": "#06b6d4" } }, "col": 1, "row": 0 }
  ]
}`}</Pre>

        <p>
          Edge-reaching goals are modeled as ordinary <Code>position</Code> targets placed at the
          board edge. You can frame that target area with fixed blocks colored like the
          background if you want the edge goal to stand out visually.
        </p>

        <H3>Shape Criteria</H3>
        <p>
          Shape matching is expressed inside <Code>position</Code> or <Code>adjacency</Code>{' '}
          targets. It matches by exact normalised occupied-cell pattern only.
          Normalisation removes translation, but rotation and reflection are <em>not</em> treated
          as equivalent.
        </p>
        <FieldTable rows={[
          { name: 'shape', type: 'array',   required: true, description: 'Array of [col, row] offsets. Normalised so the minimum offset is 0 in each axis, sorted row-then-col.' },
          { name: 'col',   type: 'integer', required: true, description: 'Target column for the top-left corner.' },
          { name: 'row',   type: 'integer', required: true, description: 'Target row for the top-left corner.' },
        ]} />
        <Pre>{`{
  "type": "position",
  "match": { "shape": [[0, 0], [1, 0]] },
  "col": 3,
  "row": 2
}`}</Pre>

        <H3>any_of</H3>
        <p>
          Satisfied when <em>any</em> nested win condition is satisfied. This is the canonical way
          to express multiple alternative winning paths. The public format supports a flat list of
          non-<Code>any_of</Code> win conditions here rather than nested <Code>any_of</Code> trees.
        </p>
        <FieldTable rows={[
          { name: 'conditions', type: 'array', required: true, description: 'Non-empty array of win-condition objects. Any one satisfying wins the puzzle.' },
        ]} />
        <Pre>{`{
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
}`}</Pre>

        <H3>description_only</H3>
        <p>
          Represents a puzzle whose completion is judged by the player rather than engine-verified
          board state. The engine never signals a win automatically. These puzzles must include
          a <Code>win_description</Code> top-level field so the player knows the goal.
        </p>
        <FieldTable rows={[
          { name: 'type', type: 'string', required: true, description: 'Must be "description_only".' },
        ]} />
        <Pre>{`{
  "win_condition": { "type": "description_only" },
  "win_description": "Arrange the pieces so no two of the same color touch."
}`}</Pre>
      </div>
    </DocPage>
  )
}
