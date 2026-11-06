import { useState } from 'react'
import { normalizeRoom } from '../lib/session'

export default function SetupScreen({ initialRoom = '', initialUser = '', onStart }) {
  const [room, setRoom] = useState(initialRoom)
  const [user, setUser] = useState(initialUser)

  const cleanRoom = normalizeRoom(room)
  const cleanUser = user.trim()
  const valid = cleanRoom.length >= 3 && cleanUser.length >= 1

  function handleSubmit(e) {
    e.preventDefault()
    if (valid) onStart({ room: cleanRoom, user: cleanUser })
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
        <p className="hint">Each of you uses your own name, so your swipes stay separate.</p>

        <button type="submit" className="primary" disabled={!valid}>
          Start swiping
        </button>
      </form>
    </main>
  )
}
