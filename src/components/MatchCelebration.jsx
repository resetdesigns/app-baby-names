import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { BUZZ, buzz } from '../lib/haptics'
import Icon from './Icon'

function fireConfetti(origin) {
  const base = { disableForReducedMotion: true, colors: ['#3a74ff', '#7cc3ff', '#ffffff', '#c3d9ff', '#0c1226'] }
  confetti({ ...base, particleCount: 110, spread: 80, origin })
  return setTimeout(() => {
    confetti({ ...base, particleCount: 70, spread: 120, startVelocity: 35, origin })
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
  const badge = useRef(null)

  useEffect(() => {
    buzz(title === "It's decided!" ? BUZZ.final : BUZZ.match)
    const rect = badge.current?.getBoundingClientRect()
    const origin = rect
      ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight }
      : { y: 0.6 }
    const t = fireConfetti(origin)
    return () => clearTimeout(t)
  }, [name, title])

  const label = continueLabel ?? (moreCount > 0 ? `Next match (${moreCount} more)` : 'Keep swiping')

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="pop">
        <span className="pop-badge" aria-hidden="true" ref={badge}>
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
