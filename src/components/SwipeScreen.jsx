import { useEffect, useMemo, useRef, useState } from 'react'
import NAMES from '../data/names'
import { seededShuffle } from '../lib/shuffle'
import { userKeyFor } from '../lib/session'
import NameCard from './NameCard'

export default function SwipeScreen({ room, user, swipes, onSwipe, onUndo, onViewMatches }) {
  const myKey = userKeyFor(user)
  const [leaving, setLeaving] = useState(null)
  const timer = useRef(null)

  // Same person + room always gets the same personal order.
  const deck = useMemo(() => seededShuffle(NAMES, `${room}:${myKey}`), [room, myKey])

  const { remaining, lastSwiped } = useMemo(() => {
    const mine = swipes.filter((s) => s.userKey === myKey)
    const done = new Set(mine.map((s) => s.name))
    const last = mine.reduce((a, b) => (!a || b.createdAtMs > a.createdAtMs ? b : a), null)
    return { remaining: deck.filter((n) => !done.has(n)), lastSwiped: last?.name ?? null }
  }, [swipes, myKey, deck])

  const current = remaining[0]
  const position = NAMES.length - remaining.length + 1

  useEffect(() => () => clearTimeout(timer.current), [])

  function decide(liked) {
    if (leaving || !current) return
    setLeaving(liked ? 'right' : 'left')
    timer.current = setTimeout(() => {
      onSwipe(current, liked)
      setLeaving(null)
    }, 180)
  }

  function undo() {
    if (leaving || !lastSwiped) return
    onUndo(lastSwiped)
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowRight') decide(true)
      else if (e.key === 'ArrowLeft') decide(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  if (!current) {
    return (
      <section className="swipe done">
        <h2>That&apos;s every name!</h2>
        <p className="muted">You&apos;ve been through all {NAMES.length} names.</p>
        <button className="primary" onClick={onViewMatches}>
          See matches
        </button>
        {lastSwiped && (
          <button className="ghost" onClick={undo}>
            Undo last swipe
          </button>
        )}
      </section>
    )
  }

  return (
    <section className="swipe">
      <p className="progress">
        Name {position} of {NAMES.length}
      </p>

      <div className="card-area">
        <NameCard key={current} name={current} leaving={leaving} onDecide={decide} />
      </div>

      <div className="actions">
        <button className="round pass" onClick={() => decide(false)} aria-label="Pass">
          ✕
        </button>
        <button className="round undo" onClick={undo} disabled={!lastSwiped} aria-label="Undo">
          ↶
        </button>
        <button className="round like" onClick={() => decide(true)} aria-label="Like">
          ♥
        </button>
      </div>
      <p className="hint center">Swipe right to like, left to pass.</p>
    </section>
  )
}
