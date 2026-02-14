/* import './TodosError.css'; */
import React from 'react';


function TodosError() {
 
  
  return (
    <div className="ErrorTodo-container">
        <p className="ErrorTodo-completeIcon">C</p>
        <p className="ErrorTodo-text">Hubo un error...</p>
        <p className="ErrorTodo-deleteIcon">D</p>
    </div>
  )
}

export { TodosError };