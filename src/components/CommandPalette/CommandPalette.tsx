import React from 'react';
import './CommandPalette.css';

type CommandPaletteItem = {
  description: string;
  id: string;
  keywords?: string[];
  label: string;
  onSelect: () => void;
  shortcut?: string;
};

interface CommandPaletteProps {
  commands: CommandPaletteItem[];
}

function CommandPalette({ commands }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const filteredCommands = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return commands;
    }

    return commands.filter(command => [
      command.label,
      command.description,
      ...(command.keywords || []),
    ].some(value => value.toLowerCase().includes(normalizedQuery)));
  }, [commands, query]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const runCommand = (command: CommandPaletteItem | undefined) => {
    command?.onSelect();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(currentIndex => filteredCommands.length
        ? (currentIndex + 1) % filteredCommands.length
        : 0);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(currentIndex => filteredCommands.length
        ? (currentIndex - 1 + filteredCommands.length) % filteredCommands.length
        : 0);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(filteredCommands[activeIndex]);
    }
  };

  return (
    <section className="CommandPalette" aria-labelledby="command-palette-title">
      <header>
        <div>
          <span>Acciones rapidas</span>
          <h2 id="command-palette-title">Ir a una accion</h2>
        </div>
        <kbd>Esc</kbd>
      </header>
      <label htmlFor="command-palette-search">Buscar comando</label>
      <input
        aria-activedescendant={filteredCommands[activeIndex] ? `command-${filteredCommands[activeIndex].id}` : undefined}
        aria-controls="command-palette-results"
        aria-expanded="true"
        aria-haspopup="listbox"
        autoComplete="off"
        id="command-palette-search"
        onChange={event => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ej: calendario, crear o buscar"
        role="combobox"
        type="search"
        value={query}
      />
      <div className="CommandPalette-results" id="command-palette-results" role="listbox" aria-label="Comandos disponibles">
        {filteredCommands.map((command, index) => (
          <button
            aria-selected={index === activeIndex}
            className={index === activeIndex ? 'CommandPalette-command CommandPalette-command--active' : 'CommandPalette-command'}
            id={`command-${command.id}`}
            key={command.id}
            onClick={() => runCommand(command)}
            onMouseEnter={() => setActiveIndex(index)}
            role="option"
            type="button"
          >
            <span>
              <strong>{command.label}</strong>
              <small>{command.description}</small>
            </span>
            {command.shortcut && <kbd>{command.shortcut}</kbd>}
          </button>
        ))}
        {filteredCommands.length === 0 && (
          <p className="CommandPalette-empty">No hay comandos para esa busqueda.</p>
        )}
      </div>
      <footer>
        <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
        <span><kbd>Enter</kbd> ejecutar</span>
      </footer>
    </section>
  );
}

export { CommandPalette };
export type { CommandPaletteItem };
