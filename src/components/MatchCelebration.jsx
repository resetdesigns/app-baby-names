import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { BUZZ, buzz } from '../lib/haptics'
import Icon from './Icon'

function fireConfetti() {
  const base = { disableForReducedMotion: true, colors: ['#3a74ff', '#7cc3ff', '#ffffff', '#c3d9ff', '#0c1226'] }
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
    buzz(title === "It's decided!" ? BUZZ.final : BUZZ.match)
    const t = fireConfetti()
    return () => clearTimeout(t)
  }, [name, title])

  const label = continueLabel ?? (moreCount > 0 ? `Next match (${moreCount} more)` : 'Keep swiping')

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="pop">
        <span className="pop-badge" aria-hidden="true">
          <Icon name="heart" size={34} filled />
        </span>
        <p className="pop-title">{title}</p>
        <p className="pop-name">
          <span className="hl">{name}</span>
        </p>
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
