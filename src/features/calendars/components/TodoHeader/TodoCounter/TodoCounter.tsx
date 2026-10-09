import './TodoCounter.css';

interface TodoCounterProps {
  totalTodos: number;
  totalItems?: number;
  completedTodos: number;
  loading?: boolean;
}

function TodoCounter({ totalTodos, totalItems = totalTodos, completedTodos, loading }: TodoCounterProps) {
  if (loading) {
    return (
      <div className="TodoCounterBlock">
        <p className="TodoCounter-eyebrow">TaskFlow</p>
        <h1 className="TodoCounter TodoCounter--loading" id="app-title">Cargando...</h1>
      </div>
    );
  }

  if (totalTodos === 0 && totalItems === 0) {
    return (
      <div className="TodoCounterBlock">
        <p className="TodoCounter-eyebrow">TaskFlow</p>
        <h1 className="TodoCounter" id="app-title">Organiza tu dia con una primera tarea</h1>
      </div>
    );
  }

  if (totalTodos === 0) {
    return (
      <div className="TodoCounterBlock">
        <p className="TodoCounter-eyebrow">TaskFlow</p>
        <h1 className="TodoCounter" id="app-title">Tu agenda no tiene tareas pendientes</h1>
      </div>
    );
  }

  if (completedTodos === totalTodos) {
    return (
      <div className="TodoCounterBlock">
        <p className="TodoCounter-eyebrow">TaskFlow</p>
        <h1 className="TodoCounter" id="app-title">Completaste todas tus tareas</h1>
      </div>
    );
  }

  return (
    <div className="TodoCounterBlock">
      <p className="TodoCounter-eyebrow">TaskFlow</p>
      <h1 className="TodoCounter" id="app-title">
        Completaste <span>{completedTodos}</span> de <span>{totalTodos}</span> tareas
      </h1>
    </div>
  );
}

export { TodoCounter };
