import type { PuzzleJSON } from '../puzzleTypes'
import {
  defaultVisualState,
  puzzleJSONToVisualState,
  visualStateToPuzzleJSON,
  type VisualState,
} from './puzzleEditorState'

export function makeInitialVisualState(initialPuzzle?: PuzzleJSON): VisualState {
  if (initialPuzzle) {
    return { ...defaultVisualState(), ...puzzleJSONToVisualState(initialPuzzle) }
  }
  return defaultVisualState()
}

export function snapshotAuthoringState(state: VisualState): string {
  return JSON.stringify({
    puzzle: visualStateToPuzzleJSON(state),
    metadata: {
      title: state.title,
      source: state.source,
      difficulty: state.difficulty,
    },
  })
}

export function replaceAuthoringStateFromPuzzle(puzzle: PuzzleJSON): {
  visualState: VisualState
  cleanSnapshot: string
} {
  const visualState = { ...defaultVisualState(), ...puzzleJSONToVisualState(puzzle) }
  return {
    visualState,
    cleanSnapshot: snapshotAuthoringState(visualState),
  }
}

export function clearAuthoringState(): {
  visualState: VisualState
  cleanSnapshot: string
} {
  const visualState = defaultVisualState()
  return {
    visualState,
    cleanSnapshot: snapshotAuthoringState(visualState),
  }
}

export function canTryPuzzle(puzzle: PuzzleJSON): boolean {
  return puzzle.blocks.length > 0
}

export function pushUndoHistory(history: VisualState[], previous: VisualState): VisualState[] {
  return [...history, previous].slice(-3)
}

export function popUndoHistory(history: VisualState[]): { nextHistory: VisualState[]; restored: VisualState | null } {
  const restored = history[history.length - 1] ?? null
  return {
    nextHistory: restored ? history.slice(0, -1) : history,
    restored,
  }
}

export function applyVisualStateChange(
  previous: VisualState,
  next: VisualState,
  history: VisualState[],
): { nextState: VisualState; nextHistory: VisualState[] } {
  return {
    nextState: next,
    nextHistory: pushUndoHistory(history, previous),
  }
}
