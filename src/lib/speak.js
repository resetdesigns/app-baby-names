// Reads a name aloud with the browser's built-in speech (no network, no cost).
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

export function speak(text) {
  if (!canSpeak || !text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}
