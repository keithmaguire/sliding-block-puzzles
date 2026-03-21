//go:build js && wasm

package main

import (
	"encoding/json"
	"syscall/js"

	"github.com/keithmaguire/sliding-puzzle/core"
)

// gs is the single active game state. The WASM module is single-instance.
var gs *core.GameState

// --- JSON envelope types ---

type wasmCell struct {
	Col int `json:"col"`
	Row int `json:"row"`
}

type wasmBlock struct {
	Cells []wasmCell `json:"cells"`
}

type wasmResponse struct {
	OK        bool                 `json:"ok"`
	Error     string               `json:"error,omitempty"`
	Blocks    map[string]wasmBlock `json:"blocks,omitempty"`
	MoveCount int                  `json:"moveCount,omitempty"`
	Won       bool                 `json:"won,omitempty"`
}

func responseOK(snap core.StateSnapshot) string {
	r := wasmResponse{
		OK:        true,
		MoveCount: snap.MoveCount,
		Won:       snap.Won,
		Blocks:    make(map[string]wasmBlock, len(snap.Blocks)),
	}
	for id, cells := range snap.Blocks {
		wc := make([]wasmCell, len(cells))
		for i, c := range cells {
			wc[i] = wasmCell{Col: c.Col, Row: c.Row}
		}
		r.Blocks[id] = wasmBlock{Cells: wc}
	}
	b, _ := json.Marshal(r)
	return string(b)
}

func responseErr(msg string) string {
	b, _ := json.Marshal(wasmResponse{OK: false, Error: msg})
	return string(b)
}

// --- Exported JS functions ---

// loadPuzzle(jsonStr) => envelope JSON
func jsLoadPuzzle(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return responseErr("loadPuzzle requires one argument")
	}
	result, err := core.LoadPuzzle([]byte(args[0].String()))
	if err != nil {
		return responseErr(err.Error())
	}
	gs = result.State
	return responseOK(gs.GetState())
}

// restoreState(blocksJson, moveCount) => envelope JSON
func jsRestoreState(_ js.Value, args []js.Value) any {
	if gs == nil {
		return responseErr("no puzzle loaded")
	}
	if len(args) < 2 {
		return responseErr("restoreState requires blocks JSON and move count")
	}

	var payload map[string][]wasmCell
	if err := json.Unmarshal([]byte(args[0].String()), &payload); err != nil {
		return responseErr("invalid restoreState blocks payload")
	}

	blocks := make(map[string][]core.Cell, len(payload))
	for id, cells := range payload {
		restored := make([]core.Cell, len(cells))
		for i, c := range cells {
			restored[i] = core.Cell{Col: c.Col, Row: c.Row}
		}
		blocks[id] = restored
	}

	if err := gs.RestoreState(blocks, args[1].Int()); err != nil {
		return responseErr(err.Error())
	}
	return responseOK(gs.GetState())
}

// tryMove(blockID, direction) => envelope JSON
func jsTryMove(_ js.Value, args []js.Value) any {
	if gs == nil {
		return responseErr("no puzzle loaded")
	}
	if len(args) < 2 {
		return responseErr("tryMove requires blockID and direction")
	}
	dir, err := core.ParseDirection(args[1].String())
	if err != nil {
		return responseErr(err.Error())
	}
	if !gs.TryMove(args[0].String(), dir) {
		return responseErr("move not allowed")
	}
	return responseOK(gs.GetState())
}

// undo() => envelope JSON
func jsUndo(_ js.Value, _ []js.Value) any {
	if gs == nil {
		return responseErr("no puzzle loaded")
	}
	if !gs.Undo() {
		return responseErr("no moves to undo")
	}
	return responseOK(gs.GetState())
}

// reset() => envelope JSON
func jsReset(_ js.Value, _ []js.Value) any {
	if gs == nil {
		return responseErr("no puzzle loaded")
	}
	gs.Reset()
	return responseOK(gs.GetState())
}

// getState() => envelope JSON
func jsGetState(_ js.Value, _ []js.Value) any {
	if gs == nil {
		return responseErr("no puzzle loaded")
	}
	return responseOK(gs.GetState())
}

// checkWin() => boolean
func jsCheckWin(_ js.Value, _ []js.Value) any {
	if gs == nil {
		return false
	}
	return gs.CheckWin()
}

// getMoveCount() => number
func jsGetMoveCount(_ js.Value, _ []js.Value) any {
	if gs == nil {
		return 0
	}
	return gs.GetMoveCount()
}

func main() {
	g := js.Global()
	g.Set("loadPuzzle", js.FuncOf(jsLoadPuzzle))
	g.Set("restoreState", js.FuncOf(jsRestoreState))
	g.Set("tryMove", js.FuncOf(jsTryMove))
	g.Set("undo", js.FuncOf(jsUndo))
	g.Set("reset", js.FuncOf(jsReset))
	g.Set("getState", js.FuncOf(jsGetState))
	g.Set("checkWin", js.FuncOf(jsCheckWin))
	g.Set("getMoveCount", js.FuncOf(jsGetMoveCount))

	// Keep the Go runtime alive until the page closes.
	select {}
}
