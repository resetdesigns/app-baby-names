import { useRef, useState } from 'react'
import DETAILS from '../data/nameDetails'
import { fullNameFor } from '../lib/room'
import { canSpeak, speak } from '../lib/speak'

const THRESHOLD = 90 // pixels dragged before a swipe counts
const TAP_SLOP = 6 // less movement than this is a tap, which flips the card

// Keeps presses on inner buttons from starting a card drag.
const stop = (e) => e.stopPropagation()

// One big name card. Drag it (touch or mouse) or use the buttons on the screen.
// Tap it (or the info button) to flip it and see the origin, meaning and full-name preview.
// `leaving` is 'left' | 'right' | null and is controlled by the parent.
export default function NameCard({ name, lastName, leaving, onDecide }) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const startX = useRef(null)

  const details = DETAILS[name]
  const fullName = fullNameFor(name, lastName)

  function handlePointerDown(e) {
    if (leaving) return
    startX.current = e.clientX
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (startX.current === null) return
    setDx(e.clientX - startX.current)
  }

  function handlePointerUp(e) {
    if (startX.current === null) return
    const moved = e.clientX - startX.current
    startX.current = null
    setDragging(false)
    if (Math.abs(moved) > THRESHOLD) {
      onDecide(moved > 0)
      return
    }
    setDx(0)
    if (Math.abs(moved) < TAP_SLOP) setFlipped((f) => !f)
  }

  function handlePointerCancel() {
    startX.current = null
    setDragging(false)
    setDx(0)
  }

  const offset = leaving ? (leaving === 'right' ? 520 : -520) : dx
  const style = {
    transform: `translateX(${offset}px) rotate(${offset / 18}deg)`,
    transition: dragging ? 'none' : 'transform 0.18s ease',
  }
  const likeOpacity = leaving === 'right' ? 1 : Math.max(0, Math.min(1, dx / THRESHOLD))
  const passOpacity = leaving === 'left' ? 1 : Math.max(0, Math.min(1, -dx / THRESHOLD))
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
        <div className="face front" aria-hidden={flipped}>
          <div className="card-name">{name}</div>
          {lastName && <div className="card-fullname">{fullName}</div>}
          <div className="flip-hint">Tap for meaning</div>
        </div>

        <div className="face back" aria-hidden={!flipped}>
          <div className="back-name">{name}</div>
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
          {lastName && <p className="back-full">{fullName}</p>}
          <div className="back-actions">
            {canSpeak && (
              <button
                className="mini"
                tabIndex={flipped ? 0 : -1}
                onPointerDown={stop}
                onClick={() => speak(fullName)}
              >
                Hear it
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
              Look it up ↗
            </a>
          </div>
          <div className="flip-hint">Tap to flip back</div>
        </div>
      </div>

      <span className="stamp stamp-like" style={{ opacity: likeOpacity }}>
        LIKE
      </span>
      <span className="stamp stamp-pass" style={{ opacity: passOpacity }}>
        PASS
      </span>
      <button
        className="flip-btn"
        onPointerDown={stop}
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Show the name' : 'Show origin and meaning'}
      >
        {flipped ? '↺' : 'ⓘ'}
      </button>
    </div>
  )
}
