import './TodoList.css';

function TodoList(props) {
  return (
    <section>
      {props.error && props.onError()}
      {props.loading && props.onLoading()}
      
      {!props.loading && !props.totalTodos && props.onEmptyTodos()}
      
      {(!!props.totalTodos && !props.searchTodos.length) && props.onEmptySearchResults()}

      {props.searchTodos.map(props.render)}

      <ul className="TodoList">
        {props.children}
      </ul>
    </section>
  );
}

export { TodoList };

