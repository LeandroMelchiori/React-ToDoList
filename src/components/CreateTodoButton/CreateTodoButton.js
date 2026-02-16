import './CreateTodoButton.css';
import { TodoContext } from '../../TodoContext/TodoContext';
import React from 'react';


function CreateTodoButton() {
  const { toogleModal } = React.useContext(TodoContext);
 
  return (
    <button className="CreateTodoButton"
    onClick={() => {toogleModal()}}>+</button>
  );
}

export { CreateTodoButton };
