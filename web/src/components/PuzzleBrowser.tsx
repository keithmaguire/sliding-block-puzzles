import { useEffect, useRef, useState } from 'react'
import type { PuzzleJSON, IndexEntry, PuzzleGroup, PuzzleIndex } from '../puzzleTypes'
import { isGroup } from '../puzzleTypes'
import { getProgress } from '../progress'
import { getCustomPuzzles, removeCustomPuzzle, getHiddenPuzzleIds, hidePuzzle, restoreHiddenPuzzle } from '../customPuzzles'
import { difficultyColor } from './difficultyColor'
import { fetchJsonWithCache } from '../cachedFetch'

const BASE_URL = import.meta.env.BASE_URL

interface PuzzleBrowserProps {
  onSelect: (puzzle: PuzzleJSON) => void
  onDocs: () => void
  onCreate: () => void
  onEdit: (puzzle: PuzzleJSON) => void
}

/** Flatten a group tree into a list of all leaf IndexEntry objects. */
function flattenGroups(groups: PuzzleGroup[]): IndexEntry[] {
  const out: IndexEntry[] = []
  function walk(items: (IndexEntry | PuzzleGroup)[]) {
    for (const item of items) {
      if (isGroup(item)) walk(item.items)
      else out.push(item)
    }
  }
  groups.forEach((g) => walk(g.items))
  return out
}

/** Parse the canonical v2 grouped index response. */
function parseIndex(raw: unknown): PuzzleGroup[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('index.json must be a v2 grouped object')
  }
  const idx = raw as PuzzleIndex
  if (idx.version !== 2 || !Array.isArray(idx.groups)) {
    throw new Error('index.json must contain version: 2 and a groups array')
  }
  return idx.groups
}

export function PuzzleBrowser({ onSelect, onDocs, onCreate, onEdit }: PuzzleBrowserProps) {
  const [groups, setGroups] = useState<PuzzleGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [custom, setCustom] = useState<PuzzleJSON[]>(() => getCustomPuzzles())
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => getHiddenPuzzleIds())
  const [showHidden, setShowHidden] = useState(false)
  const latestLibraryRequest = useRef(0)
  const mountedRef = useRef(true)

  function handleRemoveCustom(id: string) {
    removeCustomPuzzle(id)
    setCustom(getCustomPuzzles())
  }

  function handleHideLibrary(id: string) {
    hidePuzzle(id)
    setHiddenIds(getHiddenPuzzleIds())
  }

  function handleRestore(id: string) {
    restoreHiddenPuzzle(id)
    setHiddenIds(getHiddenPuzzleIds())
  }

  useEffect(() => {
    mountedRef.current = true
    fetchJsonWithCache<PuzzleIndex>(`${BASE_URL}puzzles/index.json`)
      .then((raw) => {
        if (!mountedRef.current) return
        setGroups(parseIndex(raw))
      })
      .catch((e) => {
        if (!mountedRef.current) return
        setError(String(e))
      })
      .finally(() => {
        if (!mountedRef.current) return
        setLoading(false)
      })

    return () => {
      mountedRef.current = false
    }
  }, [])

  async function fetchLibraryPuzzle(entry: IndexEntry): Promise<PuzzleJSON> {
    return fetchJsonWithCache<PuzzleJSON>(`${BASE_URL}puzzles/${entry.file}`)
  }

  async function handleSelect(entry: IndexEntry) {
    const requestId = ++latestLibraryRequest.current
    try {
      const puzzle = await fetchLibraryPuzzle(entry)
      if (!mountedRef.current || requestId !== latestLibraryRequest.current) return
      onSelect(puzzle)
    } catch (e) {
      if (!mountedRef.current || requestId !== latestLibraryRequest.current) return
      setError(String(e))
    }
  }

  async function handleEditLibrary(entry: IndexEntry) {
    const requestId = ++latestLibraryRequest.current
    try {
      const puzzle = await fetchLibraryPuzzle(entry)
      if (!mountedRef.current || requestId !== latestLibraryRequest.current) return
      onEdit(puzzle)
    } catch (e) {
      if (!mountedRef.current || requestId !== latestLibraryRequest.current) return
      setError(String(e))
    }
  }

  const allEntries = flattenGroups(groups)
  const hiddenEntries = allEntries.filter((e) => hiddenIds.includes(e.id))

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 clamp(14px, 4vw, 20px) 48px' }}>

      {/* Header */}
      <div style={headerStyle}>
        <span style={titleGradientStyle}>Sliding Block Puzzles</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={onCreate} style={createBtnStyle} title="Create puzzle">
            <PlusIcon />
            Create
          </button>
          <button onClick={onDocs} style={iconBtnStyle} title="Documentation" aria-label="Documentation">
            <HelpIcon />
          </button>
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

      {loading && <p style={{ color: 'var(--text-dim)', padding: '8px 0' }}>Loading puzzles…</p>}
      {error && <p style={{ color: 'var(--danger)', padding: '8px 0' }}>Error: {error}</p>}

      {/* Hierarchical groups */}
      {groups.map((group) => (
        <GroupSection
          key={group.id}
          group={group}
          hiddenIds={hiddenIds}
          depth={0}
          onSelect={handleSelect}
          onEditLibrary={handleEditLibrary}
          onHide={handleHideLibrary}
        />
      ))}

      {/* Hidden puzzles restore panel */}
      {hiddenEntries.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setShowHidden((v) => !v)} style={restoreToggleStyle}>
            {showHidden ? '▾' : '▸'} {hiddenEntries.length} hidden puzzle{hiddenEntries.length !== 1 ? 's' : ''}
          </button>
          {showHidden && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {hiddenEntries.map((entry) => (
                <div key={entry.id} style={hiddenRowStyle}>
                  <span style={{ color: 'var(--text-soft)', fontSize: '0.98rem' }}>{entry.title}</span>
                  <button onClick={() => handleRestore(entry.id)} style={restoreBtnStyle}>Restore</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom puzzles */}
      {custom.length > 0 && (
        <>
          <div style={{ height: 1, background: 'var(--border)', margin: '24px 0 16px' }} />
          <div style={sectionLabelStyle}>My Puzzles</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {custom.map((puzzle) => {
              const progress = getProgress(puzzle.id)
              return (
                <PuzzleCard
                  key={puzzle.id}
                  entry={{ id: puzzle.id, title: puzzle.title, file: '', source: puzzle.source, difficulty: puzzle.difficulty ?? 1, min_moves: puzzle.min_moves }}
                  diff={puzzle.difficulty ?? 1}
                  solved={progress.solved}
                  bestMoves={progress.bestMoves}
                  onClick={() => onSelect(puzzle)}
                  onEdit={() => onEdit(puzzle)}
                  onRemove={() => handleRemoveCustom(puzzle.id)}
                  removeLabel="Delete"
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── GroupSection ──────────────────────────────────────────────────────────────

interface GroupSectionProps {
  group: PuzzleGroup
  hiddenIds: string[]
  depth: number
  onSelect: (e: IndexEntry) => void
  onEditLibrary: (e: IndexEntry) => void
  onHide: (id: string) => void
}

function GroupSection({ group, hiddenIds, depth, onSelect, onEditLibrary, onHide }: GroupSectionProps) {
  const [open, setOpen] = useState(true)

  // Count visible items recursively
  function countVisible(items: (IndexEntry | PuzzleGroup)[]): number {
    let n = 0
    for (const item of items) {
      if (isGroup(item)) n += countVisible(item.items)
      else if (!hiddenIds.includes(item.id)) n++
    }
    return n
  }
  const visible = countVisible(group.items)

  const indent = depth * 14

  return (
    <div style={{ marginBottom: depth === 0 ? 18 : 10 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: `4px 0 4px ${indent}px`,
          marginBottom: open ? 8 : 4,
          width: '100%', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', width: 12 }}>{open ? '▾' : '▸'}</span>
        <span style={{
          fontSize: depth === 0 ? '0.82rem' : '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.07em',
          color: depth === 0 ? 'var(--text-dim)' : 'var(--text-muted)',
          textTransform: 'uppercase',
        }}>
          {group.title}
        </span>
        {!open && visible > 0 && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 4 }}>
            {visible}
          </span>
        )}
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {group.items.map((item) => {
            if (isGroup(item)) {
              return (
                <GroupSection
                  key={item.id}
                  group={item}
                  hiddenIds={hiddenIds}
                  depth={depth + 1}
                  onSelect={onSelect}
                  onEditLibrary={onEditLibrary}
                  onHide={onHide}
                />
              )
            }
            if (hiddenIds.includes(item.id)) return null
            const progress = getProgress(item.id)
            return (
              <div key={item.id} style={{ paddingLeft: indent + 14 }}>
                <PuzzleCard
                  entry={item}
                  diff={item.difficulty ?? 1}
                  solved={progress.solved}
                  bestMoves={progress.bestMoves}
                  onClick={() => onSelect(item)}
                  onEdit={() => onEditLibrary(item)}
                  onRemove={() => onHide(item.id)}
                  removeLabel="Hide"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type RemovePhase = 'idle' | 'confirm1' | 'confirm2'

interface CardProps {
  entry: IndexEntry
  diff: number
  solved: boolean
  bestMoves: number
  onClick: () => void
  onEdit?: () => void
  onRemove?: () => void
  removeLabel?: string
}

function PuzzleCard({ entry, diff, solved, bestMoves, onClick, onEdit, onRemove, removeLabel = 'Remove' }: CardProps) {
  const [hovered, setHovered] = useState(false)
  const [phase, setPhase] = useState<RemovePhase>('idle')
  const accent = difficultyColor(diff)
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setPhase('idle') }}
        style={{
          ...cardBaseStyle,
          background: hovered ? 'var(--surface-hi)' : 'var(--surface)',
          borderColor: hovered ? accent + '55' : 'var(--border)',
          borderLeft: `3px solid ${accent}`,
          paddingLeft: 14,
          paddingRight: onRemove && onEdit ? 76 : (onRemove || onEdit) ? 44 : undefined,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 'clamp(0.98rem, 2.7vw, 1.04rem)' }}>{entry.title}</span>
          {entry.source && (
            <span style={{ fontSize: '0.86rem', color: 'var(--text-soft)', flexShrink: 0 }}>{entry.source}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9rem', color: accent, letterSpacing: '0.04em' }}>
            {'★'.repeat(Math.min(diff, 5))}
            <span style={{ color: 'var(--text-muted)' }}>{'★'.repeat(Math.max(0, 5 - diff))}</span>
          </span>
          {entry.min_moves != null && (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Min {entry.min_moves}</span>
          )}
          {solved && (
            <span style={solvedBadgeStyle}>✓ {bestMoves} moves</span>
          )}
        </div>
      </button>
      {onEdit && phase === 'idle' && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          title="Edit puzzle"
          style={{ ...actionBtnStyle, right: onRemove ? 40 : 10 }}
        >
          <EditIcon />
        </button>
      )}
      {onRemove && phase === 'idle' && (
        <button
          onClick={(e) => { e.stopPropagation(); setPhase('confirm1') }}
          title="Remove from list"
          style={actionBtnStyle}
        >
          ×
        </button>
      )}
      {onRemove && phase === 'confirm1' && (
        <div style={confirmOverlayStyle} onClick={(e) => e.stopPropagation()}>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-dim)', paddingRight: 4 }}>{removeLabel}?</span>
          <button onClick={() => setPhase('confirm2')} style={confirmWarnStyle}>{removeLabel}</button>
          <button onClick={() => setPhase('idle')} style={confirmCancelStyle}>Cancel</button>
        </div>
      )}
      {onRemove && phase === 'confirm2' && (
        <div style={confirmOverlayStyle} onClick={(e) => e.stopPropagation()}>
          <span style={{ fontSize: '0.88rem', color: 'var(--danger)', paddingRight: 4 }}>Sure?</span>
          <button onClick={() => onRemove()} style={confirmYesStyle}>Yes, {removeLabel.toLowerCase()}</button>
          <button onClick={() => setPhase('idle')} style={confirmCancelStyle}>Cancel</button>
        </div>
      )}
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'clamp(16px, 4vw, 22px) 0 16px',
  gap: 12,
}

const titleGradientStyle: React.CSSProperties = {
  fontSize: 'clamp(1.3rem, 3.7vw, 1.5rem)',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  background: 'linear-gradient(120deg, #f0a500 0%, #fbbf24 55%, #fb923c 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const createBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  padding: '0 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(240,165,0,0.35)',
  background: 'rgba(240,165,0,0.1)',
  color: '#fbbf24',
  fontSize: '0.98rem',
  fontWeight: 600,
  height: 40,
  flexShrink: 0,
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.94rem',
  fontWeight: 600,
  letterSpacing: '0.09em',
  color: 'var(--text)',
  textTransform: 'uppercase',
  marginBottom: 8,
}

const iconBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  padding: 0,
  flexShrink: 0,
}

const cardBaseStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid',
  color: 'inherit',
  width: '100%',
  transition: 'background 0.15s, border-color 0.15s',
  minHeight: 64,
}

const actionBtnStyle: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 28,
  height: 28,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-soft)',
  fontSize: '1.1rem',
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  padding: 0,
}

const solvedBadgeStyle: React.CSSProperties = {
  fontSize: '0.94rem',
  fontWeight: 600,
  padding: '2px 9px',
  borderRadius: 'var(--radius-sm)',
  background: 'linear-gradient(120deg, rgba(34,197,94,0.18), rgba(6,182,212,0.12))',
  color: '#34d399',
  border: '1px solid rgba(52,211,153,0.3)',
}

const confirmOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '0 8px',
  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
  background: 'var(--surface-hi)',
}

const confirmWarnStyle: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(251,146,60,0.4)',
  background: 'rgba(251,146,60,0.12)',
  color: '#fb923c',
  fontSize: '0.98rem',
  fontWeight: 500,
  cursor: 'pointer',
}

const confirmYesStyle: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(248,113,113,0.4)',
  background: 'rgba(248,113,113,0.12)',
  color: 'var(--danger)',
  fontSize: '0.98rem',
  fontWeight: 500,
  cursor: 'pointer',
}

const confirmCancelStyle: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  fontSize: '0.98rem',
  cursor: 'pointer',
}

const restoreToggleStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text)',
  fontSize: '0.98rem',
  cursor: 'pointer',
  padding: '2px 0',
}

const hiddenRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
}

const restoreBtnStyle: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  fontSize: '0.92rem',
  cursor: 'pointer',
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M6.5 6a1.5 1.5 0 0 1 3 0c0 1-1.5 1.5-1.5 2.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2l3 3-8 8H3v-3l8-8z" />
    </svg>
  )
}
