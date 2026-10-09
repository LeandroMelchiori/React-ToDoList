import { act, renderHook } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

test('tracks changes to a media query', () => {
  let listener: ((event: MediaQueryListEvent) => void) | null = null;
  const mediaQuery = {
    matches: true,
    addEventListener: vi.fn((_event: string, nextListener: (event: MediaQueryListEvent) => void) => {
      listener = nextListener;
    }),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => mediaQuery),
  });

  const { result } = renderHook(() => useMediaQuery('(max-width: 640px)'));

  expect(result.current).toBe(true);
  act(() => listener?.({ matches: false } as MediaQueryListEvent));
  expect(result.current).toBe(false);
});
