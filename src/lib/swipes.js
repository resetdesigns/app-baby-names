import { collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { userKeyFor } from './session'

// Data model: rooms/{room}/swipes/{userKey}__{name}
// One document per person per name, so re-swiping overwrites instead of duplicating.
// choice is 'like' | 'pass' | 'maybe'. (Older swipes only have liked: true/false.)

export const swipesCollection = (room) => collection(db, 'rooms', room, 'swipes')

const swipeRef = (room, user, name) =>
  doc(db, 'rooms', room, 'swipes', `${userKeyFor(user)}__${name}`)

export function saveSwipe(room, user, name, choice) {
  return setDoc(swipeRef(room, user, name), {
    user,
    userKey: userKeyFor(user),
    name,
    liked: choice === 'like',
    choice,
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
  const likerNames = new Map()
  for (const s of swipes) {
    if (s.choice !== 'like') continue
    if (!byName.has(s.name)) byName.set(s.name, new Map())
    byName.get(s.name).set(s.userKey, s.createdAtMs)
    likerNames.set(`${s.name}|${s.userKey}`, s.user)
  }
  const matches = []
  for (const [name, likers] of byName) {
    if (likers.size < 2) continue
    const matchedAt = Math.max(...likers.values())
    const likedBy = [...likers.keys()].map((userKey) => ({ userKey, user: likerNames.get(`${name}|${userKey}`) }))
    matches.push({ name, matchedAt, likedBy })
  }
  return matches.sort((a, b) => b.matchedAt - a.matchedAt || a.name.localeCompare(b.name))
}

// A soft match: at least two people leaned yes (like or maybe), but not two likes yet.
// Worth another look, so it is not celebrated.
export function computeSoftMatches(swipes) {
  const byName = new Map()
  for (const s of swipes) {
    if (s.choice === 'pass') continue
    if (!byName.has(s.name)) byName.set(s.name, new Map())
    byName.get(s.name).set(s.userKey, {
      user: s.user,
      userKey: s.userKey,
      choice: s.choice,
      at: s.createdAtMs,
    })
  }
  const soft = []
  for (const [name, people] of byName) {
    if (people.size < 2) continue
    const entries = [...people.values()]
    if (entries.filter((e) => e.choice === 'like').length >= 2) continue
    soft.push({ name, entries, matchedAt: Math.max(...entries.map((e) => e.at)) })
  }
  return soft.sort((a, b) => b.matchedAt - a.matchedAt || a.name.localeCompare(b.name))
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
