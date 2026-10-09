import './ThemeToggle.css';

interface ThemeToggleProps {
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}

function ThemeToggle({ isDarkTheme, onToggleTheme }: ThemeToggleProps) {
  const label = isDarkTheme ? 'Activar modo claro' : 'Activar modo oscuro';

  return (
    <button
      type="button"
      className="ThemeToggle"
      aria-label={label}
      aria-pressed={isDarkTheme}
      onClick={onToggleTheme}
    >
      <span aria-hidden="true">{isDarkTheme ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}

export { ThemeToggle };
