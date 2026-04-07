import {
  resolveBlockColor,
  type PuzzleJSON,
  type WinCondition,
} from '../puzzleTypes'
import { sanitizeSvgFragment } from '../svgSafety'
import { buildJoinedBlockPath, computeBlockCentroid } from './blockGeometry'
import { computeRenderBlocks } from './winPreviewModel'

const MINI = 22
const MINI_TEXT_FONT_RATIO = 0.48 // font size as fraction of mini cell size
const MINI_SVG_OFFSET_RATIO = 0.3 // svg icon origin offset as fraction of mini cell size
interface WinPreviewProps {
  puzzle: PuzzleJSON
}

function firstConcreteCondition(wc: WinCondition): WinCondition | null {
  if (wc.type === 'description_only') return null
  if (wc.type === 'any_of') {
    for (const condition of wc.conditions) {
      const found = firstConcreteCondition(condition)
      if (found) return found
    }
    return null
  }
  return wc
}

export function WinPreview({ puzzle }: WinPreviewProps) {
  const previewWc = firstConcreteCondition(puzzle.win_condition)
  if (!previewWc) return null

  const renderBlocks = computeRenderBlocks(puzzle.blocks, previewWc)
  const viewW = puzzle.board.width * MINI
  const viewH = puzzle.board.height * MINI

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Goal</span>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg
          viewBox={`0 0 ${viewW} ${viewH}`}
          width={viewW}
          height={viewH}
          style={{
            display: 'block',
            background: 'var(--board-bg)',
            borderRadius: 8,
            overflow: 'visible',
            boxShadow: '0 0 0 6px var(--frame-bg), inset 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {Array.from({ length: puzzle.board.width + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * MINI} y1={0} x2={i * MINI} y2={viewH} stroke="rgba(255,255,255,0.07)" strokeWidth={0.75} />
          ))}
          {Array.from({ length: puzzle.board.height + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * MINI} x2={viewW} y2={i * MINI} stroke="rgba(255,255,255,0.07)" strokeWidth={0.75} />
          ))}

          {renderBlocks.map((rb) => {
            if (rb.cells.length === 0) return null
            const path = buildJoinedBlockPath(rb.cells, MINI)
            const fill = resolveBlockColor(rb.color)
            const { cx, cy } = computeBlockCentroid(rb.cells, MINI)
            const safeSvgValue = rb.appearance?.type === 'svg' ? sanitizeSvgFragment(rb.appearance.value) : null
            return (
              <g key={rb.id}>
                <path
                  d={path}
                  fill={fill}
                  opacity={rb.isFixed ? 0.5 : 0.9}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={rb.color === 'background' ? 'rgba(255,255,255,0.28)' : rb.isGhost ? 'rgba(255,255,255,0.35)' : 'none'}
                  strokeWidth={rb.color === 'background' || rb.isGhost ? 1 : 0}
                  strokeDasharray={rb.isGhost ? '3 2' : undefined}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {rb.appearance?.type === 'text' && (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={MINI * MINI_TEXT_FONT_RATIO}
                    fontWeight="bold"
                    fill={rb.appearance.text_color === 'black' ? 'var(--text-on-block)' : '#fff'}
                    pointerEvents="none"
                    style={{ userSelect: 'none' }}
                  >
                    {rb.appearance.value}
                  </text>
                )}
                {rb.appearance?.type === 'svg' && safeSvgValue && (
                  <g
                    transform={`translate(${cx - MINI * MINI_SVG_OFFSET_RATIO}, ${cy - MINI * MINI_SVG_OFFSET_RATIO})`}
                    pointerEvents="none"
                    dangerouslySetInnerHTML={{ __html: safeSvgValue }}
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  marginTop: 18,
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text)',
}
