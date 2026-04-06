const DIFFICULTY_COLORS = {
  1: '#22c55e',
  2: '#f59e0b',
  3: '#ef4444',
  4: '#a855f7',
} as const

export function difficultyColor(diff: number): string {
  if (diff <= 1) return DIFFICULTY_COLORS[1]
  if (diff === 2) return DIFFICULTY_COLORS[2]
  if (diff === 3) return DIFFICULTY_COLORS[3]
  return DIFFICULTY_COLORS[4]
}
