const DIFFICULTY_COLORS = {
  1: 'var(--success)',
  2: 'var(--text)',
  3: 'var(--danger)',
  4: 'var(--accent-text)',
  5: 'var(--accent)',
} as const

export function difficultyColor(diff: number): string {
  if (diff <= 1) return DIFFICULTY_COLORS[1]
  if (diff === 2) return DIFFICULTY_COLORS[2]
  if (diff === 3) return DIFFICULTY_COLORS[3]
  if (diff === 4) return DIFFICULTY_COLORS[4]
  return DIFFICULTY_COLORS[5]
}
