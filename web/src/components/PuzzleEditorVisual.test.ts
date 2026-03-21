import { describe, expect, it } from 'vitest'
import { clearedWinGrid, defaultVisualState, removeBlockFromVisualState, toggleEraseTool, visualStateToPuzzleJSON } from './puzzleEditorState'

describe('removeBlockFromVisualState', () => {
  it('removes the block from the config list and clears its occupied cells', () => {
    const state = defaultVisualState()
    state.blocks = [
      { id: 'A', appearanceType: 'plain', color: '#f0a500', movable: true, appearanceValue: '', textColor: 'white' },
      { id: 'B', appearanceType: 'plain', color: '#06b6d4', movable: true, appearanceValue: '', textColor: 'white' },
    ]
    state.startGrid[0][0] = 'A'
    state.startGrid[0][1] = 'A'
    state.startGrid[1][0] = 'B'
    state.winGrid[0][0] = 'A'
    state.removableBlocks = ['A']
    state.activeTool = 'A'
    state.selectedBlockId = 'A'

    const next = removeBlockFromVisualState(state, 'A')
    const puzzle = visualStateToPuzzleJSON(next)

    expect(next.blocks.map((block) => block.id)).toEqual(['B'])
    expect(next.startGrid[0][0]).toBe('')
    expect(next.startGrid[0][1]).toBe('')
    expect(next.winGrid[0][0]).toBe('?')
    expect(next.removableBlocks).toEqual([])
    expect(next.selectedBlockId).toBeNull()
    expect(next.activeTool).toBe('B')
    expect(puzzle.blocks.map((block) => block.id)).toEqual(['B'])
  })

  it('toggles erase off when clicked again', () => {
    expect(toggleEraseTool('erase')).toBeNull()
    expect(toggleEraseTool('A')).toBe('erase')
    expect(toggleEraseTool(null)).toBe('erase')
  })

  it('clears the win grid back to dont-care cells', () => {
    const state = defaultVisualState()
    state.winGrid[0][0] = 'A'
    state.winGrid[1][2] = 'B'
    expect(clearedWinGrid(state).every((row) => row.every((cell) => cell === '?'))).toBe(true)
  })
})
