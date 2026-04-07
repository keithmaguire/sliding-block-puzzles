import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeStorage } from './testStorage'

let storage: Storage

beforeEach(() => {
  storage = makeStorage()
  vi.stubGlobal('localStorage', storage)
})

import {
  getProgress,
  recordSolve,
} from './progress'
import { clearLocalMemory } from './localMemory'

describe('progress', () => {
  describe('getProgress', () => {
    it('returns unsolved state for unknown puzzle', () => {
      expect(getProgress('unknown')).toEqual({ solved: false, bestMoves: 0 })
    })

    it('returns empty state when storage contains invalid JSON', () => {
      storage.setItem('sliding-puzzle-progress', 'bad-json')
      expect(getProgress('p1')).toEqual({ solved: false, bestMoves: 0 })
    })

    it('returns stored progress after a solve', () => {
      recordSolve('p1', 10)
      expect(getProgress('p1')).toEqual({ solved: true, bestMoves: 10 })
    })
  })

  describe('recordSolve', () => {
    it('marks puzzle as solved with given move count', () => {
      recordSolve('p1', 5)
      const p = getProgress('p1')
      expect(p.solved).toBe(true)
      expect(p.bestMoves).toBe(5)
    })

    it('updates bestMoves when a better solve is recorded', () => {
      recordSolve('p1', 10)
      recordSolve('p1', 7)
      expect(getProgress('p1').bestMoves).toBe(7)
    })

    it('keeps existing bestMoves when a worse solve is recorded', () => {
      recordSolve('p1', 5)
      recordSolve('p1', 9)
      expect(getProgress('p1').bestMoves).toBe(5)
    })

    it('records progress independently for different puzzles', () => {
      recordSolve('p1', 3)
      recordSolve('p2', 8)
      expect(getProgress('p1').bestMoves).toBe(3)
      expect(getProgress('p2').bestMoves).toBe(8)
    })

    it('persists across multiple calls', () => {
      recordSolve('p1', 4)
      // Read from storage directly to verify persistence
      const raw = JSON.parse(storage.getItem('sliding-puzzle-progress') ?? '{}')
      expect(raw['p1']).toEqual({ solved: true, bestMoves: 4 })
    })
  })

  describe('setup-based solves record progress normally', () => {
    it('records a solve after shuffle using the original puzzle id', () => {
      // Simulate a setup-based start: shuffle returns a modified puzzle that
      // preserves the original id. GameScreen calls recordSolve(puzzle.id, moves).
      const originalId = 'puzzle-with-shuffle'
      recordSolve(originalId, 12)
      expect(getProgress(originalId)).toEqual({ solved: true, bestMoves: 12 })
    })

    it('records a solve after block removal using the original puzzle id', () => {
      const originalId = 'puzzle-with-removable'
      recordSolve(originalId, 7)
      expect(getProgress(originalId)).toEqual({ solved: true, bestMoves: 7 })
    })

    it('updates bestMoves after a setup-based solve improves on previous', () => {
      const id = 'puzzle-setup-best'
      recordSolve(id, 20)
      // Player uses shuffle, solves in fewer moves
      recordSolve(id, 15)
      expect(getProgress(id).bestMoves).toBe(15)
    })

    it('keeps bestMoves when a setup-based solve is worse than previous', () => {
      const id = 'puzzle-setup-worse'
      recordSolve(id, 8)
      // Player uses removable blocks, solves in more moves
      recordSolve(id, 14)
      expect(getProgress(id).bestMoves).toBe(8)
    })
  })

  describe('clearLocalMemory', () => {
    it('removes recorded progress', () => {
      recordSolve('p1', 4)

      clearLocalMemory()

      expect(getProgress('p1')).toEqual({ solved: false, bestMoves: 0 })
    })
  })
})
