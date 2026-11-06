import { useEffect, useMemo, useState } from 'react'
import './App.css'
import MatchCelebration from './components/MatchCelebration'
import MatchesScreen from './components/MatchesScreen'
import ReviewScreen from './components/ReviewScreen'
import SettingsSheet from './components/SettingsSheet'
import SetupScreen from './components/SetupScreen'
import SwipeScreen from './components/SwipeScreen'
import NAMES from './data/names'
import { useInstall } from './hooks/useInstall'
import { useRoom } from './hooks/useRoom'
import { ensureMember, fetchMembers } from './lib/members'
import {
  addCustomName,
  addVeto,
  cleanCustomName,
  clearFinalPick,
  fullNameFor,
  removeVeto,
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
  userKeyFor,
} from './lib/session'
import { computeMatches, computeSoftMatches, rankMatches, removeSwipe, saveSwipe } from './lib/swipes'

const BASE_NAMES_LOWER = new Set(NAMES.map((n) => n.toLowerCase()))

export default function App() {
  const [session, setSession] = useState(loadSession)
  const [tab, setTab] = useState('swipe')
  const [revisit, setRevisit] = useState(null) // null, 'pass' or 'maybe'
  const [seen, setSeen] = useState(() => (session ? loadSeenMatches(session.room) : new Set()))
  const [seenFinal, setSeenFinal] = useState(() => (session ? loadSeenFinal(session.room) : null))
  const [showSettings, setShowSettings] = useState(false)
  const [actionError, setActionError] = useState(null)
  const install = useInstall()

  const { swipes, stars, customNames, members, vetoes, lastName, finalPick, ready, error } = useRoom(
    session?.room ?? null,
  )
  const myKey = session ? userKeyFor(session.user) : ''

  // Everyone's likes, minus any match that was dropped. Dropped ones can be restored.
  const allMatches = useMemo(() => computeMatches(swipes), [swipes])
  const matches = useMemo(() => {
    const dropped = new Set(vetoes.map((v) => v.name))
    return rankMatches(
      allMatches.filter((m) => !dropped.has(m.name)),
      stars,
    )
  }, [allMatches, vetoes, stars])
  const softMatches = useMemo(() => {
    const dropped = new Set(vetoes.map((v) => v.name))
    return computeSoftMatches(swipes).filter((m) => !dropped.has(m.name))
  }, [swipes, vetoes])
  const droppedMatches = useMemo(
    () => vetoes.filter((v) => allMatches.some((m) => m.name === v.name)),
    [vetoes, allMatches],
  )
  const myMaybeCount = swipes.filter((s) => s.userKey === myKey && s.choice === 'maybe').length

  // Matches this person hasn't been celebrated yet: made by their own swipe,
  // by their partner's swipe, or while they were away. Oldest first.
  const unseen = ready
    ? matches.filter((m) => !seen.has(m.name)).sort((a, b) => a.matchedAt - b.matchedAt)
    : []
  const finalUnseen = ready && finalPick && finalPick.name !== seenFinal

  // Record that this person has joined the room (older rooms get this the next time they open it).
  useEffect(() => {
    if (!session || !ready) return
    if (members.some((m) => m.userKey === userKeyFor(session.user))) return
    ensureMember(session.room, session.user).catch(setActionError)
  }, [session, ready, members])

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
    setRevisit(null)
  }

  function handleLeave() {
    clearSession()
    setSession(null)
    setTab('swipe')
    setRevisit(null)
    setShowSettings(false)
  }

  const report = (promise) => promise.catch(setActionError)
  const answer = (name, choice) => report(saveSwipe(session.room, session.user, name, choice))

  function startRevisit(kind) {
    setRevisit(kind)
    setTab('swipe')
  }

  function handleAddName(raw) {
    const name = cleanCustomName(raw)
    if (!name) return 'Use letters only, 2 to 30 characters.'
    const lower = name.toLowerCase()
    if (BASE_NAMES_LOWER.has(lower)) return `${name} is already in the deck. You'll see it as you swipe.`
    if (customNames.some((c) => c.name.toLowerCase() === lower)) return `${name} was already added.`
    report(addCustomName(session.room, session.user, name))
    // Whoever adds a name likes it, so it goes straight to their partner.
    answer(name, 'like')
    return null
  }

  if (!session) {
    return <SetupScreen lookupMembers={fetchMembers} onStart={handleStart} />
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
            key={revisit ?? 'new'}
            room={session.room}
            user={session.user}
            lastName={lastName}
            swipes={swipes}
            customNames={customNames}
            revisit={revisit}
            onSwipe={answer}
            onUndo={(name) => report(removeSwipe(session.room, session.user, name))}
            onAddName={handleAddName}
            onViewMatches={() => setTab('matches')}
            onExitRevisit={() => setRevisit(null)}
          />
        ) : tab === 'review' ? (
          <ReviewScreen
            swipes={swipes}
            user={session.user}
            lastName={lastName}
            onChange={answer}
            onRevisit={startRevisit}
          />
        ) : (
          <MatchesScreen
            matches={matches}
            softMatches={softMatches}
            dropped={droppedMatches}
            user={session.user}
            lastName={lastName}
            finalPick={finalPick}
            myMaybeCount={myMaybeCount}
            onToggleStar={(name, starred) => report(setStar(session.room, session.user, name, starred))}
            onPick={(name) => report(setFinalPick(session.room, session.user, name))}
            onClearPick={() => report(clearFinalPick(session.room))}
            onDrop={(name) => report(addVeto(session.room, session.user, name))}
            onRestore={(name) => report(removeVeto(session.room, name))}
            onOpenSettings={() => setShowSettings(true)}
            onRevisitMaybes={() => startRevisit('maybe')}
          />
        )}
      </main>

      <nav className="tabs">
        <button className={tab === 'swipe' ? 'active' : ''} onClick={() => setTab('swipe')}>
          Swipe
        </button>
        <button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}>
          Review
        </button>
        <button className={tab === 'matches' ? 'active' : ''} onClick={() => setTab('matches')}>
          Matches{matches.length > 0 ? ` (${matches.length})` : ''}
        </button>
      </nav>

      {showSettings && (
        <SettingsSheet
          lastName={lastName}
          install={install}
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
