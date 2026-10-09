import React from 'react';
import { CalendarWorkspace } from '../features/calendars/CalendarWorkspace';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import { PwaStatus } from './components/PwaStatus/PwaStatus';
import { useTheme } from './hooks/useTheme';
import { usePwaStatus } from './hooks/usePwaStatus';

function App() {
  const { isDarkTheme, toggleTheme } = useTheme();
  const pwa = usePwaStatus();

  return (
    <CalendarWorkspace
      isDarkTheme={isDarkTheme}
      onToggleTheme={toggleTheme}
      appearanceControl={<ThemeToggle isDarkTheme={isDarkTheme} onToggleTheme={toggleTheme} />}
      status={<PwaStatus
        hasUpdate={pwa.hasUpdate}
        isOfflineReady={pwa.isOfflineReady}
        isOnline={pwa.isOnline}
        onApplyUpdate={pwa.applyUpdate}
      />}
    />
  );
}

export default App;
