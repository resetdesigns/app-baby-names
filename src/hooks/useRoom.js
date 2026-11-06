import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { swipesCollection } from '../lib/swipes'
import { customNamesCollection, metaCollection, starsCollection } from '../lib/room'

const BASE = { room: null, swipes: [], stars: [], names: [], meta: [], loadedCount: 0, error: null }
const SLICES = 4

const ms = (value) => value?.toMillis?.() ?? Date.now()

// One live connection to everything in the room. Re-renders when either person changes anything.
export function useRoom(room) {
  const [snap, setSnap] = useState(BASE)

  useEffect(() => {
    if (!room) return undefined
    const loaded = new Set()

    const update = (patch) =>
      setSnap((prev) => ({ ...(prev.room === room ? prev : BASE), room, ...patch }))

    const listen = (key, collectionRef, toItem) =>
      onSnapshot(
        collectionRef,
        (result) => {
          loaded.add(key)
          update({
            [key]: result.docs.map((d) => toItem(d.id, d.data({ serverTimestamps: 'estimate' }))),
            loadedCount: loaded.size,
          })
        },
        (error) => update({ error }),
      )

    const unsubscribers = [
      listen('swipes', swipesCollection(room), (id, d) => ({
        id,
        user: d.user,
        userKey: d.userKey,
        name: d.name,
        liked: d.liked === true,
        createdAtMs: ms(d.createdAt),
      })),
      listen('stars', starsCollection(room), (id, d) => ({
        id,
        user: d.user,
        userKey: d.userKey,
        name: d.name,
      })),
      listen('names', customNamesCollection(room), (id, d) => ({
        id,
        name: d.name,
        addedBy: d.addedBy,
        createdAtMs: ms(d.createdAt),
      })),
      listen('meta', metaCollection(room), (id, d) => ({
        id,
        lastName: d.lastName ?? '',
        name: d.name ?? '',
        pickedBy: d.pickedBy ?? '',
      })),
    ]
    return () => {
      unsubscribers.forEach((u) => u())
    }
  }, [room])

  const current = snap.room === room
  const settings = current ? snap.meta.find((m) => m.id === 'settings') : null
  const final = current ? snap.meta.find((m) => m.id === 'final') : null

  return {
    ready: current && snap.loadedCount === SLICES,
    error: current ? snap.error : null,
    swipes: current ? snap.swipes : [],
    stars: current ? snap.stars : [],
    customNames: current ? snap.names : [],
    lastName: settings?.lastName ?? '',
    finalPick: final && final.name ? { name: final.name, pickedBy: final.pickedBy } : null,
  }
}
