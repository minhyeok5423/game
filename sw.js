/* 재의 시대 서비스 워커: 게임 파일은 네트워크 우선(업데이트 즉시 반영), 오프라인이면 캐시 */
const V = 'cx-sw-v1';
const CORE = ['./index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const FONT = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === location.origin;
  if (!same && !FONT.test(r.url)) return; /* 친구 랭킹(Firebase) 등은 건드리지 않음 */
  if (r.mode === 'navigate' || (same && /\.html?$/.test(u.pathname))) {
    e.respondWith(fetch(r).then(res => {
      const cp = res.clone(); caches.open(V).then(c => c.put('./index.html', cp)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)).catch(() => {}); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
