import { beforeEach, describe, expect, it, vi } from 'vitest'
import { appendDebugLog, clearDebugLog, getDebugLogEntries, getDebugLogText, isDebugEnabled, setDebugEnabled } from './debugLog'
import { clearLocalMemory } from './localMemory'

function makeStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length },
  } as Storage
}

let storage: Storage

beforeEach(() => {
  storage = makeStorage()
  vi.stubGlobal('localStorage', storage)
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-03-19T12:00:00.000Z'))
})

describe('debugLog', () => {
  it('starts disabled and ignores log appends until enabled', () => {
    expect(isDebugEnabled()).toBe(false)

    appendDebugLog('pointerdown', { pointerId: 1 })

    expect(getDebugLogEntries()).toEqual([])
  })

  it('stores entries once enabled', () => {
    setDebugEnabled(true)
    clearDebugLog()

    appendDebugLog('pointerdown', { pointerId: 1, blockId: 'A' })

    expect(getDebugLogText()).toContain('pointerdown')
    expect(getDebugLogText()).toContain('"blockId":"A"')
  })

  it('clearLocalMemory removes debug settings and stored logs', () => {
    setDebugEnabled(true)
    appendDebugLog('game.reset', { moveCount: 0 })

    clearLocalMemory()

    expect(isDebugEnabled()).toBe(false)
    expect(getDebugLogEntries()).toEqual([])
  })
})
