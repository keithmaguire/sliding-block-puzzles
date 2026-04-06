import type { PuzzleDecoratedAppearance } from '../puzzleTypes'
import type { WasmCell } from '../wasm'
import { resolveBlockColor } from '../puzzleTypes'
import { buildRoundedJoinedBlockPath } from './blockGeometry'

const CELL = 64 // px per grid cell
const CORNER_RADIUS = 8

interface BlockShapeProps {
  id: string
  cells: WasmCell[]
  color: string
  isSelected?: boolean
  isShaking?: boolean
  isOutlined?: boolean
  appearance?: PuzzleDecoratedAppearance | null
  onPointerDown?: (e: React.PointerEvent<SVGGElement>) => void
  onPointerUp?: (e: React.PointerEvent<SVGGElement>) => void
  onPointerCancel?: (e: React.PointerEvent<SVGGElement>) => void
  onLostPointerCapture?: (e: React.PointerEvent<SVGGElement>) => void
}

export function BlockShape({
  id,
  cells,
  color,
  isSelected = false,
  isShaking = false,
  isOutlined = false,
  appearance,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
}: BlockShapeProps) {
  if (cells.length === 0) return null

  const isBackground = color === 'background'
  const fill = resolveBlockColor(color)
  const stroke = isBackground
    ? fill
    : isSelected
      ? '#fff'
      : isOutlined
        ? 'var(--accent-text)'
        : 'rgba(0,0,0,0.2)'
  const strokeWidth = isBackground ? 1 : isSelected ? 3 : isOutlined ? 3 : 1
  const path = buildRoundedJoinedBlockPath(cells, CELL, CORNER_RADIUS)

  // Centroid for appearance content positioning (average of cell centres)
  const cx = (cells.reduce((s, c) => s + c.col, 0) / cells.length + 0.5) * CELL
  const cy = (cells.reduce((s, c) => s + c.row, 0) / cells.length + 0.5) * CELL

  return (
    <g
      data-block={id}
      className={isShaking ? 'block-shake' : undefined}
      style={{ cursor: isOutlined ? 'pointer' : 'grab', touchAction: 'none' }}
      pointerEvents="all"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onLostPointerCapture}
    >
      <path d={path} fill={fill} opacity={1} />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {appearance && (
        <>
          {appearance.type === 'text' && (
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={CELL * 0.45}
              fontWeight="bold"
              fill={appearance.text_color === 'black' ? 'var(--text-on-block)' : '#fff'}
              pointerEvents="none"
              style={{ userSelect: 'none' }}
            >
              {appearance.value}
            </text>
          )}
          {appearance.type === 'svg' && (
            <g
              transform={`translate(${cx - CELL * 0.3}, ${cy - CELL * 0.3})`}
              pointerEvents="none"
              dangerouslySetInnerHTML={{ __html: appearance.value }}
            />
          )}
        </>
      )}
    </g>
  )
}

export { CELL }
