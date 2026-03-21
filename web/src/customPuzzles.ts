import type { PuzzleJSON } from './puzzleTypes'
import { CUSTOM_PUZZLES_KEY as KEY, HIDDEN_PUZZLES_KEY as HIDDEN_KEY } from './localMemory'

export function getCustomPuzzles(): PuzzleJSON[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as PuzzleJSON[]
  } catch {
    return []
  }
}

export function saveCustomPuzzle(puzzle: PuzzleJSON): void {
  const list = getCustomPuzzles()
  const idx = list.findIndex((p) => p.id === puzzle.id)
  if (idx >= 0) list[idx] = puzzle
  else list.push(puzzle)
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function removeCustomPuzzle(id: string): void {
  const list = getCustomPuzzles().filter((p) => p.id !== id)
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function getHiddenPuzzleIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function hidePuzzle(id: string): void {
  const list = getHiddenPuzzleIds()
  if (!list.includes(id)) list.push(id)
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(list))
}

export function restoreHiddenPuzzle(id: string): void {
  const list = getHiddenPuzzleIds().filter((x) => x !== id)
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(list))
}
