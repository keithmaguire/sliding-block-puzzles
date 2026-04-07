import type { PuzzleApi } from '../wasm'

export interface GameLoadKey {
  api: PuzzleApi
  puzzleId: string
}

export function shouldReloadGameState(lastLoaded: GameLoadKey | null, api: PuzzleApi, puzzleId: string): boolean {
  return lastLoaded?.api !== api || lastLoaded?.puzzleId !== puzzleId
}
