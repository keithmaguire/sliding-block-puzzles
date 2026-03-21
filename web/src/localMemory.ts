export const CUSTOM_PUZZLES_KEY = 'sliding-puzzle-custom'
export const PROGRESS_KEY = 'sliding-puzzle-progress'
export const HIDDEN_PUZZLES_KEY = 'sliding-puzzle-hidden'
export const PUZZLE_SESSIONS_KEY = 'sliding-puzzle-sessions'
export const DEBUG_ENABLED_KEY = 'sliding-puzzle-debug-enabled'
export const DEBUG_LOG_KEY = 'sliding-puzzle-debug-log'

export function clearLocalMemory(): void {
  localStorage.removeItem(CUSTOM_PUZZLES_KEY)
  localStorage.removeItem(PROGRESS_KEY)
  localStorage.removeItem(HIDDEN_PUZZLES_KEY)
  localStorage.removeItem(PUZZLE_SESSIONS_KEY)
  localStorage.removeItem(DEBUG_ENABLED_KEY)
  localStorage.removeItem(DEBUG_LOG_KEY)
}
