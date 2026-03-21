import { describe, expect, it } from 'vitest'
import { computeRenderBlocks } from './winPreviewModel'
import type { PuzzleBlock, WinCondition } from '../puzzleTypes'

const blocks: PuzzleBlock[] = [
  { id: 'A', movable: true, cells: [[0, 0], [1, 0]], appearance: { type: 'plain', color: '#f0a500' } },
  { id: 'T1', movable: true, cells: [[0, 1]], appearance: { type: 'text', color: '#06b6d4', value: 'T' } },
  { id: 'T2', movable: true, cells: [[1, 1]], appearance: { type: 'text', color: '#22c55e', value: 'T' } },
]

describe('computeRenderBlocks', () => {
  it('renders block-id position targets using the named block shape', () => {
    const wc: WinCondition = { type: 'position', positions: [{ match: { appearance: { color: '#f0a500' }, shape: [[0, 0], [1, 0]] }, col: 2, row: 1 }] }
    const rendered = computeRenderBlocks(blocks, wc)

    expect(rendered[0].cells).toEqual([{ col: 2, row: 1 }, { col: 3, row: 1 }])
  })

  it('renders appearance-value targets using a representative matching block', () => {
    const wc: WinCondition = { type: 'position', positions: [{ match: { appearance: { type: 'text', value: 'T' } }, col: 3, row: 0 }] }
    const rendered = computeRenderBlocks(blocks, wc)

    expect(rendered[0].appearance?.type).toBe('text')
    expect(rendered[0].appearance && 'value' in rendered[0].appearance ? rendered[0].appearance.value : '').toBe('T')
    expect(rendered[0].cells).toEqual([{ col: 3, row: 0 }])
  })

  it('renders shape targets as ghost previews with exact orientation', () => {
    const wc: WinCondition = { type: 'position', positions: [{ match: { shape: [[0, 0], [1, 0]] }, col: 1, row: 2 }] }
    const rendered = computeRenderBlocks(blocks, wc)

    expect(rendered[0].isGhost).toBe(true)
    expect(rendered[0].cells).toEqual([{ col: 1, row: 2 }, { col: 2, row: 2 }])
  })
})
