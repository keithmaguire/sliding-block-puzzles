import { DEBUG_ENABLED_KEY, DEBUG_LOG_KEY } from './localMemory'

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
  localStorage.setItem(DEBUG_ENABLED_KEY, String(enabled))
}

function loadEntries(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) ?? '[]') as unknown
    return Array.isArray(raw) ? raw.filter((entry): entry is string => typeof entry === 'string') : []
  } catch {
    return []
  }
}

function saveEntries(entries: string[]) {
  localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(entries))
}

function formatDetails(details: unknown): string {
  if (details == null) return ''
  if (typeof details === 'string') return details
  try {
    return JSON.stringify(details)
  } catch {
    return String(details)
  }
}

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

  const entry = `[${new Date().toISOString()}] ${event}${details == null ? '' : ` ${formatDetails(details)}`}`
  const nextEntries = [...loadEntries(), entry].slice(-MAX_ENTRIES)
  saveEntries(nextEntries)
  notifyListeners()
}

export function subscribeDebugLog(listener: DebugListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
