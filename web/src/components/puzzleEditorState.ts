import {
  blockMatchesPhysicalMatch,
  canonicalizeAppearance,
  normalizeShapeCells,
  type PhysicalMatch,
  type PositionTarget,
  type PuzzleAppearanceType,
  type PuzzleBlock,
  type PuzzleJSON,
  type PuzzleTextColor,
  type SetupOptions,
  type WinCondition,
} from '../puzzleTypes'

type CellValue = string
type WinType = 'position' | 'adjacency' | 'description_only'

interface BlockConfig {
  id: string
  appearanceType: PuzzleAppearanceType
  color: string
  movable: boolean
  appearanceValue: string
  textColor: PuzzleTextColor
}

export interface VisualState {
  title: string
  puzzleId: string
  source: string
  difficulty: number
  minMoves: string
  catalogGroupId: string
  catalogGroupTitle: string
  catalogGroupOrder: string
  catalogOrder: string
  width: number
  height: number
  startGrid: CellValue[][]
  winGrid: CellValue[][]
  blocks: BlockConfig[]
  winType: WinType
  activeTool: string | null
  activePhase: 'start' | 'win'
  selectedBlockId: string | null
  winDescription: string
  allowShuffle: boolean
  removableBlocks: string[]
}

const BLOCK_COLORS = [
  '#f0a500',
  '#06b6d4',
  '#22c55e',
  '#ec4899',
  '#8b5cf6',
  '#fb923c',
  '#e11d48',
  '#14b8a6',
  '#78909c',
  '#000000',
  '#ffffff',
  '#ff0000',
  '#0000ff',
  '#008000',
]

const BACKGROUND_COLOR = 'background'

function indexToBlockId(n: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  n += 1
  while (n > 0) {
    n--
    result = letters[n % 26] + result
    n = Math.floor(n / 26)
  }
  return result
}

function makeGrid(h: number, w: number, fill: string): CellValue[][] {
  return Array.from({ length: h }, () => Array(w).fill(fill))
}

export function defaultVisualState(): VisualState {
  return {
    title: 'My Puzzle',
    puzzleId: 'my-puzzle',
    source: '',
    difficulty: 2,
    minMoves: '',
    catalogGroupId: 'custom',
    catalogGroupTitle: 'Custom',
    catalogGroupOrder: '',
    catalogOrder: '',
    width: 5,
    height: 4,
    startGrid: makeGrid(4, 5, ''),
    winGrid: makeGrid(4, 5, '?'),
    blocks: [],
    winType: 'position',
    activeTool: null,
    activePhase: 'start',
    selectedBlockId: null,
    winDescription: '',
    allowShuffle: false,
    removableBlocks: [],
  }
}

export function visualStateToPuzzleJSON(state: VisualState): PuzzleJSON {
  const { title, puzzleId, source, difficulty, minMoves, catalogGroupId, catalogGroupTitle, catalogGroupOrder, catalogOrder, width, height, startGrid, winGrid, blocks, winType, winDescription, allowShuffle, removableBlocks } = state

  const setup_options: SetupOptions | undefined =
    (allowShuffle || removableBlocks.length > 0)
      ? {
          ...(allowShuffle ? { allow_shuffle: true } : {}),
          ...(removableBlocks.length > 0 ? { removable_blocks: removableBlocks } : {}),
        }
      : undefined

  const catalog =
    catalogGroupId.trim() && catalogGroupTitle.trim()
      ? {
          group: {
            id: catalogGroupId.trim(),
            title: catalogGroupTitle.trim(),
            ...(catalogGroupOrder.trim() ? { order: Number(catalogGroupOrder) } : {}),
          },
          ...(catalogOrder.trim() ? { order: Number(catalogOrder) } : {}),
        }
      : undefined

  const blockCells: Record<string, [number, number][]> = {}
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const v = startGrid[r][c]
      if (v !== '') {
        ;(blockCells[v] ??= []).push([c, r])
      }
    }
  }

  const puzzleBlocks: PuzzleBlock[] = []
  for (const block of blocks) {
    const cells = blockCells[block.id] ?? []
    if (cells.length === 0) continue
    puzzleBlocks.push({
      id: block.id,
      movable: block.movable,
      appearance: buildAppearance(block),
      cells,
    })
  }

  let win_condition: WinCondition
  if (winType === 'description_only') {
    win_condition = { type: 'description_only' }
  } else {
    const positions: PositionTarget[] = []
    const seen = new Set<string>()
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const v = winGrid[r][c]
        if (v !== '' && v !== '?' && !seen.has(v)) {
          seen.add(v)
          const targetCells: [number, number][] = []
          for (let rr = 0; rr < height; rr++) {
            for (let cc = 0; cc < width; cc++) {
              if (winGrid[rr][cc] === v) targetCells.push([cc, rr])
            }
          }
          positions.push({
            match: buildWinMatchForBlock(v, blockCells, blocks),
            col: Math.min(...targetCells.map(([cc]) => cc)),
            row: Math.min(...targetCells.map(([, rr]) => rr)),
          })
        }
      }
    }

    if (winType === 'adjacency' && positions.length > 0) {
      const minCol = Math.min(...positions.map((pos) => pos.col))
      const minRow = Math.min(...positions.map((pos) => pos.row))
      win_condition = {
        type: 'adjacency',
        positions: positions.map((pos) => ({ ...pos, col: pos.col - minCol, row: pos.row - minRow })),
      }
    } else if (positions.length === 0) {
      const fallbackBlock = blocks[0]?.id
      win_condition = {
        type: 'position',
        positions: [{
          match: fallbackBlock ? buildWinMatchForBlock(fallbackBlock, blockCells, blocks) : { appearance: { type: 'plain', color: BLOCK_COLORS[0] } },
          col: 0,
          row: 0,
        }],
      }
    } else {
      win_condition = { type: 'position', positions }
    }
  }

  return {
    id: puzzleId || 'my-puzzle',
    title: title || 'My Puzzle',
    ...(source.trim() ? { source: source.trim() } : {}),
    difficulty,
    ...(minMoves.trim() ? { min_moves: Number(minMoves) } : {}),
    board: { width, height },
    blocks: puzzleBlocks,
    win_condition,
    ...(winDescription.trim() ? { win_description: winDescription.trim() } : {}),
    ...(setup_options ? { setup_options } : {}),
    ...(catalog ? { catalog } : {}),
  }
}

export function puzzleJSONToVisualState(puzzle: PuzzleJSON): Partial<VisualState> {
  const { width, height } = puzzle.board
  const startGrid = makeGrid(height, width, '')
  const winGrid = makeGrid(height, width, '?')
  const blocks: BlockConfig[] = []

  for (const blk of puzzle.blocks) {
    let vid = blk.id
    if (!vid) {
      for (let i = 0; ; i++) {
        vid = indexToBlockId(i)
        break
      }
    }

    for (const [col, row] of blk.cells) {
      if (row < height && col < width) startGrid[row][col] = vid
    }

    blocks.push({
      id: vid,
      appearanceType: blk.appearance.type,
      color: blk.appearance.color || BLOCK_COLORS[blocks.length % BLOCK_COLORS.length],
      movable: blk.movable,
      appearanceValue: 'value' in blk.appearance ? blk.appearance.value : '',
      textColor: blk.appearance.type === 'text' ? (blk.appearance.text_color ?? 'white') : 'white',
    })
  }

  const wc = puzzle.win_condition
  let winType: WinType = 'position'
  const usedSlotIds = new Set<string>()

  if (wc.type === 'adjacency') {
    winType = 'adjacency'
    for (const pos of wc.positions) {
      const slotId = pickTargetSlotId(puzzle, blocks, pos.match, usedSlotIds)
      const origBlk = puzzle.blocks.find((b) => b.id === slotId) ?? puzzle.blocks[0]
      if (!origBlk) continue
      const vid2 = mapOriginalBlockIdToVisualId(puzzle, startGrid, blocks, slotId)
      usedSlotIds.add(slotId)
      const minCol = Math.min(...origBlk.cells.map(([c]) => c))
      const minRow = Math.min(...origBlk.cells.map(([, r]) => r))
      for (const [col, row] of origBlk.cells) {
        const wc2 = pos.col + (col - minCol)
        const wr = pos.row + (row - minRow)
        if (wr >= 0 && wr < height && wc2 >= 0 && wc2 < width) winGrid[wr][wc2] = vid2
      }
    }
  } else if (wc.type === 'description_only') {
    winType = 'description_only'
  } else if (wc.type === 'position') {
    for (const pos of wc.positions) {
      const slotId = pickTargetSlotId(puzzle, blocks, pos.match, usedSlotIds)
      const origBlk = puzzle.blocks.find((b) => b.id === slotId) ?? puzzle.blocks[0]
      if (!origBlk) continue
      const vid2 = mapOriginalBlockIdToVisualId(puzzle, startGrid, blocks, slotId)
      usedSlotIds.add(slotId)

      const minCol = Math.min(...origBlk.cells.map(([c]) => c))
      const minRow = Math.min(...origBlk.cells.map(([, r]) => r))
      for (const [col, row] of origBlk.cells) {
        const wc2 = pos.col + (col - minCol)
        const wr = pos.row + (row - minRow)
        if (wr >= 0 && wr < height && wc2 >= 0 && wc2 < width) {
          winGrid[wr][wc2] = vid2
        }
      }
    }
  }

  const firstBlock = blocks[0]?.id ?? ''
  return {
    title: puzzle.title,
    puzzleId: puzzle.id,
    source: puzzle.source ?? '',
    difficulty: puzzle.difficulty,
    minMoves: puzzle.min_moves != null ? String(puzzle.min_moves) : '',
    catalogGroupId: puzzle.catalog?.group.id ?? 'custom',
    catalogGroupTitle: puzzle.catalog?.group.title ?? 'Custom',
    catalogGroupOrder: puzzle.catalog?.group.order != null ? String(puzzle.catalog.group.order) : '',
    catalogOrder: puzzle.catalog?.order != null ? String(puzzle.catalog.order) : '',
    width,
    height,
    startGrid,
    winGrid,
    blocks,
    winType,
    activeTool: firstBlock || 'erase',
    activePhase: 'start',
    selectedBlockId: null,
    winDescription: puzzle.win_description ?? '',
    allowShuffle: puzzle.setup_options?.allow_shuffle ?? false,
    removableBlocks: puzzle.setup_options?.removable_blocks ?? [],
  }
}

function buildAppearance(block: BlockConfig): PuzzleBlock['appearance'] {
  switch (block.appearanceType) {
    case 'text':
      return {
        type: 'text',
        color: block.color,
        value: block.appearanceValue,
        ...(block.textColor === 'black' ? { text_color: 'black' as const } : {}),
      }
    case 'svg':
      return {
        type: 'svg',
        color: block.color,
        value: block.appearanceValue,
      }
    default:
      return {
        type: 'plain',
        color: block.color,
      }
  }
}

function findBlockConfig(blocks: BlockConfig[], id: string): BlockConfig | undefined {
  return blocks.find((block) => block.id === id)
}

function buildWinMatchForBlock(
  slotId: string,
  blockCells: Record<string, [number, number][]>,
  blocks: BlockConfig[],
): PhysicalMatch {
  const slotBlock = findBlockConfig(blocks, slotId)
  if (!slotBlock) return { appearance: { type: 'plain', color: BLOCK_COLORS[0] } }

  const slotAppearance = canonicalizeAppearance(buildAppearance(slotBlock))
  const slotShape = normalizeShapeCells(blockCells[slotId] ?? [])
  const shapeNeeded = blocks.some((block) => {
    if (block.id === slotId) return false
    if (JSON.stringify(canonicalizeAppearance(buildAppearance(block))) !== JSON.stringify(slotAppearance)) return false
    return JSON.stringify(normalizeShapeCells(blockCells[block.id] ?? [])) !== JSON.stringify(slotShape)
  })

  return {
    appearance: slotAppearance,
    ...(shapeNeeded && slotShape.length > 0 ? { shape: slotShape } : {}),
  }
}

function pickTargetSlotId(
  puzzle: PuzzleJSON,
  blocks: BlockConfig[],
  match: PhysicalMatch,
  usedSlotIds: Set<string>,
): string {
  const candidate = puzzle.blocks.find((block) => {
    if (usedSlotIds.has(block.id)) return false
    return blockMatchesPhysicalMatch(block, match)
  })
  return candidate?.id ?? blocks.find((block) => !usedSlotIds.has(block.id))?.id ?? blocks[0]?.id ?? 'A'
}

export function usedTargetIds(state: VisualState): string[] {
  if (state.winType !== 'position') return []
  const ids = new Set<string>()
  for (const row of state.winGrid) {
    for (const cell of row) {
      if (cell !== '' && cell !== '?') ids.add(cell)
    }
  }
  return [...ids]
}

function mapOriginalBlockIdToVisualId(puzzle: PuzzleJSON, startGrid: CellValue[][], blocks: BlockConfig[], originalId: string): string {
  const origBlk = puzzle.blocks.find((b) => b.id === originalId)
  if (!origBlk) return originalId
  const visIdx = blocks.findIndex((b) =>
    origBlk.cells.length > 0 && startGrid[origBlk.cells[0][1]]?.[origBlk.cells[0][0]] === b.id,
  )
  return visIdx >= 0 ? blocks[visIdx].id : originalId
}

export function nextBlockId(blocks: BlockConfig[]): string {
  const used = new Set(blocks.map((b) => b.id))
  for (let i = 0; ; i++) {
    const id = indexToBlockId(i)
    if (!used.has(id)) return id
  }
}

export function cellsForBlockInGrid(grid: CellValue[][], blockId: string): { col: number; row: number }[] {
  const cells: { col: number; row: number }[] = []
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
      if (grid[row][col] === blockId) cells.push({ col, row })
    }
  }
  return cells
}

export function removeBlockFromVisualState(state: VisualState, id: string): VisualState {
  const newBlocks = state.blocks.filter((block) => block.id !== id)
  const newStartGrid = state.startGrid.map((row) => row.map((cell) => (cell === id ? '' : cell)))
  const newWinGrid = state.winGrid.map((row) => row.map((cell) => (cell === id ? '?' : cell)))
  const nextTool = newBlocks[0]?.id ?? 'erase'
  return {
    ...state,
    blocks: newBlocks,
    startGrid: newStartGrid,
    winGrid: newWinGrid,
    activeTool: nextTool,
    selectedBlockId: null,
    removableBlocks: state.removableBlocks.filter((rid) => rid !== id),
  }
}

export function blockDisplayValue(block: BlockConfig): string {
  if (block.appearanceType === 'text' && block.appearanceValue.trim()) return block.appearanceValue
  if (block.appearanceType === 'svg') return 'SVG'
  return block.id
}

export function toggleEraseTool(activeTool: VisualState['activeTool']): VisualState['activeTool'] {
  return activeTool === 'erase' ? null : 'erase'
}

export function clearedWinGrid(state: VisualState): VisualState['winGrid'] {
  return Array.from({ length: state.height }, () => Array.from({ length: state.width }, () => '?'))
}

export { BACKGROUND_COLOR, BLOCK_COLORS }
