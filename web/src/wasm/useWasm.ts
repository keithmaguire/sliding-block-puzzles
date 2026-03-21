import { useEffect, useRef, useState } from 'react'
import type { Direction, PuzzleApi, WasmResponse } from './types'
import { fetchWithCache } from '../cachedFetch'

interface GoRuntimeInstance {
  importObject: WebAssembly.Imports
  run(instance: WebAssembly.Instance): Promise<void>
}

interface GoRuntimeConstructor {
  new (): GoRuntimeInstance
}

type WasmStatus = 'loading' | 'ready' | 'error'

interface UseWasmResult {
  status: WasmStatus
  error: string | null
  api: PuzzleApi | null
}

let wasmExecLoadPromise: Promise<void> | null = null

function parseResponse(raw: unknown): WasmResponse {
  return raw as WasmResponse
}

function makeApi(): PuzzleApi {
  const g = globalThis as unknown as Record<string, (...args: unknown[]) => string>
  return {
    loadPuzzle: (jsonStr) => parseResponse(JSON.parse(g.loadPuzzle(jsonStr))),
    restoreState: (blocks, moveCount) =>
      parseResponse(JSON.parse(g.restoreState(JSON.stringify(blocks), moveCount))),
    tryMove: (blockId, dir: Direction) =>
      parseResponse(JSON.parse(g.tryMove(blockId, dir))),
    undo: () => parseResponse(JSON.parse(g.undo())),
    reset: () => parseResponse(JSON.parse(g.reset())),
    getState: () => parseResponse(JSON.parse(g.getState())),
  }
}

function ensureWasmExecLoaded(scriptPath: string): Promise<void> {
  const existing = (globalThis as unknown as { Go?: GoRuntimeConstructor }).Go
  if (existing) return Promise.resolve()
  if (wasmExecLoadPromise) return wasmExecLoadPromise

  wasmExecLoadPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('document is unavailable while loading wasm_exec.js'))
      return
    }

    const script = document.createElement('script')
    script.src = scriptPath
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`failed to load ${scriptPath}`))
    document.head.appendChild(script)
  })

  return wasmExecLoadPromise
}

export function useWasm(wasmPath = `${import.meta.env.BASE_URL}sliding-puzzle.wasm`): UseWasmResult {
  const [status, setStatus] = useState<WasmStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const apiRef = useRef<PuzzleApi | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        await ensureWasmExecLoaded(`${import.meta.env.BASE_URL}wasm_exec.js`)
        const GoRuntime = (globalThis as unknown as { Go?: GoRuntimeConstructor }).Go
        if (!GoRuntime) throw new Error('wasm_exec.js not loaded')

        const go = new GoRuntime()
        const wasmResponse = await fetchWithCache(wasmPath)
        const result = await WebAssembly.instantiateStreaming(
          wasmResponse,
          go.importObject,
        )
        // run() keeps the Go event loop alive — do not await.
        go.run(result.instance)

        // Go registers globals synchronously during init, so they're
        // available immediately after run() is called.
        if (!cancelled) {
          apiRef.current = makeApi()
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
          setStatus('error')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [wasmPath])

  return { status, error, api: status === 'ready' ? apiRef.current : null }
}
