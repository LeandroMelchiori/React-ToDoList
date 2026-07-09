import { ReactNode, Fragment } from 'react';
import { Todo, TodoGroupView } from '../../App/todoModel';
import './TodoList.css';

interface TodoListProps {
  error?: boolean;
  loading?: boolean;
  visibleTodos: Todo[];
  visibleTodoGroups?: TodoGroupView[];
  totalTodos: number;
  searchValue?: string;
  onError: () => React.ReactNode;
  onLoading: () => React.ReactNode;
  onEmptyTodos: () => ReactNode;
  onEmptySearchResults: () => ReactNode;
  render?: (todo: Todo) => ReactNode;
  children?: (todo: Todo) => ReactNode;
}

function getTodoCountLabel(count: number) {
  return count === 1 ? '1 tarea' : `${count} tareas`;
}

function TodoList(props: TodoListProps) {
  const renderTodo = props.render || props.children;
  const todoGroups = props.visibleTodoGroups?.length
    ? props.visibleTodoGroups
    : [{ id: 'all' as any, title: '', todos: props.visibleTodos }];
  const showGroupHeaders = todoGroups.length > 1;

  return (
    <section
      className="TodoList-container"
      id="todo-list"
      tabIndex={-1}
      aria-label="Tareas"
    >
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
            {renderTodo && group.todos.map(renderTodo)}
          </Fragment>
        ))}
      </ul>

    </section>
  );
}

export { TodoList };
