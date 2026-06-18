// This is the service worker for production. It uses Workbox under the hood
// to precache the build artifacts produced by `react-scripts build`, and to
// apply runtime caching strategies for navigations and static assets.
//
// The CRA build (react-scripts 5) bundles Workbox and auto-injects the
// pre-cache manifest into `self.__WB_MANIFEST` at build time.
//
// - Navigations: NetworkFirst — serves the latest HTML when online, falls
//   back to the most recent cached copy when offline.
// - Static assets (JS, CSS, workers, images): CacheFirst — fast on repeat
//   visits, expires after 30 days.

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

self.skipWaiting();
clientsClaim();

// Precache the build artifacts (injected at build time).
precacheAndRoute(self.__WB_MANIFEST);

// Cache navigation requests (HTML pages) with NetworkFirst.
registerRoute(
  ({ request, url }) =>
    request.mode === 'navigate' && url.origin === self.location.origin,
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Cache same-origin static assets with CacheFirst.
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'worker' ||
      request.destination === 'image' ||
      request.destination === 'font'),
  new CacheFirst({
    cacheName: 'assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);
