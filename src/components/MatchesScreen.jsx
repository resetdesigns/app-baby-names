export default function MatchesScreen({ matches }) {
  if (matches.length === 0) {
    return (
      <section className="matches empty">
        <h2>No matches yet</h2>
        <p className="muted">When you both like the same name, it shows up here.</p>
      </section>
    )
  }

  return (
    <section className="matches">
      <h2>
        {matches.length} {matches.length === 1 ? 'match' : 'matches'}
      </h2>
      <ul className="match-list">
        {matches.map((m) => (
          <li key={m.name}>{m.name}</li>
        ))}
      </ul>
    </section>
  )
}
