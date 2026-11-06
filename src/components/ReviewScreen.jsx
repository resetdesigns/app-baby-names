import { useMemo, useState } from 'react'
import { fullNameFor } from '../lib/room'
import { userKeyFor } from '../lib/session'

const SEGMENTS = [
  { id: 'like', label: 'Likes' },
  { id: 'maybe', label: 'Maybes' },
  { id: 'pass', label: 'Passes' },
]
const CHOICE_LABEL = { like: 'Like', maybe: 'Maybe', pass: 'Pass' }
const REVISIT_LABEL = { maybe: 'maybes', pass: 'passes' }

// Everything you have answered, so you can change your mind about any name.
export default function ReviewScreen({ swipes, user, lastName, onChange, onRevisit }) {
  const myKey = userKeyFor(user)
  const [segment, setSegment] = useState('like')

  const byChoice = useMemo(() => {
    const groups = { like: [], maybe: [], pass: [] }
    swipes
      .filter((s) => s.userKey === myKey)
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
      .forEach((s) => groups[s.choice]?.push(s))
    return groups
  }, [swipes, myKey])

  const list = byChoice[segment]
  const otherChoices = ['like', 'maybe', 'pass'].filter((c) => c !== segment)

  return (
    <section className="review">
      <div className="segments" role="tablist" aria-label="Your answers">
        {SEGMENTS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={segment === s.id}
            className={segment === s.id ? 'active' : ''}
            onClick={() => setSegment(s.id)}
          >
            {s.label} ({byChoice[s.id].length})
          </button>
        ))}
      </div>

      {segment !== 'like' && list.length > 0 && (
        <button className="primary revisit" onClick={() => onRevisit(segment)}>
          Revisit your {REVISIT_LABEL[segment]} as cards
        </button>
      )}

      {list.length === 0 ? (
        <p className="muted center empty-note">Nothing here yet.</p>
      ) : (
        <ul className="review-list">
          {list.map((s) => (
            <li key={s.name} className="match-row">
              <div className="match-main">
                <span className="review-name">{s.name}</span>
                {lastName && <span className="match-full">{fullNameFor(s.name, lastName)}</span>}
              </div>
              <div className="match-actions">
                {otherChoices.map((c) => (
                  <button
                    key={c}
                    className="mini"
                    onClick={() => onChange(s.name, c)}
                    aria-label={`Change ${s.name} to ${CHOICE_LABEL[c]}`}
                  >
                    {CHOICE_LABEL[c]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
