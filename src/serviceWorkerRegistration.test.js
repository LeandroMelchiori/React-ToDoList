import { registerServiceWorker } from './serviceWorkerRegistration';

describe('service worker registration', () => {
  afterEach(() => {
    delete window.navigator.serviceWorker;
    vi.restoreAllMocks();
  });

  test('registers the service worker after window load when enabled', () => {
    const register = vi.fn(() => Promise.resolve());
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    registerServiceWorker({ enabled: true });
    window.dispatchEvent(new Event('load'));

    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  test('does not register the service worker when disabled', () => {
    const register = vi.fn(() => Promise.resolve());
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    registerServiceWorker({ enabled: false });
    window.dispatchEvent(new Event('load'));

    expect(register).not.toHaveBeenCalled();
  });
});
