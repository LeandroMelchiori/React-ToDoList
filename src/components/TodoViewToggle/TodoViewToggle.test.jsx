import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoViewToggle } from './TodoViewToggle';

describe('TodoViewToggle', () => {
  test('exposes the active view as the selected tab', () => {
    render(<TodoViewToggle activeView="calendar" onChangeView={vi.fn()} />);

    expect(screen.getByRole('tablist', { name: 'Cambiar vista' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Mes' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Mes' })).toHaveAttribute('tabindex', '0');
    expect(screen.queryByRole('tab', { name: 'Lista' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Planificación' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('changes views with arrow, Home and End keys', async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();

    render(<TodoViewToggle activeView="today" onChangeView={onChangeView} />);

    screen.getByRole('tab', { name: 'Hoy' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: '3 días' })).toHaveFocus();
    expect(onChangeView).toHaveBeenLastCalledWith('days');

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Mes' })).toHaveFocus();
    expect(onChangeView).toHaveBeenLastCalledWith('calendar');

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Hoy' })).toHaveFocus();
    expect(onChangeView).toHaveBeenLastCalledWith('today');
  });

  test('keeps task views separate from the calendar', async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();
    render(<TodoViewToggle activeView="list" onChangeView={onChangeView} />);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Planificación' }));
    expect(onChangeView).toHaveBeenCalledWith('agenda');
  });
});
