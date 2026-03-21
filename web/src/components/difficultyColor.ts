export function difficultyColor(diff: number): string {
  if (diff <= 1) return '#22c55e'
  if (diff === 2) return '#f59e0b'
  if (diff === 3) return '#ef4444'
  return '#a855f7'
}
