import { describe, expect, test } from 'vitest';
import { DEFAULT_TODO_SETTINGS, normalizeTodoSettings } from './useTodoSettings';

describe('todo settings', () => {
  test('normalizes persisted preferences', () => {
    expect(normalizeTodoSettings({
      defaultView: 'week',
      density: 'compact',
      showQuickAdd: false,
    })).toEqual({
      defaultView: 'week',
      density: 'compact',
      showQuickAdd: false,
    });
  });

  test('falls back for invalid settings', () => {
    expect(normalizeTodoSettings({
      defaultView: 'timeline',
      density: 'tiny',
      showQuickAdd: 'yes',
    })).toEqual(DEFAULT_TODO_SETTINGS);
  });
});
