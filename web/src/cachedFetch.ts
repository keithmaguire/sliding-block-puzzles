const RESOURCE_CACHE = 'sliding-puzzle-resource-cache-v1'

function hasCacheStorage(): boolean {
  return typeof globalThis !== 'undefined' && 'caches' in globalThis
}

async function openResourceCache(): Promise<Cache | null> {
  if (!hasCacheStorage()) return null
  return globalThis.caches.open(RESOURCE_CACHE)
}

export async function fetchWithCache(url: string): Promise<Response> {
  const cache = await openResourceCache()

  try {
    const response = await fetch(url)
    if (cache && response.ok) {
      await cache.put(url, response.clone())
    }
    return response
  } catch (error) {
    if (cache) {
      const cached = await cache.match(url)
      if (cached) return cached
    }
    throw error
  }
}

export async function fetchJsonWithCache<T>(url: string): Promise<T> {
  const response = await fetchWithCache(url)
  if (!response.ok) {
    throw new Error(`${url}: ${response.status}`)
  }
  return response.json() as Promise<T>
}
