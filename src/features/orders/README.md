# Pedidos manuales

Entrada pública de estado: `useOrders.ts`. Entrada pública de UI: `OrdersWorkspace.tsx`. No importa la UI ni los hooks internos de calendario.

El formulario incluye cliente/contacto, productos o servicios y cantidades, entrega y seguimiento manual de cobro. El estado se cambia desde la lista de pedidos. Cobro y entrega son estados independientes. Los importes se guardan en centavos enteros, con moneda explícita; no procesa pagos, no calcula impuestos y no emite facturas.

El guardado usa `ORDERS_V1` (envelope versión 1) mediante IndexedDB y espejo localStorage. Los errores conservan el formulario; los datos desconocidos o inválidos no se reparan borrándolos. Los cambios externos requieren actualizar antes de guardar. No requiere cuentas ni backend.

`shared/orders/orderModel.ts` valida y filtra. `orderAgenda.ts` proyecta solo las entregas como eventos, sin escribirlas en `TODOS_V1`. La composición de `app` conecta ambos dominios. Editar fechas actualiza las proyecciones; entregar, cancelar o eliminar retira los compromisos activos. Las observaciones y reservas de preparación antiguas se conservan en los datos y backups, pero no se muestran ni generan eventos; tampoco condicionan la fecha de entrega. Los pedidos son globales al workspace, no pertenecen a un tablero de tareas particular.

Los backups completos JSON versión 2 incluyen pedidos. La restauración usa una transacción de IndexedDB para todas las claves; si IndexedDB no existe, el fallback localStorage intenta revertir una escritura fallida. Backups antiguos sin pedidos preservan los pedidos actuales. Las copias históricas de calendario siguen siendo solo de calendario.

ICS intercambia los compromisos, no el pedido comercial. Incluye nombre del cliente y detalle del encargo; no exporta contacto, observaciones privadas ni cobros. Reimportar el propio ICS omite compromisos vinculados ya presentes. La importación de un ICS ajeno crea eventos de calendario, no pedidos nuevos.

Los datos del cliente y el backup JSON permanecen locales pero no están cifrados por la app. No usar como almacenamiento de credenciales o datos bancarios. El usuario debe proteger sus archivos y su dispositivo.
