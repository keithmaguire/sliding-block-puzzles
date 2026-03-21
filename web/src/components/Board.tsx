import type { WasmOk } from '../wasm'
import type { PuzzleDecoratedAppearance } from '../puzzleTypes'
import { BlockShape, CELL } from './BlockShape'

interface PuzzleMeta {
  board: { width: number; height: number }
  blocks: Record<
      string,
      {
        color: string
        movable: boolean
        appearance?: PuzzleDecoratedAppearance | null
      }
    >
}

interface BoardProps {
  state: WasmOk
  meta: PuzzleMeta
  selectedBlock: string | null
  shakenBlock: string | null
  outlinedBlocks?: ReadonlySet<string>
  onBlockPointerDown: (blockID: string, e: React.PointerEvent<SVGGElement>) => void
  onBlockPointerEnd: (e: React.PointerEvent<SVGGElement>) => void
  onBlockLostPointerCapture: (e: React.PointerEvent<SVGGElement>) => void
}

export function Board({
  state,
  meta,
  selectedBlock,
  shakenBlock,
  outlinedBlocks,
  onBlockPointerDown,
  onBlockPointerEnd,
  onBlockLostPointerCapture,
}: BoardProps) {
  const { width, height } = meta.board
  const viewW = width * CELL
  const viewH = height * CELL
  const renderedBlocks = Object.entries(state.blocks).sort(([aId], [bId]) => {
    const aMovable = meta.blocks[aId]?.movable ?? true
    const bMovable = meta.blocks[bId]?.movable ?? true
    return Number(aMovable) - Number(bMovable)
  })

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        background: 'var(--board-bg)',
        borderRadius: 14,
        touchAction: 'none',
        overflow: 'visible',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 14px 28px rgba(255,255,255,0.02)',
      }}
    >
      {/* Grid lines */}
      {Array.from({ length: width + 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={i * CELL}
          y1={0}
          x2={i * CELL}
          y2={viewH}
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: height + 1 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={i * CELL}
          x2={viewW}
          y2={i * CELL}
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={1}
        />
      ))}
      {/* Blocks */}
      {renderedBlocks.map(([id, block]) => {
        const blockMeta = meta.blocks[id]
        return (
          <BlockShape
            key={id}
            id={id}
            cells={block.cells}
            color={blockMeta?.color ?? '#888'}
            isSelected={selectedBlock === id}
            isShaking={shakenBlock === id}
            isOutlined={outlinedBlocks?.has(id) ?? false}
            appearance={blockMeta?.appearance}
            onPointerDown={(e) => onBlockPointerDown(id, e)}
            onPointerUp={onBlockPointerEnd}
            onPointerCancel={onBlockPointerEnd}
            onLostPointerCapture={onBlockLostPointerCapture}
          />
        )
      })}
    </svg>
  )
}
