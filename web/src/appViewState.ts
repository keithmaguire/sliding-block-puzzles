export type DocPageKey = 'how-to-play' | 'puzzle-format' | 'architecture'
export type View = 'title' | 'browser' | 'game' | 'doc-selector' | 'library-metadata' | DocPageKey | 'creator'

export function shouldKeepCreatorMounted(view: View, hasAuthoringSession: boolean): boolean {
  return hasAuthoringSession && view !== 'title'
}
