import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { userKeyFor } from './session'

// rooms/{room}/members/{userKey}: who has joined the room. Used so setup can offer the
// names already there and warn before a third person is added by accident.

export const membersCollection = (room) => collection(db, 'rooms', room, 'members')

export async function fetchMembers(room) {
  const snap = await getDocs(membersCollection(room))
  return snap.docs.map((d) => ({ userKey: d.id, user: d.data().user ?? d.id }))
}

export function ensureMember(room, user) {
  const key = userKeyFor(user)
  return setDoc(doc(db, 'rooms', room, 'members', key), {
    user,
    userKey: key,
    createdAt: serverTimestamp(),
  })
}
