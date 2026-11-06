import { useMemo, useState } from 'react'
import './App.css'
import MatchCelebration from './components/MatchCelebration'
import MatchesScreen from './components/MatchesScreen'
import SettingsSheet from './components/SettingsSheet'
import SetupScreen from './components/SetupScreen'
import SwipeScreen from './components/SwipeScreen'
import NAMES from './data/names'
import { useRoom } from './hooks/useRoom'
import {
  addCustomName,
  cleanCustomName,
  clearFinalPick,
  fullNameFor,
  saveLastName,
  setFinalPick,
  setStar,
} from './lib/room'
import {
  clearSession,
  loadSeenFinal,
  loadSeenMatches,
  loadSession,
  saveSeenFinal,
  saveSeenMatches,
  saveSession,
} from './lib/session'
import { computeMatches, rankMatches, removeSwipe, saveSwipe } from './lib/swipes'

const BASE_NAMES_LOWER = new Set(NAMES.map((n) => n.toLowerCase()))

export default function App() {
  const [session, setSession] = useState(loadSession)
  const [tab, setTab] = useState('swipe')
  const [seen, setSeen] = useState(() => (session ? loadSeenMatches(session.room) : new Set()))
  const [seenFinal, setSeenFinal] = useState(() => (session ? loadSeenFinal(session.room) : null))
  const [showSettings, setShowSettings] = useState(false)
  const [actionError, setActionError] = useState(null)

  const { swipes, stars, customNames, lastName, finalPick, ready, error } = useRoom(
    session?.room ?? null,
  )
  const matches = useMemo(() => rankMatches(computeMatches(swipes), stars), [swipes, stars])

  // Matches this person hasn't been celebrated yet: made by their own swipe,
  // by their partner's swipe, or while they were away. Oldest first.
  const unseen = ready
    ? matches.filter((m) => !seen.has(m.name)).sort((a, b) => a.matchedAt - b.matchedAt)
    : []
  const finalUnseen = ready && finalPick && finalPick.name !== seenFinal

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
    setSeenFinal(loadSeenFinal(next.room))
    setTab('swipe')
  }

  function handleLeave() {
    clearSession()
    setSession(null)
    setTab('swipe')
    setShowSettings(false)
  }

  const report = (promise) => promise.catch(setActionError)

  function handleAddName(raw) {
    const name = cleanCustomName(raw)
    if (!name) return 'Use letters only, 2 to 30 characters.'
    const lower = name.toLowerCase()
    if (BASE_NAMES_LOWER.has(lower)) return `${name} is already in the deck. You'll see it as you swipe.`
    if (customNames.some((c) => c.name.toLowerCase() === lower)) return `${name} was already added.`
    report(addCustomName(session.room, session.user, name))
    // Whoever adds a name likes it, so it goes straight to their partner.
    report(saveSwipe(session.room, session.user, name, true))
    return null
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
        <div className="topbar-actions">
          <button className="link" onClick={() => setShowSettings(true)}>
            Settings
          </button>
          <button className="link" onClick={handleLeave}>
            Switch
          </button>
        </div>
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
            lastName={lastName}
            swipes={swipes}
            customNames={customNames}
            onSwipe={(name, liked) => report(saveSwipe(session.room, session.user, name, liked))}
            onUndo={(name) => report(removeSwipe(session.room, session.user, name))}
            onAddName={handleAddName}
            onViewMatches={() => setTab('matches')}
          />
        ) : (
          <MatchesScreen
            matches={matches}
            user={session.user}
            lastName={lastName}
            finalPick={finalPick}
            onToggleStar={(name, starred) => report(setStar(session.room, session.user, name, starred))}
            onPick={(name) => report(setFinalPick(session.room, session.user, name))}
            onClearPick={() => report(clearFinalPick(session.room))}
            onOpenSettings={() => setShowSettings(true)}
          />
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

      {showSettings && (
        <SettingsSheet
          lastName={lastName}
          onSave={(value) => {
            report(saveLastName(session.room, session.user, value))
            setShowSettings(false)
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {finalUnseen ? (
        <MatchCelebration
          title="It's decided!"
          name={fullNameFor(finalPick.name, lastName)}
          caption={`Chosen by ${finalPick.pickedBy}`}
          continueLabel="Wonderful"
          onContinue={() => {
            saveSeenFinal(session.room, finalPick.name)
            setSeenFinal(finalPick.name)
            setTab('matches')
          }}
        />
      ) : (
        unseen.length > 0 && (
          <MatchCelebration
            name={unseen[0].name}
            moreCount={unseen.length - 1}
            onContinue={() => markSeen([unseen[0].name])}
            onViewAll={() => {
              markSeen(unseen.map((m) => m.name))
              setTab('matches')
            }}
          />
        )
      )}
    </div>
  )
}
