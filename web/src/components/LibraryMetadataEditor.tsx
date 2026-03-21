import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizePuzzleJSONInput, type CustomPuzzleRecord, type PuzzleIndex } from '../puzzleTypes'
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
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [rows, setRows] = useState<EditorRow[]>([])
  const [difficulties, setDifficulties] = useState<number[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [newDifficulty, setNewDifficulty] = useState('1')
  const [newGroupTitle, setNewGroupTitle] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setNotice(null)
      try {
        const index = await fetchJsonWithCache<PuzzleIndex>(`${BASE_URL}puzzles/index.json`)
        if (cancelled) return
        const custom = getCustomPuzzleRecords()
        const nextRows = buildRows(index, custom)
        const nextDifficulties = uniqueNumbers([
          ...index.registries.difficulties,
          ...nextRows.map((row) => row.difficulty),
        ])
        const nextGroups = buildGroups(index, custom, nextRows)
        setRows(nextRows)
        setDifficulties(nextDifficulties)
        setGroups(nextGroups)
        setHydrated(true)
      } catch (loadError) {
        if (!cancelled) {
          const custom = getCustomPuzzleRecords()
          const index = emptyIndex()
          setRows(buildRows(index, custom))
          setDifficulties(index.registries.difficulties)
          setGroups(buildGroups(index, custom, []))
          setNotice(loadError instanceof Error ? `${loadError.message}. Started with an empty built-in index.` : 'Started with an empty built-in index.')
          setHydrated(true)
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
    () => findInvalidRows(rows, difficulties, groups),
    [rows, difficulties, groups],
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

  function removeRow(id: string, origin: RowOrigin) {
    setRows((current) => current.filter((row) => !(row.id === id && row.origin === origin)))
  }

  function openImportDialog() {
    importInputRef.current?.click()
  }

  async function handleImportFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const nextDifficulties = difficulties.length > 0 ? difficulties : [1]
    const nextGroups = groups.length > 0 ? groups : [{ id: 'imported', title: 'Imported' }]
    const importedRows: EditorRow[] = []

    for (const file of Array.from(files)) {
      const parsed = JSON.parse(await file.text()) as unknown
      const puzzle = normalizePuzzleJSONInput(parsed)
      importedRows.push(buildImportedRow(puzzle, file.name, nextDifficulties, nextGroups))
    }

    setDifficulties(nextDifficulties)
    setGroups(nextGroups)
    setRows((current) => {
      const remaining = current.filter((row) => row.origin !== 'built-in' || !importedRows.some((candidate) => candidate.id === row.id))
      return [...remaining, ...importedRows].sort((a, b) => (
        a.origin === b.origin
          ? a.id.localeCompare(b.id)
          : a.origin.localeCompare(b.origin)
      ))
    })
    setError(null)
    setNotice(`Imported ${importedRows.length} built-in puzzle row${importedRows.length === 1 ? '' : 's'} from JSON.`)
  }

  function exportIndex() {
    if (!canExport) return
    const index = buildExportIndex(rows, difficulties, groups)

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
          Edit built-in and custom puzzle metadata together. Import puzzle JSON files here to add or
          refresh built-in index rows. Export writes only the built-in replacement <code>index.json</code>.
        </p>

        {loading && <div style={infoBox}>Loading library metadata…</div>}
        {error && <div style={errorBox}>{error}</div>}
        {notice && <div style={infoBox}>{notice}</div>}

        {!loading && (
          <>
            <RegistryPanel
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
                every row uses an allowed difficulty, allowed group, and non-empty title.
              </div>
            )}

            <RowGrid
              title="Built-in Puzzles"
              subtitle="These rows are exported into index.json."
              rows={rows.filter((row) => row.origin === 'built-in')}
              invalidRows={invalidRows}
              groups={groups}
              difficulties={difficulties}
              onUpdateRow={updateRow}
              onRemoveRow={removeRow}
            />

            <RowGrid
              title="Custom Puzzles"
              subtitle="These rows stay in browser-local storage and are not exported."
              rows={rows.filter((row) => row.origin === 'custom')}
              invalidRows={invalidRows}
              groups={groups}
              difficulties={difficulties}
              onUpdateRow={updateRow}
            />

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={openImportDialog} style={miniBtnStyle}>
                Import puzzle JSON
              </button>
              <button onClick={exportIndex} disabled={!canExport} style={canExport ? primaryBtnStyle : disabledBtnStyle}>
                Export updated index
              </button>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                Built-in rows exported: {rows.filter((row) => row.origin === 'built-in').length}
              </span>
            </div>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              multiple
              style={{ display: 'none' }}
              onChange={(event) => {
                const files = event.target.files
                event.target.value = ''
                void handleImportFiles(files).catch((importError) => {
                  setError(importError instanceof Error ? importError.message : 'Failed to import puzzle JSON')
                })
              }}
            />
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

function emptyIndex(): PuzzleIndex {
  return {
    version: 3,
    registries: {
      difficulties: [1],
      groups: [],
    },
    puzzles: [],
  }
}

function buildImportedRow(
  puzzle: { id: string; min_moves?: number },
  fileName: string,
  difficulties: number[],
  groups: GroupOption[],
): EditorRow {
  const difficulty = difficulties[0] ?? 1
  const groupId = groups[0]?.id ?? 'imported'
  return {
    origin: 'built-in',
    id: puzzle.id,
    file: fileName,
    title: humanizePuzzleId(puzzle.id),
    source: '',
    difficulty,
    groupId,
    minMoves: puzzle.min_moves,
  }
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

export function findInvalidRows(
  rows: EditorRow[],
  difficulties: number[],
  groups: GroupOption[],
): EditorRow[] {
  return rows.filter((row) => (
    !difficulties.includes(row.difficulty) ||
    !groups.some((group) => group.id === row.groupId) ||
    row.title.trim() === ''
  ))
}

export function buildExportIndex(
  rows: EditorRow[],
  difficulties: number[],
  groups: GroupOption[],
): PuzzleIndex {
  const builtInRows = rows.filter((row) => row.origin === 'built-in')
  const usedGroupIds = new Set(builtInRows.map((row) => row.groupId))
  const exportGroups = groups.filter((group) => group.id !== CUSTOM_GROUP_ID || usedGroupIds.has(group.id))
  return {
    version: 3,
    registries: {
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

function RowGrid(props: {
  title: string
  subtitle: string
  rows: EditorRow[]
  invalidRows: EditorRow[]
  groups: GroupOption[]
  difficulties: number[]
  onUpdateRow: (id: string, origin: RowOrigin, patch: Partial<EditorRow>) => void
  onRemoveRow?: (id: string, origin: RowOrigin) => void
}) {
  return (
    <div style={tableSectionStyle}>
      <div style={tableSectionHeaderStyle}>
        <div style={tableSectionTitleStyle}>{props.title}</div>
        <div style={tableSectionSubtitleStyle}>{props.subtitle}</div>
      </div>
      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <HeaderCell>File</HeaderCell>
              <HeaderCell>Title</HeaderCell>
              <HeaderCell>Source</HeaderCell>
              <HeaderCell>Difficulty</HeaderCell>
              <HeaderCell>Group</HeaderCell>
              <HeaderCell>Min</HeaderCell>
              <HeaderCell>Action</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row) => {
              const rowInvalid = props.invalidRows.some((candidate) => candidate.id === row.id && candidate.origin === row.origin)
              return (
                <tr key={`${row.origin}:${row.id}`} style={rowInvalid ? invalidRowStyle : undefined}>
                  <DataCell>{row.file || 'local'}</DataCell>
                  <DataCell>
                    <input value={row.title} onChange={(event) => props.onUpdateRow(row.id, row.origin, { title: event.target.value })} style={gridInputStyle} />
                  </DataCell>
                  <DataCell>
                    <input value={row.source} onChange={(event) => props.onUpdateRow(row.id, row.origin, { source: event.target.value })} style={gridInputStyle} />
                  </DataCell>
                  <DataCell>
                    <select
                      value={String(row.difficulty)}
                      onChange={(event) => props.onUpdateRow(row.id, row.origin, { difficulty: Number(event.target.value) })}
                      style={gridSelectStyle}
                    >
                      {props.difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
                    </select>
                  </DataCell>
                  <DataCell>
                    <select value={row.groupId} onChange={(event) => props.onUpdateRow(row.id, row.origin, { groupId: event.target.value })} style={gridSelectStyle}>
                      {props.groups.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}
                    </select>
                  </DataCell>
                  <DataCell>{row.minMoves ?? '—'}</DataCell>
                  <DataCell>
                    {row.origin === 'built-in' && props.onRemoveRow ? (
                      <button onClick={() => props.onRemoveRow?.(row.id, row.origin)} style={miniDangerStyle}>Remove</button>
                    ) : (
                      '—'
                    )}
                  </DataCell>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function humanizePuzzleId(id: string): string {
  return id
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

function RegistryPanel(props: {
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
  padding: '12px',
}

const registryGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
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
  minHeight: 32,
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--text)',
  padding: '5px 8px',
  fontSize: '0.87rem',
}

const miniBtnStyle: React.CSSProperties = {
  padding: '5px 10px',
  minHeight: 32,
  borderRadius: 6,
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
  borderRadius: 8,
  background: 'var(--surface)',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 760,
}

const headerCellStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '7px 8px',
  fontSize: '0.72rem',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
  borderBottom: '1px solid var(--border)',
}

const dataCellStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  verticalAlign: 'middle',
  fontSize: '0.82rem',
}

const invalidRowStyle: React.CSSProperties = {
  background: 'rgba(248,113,113,0.05)',
}

const tableSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const tableSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const tableSectionTitleStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-dim)',
}

const tableSectionSubtitleStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--text-dim)',
}

const gridInputStyle: React.CSSProperties = {
  ...textInputStyle,
  minHeight: 28,
  padding: '4px 6px',
  fontSize: '0.82rem',
  borderRadius: 4,
}

const gridSelectStyle: React.CSSProperties = {
  ...gridInputStyle,
  minWidth: 92,
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
