import './css/TodoCounter.css';

function TodoCounter({ total, completed }) {
  return (
       
    total === 0 ?
      <h1 className="TodoCounter">¡No tienes TODOs agendados!</h1>
      :
    completed === total ?
     <h1 className="TodoCounter">¡Has completado todos tus TODOs!</h1>
      :
    <h1 className="TodoCounter">
      Has completado <span>{completed}</span> de <span>{total}</span> TODOs
      </h1>
  );
}

export { TodoCounter };
