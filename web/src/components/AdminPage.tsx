import { DocPage } from './DocPage'

interface Props {
  onBack: () => void
  onCreate: () => void
  onEditLibraryMetadata: () => void
}

export function AdminPage({ onBack, onCreate, onEditLibraryMetadata }: Props) {
  return (
    <DocPage title="Admin" onBack={onBack}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={subtitleStyle}>Create puzzles and edit library metadata</p>
        <div style={infoPanelStyle}>
          <p style={infoParagraphStyle}>
            Built-in puzzle maintenance happens entirely through exported files and the app’s
            metadata editor. There is no command-line index generator in the supported workflow.
          </p>
          <ol style={infoListStyle}>
            <li>Create or edit a puzzle in <strong>Create new puzzle</strong>, then export its JSON file.</li>
            <li>Add that exported file to the repo <code>puzzles/</code> directory outside the app.</li>
            <li>Open <strong>Edit library metadata</strong> and use <strong>Import puzzle JSON</strong> to add or refresh built-in index rows.</li>
            <li>Update titles, sources, difficulties, and groups in the table and registry lists.</li>
            <li>Use <strong>Export updated index</strong> and replace <code>puzzles/index.json</code> in the repo.</li>
          </ol>
        </div>
        <AdminCard
          title="Create new puzzle"
          description="Open the visual authoring workflow for a new or resumed draft."
          icon="✏️"
          color="#fbbf24"
          bg="rgba(240,165,0,0.08)"
          onClick={onCreate}
        />
        <AdminCard
          title="Edit library metadata"
          description="Open the spreadsheet-style metadata editor for titles, sources, difficulties, groups, and index export."
          icon="🗂️"
          color="#4ade80"
          bg="rgba(34,197,94,0.08)"
          onClick={onEditLibraryMetadata}
        />
      </div>
    </DocPage>
  )
}

function AdminCard({
  title, description, icon, color, bg, onClick,
}: {
  title: string
  description: string
  icon: string
  color: string
  bg: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: 'clamp(14px, 3vw, 18px)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${color}28`,
        borderLeft: `3px solid ${color}`,
        background: 'var(--surface)',
        color: 'inherit',
        width: '100%',
        minHeight: 64,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        cursor: 'pointer',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = bg
        event.currentTarget.style.borderColor = `${color}55`
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'var(--surface)'
        event.currentTarget.style.borderColor = `${color}28`
      }}
    >
      <span style={{ fontSize: 'clamp(1.5rem, 4vw, 1.75rem)', lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 'clamp(1.04rem, 2.5vw, 1.12rem)' }}>{title}</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 'clamp(0.94rem, 2vw, 1rem)', lineHeight: 1.6 }}>{description}</div>
      </div>
    </button>
  )
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--text-dim)',
  lineHeight: 1.6,
}

const infoPanelStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.03)',
}

const infoParagraphStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--text-dim)',
  lineHeight: 1.6,
}

const infoListStyle: React.CSSProperties = {
  margin: '10px 0 0',
  paddingLeft: 20,
  color: 'var(--text-dim)',
  lineHeight: 1.7,
}
