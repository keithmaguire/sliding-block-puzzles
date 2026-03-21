import { useEffect, useMemo, useState } from 'react'
import type { CustomPuzzleRecord, PuzzleIndex } from '../puzzleTypes'
import { fetchJsonWithCache } from '../cachedFetch'
import { getCustomPuzzleRecords, updateCustomPuzzleMetadata } from '../customPuzzles'
import { DocPage } from './DocPage'

const BASE_URL = import.meta.env.BASE_URL
const CUSTOM_GROUP_ID = 'custom-local'
const CUSTOM_GROUP_TITLE = 'Custom'

type RowOrigin = 'built-in' | 'custom'

interface EditorRow {
  origin: RowOrigin
  id: string
  file: string
  title: string
  source: string
  difficulty: number
  groupId: string
  minMoves?: number
}

interface GroupOption {
  id: string
  title: string
}

interface Props {
  onBack: () => void
}

export function LibraryMetadataEditor({ onBack }: Props) {
  const [rows, setRows] = useState<EditorRow[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [difficulties, setDifficulties] = useState<number[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [newSource, setNewSource] = useState('')
  const [newDifficulty, setNewDifficulty] = useState('1')
  const [newGroupTitle, setNewGroupTitle] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const index = await fetchJsonWithCache<PuzzleIndex>(`${BASE_URL}puzzles/index.json`)
        if (cancelled) return
        const custom = getCustomPuzzleRecords()
        const nextRows = buildRows(index, custom)
        const nextSources = uniqueStrings([
          ...index.registries.sources,
          ...nextRows.map((row) => row.source).filter(Boolean),
        ])
        const nextDifficulties = uniqueNumbers([
          ...index.registries.difficulties,
          ...nextRows.map((row) => row.difficulty),
        ])
        const nextGroups = buildGroups(index, custom, nextRows)
        setRows(nextRows)
        setSources(nextSources)
        setDifficulties(nextDifficulties)
        setGroups(nextGroups)
        setHydrated(true)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load library metadata')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const invalidRows = useMemo(
    () => findInvalidRows(rows, sources, difficulties, groups),
    [rows, sources, difficulties, groups],
  )

  const canExport = !loading && !error && invalidRows.length === 0

  useEffect(() => {
    if (!hydrated || loading || error) return
    const groupTitles = new Map(groups.map((group) => [group.id, group.title]))
    for (const row of rows) {
      if (row.origin !== 'custom') continue
      updateCustomPuzzleMetadata(row.id, {
        title: row.title.trim(),
        source: row.source,
        difficulty: row.difficulty,
        group_id: row.groupId,
        group_title: groupTitles.get(row.groupId) ?? CUSTOM_GROUP_TITLE,
      })
    }
  }, [rows, groups, hydrated, loading, error])

  function updateRow(id: string, origin: RowOrigin, patch: Partial<EditorRow>) {
    setRows((current) => current.map((row) => (
      row.id === id && row.origin === origin ? { ...row, ...patch } : row
    )))
  }

  function addSource() {
    const value = newSource.trim()
    if (!value) return
    setSources((current) => uniqueStrings([...current, value]))
    setNewSource('')
  }

  function addDifficulty() {
    const value = Number(newDifficulty)
    if (!Number.isFinite(value) || value < 1) return
    setDifficulties((current) => uniqueNumbers([...current, value]))
    setNewDifficulty(String(value))
  }

  function addGroup() {
    const title = newGroupTitle.trim()
    if (!title) return
    setGroups((current) => {
      const id = nextGroupId(current, title)
      return [...current, { id, title }]
    })
    setNewGroupTitle('')
  }

  function exportIndex() {
    if (!canExport) return
    const index = buildExportIndex(rows, sources, difficulties, groups)

    const blob = new Blob([`${JSON.stringify(index, null, 2)}\n`], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'index.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DocPage title="Edit Library Metadata" onBack={onBack}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, color: 'var(--text-dim)', lineHeight: 1.7 }}>
          Edit built-in and custom puzzle metadata together. Export writes only the built-in
          replacement <code>index.json</code>.
        </p>

        {loading && <div style={infoBox}>Loading library metadata…</div>}
        {error && <div style={errorBox}>{error}</div>}

        {!loading && !error && (
          <>
            <RegistryPanel
              sources={sources}
              onRemoveSource={(value) => setSources((current) => current.filter((item) => item !== value))}
              newSource={newSource}
              onNewSourceChange={setNewSource}
              onAddSource={addSource}
              difficulties={difficulties}
              onRemoveDifficulty={(value) => setDifficulties((current) => current.filter((item) => item !== value))}
              newDifficulty={newDifficulty}
              onNewDifficultyChange={setNewDifficulty}
              onAddDifficulty={addDifficulty}
              groups={groups}
              onChangeGroupTitle={(id, title) => setGroups((current) => current.map((group) => group.id === id ? { ...group, title } : group))}
              onRemoveGroup={(id) => setGroups((current) => current.filter((group) => group.id !== id))}
              newGroupTitle={newGroupTitle}
              onNewGroupTitleChange={setNewGroupTitle}
              onAddGroup={addGroup}
            />

            {invalidRows.length > 0 && (
              <div style={warningBox}>
                {invalidRows.length} row{invalidRows.length === 1 ? '' : 's'} currently fail validation. Export is disabled until
                every row uses an allowed source, difficulty, group, and non-empty title.
              </div>
            )}

            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <HeaderCell>Origin</HeaderCell>
                    <HeaderCell>ID</HeaderCell>
                    <HeaderCell>File</HeaderCell>
                    <HeaderCell>Title</HeaderCell>
                    <HeaderCell>Source</HeaderCell>
                    <HeaderCell>Difficulty</HeaderCell>
                    <HeaderCell>Group</HeaderCell>
                    <HeaderCell>Min</HeaderCell>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const rowInvalid = invalidRows.some((candidate) => candidate.id === row.id && candidate.origin === row.origin)
                    return (
                      <tr key={`${row.origin}:${row.id}`} style={rowInvalid ? invalidRowStyle : undefined}>
                        <DataCell>
                          <span style={row.origin === 'built-in' ? originBuiltInStyle : originCustomStyle}>
                            {row.origin === 'built-in' ? 'Built-in' : 'Custom'}
                          </span>
                        </DataCell>
                        <DataCell>{row.id}</DataCell>
                        <DataCell>{row.file || 'local'}</DataCell>
                        <DataCell>
                          <input value={row.title} onChange={(event) => updateRow(row.id, row.origin, { title: event.target.value })} style={textInputStyle} />
                        </DataCell>
                        <DataCell>
                          <select value={row.source} onChange={(event) => updateRow(row.id, row.origin, { source: event.target.value })} style={selectStyle}>
                            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
                          </select>
                        </DataCell>
                        <DataCell>
                          <select
                            value={String(row.difficulty)}
                            onChange={(event) => updateRow(row.id, row.origin, { difficulty: Number(event.target.value) })}
                            style={selectStyle}
                          >
                            {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
                          </select>
                        </DataCell>
                        <DataCell>
                          <select value={row.groupId} onChange={(event) => updateRow(row.id, row.origin, { groupId: event.target.value })} style={selectStyle}>
                            {groups.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}
                          </select>
                        </DataCell>
                        <DataCell>{row.minMoves ?? '—'}</DataCell>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={exportIndex} disabled={!canExport} style={canExport ? primaryBtnStyle : disabledBtnStyle}>
                Export updated index
              </button>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                Built-in rows exported: {rows.filter((row) => row.origin === 'built-in').length}
              </span>
            </div>
          </>
        )}
      </div>
    </DocPage>
  )
}

export function buildRows(index: PuzzleIndex, customPuzzles: CustomPuzzleRecord[]): EditorRow[] {
  const customRows = customPuzzles.map((record) => ({
    origin: 'custom' as const,
    id: record.puzzle.id,
    file: '',
    title: record.metadata.title,
    source: record.metadata.source,
    difficulty: record.metadata.difficulty,
    groupId: record.metadata.group_id || CUSTOM_GROUP_ID,
    minMoves: record.puzzle.min_moves,
  }))

  const builtInRows = index.puzzles.map((row) => ({
    origin: 'built-in' as const,
    id: row.id,
    file: row.file,
    title: row.title,
    source: row.source,
    difficulty: row.difficulty,
    groupId: row.group_id,
    minMoves: row.min_moves,
  }))

  return [...builtInRows, ...customRows]
}

export function buildGroups(index: PuzzleIndex, customPuzzles: CustomPuzzleRecord[], rows: EditorRow[]): GroupOption[] {
  const base = [
    ...index.registries.groups,
    ...customPuzzles
      .map((record) => ({
        id: record.metadata.group_id || CUSTOM_GROUP_ID,
        title: record.metadata.group_title || CUSTOM_GROUP_TITLE,
      })),
  ]
  if ((customPuzzles.length > 0 || rows.some((row) => row.groupId === CUSTOM_GROUP_ID)) && !base.some((group) => group.id === CUSTOM_GROUP_ID)) {
    base.push({ id: CUSTOM_GROUP_ID, title: CUSTOM_GROUP_TITLE })
  }

  const seen = new Set<string>()
  return base.filter((group) => {
    if (seen.has(group.id)) return false
    seen.add(group.id)
    return true
  })
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

export function findInvalidRows(
  rows: EditorRow[],
  sources: string[],
  difficulties: number[],
  groups: GroupOption[],
): EditorRow[] {
  return rows.filter((row) => (
    !sources.includes(row.source) ||
    !difficulties.includes(row.difficulty) ||
    !groups.some((group) => group.id === row.groupId) ||
    row.title.trim() === ''
  ))
}

export function buildExportIndex(
  rows: EditorRow[],
  sources: string[],
  difficulties: number[],
  groups: GroupOption[],
): PuzzleIndex {
  const builtInRows = rows.filter((row) => row.origin === 'built-in')
  const usedGroupIds = new Set(builtInRows.map((row) => row.groupId))
  const exportGroups = groups.filter((group) => group.id !== CUSTOM_GROUP_ID || usedGroupIds.has(group.id))
  return {
    version: 3,
    registries: {
      sources,
      difficulties,
      groups: exportGroups,
    },
    puzzles: builtInRows
      .map((row) => ({
        id: row.id,
        file: row.file,
        title: row.title.trim(),
        source: row.source,
        difficulty: row.difficulty,
        group_id: row.groupId,
        ...(row.minMoves != null ? { min_moves: row.minMoves } : {}),
      }))
      .sort((a, b) => (
        a.group_id === b.group_id
          ? (a.title === b.title ? a.id.localeCompare(b.id) : a.title.localeCompare(b.title))
          : a.group_id.localeCompare(b.group_id)
      )),
  }
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values.filter((value) => Number.isFinite(value) && value >= 1))].sort((a, b) => a - b)
}

function nextGroupId(groups: GroupOption[], title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'group'
  let candidate = base
  let counter = 2
  while (groups.some((group) => group.id === candidate)) {
    candidate = `${base}-${counter}`
    counter += 1
  }
  return candidate
}

function RegistryPanel(props: {
  sources: string[]
  onRemoveSource: (value: string) => void
  newSource: string
  onNewSourceChange: (value: string) => void
  onAddSource: () => void
  difficulties: number[]
  onRemoveDifficulty: (value: number) => void
  newDifficulty: string
  onNewDifficultyChange: (value: string) => void
  onAddDifficulty: () => void
  groups: GroupOption[]
  onChangeGroupTitle: (id: string, title: string) => void
  onRemoveGroup: (id: string) => void
  newGroupTitle: string
  onNewGroupTitleChange: (value: string) => void
  onAddGroup: () => void
}) {
  return (
    <div style={panelStyle}>
      <div style={registryGridStyle}>
        <RegistrySection
          title="Sources"
          items={props.sources.map((source) => (
            <EditableChip key={source} label={source} onRemove={() => props.onRemoveSource(source)} />
          ))}
          input={(
            <div style={inlineFormStyle}>
              <input value={props.newSource} onChange={(event) => props.onNewSourceChange(event.target.value)} style={textInputStyle} placeholder="Add source" />
              <button onClick={props.onAddSource} style={miniBtnStyle}>Add</button>
            </div>
          )}
        />

        <RegistrySection
          title="Difficulties"
          items={props.difficulties.map((difficulty) => (
            <EditableChip key={difficulty} label={String(difficulty)} onRemove={() => props.onRemoveDifficulty(difficulty)} />
          ))}
          input={(
            <div style={inlineFormStyle}>
              <input value={props.newDifficulty} onChange={(event) => props.onNewDifficultyChange(event.target.value)} style={textInputStyle} inputMode="numeric" />
              <button onClick={props.onAddDifficulty} style={miniBtnStyle}>Add</button>
            </div>
          )}
        />

        <RegistrySection
          title="Groups"
          items={props.groups.map((group) => (
            <div key={group.id} style={groupEditRowStyle}>
              <span style={groupIdStyle}>{group.id}</span>
              <input value={group.title} onChange={(event) => props.onChangeGroupTitle(group.id, event.target.value)} style={textInputStyle} />
              <button onClick={() => props.onRemoveGroup(group.id)} style={miniDangerStyle}>Remove</button>
            </div>
          ))}
          input={(
            <div style={inlineFormStyle}>
              <input value={props.newGroupTitle} onChange={(event) => props.onNewGroupTitleChange(event.target.value)} style={textInputStyle} placeholder="New group title" />
              <button onClick={props.onAddGroup} style={miniBtnStyle}>Add</button>
            </div>
          )}
        />
      </div>
    </div>
  )
}

function RegistrySection({ title, items, input }: { title: string; items: React.ReactNode[]; input: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={sectionTitleStyle}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{items}</div>
      {input}
    </div>
  )
}

function EditableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={chipStyle}>
      <span>{label}</span>
      <button onClick={onRemove} style={chipRemoveStyle}>×</button>
    </div>
  )
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return <th style={headerCellStyle}>{children}</th>
}

function DataCell({ children }: { children: React.ReactNode }) {
  return <td style={dataCellStyle}>{children}</td>
}

const panelStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--surface)',
  padding: '16px',
}

const registryGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.84rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
  fontWeight: 700,
}

const inlineFormStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
}

const textInputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 36,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--text)',
  padding: '6px 10px',
  fontSize: '0.95rem',
}

const selectStyle: React.CSSProperties = {
  ...textInputStyle,
  minWidth: 112,
}

const miniBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  minHeight: 36,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(240,165,0,0.35)',
  background: 'rgba(240,165,0,0.1)',
  color: '#fbbf24',
  cursor: 'pointer',
  flexShrink: 0,
}

const miniDangerStyle: React.CSSProperties = {
  ...miniBtnStyle,
  border: '1px solid rgba(248,113,113,0.35)',
  background: 'rgba(248,113,113,0.08)',
  color: '#f87171',
}

const chipStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 10px',
  background: 'rgba(255,255,255,0.03)',
}

const chipRemoveStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-dim)',
  cursor: 'pointer',
  fontSize: '1rem',
}

const groupEditRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(110px, auto) minmax(0, 1fr) auto',
  gap: 8,
  alignItems: 'center',
}

const groupIdStyle: React.CSSProperties = {
  fontSize: '0.84rem',
  color: 'var(--text-dim)',
  fontFamily: 'monospace',
}

const infoBox: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text-dim)',
}

const warningBox: React.CSSProperties = {
  ...infoBox,
  border: '1px solid rgba(251,191,36,0.34)',
  background: 'rgba(240,165,0,0.08)',
  color: '#fcd34d',
}

const errorBox: React.CSSProperties = {
  ...infoBox,
  border: '1px solid rgba(248,113,113,0.34)',
  background: 'rgba(248,113,113,0.08)',
  color: '#f87171',
}

const tableWrapStyle: React.CSSProperties = {
  overflowX: 'auto',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--surface)',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 840,
}

const headerCellStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: '0.84rem',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
  borderBottom: '1px solid var(--border)',
}

const dataCellStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  verticalAlign: 'middle',
}

const invalidRowStyle: React.CSSProperties = {
  background: 'rgba(248,113,113,0.05)',
}

const originBuiltInStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '2px 8px',
  borderRadius: 999,
  background: 'rgba(6,182,212,0.12)',
  color: '#22d3ee',
  fontSize: '0.82rem',
}

const originCustomStyle: React.CSSProperties = {
  ...originBuiltInStyle,
  background: 'rgba(240,165,0,0.12)',
  color: '#fbbf24',
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '9px 16px',
  minHeight: 40,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(74,222,128,0.35)',
  background: 'rgba(34,197,94,0.12)',
  color: '#4ade80',
  fontWeight: 600,
  cursor: 'pointer',
}

const disabledBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle,
  opacity: 0.5,
  cursor: 'not-allowed',
}
