import { PUZZLE_SESSIONS_KEY as KEY } from './localMemory'
import type { PlayablePuzzle } from './puzzleTypes'
import type { WasmBlock, WasmRestoreBlocks } from './wasm'

export interface SavedPuzzleSession {
  puzzle: PlayablePuzzle
  blocks: Record<string, [number, number][]>
  moveCount: number
  shuffleAvailable?: boolean
}

type SessionStore = Record<string, SavedPuzzleSession>

function sameCells(left: [number, number][], right: [number, number][]): boolean {
  return left.length === right.length && left.every(([leftCol, leftRow], index) => {
    const [rightCol, rightRow] = right[index] ?? []
    return leftCol === rightCol && leftRow === rightRow
  })
}

function sameAppearance(
  left: PlayablePuzzle['blocks'][number]['appearance'],
  right: PlayablePuzzle['blocks'][number]['appearance'],
): boolean {
  if (left.type !== right.type) return false
  if (left.color !== right.color) return false

  if (left.type === 'plain' && right.type === 'plain') return true
  if (left.type === 'text' && right.type === 'text') {
    return left.value === right.value && (left.text_color ?? 'white') === (right.text_color ?? 'white')
  }
  if (left.type === 'svg' && right.type === 'svg') {
    return left.value === right.value
  }
  return false
}

function sameBlocks(left: PlayablePuzzle['blocks'], right: PlayablePuzzle['blocks']): boolean {
  return left.length === right.length && left.every((leftBlock, index) => {
    const rightBlock = right[index]
    if (!rightBlock) return false
    return (
      leftBlock.id === rightBlock.id &&
      leftBlock.movable === rightBlock.movable &&
      sameAppearance(leftBlock.appearance, rightBlock.appearance) &&
      sameCells(leftBlock.cells, rightBlock.cells)
    )
  })
}

function hasSetupStateChanges(initialPuzzle: PlayablePuzzle, playPuzzle: PlayablePuzzle): boolean {
  return !sameBlocks(initialPuzzle.blocks, playPuzzle.blocks)
}

function load(): SessionStore {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as SessionStore
  } catch {
    return {}
  }
}

function save(store: SessionStore) {
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function getPuzzleSession(puzzleId: string): SavedPuzzleSession | null {
  const session = load()[puzzleId]
  return session ?? null
}

export function savePuzzleSession(puzzleId: string, session: SavedPuzzleSession): void {
  const store = load()
  store[puzzleId] = session
  save(store)
}

export function clearPuzzleSession(puzzleId: string): void {
  const store = load()
  if (!(puzzleId in store)) return
  delete store[puzzleId]
  save(store)
}

export function serializeWasmBlocks(blocks: Record<string, WasmBlock>): Record<string, [number, number][]> {
  return Object.fromEntries(
    Object.entries(blocks).map(([id, block]) => [id, block.cells.map((cell) => [cell.col, cell.row] as [number, number])]),
  )
}

export function sessionBlocksToWasm(blocks: Record<string, [number, number][]>): WasmRestoreBlocks {
  return Object.fromEntries(
    Object.entries(blocks).map(([id, cells]) => [id, cells.map(([col, row]) => ({ col, row }))]),
  )
}

export function shouldPersistPuzzleSession(
  initialPuzzle: PlayablePuzzle,
  playPuzzle: PlayablePuzzle,
  moveCount: number,
  shuffleAvailable: boolean,
): boolean {
  return moveCount > 0 || hasSetupStateChanges(initialPuzzle, playPuzzle) || !shuffleAvailable
}
