import { useState } from 'react'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export default function App() {
  const [status, setStatus] = useState('Not tested yet')

  async function testConnection() {
    try {
      setStatus('Testing...')
      const ref = doc(db, 'connectionTest', 'ping')
      await setDoc(ref, { ok: true, at: serverTimestamp() })
      const snap = await getDoc(ref)
      setStatus(snap.exists() ? 'Connected to Firestore' : 'Wrote, but could not read back')
    } catch (err) {
      setStatus('Error: ' + err.message)
    }
  }

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1>Baby Names</h1>
      <button onClick={testConnection}>Test Firestore connection</button>
      <p>{status}</p>
    </div>
  )
}
