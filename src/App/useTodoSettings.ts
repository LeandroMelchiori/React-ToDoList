import React from 'react';

type TodoDensity = 'comfortable' | 'compact';
type TodoDefaultView = 'list' | 'today' | 'board' | 'calendar' | 'week';

type TodoSettings = {
  defaultView: TodoDefaultView;
  density: TodoDensity;
  showQuickAdd: boolean;
};

const TODO_SETTINGS_STORAGE_KEY = 'TODO_SETTINGS_V1';
const DEFAULT_TODO_SETTINGS: TodoSettings = {
  defaultView: 'list',
  density: 'comfortable',
  showQuickAdd: true,
};

const VALID_VIEWS: TodoDefaultView[] = ['list', 'today', 'board', 'calendar', 'week'];
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

    return storedSettings
      ? normalizeTodoSettings(JSON.parse(storedSettings))
      : DEFAULT_TODO_SETTINGS;
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
