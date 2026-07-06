function registerServiceWorker({ enabled = import.meta.env.PROD } = {}) {
  if (!enabled || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, { once: true });
}

export { registerServiceWorker };
