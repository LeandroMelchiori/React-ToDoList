import './TodoList.css';

function TodoList(props) {
  return (
    <section className="TodoList-container">
      {props.error && props.onError()}
      {props.loading && props.onLoading()}
      
      {!props.loading && !props.totalTodos && props.onEmptyTodos()}
      
      {(!!props.totalTodos && !props.visibleTodos.length) && props.onEmptySearchResults()}

      <ul className="TodoList" aria-label="Lista de tareas">
        {(!props.loading && !props.error) && props.visibleTodos.map(props.render || props.children)}
      </ul>

    </section>
  );
}

export { TodoList };
