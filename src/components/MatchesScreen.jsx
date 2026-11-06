import { fullNameFor } from '../lib/room'
import { userKeyFor } from '../lib/session'
import { canSpeak, speak } from '../lib/speak'

export default function MatchesScreen({
  matches,
  user,
  lastName,
  finalPick,
  onToggleStar,
  onPick,
  onClearPick,
  onOpenSettings,
}) {
  const myKey = userKeyFor(user)

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

  if (matches.length === 0) {
    return (
      <section className="matches empty">
        {banner}
        <h2>No matches yet</h2>
        <p className="muted">When you both like the same name, it shows up here.</p>
      </section>
    )
  }

  return (
    <section className="matches">
      {banner}
      <h2>
        {matches.length} {matches.length === 1 ? 'match' : 'matches'}
      </h2>
      {!lastName && (
        <button className="link" onClick={onOpenSettings}>
          Add your last name to preview full names
        </button>
      )}
      <p className="hint">Star the ones you love. The most-starred float to the top.</p>

      <ul className="match-list">
        {matches.map((m) => {
          const mine = m.starredBy.some((s) => s.userKey === myKey)
          const others = m.starredBy.filter((s) => s.userKey !== myKey)
          const isFinal = finalPick?.name === m.name
          const both = mine && others.length > 0
          return (
            <li key={m.name} className={isFinal ? 'is-final' : ''}>
              <div className="match-main">
                <span className="match-name">{m.name}</span>
                {lastName && <span className="match-full">{fullNameFor(m.name, lastName)}</span>}
                <span className="match-tags">
                  {both && <span className="tag solid">Both starred</span>}
                  {!both && others.map((s) => (
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
                  <button className="mini" onClick={() => onPick(m.name)}>
                    Make final
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
