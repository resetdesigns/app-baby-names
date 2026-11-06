import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { swipesCollection } from '../lib/swipes'

// Live view of every swipe in the room. Updates whenever either person swipes.
export function useSwipes(room) {
  const [state, setState] = useState({ room: null, swipes: [], error: null })

  useEffect(() => {
    if (!room) return undefined
    const unsubscribe = onSnapshot(
      swipesCollection(room),
      (snap) => {
        const swipes = snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' })
          return {
            id: d.id,
            user: data.user,
            userKey: data.userKey,
            name: data.name,
            liked: data.liked === true,
            createdAtMs: data.createdAt?.toMillis?.() ?? Date.now(),
          }
        })
        setState({ room, swipes, error: null })
      },
      (error) => setState({ room, swipes: [], error }),
    )
    return unsubscribe
  }, [room])

  // Until the first snapshot for this room arrives, we are still loading.
  const ready = state.room === room
  return {
    swipes: ready ? state.swipes : [],
    error: ready ? state.error : null,
    ready,
  }
}
