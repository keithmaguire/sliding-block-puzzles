// Progress persistence via localStorage.
import { PROGRESS_KEY as KEY } from './localMemory'

export interface PuzzleProgress {
  solved: boolean
  bestMoves: number // 0 means never solved
}

type ProgressStore = Record<string, PuzzleProgress>

function load(): ProgressStore {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as ProgressStore
  } catch {
    return {}
  }
}

function save(store: ProgressStore) {
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function getProgress(puzzleId: string): PuzzleProgress {
  return load()[puzzleId] ?? { solved: false, bestMoves: 0 }
}

export function recordSolve(puzzleId: string, moves: number) {
  const store = load()
  const prev = store[puzzleId]
  store[puzzleId] = {
    solved: true,
    bestMoves:
      !prev || prev.bestMoves === 0 ? moves : Math.min(prev.bestMoves, moves),
  }
  save(store)
}
