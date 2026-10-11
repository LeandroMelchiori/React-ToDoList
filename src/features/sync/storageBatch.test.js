import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';

describe('workspace storage batch', () => {
  beforeEach(() => { vi.resetModules(); localStorage.clear(); });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  test('restores all local keys when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const { setStoredItems } = await import('./storage');
    await setStoredItems({ TODOS_V1: '[]', ORDERS_V1: '{"version":1,"orders":[]}' });
    expect(localStorage.getItem('TODOS_V1')).toBe('[]');
    expect(localStorage.getItem('ORDERS_V1')).toContain('"version":1');
  });
  test('rolls back a failed localStorage fallback rather than leaving half a backup', async () => {
    vi.stubGlobal('indexedDB', undefined);
    localStorage.setItem('TODOS_V1', 'original');
    localStorage.setItem('ORDERS_V1', 'original orders');
    const originalSet = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === 'ORDERS_V1' && value === 'new orders') throw new Error('quota');
      originalSet.call(this, key, value);
    });
    const { setStoredItems } = await import('./storage');
    await expect(setStoredItems({ TODOS_V1: 'new', ORDERS_V1: 'new orders' })).rejects.toThrow('quota');
    expect(localStorage.getItem('TODOS_V1')).toBe('original');
    expect(localStorage.getItem('ORDERS_V1')).toBe('original orders');
  });
  test('uses a single IndexedDB transaction and aborts when a put throws', async () => {
    const transaction = { abort: vi.fn(), objectStore: vi.fn(() => ({ put: vi.fn(() => { throw new Error('clone'); }) })) };
    const db = { transaction: vi.fn(() => transaction), addEventListener: vi.fn() };
    vi.stubGlobal('indexedDB', { open: () => {
      const request = { result: db };
      queueMicrotask(() => request.onsuccess());
      return request;
    } });
    const { setStoredItems } = await import('./storage');
    await expect(setStoredItems({ TODOS_V1: 'new', ORDERS_V1: 'new orders' })).rejects.toThrow('clone');
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(transaction.abort).toHaveBeenCalledOnce();
    expect(localStorage.getItem('TODOS_V1')).toBeNull();
  });
});
