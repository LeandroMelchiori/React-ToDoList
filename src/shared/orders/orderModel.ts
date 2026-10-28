export const ORDER_STATUSES = {
  received: 'Recibido', preparing: 'En preparación', ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado',
} as const;
export type OrderStatus = keyof typeof ORDER_STATUSES;
export type OrderItem = { description: string; quantity: number };
export type PreparationBlock = { date: string; startTime: string; endTime: string };
export type OrderDraft = {
  customerName: string;
  contact: string;
  items: OrderItem[];
  notes: string;
  status: OrderStatus;
  deliveryDate: string | null;
  deliveryTime: string | null;
  preparation: PreparationBlock | null;
  currency: 'ARS' | 'USD' | 'EUR';
  amountCents: number | null;
  paidCents: number;
};
export type Order = OrderDraft & { id: string; createdAt: string; updatedAt: string };
export type OrderResult = { ok: true } | { ok: false; error: string };
export const ORDERS_STORAGE_KEY = 'ORDERS_V1';
const MAX_CENTS = 1_000_000_000_000;

export function isOrderDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function isOrderTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
export function parseMoney(value: string): number | null | undefined {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return undefined;
  const [whole, decimal = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : undefined;
}
export function moneyInput(cents: number | null): string {
  return cents === null ? '' : (cents / 100).toFixed(2);
}
export function validateOrder(draft: OrderDraft): string | null {
  if (!draft.customerName.trim() || draft.customerName.length > 120) return 'Escribe un cliente de hasta 120 caracteres.';
  if (draft.contact.length > 240 || draft.notes.length > 5000) return 'El contacto o las observaciones son demasiado largos.';
  if (!draft.items.length || draft.items.length > 50 || draft.items.some(item =>
    !item.description.trim() || item.description.length > 240 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999999)) {
    return 'Completa el detalle y una cantidad entera mayor que cero en cada producto o servicio.';
  }
  if (!Object.hasOwn(ORDER_STATUSES, draft.status)) return 'El estado del pedido no es válido.';
  if (draft.deliveryDate !== null && !isOrderDate(draft.deliveryDate)) return 'La fecha de entrega no es válida.';
  if (draft.deliveryTime !== null && (!isOrderTime(draft.deliveryTime) || !draft.deliveryDate)) return 'La hora de entrega necesita una fecha válida.';
  const block = draft.preparation;
  if (block && (!isOrderDate(block.date) || !isOrderTime(block.startTime) || !isOrderTime(block.endTime) || block.endTime <= block.startTime)) {
    return 'La preparación necesita fecha, inicio y un fin posterior al inicio.';
  }
  if (!['ARS', 'USD', 'EUR'].includes(draft.currency)) return 'La moneda no es válida.';
  if ((draft.amountCents !== null && (!Number.isSafeInteger(draft.amountCents) || draft.amountCents < 0 || draft.amountCents > MAX_CENTS)) ||
    !Number.isSafeInteger(draft.paidCents) || draft.paidCents < 0 || draft.paidCents > MAX_CENTS) return 'Revisa los importes; usa hasta dos decimales y valores positivos.';
  if (draft.paidCents > (draft.amountCents ?? 0)) return 'El importe cobrado no puede superar el total. Define primero el total del pedido.';
  return null;
}
export function normalizeOrder(value: unknown): Order | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<Order>;
  if (typeof raw.id !== 'string' || !raw.id || raw.id.length > 100 || typeof raw.customerName !== 'string' ||
    !Array.isArray(raw.items) || raw.items.some(item => !item || typeof item.description !== 'string' || typeof item.quantity !== 'number')) return null;
  const order: Order = {
    id: raw.id, customerName: raw.customerName.trim(), contact: typeof raw.contact === 'string' ? raw.contact.trim() : '',
    items: raw.items.map(item => ({ description: item.description.trim(), quantity: item.quantity })),
    notes: typeof raw.notes === 'string' ? raw.notes.trim() : '', status: raw.status ?? 'received',
    deliveryDate: raw.deliveryDate ?? null, deliveryTime: raw.deliveryTime ?? null,
    preparation: raw.preparation ?? null, currency: raw.currency ?? 'ARS', amountCents: raw.amountCents ?? null, paidCents: raw.paidCents ?? 0,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '', updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
  return validateOrder(order) ? null : order;
}
export function readOrders(value: unknown): { ok: true; orders: Order[] } | { ok: false; error: string } {
  if (!Array.isArray(value) || value.length > 10000) return { ok: false, error: 'El archivo no contiene una lista válida de pedidos.' };
  const orders = value.map(normalizeOrder);
  if (orders.some(order => !order) || new Set(orders.map(order => order?.id)).size !== orders.length) {
    return { ok: false, error: 'Hay pedidos inválidos o identificadores repetidos. No se modificaron tus datos.' };
  }
  return { ok: true, orders: orders as Order[] };
}
export function isActiveOrder(order: Order): boolean {
  return !['delivered', 'cancelled'].includes(order.status);
}
export function paymentLabel(order: Order): string {
  if (order.amountCents === null) return 'Sin importe';
  if (order.amountCents === 0) return 'Sin cargo';
  return order.paidCents === order.amountCents ? 'Pagado' : order.paidCents > 0 ? 'Señado' : 'Cobro pendiente';
}
export function formatOrderMoney(cents: number, currency: Order['currency']): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(cents / 100);
}
export function filterOrders(orders: Order[], search: string, filter: 'all' | 'active' | OrderStatus): Order[] {
  const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const query = fold(search.trim());
  return orders.filter(order => (filter === 'all' || (filter === 'active' ? isActiveOrder(order) : order.status === filter)) &&
    fold([order.customerName, order.contact, order.notes, ...order.items.map(item => item.description)].join(' ')).includes(query))
    .sort((a, b) => (a.deliveryDate ?? '9999-12-31').localeCompare(b.deliveryDate ?? '9999-12-31') ||
      (a.deliveryTime ?? '23:59').localeCompare(b.deliveryTime ?? '23:59') || b.createdAt.localeCompare(a.createdAt));
}
