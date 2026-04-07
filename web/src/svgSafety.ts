const ALLOWED_TAGS = new Set([
  'circle',
  'ellipse',
  'g',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
])

const ALLOWED_ATTRIBUTES = new Set([
  'cx',
  'cy',
  'd',
  'fill',
  'fill-opacity',
  'height',
  'opacity',
  'points',
  'r',
  'rx',
  'ry',
  'stroke',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'stroke-width',
  'transform',
  'width',
  'x',
  'x1',
  'x2',
  'y',
  'y1',
  'y2',
])

const TAG_PATTERN = /<[^>]+>/g
const ATTRIBUTE_PATTERN = /([A-Za-z_:][\w:.-]*)\s*=\s*(["'])(.*?)\2/g
const UNSAFE_VALUE_PATTERN = /(?:javascript:|data:|url\s*\(|[<>])/i

function isSafeTag(rawTag: string): boolean {
  const tag = rawTag.trim()
  if (tag.startsWith('<!--') || tag.startsWith('<!') || tag.startsWith('<?')) return false

  const tagMatch = /^<\/?\s*([A-Za-z][\w:-]*)\b([\s\S]*?)\/?\s*>$/.exec(tag)
  if (!tagMatch) return false

  const tagName = tagMatch[1].toLowerCase()
  if (!ALLOWED_TAGS.has(tagName)) return false
  if (tag.startsWith('</')) return tag.slice(2).trim() === `${tagName}>`

  const attrText = tagMatch[2]
  let consumed = 0
  for (const match of attrText.matchAll(ATTRIBUTE_PATTERN)) {
    const before = attrText.slice(consumed, match.index)
    if (before.trim() !== '') return false

    const attrName = match[1].toLowerCase()
    const attrValue = match[3]
    if (!ALLOWED_ATTRIBUTES.has(attrName)) return false
    if (attrName.startsWith('on') || attrName === 'href' || attrName === 'xlink:href' || attrName === 'style') return false
    if (UNSAFE_VALUE_PATTERN.test(attrValue)) return false

    consumed = (match.index ?? 0) + match[0].length
  }

  const trailing = attrText.slice(consumed).replace(/\/$/, '')
  return trailing.trim() === ''
}

export function sanitizeSvgFragment(fragment: string): string | null {
  const trimmed = fragment.trim()
  if (trimmed === '') return null

  let consumed = 0
  let sawTag = false
  for (const match of trimmed.matchAll(TAG_PATTERN)) {
    const textBetweenTags = trimmed.slice(consumed, match.index)
    if (textBetweenTags.trim() !== '') return null
    if (!isSafeTag(match[0])) return null
    sawTag = true
    consumed = (match.index ?? 0) + match[0].length
  }

  if (!sawTag || trimmed.slice(consumed).trim() !== '') return null
  return trimmed
}
