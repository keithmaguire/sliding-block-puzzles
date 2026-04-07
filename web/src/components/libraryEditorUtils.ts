import type { CustomPuzzleRecord, PuzzleIndex } from '../puzzleTypes'
import { CUSTOM_GROUP_ID, CUSTOM_GROUP_TITLE } from '../customPuzzles'
import { DIFFICULTY_OPTIONS } from '../puzzleConstants'

export { CUSTOM_GROUP_ID, CUSTOM_GROUP_TITLE }
export { DIFFICULTY_OPTIONS }

export type RowOrigin = 'built-in' | 'custom'

export interface EditorRow {
  origin: RowOrigin
  id: string
  file: string
  title: string
  source: string
  difficulty: number
  groupId: string
  minMoves?: number
}

export interface GroupOption {
  id: string
  title: string
}

export function buildRows(index: PuzzleIndex, customPuzzles: CustomPuzzleRecord[]): EditorRow[] {
  const customRows = customPuzzles.map((record) => ({
    origin: 'custom' as const,
    id: record.puzzle.id,
    file: '',
    title: record.metadata.title,
    source: record.metadata.source,
    difficulty: record.metadata.difficulty,
    groupId: record.metadata.group_id || CUSTOM_GROUP_ID,
    minMoves: record.puzzle.min_moves,
  }))

  const builtInRows = index.puzzles.map((row) => ({
    origin: 'built-in' as const,
    id: row.id,
    file: row.file,
    title: row.title,
    source: row.source,
    difficulty: row.difficulty,
    groupId: row.group_id,
    minMoves: row.min_moves,
  }))

  return [...builtInRows, ...customRows]
}

export function buildGroups(index: PuzzleIndex, customPuzzles: CustomPuzzleRecord[], rows: EditorRow[]): GroupOption[] {
  const base = [
    ...index.registries.groups,
    ...customPuzzles
      .map((record) => ({
        id: record.metadata.group_id || CUSTOM_GROUP_ID,
        title: record.metadata.group_title || CUSTOM_GROUP_TITLE,
      })),
  ]
  if ((customPuzzles.length > 0 || rows.some((row) => row.groupId === CUSTOM_GROUP_ID)) && !base.some((group) => group.id === CUSTOM_GROUP_ID)) {
    base.push({ id: CUSTOM_GROUP_ID, title: CUSTOM_GROUP_TITLE })
  }

  const seen = new Set<string>()
  return base.filter((group) => {
    if (seen.has(group.id)) return false
    seen.add(group.id)
    return true
  })
}

export function findInvalidRows(
  rows: EditorRow[],
  difficulties: number[],
  groups: GroupOption[],
): EditorRow[] {
  return rows.filter((row) => (
    !difficulties.includes(row.difficulty) ||
    !groups.some((group) => group.id === row.groupId) ||
    row.title.trim() === ''
  ))
}

export function buildExportIndex(
  rows: EditorRow[],
  groups: GroupOption[],
): PuzzleIndex {
  const builtInRows = rows.filter((row) => row.origin === 'built-in')
  const usedGroupIds = new Set(builtInRows.map((row) => row.groupId))
  const exportGroups = groups.filter((group) => group.id !== CUSTOM_GROUP_ID || usedGroupIds.has(group.id))
  return {
    version: 3,
    registries: {
      difficulties: [...DIFFICULTY_OPTIONS],
      groups: exportGroups,
    },
    puzzles: builtInRows
      .map((row) => ({
        id: row.id,
        file: row.file,
        title: row.title.trim(),
        source: row.source,
        difficulty: row.difficulty,
        group_id: row.groupId,
        ...(row.minMoves != null ? { min_moves: row.minMoves } : {}),
      }))
      .sort((a, b) => (
        a.group_id === b.group_id
          ? (a.title === b.title ? a.id.localeCompare(b.id) : a.title.localeCompare(b.title))
          : a.group_id.localeCompare(b.group_id)
      )),
  }
}
