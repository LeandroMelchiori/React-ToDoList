import React from 'react';
import { moneyInput, parseMoney, validateOrder } from '../../shared/orders/orderModel';
import type { Order, OrderDraft, OrderResult } from '../../shared/orders/orderModel';
import './OrdersWorkspace.css';

interface OrderFormProps { order?: Order; saving: boolean; onCancel: () => void; onSave: (draft: OrderDraft, id?: string) => Promise<OrderResult> }
export function OrderForm({ order, saving, onCancel, onSave }: OrderFormProps) {
  const [customerName, setCustomer] = React.useState(order?.customerName ?? '');
  const [contact, setContact] = React.useState(order?.contact ?? '');
  const [items, setItems] = React.useState(order?.items ?? [{ description: '', quantity: 1 }]);
  const [deliveryDate, setDeliveryDate] = React.useState(order?.deliveryDate ?? '');
  const [deliveryTime, setDeliveryTime] = React.useState(order?.deliveryTime ?? '');
  const [currency, setCurrency] = React.useState<Order['currency']>(order?.currency ?? 'ARS');
  const [amount, setAmount] = React.useState(moneyInput(order?.amountCents ?? null));
  const [paid, setPaid] = React.useState(order?.paidCents ? moneyInput(order.paidCents) : '');
  const [error, setError] = React.useState('');
  const errorRef = React.useRef<HTMLParagraphElement>(null);
  const submittingRef = React.useRef(false);
  const fail = (message: string) => { setError(message); queueMicrotask(() => errorRef.current?.focus()); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current || saving) return;
    const amountCents = parseMoney(amount);
    const paidCents = parseMoney(paid);
    if (amountCents === undefined || paidCents === undefined) { fail('Usa importes positivos con hasta dos decimales, por ejemplo 2500,50.'); return; }
    const draft: OrderDraft = { customerName, contact, items, notes: order?.notes ?? '', status: order?.status ?? 'received', deliveryDate: deliveryDate || null,
      deliveryTime: deliveryTime || null, currency, amountCents, paidCents: paidCents ?? 0,
      // Preserve historical metadata in local backups when editing an existing order.
      preparation: order?.preparation ?? null };
    const validation = validateOrder(draft);
    if (validation) { fail(validation); return; }
    submittingRef.current = true;
    try {
      const result = await onSave(draft, order?.id);
      if (result.ok) onCancel(); else fail(result.error);
    } catch { fail('No se pudo guardar. Tus datos siguen en el formulario.'); }
    finally { submittingRef.current = false; }
  };
  const changeItem = (index: number, changes: Partial<OrderDraft['items'][number]>) => setItems(current => current.map((item, i) => i === index ? { ...item, ...changes } : item));

  return <form className="OrderForm" onSubmit={submit} noValidate>
    <h2>{order ? 'Editar pedido' : 'Nuevo pedido'}</h2>
    <p className="Orders-muted">Carga manual. Solo se guarda en este navegador.</p>
    <label>Cliente <input autoComplete="off" value={customerName} onChange={event => setCustomer(event.target.value)} maxLength={120} required /></label>
    <label>Contacto (opcional) <input value={contact} onChange={event => setContact(event.target.value)} maxLength={240} placeholder="Teléfono, usuario o email" /></label>
    <fieldset className="OrderForm-items"><legend>Productos o servicios</legend>
      {items.map((item, index) => <div className="OrderForm-item" key={index}>
        <label>Detalle {index + 1}<input value={item.description} onChange={event => changeItem(index, { description: event.target.value })} maxLength={240} required /></label>
        <label>Cantidad {index + 1}<input type="number" min="1" max="999999" step="1" value={Number.isNaN(item.quantity) ? '' : item.quantity} onChange={event => changeItem(index, { quantity: event.target.value === '' ? NaN : Number(event.target.value) })} required /></label>
        {items.length > 1 && <button type="button" aria-label={`Quitar detalle ${index + 1}`} onClick={() => setItems(current => current.filter((_, i) => i !== index))}>Quitar</button>}
      </div>)}
      <button disabled={items.length >= 50} type="button" onClick={() => setItems(current => [...current, { description: '', quantity: 1 }])}>Agregar producto o servicio</button>
    </fieldset>
    <div className="OrderForm-fields">
      <label>Fecha de entrega o retiro<input type="date" value={deliveryDate} onChange={event => setDeliveryDate(event.target.value)} /></label>
      <label>Hora de entrega (opcional)<input type="time" value={deliveryTime} onChange={event => setDeliveryTime(event.target.value)} /></label>
    </div>
    <p className="Orders-muted">Con fecha aparecerá en la agenda. Con hora reserva una ventana de 30 minutos; sin hora no bloquea toda la jornada.</p>
    <details open={order?.amountCents !== null && order?.amountCents !== undefined}><summary>Importe y cobro</summary>
      <p className="Orders-muted">Seguimiento manual, no procesa pagos. Entregar un pedido no lo marca como pagado.</p>
      <label>Moneda<select value={currency} onChange={event => setCurrency(event.target.value as Order['currency'])}><option value="ARS">ARS — Peso argentino</option><option value="USD">USD — Dólar</option><option value="EUR">EUR — Euro</option></select></label>
      <div className="OrderForm-fields">
        <label>Importe total<input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Ej: 2500,50" /></label>
        <label>Importe cobrado<input inputMode="decimal" value={paid} onChange={event => setPaid(event.target.value)} placeholder="Ej: 500" /></label>
      </div>
    </details>
    {error && <p className="Orders-error" role="alert" ref={errorRef} tabIndex={-1}>{error}</p>}
    <div className="OrderForm-actions"><button type="button" onClick={onCancel} disabled={saving}>Cancelar</button><button className="Orders-primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar pedido'}</button></div>
  </form>;
}
