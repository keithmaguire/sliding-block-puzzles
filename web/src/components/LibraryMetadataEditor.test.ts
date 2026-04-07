import { describe, expect, it } from 'vitest'
import type { CustomPuzzleRecord, PuzzleIndex } from '../puzzleTypes'
import { buildExportIndex, buildGroups, buildRows, findInvalidRows } from './libraryEditorUtils'

const baseIndex: PuzzleIndex = {
  version: 3,
  registries: {
    difficulties: [1, 2, 3, 4, 5],
    groups: [
      { id: 'generated-group', title: 'Generated' },
    ],
  },
  puzzles: [
    { id: 'built-in', file: 'built-in.json', title: 'Built In', source: 'Unknown', difficulty: 1, group_id: 'generated-group', min_moves: 8 },
  ],
}

function makeCustomRecord(): CustomPuzzleRecord {
  return {
    puzzle: {
      id: 'custom-1',
      board: { width: 3, height: 2 },
      blocks: [],
      win_condition: { type: 'description_only' },
      min_moves: 4,
    },
    metadata: {
      title: 'Custom One',
      source: 'Custom',
      difficulty: 2,
      group_id: 'custom-local',
      group_title: 'Custom',
    },
  }
}

describe('LibraryMetadataEditor helpers', () => {
  it('buildRows merges built-in and custom metadata rows', () => {
    expect(buildRows(baseIndex, [makeCustomRecord()])).toEqual([
      {
        origin: 'built-in',
        id: 'built-in',
        file: 'built-in.json',
        title: 'Built In',
        source: 'Unknown',
        difficulty: 1,
        groupId: 'generated-group',
        minMoves: 8,
      },
      {
        origin: 'custom',
        id: 'custom-1',
        file: '',
        title: 'Custom One',
        source: 'Custom',
        difficulty: 2,
        groupId: 'custom-local',
        minMoves: 4,
      },
    ])
  })

  it('buildGroups includes custom group titles from local metadata', () => {
    const rows = buildRows(baseIndex, [makeCustomRecord()])

    expect(buildGroups(baseIndex, [makeCustomRecord()], rows)).toEqual([
      { id: 'generated-group', title: 'Generated' },
      { id: 'custom-local', title: 'Custom' },
    ])
  })

  it('findInvalidRows rejects rows with values outside the registries', () => {
    const rows = buildRows(baseIndex, [makeCustomRecord()])

    expect(findInvalidRows(rows, [1, 2, 3, 4, 5], [{ id: 'generated-group', title: 'Generated' }])).toEqual([
      {
        origin: 'custom',
        id: 'custom-1',
        file: '',
        title: 'Custom One',
        source: 'Custom',
        difficulty: 2,
        groupId: 'custom-local',
        minMoves: 4,
      },
    ])
  })

  it('buildExportIndex excludes custom rows and unused custom-only groups', () => {
    const rows = buildRows(baseIndex, [makeCustomRecord()])
    const index = buildExportIndex(
      rows,
      [
        { id: 'generated-group', title: 'Generated' },
        { id: 'custom-local', title: 'Custom' },
      ],
    )

    expect(index).toEqual({
      version: 3,
      registries: {
        difficulties: [1, 2, 3, 4, 5],
        groups: [
          { id: 'generated-group', title: 'Generated' },
        ],
      },
      puzzles: [
        { id: 'built-in', file: 'built-in.json', title: 'Built In', source: 'Unknown', difficulty: 1, group_id: 'generated-group', min_moves: 8 },
      ],
    })
  })
})
