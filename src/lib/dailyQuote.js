import QUOTES from '../data/quotes'

const PREFIX = 'baby-names:quote:'

// Today's date on this device, like 2026-11-06. The quote changes at local midnight.
export function todayKey(now = new Date()) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// The same quote all day, and the same one on both phones.
export function quoteForDay(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number)
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000)
  return QUOTES[dayNumber % QUOTES.length]
}

const storageKey = (room, userKey) => `${PREFIX}${room}:${userKey}`

export function quoteDue(room, userKey, dayKey = todayKey()) {
  try {
    return localStorage.getItem(storageKey(room, userKey)) !== dayKey
  } catch {
    return false // If storage is blocked, never nag.
  }
}

export function markQuoteSeen(room, userKey, dayKey = todayKey()) {
  try {
    localStorage.setItem(storageKey(room, userKey), dayKey)
  } catch {
    // Fine: it just shows again next time.
  }
}
