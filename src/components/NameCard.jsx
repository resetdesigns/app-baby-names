import { useRef, useState } from 'react'

const THRESHOLD = 90 // pixels dragged before a swipe counts

// One big name card. Drag it (touch or mouse) or use the buttons on the screen.
// `leaving` is 'left' | 'right' | null and is controlled by the parent.
export default function NameCard({ name, leaving, onDecide }) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(null)

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
    } else {
      setDx(0)
    }
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

  return (
    <div
      className="card"
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <span className="stamp stamp-like" style={{ opacity: likeOpacity }}>
        LIKE
      </span>
      <span className="stamp stamp-pass" style={{ opacity: passOpacity }}>
        PASS
      </span>
      <div className="card-name">{name}</div>
    </div>
  )
}
