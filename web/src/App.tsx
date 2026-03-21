import { useState } from 'react'
import { useWasm } from './wasm'
import type { PuzzleJSON } from './puzzleTypes'
import { GameScreen } from './components/GameScreen'
import { PuzzleBrowser } from './components/PuzzleBrowser'
import { DocSelector } from './components/DocSelector'
import { HowToPlay } from './components/HowToPlay'
import { PuzzleFormatReference } from './components/PuzzleFormatReference'
import { AppArchitecture } from './components/AppArchitecture'
import { LibraryMetadataEditor } from './components/LibraryMetadataEditor'
import { PuzzleCreator } from './components/PuzzleCreator'
import { TitleScreen } from './components/TitleScreen'
import { shouldKeepCreatorMounted, type View } from './appViewState'
import './App.css'

export default function App() {
  const { status, error, api } = useWasm()
  const [view, setView] = useState<View>('title')
  const [activePuzzle, setActivePuzzle] = useState<PuzzleJSON | null>(null)
  const [gameReturnView, setGameReturnView] = useState<'browser' | 'creator'>('browser')
  const [creatorInitialPuzzle, setCreatorInitialPuzzle] = useState<PuzzleJSON | undefined>(undefined)
  const [editorKey, setEditorKey] = useState(0)
  const [hasAuthoringSession, setHasAuthoringSession] = useState(false)
  const [docOrigin, setDocOrigin] = useState<'browser' | 'game'>('browser')

  function goToGame(puzzle: PuzzleJSON, returnTo: 'browser' | 'creator') {
    setActivePuzzle(puzzle)
    setGameReturnView(returnTo)
    setView('game')
  }

  if (status === 'loading') {
    return <p style={{ padding: 24, color: 'var(--text-soft)', fontSize: '1rem' }}>Loading engine…</p>
  }
  if (status === 'error' || !api) {
    return <p style={{ padding: 24, color: 'var(--danger)', fontSize: '1rem' }}>Failed to load engine: {error}</p>
  }

  const inDocs = view === 'doc-selector' || view === 'how-to-play' || view === 'puzzle-format' || view === 'architecture' || view === 'library-metadata'

  function backFromDocs() {
    setView(docOrigin)
  }

  function openDocs(origin: 'browser' | 'game') {
    setDocOrigin(origin)
    setView('doc-selector')
  }

  function openCreator() {
    if (!hasAuthoringSession) {
      setCreatorInitialPuzzle(undefined)
      setEditorKey((k) => k + 1)
      setHasAuthoringSession(true)
    }
    setView('creator')
  }

  return (
    <>
      {view === 'title' && <TitleScreen onPlay={() => setView('browser')} />}

      {/* Keep GameScreen mounted while in docs so WASM game state is preserved */}
      {activePuzzle && (
        <div className="app-shell" style={{ display: view === 'game' ? undefined : 'none' }}>
          <GameScreen
            puzzle={activePuzzle}
            api={api}
            onBack={() => { setActivePuzzle(null); setView(gameReturnView) }}
            onDocs={() => openDocs('game')}
          />
        </div>
      )}

      {view === 'browser' && (
        <div className="app-shell">
          <PuzzleBrowser
            onSelect={(puzzle) => goToGame(puzzle, 'browser')}
            onDocs={() => openDocs('browser')}
            onEdit={(puzzle) => {
              setCreatorInitialPuzzle(puzzle)
              setEditorKey((k) => k + 1)
              setHasAuthoringSession(true)
              setView('creator')
            }}
          />
        </div>
      )}

      {/* Keep PuzzleCreator mounted while playing so authoring state survives Try It */}
      {shouldKeepCreatorMounted(view, hasAuthoringSession) && (
        <div className="app-shell" style={{ display: view === 'creator' ? undefined : 'none' }}>
          <PuzzleCreator
            key={editorKey}
            onBack={() => setView('browser')}
            onTryIt={(puzzle) => goToGame(puzzle, 'creator')}
            initialPuzzle={creatorInitialPuzzle}
          />
        </div>
      )}

      {inDocs && (
        <div className="app-shell">
          {view === 'doc-selector' && (
            <DocSelector
              onSelect={(page) => setView(page)}
              onBack={backFromDocs}
              onCreate={docOrigin === 'browser' ? openCreator : undefined}
              onEditLibraryMetadata={docOrigin === 'browser' ? () => setView('library-metadata') : undefined}
            />
          )}
          {view === 'how-to-play' && <HowToPlay onBack={() => setView('doc-selector')} />}
          {view === 'puzzle-format' && <PuzzleFormatReference onBack={() => setView('doc-selector')} />}
          {view === 'architecture' && <AppArchitecture onBack={() => setView('doc-selector')} />}
          {view === 'library-metadata' && <LibraryMetadataEditor onBack={() => setView('doc-selector')} />}
        </div>
      )}
    </>
  )
}
