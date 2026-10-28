import React from 'react';
import { Modal } from '../../shared/ui/Modal/Modal';
import { filterOrders, formatOrderMoney, isActiveOrder, ORDER_STATUSES, paymentLabel } from '../../shared/orders/orderModel';
import type { Order, OrderStatus } from '../../shared/orders/orderModel';
import type { useOrders } from './useOrders';
import { OrderForm } from './OrderForm';
import './OrdersWorkspace.css';

interface OrdersWorkspaceProps {
  controller: ReturnType<typeof useOrders>;
  navigation: React.ReactNode;
  appearanceControl: React.ReactNode;
  status: React.ReactNode;
  backupActions: React.ReactNode;
  openOrderId?: string;
  onOpenAgenda: (date: string) => void;
}
function deliveryLabel(order: Order) {
  return order.deliveryDate ? `${order.deliveryDate.split('-').reverse().join('/')}${order.deliveryTime ? ` · ${order.deliveryTime}` : ''}` : 'Sin fecha de entrega';
}
export function OrdersWorkspace({ controller, navigation, appearanceControl, status, backupActions, openOrderId, onOpenAgenda }: OrdersWorkspaceProps) {
  const { orders, loading, error, saving, hasExternalChanges } = controller;
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'active' | OrderStatus>('active');
  const [editing, setEditing] = React.useState<Order | null | undefined>(undefined);
  const [deleting, setDeleting] = React.useState<Order | null>(null);
  const [deleteError, setDeleteError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const createRef = React.useRef<HTMLButtonElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => { headingRef.current?.focus(); }, []);
  const visibleOrders = filterOrders(orders, search, filter);
  const activeCount = orders.filter(isActiveOrder).length;
  const lastRequest = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (!openOrderId || openOrderId === lastRequest.current || loading) return;
    const order = orders.find(item => item.id === openOrderId);
    if (order) { setEditing(order); lastRequest.current = openOrderId; }
  }, [openOrderId, orders, loading]);
  const closeForm = () => { setEditing(undefined); queueMicrotask(() => createRef.current?.focus()); };
  const save = async (...args: Parameters<typeof controller.saveOrder>) => {
    const result = await controller.saveOrder(...args);
    if (result.ok) setMessage(args[1] ? 'Pedido actualizado.' : 'Pedido guardado en este navegador.');
    return result;
  };

  return <main className="App OrdersWorkspace" aria-labelledby="orders-title">
    <a className="SkipLink" href="#orders-list">Saltar a los pedidos</a>
    {status}
    <header><div className="App-headingRow"><div><p className="Orders-eyebrow">TaskFlow</p><h1 id="orders-title" ref={headingRef} tabIndex={-1}>Pedidos</h1></div>{appearanceControl}</div>
      <p className="Orders-muted">Registra lo que te encargan y organiza su entrega.</p>
    </header>
    <div className="Orders-toolbar">{navigation}<details className="Orders-data"><summary>Exportar / importar</summary><div>{backupActions}</div></details></div>
    {error && <div role="alert" className="Orders-error">{error} <button onClick={() => void controller.reload()} type="button">Reintentar carga</button></div>}
    {hasExternalChanges && <div className="Orders-notice" role="status">Hay cambios en otra pestaña. Actualiza antes de guardar. <button type="button" onClick={() => void controller.reload()}>Actualizar pedidos</button></div>}
    <div className="Orders-listHeader"><p>{activeCount === 1 ? '1 pedido activo' : `${activeCount} pedidos activos`} · {orders.length} en total</p><button className="Orders-primary" ref={createRef} disabled={loading || saving || Boolean(error) || hasExternalChanges} onClick={() => setEditing(null)} type="button">Nuevo pedido</button></div>
    <div className="Orders-filters"><label>Buscar pedidos<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Cliente, producto o servicio" /></label>
      <label>Filtrar pedidos<select value={filter} onChange={event => setFilter(event.target.value as typeof filter)}><option value="active">Activos</option><option value="all">Todos</option>{Object.entries(ORDER_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
    {message && <p role="status" className="Orders-muted">{message}</p>}
    <section id="orders-list" aria-label="Lista de pedidos" tabIndex={-1}>
      {loading ? <p role="status">Cargando pedidos…</p> : !orders.length ? <div className="Orders-empty"><h2>Todavía no hay pedidos</h2><p>Anota un encargo recibido por WhatsApp, teléfono o personalmente.</p></div> : !visibleOrders.length ? <p>No hay pedidos para esta búsqueda o estado.</p> : <ul className="Orders-list">
        {visibleOrders.map(order => <li key={order.id} className="OrderCard">
          <div className="OrderCard-heading"><h2>{order.customerName}</h2><span className={`Orders-badge Orders-badge--${order.status}`}>{ORDER_STATUSES[order.status]}</span></div>
          <ul className="OrderCard-items">{order.items.map((item, index) => <li key={index}>{item.quantity} × {item.description}</li>)}</ul>
          <p className="OrderCard-delivery">Entrega: <strong>{deliveryLabel(order)}</strong></p>
          {order.contact && <p className="Orders-muted">Contacto: {order.contact}</p>}
          <p className="Orders-muted">{paymentLabel(order)}{order.amountCents !== null ? ` · ${formatOrderMoney(order.amountCents, order.currency)} · Saldo ${formatOrderMoney(order.amountCents - order.paidCents, order.currency)}` : ''}</p>
          <div className="OrderCard-actions"><button type="button" onClick={() => setEditing(order)}>Editar pedido de {order.customerName}</button>
            {isActiveOrder(order) && order.deliveryDate && <button type="button" onClick={() => onOpenAgenda(order.deliveryDate!)}>Ver en agenda</button>}
            <label>Estado de {order.customerName}<select aria-label={`Estado de ${order.customerName}`} disabled={saving || hasExternalChanges || Boolean(error)} value={order.status} onChange={async event => {
              const result = await controller.saveOrder({ ...order, status: event.target.value as OrderStatus }, order.id);
              setMessage(result.ok ? 'Estado del pedido actualizado.' : result.error);
            }}>{Object.entries(ORDER_STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <button type="button" className="Orders-danger" onClick={() => { setDeleteError(''); setDeleting(order); }} disabled={saving}>Eliminar pedido de {order.customerName}</button>
          </div>
        </li>)}
      </ul>}
    </section>
    <p className="Orders-localNote">Sin cuenta ni nube. Descarga un backup para conservar tus pedidos; contiene datos de tus clientes.</p>
    {editing !== undefined && <Modal label={editing ? 'Editar pedido' : 'Nuevo pedido'} variant="side" onClose={saving ? undefined : closeForm}><OrderForm order={editing ?? undefined} saving={saving} onCancel={closeForm} onSave={save} /></Modal>}
    {deleting && <Modal label="Eliminar pedido" onClose={saving ? undefined : () => { setDeleting(null); setDeleteError(''); }}><div className="OrderForm"><h2>Eliminar pedido</h2><p>Se eliminará el pedido de {deleting.customerName} y sus compromisos vinculados. Esta acción no se puede deshacer.</p>
      {deleteError && <p role="alert" className="Orders-error">{deleteError}</p>}
      <div className="OrderForm-actions"><button type="button" disabled={saving} onClick={() => { setDeleting(null); setDeleteError(''); }}>Cancelar</button><button type="button" className="Orders-danger" disabled={saving} onClick={async () => {
        const result = await controller.deleteOrder(deleting.id);
        if (result.ok) { setDeleting(null); setDeleteError(''); setMessage('Pedido eliminado.'); } else setDeleteError(result.error);
      }}>Eliminar pedido</button></div></div></Modal>}
  </main>;
}
