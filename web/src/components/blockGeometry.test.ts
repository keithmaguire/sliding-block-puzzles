import { describe, expect, it } from 'vitest'
import { buildJoinedBlockPath, joinedCellBorderRadius, joinedCellBorderStyle } from './blockGeometry'

describe('blockGeometry', () => {
  it('builds one outer path for a 2x2 square', () => {
    expect(buildJoinedBlockPath([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
    ], 10)).toBe('M 0 0 L 10 0 L 20 0 L 20 10 L 20 20 L 10 20 L 0 20 L 0 10 L 0 0 Z')
  })

  it('rounds only the exposed outer corner for joined editor cells', () => {
    const cells = [{ col: 0, row: 0 }, { col: 1, row: 0 }]
    expect(joinedCellBorderRadius(cells, 0, 0, 7)).toBe('7px 0px 0px 7px')
    expect(joinedCellBorderRadius(cells, 1, 0, 7)).toBe('0px 7px 7px 0px')
  })

  it('omits interior borders between joined cells', () => {
    const cells = [{ col: 0, row: 0 }, { col: 1, row: 0 }]
    const left = joinedCellBorderStyle(cells, 0, 0, 1, '#fff')
    const right = joinedCellBorderStyle(cells, 1, 0, 1, '#fff')

    expect(left.borderRight).toBe('none')
    expect(right.borderLeft).toBe('none')
    expect(left.borderLeft).toBe('1px solid #fff')
    expect(right.borderRight).toBe('1px solid #fff')
  })
})
