import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { OrderForm } from './OrderForm';
import { normalizeOrder } from '../../shared/orders/orderModel';

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
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ notes: '', status: 'received', preparation: null }), undefined);
  });
  test('edits delivery without hidden legacy fields blocking or losing data', async () => {
    const user = userEvent.setup();
    const order = normalizeOrder({ id: 'legacy', customerName: 'Ana', items: [{ description: 'Torta', quantity: 1 }],
      notes: 'Dato histórico', status: 'ready', deliveryDate: '2026-10-20',
      preparation: { date: '2026-10-19', startTime: '14:00', endTime: '16:00' } })!;
    const save = vi.fn().mockResolvedValue({ ok: true });
    const cancel = vi.fn();
    render(<OrderForm order={order} saving={false} onCancel={cancel} onSave={save} />);
    expect(screen.queryByLabelText('Estado del pedido')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Observaciones (opcional)')).not.toBeInTheDocument();
    expect(screen.queryByText('Reservar tiempo de preparación')).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText('Fecha de entrega o retiro'));
    await user.type(screen.getByLabelText('Fecha de entrega o retiro'), '2026-10-18');
    await user.click(screen.getByRole('button', { name: 'Guardar pedido' }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ deliveryDate: '2026-10-18',
      notes: order.notes, status: order.status, preparation: order.preparation }), order.id);
    expect(cancel).toHaveBeenCalledOnce();
  });
});
