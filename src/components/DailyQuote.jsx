import { useEffect } from 'react'
import Icon from './Icon'

// Full-screen love note, shown the first time you open the app each day.
export default function DailyQuote({ user, quote, onProceed }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onProceed()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onProceed])

  return (
    <div className="quote-screen" role="dialog" aria-modal="true" aria-label="Today's love note">
      <div className="quote-card">
        <span className="quote-badge" aria-hidden="true">
          <Icon name="heart" size={30} filled />
        </span>
        <p className="quote-eyebrow">For you today, {user}</p>
        <blockquote className="quote-text">
          <span className="quote-mark" aria-hidden="true">
            &ldquo;
          </span>
          {quote.text}
        </blockquote>
        {quote.by && <p className="quote-by">{quote.by}</p>}
        <p className="quote-why">This is why we&apos;re doing it: for our baby boy.</p>
        <button className="quote-go" onClick={onProceed} autoFocus>
          Proceed to Name Matching <Icon name="chevrons" size={18} />
        </button>
      </div>
    </div>
  )
}
