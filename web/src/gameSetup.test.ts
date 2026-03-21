import { describe, it, expect } from 'vitest'
import { removeBlocks, shufflePuzzle } from './gameSetup'
import { getSupportedSetupOptions } from './puzzleTypes'
import type { PuzzleJSON } from './puzzleTypes'

function makePuzzle(overrides: Partial<PuzzleJSON> = {}): PuzzleJSON {
  return {
    id: 'test-puzzle',
    title: 'Test',
    board: { width: 4, height: 4 },
    blocks: [
      { id: 'A', movable: true, cells: [[0, 0], [1, 0]], appearance: { type: 'plain', color: '#f00' } },
      { id: 'B', movable: true, cells: [[0, 2]], appearance: { type: 'plain', color: '#0f0' } },
      { id: 'W', movable: false, cells: [[3, 3]], appearance: { type: 'plain', color: '#888' } },
    ],
    win_condition: { type: 'position', positions: [{ match: { appearance: { color: '#f0a500' }, shape: [[0, 0]] }, col: 2, row: 3 }] },
    ...overrides,
  }
}

// ── Setup options availability ────────────────────────────────────────────────

describe('inline setup availability (via getSupportedSetupOptions)', () => {
  it('returns undefined when puzzle has no setup_options', () => {
    expect(getSupportedSetupOptions(makePuzzle())).toBeUndefined()
  })

  it('returns options when allow_shuffle is set', () => {
    const opts = getSupportedSetupOptions(makePuzzle({ setup_options: { allow_shuffle: true } }))
    expect(opts?.allow_shuffle).toBe(true)
  })

  it('returns options when removable_blocks has valid ids', () => {
    const opts = getSupportedSetupOptions(makePuzzle({ setup_options: { removable_blocks: ['A'] } }))
    expect(opts?.removable_blocks).toEqual(['A'])
  })

  it('returns undefined when all removable_blocks are invalid ids', () => {
    const opts = getSupportedSetupOptions(makePuzzle({ setup_options: { removable_blocks: ['Z'] } }))
    expect(opts).toBeUndefined()
  })
})

// ── removeBlocks ───────────────────────────────────────────────────────────────

describe('removeBlocks', () => {
  it('preserves puzzle id after block removal', () => {
    const puzzle = makePuzzle()
    const result = removeBlocks(puzzle, ['B'])
    expect(result.id).toBe('test-puzzle')
  })

  it('removes the specified block from blocks array', () => {
    const puzzle = makePuzzle()
    const result = removeBlocks(puzzle, ['B'])
    expect(result.blocks.find(b => b.id === 'B')).toBeUndefined()
    expect(result.blocks.find(b => b.id === 'A')).toBeDefined()
    expect(result.blocks.find(b => b.id === 'W')).toBeDefined()
  })

  it('removes multiple blocks', () => {
    const puzzle = makePuzzle()
    const result = removeBlocks(puzzle, ['A', 'B'])
    expect(result.blocks).toHaveLength(1)
    expect(result.blocks[0].id).toBe('W')
  })

  it('returns the same puzzle when blockIds is empty', () => {
    const puzzle = makePuzzle()
    expect(removeBlocks(puzzle, [])).toBe(puzzle)
  })

  it('preserves remaining block data unchanged', () => {
    const puzzle = makePuzzle()
    const result = removeBlocks(puzzle, ['B'])
    const a = result.blocks.find(b => b.id === 'A')!
    expect(a.cells).toEqual([[0, 0], [1, 0]])
    expect(a.appearance.color).toBe('#f00')
  })
})

// ── shufflePuzzle ──────────────────────────────────────────────────────────────

describe('shufflePuzzle', () => {
  it('preserves puzzle id after shuffle', () => {
    const result = shufflePuzzle(makePuzzle())
    expect(result.id).toBe('test-puzzle')
  })

  it('preserves block count', () => {
    const puzzle = makePuzzle()
    const result = shufflePuzzle(puzzle)
    expect(result.blocks).toHaveLength(puzzle.blocks.length)
  })

  it('preserves block shapes (cell count per block)', () => {
    const puzzle = makePuzzle()
    const result = shufflePuzzle(puzzle)
    for (const orig of puzzle.blocks) {
      const moved = result.blocks.find(b => b.id === orig.id)!
      expect(moved.cells).toHaveLength(orig.cells.length)
    }
  })

  it('all cells are within board bounds after shuffle', () => {
    const puzzle = makePuzzle()
    const { width, height } = puzzle.board
    for (let i = 0; i < 20; i++) {
      const result = shufflePuzzle(puzzle)
      for (const block of result.blocks) {
        for (const [c, r] of block.cells) {
          expect(c).toBeGreaterThanOrEqual(0)
          expect(c).toBeLessThan(width)
          expect(r).toBeGreaterThanOrEqual(0)
          expect(r).toBeLessThan(height)
        }
      }
    }
  })

  it('no two blocks overlap after shuffle', () => {
    const puzzle = makePuzzle()
    for (let i = 0; i < 20; i++) {
      const result = shufflePuzzle(puzzle)
      const seen = new Set<string>()
      for (const block of result.blocks) {
        for (const [c, r] of block.cells) {
          const key = `${c},${r}`
          expect(seen.has(key)).toBe(false)
          seen.add(key)
        }
      }
    }
  })

  it('returns original puzzle unchanged when fewer than 2 movable blocks', () => {
    const puzzle = makePuzzle({
      blocks: [
        { id: 'A', movable: true, cells: [[0, 0]], appearance: { type: 'plain', color: '#f00' } },
        { id: 'W', movable: false, cells: [[1, 0]], appearance: { type: 'plain', color: '#888' } },
      ],
    })
    expect(shufflePuzzle(puzzle)).toBe(puzzle)
  })

  it('does not move non-movable blocks', () => {
    const puzzle = makePuzzle()
    const result = shufflePuzzle(puzzle)
    const w = result.blocks.find(b => b.id === 'W')!
    expect(w.cells).toEqual([[3, 3]])
  })
})
