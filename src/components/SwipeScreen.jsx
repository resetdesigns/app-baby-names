import { useEffect, useMemo, useRef, useState } from 'react'
import NAMES from '../data/names'
import { BUZZ, buzz } from '../lib/haptics'
import { seededShuffle } from '../lib/shuffle'
import { userKeyFor } from '../lib/session'
import AddNameForm from './AddNameForm'
import Icon from './Icon'
import NameCard from './NameCard'

const HINT_KEY = 'baby-names:coach-seen'
const hintSeen = () => {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return true
  }
}

const DIRECTION = { like: 'right', pass: 'left', maybe: 'up' }
const REVISIT_LABEL = { pass: 'passes', maybe: 'maybes' }

// `revisit` is null for the normal deck, or 'pass' / 'maybe' to run back through those answers.
export default function SwipeScreen({
  room,
  user,
  lastName,
  swipes,
  customNames,
  revisit,
  onSwipe,
  onUndo,
  onAddName,
  onViewMatches,
  onExitRevisit,
}) {
  const myKey = userKeyFor(user)
  const [leaving, setLeaving] = useState(null)
  const [showCoach, setShowCoach] = useState(() => !hintSeen())
  const [pinned, setPinned] = useState(null) // the card on screen, so new names never swap it away
  const [pendingUndo, setPendingUndo] = useState(null)
  const [handled, setHandled] = useState(() => new Set()) // answered during this revisit
  const timer = useRef(null)

  // Same person + room always gets the same personal order.
  const baseDeck = useMemo(() => seededShuffle(NAMES, `${room}:${myKey}`), [room, myKey])

  const { ordered, lastSwiped, others } = useMemo(() => {
    const mine = swipes.filter((s) => s.userKey === myKey)
    const done = new Set(mine.map((s) => s.name))
    const last = mine.reduce((a, b) => (!a || b.createdAtMs > a.createdAtMs ? b : a), null)

    let list
    if (revisit) {
      list = mine
        .filter((s) => s.choice === revisit && !handled.has(s.name))
        .sort((a, b) => a.createdAtMs - b.createdAtMs)
        .map((s) => s.name)
    } else {
      const added = [...customNames]
        .sort((a, b) => a.createdAtMs - b.createdAtMs)
        .map((c) => c.name)
        .filter((n) => !done.has(n))
      // Names we added come first, then the shuffled deck.
      list = [...added, ...baseDeck.filter((n) => !done.has(n))]
    }

    // How far along everyone else is: a count only, never what they chose.
    const counts = new Map()
    for (const s of swipes) {
      if (s.userKey === myKey) continue
      const entry = counts.get(s.userKey) ?? { user: s.user, count: 0 }
      entry.count += 1
      counts.set(s.userKey, entry)
    }
    return { ordered: list, lastSwiped: last?.name ?? null, others: [...counts.values()] }
  }, [swipes, customNames, myKey, baseDeck, revisit, handled])

  // Keep the current card stable: only move on when it has been swiped (or an undo brings one back).
  let current = ordered[0]
  if (pendingUndo && ordered.includes(pendingUndo)) current = pendingUndo
  else if (pinned && ordered.includes(pinned)) current = pinned
  if (pendingUndo && ordered.includes(pendingUndo)) setPendingUndo(null)
  if ((current ?? null) !== pinned) setPinned(current ?? null)

  const total = NAMES.length + customNames.length
  const position = total - ordered.length + 1

  useEffect(() => () => clearTimeout(timer.current), [])

  function decide(choice) {
    if (leaving || !current) return
    if (showCoach) dismissCoach()
    setLeaving(DIRECTION[choice])
    buzz(choice === 'maybe' ? BUZZ.maybe : BUZZ.swipe)
    timer.current = setTimeout(() => {
      onSwipe(current, choice)
      if (revisit) setHandled((prev) => new Set(prev).add(current))
      setLeaving(null)
    }, 180)
  }

  function dismissCoach() {
    setShowCoach(false)
    try {
      localStorage.setItem(HINT_KEY, '1')
    } catch {
      // Not saving the hint is fine; it just shows again next time.
    }
  }

  function undo() {
    if (revisit || leaving || !lastSwiped) return
    setPendingUndo(lastSwiped)
    onUndo(lastSwiped)
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight') decide('like')
      else if (e.key === 'ArrowLeft') decide('pass')
      else if (e.key === 'ArrowUp') {
        e.preventDefault()
        decide('maybe')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  if (!current) {
    return (
      <section className="swipe done">
        {revisit ? (
          <>
            <h2>All caught up</h2>
            <p className="muted">You&apos;ve been through all your {REVISIT_LABEL[revisit]}.</p>
            <button className="primary" onClick={onExitRevisit}>
              Back to new names
            </button>
            <button className="ghost" onClick={onViewMatches}>
              See matches
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </section>
    )
  }

  return (
    <section className="swipe">
      {revisit ? (
        <>
          <button className="link" onClick={onExitRevisit}>
            <Icon name="back" size={16} /> Back to new names
          </button>
          <p className="progress glass">
            Revisiting your {REVISIT_LABEL[revisit]} · {ordered.length} left
          </p>
        </>
      ) : (
        <div className="progress-block">
          <p className="progress glass">
            Name {position} of {total}
          </p>
          <span
            className="progress-bar"
            role="progressbar"
            aria-label="Names swiped"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={total - ordered.length}
          >
            <span className="progress-fill" style={{ width: `${((total - ordered.length) / total) * 100}%` }} />
          </span>
          {others.map((o) => (
            <p key={o.user} className="progress partner">
              {o.user} has swiped {o.count} of {total}
            </p>
          ))}
        </div>
      )}

      <div className="card-area">
        <div className="card-stack">
          {ordered.length > 2 && <span className="stack-layer s2" aria-hidden="true" />}
          {ordered.length > 1 && <span className="stack-layer s1" aria-hidden="true" />}
          <NameCard
            key={current}
            name={current}
            lastName={lastName}
            leaving={leaving}
            onDecide={decide}
          />
        </div>
      </div>

      <div className="actions">
        <button className="round pass" onClick={() => decide('pass')} aria-label="Pass">
          <Icon name="x" size={28} strokeWidth={2.4} />
        </button>
        <button className="round maybe" onClick={() => decide('maybe')} aria-label="Maybe">
          <Icon name="help" size={24} strokeWidth={2.4} />
        </button>
        {!revisit && (
          <button className="round undo" onClick={undo} disabled={!lastSwiped} aria-label="Undo">
            <Icon name="undo" size={20} />
          </button>
        )}
        <button className="round like" onClick={() => decide('like')} aria-label="Like">
          <Icon name="heart" size={32} filled />
        </button>
      </div>
      {showCoach && !revisit ? (
        <div className="coach" role="note">
          <p>
            <strong>Swipe right</strong> to like, <strong>left</strong> to pass, <strong>up</strong> for
            maybe. Tap the card for its meaning.
          </p>
          <button className="mini" onClick={dismissCoach}>
            Got it
          </button>
        </div>
      ) : (
        <p className="hint center">
          Swipe right to like, left to pass, up for maybe. Tap the card for its meaning.
        </p>
      )}
      {!revisit && <AddNameForm onAdd={onAddName} />}
    </section>
  )
}
