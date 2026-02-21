import './TodoSearch.css';

function TodoSearch( {searchValue, setSearchValue, loading, sincronize} ) {

  return (
    <input
      placeholder="Cortar cebolla"
      className="TodoSearch"
      value={searchValue}
      onChange={(event) => { 
        setSearchValue(event.target.value);
      }}
      disabled={loading || sincronize}
    />
  );
}

export { TodoSearch };
