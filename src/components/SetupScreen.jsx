import { useEffect, useState } from 'react'
import { normalizeRoom, userKeyFor } from '../lib/session'

// First screen: room code and your name. It looks up who is already in the room, so you can
// tap your own name instead of typing it, and so adding a third person is a deliberate choice.
export default function SetupScreen({ initialRoom = '', initialUser = '', lookupMembers, onStart }) {
  const [room, setRoom] = useState(initialRoom)
  const [user, setUser] = useState(initialUser)
  const [lookup, setLookup] = useState({ room: null, status: 'idle', members: [] })
  const [confirmedFor, setConfirmedFor] = useState('')

  const cleanRoom = normalizeRoom(room)
  const cleanUser = user.trim()
  const roomValid = cleanRoom.length >= 3

  useEffect(() => {
    if (!roomValid) return undefined
    let cancelled = false
    const timer = setTimeout(() => {
      lookupMembers(cleanRoom)
        .then((members) => !cancelled && setLookup({ room: cleanRoom, status: 'done', members }))
        .catch(() => !cancelled && setLookup({ room: cleanRoom, status: 'error', members: [] }))
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [cleanRoom, roomValid, lookupMembers])

  const checked = lookup.room === cleanRoom
  const status = !roomValid ? 'idle' : checked ? lookup.status : 'loading'
  const members = checked ? lookup.members : []

  const myKey = userKeyFor(cleanUser)
  const isMember = cleanUser !== '' && members.some((m) => m.userKey === myKey)
  const wouldBeThird = status === 'done' && cleanUser !== '' && !isMember && members.length >= 2
  const thirdKey = `${cleanRoom}:${myKey}`
  const confirmed = confirmedFor === thirdKey
  const pairedWith = members.length === 1 && cleanUser !== '' && !isMember ? members[0].user : null

  const canStart = roomValid && cleanUser !== '' && status !== 'loading' && (!wouldBeThird || confirmed)

  function handleSubmit(e) {
    e.preventDefault()
    if (canStart) onStart({ room: cleanRoom, user: cleanUser })
  }

  return (
    <main className="setup">
      <h1>Baby Names</h1>
      <p className="muted">
        Swipe through boys&apos; names. When you both like the same one, it&apos;s a match.
      </p>

      <form onSubmit={handleSubmit} className="setup-form">
        <label>
          Room code
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="e.g. BABYJOE"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={24}
          />
        </label>
        <p className="hint">
          Type the same code on both phones. It keeps your swipes together and private. Pick
          something hard to guess.
        </p>

        {status === 'loading' && <p className="hint">Checking the room…</p>}
        {status === 'error' && (
          <p className="hint">Couldn&apos;t check who is in the room. You can still continue.</p>
        )}
        {status === 'done' && members.length === 0 && (
          <p className="hint">
            No one has joined this room yet. If you&apos;re joining your partner, double-check the
            code.
          </p>
        )}
        {status === 'done' && members.length > 0 && (
          <div className="members">
            <p className="hint">Already in this room. Tap your name:</p>
            <div className="member-chips">
              {members.map((m) => (
                <button
                  type="button"
                  key={m.userKey}
                  className={`chip-btn${m.userKey === myKey ? ' on' : ''}`}
                  onClick={() => setUser(m.user)}
                >
                  {m.user}
                </button>
              ))}
            </div>
          </div>
        )}

        <label>
          Your name
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="e.g. Joe"
            autoComplete="off"
            maxLength={20}
          />
        </label>
        {isMember && <p className="hint">Welcome back, {members.find((m) => m.userKey === myKey).user}.</p>}
        {pairedWith && <p className="hint">You&apos;ll be paired with {pairedWith}.</p>}
        {!isMember && !pairedWith && !wouldBeThird && (
          <p className="hint">Each of you uses your own name, so your swipes stay separate.</p>
        )}

        {wouldBeThird && (
          <div className="warning" role="alert">
            <p>
              This room already has two people ({members.map((m) => m.user).join(' and ')}).
              &ldquo;{cleanUser}&rdquo; would be a third. If that&apos;s a different spelling of
              your own name, tap your name above instead, or you could match with yourself.
            </p>
            <label className="check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmedFor(e.target.checked ? thirdKey : '')}
              />
              Yes, add {cleanUser} as a new person
            </label>
          </div>
        )}

        <button type="submit" className="primary" disabled={!canStart}>
          {wouldBeThird ? 'Add a third person' : 'Start swiping'}
        </button>
      </form>
    </main>
  )
}
