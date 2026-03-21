## Approach

In `useGameControls.ts`, the pointer-move handler currently resets the drag origin after each successful commit and continues tracking. The fix is to call `releasePointerCapture` immediately on the element after a successful move, which fires a `pointercancel` / ends capture and prevents further move events from being processed as part of the same gesture.

Alternatively, set a `moved` flag on the drag state and skip further commit checks once it is true.

The flag approach is simpler and avoids needing a reference to the DOM element in the handler:

```ts
// in drag state
let moved = false

// in pointermove handler, before commit check:
if (moved) return

// after successful commit:
moved = true
```

This is a 3-line change to `useGameControls.ts`.
