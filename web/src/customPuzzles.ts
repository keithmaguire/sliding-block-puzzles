import type { CustomPuzzleRecord, PuzzleJSON, PuzzleMetadata } from './puzzleTypes'
import { CUSTOM_PUZZLES_KEY as KEY, HIDDEN_PUZZLES_KEY as HIDDEN_KEY } from './localMemory'

const DEFAULT_GROUP_ID = 'custom-local'
const DEFAULT_GROUP_TITLE = 'Custom'

interface LegacyCustomPuzzle extends PuzzleJSON {
  title?: string
  source?: string
  difficulty?: number
}

function isLegacyCustomPuzzle(raw: unknown): raw is LegacyCustomPuzzle {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const candidate = raw as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.board === 'object' &&
    candidate.board != null &&
    !Array.isArray(candidate.board) &&
    Array.isArray(candidate.blocks) &&
    typeof candidate.win_condition === 'object' &&
    candidate.win_condition != null &&
    !Array.isArray(candidate.win_condition)
  )
}

function migrateRecord(entry: unknown): CustomPuzzleRecord | null {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null

  const raw = entry as Record<string, unknown>
  if ('puzzle' in raw && 'metadata' in raw) {
    const puzzle = raw.puzzle
    const metadata = raw.metadata
    if (!puzzle || typeof puzzle !== 'object' || Array.isArray(puzzle)) return null
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
    return {
      puzzle: puzzle as PuzzleJSON,
      metadata: metadata as PuzzleMetadata,
    }
  }

  if (!isLegacyCustomPuzzle(raw)) return null
  const legacy = raw
  return {
    puzzle: stripPuzzleMetadata(legacy),
    metadata: {
      title: legacy.title?.trim() || legacy.id,
      source: legacy.source?.trim() || 'Custom',
      difficulty: Number.isFinite(legacy.difficulty) ? Math.max(1, Number(legacy.difficulty)) : 1,
      group_id: DEFAULT_GROUP_ID,
      group_title: DEFAULT_GROUP_TITLE,
    },
  }
}

function readCustomPuzzleRecords(): CustomPuzzleRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((entry) => migrateRecord(entry))
      .filter((entry): entry is CustomPuzzleRecord => entry != null)
  } catch {
    return []
  }
}

export function stripPuzzleMetadata(puzzle: PuzzleJSON): PuzzleJSON {
  const { title: _title, source: _source, difficulty: _difficulty, ...gameplay } = puzzle
  return gameplay
}

export function buildPuzzleWithMetadata(record: CustomPuzzleRecord): PuzzleJSON {
  return {
    ...record.puzzle,
    title: record.metadata.title,
    source: record.metadata.source,
    difficulty: record.metadata.difficulty,
  }
}

export function getCustomPuzzleRecords(): CustomPuzzleRecord[] {
  return readCustomPuzzleRecords()
}

export function saveCustomPuzzleRecord(record: CustomPuzzleRecord): void {
  const cleanRecord: CustomPuzzleRecord = {
    puzzle: stripPuzzleMetadata(record.puzzle),
    metadata: {
      ...record.metadata,
      title: record.metadata.title.trim() || record.puzzle.id,
      source: record.metadata.source.trim() || 'Custom',
      difficulty: Math.max(1, Math.trunc(record.metadata.difficulty || 1)),
      group_id: record.metadata.group_id || DEFAULT_GROUP_ID,
      group_title: record.metadata.group_title?.trim() || DEFAULT_GROUP_TITLE,
    },
  }

  const list = readCustomPuzzleRecords()
  const idx = list.findIndex((entry) => entry.puzzle.id === cleanRecord.puzzle.id)
  if (idx >= 0) list[idx] = cleanRecord
  else list.push(cleanRecord)
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function updateCustomPuzzleMetadata(id: string, metadata: PuzzleMetadata): void {
  const list = readCustomPuzzleRecords()
  const idx = list.findIndex((entry) => entry.puzzle.id === id)
  if (idx < 0) return
  list[idx] = { ...list[idx], metadata }
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function removeCustomPuzzle(id: string): void {
  const list = readCustomPuzzleRecords().filter((entry) => entry.puzzle.id !== id)
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
