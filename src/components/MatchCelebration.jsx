import { useEffect } from 'react'
import confetti from 'canvas-confetti'

function fireConfetti() {
  const base = { disableForReducedMotion: true, colors: ['#000000', '#ffffff', '#888888'] }
  confetti({ ...base, particleCount: 110, spread: 80, origin: { y: 0.6 } })
  return setTimeout(() => {
    confetti({ ...base, particleCount: 70, spread: 120, startVelocity: 35, origin: { y: 0.55 } })
  }, 220)
}

// Full-screen pop with confetti. Used for new matches and for the final pick.
export default function MatchCelebration({
  title = "It's a match!",
  name,
  caption = 'You both liked this one.',
  moreCount = 0,
  continueLabel,
  onContinue,
  onViewAll,
}) {
  useEffect(() => {
    const t = fireConfetti()
    return () => clearTimeout(t)
  }, [name])

  const label = continueLabel ?? (moreCount > 0 ? `Next match (${moreCount} more)` : 'Keep swiping')

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="pop">
        <p className="pop-title">{title}</p>
        <p className="pop-name">{name}</p>
        <p className="muted">{caption}</p>
        <button className="primary" onClick={onContinue}>
          {label}
        </button>
        {onViewAll && (
          <button className="ghost" onClick={onViewAll}>
            See all matches
          </button>
        )}
      </div>
    </div>
  )
}
