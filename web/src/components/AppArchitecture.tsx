import { useState } from 'react'
import { DocPage } from './DocPage'
import { Code, H2, H3, Pre } from './docPageContent'
import { prose } from './docPageStyles'
import { clearLocalMemory } from '../localMemory'
import { clearDebugLog, getDebugLogText, isDebugEnabled, setDebugEnabled } from '../debugLog'

interface Props { onBack: () => void }

export function AppArchitecture({ onBack }: Props) {
  const [memoryCleared, setMemoryCleared] = useState(false)
  const [debugEnabled, setDebugEnabledState] = useState(() => isDebugEnabled())
  const [debugLog, setDebugLogState] = useState(() => getDebugLogText())
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  function handleClearLocalMemory() {
    clearLocalMemory()
    setMemoryCleared(true)
    setDebugEnabledState(false)
    setDebugLogState('')
    setCopyMessage(null)
  }

  function handleToggleDebug(enabled: boolean) {
    setDebugEnabled(enabled)
    setDebugEnabledState(enabled)
    setDebugLogState(getDebugLogText())
    setCopyMessage(null)
  }

  function handleClearDebugLog() {
    clearDebugLog()
    setDebugLogState('')
    setCopyMessage(null)
  }

  async function handleCopyDebugLog() {
    try {
      await navigator.clipboard.writeText(debugLog)
      setCopyMessage('Debug log copied.')
    } catch {
      setCopyMessage('Copy failed in this browser.')
    }
  }

  return (
    <DocPage title="App Architecture" onBack={onBack}>
      <div style={prose}>
        <p>
          This app is a <strong>single static website</strong>. There is no backend server and no
          database running somewhere else. Everything happens in your browser: the puzzle files are
          loaded as JSON, the puzzle rules run locally, and your progress is saved in browser
          storage on your own device.
        </p>

        <H2>The Big Picture</H2>
        <p>
          The app is split into two main parts:
        </p>
        <ul>
          <li>
            a <strong>puzzle engine</strong> written in Go, which checks moves and win conditions
          </li>
          <li>
            a <strong>browser interface</strong> written in React and TypeScript, which draws the
            screens, lets you play, and handles authoring and documentation
          </li>
        </ul>
        <p>
          The Go engine is compiled to <strong>WebAssembly</strong>. In practice that just means the
          browser can run the engine code directly on the page.
        </p>

        <H2>What Happens When You Open the App</H2>
        <ol>
          <li>The browser loads <Code>/puzzles/index.json</Code> to find out which built-in puzzles exist.</li>
          <li>The Puzzle Browser shows those puzzles in groups, along with any custom puzzles saved in your browser.</li>
          <li>When you choose a puzzle, the app loads that puzzle&apos;s JSON file and passes it to the puzzle engine.</li>
          <li>The engine checks that the puzzle is valid and prepares the starting state.</li>
          <li>The Game Screen draws the board and asks the engine whether moves are legal, whether Undo/Reset should work, and whether the puzzle is solved.</li>
        </ol>

        <H2>The Puzzle Engine</H2>
        <p>
          The engine is the part that knows the rules of the game. It does not draw anything on the
          screen. Its job is to answer questions like:
        </p>
        <ul>
          <li>Is this puzzle JSON valid?</li>
          <li>Can this block move left, right, up, or down?</li>
          <li>What does the board look like after that move?</li>
          <li>Has the player reached the win condition yet?</li>
        </ul>

        <H3>Main Go Files</H3>
        <ul>
          <li>
            <strong><Code>model.go</Code></strong> — the shared vocabulary of the game: boards,
            blocks, appearance, directions, game state, and win-condition types
          </li>
          <li>
            <strong><Code>loader.go</Code></strong> — reads puzzle JSON, validates it, and turns it into a
            playable puzzle state
          </li>
          <li>
            <strong><Code>engine.go</Code></strong> — applies moves, Undo, Reset, and win checking
          </li>
          <li>
            <strong><Code>solver.go</Code></strong> — used by development tools to compute minimum move counts
          </li>
        </ul>

        <H3>Engine Features the UI Relies On</H3>
        <ul>
          <li>Selector-based position and multi-position wins, adjacency, any-of, and description-only wins</li>
          <li>Move blocking by other blocks or board edges</li>
          <li>Undo and Reset</li>
          <li>Current move count</li>
        </ul>

        <H2>How the Browser Talks to the Engine</H2>
        <p>
          The engine is exposed to the browser through a small set of functions. The React side
          does not manipulate puzzle state directly. Instead, it calls the engine and uses the
          returned result to redraw the board.
        </p>
        <Pre>{`loadPuzzle(jsonStr)
tryMove(blockId, dir)
undo()
reset()
getState()
checkWin()
getMoveCount()`}</Pre>
        <p>
          Most of these return either a successful state update or an error. That keeps the rules in
          one place instead of spreading them through the UI.
        </p>

        <H2>The Browser Interface</H2>
        <p>
          The React side is the part you can see and interact with. It is responsible for:
        </p>
        <ul>
          <li>showing the puzzle browser and documentation pages</li>
          <li>drawing the board, block appearance, and win previews</li>
          <li>handling mouse, touch, and keyboard input</li>
          <li>running the visual puzzle authoring tools</li>
          <li>saving local progress and custom puzzles</li>
        </ul>

        <H3>Main Frontend Pieces</H3>
        <ul>
          <li>
            <strong>App</strong> — the top-level screen switcher between browser, game,
            documentation, and authoring
          </li>
          <li>
            <strong>PuzzleBrowser</strong> — shows the built-in puzzle library and your custom
            puzzles
          </li>
          <li>
            <strong>GameScreen</strong> — the play screen with the board, move counter, win state,
            and inline setup actions
          </li>
          <li>
            <strong>Board</strong> and <strong>BlockShape</strong> — draw the puzzle board as SVG
          </li>
          <li>
            <strong>useGameControls</strong> — handles dragging, clicking, and keyboard movement
          </li>
          <li>
            <strong>PuzzleCreator</strong> and <strong>PuzzleEditorVisual</strong> — the visual
            authoring workflow for creating and editing puzzles
          </li>
          <li>
            <strong>WinPreview</strong> — shows a small preview of the goal when the win condition
            can be drawn concretely
          </li>
        </ul>

        <H2>Authoring and Library Data</H2>
        <p>
          Built-in puzzles are stored as JSON files in the repo. Their browser listing comes from{' '}
          <Code>puzzles/index.json</Code>, which is generated during development from the shipped
          puzzle files.
        </p>
        <p>
          Custom puzzles are different: they are stored in your browser&apos;s local storage, not in a
          server database.
        </p>
        <ul>
          <li>
            <strong>progress.ts</strong> stores whether a puzzle is solved and your best move count
          </li>
          <li>
            <strong>customPuzzles.ts</strong> stores puzzles you added yourself, plus hidden-library
            choices
          </li>
        </ul>

        <H2>Data Flow</H2>
        <Pre>{`built-in puzzle files
  -> buildindex creates puzzles/index.json

Puzzle Browser
  -> loads index.json
  -> shows puzzle groups and custom puzzles

Play a puzzle
  -> load puzzle JSON
  -> send it to the engine
  -> engine returns board state
  -> Game Screen draws the board

Move a block
  -> UI sends move to engine
  -> engine accepts or rejects it
  -> UI redraws using the returned state

Author a puzzle
  -> visual editor builds PuzzleJSON
  -> Try It sends that PuzzleJSON straight to gameplay
  -> Add to Library saves it locally
  -> Export JSON downloads it as a file`}</Pre>

        <H2>Build Pipeline</H2>
        <p>
          For development and production builds, the project does three main things:
        </p>
        <ol>
          <li>generate the built-in puzzle index</li>
          <li>compile the Go engine to WebAssembly</li>
          <li>bundle the web app into static files</li>
        </ol>
        <Pre>{`cd core && go run ./cmd/buildindex ../puzzles
cd core && GOOS=js GOARCH=wasm go build -o ../web/public/sliding-puzzle.wasm ./cmd/wasm/
cp $(go env GOROOT)/lib/wasm/wasm_exec.js ../web/public/wasm_exec.js
cd web && npm run build`}</Pre>
        <p>
          The result is a folder of static files in <Code>web/dist/</Code> that can be served by
          any normal static web host.
        </p>

        <H2>Local Memory</H2>
        <p>
          The app stores some data <strong>only on this device</strong> using your browser&apos;s
          local storage. That includes custom puzzles you created or imported here, your recorded
          best scores, and puzzle hide/show choices.
        </p>
        <p>
          If you want to remove that local data from this computer, use the button below. This
          clears device-only puzzle definitions and saved scores, and it also resets hidden-puzzle
          choices for this browser.
        </p>
        <div style={memoryBoxStyle}>
          <button onClick={handleClearLocalMemory} style={clearBtnStyle}>
            Clear local memory
          </button>
          <div style={memoryNoteStyle}>
            {memoryCleared
              ? 'Local memory cleared for this browser.'
              : 'This only affects data saved on this device.'}
          </div>
        </div>

        <H2>Debug Logging</H2>
        <p>
          If you are trying to report a puzzle input bug, you can turn on a debug trace here, go
          back to the game, reproduce the problem, then return to this page and copy the log.
        </p>
        <div style={memoryBoxStyle}>
          <label style={toggleRowStyle}>
            <input
              type="checkbox"
              checked={debugEnabled}
              onChange={(event) => handleToggleDebug(event.target.checked)}
            />
            <span>Enable gameplay debug logging</span>
          </label>
          <div style={memoryNoteStyle}>
            Logs include pointer lifecycle events, move attempts, engine state refreshes, and
            session restore/save activity. The log stays in local browser storage until you clear it.
          </div>
          <div style={debugActionsStyle}>
            <button onClick={handleClearDebugLog} style={secondaryBtnStyle}>
              Clear debug log
            </button>
            <button onClick={handleCopyDebugLog} style={secondaryBtnStyle} disabled={!debugLog}>
              Copy debug log
            </button>
          </div>
          {copyMessage && <div style={memoryNoteStyle}>{copyMessage}</div>}
          <textarea
            readOnly
            value={debugLog}
            placeholder={debugEnabled ? 'Reproduce the issue, then come back here to copy the log.' : 'Enable debug logging to capture gameplay traces.'}
            style={debugLogStyle}
          />
        </div>
      </div>
    </DocPage>
  )
}

const memoryBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: '16px 18px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 10,
}

const clearBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(225,29,72,0.45)',
  background: 'rgba(225,29,72,0.12)',
  color: '#ffd4de',
  fontSize: '0.98rem',
  fontWeight: 600,
  cursor: 'pointer',
}

const memoryNoteStyle: React.CSSProperties = {
  color: 'var(--text-dim)',
  fontSize: '0.95rem',
}

const toggleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontWeight: 600,
}

const debugActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.06)',
  color: 'var(--text)',
  fontSize: '0.96rem',
  fontWeight: 600,
  cursor: 'pointer',
}

const debugLogStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 180,
  resize: 'vertical',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'rgba(0,0,0,0.18)',
  color: 'var(--text)',
  padding: '12px',
  fontFamily: 'JetBrains Mono Variable, monospace',
  fontSize: '0.82rem',
  lineHeight: 1.5,
}
