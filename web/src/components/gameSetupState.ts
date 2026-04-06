import type { PuzzleJSON } from '../puzzleTypes'
import { getSupportedSetupOptions } from '../puzzleTypes'

const BASE_CELL = 64
const MAX_CELL = 128
const PORTRAIT_SIDE_GUTTER = 24
const PORTRAIT_FRAME_PADDING = 24
const PORTRAIT_RESERVED_HEIGHT = 260
const PORTRAIT_MAX_VIEWPORT_SHARE = 0.92
const LANDSCAPE_RESERVED_HEIGHT = 220

export function countRemovedSetupBlocks(originalPuzzle: PuzzleJSON, playPuzzle: PuzzleJSON): number {
  const originalRemovable = new Set(getSupportedSetupOptions(originalPuzzle)?.removable_blocks ?? [])
  if (originalRemovable.size === 0) return 0
  const currentBlockIds = new Set(playPuzzle.blocks.map((block) => block.id))
  let removed = 0
  for (const blockId of originalRemovable) {
    if (!currentBlockIds.has(blockId)) removed++
  }
  return removed
}

export function getInitialShuffleAvailability(puzzle: PuzzleJSON, savedShuffleAvailable?: boolean): boolean {
  const supportsShuffle = getSupportedSetupOptions(puzzle)?.allow_shuffle === true
  if (!supportsShuffle) return false
  return savedShuffleAvailable ?? true
}

export function computeBoardDisplayWidth(
  viewportWidth: number,
  viewportHeight: number,
  boardCols: number,
  boardRows: number,
): number {
  const naturalWidth = boardCols * BASE_CELL
  if (viewportWidth <= 0 || viewportHeight <= 0 || boardCols <= 0 || boardRows <= 0) {
    return naturalWidth
  }

  const widthLimit = Math.max(0, viewportWidth - PORTRAIT_SIDE_GUTTER * 2 - PORTRAIT_FRAME_PADDING)
  const isPortrait = viewportHeight > viewportWidth
  if (!isPortrait) {
    const maxBoardHeight = Math.max(0, viewportHeight - LANDSCAPE_RESERVED_HEIGHT)
    const aspectRatio = boardCols / boardRows
    const heightDrivenWidth = maxBoardHeight * aspectRatio - PORTRAIT_FRAME_PADDING
    const maxByCell = boardCols * MAX_CELL
    const expandedWidth = Math.max(naturalWidth, Math.min(heightDrivenWidth, maxByCell))
    return Math.min(widthLimit || naturalWidth, expandedWidth)
  }

  const aspectRatio = boardCols / boardRows
  const availableHeight = Math.max(0, viewportHeight - PORTRAIT_RESERVED_HEIGHT)
  const heightLimitedWidth = availableHeight * aspectRatio - PORTRAIT_FRAME_PADDING
  const comfortableMax = viewportWidth * PORTRAIT_MAX_VIEWPORT_SHARE
  const baseWidth = Math.min(naturalWidth, widthLimit || naturalWidth)

  return Math.max(0, Math.min(widthLimit || naturalWidth, comfortableMax, Math.max(baseWidth, heightLimitedWidth)))
}
