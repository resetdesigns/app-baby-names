import { collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { userKeyFor } from './session'

// Data model: rooms/{room}/swipes/{userKey}__{name}
// One document per person per name, so re-swiping overwrites instead of duplicating.

export const swipesCollection = (room) => collection(db, 'rooms', room, 'swipes')

const swipeRef = (room, user, name) =>
  doc(db, 'rooms', room, 'swipes', `${userKeyFor(user)}__${name}`)

export function saveSwipe(room, user, name, liked) {
  return setDoc(swipeRef(room, user, name), {
    user,
    userKey: userKeyFor(user),
    name,
    liked,
    createdAt: serverTimestamp(),
  })
}

export function removeSwipe(room, user, name) {
  return deleteDoc(swipeRef(room, user, name))
}

// A match is a name that at least two different people liked.
// Returns newest match first.
export function computeMatches(swipes) {
  const byName = new Map()
  for (const s of swipes) {
    if (!s.liked) continue
    if (!byName.has(s.name)) byName.set(s.name, new Map())
    byName.get(s.name).set(s.userKey, s.createdAtMs)
  }
  const matches = []
  for (const [name, likers] of byName) {
    if (likers.size < 2) continue
    const matchedAt = Math.max(...likers.values())
    matches.push({ name, matchedAt })
  }
  return matches.sort((a, b) => b.matchedAt - a.matchedAt || a.name.localeCompare(b.name))
}

// Adds who starred each match and orders the list: most stars first, then newest match.
export function rankMatches(matches, stars) {
  const starsByName = new Map()
  for (const s of stars) {
    if (!starsByName.has(s.name)) starsByName.set(s.name, new Map())
    starsByName.get(s.name).set(s.userKey, s.user)
  }
  return matches
    .map((m) => ({
      ...m,
      starredBy: [...(starsByName.get(m.name) ?? [])].map(([userKey, user]) => ({ userKey, user })),
    }))
    .sort(
      (a, b) =>
        b.starredBy.length - a.starredBy.length ||
        b.matchedAt - a.matchedAt ||
        a.name.localeCompare(b.name),
    )
}
