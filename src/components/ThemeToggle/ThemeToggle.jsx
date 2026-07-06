import './ThemeToggle.css';

function ThemeToggle({ isDarkTheme, onToggleTheme }) {
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
