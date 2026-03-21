## Why

The current drag interaction allows chaining multiple moves within a single drag gesture — after each half-cell commit the drag continues and can commit another move, and so on until pointer-up. This makes the controls feel imprecise and hard to count, obscures the move counter, and makes it easy to over-shoot by accident. Limiting each drag gesture to exactly one move makes the interaction deliberate and legible.

## What Changes

- **`useGameControls.ts`**: After a move commits during a drag, end the gesture immediately (call `releasePointerCapture` and stop tracking). The player must start a new drag to make the next move.
- **`HowToPlay.tsx`**: Remove the sentence describing chained moves; update the drag section to reflect single-step behaviour.

## Capabilities

### Modified Capabilities

- `drag-to-move`: A drag gesture now commits at most one move. Continued dragging past the commit threshold does not chain additional moves.

## Non-goals

- Keyboard navigation (arrow keys) is unaffected — it already moves one step per keypress.
- The 0.5-cell commit threshold and snap-back behaviour are unchanged.
