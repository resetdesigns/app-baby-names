import { useState } from 'react'

// Shared settings for the room. Right now that is just your last name,
// so every name can be previewed as a full name.
export default function SettingsSheet({ lastName, onSave, onClose }) {
  const [value, setValue] = useState(lastName)

  function handleSubmit(e) {
    e.preventDefault()
    onSave(value.trim())
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Settings">
      <form className="sheet" onSubmit={handleSubmit}>
        <h2>Settings</h2>
        <label>
          Your baby&apos;s last name
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Rivera"
            maxLength={30}
            autoComplete="off"
            autoFocus
          />
        </label>
        <p className="hint">
          Shared with your partner. Every name shows as a full name, and you can hear it read aloud.
        </p>
        <button type="submit" className="primary">
          Save
        </button>
        <button type="button" className="ghost" onClick={onClose}>
          Cancel
        </button>
      </form>
    </div>
  )
}
