import { useState } from 'react'

// A small inline form for adding a name of our own to the deck.
// `onAdd` returns an error message, or null when the name was added.
export default function AddNameForm({ onAdd }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [message, setMessage] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    const error = onAdd(value)
    if (error) {
      setMessage({ text: error, bad: true })
      return
    }
    setMessage({ text: `Added ${value.trim()}. Your partner will see it soon.`, bad: false })
    setValue('')
  }

  if (!open) {
    return (
      <button className="link" onClick={() => setOpen(true)}>
        + Add a name
      </button>
    )
  }

  return (
    <form className="add-name" onSubmit={handleSubmit}>
      <div className="add-row">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setMessage(null)
          }}
          placeholder="A name we should consider"
          aria-label="New name"
          maxLength={30}
          autoComplete="off"
          autoFocus
        />
        <button type="submit" className="primary" disabled={value.trim().length < 2}>
          Add
        </button>
      </div>
      {message && (
        <p className={message.bad ? 'hint bad' : 'hint'} role="status">
          {message.text}
        </p>
      )}
      <button
        type="button"
        className="link"
        onClick={() => {
          setOpen(false)
          setMessage(null)
        }}
      >
        Close
      </button>
    </form>
  )
}
