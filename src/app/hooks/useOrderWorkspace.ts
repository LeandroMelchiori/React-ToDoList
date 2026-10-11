import React from 'react';
import { useCalendar } from '../../features/calendars/useCalendar';
import { useOrders } from '../../features/orders/useOrders';
import { orderAgendaEntries } from '../../shared/orders/orderAgenda';
import { createTodoWorkspaceBackup, readTodoWorkspaceBackup } from '../../shared/calendar/todoWorkspaceBackup';
import { createTodosCalendarExport, readTodosCalendarImport } from '../../shared/calendar/todoCalendarIcs';
import { splitImportedTodos } from '../../shared/calendar/todoModel';
import { setStoredItems } from '../../features/sync/storage';
import { ORDERS_STORAGE_KEY } from '../../shared/orders/orderModel';

export function useOrderWorkspace() {
  const calendar = useCalendar();
  const orders = useOrders();
  const agendaEntries = React.useMemo(() => orderAgendaEntries(orders.orders), [orders.orders]);
  const allAgenda = [...calendar.states.reminderTodos, ...agendaEntries.map(entry => entry.todo)];
  const exportWorkspace = () => createTodoWorkspaceBackup({ ...calendar.stateUpdaters.exportTodos(), orders: orders.orders });
  const previewWorkspace = (value: unknown) => {
    const preview = calendar.stateUpdaters.previewTodosImport(value);
    const read = readTodoWorkspaceBackup(value);
    return preview.ok && read.ok && read.backup.orders !== undefined
      ? { ...preview, orderCount: read.backup.orders.length } : preview;
  };
  const importWorkspace = async (value: unknown, options: Parameters<typeof calendar.stateUpdaters.importTodos>[1]) => {
    const preview = previewWorkspace(value);
    if (!preview.ok) return preview;
    const read = readTodoWorkspaceBackup(value);
    if (!read.ok || read.backup.orders === undefined) return calendar.stateUpdaters.importTodos(value, options);
    if (options?.mode === 'merge') return { ok: false, error: 'El backup completo requiere restauración, no fusión.' };
    if (calendar.states.loading || calendar.states.error || orders.loading || orders.saving || orders.hasExternalChanges || orders.error) {
      return { ok: false, error: 'Espera la carga o actualiza los datos antes de restaurar.' };
    }
    try {
      calendar.stateUpdaters.createManualTodoSnapshot();
      const backup = read.backup;
      await setStoredItems({ TODOS_V1: JSON.stringify(backup.todos), TODO_BOARDS_V1: JSON.stringify(backup.boards),
        ACTIVE_TODO_BOARD_V1: JSON.stringify(backup.activeBoardId), TODO_SAVED_VIEWS_V1: JSON.stringify(backup.savedViews),
        [ORDERS_STORAGE_KEY]: JSON.stringify({ version: 1, orders: backup.orders }) });
      calendar.stateUpdaters.reloadWorkspace();
      await orders.reload();
      return { ok: true, mode: 'workspace', count: read.totalTodos, boardCount: backup.boards.length,
        savedViewCount: backup.savedViews.length, orderCount: backup.orders!.length };
    } catch {
      return { ok: false, error: 'No se pudo guardar el backup completo. Revisa el almacenamiento y vuelve a intentarlo.' };
    }
  };
  const previewCalendar = (content: unknown) => {
    const read = readTodosCalendarImport(content);
    if (!read.ok) return read;
    const split = splitImportedTodos(allAgenda, read.todos);
    return { ok: true, kind: 'calendar', totalCount: read.todos.length, newCount: split.newTodos.length, duplicateCount: split.duplicateTodos.length };
  };
  const importCalendar = (content: unknown) => {
    const read = readTodosCalendarImport(content);
    if (!read.ok) return read;
    const split = splitImportedTodos(allAgenda, read.todos);
    if (!split.newTodos.length) return { ok: true, mode: 'calendar', count: 0, skippedDuplicates: split.duplicateTodos.length };
    const result = calendar.stateUpdaters.importCalendar(createTodosCalendarExport(split.newTodos).content);
    return result.ok ? { ...result, skippedDuplicates: result.skippedDuplicates + split.duplicateTodos.length } : result;
  };
  return { calendar, orders, agendaEntries, exportWorkspace, previewWorkspace, importWorkspace,
    exportCalendar: () => createTodosCalendarExport(allAgenda), previewCalendar, importCalendar };
}
