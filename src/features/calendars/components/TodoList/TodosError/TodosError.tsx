import './TodosError.css';

function TodosError() {
  return (
    <div className="ErrorTodo-container">
        <p className="ErrorTodo-title">No pudimos cargar tus tareas</p>
        <p className="ErrorTodo-text">Revisa el almacenamiento del navegador e intenta nuevamente.</p>
    </div>
  )
}

export { TodosError };
