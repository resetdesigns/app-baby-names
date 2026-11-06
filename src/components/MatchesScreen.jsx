import { useState } from 'react'
import { variantKey } from '../data/variants'
import { fullNameFor } from '../lib/room'
import { userKeyFor } from '../lib/session'
import { buildShareText, shareList } from '../lib/shareText'
import { canSpeak, speak } from '../lib/speak'

// Keeps ranking order, but puts spellings of the same name together.
function groupMatches(matches) {
  const groups = []
  const index = new Map()
  for (const m of matches) {
    const key = variantKey(m.name)
    if (index.has(key)) {
      groups[index.get(key)].items.push(m)
    } else {
      index.set(key, groups.length)
      groups.push({ key, items: [m] })
    }
  }
  return groups
}

function MatchRow({ m, myKey, lastName, isFinal, onToggleStar, onPick, onDrop }) {
  const mine = m.starredBy.some((s) => s.userKey === myKey)
  const others = m.starredBy.filter((s) => s.userKey !== myKey)
  const both = mine && others.length > 0
  return (
    <li className={`match-row${isFinal ? ' is-final' : ''}`}>
      <div className="match-main">
        <span className="match-name">{m.name}</span>
        {lastName && <span className="match-full">{fullNameFor(m.name, lastName)}</span>}
        <span className="match-tags">
          {both && <span className="tag solid">Both starred</span>}
          {!both &&
            others.map((s) => (
              <span key={s.userKey} className="tag">
                ★ {s.user}
              </span>
            ))}
          {isFinal && <span className="tag solid">Final pick</span>}
        </span>
      </div>
      <div className="match-actions">
        {canSpeak && (
          <button
            className="icon"
            onClick={() => speak(fullNameFor(m.name, lastName))}
            aria-label={`Hear ${m.name}`}
          >
            ♪
          </button>
        )}
        <button
          className={`icon star${mine ? ' on' : ''}`}
          onClick={() => onToggleStar(m.name, !mine)}
          aria-pressed={mine}
          aria-label={mine ? `Remove your star from ${m.name}` : `Star ${m.name}`}
        >
          {mine ? '★' : '☆'}
        </button>
        {!isFinal && (
          <>
            <button className="mini" onClick={() => onPick(m.name)}>
              Make final
            </button>
            <button className="mini" onClick={() => onDrop(m.name)} aria-label={`Drop ${m.name}`}>
              Drop
            </button>
          </>
        )}
      </div>
    </li>
  )
}

export default function MatchesScreen({
  matches,
  softMatches,
  dropped,
  user,
  lastName,
  finalPick,
  myMaybeCount,
  onToggleStar,
  onPick,
  onClearPick,
  onDrop,
  onRestore,
  onOpenSettings,
  onRevisitMaybes,
}) {
  const myKey = userKeyFor(user)
  const [shareNote, setShareNote] = useState('')

  async function handleShare() {
    const result = await shareList(buildShareText({ matches, lastName, finalPick }))
    setShareNote(result === 'copied' ? 'Copied to your clipboard' : result === 'failed' ? "Couldn't copy" : '')
    setTimeout(() => setShareNote(''), 2500)
  }

  const banner = finalPick && (
    <div className="final-banner">
      <p className="final-label">Our baby boy</p>
      <p className="final-name">{fullNameFor(finalPick.name, lastName)}</p>
      <p className="hint light">Chosen by {finalPick.pickedBy}</p>
      <div className="final-actions">
        {canSpeak && (
          <button className="mini invert" onClick={() => speak(fullNameFor(finalPick.name, lastName))}>
            Hear it
          </button>
        )}
        <button className="mini invert" onClick={onClearPick}>
          Change pick
        </button>
      </div>
    </div>
  )

  const groups = groupMatches(matches)
  const renderRow = (m) => (
    <MatchRow
      key={m.name}
      m={m}
      myKey={myKey}
      lastName={lastName}
      isFinal={finalPick?.name === m.name}
      onToggleStar={onToggleStar}
      onPick={onPick}
      onDrop={onDrop}
    />
  )

  return (
    <section className="matches">
      {banner}

      {matches.length === 0 ? (
        <div className="empty">
          <h2>No matches yet</h2>
          <p className="muted">When you both like the same name, it shows up here.</p>
        </div>
      ) : (
        <>
          <div className="matches-head">
            <h2>
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </h2>
            <button className="mini" onClick={handleShare}>
              Share list
            </button>
          </div>
          {shareNote && (
            <p className="hint" role="status">
              {shareNote}
            </p>
          )}
          {!lastName && (
            <button className="link" onClick={onOpenSettings}>
              Add your last name to preview full names
            </button>
          )}
          <p className="hint">
            Star the ones you love. The most-starred float to the top. Drop one to hide it for both
            of you.
          </p>

          <ul className="match-list">
            {groups.map((g) =>
              g.items.length > 1 ? (
                <li key={g.key} className="variant-group">
                  <p className="variant-label">
                    Spelling variants: {g.items.map((i) => i.name).join(' · ')}
                  </p>
                  <ul className="match-list inner">{g.items.map(renderRow)}</ul>
                </li>
              ) : (
                renderRow(g.items[0])
              ),
            )}
          </ul>
        </>
      )}

      {softMatches.length > 0 && (
        <div className="soft">
          <h3>Worth another look ({softMatches.length})</h3>
          <p className="hint">
            You both lean yes, but at least one of you said maybe. These don&apos;t count as matches
            yet.
          </p>
          {myMaybeCount > 0 && (
            <button className="ghost" onClick={onRevisitMaybes}>
              Revisit my maybes ({myMaybeCount})
            </button>
          )}
          <ul className="match-list">
            {softMatches.map((s) => (
              <li key={s.name} className="match-row">
                <div className="match-main">
                  <span className="match-name">{s.name}</span>
                  {lastName && <span className="match-full">{fullNameFor(s.name, lastName)}</span>}
                  <span className="match-tags">
                    {s.entries.map((e) => (
                      <span key={e.userKey} className="tag">
                        {e.user}: {e.choice === 'like' ? 'liked' : 'maybe'}
                      </span>
                    ))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dropped.length > 0 && (
        <details className="dropped">
          <summary>Dropped ({dropped.length})</summary>
          <ul className="match-list">
            {dropped.map((v) => (
              <li key={v.name} className="match-row">
                <div className="match-main">
                  <span className="match-name">{v.name}</span>
                  <span className="hint">Dropped by {v.vetoedBy}</span>
                </div>
                <div className="match-actions">
                  <button className="mini" onClick={() => onRestore(v.name)}>
                    Restore
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
