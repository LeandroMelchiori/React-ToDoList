import React from 'react';
import './TodoSearch.css';

const TodoSearch = React.forwardRef(function TodoSearch({ searchValue, setSearchValue, loading }, ref) {

  return (
    <label className="TodoSearch-label">
      <span>Buscar tareas</span>
      <input
        ref={ref}
        placeholder="Ej: preparar entrevista"
        className="TodoSearch"
        aria-keyshortcuts="/"
        value={searchValue}
        onChange={(event) => {
          setSearchValue(event.target.value);
        }}
        disabled={loading}
      />
    </label>
  );
});

export { TodoSearch };
