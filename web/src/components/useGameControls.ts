import { useCallback, useEffect, useRef, useState } from 'react'
import type { Direction, PuzzleApi, WasmBlock } from '../wasm'
import { appendDebugLog } from '../debugLog'

const CELL = 64 // must match BlockShape.tsx
const COMMIT_THRESHOLD = 0.5 // fraction of a cell before committing a drag

interface DragState {
  blockID: string
  startX: number
  startY: number
  pointerId: number
  /** Direction locked after the first committed move. null = not yet locked. */
  lockedDir: Direction | null
  /** Number of moves committed so far in this gesture. */
  committedMoves: number
  /** CSS scale factor of the SVG at drag start (screen px per SVG unit). */
  scale: number
}

interface UseGameControlsReturn {
  selectedBlock: string | null
  shakenBlock: string | null
  selectBlock: (id: string | null) => void
  onBlockPointerDown: (blockID: string, e: React.PointerEvent<SVGGElement>) => void
  onBlockPointerEnd: (e: React.PointerEvent<SVGGElement>) => void
  onBlockLostPointerCapture: (e: React.PointerEvent<SVGGElement>) => void
}

export function shouldClearDrag(activePointerId: number | null, pointerId: number): boolean {
  return activePointerId === pointerId
}

// Returns the (col, row) centroid of a block's cells.
function centroid(block: WasmBlock): { col: number; row: number } {
  const n = block.cells.length || 1
  return {
    col: block.cells.reduce((s, c) => s + c.col, 0) / n,
    row: block.cells.reduce((s, c) => s + c.row, 0) / n,
  }
}

// Finds the nearest movable block in `dir` from origin (oCol, oRow).
// A block qualifies when its centroid delta is positive in the target axis
// and the magnitude in that axis exceeds the perpendicular axis.
// When nothing is selected, a virtual origin at the opposite edge is used
// so all movable blocks qualify and the nearest-to-that-edge wins.
function findNearest(
  dir: Direction,
  oCol: number,
  oRow: number,
  blocks: Record<string, WasmBlock>,
  movableIds: ReadonlySet<string>,
  excludeId: string | null,
): string | null {
  let bestId: string | null = null
  let bestDist = Infinity

  for (const [id, block] of Object.entries(blocks)) {
    if (!movableIds.has(id) || id === excludeId) continue
    const c = centroid(block)
    const dc = c.col - oCol
    const dr = c.row - oRow

    const inDir =
      (dir === 'right' && dc > 0 && dc >= Math.abs(dr)) ||
      (dir === 'left'  && dc < 0 && -dc >= Math.abs(dr)) ||
      (dir === 'down'  && dr > 0 && dr >= Math.abs(dc)) ||
      (dir === 'up'    && dr < 0 && -dr >= Math.abs(dc))

    if (!inDir) continue
    const dist = Math.sqrt(dc * dc + dr * dr)
    if (dist < bestDist) {
      bestDist = dist
      bestId = id
    }
  }
  return bestId
}

export function useGameControls(
  api: PuzzleApi | null,
  onStateChange: () => void,
  blocks: Record<string, WasmBlock>,
  movableIds: ReadonlySet<string>,
): UseGameControlsReturn {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [shakenBlock, setShakenBlock] = useState<string | null>(null)
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const drag = useRef<DragState | null>(null)

  // Keep a ref so the keydown closure always sees the latest values.
  const blocksRef = useRef(blocks)
  const movableIdsRef = useRef(movableIds)

  useEffect(() => {
    blocksRef.current = blocks
    movableIdsRef.current = movableIds
  }, [blocks, movableIds])

  function triggerShake(blockID: string) {
    setShakenBlock(null) // reset so re-pressing restarts the animation
    requestAnimationFrame(() => {
      setShakenBlock(blockID)
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => setShakenBlock(null), 260)
    })
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!api) return

    function handleKey(e: KeyboardEvent) {
      const dirMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      }

      if (e.key === 'Escape') {
        setSelectedBlock(null)
        return
      }

      const dir = dirMap[e.key]
      if (!dir) return
      e.preventDefault()
      if (e.repeat) return

      if (e.shiftKey) {
        // ── Shift+Arrow: navigate selection ──────────────────────────────────
        setSelectedBlock((cur) => {
          const b = blocksRef.current
          const ids = movableIdsRef.current

          let oCol: number, oRow: number
          if (cur && b[cur]) {
            const c = centroid(b[cur])
            oCol = c.col
            oRow = c.row
          } else {
            // Virtual origin at the opposite edge so all blocks qualify.
            oCol = dir === 'right' ? -Infinity : dir === 'left' ? Infinity : 0
            oRow = dir === 'down'  ? -Infinity : dir === 'up'   ? Infinity : 0
          }

          const next = findNearest(dir, oCol, oRow, b, ids, cur)
          return next ?? cur // keep current if no candidate found
        })
        return
      }

      // ── Arrow (no Shift): move selected block ─────────────────────────────
      setSelectedBlock((cur) => {
        if (!cur) return cur
        const r = api!.tryMove(cur, dir)
        if (r.ok) {
          appendDebugLog('keyboard.tryMove.ok', { blockId: cur, dir, moveCount: r.moveCount, won: r.won })
          onStateChange()
        } else {
          appendDebugLog('keyboard.tryMove.err', { blockId: cur, dir, error: r.error })
          triggerShake(cur)
        }
        return cur
      })
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [api, onStateChange])

  // ── Drag (Pointer Events) ─────────────────────────────────────────────────
  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = drag.current
      if (!d || !api || e.pointerId !== d.pointerId) return

      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY

      // Scale CELL to screen pixels so drag works correctly when the SVG is
      // displayed smaller or larger than its natural SVG-coordinate size.
      const scaledCell = CELL * d.scale

      // Lock direction on first threshold crossing.
      if (d.lockedDir === null) {
        const adx = Math.abs(dx)
        const ady = Math.abs(dy)
        if (adx < scaledCell * COMMIT_THRESHOLD && ady < scaledCell * COMMIT_THRESHOLD) return
        d.lockedDir = adx >= ady ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
      }

      // Delta in the locked direction only.
      const delta =
        d.lockedDir === 'right' ? dx :
        d.lockedDir === 'left'  ? -dx :
        d.lockedDir === 'down'  ? dy : -dy

      // targetMoves: first commit at COMMIT_THRESHOLD (0.5 cells), then every
      // additional full cell. Equivalent to Math.round(delta / scaledCell) for >= 0.
      const targetMoves = Math.max(0, Math.round(delta / scaledCell))
      const movesNeeded = targetMoves - d.committedMoves
      if (movesNeeded <= 0) return

      let anyOk = false
      for (let i = 0; i < movesNeeded; i++) {
        const r = api.tryMove(d.blockID, d.lockedDir)
        if (!r.ok) {
          appendDebugLog('pointer.tryMove.err', {
            blockId: d.blockID,
            dir: d.lockedDir,
            pointerId: d.pointerId,
            committedMoves: d.committedMoves,
            error: r.error,
          })
          break
        }
        d.committedMoves++
        anyOk = true
        appendDebugLog('pointer.tryMove.ok', {
          blockId: d.blockID,
          dir: d.lockedDir,
          pointerId: d.pointerId,
          committedMoves: d.committedMoves,
          moveCount: r.moveCount,
          won: r.won,
        })
      }
      if (anyOk) onStateChange()
      // Drag stays active until pointerup — no drag.current = null here.
    },
    [api, onStateChange],
  )

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (shouldClearDrag(drag.current?.pointerId ?? null, e.pointerId)) {
      appendDebugLog('window.pointerup', { pointerId: e.pointerId })
      drag.current = null
    }
  }, [])

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [onPointerMove, onPointerUp])

  // ── Block pointer down (click-to-select + start drag) ────────────────────
  const onBlockPointerDown = useCallback(
    (blockID: string, e: React.PointerEvent<SVGGElement>) => {
      if (!e.isPrimary || e.button !== 0) return
      drag.current = null
      e.currentTarget.setPointerCapture(e.pointerId)
      setSelectedBlock(blockID)
      // Compute the CSS scale of the SVG so drag thresholds are in screen px.
      const svg = e.currentTarget.ownerSVGElement
      const scale = svg && svg.viewBox.baseVal.width > 0
        ? svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
        : 1
      drag.current = {
        blockID,
        startX: e.clientX,
        startY: e.clientY,
        pointerId: e.pointerId,
        lockedDir: null,
        committedMoves: 0,
        scale,
      }
      appendDebugLog('pointerdown', {
        blockId: blockID,
        pointerId: e.pointerId,
        selectedBlock: blockID,
        hasPointerCapture: e.currentTarget.hasPointerCapture?.(e.pointerId) ?? false,
      })
    },
    [],
  )

  const onBlockPointerEnd = useCallback((e: React.PointerEvent<SVGGElement>) => {
    if (shouldClearDrag(drag.current?.pointerId ?? null, e.pointerId)) {
      appendDebugLog('block.pointerend', {
        pointerId: e.pointerId,
        hadPointerCapture: e.currentTarget.hasPointerCapture?.(e.pointerId) ?? false,
      })
      drag.current = null
    }
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }, [])

  const onBlockLostPointerCapture = useCallback((e: React.PointerEvent<SVGGElement>) => {
    if (shouldClearDrag(drag.current?.pointerId ?? null, e.pointerId)) {
      appendDebugLog('block.lostpointercapture', { pointerId: e.pointerId })
      drag.current = null
    }
  }, [])

  const selectBlock = useCallback((id: string | null) => {
    setSelectedBlock(id)
  }, [])

  return { selectedBlock, shakenBlock, selectBlock, onBlockPointerDown, onBlockPointerEnd, onBlockLostPointerCapture }
}
