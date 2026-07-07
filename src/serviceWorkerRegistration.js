function dispatchPwaEvent(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function registerServiceWorker({
  enabled = import.meta.env.PROD,
  onReady = () => dispatchPwaEvent('taskflow:pwa-ready'),
  onUpdate = (worker) => dispatchPwaEvent('taskflow:pwa-update', { worker }),
} = {}) {
  if (!enabled || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        if (registration.waiting) {
          onUpdate(registration.waiting);
          return;
        }

        if (registration.active) {
          onReady();
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;

          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state !== 'installed') {
              return;
            }

            if (navigator.serviceWorker.controller) {
              onUpdate(installingWorker);
              return;
            }

            onReady();
          });
        });
      })
      .catch(() => undefined);
  }, { once: true });
}

export { dispatchPwaEvent, registerServiceWorker };
