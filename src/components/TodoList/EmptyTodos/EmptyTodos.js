import './EmptyTodos.css';
import React from 'react';


function EmptyTodos() {
 
  
  return (
    <div className="EmptyTodo-container">
        <p className="EmptyTodo-completeIcon"></p>
        <p className="EmptyTodo-text"></p>
        <p className="EmptyTodo-deleteIcon"></p>
    </div>
  )
}

export { EmptyTodos };