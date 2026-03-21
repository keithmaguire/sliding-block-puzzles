import { useCallback, useRef } from 'react'
import {
  resolveBlockColor,
  type PuzzleAppearanceType,
  type PuzzleTextColor,
} from '../puzzleTypes'
import { joinedCellBorderRadius, joinedCellBorderStyle } from './blockGeometry'
import { clearedWinGrid, toggleEraseTool } from './puzzleEditorState'

// ── Types ─────────────────────────────────────────────────────────────────────

type CellValue = string // blockId | ''
type WinType = 'position' | 'adjacency' | 'description_only'

interface BlockConfig {
  id: string
  appearanceType: PuzzleAppearanceType
  color: string
  movable: boolean
  appearanceValue: string
  textColor: PuzzleTextColor
}

interface VisualState {
  title: string
  puzzleId: string
  source: string
  difficulty: number
  minMoves: string
  catalogGroupId: string
  catalogGroupTitle: string
  catalogGroupOrder: string
  catalogOrder: string
  width: number
  height: number
  startGrid: CellValue[][]
  winGrid: CellValue[][] // '?' = don't-care
  blocks: BlockConfig[]
  winType: WinType
  activeTool: string | null // 'erase' | blockId | null
  activePhase: 'start' | 'win'
  selectedBlockId: string | null
  winDescription: string
  allowShuffle: boolean
  removableBlocks: string[]  // block IDs the player may remove before starting
}

const BLOCK_COLORS = [
  '#f0a500',
  '#06b6d4',
  '#22c55e',
  '#ec4899',
  '#8b5cf6',
  '#fb923c',
  '#e11d48',
  '#14b8a6',
  '#78909c',
  '#000000',
  '#ffffff',
  '#ff0000',
  '#0000ff',
  '#008000',
]

const BACKGROUND_COLOR = 'background'

/** Convert a 0-based index to a block ID: 0→A, 25→Z, 26→AA, 51→AZ, 52→BA, … */
function indexToBlockId(n: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  n += 1 // bijective base-26: no zero digit
  while (n > 0) {
    n--
    result = letters[n % 26] + result
    n = Math.floor(n / 26)
  }
  return result
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function blockDisplayValue(block: BlockConfig): string {
  if (block.appearanceType === 'text' && block.appearanceValue.trim()) return block.appearanceValue
  if (block.appearanceType === 'svg') return 'SVG'
  return block.id
}

function usedTargetIds(state: VisualState): string[] {
  if (state.winType !== 'position') return []
  const ids = new Set<string>()
  for (const row of state.winGrid) {
    for (const cell of row) {
      if (cell !== '' && cell !== '?') ids.add(cell)
    }
  }
  return [...ids]
}

function nextBlockId(blocks: BlockConfig[]): string {
  const used = new Set(blocks.map((b) => b.id))
  for (let i = 0; ; i++) {
    const id = indexToBlockId(i)
    if (!used.has(id)) return id
  }
}

function cellsForBlockInGrid(grid: CellValue[][], blockId: string): { col: number; row: number }[] {
  const cells: { col: number; row: number }[] = []
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
      if (grid[row][col] === blockId) cells.push({ col, row })
    }
  }
  return cells
}

function removeBlockFromVisualState(state: VisualState, id: string): VisualState {
  const newBlocks = state.blocks.filter((block) => block.id !== id)
  const newStartGrid = state.startGrid.map((row) => row.map((cell) => (cell === id ? '' : cell)))
  const newWinGrid = state.winGrid.map((row) => row.map((cell) => (cell === id ? '?' : cell)))
  const nextTool = newBlocks[0]?.id ?? 'erase'
  return {
    ...state,
    blocks: newBlocks,
    startGrid: newStartGrid,
    winGrid: newWinGrid,
    activeTool: nextTool,
    selectedBlockId: null,
    removableBlocks: state.removableBlocks.filter((rid) => rid !== id),
  }
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  state: VisualState
  onChange: (s: VisualState) => void
  onUndo?: () => void
  canUndo?: boolean
}

export function PuzzleEditorVisual({ state, onChange, onUndo, canUndo = false }: Props) {
  const painting = useRef(false)
  const draggingWinBlock = useRef<string | null>(null)
  const displayedWinGrid = state.winGrid

  const set = useCallback(
    (patch: Partial<VisualState>) => onChange({ ...state, ...patch }),
    [state, onChange],
  )

  // Grid painting
  function paintCell(row: number, col: number) {
    if (row < 0 || row >= state.height || col < 0 || col >= state.width) return
    if (state.activeTool == null) return

    if (state.activePhase === 'start') {
      const newGrid = state.startGrid.map((r) => [...r])
      if (state.activeTool === 'erase') newGrid[row][col] = ''
      else newGrid[row][col] = state.activeTool // blockId
      set({ startGrid: newGrid })
    } else {
      if (state.winType === 'description_only') return
      const newGrid = state.winGrid.map((r) => [...r])
      if (state.activeTool === 'erase') {
        newGrid[row][col] = '?'
      } else {
        placeWinBlock(newGrid, row, col, state.activeTool, state)
      }
      set({ winGrid: newGrid })
    }
  }

  function placeWinBlock(grid: CellValue[][], row: number, col: number, blockId: string, s: VisualState) {
    for (let r = 0; r < s.height; r++)
      for (let c = 0; c < s.width; c++)
        if (grid[r][c] === blockId) grid[r][c] = '?'
    paintBlockShape(grid, row, col, blockId, s)
  }

  function paintBlockShape(grid: CellValue[][], row: number, col: number, blockId: string, s: VisualState) {
    // Get the block's cells from startGrid
    const cells: [number, number][] = []
    for (let r = 0; r < s.height; r++)
      for (let c = 0; c < s.width; c++)
        if (s.startGrid[r][c] === blockId) cells.push([c, r])
    if (cells.length === 0) {
      grid[row][col] = blockId
      return
    }
    const minCol = Math.min(...cells.map(([c]) => c))
    const minRow = Math.min(...cells.map(([, r]) => r))
    for (const [cc, cr] of cells) {
      const tc = col + (cc - minCol)
      const tr = row + (cr - minRow)
      if (tr >= 0 && tr < s.height && tc >= 0 && tc < s.width) {
        grid[tr][tc] = blockId
      }
    }
  }

  function handleCellMouseDown(row: number, col: number) {
    painting.current = true
    if (state.activePhase === 'win' && state.winType !== 'description_only') {
      const existing = state.winGrid[row][col]
      if (existing !== '' && existing !== '?') {
        draggingWinBlock.current = existing
        set({ activeTool: existing, selectedBlockId: existing })
        const newGrid = state.winGrid.map((r) => [...r])
        placeWinBlock(newGrid, row, col, existing, state)
        set({ winGrid: newGrid })
        return
      }
      if (state.activeTool && state.activeTool !== 'erase') {
        draggingWinBlock.current = state.activeTool
      }
    }
    paintCell(row, col)
  }

  function handleCellMouseEnter(row: number, col: number, e: React.MouseEvent) {
    if (!painting.current || e.buttons !== 1) return
    if (state.activePhase === 'win' && draggingWinBlock.current && draggingWinBlock.current !== 'erase') {
      const newGrid = state.winGrid.map((r) => [...r])
      placeWinBlock(newGrid, row, col, draggingWinBlock.current, state)
      set({ winGrid: newGrid })
      return
    }
    paintCell(row, col)
  }

  function handleMouseUp() {
    painting.current = false
    draggingWinBlock.current = null
  }

  // Copy start grid cells to win grid (non-empty cells → block ID, rest → '?')
  function copyStartToWin() {
    const newWG = state.startGrid.map((row) =>
      row.map((cell) => (cell !== '' ? cell : '?'))
    )
    set({ winGrid: newWG })
  }

  function clearWinGrid() {
    set({ winGrid: clearedWinGrid(state) })
  }

  // Board resize
  function resizeBoard(newW: number, newH: number) {
    const w = Math.max(2, Math.min(12, newW))
    const h = Math.max(2, Math.min(12, newH))
    const sg = Array.from({ length: h }, (_, r) =>
      Array.from({ length: w }, (_, c) => (r < state.height && c < state.width ? state.startGrid[r][c] : '')),
    )
    const wg = Array.from({ length: h }, (_, r) =>
      Array.from({ length: w }, (_, c) => (r < state.height && c < state.width ? state.winGrid[r][c] : '?')),
    )
    set({ width: w, height: h, startGrid: sg, winGrid: wg })
  }

  // Block management
  function addBlock() {
    const id = nextBlockId(state.blocks)
    const color = BLOCK_COLORS[state.blocks.length % BLOCK_COLORS.length]
    const newBlocks = [...state.blocks, { id, appearanceType: 'plain' as const, color, movable: true, appearanceValue: '', textColor: 'white' as const }]
    set({ blocks: newBlocks, activeTool: id, selectedBlockId: id })
  }

  function deleteBlock(id: string) {
    set(removeBlockFromVisualState(state, id))
  }

  function updateBlock(id: string, patch: Partial<BlockConfig>) {
    set({ blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
  }

  const selectedBlock = state.blocks.find((b) => b.id === state.selectedBlockId) ?? null
  const CELL = 40

  return (
    <div onMouseUp={handleMouseUp} style={{ userSelect: 'none' }}>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Title</label>
          <input
            value={state.title}
            onChange={(e) => set({ title: e.target.value })}
            style={inputStyle}
            placeholder="Puzzle title"
          />
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>ID</label>
          <input
            value={state.puzzleId}
            onChange={(e) => set({ puzzleId: e.target.value.replace(/\s/g, '-').toLowerCase() })}
            style={{ ...inputStyle, fontFamily: 'monospace', width: 130 }}
            placeholder="puzzle-id"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={fieldLabel}>Difficulty</label>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => set({ difficulty: d })}
                style={{
                  width: 20, height: 20, borderRadius: '50%', border: 'none',
                  background: d <= state.difficulty ? '#f0a500' : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer', padding: 0,
                }}
              />
            ))}
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Source</label>
          <input
            value={state.source}
            onChange={(e) => set({ source: e.target.value })}
            style={{ ...inputStyle, width: 140 }}
            placeholder="Optional source"
          />
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Min moves</label>
          <input
            value={state.minMoves}
            onChange={(e) => set({ minMoves: e.target.value.replace(/[^0-9]/g, '') })}
            style={{ ...inputStyle, width: 110, fontFamily: 'monospace' }}
            placeholder="Optional"
            inputMode="numeric"
          />
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Group ID</label>
          <input
            value={state.catalogGroupId}
            onChange={(e) => set({ catalogGroupId: e.target.value.replace(/\s/g, '-').toLowerCase() })}
            style={{ ...inputStyle, fontFamily: 'monospace', width: 120 }}
            placeholder="custom"
          />
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Group title</label>
          <input
            value={state.catalogGroupTitle}
            onChange={(e) => set({ catalogGroupTitle: e.target.value })}
            style={{ ...inputStyle, width: 128 }}
            placeholder="Custom"
          />
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Group order</label>
          <input
            value={state.catalogGroupOrder}
            onChange={(e) => set({ catalogGroupOrder: e.target.value.replace(/[^0-9]/g, '') })}
            style={{ ...inputStyle, width: 96, fontFamily: 'monospace' }}
            placeholder="Optional"
            inputMode="numeric"
          />
        </div>
        <div style={fieldWrap}>
          <label style={fieldLabel}>Puzzle order</label>
          <input
            value={state.catalogOrder}
            onChange={(e) => set({ catalogOrder: e.target.value.replace(/[^0-9]/g, '') })}
            style={{ ...inputStyle, width: 96, fontFamily: 'monospace' }}
            placeholder="Optional"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Board size row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <span style={fieldLabel}>Board</span>
        <SizeControl value={state.width} min={2} max={12} label="Width" onChange={(v) => resizeBoard(v, state.height)} />
        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>×</span>
        <SizeControl value={state.height} min={2} max={12} label="Height" onChange={(v) => resizeBoard(state.width, v)} />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={fieldLabel}>Tool</span>
        <ToolBtn active={state.activeTool === 'erase'} onClick={() => set({ activeTool: toggleEraseTool(state.activeTool) })}>Erase</ToolBtn>
        <span style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />
        <button onClick={onUndo} disabled={!canUndo} style={{ ...addBlockBtn, opacity: canUndo ? 1 : 0.45 }}>
          Undo
        </button>
        <span style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />
        {state.blocks.map((blk) => (
          <ToolBtn
            key={blk.id}
            active={state.activeTool === blk.id}
            onClick={() => {
              if (state.activeTool === 'erase') {
                deleteBlock(blk.id)
                return
              }
              set({ activeTool: blk.id, selectedBlockId: blk.id })
            }}
            style={{ borderColor: state.activeTool === blk.id ? blk.color : undefined }}
          >
            <span style={{ color: resolveBlockColor(blk.color) }}>■</span> {blk.id}
          </ToolBtn>
        ))}
        {state.activePhase === 'start' && (
          <button onClick={addBlock} style={addBlockBtn} title="Add new block">+ Block</button>
        )}
      </div>

      {/* Phase toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={fieldLabel}>Phase</span>
        <PhaseBtn active={state.activePhase === 'start'} onClick={() => set({ activePhase: 'start' })}>
          Start Grid
        </PhaseBtn>
        <PhaseBtn active={state.activePhase === 'win'} onClick={() => set({ activePhase: 'win' })}>
          Win Grid
        </PhaseBtn>
        {state.activePhase === 'win' && (
          <>
            <button onClick={copyStartToWin} style={copyStartBtnStyle} title="Copy start grid layout to win grid">
              ← Copy start
            </button>
            <button onClick={clearWinGrid} style={copyStartBtnStyle} title="Clear win grid">
              Clear grid
            </button>
          </>
        )}
      </div>

      {/* Grid + Side panel */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Grid */}
        <div style={{ display: 'inline-block', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, overflow: 'hidden' }}>
          {Array.from({ length: state.height }, (_, row) => (
            <div key={row} style={{ display: 'flex' }}>
              {Array.from({ length: state.width }, (_, col) => {
                const grid = state.activePhase === 'start' ? state.startGrid : displayedWinGrid
                const val = grid[row][col]
                const blk = state.blocks.find((b) => b.id === val)
                const isDontCare = val === '?' || val === ''
                const isSelected = val === state.selectedBlockId
                const isBackgroundBlock = blk?.color === BACKGROUND_COLOR
                const isFixedBlock = blk != null && !blk.movable
                const blockCells = blk ? cellsForBlockInGrid(grid, blk.id) : []
                const blockBorderColor =
                  blk == null
                    ? 'rgba(255,255,255,0.08)'
                    : isBackgroundBlock || isFixedBlock
                      ? 'rgba(255,255,255,0.28)'
                      : 'rgba(0,0,0,0.2)'

                let bg = 'rgba(255,255,255,0.04)'
                if (blk) bg = resolveBlockColor(blk.color)
                else if (state.activePhase === 'win' && isDontCare) bg = 'rgba(255,255,255,0.02)'

                return (
                  <div
                    key={col}
                    onMouseDown={() => handleCellMouseDown(row, col)}
                    onMouseEnter={(e) => handleCellMouseEnter(row, col, e)}
                    style={{
                      width: CELL,
                      height: CELL,
                      background: bg,
                      ...(blk
                        ? joinedCellBorderStyle(blockCells, col, row, 1, blockBorderColor)
                        : {
                            borderRight: col < state.width - 1 ? '1px solid rgba(255,255,255,0.08)' : undefined,
                            borderBottom: row < state.height - 1 ? '1px solid rgba(255,255,255,0.08)' : undefined,
                          }),
                      borderRadius: blk ? joinedCellBorderRadius(blockCells, col, row, 7) : undefined,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'crosshair',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: blk?.appearanceType === 'text' && blk.appearanceValue.trim()
                        ? (blk.textColor === 'black' ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.92)')
                        : blk
                          ? 'rgba(0,0,0,0.6)'
                          : 'rgba(255,255,255,0.2)',
                      outline: isSelected ? `2px solid white` : undefined,
                      outlineOffset: -2,
                      boxSizing: 'border-box',
                      transition: 'background 0.08s',
                    }}
                  >
                    {blk && blockDisplayValue(blk)}
                    {state.activePhase === 'win' && isDontCare && <span style={{ opacity: 0.2 }}>?</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Block config panel */}
        {selectedBlock && (
          <div style={panelStyle}>
            <div style={{ fontWeight: 600, fontSize: '0.96rem', marginBottom: 12, color: resolveBlockColor(selectedBlock.color) }}>
              Block {selectedBlock.id}
            </div>

            {/* Color swatches */}
            <div style={{ marginBottom: 10 }}>
              <label style={fieldLabel}>Color</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                {BLOCK_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateBlock(selectedBlock.id, { color: c })}
                    style={{
                      width: 22, height: 22, borderRadius: 4, border: '2px solid',
                      borderColor: selectedBlock.color === c ? 'white' : (c === '#ffffff' ? 'rgba(255,255,255,0.28)' : 'transparent'),
                      background: c, cursor: 'pointer', padding: 0,
                    }}
                  />
                ))}
                {!selectedBlock.movable && (
                  <>
                  <button
                    onClick={() => updateBlock(selectedBlock.id, { color: BACKGROUND_COLOR })}
                    style={{
                      minWidth: 82,
                      height: 22,
                      borderRadius: 4,
                      border: '2px solid',
                      borderColor: selectedBlock.color === BACKGROUND_COLOR ? 'white' : 'rgba(255,255,255,0.14)',
                      background: 'var(--board-bg)',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '0 8px',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.28)',
                    }}
                  >
                    Background
                  </button>
                  </>
                )}
              </div>
            </div>

            {/* Label */}
            <div style={{ marginBottom: 10 }}>
              <label style={fieldLabel}>Appearance</label>
              <select
                value={selectedBlock.appearanceType}
                onChange={(e) => {
                  const appearanceType = e.target.value as PuzzleAppearanceType
                  updateBlock(selectedBlock.id, {
                    appearanceType,
                    ...(appearanceType === 'plain' ? { appearanceValue: '' } : {}),
                  })
                }}
                style={{ ...selectStyle, width: '100%', marginTop: 4 }}
              >
                <option value="plain">Plain</option>
                <option value="text">Text</option>
                <option value="svg">SVG</option>
              </select>
            </div>

            {selectedBlock.appearanceType !== 'plain' && (
              <div style={{ marginBottom: 10 }}>
                <label style={fieldLabel}>Value</label>
                <input
                  value={selectedBlock.appearanceValue}
                  onChange={(e) => updateBlock(selectedBlock.id, { appearanceValue: e.target.value })}
                  style={{ ...inputStyle, width: '100%', marginTop: 4 }}
                  placeholder={selectedBlock.appearanceType === 'svg' ? '<path ... />' : 'visible value'}
                />
              </div>
            )}

            {selectedBlock.appearanceType === 'text' && (
              <div style={{ marginBottom: 10, opacity: selectedBlock.appearanceValue.trim() ? 1 : 0.45 }}>
                <label style={fieldLabel}>Text color</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button
                    onClick={() => updateBlock(selectedBlock.id, { textColor: 'white' })}
                    disabled={!selectedBlock.appearanceValue.trim()}
                    style={{
                      ...miniChoiceBtn,
                      borderColor: selectedBlock.textColor === 'white' ? 'white' : 'rgba(255,255,255,0.14)',
                      color: '#fff',
                    }}
                  >
                    White
                  </button>
                  <button
                    onClick={() => updateBlock(selectedBlock.id, { textColor: 'black' })}
                    disabled={!selectedBlock.appearanceValue.trim()}
                    style={{
                      ...miniChoiceBtn,
                      borderColor: selectedBlock.textColor === 'black' ? 'white' : 'rgba(255,255,255,0.14)',
                      color: '#111',
                      background: 'rgba(255,255,255,0.92)',
                    }}
                  >
                    Black
                  </button>
                </div>
              </div>
            )}

            {/* Movable */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <label style={{ ...fieldLabel, marginBottom: 0 }}>Movable</label>
              <input
                type="checkbox"
                checked={selectedBlock.movable}
                onChange={(e) => {
                  const movable = e.target.checked
                  const patch: Partial<BlockConfig> = { movable }
                  if (!movable && selectedBlock.color === BLOCK_COLORS[0]) patch.color = '#78909c'
                  set({
                    blocks: state.blocks.map((b) => (b.id === selectedBlock.id ? { ...b, ...patch } : b)),
                    removableBlocks: movable
                      ? state.removableBlocks
                      : state.removableBlocks.filter((id) => id !== selectedBlock.id),
                  })
                }}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
            </div>

            {/* Player can remove */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, opacity: selectedBlock.movable ? 1 : 0.45 }}>
              <label style={{ ...fieldLabel, marginBottom: 0 }}>Player can remove</label>
              <input
                type="checkbox"
                disabled={!selectedBlock.movable}
                checked={state.removableBlocks.includes(selectedBlock.id)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...state.removableBlocks, selectedBlock.id]
                    : state.removableBlocks.filter((id) => id !== selectedBlock.id)
                  set({ removableBlocks: next })
                }}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
            </div>

            {/* Delete */}
            <button
              onClick={() => deleteBlock(selectedBlock.id)}
              style={{
                width: '100%',
                padding: '6px 0',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.08)',
                color: '#fca5a5',
                fontSize: '0.94rem',
                cursor: 'pointer',
              }}
            >
              Delete block
            </button>
          </div>
        )}
      </div>

      {/* Setup options */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={fieldLabel}>Setup</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.92rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={state.allowShuffle}
              onChange={(e) => set({ allowShuffle: e.target.checked })}
              style={{ width: 14, height: 14, cursor: 'pointer' }}
            />
            Allow shuffle
          </label>
          {state.removableBlocks.length > 0 && (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
              Removable: {state.removableBlocks.join(', ')}
            </span>
          )}
          {state.removableBlocks.length === 0 && state.blocks.length > 0 && (
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Select a block and tick "Player can remove" to allow removal
            </span>
          )}
        </div>
      </div>

      {/* Win condition */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={fieldLabel}>Win</span>
          <select
            value={state.winType}
            onChange={(e) => set({ winType: e.target.value as WinType })}
            style={selectStyle}
          >
            <option value="position">Position</option>
            <option value="adjacency">Adjacency</option>
            <option value="description_only">Description only</option>
          </select>

          {state.winType === 'position' && (
            <span style={{ color: 'var(--text-dim)', fontSize: '0.92rem' }}>
              → switch to Win Grid and place every required target block arrangement
            </span>
          )}

          {state.winType === 'adjacency' && (
            <>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.92rem' }}>
                → switch to Win Grid and paint the required local arrangement
              </span>
            </>
          )}

          {state.winType === 'description_only' && (
            <input
              value={state.winDescription}
              onChange={(e) => set({ winDescription: e.target.value })}
              style={{ ...inputStyle, minWidth: 240 }}
              placeholder="Describe what the player is trying to achieve"
            />
          )}
        </div>

        {(state.winType === 'position' || state.winType === 'adjacency') && usedTargetIds(state).length > 0 && (
          <div style={{ marginTop: 10, fontSize: '0.92rem', color: 'var(--text-dim)' }}>
            Win targets are inferred from the authored blocks on the win grid.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ToolBtn({
  active,
  onClick,
  children,
  style,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 11px',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${active ? 'rgba(240,165,0,0.5)' : 'var(--border)'}`,
        background: active ? 'rgba(240,165,0,0.12)' : 'transparent',
        color: active ? '#fbbf24' : 'var(--text-dim)',
        fontSize: '0.92rem',
        cursor: 'pointer',
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function PhaseBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${active ? 'rgba(240,165,0,0.6)' : 'var(--border)'}`,
        background: active ? 'rgba(240,165,0,0.15)' : 'transparent',
        color: active ? '#fbbf24' : 'var(--text-dim)',
        fontWeight: active ? 600 : 400,
        fontSize: '0.94rem',
        cursor: 'pointer',
        minHeight: 32,
      }}
    >
      {active ? '● ' : '○ '}{children}
    </button>
  )
}

function SizeControl({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: number
  min: number
  max: number
  label: string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 74 }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))} style={sizeBtn}>−</button>
        <span style={{ fontSize: '0.98rem', minWidth: 20, textAlign: 'center' }}>{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} style={sizeBtn}>+</button>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const fieldLabel: React.CSSProperties = {
  fontSize: '0.88rem',
  color: 'var(--text-dim)',
  marginBottom: 2,
}

const fieldWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}

const inputStyle: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'rgba(0,0,0,0.25)',
  color: 'inherit',
  fontSize: '0.96rem',
  width: 160,
}

const miniChoiceBtn: React.CSSProperties = {
  minWidth: 64,
  height: 26,
  borderRadius: 4,
  border: '2px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.08)',
  cursor: 'pointer',
  padding: '0 10px',
  fontSize: '0.9rem',
  fontWeight: 600,
}

const selectStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'rgba(0,0,0,0.35)',
  color: 'inherit',
  fontSize: '0.94rem',
  cursor: 'pointer',
}

const addBlockBtn: React.CSSProperties = {
  padding: '5px 11px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(240,165,0,0.35)',
  background: 'rgba(240,165,0,0.08)',
  color: '#fbbf24',
  fontSize: '0.92rem',
  cursor: 'pointer',
  minHeight: 32,
}

const copyStartBtnStyle: React.CSSProperties = {
  padding: '5px 11px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.05)',
  color: 'var(--text-soft)',
  fontSize: '0.9rem',
  cursor: 'pointer',
  minHeight: 32,
}

const sizeBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 4,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.05)',
  color: 'inherit',
  fontSize: '1rem',
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const panelStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'rgba(0,0,0,0.25)',
  minWidth: 160,
}
