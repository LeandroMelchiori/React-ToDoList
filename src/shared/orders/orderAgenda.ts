import { normalizeTodos } from '../calendar/todoModel';
import type { Todo } from '../calendar/todoModel';
import { isActiveOrder } from './orderModel';
import type { Order } from './orderModel';

export function orderAgendaEntries(orders: Order[]): Array<{ orderId: string; todo: Todo }> {
  return orders.filter(isActiveOrder).flatMap(order => {
    const items = order.items.map(item => `${item.quantity} × ${item.description}`).join(', ');
    const base = { kind: 'event', project: 'Pedidos', tags: ['pedido'], recurrence: 'none', description: items };
    const raw = [];
    if (order.deliveryDate) {
      const start = order.deliveryTime;
      const minutes = start ? Number(start.slice(0, 2)) * 60 + Number(start.slice(3)) : null;
      const endMinutes = minutes === null ? null : Math.min(minutes + 30, 1439);
      const endTime = endMinutes !== null && endMinutes !== minutes
        ? `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}` : null;
      raw.push({ ...base, id: `order-delivery:${order.id}`, text: `Entrega · ${order.customerName}`, startDate: order.deliveryDate,
        startTime: start, endTime });
    }
    return normalizeTodos(raw).map(todo => ({ orderId: order.id, todo }));
  });
}
