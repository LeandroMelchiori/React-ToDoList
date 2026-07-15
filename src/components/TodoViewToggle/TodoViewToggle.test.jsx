import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoViewToggle } from './TodoViewToggle';

describe('TodoViewToggle', () => {
  test('exposes the active view as the selected tab', () => {
    render(<TodoViewToggle activeView="calendar" onChangeView={vi.fn()} />);

    expect(screen.getByRole('tablist', { name: 'Cambiar vista' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Calendario' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Calendario' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Lista' })).toHaveAttribute('tabindex', '-1');
  });

  test('changes views with arrow, Home and End keys', async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();

    render(<TodoViewToggle activeView="list" onChangeView={onChangeView} />);

    screen.getByRole('tab', { name: 'Lista' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Hoy' })).toHaveFocus();
    expect(onChangeView).toHaveBeenLastCalledWith('today');

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Semana' })).toHaveFocus();
    expect(onChangeView).toHaveBeenLastCalledWith('week');

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Lista' })).toHaveFocus();
    expect(onChangeView).toHaveBeenLastCalledWith('list');
  });
});
