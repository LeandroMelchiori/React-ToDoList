import './TodoList.css';

function TodoList(props) {
  return (
    <section>
      {props.error && props.onError()}
      {props.loading && props.onLoading()}
      
      {!props.loading && !props.totalTodos && props.onEmptyTodos()}
      
      {(!!props.totalTodos && !props.searchTodos.length) && props.onEmptySearchResults()}

      <ul>
              {(!props.loading && !props.error) && props.searchTodos.map(props.render || props.children)}
      </ul>

    </section>
  );
}

export { TodoList };

