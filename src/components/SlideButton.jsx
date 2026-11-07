import { useRef, useState } from 'react'
import Icon from './Icon'

const TAP_SLOP = 6
const KNOB = 52
const GAP = 6

// A submit button with a heart knob. Drag the knob across to go, or just tap/press it.
// It stays a normal submit button, so keyboards and screen readers work as usual.
export default function SlideButton({ children, disabled }) {
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef(null)
  const moved = useRef(false)
  const button = useRef(null)

  const maxX = () => (button.current?.offsetWidth ?? 280) - KNOB - GAP * 2

  function handlePointerDown(e) {
    if (disabled) return
    start.current = e.clientX
    moved.current = false
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (start.current === null) return
    const dx = e.clientX - start.current
    if (Math.abs(dx) >= TAP_SLOP) moved.current = true
    setX(Math.max(0, Math.min(maxX(), dx)))
  }

  function handlePointerUp() {
    if (start.current === null) return
    start.current = null
    setDragging(false)
    if (moved.current && x > maxX() * 0.8) {
      setX(maxX())
      button.current?.form?.requestSubmit()
      setTimeout(() => setX(0), 500)
    } else {
      setX(0)
    }
  }

  return (
    <button
      ref={button}
      type="submit"
      className="primary slide"
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={(e) => {
        // A drag is handled on release; only a plain tap should submit by click.
        if (moved.current) {
          e.preventDefault()
          moved.current = false
        }
      }}
    >
      <span
        className="slide-knob"
        style={{ transform: `translateX(${x}px)`, transition: dragging ? 'none' : 'transform 0.25s ease' }}
      >
        <Icon name="heart" size={22} filled />
      </span>
      <span className="slide-label">{children}</span>
      <Icon name="chevrons" size={22} className="slide-chevrons" />
    </button>
  )
}
