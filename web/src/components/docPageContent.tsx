export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      background: 'rgba(255,255,255,0.07)',
      borderRadius: 4,
      padding: '1px 5px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.9em',
      border: '1px solid var(--border)',
      color: 'var(--accent-text)',
    }}>
      {children}
    </code>
  )
}

export function Pre({ children }: { children: string }) {
  return (
    <pre style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: 'var(--radius-md)',
      borderLeft: '3px solid var(--accent-border)',
      padding: '14px 18px',
      overflowX: 'auto',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 'clamp(0.92rem, 2vw, 0.98rem)',
      lineHeight: 1.6,
      margin: '12px 0',
      color: 'var(--text-soft)',
    }}>
      <code>{children}</code>
    </pre>
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 'clamp(1.14rem, 2.7vw, 1.24rem)',
      fontWeight: 700,
      marginTop: 36,
      marginBottom: 8,
      paddingBottom: 8,
      paddingLeft: 10,
      borderBottom: '1px solid var(--border)',
      borderLeft: '3px solid var(--accent)',
      color: 'var(--accent-text)',
    }}>
      {children}
    </h2>
  )
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: '1.08rem', fontWeight: 700, marginTop: 20, marginBottom: 6, color: 'var(--text)' }}>
      {children}
    </h3>
  )
}

interface FieldRow {
  name: string
  type: string
  required: boolean
  description: string
}

export function FieldTable({ rows }: { rows: FieldRow[] }) {
  const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '6px 12px',
    background: 'var(--surface)',
    fontWeight: 700,
    fontSize: '0.98rem',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-dim)',
  }
  const td: React.CSSProperties = { padding: '8px 12px', fontSize: '1rem', verticalAlign: 'top' }

  return (
    <div style={{ overflowX: 'auto', margin: '10px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <thead>
          <tr>
            <th style={th}>Field</th>
            <th style={th}>Type</th>
            <th style={th}>Required</th>
            <th style={th}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
              <td style={td}><Code>{row.name}</Code></td>
              <td style={{ ...td, color: 'var(--text-dim)' }}>{row.type}</td>
              <td style={{ ...td, color: 'var(--text-dim)' }}>{row.required ? 'yes' : 'no'}</td>
              <td style={td}>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
