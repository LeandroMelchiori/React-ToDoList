/* import './EmptyTodos.css'; */
import React from 'react';


function EmptyTodos() {
 
  
  return (
    <div className="EmptyTodo-container">
        <p className="EmptyTodo-completeIcon">C</p>
        <p className="EmptyTodo-text">¡Crea tu primer TODO!</p>
        <p className="EmptyTodo-deleteIcon">D</p>
    </div>
  )
}

export { EmptyTodos };