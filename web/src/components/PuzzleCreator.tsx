import { useEffect, useRef, useState } from 'react'
import { normalizePuzzleJSONInput } from '../puzzleTypes'
import type { PlayablePuzzle, PuzzleJSON } from '../puzzleTypes'
import { saveCustomPuzzleRecord } from '../customPuzzles'
import { PuzzleEditorVisual } from './PuzzleEditorVisual'
import { visualStateToPuzzleJSON, visualStateToPuzzleMetadata, type VisualState } from './puzzleEditorState'
import {
  applyVisualStateChange,
  canTryPuzzle,
  clearAuthoringState,
  makeInitialVisualState,
  popUndoHistory,
  replaceAuthoringStateFromPuzzle,
  snapshotAuthoringState,
} from './puzzleCreatorState'

interface Props {
  onBack: () => void
  onTryIt: (puzzle: PlayablePuzzle) => void
  initialPuzzle?: PlayablePuzzle
}

export function PuzzleCreator({ onBack, onTryIt, initialPuzzle }: Props) {
  const [visualState, setVisualState] = useState<VisualState>(() => makeInitialVisualState(initialPuzzle))
  const [undoHistory, setUndoHistory] = useState<VisualState[]>([])
  const [cleanSnapshot, setCleanSnapshot] = useState<string>(() => snapshotAuthoringState(makeInitialVisualState(initialPuzzle)))
  const [addedMsg, setAddedMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const addedMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (addedMsgTimerRef.current) clearTimeout(addedMsgTimerRef.current)
    }
  }, [])

  function showAddedMessage(message: string) {
    setAddedMsg(message)
    if (addedMsgTimerRef.current) clearTimeout(addedMsgTimerRef.current)
    addedMsgTimerRef.current = setTimeout(() => {
      setAddedMsg(null)
      addedMsgTimerRef.current = null
    }, 3000)
  }

  function handleAddToLibrary() {
    const gameplay = visualStateToPuzzleJSON(visualState)
    const metadata = visualStateToPuzzleMetadata(visualState)
    saveCustomPuzzleRecord({ puzzle: gameplay, metadata })
    showAddedMessage(`"${metadata.title}" added to library`)
  }

  function handleExport(puzzle: PuzzleJSON) {
    const json = JSON.stringify(puzzle, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${puzzle.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as unknown
      const puzzle = normalizePuzzleJSONInput(parsed)
      const next = replaceAuthoringStateFromPuzzle(puzzle)
      setVisualState(next.visualState)
      setUndoHistory([])
      setCleanSnapshot(next.cleanSnapshot)
      showAddedMessage(`Imported "${puzzle.id}" from JSON`)
      setErrorMsg(null)
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Failed to import puzzle JSON')
    }
  }

  const puzzle = visualStateToPuzzleJSON(visualState)
  const isDirty = JSON.stringify(puzzle) !== cleanSnapshot

  function handleBack() {
    onBack()
  }

  function handleImportClick() {
    if (isDirty && !window.confirm('Replace the current puzzle and discard unsaved changes?')) {
      return
    }
    fileInputRef.current?.click()
  }

  function handleClearPuzzle() {
    if (isDirty && !window.confirm('Clear the current puzzle and start over?')) {
      return
    }
    const next = clearAuthoringState()
    setVisualState(next.visualState)
    setUndoHistory([])
    setCleanSnapshot(next.cleanSnapshot)
    setErrorMsg(null)
    setAddedMsg(null)
  }

  function handleVisualStateChange(next: VisualState) {
    setVisualState((previous) => {
      setUndoHistory((history) => applyVisualStateChange(previous, next, history).nextHistory)
      return next
    })
  }

  function handleUndo() {
    setUndoHistory((history) => {
      const { nextHistory, restored } = popUndoHistory(history)
      if (restored) setVisualState(restored)
      return nextHistory
    })
  }

  function handleTryIt() {
    if (!canTryPuzzle(puzzle)) {
      setErrorMsg('Add at least one block before using Try It')
      return
    }
    setErrorMsg(null)
    onTryIt({
      ...puzzle,
      title: visualState.title.trim() || puzzle.id,
      source: visualState.source.trim() || 'Custom',
      difficulty: Math.max(1, Math.trunc(visualState.difficulty || 1)),
    })
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 clamp(14px, 4vw, 20px) 64px' }}>
      <div style={headerStyle}>
        <button onClick={handleBack} style={ghostBtn}>← Back</button>
        <span style={titleStyle}>Puzzle Authoring</span>
      </div>
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

      <PuzzleEditorVisual state={visualState} onChange={handleVisualStateChange} onUndo={handleUndo} canUndo={undoHistory.length > 0} />

      <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
        <button onClick={handleTryIt} style={primaryBtn}>Try It</button>
        <button onClick={handleAddToLibrary} style={secondaryBtn}>Add to Library</button>
        <button onClick={handleImportClick} style={secondaryBtn}>Import JSON</button>
        <button onClick={() => handleExport(puzzle)} style={secondaryBtn}>Export JSON</button>
        <button onClick={handleClearPuzzle} style={secondaryBtn}>Clear Puzzle</button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void handleImportFile(file)
        }}
      />

      {addedMsg && (
        <div style={feedbackBox}>
          {addedMsg}
        </div>
      )}
      {errorMsg && (
        <div style={errorBox}>
          {errorMsg}
        </div>
      )}
    </div>
  )
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'clamp(16px, 4vw, 22px) 0 16px',
}

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 'clamp(1.18rem, 3.2vw, 1.3rem)',
  background: 'linear-gradient(120deg, #f0a500 0%, #fbbf24 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 15px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  fontSize: '1rem',
  minHeight: 40,
}

const primaryBtn: React.CSSProperties = {
  padding: '9px 22px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(240,165,0,0.35)',
  background: 'rgba(240,165,0,0.12)',
  color: '#fcd34d',
  fontWeight: 600,
  fontSize: '1rem',
  minHeight: 40,
}

const secondaryBtn: React.CSSProperties = {
  padding: '9px 18px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'inherit',
  fontSize: '1rem',
  minHeight: 40,
}

const feedbackBox: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  marginTop: 10,
  background: 'rgba(34,197,94,0.1)',
  border: '1px solid rgba(34,197,94,0.28)',
  color: '#4ade80',
  fontSize: '1rem',
}

const errorBox: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  marginTop: 10,
  background: 'rgba(239,68,68,0.1)',
  border: '1px solid rgba(239,68,68,0.28)',
  color: 'var(--danger)',
  fontSize: '1rem',
}
