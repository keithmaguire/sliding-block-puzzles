import { describe, it, expect } from 'vitest'
import { getSupportedSetupOptions, groupIndexPuzzles, normalizePuzzleJSONInput } from './puzzleTypes'
import type { PuzzleIndex, PuzzleJSON, SetupOptions } from './puzzleTypes'

describe('SetupOptions typing', () => {
  it('allows current public fields', () => {
    const opts: SetupOptions = { allow_shuffle: true, removable_blocks: ['A', 'B'] }
    expect(opts.allow_shuffle).toBe(true)
    expect(opts.removable_blocks).toEqual(['A', 'B'])
  })

  it('permits future setup fields without breaking current typing', () => {
    const opts = {
      allow_shuffle: true,
      removable_blocks: ['A'],
      future_flag: { mode: 'experimental' },
    } satisfies SetupOptions

    expect(opts.future_flag).toEqual({ mode: 'experimental' })
    expect(opts.allow_shuffle).toBe(true)
  })
})

describe('getSupportedSetupOptions', () => {
  function makePuzzle(setup_options?: SetupOptions): PuzzleJSON {
    return {
      id: 'setup-test',
      board: { width: 3, height: 2 },
      blocks: [
        { id: 'A', movable: true, cells: [[0, 0]], appearance: { type: 'plain', color: '#f00' } },
        { id: 'B', movable: false, cells: [[1, 0]], appearance: { type: 'plain', color: '#0f0' } },
      ],
      win_condition: { type: 'position', positions: [{ match: { appearance: { color: '#f00' }, shape: [[0, 0]] }, col: 2, row: 1 }] },
      ...(setup_options ? { setup_options } : {}),
    }
  }

  it('keeps supported shuffle and removable block options', () => {
    expect(getSupportedSetupOptions(makePuzzle({
      allow_shuffle: true,
      removable_blocks: ['A', 'B'],
    }))).toEqual({
      allow_shuffle: true,
      removable_blocks: ['A', 'B'],
    })
  })

  it('drops invalid and duplicate removable block ids', () => {
    expect(getSupportedSetupOptions(makePuzzle({
      removable_blocks: ['A', 'missing', 'A', 'B'],
    }))).toEqual({
      removable_blocks: ['A', 'B'],
    })
  })

  it('returns undefined when no supported options remain', () => {
    expect(getSupportedSetupOptions(makePuzzle({
      removable_blocks: ['missing'],
      future_flag: true,
    }))).toBeUndefined()
  })

})

describe('normalizePuzzleJSONInput', () => {
  const canonical: PuzzleJSON = {
    id: 'imported',
    board: { width: 3, height: 2 },
    blocks: [],
    win_condition: { type: 'position', positions: [{ match: { appearance: { color: '#f0a500' } }, col: 1, row: 1 }] },
  }

  it('accepts canonical win_condition input unchanged', () => {
    expect(normalizePuzzleJSONInput(canonical)).toEqual(canonical)
  })

  it('rejects superseded puzzle-file metadata fields', () => {
    expect(() => normalizePuzzleJSONInput({
      ...canonical,
      title: 'Imported Puzzle',
      source: 'Tests',
      difficulty: 3,
    } as unknown as PuzzleJSON)).toThrow(/unknown field "title"/)
  })

  it('accepts text appearance colors white and black', () => {
    expect(normalizePuzzleJSONInput({
      ...canonical,
      blocks: [
        { id: 'A', movable: true, cells: [[0, 0]], appearance: { type: 'text', color: '#f00', value: 'A', text_color: 'black' } },
      ],
    }).blocks[0].appearance).toEqual({ type: 'text', color: '#f00', value: 'A', text_color: 'black' })
  })

  it('rejects invalid text appearance colors', () => {
    expect(() => normalizePuzzleJSONInput({
      ...canonical,
      blocks: [
        { id: 'A', movable: true, cells: [[0, 0]], appearance: { type: 'text', color: '#f00', value: 'A', text_color: 'grey' } },
      ],
    })).toThrow(/text appearance must use text_color "white" or "black"/)
  })

  it('rejects unknown block fields', () => {
    expect(() => normalizePuzzleJSONInput({
      ...canonical,
      blocks: [{ id: 'A', movable: true, outline: '#f00', cells: [[0, 0]], appearance: { type: 'plain', color: '#f00' } }],
    } as unknown as PuzzleJSON)).toThrow(/block contains unknown field "outline"/)
  })

  it('rejects missing appearance', () => {
    expect(() => normalizePuzzleJSONInput({
      ...canonical,
      blocks: [{ id: 'A', movable: true, cells: [[0, 0]] }],
    } as unknown as PuzzleJSON)).toThrow(/appearance must be an object/)
  })

  it('rejects missing win_condition', () => {
    expect(() => normalizePuzzleJSONInput({
      ...canonical,
      win_condition: undefined,
    })).toThrow(/win_condition/)
  })

  it('rejects unknown top-level fields', () => {
    expect(() => normalizePuzzleJSONInput({
      ...canonical,
      extra_win: [{ type: 'adjacency', positions: [] }],
    } as unknown as PuzzleJSON)).toThrow(/root object contains unknown field "extra_win"/)
  })

  it('rejects unsupported win condition types', () => {
    expect(() => normalizePuzzleJSONInput({
      id: 'invalid-teleport',
      board: { width: 4, height: 3 },
      blocks: [
        { id: 'A', movable: true, cells: [[0, 1], [1, 1]], appearance: { type: 'plain', color: '#f00' } },
      ],
      win_condition: { type: 'teleport', piece: 'A', destination: [3, 1] },
    } as unknown as PuzzleJSON)).toThrow(/win_condition type is invalid/)
  })

  it('rejects unknown fields in position wins', () => {
    expect(() => normalizePuzzleJSONInput({
      ...canonical,
      win_condition: { type: 'position', piece: 'A', col: 1, row: 1 },
    } as unknown as PuzzleJSON)).toThrow(/position win_condition contains unknown field "piece"/)
  })

  it('rejects shape_position wins', () => {
    expect(() => normalizePuzzleJSONInput({
      ...canonical,
      win_condition: { type: 'shape_position', shape: [[0, 0]], col: 1, row: 1 },
    } as unknown as PuzzleJSON)).toThrow(/win_condition type is invalid/)
  })

  it('accepts multi-target position wins', () => {
    expect(normalizePuzzleJSONInput({
      ...canonical,
      win_condition: {
        type: 'position',
        positions: [
          { match: { appearance: { type: 'text', value: 'T' } }, col: 0, row: 0 },
          { match: { shape: [[0, 0], [1, 0]] }, col: 1, row: 0 },
        ],
      },
    }).win_condition).toEqual({
      type: 'position',
      positions: [
        { match: { appearance: { type: 'text', value: 'T' } }, col: 0, row: 0 },
        { match: { shape: [[0, 0], [1, 0]] }, col: 1, row: 0 },
      ],
    })
  })

  it('rejects invalid puzzle objects', () => {
    expect(() => normalizePuzzleJSONInput({ title: 'Missing id' })).toThrow(/unknown field "title"/)
    expect(() => normalizePuzzleJSONInput([])).toThrow(/puzzle object/)
  })

  it('rejects superseded catalog metadata', () => {
    expect(() => normalizePuzzleJSONInput({
      ...canonical,
      catalog: { group: { id: '', title: 'Group' } },
    } as unknown as PuzzleJSON)).toThrow(/unknown field "catalog"/)
  })
})

describe('groupIndexPuzzles', () => {
  it('groups flat index rows using the group registry', () => {
    const index: PuzzleIndex = {
      version: 3,
      registries: {
        difficulties: [1],
        groups: [
          { id: 'b', title: 'Beta' },
          { id: 'a', title: 'Alpha' },
        ],
      },
      puzzles: [
        { id: 'p2', file: 'p2.json', title: 'Puzzle Two', source: 'Unknown', difficulty: 1, group_id: 'b' },
        { id: 'p1', file: 'p1.json', title: 'Puzzle One', source: 'Unknown', difficulty: 1, group_id: 'a' },
      ],
    }

    expect(groupIndexPuzzles(index)).toEqual([
      {
        id: 'a',
        title: 'Alpha',
        items: [
          { id: 'p1', file: 'p1.json', title: 'Puzzle One', source: 'Unknown', difficulty: 1, group_id: 'a' },
        ],
      },
      {
        id: 'b',
        title: 'Beta',
        items: [
          { id: 'p2', file: 'p2.json', title: 'Puzzle Two', source: 'Unknown', difficulty: 1, group_id: 'b' },
        ],
      },
    ])
  })

  it('rejects puzzle rows that reference unknown groups', () => {
    const index: PuzzleIndex = {
      version: 3,
      registries: {
        difficulties: [1],
        groups: [],
      },
      puzzles: [
        { id: 'p1', file: 'p1.json', title: 'Puzzle One', source: 'Unknown', difficulty: 1, group_id: 'missing' },
      ],
    }

    expect(() => groupIndexPuzzles(index)).toThrow(/unknown group_id/)
  })
})
