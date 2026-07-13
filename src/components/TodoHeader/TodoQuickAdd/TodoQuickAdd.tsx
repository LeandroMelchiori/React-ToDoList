import React from 'react';
import { TodoDetails } from '../../../App/todoModel';
import { parseTodoQuickAdd } from '../../../App/todoQuickAdd';
import './TodoQuickAdd.css';

type TodoActionResult = { ok: true } | { ok: false; error: string };

interface TodoQuickAddProps {
  loading?: boolean;
  onAddTodo: (text: string, details: TodoDetails) => TodoActionResult;
}

function TodoQuickAdd({ loading = false, onAddTodo }: TodoQuickAddProps) {
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const parsedTodo = React.useMemo(() => parseTodoQuickAdd(value), [value]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!parsedTodo.text) {
      setError('Escribe el nombre de la tarea.');
      inputRef.current?.focus();
      return;
    }

    const result = onAddTodo(parsedTodo.text, parsedTodo.details);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setValue('');
    setError('');
    inputRef.current?.focus();
  };

  return (
    <form className="TodoQuickAdd" onSubmit={handleSubmit}>
      <label htmlFor="todo-quick-add">Agregar rapido</label>
      <div className="TodoQuickAdd-row">
        <input
          id="todo-quick-add"
          ref={inputRef}
          type="text"
          value={value}
          disabled={loading}
          placeholder="Ej: preparar parcial manana 10:30 #facultad !alta"
          aria-describedby="todo-quick-add-help todo-quick-add-feedback"
          onChange={(event) => {
            setValue(event.target.value);
            setError('');
          }}
        />
        <button type="submit" disabled={loading}>Agregar rapido</button>
      </div>
      <div className="TodoQuickAdd-feedback" id="todo-quick-add-feedback" aria-live="polite">
        {error ? (
          <span className="TodoQuickAdd-error">{error}</span>
        ) : parsedTodo.summary.length > 0 ? (
          <span>Detectado: {parsedTodo.summary.join(' · ')}</span>
        ) : null}
      </div>
      <p id="todo-quick-add-help">Usa hoy, manana, 18/07, 10:30, #etiqueta, !alta o cada semana.</p>
    </form>
  );
}

export { TodoQuickAdd };
