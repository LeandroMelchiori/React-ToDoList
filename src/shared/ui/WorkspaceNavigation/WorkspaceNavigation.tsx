import './WorkspaceNavigation.css';

interface WorkspaceNavigationProps {
  active: 'planning' | 'tasks' | 'orders';
  onPlanning: () => void;
  onTasks: () => void;
  onOrders?: () => void;
}
export function WorkspaceNavigation({ active, onPlanning, onTasks, onOrders }: WorkspaceNavigationProps) {
  return <nav aria-label="Espacios de trabajo" className="TodoViewNavigation-primary WorkspaceNavigation">
    <button aria-pressed={active === 'planning'} onClick={onPlanning} type="button">Planificación</button>
    <button aria-pressed={active === 'tasks'} onClick={onTasks} type="button">Tareas</button>
    {onOrders && <button aria-pressed={active === 'orders'} onClick={onOrders} type="button">Pedidos</button>}
  </nav>;
}
