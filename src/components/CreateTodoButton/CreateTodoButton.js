import './CreateTodoButton.css';

function CreateTodoButton() {
  return (
    <button className="CreateTodoButton"
    onClick={() => {console.log('Button clicked')}}>+</button>
  );
}

export { CreateTodoButton };
