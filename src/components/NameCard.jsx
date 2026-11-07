import { useRef, useState } from 'react'
import DETAILS from '../data/nameDetails'
import { otherSpellings } from '../data/variants'
import { fullNameFor } from '../lib/room'
import { canSpeak, speak } from '../lib/speak'
import Icon from './Icon'

// Soft blue gradients. Each name always gets the same one.
const GRADIENTS = [
  ['#d4e3ff', '#9ec5ff'],
  ['#dcdcff', '#a7c3ff'],
  ['#c4e8ff', '#8fb9ff'],
  ['#cdd9ff', '#a9b4ff'],
  ['#c6f0ff', '#8cc5ff'],
  ['#d6e5ff', '#7fb0ff'],
]

function gradientFor(name) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

const THRESHOLD = 90 // pixels dragged before a swipe counts
const TAP_SLOP = 6 // less movement than this is a tap, which flips the card

// Keeps presses on inner buttons from starting a card drag.
const stop = (e) => e.stopPropagation()

const clamp01 = (n) => Math.max(0, Math.min(1, n))

// One big name card. Drag it right to like, left to pass, or up for maybe (or use the buttons).
// Tap it (or the info button) to flip it and see the origin, meaning and full-name preview.
// `leaving` is 'left' | 'right' | 'up' | null and is controlled by the parent.
export default function NameCard({ name, lastName, leaving, onDecide }) {
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const start = useRef(null)

  const details = DETAILS[name]
  const spellings = otherSpellings(name)
  const fullName = fullNameFor(name, lastName)
  const [from, to] = gradientFor(name)

  function handlePointerDown(e) {
    if (leaving) return
    start.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!start.current) return
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })
  }

  function handlePointerUp(e) {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    start.current = null
    setDragging(false)
    if (-dy > THRESHOLD && -dy > Math.abs(dx)) {
      onDecide('maybe')
      return
    }
    if (Math.abs(dx) > THRESHOLD) {
      onDecide(dx > 0 ? 'like' : 'pass')
      return
    }
    setDrag({ x: 0, y: 0 })
    if (Math.hypot(dx, dy) < TAP_SLOP) setFlipped((f) => !f)
  }

  function handlePointerCancel() {
    start.current = null
    setDragging(false)
    setDrag({ x: 0, y: 0 })
  }

  const x = leaving === 'right' ? 520 : leaving === 'left' ? -520 : leaving === 'up' ? 0 : drag.x
  const y = leaving === 'up' ? -640 : leaving ? 0 : Math.min(0, drag.y)
  const style = {
    transform: `translate(${x}px, ${y}px) rotate(${x / 18}deg)`,
    transition: dragging ? 'none' : 'transform 0.18s ease',
  }
  const upwards = -drag.y > Math.abs(drag.x)
  const likeOpacity = leaving === 'right' ? 1 : upwards ? 0 : clamp01(drag.x / THRESHOLD)
  const passOpacity = leaving === 'left' ? 1 : upwards ? 0 : clamp01(-drag.x / THRESHOLD)
  const maybeOpacity = leaving === 'up' ? 1 : upwards ? clamp01(-drag.y / THRESHOLD) : 0
  const lookUp = `https://www.google.com/search?q=${encodeURIComponent(`${name} baby name meaning`)}`

  return (
    <div
      className="card"
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className={`card-inner${flipped ? ' flipped' : ''}`}>
        <div
          className="face front"
          aria-hidden={flipped}
          style={{ '--c1': from, '--c2': to }}
        >
          <span className="card-initial" aria-hidden="true">
            {name.charAt(0)}
          </span>
          <span className="bubble b1" aria-hidden="true" />
          <span className="bubble b2" aria-hidden="true" />
          <span className="bubble b3" aria-hidden="true" />
          <div className="card-text">
            <div className="card-name">{name}</div>
            {lastName && <div className="card-fullname glass">{fullName}</div>}
          </div>
          <div className="flip-hint glass">Tap for meaning</div>
        </div>

        <div className="face back" aria-hidden={!flipped}>
          <div className="back-name">
            <span className="hl">{name}</span>
          </div>
          {details ? (
            <>
              <span className="chip">{details[0]}</span>
              <p className="meaning">
                {details[1] ? `“${details[1]}”` : 'No single accepted meaning.'}
              </p>
            </>
          ) : (
            <p className="meaning">No details saved for this name.</p>
          )}
          {spellings.length > 0 && <p className="back-variants">Also spelled: {spellings.join(', ')}</p>}
          {lastName && <p className="back-full">{fullName}</p>}
          <div className="back-actions">
            {canSpeak && (
              <button
                className="mini"
                tabIndex={flipped ? 0 : -1}
                onPointerDown={stop}
                onClick={() => speak(fullName)}
              >
                <Icon name="volume" size={16} /> Hear it
              </button>
            )}
            <a
              className="mini"
              href={lookUp}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={flipped ? 0 : -1}
              onPointerDown={stop}
            >
              Look it up <Icon name="external" size={16} />
            </a>
          </div>
          <div className="flip-hint">Tap to flip back</div>
        </div>
      </div>

      <span className="stamp stamp-like" style={{ opacity: likeOpacity }}>
        <Icon name="heart" size={16} filled /> LIKE
      </span>
      <span className="stamp stamp-pass" style={{ opacity: passOpacity }}>
        <Icon name="x" size={16} strokeWidth={2.6} /> PASS
      </span>
      <span className="stamp stamp-maybe" style={{ opacity: maybeOpacity }}>
        <Icon name="help" size={16} strokeWidth={2.6} /> MAYBE
      </span>
      <button
        className="flip-btn"
        onPointerDown={stop}
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Show the name' : 'Show origin and meaning'}
      >
        <Icon name={flipped ? 'flip' : 'info'} size={18} />
      </button>
    </div>
  )
}
