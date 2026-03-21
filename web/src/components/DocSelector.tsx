import { useState } from 'react'
import { DocPage } from './DocPage'

type DocPageKey = 'how-to-play' | 'puzzle-format' | 'architecture'

interface Props {
  onSelect: (page: DocPageKey) => void
  onBack: () => void
  onAdmin?: () => void
}

const pages: { key: DocPageKey; title: string; description: string; icon: string; color: string; bg: string }[] = [
  {
    key: 'how-to-play',
    title: 'How to Play',
    description: 'Block selection, drag and keyboard controls, HUD buttons, and the win screen.',
    icon: '🎮',
    color: '#22d3ee',
    bg: 'rgba(6,182,212,0.08)',
  },
  {
    key: 'puzzle-format',
    title: 'Puzzle Format Reference',
    description: 'JSON schema for puzzle files — board, blocks, appearance, selector-based wins, and index.json.',
    icon: '📐',
    color: '#a78bfa',
    bg: 'rgba(139,92,246,0.08)',
  },
  {
    key: 'architecture',
    title: 'App Architecture',
    description: 'Go WASM core, WASM export surface, React components, data flow, and build pipeline.',
    icon: '🏗️',
    color: '#fb923c',
    bg: 'rgba(249,115,22,0.08)',
  },
]

export function DocSelector({ onSelect, onBack, onAdmin }: Props) {
  return (
    <DocPage title="Settings & Documentation" onBack={onBack}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {onAdmin && (
          <>
            <SectionLabel>Admin</SectionLabel>
            <DocCard
              title="Admin"
              description="Create puzzles and edit library metadata."
              icon="🛠️"
              color="#fbbf24"
              bg="rgba(240,165,0,0.08)"
              onClick={onAdmin}
            />
            <SectionLabel>Admin Workflow</SectionLabel>
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
          </>
        )}
        <SectionLabel>Documentation</SectionLabel>
        {pages.map((p) => (
          <DocCard
            key={p.key}
            title={p.title}
            description={p.description}
            icon={p.icon}
            color={p.color}
            bg={p.bg}
            onClick={() => onSelect(p.key)}
          />
        ))}
      </div>
    </DocPage>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.82rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-dim)',
        marginTop: 2,
        marginBottom: 2,
      }}
    >
      {children}
    </div>
  )
}

function DocCard({
  title, description, icon, color, bg, onClick,
}: {
  title: string; description: string; icon: string; color: string; bg: string; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textAlign: 'left',
        padding: 'clamp(14px, 3vw, 18px)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${hovered ? color + '55' : color + '28'}`,
        borderLeft: `3px solid ${color}`,
        background: hovered ? bg : 'var(--surface)',
        color: 'inherit',
        width: '100%',
        minHeight: 64,
        transition: 'background 0.15s, border-color 0.15s',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 'clamp(1.5rem, 4vw, 1.75rem)', lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, marginBottom: 6, color: hovered ? color : 'var(--text)', fontSize: 'clamp(1.04rem, 2.5vw, 1.12rem)' }}>{title}</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 'clamp(0.94rem, 2vw, 1rem)', lineHeight: 1.6 }}>{description}</div>
      </div>
    </button>
  )
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
