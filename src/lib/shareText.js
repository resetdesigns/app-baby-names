// Plain-text version of the shortlist, for sending to family.
export function buildShareText({ matches, lastName, finalPick }) {
  const full = (name) => (lastName ? `${name} ${lastName}` : name)
  const lines = ['Our baby boy name shortlist']
  if (finalPick) lines.push(`Final pick: ${full(finalPick.name)}`)
  lines.push('')
  for (const m of matches) {
    const stars = m.starredBy.length >= 2 ? '★★ ' : m.starredBy.length === 1 ? '★ ' : ''
    lines.push(`${stars}${full(m.name)}`)
  }
  if (matches.length === 0) lines.push('No matches yet.')
  lines.push('', '(★★ both of us starred it, ★ one of us did)')
  return lines.join('\n')
}

// Uses the phone's share sheet when there is one, otherwise copies to the clipboard.
// Returns 'shared', 'copied' or 'failed'.
export async function shareList(text) {
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'Baby name shortlist', text })
      return 'shared'
    }
  } catch (error) {
    if (error?.name === 'AbortError') return 'shared' // they closed the share sheet
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
