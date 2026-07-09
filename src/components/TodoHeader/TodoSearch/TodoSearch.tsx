import React, { ChangeEvent } from 'react';
import './TodoSearch.css';

interface TodoSearchProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  loading?: boolean;
}

const TodoSearch = React.forwardRef<HTMLInputElement, TodoSearchProps>(function TodoSearch({ searchValue, setSearchValue, loading }, ref) {

  return (
    <label className="TodoSearch-label">
      <span>Buscar tareas</span>
      <input
        ref={ref}
        placeholder="Ej: preparar entrevista"
        className="TodoSearch"
        aria-keyshortcuts="/"
        value={searchValue}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setSearchValue(event.target.value);
        }}
        disabled={loading}
      />
    </label>
  );
});

export { TodoSearch };
