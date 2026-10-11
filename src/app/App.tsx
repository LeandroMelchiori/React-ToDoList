import React from 'react';
import { CalendarWorkspace } from '../features/calendars/CalendarWorkspace';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import { PwaStatus } from './components/PwaStatus/PwaStatus';
import { useTheme } from './hooks/useTheme';
import { usePwaStatus } from './hooks/usePwaStatus';
import { useOrderWorkspace } from './hooks/useOrderWorkspace';
import { useCalendarReminders } from '../features/calendars/useCalendar';
import type { TodoViewMode } from '../features/calendars/useCalendar';
import { WorkspaceNavigation } from '../shared/ui/WorkspaceNavigation/WorkspaceNavigation';
import { TodoBackupActions } from '../features/calendars/components/TodoHeader/TodoBackupActions/TodoBackupActions';

const OrdersWorkspace = React.lazy(() => import('../features/orders/OrdersWorkspace').then(module => ({ default: module.OrdersWorkspace })));

function App() {
  const { isDarkTheme, toggleTheme } = useTheme();
  const pwa = usePwaStatus();
  const workspace = useOrderWorkspace();
  const { calendar, orders, agendaEntries } = workspace;
  const reminders = useCalendarReminders(calendar.states.reminderTodos);
  const [section, setSection] = React.useState<'calendar' | 'orders'>('calendar');
  const [calendarView, setCalendarView] = React.useState<TodoViewMode | undefined>(undefined);
  const [agendaDate, setAgendaDate] = React.useState<string | undefined>();
  const [openOrderId, setOpenOrderId] = React.useState<string | undefined>();
  const visitedOrdersRef = React.useRef(false);
  React.useEffect(() => {
    if (section === 'orders') visitedOrdersRef.current = true;
    else if (visitedOrdersRef.current) document.querySelector<HTMLElement>('main.App')?.focus();
  }, [section]);
  const appearance = <ThemeToggle isDarkTheme={isDarkTheme} onToggleTheme={toggleTheme} />;
  const status = <PwaStatus hasUpdate={pwa.hasUpdate} isOfflineReady={pwa.isOfflineReady} isOnline={pwa.isOnline} onApplyUpdate={pwa.applyUpdate} />;
  const openCalendar = (view: TodoViewMode, date?: string) => {
    setCalendarView(view); setAgendaDate(date); setSection('calendar');
    if (date) { calendar.stateUpdaters.setSearchValue(''); calendar.stateUpdaters.setFilter('all'); calendar.stateUpdaters.clearFacetFilters(); }
  };
  const backupActions = <>
    {(orders.error || orders.hasExternalChanges) && <p role="alert">{orders.error || 'Actualiza los pedidos antes de importar o exportar.'} <button type="button" onClick={() => void orders.reload()}>Actualizar pedidos</button></p>}
    <TodoBackupActions loading={calendar.states.loading || orders.loading || orders.saving || Boolean(orders.error) || orders.hasExternalChanges}
      activeBoardId={calendar.states.activeBoardId} onExportTodos={workspace.exportWorkspace} onExportCalendar={workspace.exportCalendar}
      onPreviewImport={workspace.previewWorkspace} onPreviewCalendarImport={workspace.previewCalendar}
      onImportTodos={workspace.importWorkspace} onImportCalendar={workspace.importCalendar} />
  </>;

  return (
    section === 'orders' ? <React.Suspense fallback={<p role="status">Cargando pedidos…</p>}>
      <OrdersWorkspace controller={orders} appearanceControl={appearance} status={status} backupActions={backupActions} openOrderId={openOrderId}
        onOpenAgenda={date => openCalendar('calendar', date)} navigation={<WorkspaceNavigation active="orders" onPlanning={() => openCalendar('agenda')} onTasks={() => openCalendar('list')} onOrders={() => undefined} />} />
    </React.Suspense> : <CalendarWorkspace
      controller={calendar}
      reminderStatus={reminders}
      initialView={calendarView}
      initialDate={agendaDate}
      onViewChange={view => { setCalendarView(view); setAgendaDate(undefined); }}
      onOpenOrders={() => { setOpenOrderId(undefined); setSection('orders'); }}
      agendaItems={agendaEntries.map(entry => entry.todo)}
      onOpenAgendaItem={id => {
        const entry = agendaEntries.find(item => item.todo.id === id);
        if (!entry) return false;
        setOpenOrderId(entry.orderId); setSection('orders'); return true;
      }}
      backupActions={backupActions}
      isDarkTheme={isDarkTheme}
      onToggleTheme={toggleTheme}
      appearanceControl={appearance}
      status={status}
    />
  );
}

export default App;
