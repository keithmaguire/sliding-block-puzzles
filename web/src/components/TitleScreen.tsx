import { useState } from 'react'

interface Props {
  onPlay: () => void
}

export function TitleScreen({ onPlay }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <div style={outerStyle}>
      <div style={innerStyle}>
        <PuzzleGraphic />

        <h1 style={titleStyle}>Sliding Block Puzzles</h1>

        <button
          onClick={onPlay}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{ ...playBtnStyle, ...(hovered ? playBtnHover : {}) }}
        >
          Play
        </button>
      </div>
    </div>
  )
}

/** A small decorative 3×3 grid of coloured blocks hinting at the puzzle. */
function PuzzleGraphic() {
  const SIZE = 44
  const GAP = 6

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(3, ${SIZE}px)`,
      gridTemplateRows: `repeat(3, ${SIZE}px)`,
      gap: GAP,
      marginBottom: 40,
    }}>
      {/* Row 0 */}
      <div style={{ ...blockStyle, gridColumn: '1 / 3', background: 'var(--fiery-terracotta)', boxShadow: '0 4px 16px rgba(242,84,45,0.24)' }} />
      <div style={{ ...blockStyle, background: 'var(--stormy-teal)', gridRow: '1 / 3', boxShadow: '0 4px 16px rgba(18,116,117,0.22)' }} />
      {/* Row 1 */}
      <div style={{ ...blockStyle, background: 'var(--dark-cyan)', gridRow: '2 / 4', boxShadow: '0 4px 16px rgba(14,149,148,0.22)' }} />
      <div style={{ ...blockStyle, background: 'var(--wheat)', boxShadow: '0 4px 16px rgba(245,223,187,0.18)' }} />
      {/* Row 2 */}
      <div style={{ ...blockStyle, background: 'var(--espresso)', gridColumn: '2 / 4', boxShadow: '0 4px 16px rgba(86,44,44,0.26)' }} />
    </div>
  )
}

const blockStyle: React.CSSProperties = {
  borderRadius: 9,
}

const outerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(32px, 8vw, 80px) 24px',
}

const innerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  maxWidth: 440,
  width: '100%',
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 44px',
  fontSize: 'clamp(1.9rem, 6vw, 2.8rem)',
  fontWeight: 700,
  letterSpacing: '-0.03em',
  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hi) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  lineHeight: 1.15,
}

const playBtnStyle: React.CSSProperties = {
  padding: '15px 64px',
  borderRadius: 12,
  border: '1px solid var(--accent-border)',
  background: 'linear-gradient(135deg, var(--accent-button-bg), rgba(242,84,45,0.16))',
  color: 'var(--accent-text)',
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: 'clamp(1.08rem, 2.5vw, 1.18rem)',
  letterSpacing: '0.04em',
  cursor: 'pointer',
  boxShadow: '0 4px 24px var(--accent-dim)',
  transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
}

const playBtnHover: React.CSSProperties = {
  transform: 'translateY(-2px)',
  background: 'linear-gradient(135deg, rgba(242,84,45,0.2), var(--accent-button-bg))',
  boxShadow: '0 8px 32px var(--accent-border)',
}
