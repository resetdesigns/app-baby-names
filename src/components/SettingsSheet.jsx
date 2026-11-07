import { useState } from 'react'
import { canVibrate, hapticsEnabled, setHapticsEnabled } from '../lib/haptics'

// Settings: the shared last name, plus per-device options (install, vibration).
export default function SettingsSheet({ lastName, install, onSave, onClose, onLeave }) {
  const [value, setValue] = useState(lastName)
  const [vibrate, setVibrate] = useState(hapticsEnabled)

  function handleSubmit(e) {
    e.preventDefault()
    onSave(value.trim())
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Settings">
      <form className="sheet" onSubmit={handleSubmit}>
        <h2>
          <span className="hl">Settings</span>
        </h2>
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

        {canVibrate && (
          <label className="check">
            <input
              type="checkbox"
              checked={vibrate}
              onChange={(e) => {
                setVibrate(e.target.checked)
                setHapticsEnabled(e.target.checked)
              }}
            />
            Vibrate on swipes and matches (this device)
          </label>
        )}

        {!install.installed && (
          <div className="install">
            <strong>Add to your home screen</strong>
            {install.canPrompt ? (
              <>
                <p className="hint">Open it like any other app, full screen, with its own icon.</p>
                <button type="button" className="ghost" onClick={install.promptInstall}>
                  Install app
                </button>
              </>
            ) : install.isIos ? (
              <p className="hint">In Safari, tap the Share button, then Add to Home Screen.</p>
            ) : (
              <p className="hint">
                In your browser menu, choose Install app or Add to Home screen.
              </p>
            )}
          </div>
        )}

        <button type="submit" className="primary">
          Save
        </button>
        <button type="button" className="ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="link leave" onClick={onLeave}>
          Switch person or room
        </button>
      </form>
    </div>
  )
}
