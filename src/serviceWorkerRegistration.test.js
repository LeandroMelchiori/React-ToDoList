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

  test('notifies when the offline shell is ready', async () => {
    const onReady = vi.fn();
    const register = vi.fn(() => Promise.resolve({
      active: {},
      addEventListener: vi.fn(),
      waiting: null,
    }));
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    registerServiceWorker({ enabled: true, onReady });
    window.dispatchEvent(new Event('load'));
    await Promise.resolve();

    expect(onReady).toHaveBeenCalled();
  });

  test('notifies when an updated worker is waiting', async () => {
    const waitingWorker = { postMessage: vi.fn() };
    const onUpdate = vi.fn();
    const register = vi.fn(() => Promise.resolve({
      addEventListener: vi.fn(),
      waiting: waitingWorker,
    }));
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    registerServiceWorker({ enabled: true, onUpdate });
    window.dispatchEvent(new Event('load'));
    await Promise.resolve();

    expect(onUpdate).toHaveBeenCalledWith(waitingWorker);
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
