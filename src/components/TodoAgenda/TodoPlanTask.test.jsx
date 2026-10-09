import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { normalizeTodos } from '../../App/todoModel';
import { TodoPlanTask } from './TodoPlanTask';

const task = normalizeTodos([{ id: 'task', text: 'Preparar examen', description: 'Mis notas',
  priority: 'high', tags: ['estudio'], subtasks: [{ id: 'sub', text: 'Repasar', completed: true }] }])[0];

async function enterBlock(user, end = '11:00') {
  await user.type(screen.getByLabelText('Fecha'), '2026-10-12');
  await user.type(screen.getByLabelText('Inicio'), '10:00');
  await user.type(screen.getByLabelText('Fin'), end);
  await user.click(screen.getByRole('button', { name: 'Reservar bloque' }));
}

test('validates the interval before saving', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn();
  render(<TodoPlanTask todo={task} onSave={onSave} onCheckConflicts={vi.fn()} onCancel={vi.fn()} />);
  expect(screen.getByLabelText('Fecha')).toHaveFocus();
  await enterBlock(user, '09:00');
  expect(screen.getByRole('alert')).toHaveTextContent('horario de fin posterior');
  expect(onSave).not.toHaveBeenCalled();
});

test('keeps task details when reserving time', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockReturnValue({ ok: true });
  render(<TodoPlanTask todo={task} onSave={onSave} onCheckConflicts={() => []} onCancel={vi.fn()} />);
  await enterBlock(user);
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    description: 'Mis notas', priority: 'high', tags: ['estudio'], subtasks: task.subtasks,
    timeBlocks: [expect.objectContaining({ date: '2026-10-12', startTime: '10:00', endTime: '11:00' })],
  }), expect.objectContaining({ todoId: task.id, date: '2026-10-12', startTime: '10:00', endTime: '11:00' }));
});

test('prefills the slot selected by dragging and rejects duplicate blocks', async () => {
  const user = userEvent.setup();
  const initialSlot = { date: '2026-10-12', startTime: '10:00', endTime: '11:00' };
  const onSave = vi.fn();
  render(<TodoPlanTask todo={{ ...task, timeBlocks: [{ id: 'existing', ...initialSlot }] }}
    initialSlot={initialSlot} onSave={onSave} onCheckConflicts={() => []} onCancel={vi.fn()} />);
  expect(screen.getByLabelText('Fecha')).toHaveValue('2026-10-12');
  expect(screen.getByLabelText('Inicio')).toHaveValue('10:00');
  expect(screen.getByLabelText('Fin')).toHaveValue('11:00');
  await user.click(screen.getByRole('button', { name: 'Reservar bloque' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Ese bloque ya está reservado');
  expect(onSave).not.toHaveBeenCalled();
});

test('requires explicit conflict confirmation and clears it when the time changes', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockReturnValue({ ok: true });
  render(<TodoPlanTask todo={task} onSave={onSave}
    onCheckConflicts={() => [{ todoId: 'class', text: 'Clase de álgebra', firstDate: '2026-10-12', occurrences: 1 }]}
    onCancel={vi.fn()} />);
  await enterBlock(user);
  expect(screen.getByRole('alert')).toHaveTextContent('Clase de álgebra');
  expect(onSave).not.toHaveBeenCalled();
  await user.click(screen.getByLabelText('Reservar de todos modos'));
  await user.clear(screen.getByLabelText('Fin'));
  await user.type(screen.getByLabelText('Fin'), '12:00');
  await user.click(screen.getByRole('button', { name: 'Reservar bloque' }));
  expect(screen.getByLabelText('Reservar de todos modos')).not.toBeChecked();
  expect(onSave).not.toHaveBeenCalled();
  await user.click(screen.getByLabelText('Reservar de todos modos'));
  await user.click(screen.getByRole('button', { name: 'Reservar bloque' }));
  expect(onSave).toHaveBeenCalledTimes(1);
});
