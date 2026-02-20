import './TodoList.css';

function TodoList(props) {
  return (
    <section>
      {props.error && props.onError()}
      {props.loading && props.onLoading()}
      {!props.loading && !props.searchTodos?.length && props.onEmptyTodos()}
      
      {props.searchTodos.map(props.render)}

      <ul className="TodoList">
        {props.children}
      </ul>
    </section>
  );
}

export { TodoList };

