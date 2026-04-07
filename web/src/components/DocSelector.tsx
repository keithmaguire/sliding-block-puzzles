import { useState } from 'react'
import { DocPage } from './DocPage'

type DocPageKey = 'how-to-play' | 'puzzle-format' | 'architecture'

interface Props {
  onSelect: (page: DocPageKey) => void
  onBack: () => void
  onAdmin?: () => void
}

const CATEGORY_COLORS = {
  howToPlay: {
    bg: 'var(--accent-button-bg)',
  },
  puzzleFormat: {
    bg: 'var(--accent-button-bg)',
  },
  architecture: {
    bg: 'var(--accent-button-bg)',
  },
  admin: {
    bg: 'var(--accent-button-bg)',
  },
} as const

const pages: { key: DocPageKey; title: string; description: string; icon: string; bg: string }[] = [
  {
    key: 'how-to-play',
    title: 'How to Play',
    description: 'Block selection, drag and keyboard controls, HUD buttons, and the win screen.',
    icon: '🎮',
    ...CATEGORY_COLORS.howToPlay,
  },
  {
    key: 'puzzle-format',
    title: 'Puzzle Format Reference',
    description: 'JSON schema for puzzle files — board, blocks, appearance, selector-based wins, and index.json.',
    icon: '📐',
    ...CATEGORY_COLORS.puzzleFormat,
  },
  {
    key: 'architecture',
    title: 'App Architecture',
    description: 'Go WASM core, WASM export surface, React components, data flow, and build pipeline.',
    icon: '🏗️',
    ...CATEGORY_COLORS.architecture,
  },
]

export function DocSelector({ onSelect, onBack, onAdmin }: Props) {
  return (
    <DocPage title="Settings & Documentation" onBack={onBack}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionLabel>Documentation</SectionLabel>
        {pages.map((p) => (
          <DocCard
            key={p.key}
            title={p.title}
            description={p.description}
            icon={p.icon}
            bg={p.bg}
            onClick={() => onSelect(p.key)}
          />
        ))}
        {onAdmin && (
          <DocCard
            title="Admin"
            description="Create puzzles and edit library metadata."
            icon="🛠️"
            bg={CATEGORY_COLORS.admin.bg}
            onClick={onAdmin}
          />
        )}
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
  title, description, icon, bg, onClick,
}: {
  title: string; description: string; icon: string; bg: string; onClick: () => void
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
        border: hovered ? '1px solid var(--accent-border)' : '1px solid var(--border)',
        borderLeft: '3px solid var(--accent-border)',
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
        <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)', fontSize: 'clamp(1.04rem, 2.5vw, 1.12rem)' }}>{title}</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 'clamp(0.94rem, 2vw, 1rem)', lineHeight: 1.6 }}>{description}</div>
      </div>
    </button>
  )
}
