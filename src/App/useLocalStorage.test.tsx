import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getStoredItem, setStoredItem } from './todoStorage';
import { useLocalStorage } from './useLocalStorage';

vi.mock('./todoStorage', () => ({
  getStoredItem: vi.fn(),
  setStoredItem: vi.fn(),
}));

const mockedGetStoredItem = vi.mocked(getStoredItem);
const mockedSetStoredItem = vi.mocked(setStoredItem);
const INITIAL_ITEMS: string[] = [];

describe('useLocalStorage persistence', () => {
  beforeEach(() => {
    mockedGetStoredItem.mockReset();
    mockedSetStoredItem.mockReset();
    mockedGetStoredItem.mockResolvedValue('["Tarea existente"]');
    mockedSetStoredItem.mockResolvedValue();
  });

  test('skips storage writes when serialized content has not changed', async () => {
    const { result } = renderHook(() => (
      useLocalStorage<string[]>('TEST_KEY', INITIAL_ITEMS, Array.isArray)
    ));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.saveItem(['Tarea existente']));

    expect(result.current.item).toEqual(['Tarea existente']);
    expect(mockedSetStoredItem).not.toHaveBeenCalled();
  });

  test('retries unchanged content after a failed storage write', async () => {
    mockedSetStoredItem
      .mockRejectedValueOnce(new Error('Storage unavailable'))
      .mockResolvedValueOnce();
    const { result } = renderHook(() => (
      useLocalStorage<string[]>('TEST_KEY', INITIAL_ITEMS, Array.isArray)
    ));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.saveItem(['Tarea nueva']));
    await waitFor(() => expect(result.current.error).toBe(true));
    act(() => result.current.saveItem(['Tarea nueva']));

    await waitFor(() => expect(mockedSetStoredItem).toHaveBeenCalledTimes(2));
  });
});
