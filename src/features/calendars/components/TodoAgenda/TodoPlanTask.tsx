import React from 'react';
import { applyTodoScheduleChange } from '../../../../shared/calendar/todoModel';
import type { Todo, TodoDetails, TodoScheduleChange } from '../../../../shared/calendar/todoModel';
import type { TodoScheduleConflictMatch } from '../../../../shared/calendar/todoScheduleConflicts';
import '../TodoList/TodoForm/TodoForm.css';

interface TodoPlanTaskProps {
  todo: Todo;
  initialSlot?: { date: string; startTime: string; endTime: string } | null;
  mode?: 'reserve' | 'reschedule';
  timeBlockId?: string;
  occurrenceDate?: string;
  onCancel: () => void;
  onCheckConflicts: (details: TodoDetails, change: TodoScheduleChange) => TodoScheduleConflictMatch[];
  onSave: (details: TodoDetails, change: TodoScheduleChange) => { ok: boolean; error?: string };
}

function TodoPlanTask({ todo, initialSlot, mode = 'reserve', timeBlockId, occurrenceDate, onCancel, onCheckConflicts, onSave }: TodoPlanTaskProps) {
  const [date, setDate] = React.useState(initialSlot?.date || '');
  const [startTime, setStartTime] = React.useState(initialSlot?.startTime || '');
  const [endTime, setEndTime] = React.useState(initialSlot?.endTime || '');
  const [error, setError] = React.useState('');
  const [conflicts, setConflicts] = React.useState<TodoScheduleConflictMatch[]>([]);
  const [confirmed, setConfirmed] = React.useState(false);
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { dateInputRef.current?.focus(); }, []);

  const changeField = (setter: (value: string) => void, value: string) => {
    setter(value);
    setError('');
    setConflicts([]);
    setConfirmed(false);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!date || !startTime || !endTime || endTime <= startTime) {
      setError('Elegí una fecha y un horario de fin posterior al inicio.');
      return;
    }
    const change: TodoScheduleChange = { todoId: todo.id, date, startTime, endTime, timeBlockId, occurrenceDate };
    const preview = applyTodoScheduleChange([todo], change);
    if (!preview.ok) { setError(preview.error); return; }
    const details: TodoDetails = preview.undo.createdTodo || preview.undo.after;
    const matches = onCheckConflicts(details, change);
    if (matches.length && !confirmed) {
      setConflicts(matches);
      return;
    }
    const result = onSave(details, change);
    if (!result.ok) setError(result.error || 'No se pudo reservar el bloque.');
  };

  return (
    <form className="TodoForm" onSubmit={submit}>
      <h2>{mode === 'reschedule' ? 'Cambiar horario' : 'Programar tarea'}</h2>
      <p>{todo.text}</p>
      <p className="TodoForm-fieldHint">{occurrenceDate ? `Solo se modifica el ${occurrenceDate.split('-').reverse().join('/')}. El resto de la serie se conserva.`
        : todo.kind === 'task' ? 'Reservá tiempo para avanzar. La tarea se completa por separado.' : 'Cambiá la fecha y la duración de esta actividad.'}</p>
      <div className="TodoForm-fields">
        <label>Fecha<input ref={dateInputRef} type="date" required value={date} onChange={event => changeField(setDate, event.target.value)} /></label>
        <label>Inicio<input type="time" required value={startTime} onChange={event => changeField(setStartTime, event.target.value)} /></label>
        <label>Fin<input type="time" required value={endTime} onChange={event => changeField(setEndTime, event.target.value)} /></label>
      </div>
      {error && <p className="TodoForm-error" role="alert">{error}</p>}
      {conflicts.length > 0 && <div className="TodoForm-conflict" role="alert">
        <strong>Este horario se superpone</strong>
        <ul>{conflicts.map(match => <li key={match.todoId}>{match.text}</li>)}</ul>
        <label><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> Reservar de todos modos</label>
      </div>}
      <div className="TodoForm-buttonContainer">
        <button className="TodoForm-button TodoForm-button-cancel" onClick={onCancel} type="button">Cancelar</button>
        <button className="TodoForm-button TodoForm-button-add" type="submit">{mode === 'reschedule' ? 'Guardar horario' : 'Reservar bloque'}</button>
      </div>
    </form>
  );
}

export { TodoPlanTask };
