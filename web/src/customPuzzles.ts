import type { CustomPuzzleRecord, PlayablePuzzle, PuzzleJSON, PuzzleMetadata } from './puzzleTypes'
import { CUSTOM_PUZZLES_KEY as KEY, HIDDEN_PUZZLES_KEY as HIDDEN_KEY } from './localMemory'

const DEFAULT_GROUP_ID = 'custom-local'
const DEFAULT_GROUP_TITLE = 'Custom'

function isPuzzleMetadata(raw: unknown): raw is PuzzleMetadata {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const candidate = raw as Record<string, unknown>
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.source === 'string' &&
    typeof candidate.difficulty === 'number' &&
    typeof candidate.group_id === 'string' &&
    (candidate.group_title == null || typeof candidate.group_title === 'string')
  )
}

function isCurrentCustomPuzzleRecord(entry: unknown): entry is CustomPuzzleRecord {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false
  const candidate = entry as Record<string, unknown>
  if (!('puzzle' in candidate) || !('metadata' in candidate)) return false
  const puzzle = candidate.puzzle
  if (!puzzle || typeof puzzle !== 'object' || Array.isArray(puzzle)) return false
  return isPuzzleMetadata(candidate.metadata)
}

function readCustomPuzzleRecords(): CustomPuzzleRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry): entry is CustomPuzzleRecord => isCurrentCustomPuzzleRecord(entry))
      .map((entry) => ({
        puzzle: stripPuzzleMetadata(entry.puzzle),
        metadata: {
          ...entry.metadata,
          title: entry.metadata.title.trim() || entry.puzzle.id,
          source: entry.metadata.source.trim() || 'Custom',
          difficulty: Math.max(1, Math.trunc(entry.metadata.difficulty || 1)),
          group_id: entry.metadata.group_id || DEFAULT_GROUP_ID,
          group_title: entry.metadata.group_title?.trim() || DEFAULT_GROUP_TITLE,
        },
      }))
  } catch {
    return []
  }
}

export function stripPuzzleMetadata(puzzle: PlayablePuzzle): PuzzleJSON {
  const { title: _title, source: _source, difficulty: _difficulty, ...gameplay } = puzzle
  return gameplay
}

export function buildPuzzleWithMetadata(record: CustomPuzzleRecord): PlayablePuzzle {
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
