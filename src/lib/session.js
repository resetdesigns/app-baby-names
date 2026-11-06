// Remembers the room code and your name on this device.
// localStorage can be unavailable (private mode, blocked data), so every call is guarded.

const SESSION_KEY = 'babyNames.session'
const seenKey = (room) => `babyNames.seen.${room}`

export function normalizeRoom(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
}

export function userKeyFor(name) {
  return name.trim().toLowerCase().replace(/[/\s]+/g, '-')
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { room, user } = JSON.parse(raw)
    if (room && user) return { room, user }
  } catch {
    // ignore
  }
  return null
}

export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // ignore
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

// Matches this person has already been shown the celebration for.
export function loadSeenMatches(room) {
  try {
    const raw = localStorage.getItem(seenKey(room))
    if (raw) return new Set(JSON.parse(raw))
  } catch {
    // ignore
  }
  return new Set()
}

export function saveSeenMatches(room, set) {
  try {
    localStorage.setItem(seenKey(room), JSON.stringify([...set]))
  } catch {
    // ignore
  }
}

// The final pick this person has already been shown the celebration for.
const finalKey = (room) => `babyNames.finalSeen.${room}`

export function loadSeenFinal(room) {
  try {
    return localStorage.getItem(finalKey(room))
  } catch {
    return null
  }
}

export function saveSeenFinal(room, name) {
  try {
    localStorage.setItem(finalKey(room), name)
  } catch {
    // ignore
  }
}
