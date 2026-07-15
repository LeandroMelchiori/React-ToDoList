const CACHE_PREFIX = 'taskflow-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const MANIFEST_CACHE_KEY = '/__taskflow_asset_manifest__';
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/react192.png',
  '/react512.png',
];

function getShellAssets(html) {
  const assets = new Set(CORE_ASSETS);
  const assetPattern = /(?:src|href)="([^"]+)"/g;
  let match = assetPattern.exec(html);

  while (match) {
    const assetUrl = new URL(match[1], self.location.origin);

    if (assetUrl.origin === self.location.origin) {
      assets.add(`${assetUrl.pathname}${assetUrl.search}`);
    }

    match = assetPattern.exec(html);
  }

  return [...assets];
}

function getAssetDependencies(asset, source) {
  const dependencies = new Set();
  const dependencyPattern = /["'`]([^"'`]+\.(?:css|js|woff2?))["'`]/g;
  let match = dependencyPattern.exec(source);

  while (match) {
    const dependency = match[1];
    const dependencyBase = dependency.startsWith('assets/') || dependency.startsWith('fonts/')
      ? new URL('/', self.location.origin)
      : new URL(asset, self.location.origin);
    const dependencyUrl = new URL(dependency, dependencyBase);

    if (
      dependencyUrl.origin === self.location.origin &&
      (dependencyUrl.pathname.startsWith('/assets/') || dependencyUrl.pathname.startsWith('/fonts/'))
    ) {
      dependencies.add(`${dependencyUrl.pathname}${dependencyUrl.search}`);
    }

    match = dependencyPattern.exec(source);
  }

  return [...dependencies];
}

async function cacheAssetTree(cache, initialAssets) {
  const assets = new Set(initialAssets);
  const pendingAssets = initialAssets.filter(asset => asset !== '/');

  while (pendingAssets.length > 0) {
    const asset = pendingAssets.shift();
    const response = await fetch(asset, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Could not cache ${asset}.`);
    }

    const sourceResponse = response.clone();
    await cache.put(asset, response);

    if (new URL(asset, self.location.origin).pathname.endsWith('.js')) {
      const dependencies = getAssetDependencies(asset, await sourceResponse.text());

      dependencies.forEach(dependency => {
        if (!assets.has(dependency)) {
          assets.add(dependency);
          pendingAssets.push(dependency);
        }
      });
    }
  }

  return [...assets];
}

async function cacheCurrentShell() {
  const shellResponse = await fetch('/', { cache: 'no-store' });

  if (!shellResponse.ok) {
    throw new Error('Could not load the TaskFlow shell.');
  }

  const shellHtml = await shellResponse.clone().text();
  const shellAssets = getShellAssets(shellHtml);
  const cache = await caches.open(CACHE_NAME);

  await cache.put('/', shellResponse);
  const cachedAssets = await cacheAssetTree(cache, shellAssets);
  await cache.put(
    MANIFEST_CACHE_KEY,
    new Response(JSON.stringify(cachedAssets), {
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

async function removeObsoleteCaches() {
  const cacheNames = await caches.keys();

  await Promise.all(cacheNames
    .filter(cacheName => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
    .map(cacheName => caches.delete(cacheName)));
}

async function removeObsoleteAssets() {
  const cache = await caches.open(CACHE_NAME);
  const manifestResponse = await cache.match(MANIFEST_CACHE_KEY);

  if (!manifestResponse) {
    return;
  }

  const currentAssets = new Set(await manifestResponse.json());
  currentAssets.add(MANIFEST_CACHE_KEY);
  const cachedRequests = await cache.keys();

  await Promise.all(cachedRequests.map(request => {
    const requestUrl = new URL(request.url);
    const cacheKey = `${requestUrl.pathname}${requestUrl.search}`;

    return currentAssets.has(cacheKey) ? false : cache.delete(request);
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(cacheCurrentShell());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      removeObsoleteCaches(),
      removeObsoleteAssets(),
    ])
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/', responseClone));
          return response;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => (
      cache.match(`${requestUrl.pathname}${requestUrl.search}`, { ignoreVary: true })
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).then(response => {
            if (response.ok && response.type === 'basic') {
              const responseClone = response.clone();
              cache.put(event.request, responseClone);
            }

            return response;
          });
        })
    )),
  );
});
