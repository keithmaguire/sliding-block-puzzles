import { DEBUG_ENABLED_KEY, DEBUG_LOG_KEY, loadJsonFromStorage, saveJsonToStorage } from './localMemory'

const MAX_ENTRIES = 250

type DebugListener = () => void

const listeners = new Set<DebugListener>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function loadEnabled(): boolean {
  try {
    return localStorage.getItem(DEBUG_ENABLED_KEY) === 'true'
  } catch {
    return false
  }
}

function saveEnabled(enabled: boolean) {
  try {
    localStorage.setItem(DEBUG_ENABLED_KEY, String(enabled))
  } catch {
    // silently fail — debug state is non-critical
  }
}

function loadEntries(): string[] {
  const raw = loadJsonFromStorage<unknown>(DEBUG_LOG_KEY, [])
  return Array.isArray(raw) ? raw.filter((entry): entry is string => typeof entry === 'string') : []
}

const saveEntries = (entries: string[]) => saveJsonToStorage(DEBUG_LOG_KEY, entries)

export function isDebugEnabled(): boolean {
  return loadEnabled()
}

export function setDebugEnabled(enabled: boolean): void {
  saveEnabled(enabled)
  if (enabled) {
    appendDebugLog('debug.enabled')
  }
  notifyListeners()
}

export function getDebugLogEntries(): string[] {
  return loadEntries()
}

export function getDebugLogText(): string {
  return getDebugLogEntries().join('\n')
}

export function clearDebugLog(): void {
  saveEntries([])
  notifyListeners()
}

export function appendDebugLog(event: string, details?: unknown): void {
  if (!isDebugEnabled()) return

  let detailStr = ''
  if (details != null) {
    if (typeof details === 'string') detailStr = details
    else try { detailStr = JSON.stringify(details) } catch { detailStr = String(details) }
  }
  const entry = `[${new Date().toISOString()}] ${event}${detailStr ? ` ${detailStr}` : ''}`
  const nextEntries = [...loadEntries(), entry].slice(-MAX_ENTRIES)
  saveEntries(nextEntries)
  notifyListeners()
}

export function subscribeDebugLog(listener: DebugListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
