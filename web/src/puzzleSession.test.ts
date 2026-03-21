import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearPuzzleSession, getPuzzleSession, savePuzzleSession, serializeWasmBlocks, sessionBlocksToWasm, shouldPersistPuzzleSession } from './puzzleSession'
import type { PlayablePuzzle } from './puzzleTypes'

function makeStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length },
  } as Storage
}

let storage: Storage

const basePuzzle: PlayablePuzzle = {
  id: 'demo',
  title: 'Demo',
  board: { width: 4, height: 4 },
  blocks: [
    { id: 'A', movable: true, cells: [[0, 0]], appearance: { type: 'plain', color: '#f0a500' } },
    { id: 'B', movable: false, cells: [[1, 0]], appearance: { type: 'plain', color: '#111111' } },
  ],
  win_condition: { type: 'description_only' },
}

describe('puzzleSession', () => {
  beforeEach(() => {
    storage = makeStorage()
    vi.stubGlobal('localStorage', storage)
  })

  it('saves and reloads a puzzle session by puzzle id', () => {
    savePuzzleSession('demo', {
      puzzle: basePuzzle,
      blocks: { A: [[1, 0]], B: [[1, 0]] },
      moveCount: 3,
      shuffleAvailable: false,
    })

    expect(getPuzzleSession('demo')).toEqual({
      puzzle: basePuzzle,
      blocks: { A: [[1, 0]], B: [[1, 0]] },
      moveCount: 3,
      shuffleAvailable: false,
    })
  })

  it('clears a saved session', () => {
    savePuzzleSession('demo', {
      puzzle: basePuzzle,
      blocks: { A: [[1, 0]], B: [[1, 0]] },
      moveCount: 3,
    })

    clearPuzzleSession('demo')

    expect(getPuzzleSession('demo')).toBeNull()
  })

  it('round-trips blocks between wasm and storage formats', () => {
    const wasmBlocks = {
      A: { cells: [{ col: 1, row: 2 }] },
      B: { cells: [{ col: 3, row: 0 }, { col: 3, row: 1 }] },
    }

    const serialized = serializeWasmBlocks(wasmBlocks)
    expect(serialized).toEqual({
      A: [[1, 2]],
      B: [[3, 0], [3, 1]],
    })
    expect(sessionBlocksToWasm(serialized)).toEqual({
      A: [{ col: 1, row: 2 }],
      B: [{ col: 3, row: 0 }, { col: 3, row: 1 }],
    })
  })

  it('persists sessions only when puzzle setup changed or moves were made', () => {
    expect(shouldPersistPuzzleSession(basePuzzle, basePuzzle, 0, true)).toBe(false)
    expect(shouldPersistPuzzleSession(basePuzzle, structuredClone(basePuzzle), 0, true)).toBe(false)
    expect(shouldPersistPuzzleSession(basePuzzle, basePuzzle, 2, true)).toBe(true)

    const shuffledPuzzle: PlayablePuzzle = {
      ...basePuzzle,
      blocks: [
        { ...basePuzzle.blocks[0], cells: [[2, 2]] },
        basePuzzle.blocks[1],
      ],
    }
    expect(shouldPersistPuzzleSession(basePuzzle, shuffledPuzzle, 0, true)).toBe(true)
    expect(shouldPersistPuzzleSession(basePuzzle, { ...basePuzzle, title: 'Renamed' }, 0, true)).toBe(false)
    expect(shouldPersistPuzzleSession(basePuzzle, basePuzzle, 0, false)).toBe(true)
  })
})
