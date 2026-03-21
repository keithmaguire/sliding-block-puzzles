import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchJsonWithCache, fetchWithCache } from './cachedFetch'

interface MemoryCache {
  store: Map<string, Response>
  match: (key: string) => Promise<Response | undefined>
  put: (key: string, value: Response) => Promise<void>
}

function makeMemoryCache(): MemoryCache {
  const store = new Map<string, Response>()
  return {
    store,
    match: async (key: string) => store.get(key),
    put: async (key: string, value: Response) => {
      store.set(key, value)
    },
  }
}

describe('cachedFetch', () => {
  const cache = makeMemoryCache()

  beforeEach(() => {
    cache.store.clear()
    vi.stubGlobal('caches', {
      open: vi.fn(async () => cache),
    })
  })

  it('stores successful network responses in Cache Storage', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":true}', { status: 200 })))

    const response = await fetchWithCache('/puzzles/index.json')

    expect(response.ok).toBe(true)
    expect(await cache.match('/puzzles/index.json')).toBeTruthy()
  })

  it('falls back to a cached response when the network fails', async () => {
    await cache.put('/puzzles/a.json', new Response('{"id":"cached"}', { status: 200 }))
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('NetworkError')
    }))

    const data = await fetchJsonWithCache<{ id: string }>('/puzzles/a.json')

    expect(data).toEqual({ id: 'cached' })
  })

  it('rethrows the network error when nothing is cached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('NetworkError')
    }))

    await expect(fetchWithCache('/puzzles/missing.json')).rejects.toThrow(/NetworkError/)
  })
})
