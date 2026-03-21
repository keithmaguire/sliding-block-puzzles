import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PuzzleJSON } from './puzzleTypes'

// localStorage is not available in the node test environment — stub it globally.
function makeStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length },
  } as Storage
}

let storage: Storage

beforeEach(() => {
  storage = makeStorage()
  vi.stubGlobal('localStorage', storage)
})

// Import after stubbing so the module picks up the stub.
// (Vitest re-uses the module cache, so we import at top-level and rely on
// localStorage being stubbed before any function is called.)
import {
  buildPuzzleWithMetadata,
  getCustomPuzzleRecords,
  removeCustomPuzzle,
  saveCustomPuzzleRecord,
  getHiddenPuzzleIds,
  hidePuzzle,
  restoreHiddenPuzzle,
} from './customPuzzles'
import { clearLocalMemory } from './localMemory'

function makePuzzle(id: string): PuzzleJSON {
  return {
    id,
    title: `Puzzle ${id}`,
    source: 'custom',
    difficulty: 1,
    board: { width: 3, height: 2 },
    blocks: [],
    win_condition: { type: 'position', positions: [{ match: { appearance: { color: '#f0a500' }, shape: [[0, 0], [1, 0]] }, col: 2, row: 1 }] },
  }
}

describe('customPuzzles', () => {
  describe('getCustomPuzzleRecords', () => {
    it('returns empty array when storage is empty', () => {
      expect(getCustomPuzzleRecords()).toEqual([])
    })

    it('returns empty array when storage contains invalid JSON', () => {
      storage.setItem('sliding-puzzle-custom', 'not-json')
      expect(getCustomPuzzleRecords()).toEqual([])
    })

    it('migrates legacy stored puzzles into metadata records', () => {
      const p = makePuzzle('test-1')
      storage.setItem('sliding-puzzle-custom', JSON.stringify([p]))
      expect(getCustomPuzzleRecords()).toEqual([{
        puzzle: {
          id: p.id,
          board: p.board,
          blocks: p.blocks,
          win_condition: p.win_condition,
        },
        metadata: {
          title: p.title!,
          source: p.source!,
          difficulty: p.difficulty!,
          group_id: 'custom-local',
          group_title: 'Custom',
        },
      }])
    })
  })

  describe('saveCustomPuzzleRecord', () => {
    it('adds a new custom record to an empty list', () => {
      const p = makePuzzle('p1')
      saveCustomPuzzleRecord({
        puzzle: p,
        metadata: { title: 'Puzzle p1', source: 'custom', difficulty: 1, group_id: 'custom-local', group_title: 'Custom' },
      })
      expect(buildPuzzleWithMetadata(getCustomPuzzleRecords()[0])).toEqual(p)
    })

    it('adds multiple puzzles', () => {
      saveCustomPuzzleRecord({ puzzle: makePuzzle('p1'), metadata: { title: 'Puzzle p1', source: 'custom', difficulty: 1, group_id: 'custom-local', group_title: 'Custom' } })
      saveCustomPuzzleRecord({ puzzle: makePuzzle('p2'), metadata: { title: 'Puzzle p2', source: 'custom', difficulty: 1, group_id: 'custom-local', group_title: 'Custom' } })
      expect(getCustomPuzzleRecords().map((entry) => entry.puzzle.id)).toEqual(['p1', 'p2'])
    })

    it('updates an existing puzzle with the same id', () => {
      saveCustomPuzzleRecord({ puzzle: makePuzzle('p1'), metadata: { title: 'Puzzle p1', source: 'custom', difficulty: 1, group_id: 'custom-local', group_title: 'Custom' } })
      saveCustomPuzzleRecord({ puzzle: makePuzzle('p1'), metadata: { title: 'Updated', source: 'Tests', difficulty: 3, group_id: 'group-a', group_title: 'Group A' } })
      const list = getCustomPuzzleRecords()
      expect(list).toHaveLength(1)
      expect(list[0].metadata.title).toBe('Updated')
    })

    it('preserves extensible setup_options fields while stripping metadata from gameplay JSON', () => {
      const puzzle = {
        ...makePuzzle('p1'),
        setup_options: {
          allow_shuffle: true,
          future_flag: { mode: 'experimental' },
        },
      }
      saveCustomPuzzleRecord({
        puzzle,
        metadata: { title: 'Puzzle p1', source: 'custom', difficulty: 1, group_id: 'custom-local', group_title: 'Custom' },
      })
      const [stored] = getCustomPuzzleRecords()
      expect(stored.puzzle.setup_options).toEqual({
        allow_shuffle: true,
        future_flag: { mode: 'experimental' },
      })
      expect(stored.puzzle.title).toBeUndefined()
    })
  })

  describe('removeCustomPuzzle', () => {
    it('removes a puzzle by id', () => {
      saveCustomPuzzleRecord({ puzzle: makePuzzle('p1'), metadata: { title: 'Puzzle p1', source: 'custom', difficulty: 1, group_id: 'custom-local', group_title: 'Custom' } })
      saveCustomPuzzleRecord({ puzzle: makePuzzle('p2'), metadata: { title: 'Puzzle p2', source: 'custom', difficulty: 1, group_id: 'custom-local', group_title: 'Custom' } })
      removeCustomPuzzle('p1')
      const ids = getCustomPuzzleRecords().map((entry) => entry.puzzle.id)
      expect(ids).toEqual(['p2'])
    })

    it('is a no-op when id does not exist', () => {
      saveCustomPuzzleRecord({ puzzle: makePuzzle('p1'), metadata: { title: 'Puzzle p1', source: 'custom', difficulty: 1, group_id: 'custom-local', group_title: 'Custom' } })
      removeCustomPuzzle('does-not-exist')
      expect(getCustomPuzzleRecords()).toHaveLength(1)
    })

    it('results in empty list when last puzzle removed', () => {
      saveCustomPuzzleRecord({ puzzle: makePuzzle('p1'), metadata: { title: 'Puzzle p1', source: 'custom', difficulty: 1, group_id: 'custom-local', group_title: 'Custom' } })
      removeCustomPuzzle('p1')
      expect(getCustomPuzzleRecords()).toEqual([])
    })
  })

  describe('getHiddenPuzzleIds', () => {
    it('returns empty array when nothing hidden', () => {
      expect(getHiddenPuzzleIds()).toEqual([])
    })

    it('returns empty array when storage contains invalid JSON', () => {
      storage.setItem('sliding-puzzle-hidden', 'bad')
      expect(getHiddenPuzzleIds()).toEqual([])
    })

    it('returns stored hidden ids', () => {
      storage.setItem('sliding-puzzle-hidden', JSON.stringify(['a', 'b']))
      expect(getHiddenPuzzleIds()).toEqual(['a', 'b'])
    })
  })

  describe('hidePuzzle', () => {
    it('adds an id to the hidden list', () => {
      hidePuzzle('p1')
      expect(getHiddenPuzzleIds()).toContain('p1')
    })

    it('does not duplicate an already-hidden id', () => {
      hidePuzzle('p1')
      hidePuzzle('p1')
      expect(getHiddenPuzzleIds().filter(x => x === 'p1')).toHaveLength(1)
    })

    it('accumulates multiple hidden ids', () => {
      hidePuzzle('p1')
      hidePuzzle('p2')
      expect(getHiddenPuzzleIds()).toEqual(['p1', 'p2'])
    })
  })

  describe('restoreHiddenPuzzle', () => {
    it('removes an id from the hidden list', () => {
      hidePuzzle('p1')
      hidePuzzle('p2')
      restoreHiddenPuzzle('p1')
      expect(getHiddenPuzzleIds()).toEqual(['p2'])
    })

    it('is a no-op when id is not in hidden list', () => {
      hidePuzzle('p1')
      restoreHiddenPuzzle('not-hidden')
      expect(getHiddenPuzzleIds()).toEqual(['p1'])
    })

    it('results in empty list when last hidden id restored', () => {
      hidePuzzle('p1')
      restoreHiddenPuzzle('p1')
      expect(getHiddenPuzzleIds()).toEqual([])
    })
  })

  describe('clearLocalMemory', () => {
    it('removes custom puzzles and hidden ids from storage', () => {
      saveCustomPuzzleRecord({ puzzle: makePuzzle('p1'), metadata: { title: 'Puzzle p1', source: 'custom', difficulty: 1, group_id: 'custom-local', group_title: 'Custom' } })
      hidePuzzle('p1')

      clearLocalMemory()

      expect(getCustomPuzzleRecords()).toEqual([])
      expect(getHiddenPuzzleIds()).toEqual([])
    })
  })
})
