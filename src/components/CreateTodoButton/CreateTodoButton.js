import './CreateTodoButton.css';
import React from 'react';


function CreateTodoButton({ toogleModal }) {
  return (
    <button className="CreateTodoButton"
    onClick={() => {toogleModal()}}>+</button>
  );
}

export { CreateTodoButton };
