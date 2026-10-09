import React from 'react';

const THEME_STORAGE_KEY = 'THEME_V1';
const THEMES = {
  light: 'light',
  dark: 'dark',
} as const;

export type Theme = typeof THEMES[keyof typeof THEMES];

function getStoredTheme(): Theme {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return Object.values(THEMES).includes(storedTheme as Theme) ? (storedTheme as Theme) : THEMES.light;
  } catch {
    return THEMES.light;
  }
}

function useTheme() {
  const [theme, setTheme] = React.useState<Theme>(getStoredTheme);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme persistence is progressive enhancement; the UI still works without storage.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(currentTheme => (
      currentTheme === THEMES.dark ? THEMES.light : THEMES.dark
    ));
  };

  return {
    theme,
    isDarkTheme: theme === THEMES.dark,
    toggleTheme,
  };
}

export { THEME_STORAGE_KEY, THEMES, useTheme };
