import { useMemo, useState } from 'react'
import './App.css'
import MatchCelebration from './components/MatchCelebration'
import MatchesScreen from './components/MatchesScreen'
import SetupScreen from './components/SetupScreen'
import SwipeScreen from './components/SwipeScreen'
import { useSwipes } from './hooks/useSwipes'
import {
  clearSession,
  loadSeenMatches,
  loadSession,
  saveSeenMatches,
  saveSession,
} from './lib/session'
import { computeMatches, removeSwipe, saveSwipe } from './lib/swipes'

export default function App() {
  const [session, setSession] = useState(loadSession)
  const [tab, setTab] = useState('swipe')
  const [seen, setSeen] = useState(() => (session ? loadSeenMatches(session.room) : new Set()))
  const [actionError, setActionError] = useState(null)

  const { swipes, ready, error } = useSwipes(session?.room ?? null)
  const matches = useMemo(() => computeMatches(swipes), [swipes])

  // Matches this person hasn't been celebrated yet: made by their own swipe,
  // by their partner's swipe, or while they were away.
  const unseen = ready ? matches.filter((m) => !seen.has(m.name)) : []

  function markSeen(names) {
    const next = new Set(seen)
    names.forEach((n) => next.add(n))
    setSeen(next)
    saveSeenMatches(session.room, next)
  }

  function handleStart(next) {
    saveSession(next)
    setSession(next)
    setSeen(loadSeenMatches(next.room))
    setTab('swipe')
  }

  function handleLeave() {
    clearSession()
    setSession(null)
    setTab('swipe')
  }

  function handleSwipe(name, liked) {
    saveSwipe(session.room, session.user, name, liked).catch(setActionError)
  }

  function handleUndo(name) {
    removeSwipe(session.room, session.user, name).catch(setActionError)
  }

  if (!session) {
    return <SetupScreen onStart={handleStart} />
  }

  const problem = error || actionError

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <strong>{session.user}</strong>
          <span className="muted"> · room {session.room}</span>
        </div>
        <button className="link" onClick={handleLeave}>
          Switch
        </button>
      </header>

      {problem && (
        <p className="banner" role="alert">
          Couldn&apos;t reach the database: {problem.message}
        </p>
      )}

      <main className="content">
        {!ready && !error ? (
          <p className="muted center">Loading…</p>
        ) : tab === 'swipe' ? (
          <SwipeScreen
            room={session.room}
            user={session.user}
            swipes={swipes}
            onSwipe={handleSwipe}
            onUndo={handleUndo}
            onViewMatches={() => setTab('matches')}
          />
        ) : (
          <MatchesScreen matches={matches} />
        )}
      </main>

      <nav className="tabs">
        <button className={tab === 'swipe' ? 'active' : ''} onClick={() => setTab('swipe')}>
          Swipe
        </button>
        <button className={tab === 'matches' ? 'active' : ''} onClick={() => setTab('matches')}>
          Matches{matches.length > 0 ? ` (${matches.length})` : ''}
        </button>
      </nav>

      {unseen.length > 0 && (
        <MatchCelebration
          name={unseen[0].name}
          moreCount={unseen.length - 1}
          onContinue={() => markSeen([unseen[0].name])}
          onViewAll={() => {
            markSeen(unseen.map((m) => m.name))
            setTab('matches')
          }}
        />
      )}
    </div>
  )
}
