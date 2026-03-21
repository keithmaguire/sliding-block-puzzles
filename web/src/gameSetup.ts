import type { PuzzleJSON, PuzzleBlock } from './puzzleTypes'

/** Remove the specified blocks from the puzzle. */
export function removeBlocks(puzzle: PuzzleJSON, blockIds: string[]): PuzzleJSON {
  if (blockIds.length === 0) return puzzle
  const idSet = new Set(blockIds)
  return { ...puzzle, blocks: puzzle.blocks.filter((b) => !idSet.has(b.id)) }
}

/** Shape of a block: cell offsets from its top-left anchor. */
function blockShape(cells: [number, number][]): [number, number][] {
  const minC = Math.min(...cells.map(([c]) => c))
  const minR = Math.min(...cells.map(([, r]) => r))
  return cells.map(([c, r]) => [c - minC, r - minR])
}

/**
 * Randomly reposition all movable blocks while preserving their shapes.
 * Uses randomised greedy placement with backtracking-by-retry (up to 500 attempts).
 * Falls back to the original layout if no valid arrangement is found.
 */
export function shufflePuzzle(puzzle: PuzzleJSON): PuzzleJSON {
  const { board, blocks } = puzzle
  const { width, height } = board

  const movable = blocks.filter((b) => b.movable)
  const nonMovable = blocks.filter((b) => !b.movable)

  if (movable.length < 2) return puzzle

  const fixedCells = new Set<string>()
  for (const b of nonMovable) {
    for (const [c, r] of b.cells) fixedCells.add(`${c},${r}`)
  }

  for (let attempt = 0; attempt < 500; attempt++) {
    const order = [...movable].sort(() => Math.random() - 0.5)
    const occupied = new Set<string>(fixedCells)
    const newBlocks: PuzzleBlock[] = []
    let valid = true

    for (const block of order) {
      const shape = blockShape(block.cells)
      const maxDC = Math.max(...shape.map(([c]) => c))
      const maxDR = Math.max(...shape.map(([, r]) => r))

      const anchors: [number, number][] = []
      for (let r = 0; r + maxDR < height; r++) {
        for (let c = 0; c + maxDC < width; c++) {
          if (shape.every(([dc, dr]) => !occupied.has(`${c + dc},${r + dr}`))) {
            anchors.push([c, r])
          }
        }
      }

      if (anchors.length === 0) { valid = false; break }

      const [ac, ar] = anchors[Math.floor(Math.random() * anchors.length)]
      const newCells: [number, number][] = shape.map(([dc, dr]) => [ac + dc, ar + dr])
      newCells.forEach(([c, r]) => occupied.add(`${c},${r}`))
      newBlocks.push({ ...block, cells: newCells })
    }

    if (valid && newBlocks.length === movable.length) {
      return { ...puzzle, blocks: [...nonMovable, ...newBlocks] }
    }
  }

  return puzzle
}
