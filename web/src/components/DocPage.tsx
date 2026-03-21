import { prose } from './docPageStyles'

interface DocPageProps {
  title: string
  onBack: () => void
  children: React.ReactNode
}

export function DocPage({ title, onBack, children }: DocPageProps) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 clamp(14px, 4vw, 24px) 72px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 'clamp(16px, 4vw, 24px) 0 14px' }}>
        <button onClick={onBack} style={backBtn}>← Back</button>
        <h1 style={headingStyle}>{title}</h1>
      </div>
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 28 }} />
      <div style={prose}>{children}</div>
    </div>
  )
}

const backBtn: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(240,165,0,0.28)',
  background: 'rgba(240,165,0,0.07)',
  color: '#fcd34d',
  cursor: 'pointer',
  fontSize: '1rem',
  flexShrink: 0,
  minHeight: 36,
}

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(1.3rem, 3.2vw, 1.5rem)',
  fontWeight: 700,
  background: 'linear-gradient(120deg, #f0a500 0%, #fbbf24 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}
