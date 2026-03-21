// Puzzle JSON format types (mirrors the Go loader's puzzleJSON struct).

export type PuzzleTextColor = 'white' | 'black'
export type PuzzleAppearanceType = 'plain' | 'text' | 'svg'

export interface PuzzlePlainAppearance {
  type: 'plain'
  color: string
}

export interface PuzzleTextAppearance {
  type: 'text'
  color: string
  value: string
  text_color?: PuzzleTextColor
}

export interface PuzzleSvgAppearance {
  type: 'svg'
  color: string
  value: string
}

export type PuzzleAppearance = PuzzlePlainAppearance | PuzzleTextAppearance | PuzzleSvgAppearance
export type PuzzleDecoratedAppearance = PuzzleTextAppearance | PuzzleSvgAppearance

export interface PuzzleBlock {
  id: string
  movable: boolean
  cells: [number, number][]
  appearance: PuzzleAppearance
}

export interface PuzzleAppearanceCriteria {
  type?: PuzzleAppearanceType
  color?: string
  value?: string
  text_color?: PuzzleTextColor
}

export interface PhysicalMatch {
  appearance?: PuzzleAppearanceCriteria
  shape?: [number, number][]
}

export interface PositionTarget {
  match: PhysicalMatch
  col: number
  row: number
}

export type WinCondition =
  | { type: 'position'; positions: PositionTarget[] }
  | { type: 'adjacency'; positions: PositionTarget[] }
  | { type: 'any_of'; conditions: WinCondition[] }
  | { type: 'description_only' }

// ── Puzzle index types ────────────────────────────────────────────────────────

export interface IndexEntry {
  id: string
  title: string
  file: string
  source?: string
  difficulty: number
  min_moves?: number
}

export interface PuzzleGroup {
  id: string
  title: string
  items: (IndexEntry | PuzzleGroup)[]
}

export interface PuzzleIndex {
  version: 2
  groups: PuzzleGroup[]
}

/** Type guard: is this item a group (has `items`) or a leaf puzzle entry? */
export function isGroup(item: IndexEntry | PuzzleGroup): item is PuzzleGroup {
  return 'items' in item
}

export interface SetupOptions {
  allow_shuffle?: boolean
  removable_blocks?: string[]
  [key: string]: unknown
}

export interface PuzzleCatalog {
  group: {
    id: string
    title: string
    order?: number
  }
  order?: number
}

/** Serialized PuzzleJSON structure. */
export interface PuzzleJSON {
  id: string
  title: string
  source?: string
  difficulty?: number
  min_moves?: number
  board: { width: number; height: number }
  blocks: PuzzleBlock[]
  win_condition: WinCondition
  win_description?: string
  setup_options?: SetupOptions
  catalog?: PuzzleCatalog
}

// Derived meta for the Board component — keyed by block ID.
export interface BlockMeta {
  color: string
  movable: boolean
  appearance?: PuzzleDecoratedAppearance | null
}

export function resolveBlockColor(color: string): string {
  return color === 'background' ? 'var(--frame-bg)' : color
}

export function buildBlockMeta(puzzle: PuzzleJSON): Record<string, BlockMeta> {
  const meta: Record<string, BlockMeta> = {}
  for (const block of puzzle.blocks) {
    meta[block.id] = {
      color: block.appearance.color,
      movable: block.movable,
      appearance: block.appearance.type === 'plain' ? null : block.appearance,
    }
  }
  return meta
}

export function normalizeShapeCells(cells: [number, number][]): [number, number][] {
  if (cells.length === 0) return []
  let minCol = cells[0][0]
  let minRow = cells[0][1]
  for (const [col, row] of cells) {
    if (col < minCol) minCol = col
    if (row < minRow) minRow = row
  }
  return cells
    .map(([col, row]) => [col - minCol, row - minRow] as [number, number])
    .sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1]))
}

export function sameShape(a: [number, number][], b: [number, number][]): boolean {
  return a.length === b.length && a.every((cell, index) => cell[0] === b[index]?.[0] && cell[1] === b[index]?.[1])
}

export function canonicalizeAppearance(appearance: PuzzleAppearance): PuzzleAppearance {
  if (appearance.type !== 'text') return appearance
  return { ...appearance, text_color: appearance.text_color ?? 'white' }
}

export function canonicalizeAppearanceCriteria(criteria: PuzzleAppearanceCriteria): PuzzleAppearanceCriteria {
  if (criteria.type !== 'text') return criteria
  return { ...criteria, text_color: criteria.text_color ?? 'white' }
}

export function blockMatchesPhysicalMatch(block: PuzzleBlock, match: PhysicalMatch): boolean {
  if (match.appearance) {
    const criteria = canonicalizeAppearanceCriteria(match.appearance)
    const appearance = canonicalizeAppearance(block.appearance)
    if (criteria.type != null && appearance.type !== criteria.type) return false
    if (criteria.color != null && appearance.color !== criteria.color) return false
    if (criteria.value != null) {
      if (!('value' in appearance) || appearance.value !== criteria.value) return false
    }
    if (criteria.text_color != null) {
      if (appearance.type !== 'text' || appearance.text_color !== criteria.text_color) return false
    }
  }

  if (match.shape) {
    if (!sameShape(normalizeShapeCells(block.cells), normalizeShapeCells(match.shape))) return false
  }

  return true
}

export function puzzleHasShapeVariation(blocks: PuzzleBlock[]): boolean {
  const shapes = new Set(
    blocks
      .filter((block) => block.cells.length > 0)
      .map((block) => JSON.stringify(normalizeShapeCells(block.cells))),
  )
  return shapes.size > 1
}

export function getSupportedSetupOptions(puzzle: PuzzleJSON): SetupOptions | undefined {
  const opts = puzzle.setup_options
  if (!opts) return undefined

  const blockIds = new Set(puzzle.blocks.map((block) => block.id))
  const removable = [...new Set(opts.removable_blocks ?? [])].filter((id) => blockIds.has(id))

  const supported: SetupOptions = {}
  if (opts.allow_shuffle) supported.allow_shuffle = true
  if (removable.length > 0) supported.removable_blocks = removable

  return Object.keys(supported).length > 0 ? supported : undefined
}

export function normalizePuzzleJSONInput(input: unknown): PuzzleJSON {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Imported JSON must be a puzzle object')
  }

  const raw = input as PuzzleJSON & Record<string, unknown>
  assertAllowedKeys(
    raw,
    ['id', 'title', 'source', 'difficulty', 'min_moves', 'board', 'blocks', 'win_condition', 'win_description', 'setup_options', 'catalog'],
    'root object',
  )

  if (typeof raw.id !== 'string' || raw.id.trim() === '') {
    throw new Error('Puzzle JSON is missing a valid id')
  }
  if (typeof raw.title !== 'string' || raw.title.trim() === '') {
    throw new Error('Puzzle JSON is missing a valid title')
  }
  if (!raw.board || typeof raw.board !== 'object' || Array.isArray(raw.board)) {
    throw new Error('Puzzle JSON is missing a valid board')
  }
  if (!Array.isArray(raw.blocks)) {
    throw new Error('Puzzle JSON is missing a valid blocks array')
  }
  if (!raw.win_condition || typeof raw.win_condition !== 'object' || Array.isArray(raw.win_condition)) {
    throw new Error('Puzzle JSON is missing win_condition')
  }

  for (const block of raw.blocks as unknown[]) {
    validateBlock(block)
  }
  validateWinCondition(raw.win_condition as Record<string, unknown>, true)

  if (raw.catalog != null) {
    if (typeof raw.catalog !== 'object' || Array.isArray(raw.catalog)) {
      throw new Error('Puzzle JSON catalog must be an object')
    }
    const catalogObj = raw.catalog as unknown as Record<string, unknown>
    const group = catalogObj.group
    if (!group || typeof group !== 'object' || Array.isArray(group)) {
      throw new Error('Puzzle JSON catalog.group must be an object')
    }
    const groupObj = group as Record<string, unknown>
    if (typeof groupObj.id !== 'string' || !groupObj.id.trim()) {
      throw new Error('Puzzle JSON catalog.group.id must be a non-empty string')
    }
    if (typeof groupObj.title !== 'string' || !groupObj.title.trim()) {
      throw new Error('Puzzle JSON catalog.group.title must be a non-empty string')
    }
  }

  return {
    id: raw.id,
    title: raw.title,
    ...(typeof raw.source === 'string' ? { source: raw.source } : {}),
    ...(typeof raw.difficulty === 'number' ? { difficulty: raw.difficulty } : {}),
    ...(typeof raw.min_moves === 'number' ? { min_moves: raw.min_moves } : {}),
    board: raw.board as PuzzleJSON['board'],
    blocks: raw.blocks as PuzzleJSON['blocks'],
    win_condition: raw.win_condition as PuzzleJSON['win_condition'],
    ...(typeof raw.win_description === 'string' ? { win_description: raw.win_description } : {}),
    ...(raw.setup_options && typeof raw.setup_options === 'object' && !Array.isArray(raw.setup_options)
      ? { setup_options: raw.setup_options as SetupOptions }
      : {}),
    ...(raw.catalog && typeof raw.catalog === 'object' && !Array.isArray(raw.catalog)
      ? { catalog: raw.catalog as PuzzleCatalog }
      : {}),
  }
}

function validateBlock(block: unknown) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    throw new Error('Puzzle JSON blocks must be objects')
  }
  const blockObj = block as Record<string, unknown>
  assertAllowedKeys(blockObj, ['id', 'movable', 'cells', 'appearance'], 'block')
  const appearance = blockObj.appearance
  if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
    throw new Error('Puzzle JSON block appearance must be an object')
  }
  const appearanceObj = appearance as Record<string, unknown>
  assertAllowedKeys(appearanceObj, ['type', 'color', 'value', 'text_color'], 'block appearance')
  if (typeof appearanceObj.color !== 'string' || appearanceObj.color.trim() === '') {
    throw new Error('Puzzle JSON appearance.color must be a non-empty string')
  }
  switch (appearanceObj.type) {
    case 'plain':
      if ('value' in appearanceObj) {
        throw new Error('Puzzle JSON plain appearance must not include value')
      }
      if ('text_color' in appearanceObj) {
        throw new Error('Puzzle JSON plain appearance must not include text_color')
      }
      break
    case 'text': {
      if (typeof appearanceObj.value !== 'string' || appearanceObj.value === '') {
        throw new Error('Puzzle JSON text appearance must include value')
      }
      const textColor = appearanceObj.text_color
      if (textColor != null && textColor !== 'white' && textColor !== 'black') {
        throw new Error('Puzzle JSON text appearance must use text_color "white" or "black"')
      }
      break
    }
    case 'svg':
      if (typeof appearanceObj.value !== 'string' || appearanceObj.value === '') {
        throw new Error('Puzzle JSON svg appearance must include value')
      }
      if ('text_color' in appearanceObj) {
        throw new Error('Puzzle JSON svg appearance must not include text_color')
      }
      break
    default:
      throw new Error('Puzzle JSON appearance.type must be plain, text, or svg')
  }
}

function validateWinCondition(raw: Record<string, unknown>, allowAnyOf: boolean) {
  switch (raw.type) {
    case 'position': {
      assertAllowedKeys(raw, ['type', 'positions'], 'position win_condition')
      const positions = raw.positions
      if (!Array.isArray(positions) || positions.length === 0) {
        throw new Error('Puzzle JSON position must include non-empty positions')
      }
      for (const position of positions) validateTarget(position)
      break
    }
    case 'adjacency':
      assertAllowedKeys(raw, ['type', 'positions'], 'adjacency win_condition')
      if (!Array.isArray(raw.positions) || raw.positions.length < 2) {
        throw new Error('Puzzle JSON adjacency must include at least two positions')
      }
      for (const position of raw.positions) validateTarget(position)
      break
    case 'description_only':
      assertAllowedKeys(raw, ['type'], 'description_only win_condition')
      break
    case 'any_of': {
      assertAllowedKeys(raw, ['type', 'conditions'], 'any_of win_condition')
      if (!allowAnyOf) {
        throw new Error('Puzzle JSON nested any_of win conditions are not supported')
      }
      const conditions = raw.conditions
      if (!Array.isArray(conditions) || conditions.length === 0) {
        throw new Error('Puzzle JSON any_of must include non-empty conditions')
      }
      for (const condition of conditions) {
        if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
          throw new Error('Puzzle JSON any_of conditions must be objects')
        }
        validateWinCondition(condition as Record<string, unknown>, false)
      }
      break
    }
    default:
      throw new Error('Puzzle JSON win_condition type is invalid')
  }
}

function validateTarget(raw: unknown) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Puzzle JSON target must be an object')
  }
  const target = raw as Record<string, unknown>
  assertAllowedKeys(target, ['match', 'col', 'row'], 'position target')
  if (!('match' in target) || !target.match || typeof target.match !== 'object' || Array.isArray(target.match)) {
    throw new Error('Puzzle JSON position targets must include match')
  }
  validatePhysicalMatch(target.match as Record<string, unknown>)
  if (typeof target.col !== 'number' || typeof target.row !== 'number') {
    throw new Error('Puzzle JSON position targets must include numeric col and row')
  }
}

function validatePhysicalMatch(raw: Record<string, unknown>) {
  assertAllowedKeys(raw, ['appearance', 'shape'], 'match')

  const appearance = raw.appearance
  const shape = raw.shape
  if (appearance == null && shape == null) {
    throw new Error('Puzzle JSON match must include appearance and/or shape')
  }

  if (appearance != null) validateAppearanceCriteria(appearance)
  if (shape != null) {
    if (!Array.isArray(shape) || shape.length === 0) {
      throw new Error('Puzzle JSON match.shape must be a non-empty array')
    }
  }
}

function validateAppearanceCriteria(raw: unknown) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Puzzle JSON match.appearance must be an object')
  }

  const appearance = raw as Record<string, unknown>
  assertAllowedKeys(appearance, ['type', 'color', 'value', 'text_color'], 'match.appearance')
  if (Object.keys(appearance).length === 0) {
    throw new Error('Puzzle JSON match.appearance must include at least one field')
  }

  if (appearance.type != null && appearance.type !== 'plain' && appearance.type !== 'text' && appearance.type !== 'svg') {
    throw new Error('Puzzle JSON match.appearance.type must be plain, text, or svg')
  }
  if (appearance.color != null && (typeof appearance.color !== 'string' || appearance.color.trim() === '')) {
    throw new Error('Puzzle JSON match.appearance.color must be a non-empty string')
  }
  if (appearance.value != null && (typeof appearance.value !== 'string' || appearance.value === '')) {
    throw new Error('Puzzle JSON match.appearance.value must be a non-empty string')
  }
  if (appearance.text_color != null && appearance.text_color !== 'white' && appearance.text_color !== 'black') {
    throw new Error('Puzzle JSON match.appearance.text_color must be white or black')
  }
  if (appearance.type === 'plain' && ('value' in appearance || 'text_color' in appearance)) {
    throw new Error('Puzzle JSON plain match.appearance must not include value or text_color')
  }
  if (appearance.type === 'svg' && 'text_color' in appearance) {
    throw new Error('Puzzle JSON svg match.appearance must not include text_color')
  }
}

function assertAllowedKeys(raw: Record<string, unknown>, allowed: string[], context: string) {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(raw)) {
    if (!allowedSet.has(key)) {
      throw new Error(`Puzzle JSON ${context} contains unknown field "${key}"`)
    }
  }
}
