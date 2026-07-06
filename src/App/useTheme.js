import React from 'react';

const THEME_STORAGE_KEY = 'THEME_V1';
const THEMES = {
  light: 'light',
  dark: 'dark',
};

function getStoredTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return Object.values(THEMES).includes(storedTheme) ? storedTheme : THEMES.light;
  } catch {
    return THEMES.light;
  }
}

function useTheme() {
  const [theme, setTheme] = React.useState(getStoredTheme);

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
