import { useEffect, useMemo, useRef, useState } from 'react'
import NAMES from '../data/names'
import { seededShuffle } from '../lib/shuffle'
import { userKeyFor } from '../lib/session'
import AddNameForm from './AddNameForm'
import NameCard from './NameCard'

export default function SwipeScreen({
  room,
  user,
  lastName,
  swipes,
  customNames,
  onSwipe,
  onUndo,
  onAddName,
  onViewMatches,
}) {
  const myKey = userKeyFor(user)
  const [leaving, setLeaving] = useState(null)
  const [pinned, setPinned] = useState(null) // the card on screen, so new names never swap it away
  const [pendingUndo, setPendingUndo] = useState(null)
  const timer = useRef(null)

  // Same person + room always gets the same personal order.
  const baseDeck = useMemo(() => seededShuffle(NAMES, `${room}:${myKey}`), [room, myKey])

  const { ordered, lastSwiped } = useMemo(() => {
    const mine = swipes.filter((s) => s.userKey === myKey)
    const done = new Set(mine.map((s) => s.name))
    const last = mine.reduce((a, b) => (!a || b.createdAtMs > a.createdAtMs ? b : a), null)
    const added = [...customNames]
      .sort((a, b) => a.createdAtMs - b.createdAtMs)
      .map((c) => c.name)
      .filter((n) => !done.has(n))
    return {
      // Names we added come first, then the shuffled deck.
      ordered: [...added, ...baseDeck.filter((n) => !done.has(n))],
      lastSwiped: last?.name ?? null,
    }
  }, [swipes, customNames, myKey, baseDeck])

  // Keep the current card stable: only move on when it has been swiped (or an undo brings one back).
  let current = ordered[0]
  if (pendingUndo && ordered.includes(pendingUndo)) current = pendingUndo
  else if (pinned && ordered.includes(pinned)) current = pinned
  if (pendingUndo && ordered.includes(pendingUndo)) setPendingUndo(null)
  if ((current ?? null) !== pinned) setPinned(current ?? null)

  const total = NAMES.length + customNames.length
  const position = total - ordered.length + 1

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
    setPendingUndo(lastSwiped)
    onUndo(lastSwiped)
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.target instanceof HTMLInputElement) return
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
        <p className="muted">You&apos;ve been through all {total} names.</p>
        <button className="primary" onClick={onViewMatches}>
          See matches
        </button>
        {lastSwiped && (
          <button className="ghost" onClick={undo}>
            Undo last swipe
          </button>
        )}
        <AddNameForm onAdd={onAddName} />
      </section>
    )
  }

  return (
    <section className="swipe">
      <p className="progress">
        Name {position} of {total}
      </p>

      <div className="card-area">
        <NameCard
          key={current}
          name={current}
          lastName={lastName}
          leaving={leaving}
          onDecide={decide}
        />
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
      <p className="hint center">Swipe right to like, left to pass. Tap the card for its meaning.</p>
      <AddNameForm onAdd={onAddName} />
    </section>
  )
}
