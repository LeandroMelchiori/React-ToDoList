import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useOrders } from './useOrders';
import { getStoredItem, setStoredItems } from '../sync/storage';
import { normalizeOrder, ORDERS_STORAGE_KEY } from '../../shared/orders/orderModel';
vi.mock('../sync/storage', () => ({ getStoredItem: vi.fn(), setStoredItems: vi.fn() }));
const order = normalizeOrder({ id: 'test', customerName: 'Ana', items: [{ description: 'Servicio', quantity: 1 }] })!;
describe('useOrders', () => {
  beforeEach(() => { vi.resetAllMocks(); vi.mocked(getStoredItem).mockResolvedValue(null); vi.mocked(setStoredItems).mockResolvedValue(); });
  test('persists a manual order and reloads it without requiring a backend', async () => {
    const { result } = renderHook(useOrders);
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => expect((await result.current.saveOrder(order)).ok).toBe(true));
    expect(result.current.orders[0].customerName).toBe('Ana');
    expect(setStoredItems).toHaveBeenCalledWith({ [ORDERS_STORAGE_KEY]: expect.any(String) });
  });
  test('does not report success or change state when persistence fails', async () => {
    const { result } = renderHook(useOrders);
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(setStoredItems).mockRejectedValue(new Error('quota'));
    await act(async () => expect((await result.current.saveOrder(order)).ok).toBe(false));
    expect(result.current.orders).toEqual([]);
    expect(result.current.saving).toBe(false);
  });
  test('preserves unknown or corrupted storage instead of replacing it with an empty list', async () => {
    vi.mocked(getStoredItem).mockResolvedValue('{"version":99,"orders":[]}');
    const { result } = renderHook(useOrders);
    await waitFor(() => expect(result.current.error).toMatch(/versión/));
    expect(setStoredItems).not.toHaveBeenCalled();
  });
  test('asks for refresh on external changes before overwriting another tab', async () => {
    const { result } = renderHook(useOrders);
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: ORDERS_STORAGE_KEY })));
    await act(async () => expect((await result.current.saveOrder(order)).ok).toBe(false));
    vi.mocked(getStoredItem).mockResolvedValue(JSON.stringify({ version: 1, orders: [order] }));
    await act(async () => { await result.current.reload(); });
    expect(result.current.orders).toEqual([order]);
    expect(result.current.hasExternalChanges).toBe(false);
  });
});
