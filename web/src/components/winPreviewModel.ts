import {
  blockMatchesPhysicalMatch,
  normalizeShapeCells,
  type PhysicalMatch,
  type PuzzleAppearance,
  type PuzzleBlock,
  type WinCondition,
} from '../puzzleTypes'

export interface RenderBlock {
  id: string
  color: string
  cells: { col: number; row: number }[]
  appearance?: PuzzleAppearance | null
  isFixed: boolean
  isGhost: boolean
}

export function computeRenderBlocks(blocks: PuzzleBlock[], wc: WinCondition): RenderBlock[] {
  const result: RenderBlock[] = []

  function shiftedCells(block: PuzzleBlock, targetCol: number, targetRow: number) {
    const minCol = Math.min(...block.cells.map(([col]) => col))
    const minRow = Math.min(...block.cells.map(([, row]) => row))
    const dc = targetCol - minCol
    const dr = targetRow - minRow
    return block.cells.map(([col, row]) => ({ col: col + dc, row: row + dr }))
  }

  function pushResolvedTarget(match: PhysicalMatch, col: number, row: number) {
    const block = resolveRepresentativeBlock(blocks, match)
    if (!block) return
    result.push({
      id: `${block.id}@${col},${row}`,
      color: block.appearance.color,
      cells: shiftedCells(block, col, row),
      appearance: block.appearance.type === 'plain' ? null : block.appearance,
      isFixed: false,
      isGhost: match.shape != null,
    })
  }

  if (wc.type === 'position') {
    for (const pos of wc.positions) pushResolvedTarget(pos.match, pos.col, pos.row)
  } else if (wc.type === 'adjacency') {
    for (const pos of wc.positions) pushResolvedTarget(pos.match, pos.col, pos.row)
  }

  for (const block of blocks) {
    if (!block.movable) {
      result.push({
        id: block.id,
        color: block.appearance.color,
        cells: block.cells.map(([col, row]) => ({ col, row })),
        appearance: block.appearance.type === 'plain' ? null : block.appearance,
        isFixed: true,
        isGhost: false,
      })
    }
  }

  return result
}

function resolveRepresentativeBlock(blocks: PuzzleBlock[], match: PhysicalMatch): PuzzleBlock | undefined {
  const normalizedShape = match.shape ? normalizeShapeCells(match.shape) : undefined
  return blocks.find((block) =>
    block.movable &&
    blockMatchesPhysicalMatch(block, normalizedShape ? { ...match, shape: normalizedShape } : match),
  )
}
