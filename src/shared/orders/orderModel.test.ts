import { describe, expect, test } from 'vitest';
import { filterOrders, normalizeOrder, parseMoney, paymentLabel, readOrders, validateOrder } from './orderModel';
import { orderAgendaEntries } from './orderAgenda';
import { createTodoWorkspaceBackup, readTodoWorkspaceBackup } from '../calendar/todoWorkspaceBackup';

const order = normalizeOrder({ id: 'maria', customerName: ' María ', items: [{ description: 'Torta', quantity: 2 }],
  deliveryDate: '2026-10-16', deliveryTime: '18:00', contact: 'privado', notes: 'no publicar', amountCents: 10000, paidCents: 2500,
  preparation: { date: '2026-10-16', startTime: '14:00', endTime: '16:00' } })!;

describe('manual orders', () => {
  test('normalizes only whitelisted data and separates payment from delivery', () => {
    expect(order.customerName).toBe('María');
    expect(order.status).toBe('received');
    expect(paymentLabel(order)).toBe('Señado');
    expect(paymentLabel({ ...order, status: 'delivered' })).toBe('Señado');
    expect(paymentLabel({ ...order, paidCents: 10000 })).toBe('Pagado');
    expect(paymentLabel({ ...order, amountCents: null, paidCents: 0 })).toBe('Sin importe');
  });
  test('parses currency without floating-point addition, negatives or excess decimals', () => {
    expect(parseMoney('12,30')).toBe(1230);
    expect(parseMoney('0.29')).toBe(29);
    expect(parseMoney('')).toBeNull();
    for (const invalid of ['-1', '1.234', 'NaN', '1e3', 'Infinity', '1,2,3', '999999999999999999']) expect(parseMoney(invalid)).toBeUndefined();
  });
  test('rejects missing items, impossible dates, quantities and overpayments', () => {
    expect(normalizeOrder({ ...order, items: [] })).toBeNull();
    expect(normalizeOrder({ ...order, items: [{ description: 'Torta', quantity: 0 }] })).toBeNull();
    expect(normalizeOrder({ ...order, deliveryDate: '2026-02-31' })).toBeNull();
    expect(normalizeOrder({ ...order, status: '__proto__' })).toBeNull();
    expect(validateOrder({ ...order, paidCents: 10001 })).toMatch(/superar/);
    expect(validateOrder({ ...order, deliveryDate: null })).toMatch(/hora/);
    expect(validateOrder({ ...order, preparation: { date: '2026-10-16', startTime: '17:00', endTime: '16:00' } })).toMatch(/posterior/);
  });
  test('never silently drops malformed or duplicate imported orders', () => {
    expect(readOrders([order, { id: 'invalid' }]).ok).toBe(false);
    expect(readOrders([order, order]).ok).toBe(false);
    expect(readOrders([order]).ok).toBe(true);
  });
  test('filters customers and item details, including accent-insensitive searches', () => {
    expect(filterOrders([order], 'maria', 'active')).toHaveLength(1);
    expect(filterOrders([order], 'torta', 'ready')).toHaveLength(0);
    expect(filterOrders([{ ...order, status: 'delivered' }], '', 'active')).toHaveLength(0);
  });
  test('projects linked events without copying private contact, payment or notes', () => {
    const entries = orderAgendaEntries([order]);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ orderId: order.id, todo: { id: 'order-delivery:maria', kind: 'event', text: 'Entrega · María',
      startDate: '2026-10-16', startTime: '18:00', endTime: '18:30', completed: false } });
    expect(JSON.stringify(entries)).not.toMatch(/privado|no publicar|paidCents/);
    expect(orderAgendaEntries([{ ...order, status: 'cancelled' }])).toEqual([]);
    expect(orderAgendaEntries([{ ...order, status: 'delivered' }])).toEqual([]);
    expect(orderAgendaEntries([{ ...order, deliveryDate: null, deliveryTime: null }])).toEqual([]);
    expect(orderAgendaEntries([{ ...order, deliveryTime: '23:50', preparation: null }])[0].todo.endTime).toBe('23:59');
    expect(orderAgendaEntries([{ ...order, deliveryDate: '2026-11-02' }])[0].todo.startDate).toBe('2026-11-02');
  });
  test('preserves historical preparation without restricting delivery dates', () => {
    const edited = { ...order, deliveryDate: '2026-10-15' };
    expect(validateOrder(edited)).toBeNull();
    expect(normalizeOrder(edited)?.preparation).toEqual(order.preparation);
  });
  test('round-trips orders in version 2 while preserving old calendar backups', () => {
    const base = { todos: [], boards: [], activeBoardId: 'personal', savedViews: [] };
    expect(createTodoWorkspaceBackup(base).version).toBe(1);
    const backup = createTodoWorkspaceBackup({ ...base, orders: [order] });
    expect(backup.version).toBe(2);
    const result = readTodoWorkspaceBackup(JSON.parse(JSON.stringify(backup)));
    expect(result.ok && result.backup.orders).toEqual([order]);
    const legacy = readTodoWorkspaceBackup(createTodoWorkspaceBackup(base));
    expect(legacy.ok && legacy.backup.orders).toBeUndefined();
    expect(readTodoWorkspaceBackup({ ...backup, orders: [{ id: 'invalid' }] }).ok).toBe(false);
    expect(readTodoWorkspaceBackup({ ...backup, orders: undefined }).ok).toBe(false);
    expect(readTodoWorkspaceBackup({ ...backup, version: 99 }).ok).toBe(false);
  });
});
