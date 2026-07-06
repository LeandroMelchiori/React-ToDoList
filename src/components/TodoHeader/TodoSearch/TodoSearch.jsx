import './TodoSearch.css';

function TodoSearch({ searchValue, setSearchValue, loading }) {

  return (
    <label className="TodoSearch-label">
      <span>Buscar tareas</span>
      <input
        placeholder="Ej: preparar entrevista"
        className="TodoSearch"
        value={searchValue}
        onChange={(event) => {
          setSearchValue(event.target.value);
        }}
        disabled={loading}
      />
    </label>
  );
}

export { TodoSearch };
