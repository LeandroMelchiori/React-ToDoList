import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { OrderForm } from './OrderForm';

describe('manual order form', () => {
  test('validates an empty client without persisting a draft', async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    render(<OrderForm saving={false} onCancel={vi.fn()} onSave={save} />);
    await user.click(screen.getByRole('button', { name: 'Guardar pedido' }));
    expect(screen.getByRole('alert')).toHaveTextContent('cliente');
    expect(screen.getByRole('alert')).toHaveFocus();
    expect(save).not.toHaveBeenCalled();
  });
  test('keeps the entered data available when persistence fails', async () => {
    const user = userEvent.setup();
    const cancel = vi.fn();
    const save = vi.fn().mockResolvedValue({ ok: false, error: 'Almacenamiento lleno' });
    render(<OrderForm saving={false} onCancel={cancel} onSave={save} />);
    await user.type(screen.getByLabelText('Cliente', { exact: true }), 'Ana');
    await user.type(screen.getByLabelText('Detalle 1'), 'Arreglo');
    await user.click(screen.getByRole('button', { name: 'Guardar pedido' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Almacenamiento lleno');
    expect(screen.getByLabelText('Cliente', { exact: true })).toHaveValue('Ana');
    expect(cancel).not.toHaveBeenCalled();
  });
});
