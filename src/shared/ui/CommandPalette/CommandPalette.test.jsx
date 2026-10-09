import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  test('filters commands and executes the active result with the keyboard', async () => {
    const user = userEvent.setup();
    const openList = vi.fn();
    const openWeek = vi.fn();

    render(
      <CommandPalette
        commands={[
          { id: 'list', label: 'Abrir Lista', description: 'Vista principal', onSelect: openList },
          { id: 'week', label: 'Abrir Semana', description: 'Agenda por horarios', onSelect: openWeek },
        ]}
      />
    );

    const searchInput = screen.getByRole('combobox', { name: 'Buscar comando' });

    await user.type(searchInput, 'agenda');
    expect(screen.queryByRole('option', { name: /Abrir Lista/ })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Abrir Semana/ })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Enter}');
    expect(openWeek).toHaveBeenCalledTimes(1);
    expect(openList).not.toHaveBeenCalled();
  });

  test('cycles through commands with arrow keys', async () => {
    const user = userEvent.setup();
    const firstAction = vi.fn();
    const secondAction = vi.fn();

    render(
      <CommandPalette
        commands={[
          { id: 'first', label: 'Primera', description: 'Primera accion', onSelect: firstAction },
          { id: 'second', label: 'Segunda', description: 'Segunda accion', onSelect: secondAction },
        ]}
      />
    );

    await user.click(screen.getByRole('combobox', { name: 'Buscar comando' }));
    await user.keyboard('{ArrowDown}{Enter}');

    expect(secondAction).toHaveBeenCalledTimes(1);
    expect(firstAction).not.toHaveBeenCalled();
  });
});
