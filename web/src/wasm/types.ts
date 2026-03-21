// Types matching the JSON envelope returned by every Go WASM export.

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface WasmCell {
  col: number
  row: number
}

export interface WasmBlock {
  cells: WasmCell[]
}

export type WasmRestoreBlocks = Record<string, WasmCell[]>

/** Successful response includes game state. */
export interface WasmOk {
  ok: true
  blocks: Record<string, WasmBlock>
  moveCount: number
  won: boolean
}

/** Error response from any WASM call. */
export interface WasmErr {
  ok: false
  error: string
}

export type WasmResponse = WasmOk | WasmErr

/** Typed wrappers around the raw globalThis functions set by Go WASM. */
export interface PuzzleApi {
  loadPuzzle(jsonStr: string): WasmResponse
  restoreState(blocks: WasmRestoreBlocks, moveCount: number): WasmResponse
  tryMove(blockId: string, dir: Direction): WasmResponse
  undo(): WasmResponse
  reset(): WasmResponse
  getState(): WasmResponse
}
