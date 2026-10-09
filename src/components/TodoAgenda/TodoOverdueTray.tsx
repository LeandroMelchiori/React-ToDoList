import type { Todo } from '../../App/todoModel';
import { getTodoDateStatus } from '../../App/todoModel';
import './TodoOverdueTray.css';

interface TodoOverdueTrayProps {
  todos: Todo[];
  onComplete: (id: string) => void;
  onOpen: (id: string) => void;
  onChangeDeadline: (id: string) => void;
}

function TodoOverdueTray({ todos, onComplete, onOpen, onChangeDeadline }: TodoOverdueTrayProps) {
  const overdue = todos.filter(todo => todo.kind === 'task' && !todo.completed && !todo.archivedAt &&
    getTodoDateStatus(todo) === 'overdue').sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  if (!overdue.length) return null;
  return (
    <aside className="TodoOverdueTray" aria-label="Tareas vencidas">
      <details>
        <summary>Vencidas ({overdue.length}) · Revisar pendientes</summary>
        <ul>{overdue.map(todo => <li key={todo.id}>
          <input type="checkbox" aria-label={`Completar vencida ${todo.text}`} onChange={() => onComplete(todo.id)} />
          <button type="button" onClick={() => onOpen(todo.id)}>{todo.text}<small>Venció el {todo.dueDate?.split('-').reverse().join('/')}</small></button>
          <button type="button" aria-label={`Cambiar fecha límite de ${todo.text}`} onClick={() => onChangeDeadline(todo.id)}>Cambiar fecha</button>
        </li>)}</ul>
      </details>
    </aside>
  );
}

export { TodoOverdueTray };
