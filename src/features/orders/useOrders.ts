import React from 'react';
import { getStoredItem, setStoredItems } from '../sync/storage';
import { normalizeOrder, ORDERS_STORAGE_KEY, readOrders } from '../../shared/orders/orderModel';
import type { Order, OrderDraft, OrderResult } from '../../shared/orders/orderModel';

export function useOrders() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [hasExternalChanges, setHasExternalChanges] = React.useState(false);
  const ordersRef = React.useRef(orders);
  const busyRef = React.useRef(false);
  const mountedRef = React.useRef(false);

  const reload = React.useCallback(async () => {
    if (busyRef.current) return;
    setLoading(true);
    try {
      const stored = await getStoredItem(ORDERS_STORAGE_KEY);
      const envelope = stored === null ? { version: 1, orders: [] } : JSON.parse(stored);
      if (envelope?.version !== 1) throw new Error('La versión de pedidos no es compatible. No se borraron tus datos.');
      const result = readOrders(envelope.orders);
      if (!result.ok) throw new Error(result.error);
      if (mountedRef.current) {
        ordersRef.current = result.orders;
        setOrders(result.orders);
        setError('');
        setHasExternalChanges(false);
      }
    } catch (cause) {
      if (mountedRef.current) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los pedidos.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    void reload();
    const listener = (event: StorageEvent) => {
      if (event.key === ORDERS_STORAGE_KEY || event.key === null) setHasExternalChanges(true);
    };
    window.addEventListener('storage', listener);
    return () => { mountedRef.current = false; window.removeEventListener('storage', listener); };
  }, [reload]);

  const replaceOrders = async (values: unknown): Promise<OrderResult> => {
    if (loading || error || hasExternalChanges || busyRef.current) return { ok: false, error: 'Espera la carga o actualiza los pedidos antes de guardar.' };
    const result = readOrders(values);
    if (!result.ok) return result;
    busyRef.current = true;
    setSaving(true);
    try {
      await setStoredItems({ [ORDERS_STORAGE_KEY]: JSON.stringify({ version: 1, orders: result.orders }) });
      ordersRef.current = result.orders;
      if (mountedRef.current) setOrders(result.orders);
      return { ok: true };
    } catch {
      return { ok: false, error: 'No se pudo guardar el pedido. Conserva los datos y vuelve a intentarlo.' };
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  };
  const saveOrder = async (draft: OrderDraft, id?: string): Promise<OrderResult> => {
    const previous = ordersRef.current.find(order => order.id === id);
    if (id && !previous) return { ok: false, error: 'El pedido ya no existe. Actualiza la lista.' };
    const now = new Date().toISOString();
    const newId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const order = normalizeOrder({ ...draft, id: previous?.id ?? `order-${newId}`,
      createdAt: previous?.createdAt ?? now, updatedAt: now });
    if (!order) return { ok: false, error: 'Revisa los datos del pedido antes de guardar.' };
    return replaceOrders(previous ? ordersRef.current.map(item => item.id === order.id ? order : item) : [...ordersRef.current, order]);
  };
  const deleteOrder = (id: string) => replaceOrders(ordersRef.current.filter(order => order.id !== id));
  return { orders, loading, saving, error, hasExternalChanges, reload, saveOrder, deleteOrder, replaceOrders };
}
