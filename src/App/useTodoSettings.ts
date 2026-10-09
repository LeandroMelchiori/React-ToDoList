import React from 'react';

type TodoDensity = 'comfortable' | 'compact';
type TodoDefaultView = 'list' | 'today' | 'agenda' | 'board' | 'calendar' | 'week';

type TodoSettings = {
  defaultView: TodoDefaultView;
  density: TodoDensity;
  showQuickAdd: boolean;
};

const TODO_SETTINGS_STORAGE_KEY = 'TODO_SETTINGS_V2';
const LEGACY_TODO_SETTINGS_STORAGE_KEY = 'TODO_SETTINGS_V1';
const DEFAULT_TODO_SETTINGS: TodoSettings = {
  defaultView: 'agenda',
  density: 'comfortable',
  showQuickAdd: true,
};

const VALID_VIEWS: TodoDefaultView[] = ['list', 'today', 'agenda', 'board', 'calendar', 'week'];
const VALID_DENSITIES: TodoDensity[] = ['comfortable', 'compact'];

function normalizeTodoSettings(value: unknown): TodoSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_TODO_SETTINGS;
  }

  const settings = value as Partial<TodoSettings>;

  return {
    defaultView: VALID_VIEWS.includes(settings.defaultView as TodoDefaultView)
      ? settings.defaultView as TodoDefaultView
      : DEFAULT_TODO_SETTINGS.defaultView,
    density: VALID_DENSITIES.includes(settings.density as TodoDensity)
      ? settings.density as TodoDensity
      : DEFAULT_TODO_SETTINGS.density,
    showQuickAdd: typeof settings.showQuickAdd === 'boolean'
      ? settings.showQuickAdd
      : DEFAULT_TODO_SETTINGS.showQuickAdd,
  };
}

function readTodoSettings(): TodoSettings {
  try {
    const storedSettings = localStorage.getItem(TODO_SETTINGS_STORAGE_KEY);

    if (storedSettings) {
      return normalizeTodoSettings(JSON.parse(storedSettings));
    }

    const legacySettings = localStorage.getItem(LEGACY_TODO_SETTINGS_STORAGE_KEY);

    if (!legacySettings) {
      return DEFAULT_TODO_SETTINGS;
    }

    const normalizedLegacySettings = normalizeTodoSettings(JSON.parse(legacySettings));

    return {
      ...DEFAULT_TODO_SETTINGS,
      density: normalizedLegacySettings.density,
      showQuickAdd: normalizedLegacySettings.showQuickAdd,
    };
  } catch {
    return DEFAULT_TODO_SETTINGS;
  }
}

function useTodoSettings() {
  const [settings, setSettings] = React.useState<TodoSettings>(readTodoSettings);

  React.useEffect(() => {
    try {
      localStorage.setItem(TODO_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Preferences remain usable for the current session when storage is unavailable.
    }
  }, [settings]);

  React.useEffect(() => {
    const synchronizeSettings = (event: StorageEvent) => {
      if (event.key !== TODO_SETTINGS_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        setSettings(normalizeTodoSettings(JSON.parse(event.newValue)));
      } catch {
        setSettings(DEFAULT_TODO_SETTINGS);
      }
    };

    window.addEventListener('storage', synchronizeSettings);

    return () => window.removeEventListener('storage', synchronizeSettings);
  }, []);

  const updateSettings = (nextSettings: Partial<TodoSettings>) => {
    setSettings(currentSettings => normalizeTodoSettings({
      ...currentSettings,
      ...nextSettings,
    }));
  };

  return { settings, updateSettings };
}

export {
  DEFAULT_TODO_SETTINGS,
  TODO_SETTINGS_STORAGE_KEY,
  normalizeTodoSettings,
  useTodoSettings,
};
export type { TodoDefaultView, TodoDensity, TodoSettings };
