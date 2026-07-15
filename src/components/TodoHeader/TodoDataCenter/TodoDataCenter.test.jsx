import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoDataCenter, formatBytes } from './TodoDataCenter';

describe('TodoDataCenter', () => {
  test('shows local metrics, storage usage and manual snapshot feedback', async () => {
    const user = userEvent.setup();
    const onCreateSnapshot = vi.fn(() => ({ ok: true }));

    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({
          usage: 5 * 1024 * 1024,
          quota: 100 * 1024 * 1024,
        }),
      },
    });

    render(
      <TodoDataCenter
        agendaCount={3}
        archivedCount={2}
        boardCount={2}
        onCreateSnapshot={onCreateSnapshot}
        savedViewCount={1}
        snapshotCount={4}
        taskCount={7}
      />
    );

    expect(screen.getByText('Tareas').nextElementSibling).toHaveTextContent('7');
    expect(screen.getByText('Agenda').nextElementSibling).toHaveTextContent('3');
    await waitFor(() => {
      expect(screen.getByText('5.0 MB usados de 100 MB')).toBeInTheDocument();
    });
    expect(screen.getByRole('progressbar', { name: 'Uso del almacenamiento local' })).toHaveValue(5 * 1024 * 1024);

    await user.click(screen.getByRole('button', { name: 'Crear copia ahora' }));
    expect(onCreateSnapshot).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Copia local creada.');
  });

  test('formats storage sizes for the data summary', () => {
    expect(formatBytes(0)).toBe('0 MB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.0 GB');
  });
});
