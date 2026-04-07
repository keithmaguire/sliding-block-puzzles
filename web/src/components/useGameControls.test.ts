import { describe, expect, it } from 'vitest'

function shouldClearDrag(activePointerId: number | null, pointerId: number): boolean {
  return activePointerId !== null && activePointerId === pointerId
}

describe('shouldClearDrag', () => {
  it('clears drag state when pointer ids match', () => {
    expect(shouldClearDrag(7, 7)).toBe(true)
  })

  it('does not clear drag state for a different pointer id', () => {
    expect(shouldClearDrag(7, 8)).toBe(false)
  })

  it('does not clear drag state when no drag is active', () => {
    expect(shouldClearDrag(null, 8)).toBe(false)
  })
})
