/* Change VERSION whenever the deployed app shell changes. */
const VERSION = '2026-10-24-group-1';
const BASE = new URL('./', self.location.href);
const PREFIX = 'lvtie-' + encodeURIComponent(BASE.pathname) + '-';
const CACHE = PREFIX + VERSION;
const ART = ["art/au-gold-coast-night.webp", "art/au-gold-coast.webp", "art/au-sydney-opera-house-night.webp", "art/au-sydney-opera-house.webp", "art/au-uluru-night.webp", "art/au-uluru.webp", "art/ca-cn-tower-night.webp", "art/ca-cn-tower.webp", "art/ca-moraine-lake-night.webp", "art/ca-moraine-lake.webp", "art/ca-niagara-night.webp", "art/ca-niagara.webp", "art/ch-chapel-bridge-night.webp", "art/ch-chapel-bridge.webp", "art/ch-jungfrau-night.webp", "art/ch-jungfrau.webp", "art/ch-matterhorn-night.webp", "art/ch-matterhorn.webp", "art/cn-great-wall-night.webp", "art/cn-great-wall.webp", "art/cn-shanghai-night.webp", "art/cn-shanghai.webp", "art/cn-temple-of-heaven-night.webp", "art/cn-temple-of-heaven.webp", "art/de-brandenburg-gate-night.webp", "art/de-brandenburg-gate.webp", "art/de-cologne-night.webp", "art/de-cologne.webp", "art/de-neuschwanstein-night.webp", "art/de-neuschwanstein.webp", "art/eg-felucca-night.webp", "art/eg-felucca.webp", "art/eg-giza-pyramids-night.webp", "art/eg-giza-pyramids.webp", "art/eg-karnak-night.webp", "art/eg-karnak.webp", "art/es-alhambra-night.webp", "art/es-alhambra.webp", "art/es-giralda-night.webp", "art/es-giralda.webp", "art/es-sagrada-familia-night.webp", "art/es-sagrada-familia.webp", "art/fr-arc-de-triomphe-night.webp", "art/fr-arc-de-triomphe.webp", "art/fr-eiffel-tower-night.webp", "art/fr-eiffel-tower.webp", "art/fr-mont-saint-michel-night.webp", "art/fr-mont-saint-michel.webp", "art/gb-big-ben-night.webp", "art/gb-big-ben.webp", "art/gb-stonehenge-night.webp", "art/gb-stonehenge.webp", "art/gb-tower-bridge-night.webp", "art/gb-tower-bridge.webp", "art/id-borobudur-night.webp", "art/id-borobudur.webp", "art/id-bromo-night.webp", "art/id-bromo.webp", "art/id-pura-ulun-danu-night.webp", "art/id-pura-ulun-danu.webp", "art/in-ganges-night.webp", "art/in-ganges.webp", "art/in-hawa-mahal-night.webp", "art/in-hawa-mahal.webp", "art/in-taj-mahal-night.webp", "art/in-taj-mahal.webp", "art/it-colosseum-night.webp", "art/it-colosseum.webp", "art/it-pisa-night.webp", "art/it-pisa.webp", "art/it-venice-night.webp", "art/it-venice.webp", "art/jp-fuji-night.webp", "art/jp-fuji.webp", "art/jp-kiyomizu-night.webp", "art/jp-kiyomizu.webp", "art/jp-osaka-castle-night.webp", "art/jp-osaka-castle.webp", "art/kr-gamcheon-night.webp", "art/kr-gamcheon.webp", "art/kr-gyeongbokgung-night.webp", "art/kr-gyeongbokgung.webp", "art/kr-n-seoul-tower-night.webp", "art/kr-n-seoul-tower.webp", "art/my-kinabalu-night.webp", "art/my-kinabalu.webp", "art/my-melaka-night.webp", "art/my-melaka.webp", "art/my-petronas-towers-night.webp", "art/my-petronas-towers.webp", "art/nl-canal-houses-night.webp", "art/nl-canal-houses.webp", "art/nl-tulips-night.webp", "art/nl-tulips.webp", "art/nl-windmill-night.webp", "art/nl-windmill.webp", "art/nz-milford-sound-night.webp", "art/nz-milford-sound.webp", "art/nz-sky-tower-night.webp", "art/nz-sky-tower.webp", "art/nz-tekapo-night.webp", "art/nz-tekapo.webp", "art/ph-boracay-night.webp", "art/ph-boracay.webp", "art/ph-chocolate-hills-night.webp", "art/ph-chocolate-hills.webp", "art/ph-mayon-night.webp", "art/ph-mayon.webp", "art/sg-marina-bay-sands-night.webp", "art/sg-marina-bay-sands.webp", "art/sg-merlion-night.webp", "art/sg-merlion.webp", "art/sg-shophouses-night.webp", "art/sg-shophouses.webp", "art/th-ayutthaya-night.webp", "art/th-ayutthaya.webp", "art/th-floating-market-night.webp", "art/th-floating-market.webp", "art/th-wat-arun-night.webp", "art/th-wat-arun.webp", "art/tr-blue-mosque-night.webp", "art/tr-blue-mosque.webp", "art/tr-cappadocia-night.webp", "art/tr-cappadocia.webp", "art/tr-pamukkale-night.webp", "art/tr-pamukkale.webp", "art/tw-jiufen-night.webp", "art/tw-jiufen.webp", "art/tw-sun-moon-lake-night.webp", "art/tw-sun-moon-lake.webp", "art/tw-taipei-101-night.webp", "art/tw-taipei-101.webp", "art/us-golden-gate-night.webp", "art/us-golden-gate.webp", "art/us-grand-canyon-night.webp", "art/us-grand-canyon.webp", "art/us-statue-of-liberty-night.webp", "art/us-statue-of-liberty.webp", "art/vn-ha-long-bay-night.webp", "art/vn-ha-long-bay.webp", "art/vn-hoi-an-night.webp", "art/vn-hoi-an.webp", "art/vn-sapa-terraces-night.webp", "art/vn-sapa-terraces.webp"];
const SHELL = ['index.html', 'season.js', 'core.js', 'pwa.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', ...ART].map(p => new URL(p, BASE).href);
const ENTRY = SHELL[0];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'OFFLINE_STATUS' && event.ports[0]) {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE);
      const ready = (await Promise.all(SHELL.map(url => cache.match(url)))).every(Boolean);
      event.ports[0].postMessage({ ready, version: VERSION });
    })());
  }
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      /* Serve the installed shell as a unit, avoiding mixed versions. */
      const cached = await (await caches.open(CACHE)).match(ENTRY);
      return cached || fetch(request);
    })());
    return;
  }
  if (!SHELL.includes(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE), cached = await cache.match(request);
    return cached || fetch(request);
  })());
});
