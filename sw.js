/* Club app: always loads the latest site from the network (so updates and sign-in work),
   and shows a friendly page if the phone is offline. It never stores profile or ticket data. */
const OFFLINE = 'lrc-offline-v1';
const PAGE = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title>'
 + '<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#052a4b;color:#fff;font:17px Georgia,serif;text-align:center;padding:24px">'
 + '<div><h1 style="font:900 26px Arial,sans-serif;letter-spacing:.04em">YOU\'RE OFFLINE</h1><p>Connect to the internet to open your club profile.<br>Tip: screenshot your QR ticket before an event.</p>'
 + '<p lang="es" style="opacity:.8">Sin conexión. Conéctate para abrir tu perfil.</p></div></body>';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate') return; // only page loads; data calls go straight to the server
  e.respondWith(fetch(r).catch(() => new Response(PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
