import type { CustomPuzzleRecord, PlayablePuzzle, PuzzleJSON, PuzzleMetadata } from './puzzleTypes'
import { CUSTOM_PUZZLES_KEY as KEY, HIDDEN_PUZZLES_KEY as HIDDEN_KEY, loadJsonFromStorage, saveJsonToStorage } from './localMemory'

export const CUSTOM_GROUP_ID = 'custom-local'
export const CUSTOM_GROUP_TITLE = 'Custom'

export function normalizeCustomMetadata(metadata: PuzzleMetadata, titleFallback: string): PuzzleMetadata {
  return {
    title: metadata.title.trim() || titleFallback,
    source: metadata.source.trim() || 'Custom',
    difficulty: Math.max(1, Math.trunc(metadata.difficulty || 1)),
    group_id: metadata.group_id || CUSTOM_GROUP_ID,
    group_title: metadata.group_title?.trim() || CUSTOM_GROUP_TITLE,
  }
}

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
  const parsed = loadJsonFromStorage<unknown>(KEY, [])
  if (!Array.isArray(parsed)) return []
  return parsed
    .filter((entry): entry is CustomPuzzleRecord => isCurrentCustomPuzzleRecord(entry))
    .map((entry) => ({
      puzzle: stripPuzzleMetadata(entry.puzzle),
      metadata: normalizeCustomMetadata(entry.metadata, entry.puzzle.id),
    }))
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
    metadata: normalizeCustomMetadata(record.metadata, record.puzzle.id),
  }

  const list = readCustomPuzzleRecords()
  const idx = list.findIndex((entry) => entry.puzzle.id === cleanRecord.puzzle.id)
  if (idx >= 0) list[idx] = cleanRecord
  else list.push(cleanRecord)
  saveJsonToStorage(KEY, list)
}

export function updateCustomPuzzleMetadata(id: string, metadata: PuzzleMetadata): void {
  const list = readCustomPuzzleRecords()
  const idx = list.findIndex((entry) => entry.puzzle.id === id)
  if (idx < 0) return
  list[idx] = { ...list[idx], metadata }
  saveJsonToStorage(KEY, list)
}

export function removeCustomPuzzle(id: string): void {
  const list = readCustomPuzzleRecords().filter((entry) => entry.puzzle.id !== id)
  saveJsonToStorage(KEY, list)
}

export function getHiddenPuzzleIds(): string[] {
  return loadJsonFromStorage<string[]>(HIDDEN_KEY, [])
}

export function hidePuzzle(id: string): void {
  const list = getHiddenPuzzleIds()
  if (!list.includes(id)) list.push(id)
  saveJsonToStorage(HIDDEN_KEY, list)
}

export function restoreHiddenPuzzle(id: string): void {
  const list = getHiddenPuzzleIds().filter((x) => x !== id)
  saveJsonToStorage(HIDDEN_KEY, list)
}
