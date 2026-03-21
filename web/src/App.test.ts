import { describe, expect, it } from 'vitest'
import { shouldKeepCreatorMounted } from './appViewState'

describe('shouldKeepCreatorMounted', () => {
  it('keeps the creator mounted while the creator view is active', () => {
    expect(shouldKeepCreatorMounted('creator', true)).toBe(true)
  })

  it('keeps the creator mounted during game when an authoring session exists', () => {
    expect(shouldKeepCreatorMounted('game', true)).toBe(true)
  })

  it('keeps the creator mounted in the browser while the draft persists', () => {
    expect(shouldKeepCreatorMounted('browser', true)).toBe(true)
  })

  it('keeps the creator mounted during docs while an authoring session exists', () => {
    expect(shouldKeepCreatorMounted('doc-selector', true)).toBe(true)
    expect(shouldKeepCreatorMounted('how-to-play', true)).toBe(true)
  })

  it('does not keep the creator mounted before any authoring session starts', () => {
    expect(shouldKeepCreatorMounted('browser', false)).toBe(false)
    expect(shouldKeepCreatorMounted('puzzle-format', false)).toBe(false)
  })
})
