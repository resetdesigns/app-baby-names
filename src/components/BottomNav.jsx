import Icon from './Icon'

// The floating pill. The active item grows into a black pill that shows its label.
export default function BottomNav({ active, matchCount, onSelect }) {
  const items = [
    { id: 'swipe', label: 'Swipe', icon: 'swipe' },
    { id: 'review', label: 'Review', icon: 'review' },
    { id: 'matches', label: 'Matches', icon: 'heart', badge: matchCount },
    { id: 'settings', label: 'Settings', icon: 'user' },
  ]
  return (
    <nav className="tabs" aria-label="Main">
      {items.map((item) => (
        <button
          key={item.id}
          className={active === item.id ? 'active' : ''}
          onClick={() => onSelect(item.id)}
          aria-label={item.badge > 0 ? `${item.label} (${item.badge})` : item.label}
          aria-current={active === item.id ? 'page' : undefined}
        >
          <span className="tab-icon">
            <Icon name={item.icon} size={22} />
            {item.badge > 0 && <span className="badge">{item.badge}</span>}
          </span>
          <span className="tab-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
