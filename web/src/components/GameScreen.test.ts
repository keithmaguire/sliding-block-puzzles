import { describe, expect, it } from 'vitest'
import { computeBoardDisplayWidth, countRemovedSetupBlocks, getInitialShuffleAvailability } from './gameSetupState'
import type { PlayablePuzzle } from '../puzzleTypes'
import { shouldReloadGameState } from './GameScreen'
import type { PuzzleApi } from '../wasm'

function makePuzzle(blockIds: string[], allowShuffle = false): PlayablePuzzle {
  return {
    id: 'puzzle',
    title: 'Puzzle',
    board: { width: 4, height: 4 },
    blocks: blockIds.map((id, index) => ({
      id,
      movable: true,
      cells: [[index, 0]] as [number, number][],
      appearance: { type: 'plain' as const, color: '#f0a500' },
    })),
    win_condition: { type: 'description_only' },
    setup_options: { removable_blocks: ['A', 'B'], ...(allowShuffle ? { allow_shuffle: true } : {}) },
  }
}

describe('countRemovedSetupBlocks', () => {
  it('counts setup-removable blocks that are no longer present', () => {
    expect(countRemovedSetupBlocks(makePuzzle(['A', 'B', 'C']), makePuzzle(['B', 'C']))).toBe(1)
  })

  it('returns zero when no removable setup blocks were removed', () => {
    expect(countRemovedSetupBlocks(makePuzzle(['A', 'B', 'C']), makePuzzle(['A', 'B', 'C']))).toBe(0)
  })

  it('ignores blocks that were never marked removable', () => {
    expect(countRemovedSetupBlocks(makePuzzle(['A', 'B', 'C']), makePuzzle(['A', 'B']))).toBe(0)
  })
})

describe('getInitialShuffleAvailability', () => {
  it('returns false for puzzles without shuffle support', () => {
    expect(getInitialShuffleAvailability(makePuzzle(['A', 'B', 'C']))).toBe(false)
  })

  it('defaults to true when shuffle is supported and no session state exists', () => {
    expect(getInitialShuffleAvailability(makePuzzle(['A', 'B', 'C'], true))).toBe(true)
  })

  it('restores persisted shuffle availability from the saved session', () => {
    expect(getInitialShuffleAvailability(makePuzzle(['A', 'B', 'C'], true), false)).toBe(false)
  })
})

describe('computeBoardDisplayWidth', () => {
  it('expands landscape boards beyond natural width to fill more screen', () => {
    expect(computeBoardDisplayWidth(900, 700, 4, 5)).toBeGreaterThan(256)
  })

  it('caps landscape board width to the available viewport width on narrow screens', () => {
    expect(computeBoardDisplayWidth(260, 240, 4, 5)).toBeLessThanOrEqual(260 - 24 * 2 - 24)
  })

  it('expands portrait boards when extra viewport height is available', () => {
    expect(computeBoardDisplayWidth(430, 932, 4, 5)).toBeGreaterThan(256)
  })

  it('does not expand beyond the portrait comfort limit', () => {
    expect(computeBoardDisplayWidth(430, 1400, 4, 5)).toBeLessThanOrEqual(430 * 0.92)
  })
})

function makeApi(): PuzzleApi {
  return {
    loadPuzzle: () => ({ ok: true, blocks: {}, moveCount: 0, won: false }),
    restoreState: () => ({ ok: true, blocks: {}, moveCount: 0, won: false }),
    tryMove: () => ({ ok: true, blocks: {}, moveCount: 0, won: false }),
    undo: () => ({ ok: true, blocks: {}, moveCount: 0, won: false }),
    reset: () => ({ ok: true, blocks: {}, moveCount: 0, won: false }),
    getState: () => ({ ok: true, blocks: {}, moveCount: 0, won: false }),
  }
}

describe('shouldReloadGameState', () => {
  it('does not reload the puzzle on an ordinary re-render for the same api and puzzle', () => {
    const api = makeApi()

    expect(shouldReloadGameState({ api, puzzleId: 'puzzle-a' }, api, 'puzzle-a')).toBe(false)
  })

  it('reloads when the selected puzzle changes', () => {
    const api = makeApi()

    expect(shouldReloadGameState({ api, puzzleId: 'puzzle-a' }, api, 'puzzle-b')).toBe(true)
  })

  it('reloads when the wasm api instance changes', () => {
    const apiA = makeApi()
    const apiB = makeApi()

    expect(shouldReloadGameState({ api: apiA, puzzleId: 'puzzle-a' }, apiB, 'puzzle-a')).toBe(true)
  })
})
