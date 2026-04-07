import { describe, expect, it } from 'vitest'
import type { PlayablePuzzle, PuzzleJSON } from '../puzzleTypes'
import { visualStateToPuzzleJSON, visualStateToPuzzleMetadata } from './puzzleEditorState'
import {
  applyVisualStateChange,
  canTryPuzzle,
  clearAuthoringState,
  makeInitialVisualState,
  popUndoHistory,
  pushUndoHistory,
  replaceAuthoringStateFromPuzzle,
  snapshotAuthoringState,
} from './puzzleCreatorState'

const EDIT_PUZZLE: PlayablePuzzle = {
  id: 'edit-me',
  title: 'Edit Me',
  source: 'Tests',
  difficulty: 3,
  min_moves: 7,
  board: { width: 4, height: 3 },
  blocks: [
    { id: 'A', movable: true, cells: [[0, 0], [1, 0]], appearance: { type: 'plain', color: '#f0a500' } },
    { id: 'B', movable: true, cells: [[3, 1]], appearance: { type: 'plain', color: '#06b6d4' } },
    { id: '__fx0', movable: false, cells: [[2, 2]], appearance: { type: 'plain', color: '#546e7a' } },
  ],
  win_condition: { type: 'position', positions: [{ match: { appearance: { type: 'plain', color: '#f0a500' } }, col: 2, row: 1 }] },
  setup_options: { allow_shuffle: true, removable_blocks: ['B'] },
}

const IMPORT_PUZZLE: PuzzleJSON = {
  id: 'imported',
  board: { width: 5, height: 4 },
  blocks: [
    { id: 'C', movable: true, cells: [[1, 1], [1, 2]], appearance: { type: 'plain', color: '#22c55e' } },
    { id: '__fx0', movable: false, cells: [[4, 3]], appearance: { type: 'plain', color: '#546e7a' } },
  ],
  win_condition: {
    type: 'adjacency',
    positions: [
      { match: { appearance: { type: 'plain', color: '#22c55e' } }, col: 0, row: 0 },
      { match: { appearance: { type: 'plain', color: '#546e7a' } }, col: 3, row: 2 },
    ],
  },
}

describe('PuzzleCreator authoring state', () => {
  it('initializes create flow with the default blank puzzle state', () => {
    const state = makeInitialVisualState()
    const puzzle = visualStateToPuzzleJSON(state)

    expect(puzzle.id).toBe('my-puzzle')
    expect(puzzle.board).toEqual({ width: 5, height: 4 })
    expect(puzzle.blocks).toEqual([])
    expect(puzzle.win_condition).toEqual({ type: 'position', positions: [{ match: { appearance: { type: 'plain', color: '#f2542d' } }, col: 0, row: 0 }] })
    expect(visualStateToPuzzleMetadata(state)).toEqual({
      title: 'My Puzzle',
      source: 'Custom',
      difficulty: 2,
      group_id: 'custom-local',
      group_title: 'Custom',
    })
  })

  it('initializes edit flow from an existing PuzzleJSON object', () => {
    const state = makeInitialVisualState(EDIT_PUZZLE)
    const puzzle = visualStateToPuzzleJSON(state)

    expect(puzzle.id).toBe(EDIT_PUZZLE.id)
    expect(puzzle.min_moves).toBe(EDIT_PUZZLE.min_moves)
    expect(puzzle.setup_options).toEqual(EDIT_PUZZLE.setup_options)
    expect(puzzle.win_condition).toEqual(EDIT_PUZZLE.win_condition)
    expect(puzzle.blocks).toMatchObject(EDIT_PUZZLE.blocks)
    expect(visualStateToPuzzleMetadata(state)).toEqual({
      title: 'Edit Me',
      source: 'Tests',
      difficulty: 3,
      group_id: 'custom-local',
      group_title: 'Custom',
    })
  })

  it('treats changes from the clean snapshot as dirty', () => {
    const cleanState = makeInitialVisualState(EDIT_PUZZLE)
    const cleanSnapshot = snapshotAuthoringState(cleanState)
    const dirtyState = { ...cleanState, title: 'Changed Title' }

    expect(snapshotAuthoringState(dirtyState)).not.toBe(cleanSnapshot)
  })

  it('replaces the current authoring state completely on JSON import and resets cleanliness', () => {
    const previousState = makeInitialVisualState(EDIT_PUZZLE)
    const previousDirtyState = { ...previousState, title: 'Unsaved Local Change', width: 6 }

    const next = replaceAuthoringStateFromPuzzle(IMPORT_PUZZLE)
    const importedPuzzle = visualStateToPuzzleJSON(next.visualState)

    expect(snapshotAuthoringState(previousDirtyState)).not.toBe(next.cleanSnapshot)
    expect(next.cleanSnapshot).toBe(snapshotAuthoringState(next.visualState))
    expect(importedPuzzle).toMatchObject({
      id: IMPORT_PUZZLE.id,
      board: IMPORT_PUZZLE.board,
      win_condition: IMPORT_PUZZLE.win_condition,
      blocks: IMPORT_PUZZLE.blocks,
    })
    expect(visualStateToPuzzleMetadata(next.visualState)).toEqual({
      title: IMPORT_PUZZLE.id,
      source: 'Custom',
      difficulty: 2,
      group_id: 'custom-local',
      group_title: 'Custom',
    })
  })

  it('clean initial state is not dirty — no confirmation should be required', () => {
    const state = makeInitialVisualState(EDIT_PUZZLE)
    const cleanSnapshot = snapshotAuthoringState(state)
    // State was just initialized from the puzzle — it should equal the clean snapshot
    expect(snapshotAuthoringState(state)).toBe(cleanSnapshot)
  })

  it('round-trips setup_options through the authoring state', () => {
    const puzzleWithSetup: PuzzleJSON = {
      ...EDIT_PUZZLE,
      setup_options: { allow_shuffle: true, removable_blocks: ['B'] },
    }
    const state = makeInitialVisualState(puzzleWithSetup)
    const roundTripped = visualStateToPuzzleJSON(state)
    expect(roundTripped.setup_options).toEqual(puzzleWithSetup.setup_options)
  })

  it('produces separate custom metadata from the authoring state', () => {
    const state = makeInitialVisualState(EDIT_PUZZLE)
    expect(visualStateToPuzzleMetadata(state)).toEqual({
      title: EDIT_PUZZLE.title!,
      source: EDIT_PUZZLE.source!,
      difficulty: EDIT_PUZZLE.difficulty!,
      group_id: 'custom-local',
      group_title: 'Custom',
    })
  })

  it('round-trips win_description through the authoring state', () => {
    const puzzleWithDesc: PuzzleJSON = {
      id: 'desc-puzzle',
      board: { width: 3, height: 2 },
      blocks: [{ id: 'A', movable: true, cells: [[0, 0]], appearance: { type: 'plain', color: '#f00' } }],
      win_condition: { type: 'description_only' },
      win_description: 'Solve it your way.',
    }
    const state = makeInitialVisualState(puzzleWithDesc)
    const roundTripped = visualStateToPuzzleJSON(state)
    expect(roundTripped.win_description).toBe('Solve it your way.')
  })

  it('round-trips text appearance color through the authoring state', () => {
    const puzzleWithLabelColor: PuzzleJSON = {
      id: 'label-color',
      board: { width: 3, height: 2 },
      blocks: [
        {
          id: 'A',
          movable: true,
          cells: [[0, 0]],
          appearance: { type: 'text', color: '#f00', value: 'A', text_color: 'black' },
        },
      ],
      win_condition: { type: 'position', positions: [{ match: { appearance: { type: 'text', value: 'A', text_color: 'black', color: '#f00' } }, col: 1, row: 0 }] },
    }

    const state = makeInitialVisualState(puzzleWithLabelColor)
    const roundTripped = visualStateToPuzzleJSON(state)
    expect(roundTripped.blocks[0].appearance).toEqual({ type: 'text', color: '#f00', value: 'A', text_color: 'black' })
  })

  it('reconstructs edge goals as ordinary position targets', () => {
    const edgePuzzle: PuzzleJSON = {
      id: 'edge-puzzle',
      board: { width: 4, height: 3 },
      blocks: [
        { id: 'A', movable: true, cells: [[0, 1], [1, 1]], appearance: { type: 'plain', color: '#f0a500' } },
      ],
      win_condition: { type: 'position', positions: [{ match: { appearance: { type: 'plain', color: '#f0a500' } }, col: 2, row: 1 }] },
    }

    const state = makeInitialVisualState(edgePuzzle)
    const roundTripped = visualStateToPuzzleJSON(state)

    expect(state.winType).toBe('position')
    expect(state.winGrid[1][2]).toBe('A')
    expect(state.winGrid[1][3]).toBe('A')
    expect(roundTripped.win_condition).toEqual(edgePuzzle.win_condition)
  })

  it('round-trips appearance-based position targets through the authoring state', () => {
    const appearanceValuePuzzle: PuzzleJSON = {
      id: 'word-slot',
      board: { width: 4, height: 2 },
      blocks: [
        { id: 'A', movable: true, cells: [[0, 0]], appearance: { type: 'text', color: '#f0a500', value: 'T' } },
        { id: 'B', movable: true, cells: [[1, 0]], appearance: { type: 'text', color: '#06b6d4', value: 'E' } },
      ],
      win_condition: { type: 'position', positions: [{ match: { appearance: { type: 'text', color: '#f0a500', value: 'T', text_color: 'white' } }, col: 2, row: 1 }] },
    }

    const state = makeInitialVisualState(appearanceValuePuzzle)
    const roundTripped = visualStateToPuzzleJSON(state)
    expect(roundTripped.win_condition).toEqual(appearanceValuePuzzle.win_condition)
  })

  it('round-trips shape-based position targets through the authoring state', () => {
    const shapePuzzle: PuzzleJSON = {
      id: 'shape-slot',
      board: { width: 4, height: 3 },
      blocks: [
        { id: 'L', movable: true, cells: [[0, 0], [0, 1], [1, 1]], appearance: { type: 'plain', color: '#f0a500' } },
        { id: 'L2', movable: true, cells: [[3, 0], [4, 0], [4, 1]], appearance: { type: 'plain', color: '#f0a500' } },
      ],
      win_condition: { type: 'position', positions: [{ match: { appearance: { type: 'plain', color: '#f0a500' }, shape: [[0, 0], [0, 1], [1, 1]] }, col: 2, row: 1 }] },
    }

    const state = makeInitialVisualState(shapePuzzle)
    const roundTripped = visualStateToPuzzleJSON(state)
    expect(roundTripped.win_condition).toEqual(shapePuzzle.win_condition)
  })

  it('clears the current authoring state back to the default blank puzzle', () => {
    const next = clearAuthoringState()
    const puzzle = visualStateToPuzzleJSON(next.visualState)

    expect(next.cleanSnapshot).toBe(snapshotAuthoringState(next.visualState))
    expect(puzzle.id).toBe('my-puzzle')
    expect(puzzle.blocks).toEqual([])
  })

  it('does not allow Try It for an empty puzzle draft', () => {
    expect(canTryPuzzle({
      id: 'empty',
      board: { width: 2, height: 2 },
      blocks: [],
      win_condition: { type: 'position', positions: [{ match: { appearance: { type: 'plain', color: '#f0a500' } }, col: 0, row: 0 }] },
    })).toBe(false)
    expect(canTryPuzzle(EDIT_PUZZLE)).toBe(true)
  })

  it('keeps only the three most recent undo states', () => {
    const s1 = { ...makeInitialVisualState(), title: '1' }
    const s2 = { ...s1, title: '2' }
    const s3 = { ...s1, title: '3' }
    const s4 = { ...s1, title: '4' }

    const history = pushUndoHistory(pushUndoHistory(pushUndoHistory(pushUndoHistory([], s1), s2), s3), s4)
    expect(history.map((state) => state.title)).toEqual(['2', '3', '4'])
  })

  it('undo restores the most recent state and shrinks history', () => {
    const s1 = { ...makeInitialVisualState(), title: '1' }
    const s2 = { ...s1, title: '2' }
    const history = pushUndoHistory(pushUndoHistory([], s1), s2)

    const popped = popUndoHistory(history)
    expect(popped.restored?.title).toBe('2')
    expect(popped.nextHistory.map((state) => state.title)).toEqual(['1'])
  })

  it('captures the actual previous visual state when applying a change', () => {
    const previous = { ...makeInitialVisualState(), title: 'Before' }
    const next = { ...previous, title: 'After' }

    const applied = applyVisualStateChange(previous, next, [])

    expect(applied.nextState.title).toBe('After')
    expect(applied.nextHistory.map((state) => state.title)).toEqual(['Before'])
  })
})
