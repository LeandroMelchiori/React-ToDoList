import { Fragment } from 'react';
import './TodoList.css';

function getTodoCountLabel(count) {
  return count === 1 ? '1 tarea' : `${count} tareas`;
}

function TodoList(props) {
  const renderTodo = props.render || props.children;
  const todoGroups = props.visibleTodoGroups?.length
    ? props.visibleTodoGroups
    : [{ id: 'all', title: null, todos: props.visibleTodos }];
  const showGroupHeaders = todoGroups.length > 1;

  return (
    <section className="TodoList-container">
      {props.error && props.onError()}
      {props.loading && props.onLoading()}
      
      {!props.loading && !props.totalTodos && props.onEmptyTodos()}
      
      {(!!props.totalTodos && !props.visibleTodos.length) && props.onEmptySearchResults()}

      <ul className="TodoList" aria-label="Lista de tareas">
        {(!props.loading && !props.error) && todoGroups.map(group => (
          <Fragment key={group.id}>
            {showGroupHeaders && (
              <li className="TodoList-groupHeader" role="presentation">
                <h2>{group.title}</h2>
                <span>{getTodoCountLabel(group.todos.length)}</span>
              </li>
            )}
            {group.todos.map(renderTodo)}
          </Fragment>
        ))}
      </ul>

    </section>
  );
}

export { TodoList };
