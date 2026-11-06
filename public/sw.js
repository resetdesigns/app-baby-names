// Minimal service worker. It exists so phones treat the site as an installable app.
// It deliberately caches nothing: every visit loads the latest deploy from Netlify.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
