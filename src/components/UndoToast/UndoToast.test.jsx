import { act, fireEvent, render, screen } from '@testing-library/react';
import { UndoToast } from './UndoToast';

describe('UndoToast', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('dismisses itself after the configured timeout', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <UndoToast
        dismissAfterMs={1000}
        message='Eliminaste "Publicar demo".'
        onDismiss={onDismiss}
        onUndo={vi.fn()}
      />
    );

    expect(screen.getByText('Eliminaste "Publicar demo".')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('supports Escape dismissal and undo action', () => {
    const onDismiss = vi.fn();
    const onUndo = vi.fn();

    render(
      <UndoToast
        message='Eliminaste "Publicar demo".'
        onDismiss={onDismiss}
        onUndo={onUndo}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(onUndo).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
