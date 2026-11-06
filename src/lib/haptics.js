// A short buzz on swipes and matches, on phones that support it (Android; iPhones ignore it).
const KEY = 'babyNames.haptics'

export const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

export function hapticsEnabled() {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setHapticsEnabled(on) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // ignore
  }
}

export const BUZZ = {
  swipe: 12,
  maybe: [8, 40, 8],
  match: [40, 60, 40, 60, 120],
  final: [60, 80, 60, 80, 60, 80, 200],
}

export function buzz(pattern) {
  if (!canVibrate || !hapticsEnabled()) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // ignore
  }
}
