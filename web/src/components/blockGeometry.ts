export const CELL_SIZE = 64 // px per grid cell

export function computeBlockCentroid(cells: { col: number; row: number }[], cellSize: number): { cx: number; cy: number } {
  return {
    cx: (cells.reduce((s, c) => s + c.col, 0) / cells.length + 0.5) * cellSize,
    cy: (cells.reduce((s, c) => s + c.row, 0) / cells.length + 0.5) * cellSize,
  }
}

interface GridPoint {
  x: number
  y: number
}

interface GridCellLike {
  col: number
  row: number
}

function pointKey(point: GridPoint): string {
  return `${point.x},${point.y}`
}

export function cellKey(col: number, row: number): string {
  return `${col},${row}`
}

function buildJoinedBlockLoops(cells: GridCellLike[], cellSize: number): GridPoint[][] {
  if (cells.length === 0) return []

  const occupied = new Set(cells.map((cell) => cellKey(cell.col, cell.row)))
  const edges = new Map<string, GridPoint>()

  for (const cell of cells) {
    const { col, row } = cell
    const topLeft = { x: col * cellSize, y: row * cellSize }
    const topRight = { x: (col + 1) * cellSize, y: row * cellSize }
    const bottomRight = { x: (col + 1) * cellSize, y: (row + 1) * cellSize }
    const bottomLeft = { x: col * cellSize, y: (row + 1) * cellSize }

    if (!occupied.has(cellKey(col, row - 1))) edges.set(pointKey(topLeft), topRight)
    if (!occupied.has(cellKey(col + 1, row))) edges.set(pointKey(topRight), bottomRight)
    if (!occupied.has(cellKey(col, row + 1))) edges.set(pointKey(bottomRight), bottomLeft)
    if (!occupied.has(cellKey(col - 1, row))) edges.set(pointKey(bottomLeft), topLeft)
  }

  const remaining = new Map(edges)
  const loops: GridPoint[][] = []

  while (remaining.size > 0) {
    const [startKey, nextPoint] = remaining.entries().next().value as [string, GridPoint]
    const [startX, startY] = startKey.split(',').map(Number)
    const startPoint = { x: startX, y: startY }
    let currentKey = startKey
    let currentPoint = nextPoint
    remaining.delete(startKey)

    const loop = [startPoint, currentPoint]

    while (pointKey(currentPoint) !== pointKey(startPoint)) {
      currentKey = pointKey(currentPoint)
      const followingPoint = remaining.get(currentKey)
      if (!followingPoint) break
      remaining.delete(currentKey)
      currentPoint = followingPoint
      if (pointKey(currentPoint) !== pointKey(startPoint)) {
        loop.push(currentPoint)
      }
    }

    loops.push(loop)
  }

  return loops
}

function cornerOccupancyCount(point: GridPoint, occupied: Set<string>, cellSize: number): number {
  const col = point.x / cellSize
  const row = point.y / cellSize
  return [
    occupied.has(cellKey(col - 1, row - 1)),
    occupied.has(cellKey(col, row - 1)),
    occupied.has(cellKey(col, row)),
    occupied.has(cellKey(col - 1, row)),
  ].filter(Boolean).length
}

function moveToward(from: GridPoint, to: GridPoint, distance: number): GridPoint {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  if (length === 0) return from
  return {
    x: from.x + (dx / length) * distance,
    y: from.y + (dy / length) * distance,
  }
}

export function buildJoinedBlockPath(cells: GridCellLike[], cellSize: number): string {
  if (cells.length === 0) return ''

  const loops = buildJoinedBlockLoops(cells, cellSize)
  return loops
    .map((loop) => {
      const [first, ...rest] = loop
      const points = [...rest, first]
      return `M ${first.x} ${first.y} ${points.map((point) => `L ${point.x} ${point.y}`).join(' ')} Z`
    })
    .join(' ')
}

export function buildRoundedJoinedBlockPath(cells: GridCellLike[], cellSize: number, radius: number): string {
  if (cells.length === 0) return ''
  if (radius <= 0) return buildJoinedBlockPath(cells, cellSize)

  const occupied = new Set(cells.map((cell) => cellKey(cell.col, cell.row)))
  const loops = buildJoinedBlockLoops(cells, cellSize)

  return loops
    .map((loop) => {
      let path = ''

      for (let i = 0; i < loop.length; i++) {
        const prev = loop[(i - 1 + loop.length) % loop.length]
        const current = loop[i]
        const next = loop[(i + 1) % loop.length]
        const incomingLength = Math.hypot(current.x - prev.x, current.y - prev.y)
        const outgoingLength = Math.hypot(next.x - current.x, next.y - current.y)
        const effectiveRadius = Math.min(radius, incomingLength / 2, outgoingLength / 2)
        const isCorner = (prev.x !== next.x) && (prev.y !== next.y)
        const isOuterCorner = cornerOccupancyCount(current, occupied, cellSize) === 1

        if (!isCorner || !isOuterCorner || effectiveRadius <= 0) {
          path += i === 0 ? `M ${current.x} ${current.y}` : ` L ${current.x} ${current.y}`
          continue
        }

        const start = moveToward(current, prev, effectiveRadius)
        const end = moveToward(current, next, effectiveRadius)
        const cross = (current.x - prev.x) * (next.y - current.y) - (current.y - prev.y) * (next.x - current.x)
        const sweepFlag = cross > 0 ? 1 : 0

        path += i === 0 ? `M ${start.x} ${start.y}` : ` L ${start.x} ${start.y}`
        path += ` A ${effectiveRadius} ${effectiveRadius} 0 0 ${sweepFlag} ${end.x} ${end.y}`
      }

      return `${path} Z`
    })
    .join(' ')
}

export function joinedCellBorderRadius(cells: GridCellLike[], col: number, row: number, radius: number): string {
  const occupied = new Set(cells.map((cell) => cellKey(cell.col, cell.row)))
  const top = occupied.has(cellKey(col, row - 1))
  const right = occupied.has(cellKey(col + 1, row))
  const bottom = occupied.has(cellKey(col, row + 1))
  const left = occupied.has(cellKey(col - 1, row))

  return [
    !top && !left ? `${radius}px` : '0px',
    !top && !right ? `${radius}px` : '0px',
    !bottom && !right ? `${radius}px` : '0px',
    !bottom && !left ? `${radius}px` : '0px',
  ].join(' ')
}

export function joinedCellBorderStyle(
  cells: GridCellLike[],
  col: number,
  row: number,
  width: number,
  color: string,
): CSSProperties {
  const occupied = new Set(cells.map((cell) => cellKey(cell.col, cell.row)))
  const top = occupied.has(cellKey(col, row - 1))
  const right = occupied.has(cellKey(col + 1, row))
  const bottom = occupied.has(cellKey(col, row + 1))
  const left = occupied.has(cellKey(col - 1, row))

  return {
    borderTop: top ? 'none' : `${width}px solid ${color}`,
    borderRight: right ? 'none' : `${width}px solid ${color}`,
    borderBottom: bottom ? 'none' : `${width}px solid ${color}`,
    borderLeft: left ? 'none' : `${width}px solid ${color}`,
  }
}
import type { CSSProperties } from 'react'
