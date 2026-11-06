import { useEffect } from 'react'
import confetti from 'canvas-confetti'

function fireConfetti() {
  const base = { disableForReducedMotion: true, colors: ['#000000', '#ffffff', '#888888'] }
  confetti({ ...base, particleCount: 110, spread: 80, origin: { y: 0.6 } })
  return setTimeout(() => {
    confetti({ ...base, particleCount: 70, spread: 120, startVelocity: 35, origin: { y: 0.55 } })
  }, 220)
}

// Full-screen "It's a match!" pop. Shows one new match at a time.
export default function MatchCelebration({ name, moreCount, onContinue, onViewAll }) {
  useEffect(() => {
    const t = fireConfetti()
    return () => clearTimeout(t)
  }, [name])

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="It's a match">
      <div className="pop">
        <p className="pop-title">It&apos;s a match!</p>
        <p className="pop-name">{name}</p>
        <p className="muted">You both liked this one.</p>
        <button className="primary" onClick={onContinue}>
          {moreCount > 0 ? `Next match (${moreCount} more)` : 'Keep swiping'}
        </button>
        <button className="ghost" onClick={onViewAll}>
          See all matches
        </button>
      </div>
    </div>
  )
}
