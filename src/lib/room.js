import { collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { userKeyFor } from './session'

// Everything lives under rooms/{room}/:
//   swipes/{userKey}__{name}   each person's like or pass            (see swipes.js)
//   stars/{userKey}__{name}    a star on a match; the doc exists while starred
//   names/{nameKey}            names we added to the deck ourselves
//   meta/settings              { lastName }  shared by the room
//   meta/final                 { name, pickedBy }  our final pick
//   vetoes/{name}              a match one of us dropped; hidden for both until restored
//   members/{userKey}          who has joined the room (see members.js)

export const starsCollection = (room) => collection(db, 'rooms', room, 'stars')
export const customNamesCollection = (room) => collection(db, 'rooms', room, 'names')
export const metaCollection = (room) => collection(db, 'rooms', room, 'meta')
export const vetoesCollection = (room) => collection(db, 'rooms', room, 'vetoes')

export const nameKey = (name) => name.trim().toLowerCase().replace(/\s+/g, '-')

// Turns what someone typed into a tidy name, or null if it is not a plausible name.
export function cleanCustomName(input) {
  const collapsed = input.trim().replace(/\s+/g, ' ')
  if (collapsed.length < 2 || collapsed.length > 30) return null
  if (!/^\p{L}[\p{L}'. -]*$/u.test(collapsed)) return null
  return collapsed
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export const fullNameFor = (name, lastName) => (lastName ? `${name} ${lastName}` : name)

export function setStar(room, user, name, starred) {
  const ref = doc(db, 'rooms', room, 'stars', `${userKeyFor(user)}__${name}`)
  if (!starred) return deleteDoc(ref)
  return setDoc(ref, { user, userKey: userKeyFor(user), name, createdAt: serverTimestamp() })
}

export function addCustomName(room, user, name) {
  return setDoc(doc(db, 'rooms', room, 'names', nameKey(name)), {
    name,
    addedBy: user,
    createdAt: serverTimestamp(),
  })
}

export function saveLastName(room, user, lastName) {
  return setDoc(doc(db, 'rooms', room, 'meta', 'settings'), {
    lastName,
    updatedBy: user,
    updatedAt: serverTimestamp(),
  })
}

export function setFinalPick(room, user, name) {
  return setDoc(doc(db, 'rooms', room, 'meta', 'final'), {
    name,
    pickedBy: user,
    pickedAt: serverTimestamp(),
  })
}

export function clearFinalPick(room) {
  return deleteDoc(doc(db, 'rooms', room, 'meta', 'final'))
}

export function addVeto(room, user, name) {
  return setDoc(doc(db, 'rooms', room, 'vetoes', name), {
    name,
    vetoedBy: user,
    createdAt: serverTimestamp(),
  })
}

export function removeVeto(room, name) {
  return deleteDoc(doc(db, 'rooms', room, 'vetoes', name))
}
