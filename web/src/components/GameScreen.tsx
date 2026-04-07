import { useCallback, useEffect, useRef, useState } from 'react'
import type { PuzzleApi } from '../wasm'
import type { PlayablePuzzle, WinCondition } from '../puzzleTypes'
import { buildBlockMeta, getSupportedSetupOptions } from '../puzzleTypes'
import { recordSolve } from '../progress'
import { Board } from './Board'
import { WinPreview } from './WinPreview'
import { useGameControls } from './useGameControls'
import type { WasmOk } from '../wasm'
import { removeBlocks, shufflePuzzle } from '../gameSetup'
import { difficultyColor } from './difficultyColor'
import { clearPuzzleSession, getPuzzleSession, savePuzzleSession, serializeWasmBlocks, sessionBlocksToWasm, shouldPersistPuzzleSession } from '../puzzleSession'
import { computeBoardDisplayWidth, countRemovedSetupBlocks, getInitialShuffleAvailability } from './gameSetupState'
import { appendDebugLog } from '../debugLog'
import { shouldReloadGameState } from './gameScreenUtils'
import type { GameLoadKey } from './gameScreenUtils'
import { CELL_SIZE } from './blockGeometry'
import { iconBtnStyle } from './sharedStyles'
import { CogIcon } from './sharedUi'

function hasDescriptionOnly(wc: WinCondition): boolean {
  if (wc.type === 'description_only') return true
  if (wc.type === 'any_of') return wc.conditions.some(hasDescriptionOnly)
  return false
}

interface GameScreenProps {
  puzzle: PlayablePuzzle
  api: PuzzleApi
  onBack: () => void
  onDocs: () => void
}

interface LoadedGameState {
  playPuzzle: PlayablePuzzle
  restored: WasmOk | null
  loadError: string | null
  removableIds: Set<string>
  shuffleAvailable: boolean
  won: boolean
}

function loadPlayState(api: PuzzleApi, basePuzzle: PlayablePuzzle, session = getPuzzleSession(basePuzzle.id)) {
  const playPuzzle = session?.puzzle ?? basePuzzle
  const loaded = api.loadPuzzle(JSON.stringify(playPuzzle))
  appendDebugLog('game.loadPuzzle', { puzzleId: playPuzzle.id, fromSession: Boolean(session), ok: loaded.ok })
  let restored =
    loaded.ok && session && session.puzzle.id === playPuzzle.id
      ? api.restoreState(sessionBlocksToWasm(session.blocks), session.moveCount)
      : loaded

  if (loaded.ok && session && session.puzzle.id === playPuzzle.id) {
    appendDebugLog('game.restoreState', {
      puzzleId: playPuzzle.id,
      ok: restored.ok,
      moveCount: session.moveCount,
      blockIds: Object.keys(session.blocks),
    })
  }

  if (!restored.ok && loaded.ok && session) {
    clearPuzzleSession(basePuzzle.id)
    appendDebugLog('game.restoreState.failed', { puzzleId: basePuzzle.id, error: restored.error })
    restored = loaded
  }

  return { playPuzzle, restored }
}

function getLoadedGameState(api: PuzzleApi, puzzle: PlayablePuzzle): LoadedGameState {
  const session = getPuzzleSession(puzzle.id)
  const initialLoad = loadPlayState(api, puzzle, session)
  const loadedWon = initialLoad.restored.ok ? initialLoad.restored.won : false
  const loadedMoveCount = initialLoad.restored.ok ? initialLoad.restored.moveCount : 0
  const allowShuffle = getSupportedSetupOptions(initialLoad.playPuzzle)?.allow_shuffle === true
  // If a fresh (no session) puzzle starts already satisfying the win condition at move 0
  // with shuffle enabled, the player hasn't actually played yet — don't flag it as won
  // so the shuffle button is shown and the win banner is suppressed.
  const startingWonNeedsPlay = !session && loadedWon && loadedMoveCount === 0 && allowShuffle
  return {
    playPuzzle: initialLoad.playPuzzle,
    restored: initialLoad.restored.ok ? initialLoad.restored : null,
    loadError: initialLoad.restored.ok ? null : initialLoad.restored.error,
    removableIds: new Set(getSupportedSetupOptions(initialLoad.playPuzzle)?.removable_blocks ?? []),
    shuffleAvailable: getInitialShuffleAvailability(puzzle, session?.shuffleAvailable),
    won: startingWonNeedsPlay ? false : loadedWon,
  }
}

function readViewport() {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  return { width: window.innerWidth, height: window.innerHeight }
}

export function GameScreen({ puzzle, api, onBack, onDocs }: GameScreenProps) {
  const [gameLoad, setGameLoad] = useState<LoadedGameState>(() => getLoadedGameState(api, puzzle))
  const [viewport, setViewport] = useState(readViewport)
  const progressRecorded = useRef(gameLoad.won)
  const lastLoadedRef = useRef<GameLoadKey>({ api, puzzleId: puzzle.id })

  const { playPuzzle, restored: state, won, loadError, removableIds, shuffleAvailable } = gameLoad

  useEffect(() => {
    function handleResize() {
      setViewport(readViewport())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!shouldReloadGameState(lastLoadedRef.current, api, puzzle.id)) return

    lastLoadedRef.current = { api, puzzleId: puzzle.id }
    const loaded = getLoadedGameState(api, puzzle)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGameLoad(loaded) // single atomic update driven by WASM engine reload
    progressRecorded.current = loaded.won
  }, [api, puzzle])

  const blockMeta = buildBlockMeta(playPuzzle)
  const puzzleMeta = { board: playPuzzle.board, blocks: blockMeta }

  const showManualWin = hasDescriptionOnly(playPuzzle.win_condition)
  const setupOptions = getSupportedSetupOptions(playPuzzle)

  const movableIds = new Set(
    playPuzzle.blocks.filter((b) => b.movable).map((b) => b.id),
  )

  function refreshState() {
    const r = api.getState()
    if (!r.ok) return
    appendDebugLog('game.getState', { puzzleId: playPuzzle.id, moveCount: r.moveCount, won: r.won, blockIds: Object.keys(r.blocks) })
    if (r.won && !progressRecorded.current) {
      progressRecorded.current = true
      recordSolve(playPuzzle.id, r.moveCount)
    }
    setGameLoad(g => ({ ...g, restored: r, won: g.won || r.won }))
  }

  function applyLoadedPuzzle(nextPuzzle: PlayablePuzzle) {
    const loaded = api.loadPuzzle(JSON.stringify(nextPuzzle))
    appendDebugLog('game.applyLoadedPuzzle', { puzzleId: nextPuzzle.id, ok: loaded.ok, blockCount: nextPuzzle.blocks.length })
    const nextRemovableIds = new Set(getSupportedSetupOptions(nextPuzzle)?.removable_blocks ?? [])
    if (loaded.ok) {
      progressRecorded.current = loaded.won
      if (loaded.won) clearPuzzleSession(nextPuzzle.id)
      setGameLoad(g => ({ ...g, playPuzzle: nextPuzzle, removableIds: nextRemovableIds, restored: loaded, loadError: null, won: loaded.won }))
    } else {
      progressRecorded.current = false
      setGameLoad(g => ({ ...g, playPuzzle: nextPuzzle, removableIds: nextRemovableIds, restored: null, loadError: loaded.error, won: false }))
    }
  }

  const { selectedBlock, shakenBlock, onBlockPointerDown, onBlockPointerEnd, onBlockLostPointerCapture } = useGameControls(
    api,
    refreshState,
    state?.blocks ?? {},
    movableIds,
  )

  function handleUndo() {
    const r = api.undo()
    if (r.ok) {
      appendDebugLog('game.undo', { puzzleId: playPuzzle.id, moveCount: r.moveCount, won: r.won })
      setGameLoad(g => ({ ...g, restored: r, won: r.won ? g.won : false }))
    }
  }

  function handleReset() {
    const r = api.reset()
    if (r.ok) {
      appendDebugLog('game.reset', { puzzleId: playPuzzle.id, moveCount: r.moveCount, won: r.won })
      progressRecorded.current = false
      setGameLoad(g => ({ ...g, restored: r, won: false }))
    }
  }

  function handleManualWin() {
    if (!progressRecorded.current) {
      progressRecorded.current = true
      recordSolve(playPuzzle.id, moveCount)
    }
    appendDebugLog('game.manualWin', { puzzleId: playPuzzle.id, moveCount })
    clearPuzzleSession(playPuzzle.id)
    setGameLoad(g => ({ ...g, won: true }))
  }

  const moveCount = state?.moveCount ?? 0
  const diff = playPuzzle.difficulty ?? 1
  const boardMaxW = playPuzzle.board.width * CELL_SIZE
  const boardDisplayWidth = computeBoardDisplayWidth(
    viewport.width,
    viewport.height,
    playPuzzle.board.width,
    playPuzzle.board.height,
  )
  const boardContainerWidth = Math.max(Math.min(boardMaxW, viewport.width), boardDisplayWidth)
  // A shuffle puzzle whose initial arrangement satisfies the win condition hasn't been "played"
  // yet — the player must shuffle first. Treat it as pre-play so the shuffle button shows and
  // the win banner is suppressed regardless of the underlying WASM won flag.
  const pendingShuffleStart = won && moveCount === 0 && shuffleAvailable && setupOptions?.allow_shuffle === true
  const canUseInlineSetup = (!won || pendingShuffleStart) && moveCount === 0
  const showShuffleAction = canUseInlineSetup && shuffleAvailable && setupOptions?.allow_shuffle === true
  const outlinedBlocks = canUseInlineSetup ? removableIds : new Set<string>()
  const removedSetupCount = countRemovedSetupBlocks(puzzle, playPuzzle)

  function handleShuffle() {
    appendDebugLog('game.shuffle', { puzzleId: playPuzzle.id })
    applyLoadedPuzzle(shufflePuzzle(playPuzzle))
    setGameLoad(g => ({ ...g, shuffleAvailable: false, won: false }))
  }

  function handleRemoveBlock(blockId: string) {
    appendDebugLog('game.removeBlock', { puzzleId: playPuzzle.id, blockId })
    applyLoadedPuzzle(removeBlocks(playPuzzle, [blockId]))
    setGameLoad(g => ({ ...g, won: false }))
  }

  function handleRestoreRemovedBlocks() {
    appendDebugLog('game.restoreRemovedBlocks', { puzzleId: puzzle.id })
    applyLoadedPuzzle(puzzle)
    setGameLoad(g => ({ ...g, won: false }))
  }

  function handleBoardBlockPointerDown(blockId: string, e: React.PointerEvent<SVGGElement>) {
    if (canUseInlineSetup && removableIds.has(blockId)) {
      e.preventDefault()
      handleRemoveBlock(blockId)
      return
    }
    onBlockPointerDown(blockId, e)
  }

  const savePuzzleState = useCallback(() => {
    if (!state) return
    const blocks = serializeWasmBlocks(state.blocks)
    const snapshotPuzzle: PlayablePuzzle = {
      ...playPuzzle,
      blocks: playPuzzle.blocks
        .filter((block) => block.id in blocks)
        .map((block) => ({ ...block, cells: blocks[block.id] })),
    }
    const currentPuzzleId = puzzle.id
    savePuzzleSession(currentPuzzleId, {
      puzzle: snapshotPuzzle,
      blocks,
      moveCount: state.moveCount,
      shuffleAvailable,
    })
    appendDebugLog('game.saveSession', { puzzleId: currentPuzzleId, moveCount: state.moveCount, blockIds: Object.keys(blocks) })
  }, [playPuzzle, puzzle.id, shuffleAvailable, state])

  useEffect(() => {
    if (!state || loadError) return
    if (state.won) {
      clearPuzzleSession(playPuzzle.id)
      return
    }
    if (!shouldPersistPuzzleSession(puzzle, playPuzzle, state.moveCount, shuffleAvailable)) {
      clearPuzzleSession(playPuzzle.id)
      return
    }
    savePuzzleState()
  }, [state, loadError, playPuzzle, puzzle, savePuzzleState, shuffleAvailable])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 clamp(12px, 4vw, 20px) 48px' }}>

      {/* Top bar */}
      <div style={topBarStyle}>
        <div style={topBarRowStyle}>
          <button onClick={onBack} style={ghostBtnStyle}>← Back</button>
          <div style={topBarTitleStyle}>
            <span style={{ fontWeight: 600, fontSize: 'clamp(1rem, 2.7vw, 1.1rem)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {playPuzzle.title}
            </span>
            {playPuzzle.source && (
              <span style={{ fontSize: '0.86rem', color: 'var(--text-soft)' }}>{playPuzzle.source}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: '0.9rem', letterSpacing: '0.04em', color: difficultyColor(diff) }}>
              {'★'.repeat(Math.min(diff, 5))}<span style={{ color: 'var(--text-muted)' }}>{'★'.repeat(Math.max(0, 5 - diff))}</span>
            </span>
            <button onClick={onDocs} style={iconBtnStyle} title="Settings and documentation" aria-label="Settings and documentation">
              <CogIcon />
            </button>
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--border)', width: '100%', maxWidth: 900, marginBottom: 20 }} />

      {loadError && (
        <div style={errorBannerStyle}>
          {loadError}
        </div>
      )}

      {/* Board — scales to fit viewport */}
      {state && !loadError && (
        <div style={{ width: '100%', maxWidth: boardContainerWidth, margin: '0 auto' }}>
          <div style={boardFrameStyle}>
            <Board
              state={state}
              meta={puzzleMeta}
              selectedBlock={selectedBlock}
            shakenBlock={shakenBlock}
            outlinedBlocks={outlinedBlocks}
            onBlockPointerDown={handleBoardBlockPointerDown}
            onBlockPointerEnd={onBlockPointerEnd}
            onBlockLostPointerCapture={onBlockLostPointerCapture}
          />
          </div>
        </div>
      )}

      {/* Win description */}
      {playPuzzle.win_description && (!won || pendingShuffleStart) && (
        <div style={{ marginTop: 14, fontSize: '0.95rem', color: 'var(--text-dim)', textAlign: 'center', maxWidth: boardContainerWidth }}>
          <span style={{ color: 'var(--text-soft)', fontStyle: 'italic' }}>To win: </span>
          {playPuzzle.win_description}
        </div>
      )}

      {/* Win preview */}
      {(!won || pendingShuffleStart) && <WinPreview puzzle={playPuzzle} />}

      {/* Manual win button (for description_only win conditions) */}
      {(!won || pendingShuffleStart) && showManualWin && (
        <div style={{ marginTop: 14 }}>
          <button onClick={handleManualWin} style={manualWinBtnStyle}>
            I've solved it!
          </button>
        </div>
      )}

      {/* HUD / setup slot */}
      <div style={hudWrapStyle}>
        <div style={hudStyle}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.92rem', marginRight: 4 }}>Moves</span>
            <strong style={{ fontSize: '1.16rem' }}>{moveCount}</strong>
            {playPuzzle.min_moves != null && (
              <span style={{ color: 'var(--text-dim)', marginLeft: 4, fontSize: '0.92rem' }}>/ {playPuzzle.min_moves}</span>
            )}
          </span>
          <div style={btnGroupStyle}>
            <button onClick={handleUndo} disabled={moveCount === 0} style={hudBtnStyle}>Undo</button>
            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
            <button onClick={handleReset} style={hudBtnStyle}>Reset</button>
          </div>
        </div>
        {canUseInlineSetup && (showShuffleAction || removableIds.size > 0) && (
          <div style={setupOverlayStyle}>
            <div style={setupMessageStyle}>
              {showShuffleAction && removableIds.size > 0
                ? removedSetupCount > 0
                  ? 'Before your first move, you can shuffle the puzzle, click outlined blocks to remove them, or restore removed blocks to the full starting layout.'
                  : 'Before your first move, you can shuffle the puzzle or click outlined blocks to remove them.'
                : showShuffleAction
                  ? 'Before your first move, you can shuffle the puzzle.'
                  : removedSetupCount > 0
                    ? 'Before your first move, click any outlined block to remove it, or restore removed blocks to the full starting layout.'
                    : 'Before your first move, click any outlined block to remove it.'}
            </div>
            <div style={setupActionsStyle}>
              {removedSetupCount > 0 && (
                <button onClick={handleRestoreRemovedBlocks} style={secondarySetupBtnStyle}>
                  Restore removed block{removedSetupCount === 1 ? '' : 's'}
                </button>
              )}
              {showShuffleAction && (
                <button onClick={handleShuffle} style={inlineSetupBtnStyle}>Shuffle</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Win banner */}
      {won && !pendingShuffleStart && (
        <div style={winBannerStyle}>
          <div style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 700 }}>
            🎉 Solved in {moveCount} move{moveCount !== 1 ? 's' : ''}
            {playPuzzle.min_moves != null && (
              <span style={{ fontSize: '0.98rem', fontWeight: 400, marginLeft: 8, color: 'var(--text-soft)' }}>
                {moveCount <= playPuzzle.min_moves ? '✨ Minimum moves!' : `(min ${playPuzzle.min_moves})`}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={onBack} style={winBtnStyle}>← Puzzle List</button>
            <button onClick={handleReset} style={{ ...winBtnStyle, background: 'rgba(255,255,255,0.14)' }}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const topBarStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 900,
  padding: 'clamp(14px, 4vw, 20px) 0 14px',
}

const topBarRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
}

const topBarTitleStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 160,
  textAlign: 'center',
}

const ghostBtnStyle: React.CSSProperties = {
  padding: '8px 15px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  fontSize: '0.98rem',
  flexShrink: 0,
  minHeight: 40,
}

const inlineSetupBtnStyle: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--accent-border)',
  background: 'var(--accent-button-bg)',
  color: 'var(--accent-text)',
  fontSize: '0.96rem',
  fontWeight: 600,
  flexShrink: 0,
  minHeight: 34,
}

const secondarySetupBtnStyle: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-hi)',
  background: 'rgba(255,255,255,0.08)',
  color: 'var(--text)',
  fontSize: '0.98rem',
  fontWeight: 600,
  flexShrink: 0,
  minHeight: 34,
}

const setupMessageStyle: React.CSSProperties = {
  flex: '1 1 280px',
  minWidth: 0,
  fontSize: '0.92rem',
  color: 'var(--text-dim)',
  textAlign: 'left',
}

const setupActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  alignItems: 'center',
  flex: '0 0 auto',
}

const errorBannerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 480,
  marginBottom: 14,
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--danger-dim)',
  border: '1px solid var(--danger-border)',
  color: 'var(--danger)',
  fontSize: '0.98rem',
  textAlign: 'center',
}

const hudWrapStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: 380,
  marginTop: 16,
  minHeight: 64,
}

const boardFrameStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: '20px',
  background: 'var(--frame-bg)',
  border: '1px solid rgba(245,223,187,0.22)',
  boxShadow: '0 12px 28px rgba(242,84,45,0.22), inset 0 1px 0 rgba(245,223,187,0.14)',
}

const hudStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '10px 20px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  width: '100%',
  minHeight: 64,
  justifyContent: 'space-between',
}

const setupOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'color-mix(in srgb, var(--surface) 88%, var(--accent-text) 12%)',
  border: '1px solid var(--accent-dim)',
  flexWrap: 'nowrap',
}

const btnGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  overflow: 'hidden',
}

const hudBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  border: 'none',
  borderRadius: 0,
  background: 'transparent',
  color: 'inherit',
  fontSize: '1rem',
  minHeight: 40,
}

const winBannerStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 'clamp(16px, 4vw, 24px) clamp(20px, 6vw, 32px)',
  borderRadius: 'var(--radius-lg)',
  background: 'linear-gradient(135deg, rgba(14,149,148,0.18), rgba(18,116,117,0.2))',
  border: '1px solid var(--success-border)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  width: '100%',
  maxWidth: 480,
}

const manualWinBtnStyle: React.CSSProperties = {
  padding: '9px 24px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--success-border)',
  background: 'var(--success-dim)',
  color: 'var(--success)',
  fontSize: '1.02rem',
  fontWeight: 600,
  cursor: 'pointer',
  minHeight: 40,
}

const winBtnStyle: React.CSSProperties = {
  padding: '9px 22px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.1)',
  color: 'inherit',
  fontSize: '1.02rem',
  fontWeight: 500,
  minHeight: 40,
}
