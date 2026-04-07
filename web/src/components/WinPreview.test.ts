import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { computeRenderBlocks } from './winPreviewModel'
import { WinPreview } from './WinPreview'
import type { PuzzleBlock, PuzzleJSON, WinCondition } from '../puzzleTypes'

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

describe('WinPreview', () => {
  it('renders safe svg appearance fragments in target previews', () => {
    const puzzle: PuzzleJSON = {
      id: 'svg-preview',
      board: { width: 3, height: 3 },
      blocks: [
        {
          id: 'S',
          movable: true,
          cells: [[0, 0]],
          appearance: { type: 'svg', color: '#111827', value: "<circle cx='8' cy='8' r='3' fill='white'/>" },
        },
      ],
      win_condition: { type: 'position', positions: [{ match: { appearance: { type: 'svg', value: "<circle cx='8' cy='8' r='3' fill='white'/>" } }, col: 1, row: 1 }] },
    }

    const html = renderToStaticMarkup(createElement(WinPreview, { puzzle }))

    expect(html).toContain('<circle')
    expect(html).toContain("fill='white'")
  })

  it('does not render unsafe svg appearance fragments in target previews', () => {
    const puzzle: PuzzleJSON = {
      id: 'unsafe-svg-preview',
      board: { width: 3, height: 3 },
      blocks: [
        {
          id: 'S',
          movable: true,
          cells: [[0, 0]],
          appearance: { type: 'svg', color: '#111827', value: '<path onload="alert(1)" d="M0 0"/>' },
        },
      ],
      win_condition: { type: 'position', positions: [{ match: { appearance: { type: 'svg' } }, col: 1, row: 1 }] },
    }

    const html = renderToStaticMarkup(createElement(WinPreview, { puzzle }))

    expect(html).not.toContain('onload')
    expect(html).not.toContain('alert')
  })
})
