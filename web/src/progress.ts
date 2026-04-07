// Progress persistence via localStorage.
import { PROGRESS_KEY as KEY, loadJsonFromStorage, saveJsonToStorage } from './localMemory'

export interface PuzzleProgress {
  solved: boolean
  bestMoves: number // 0 means never solved
}

type ProgressStore = Record<string, PuzzleProgress>

const load = (): ProgressStore => loadJsonFromStorage<ProgressStore>(KEY, {})
const save = (store: ProgressStore) => saveJsonToStorage(KEY, store)

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
