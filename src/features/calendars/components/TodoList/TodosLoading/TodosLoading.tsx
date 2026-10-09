import './TodosLoading.css';

function TodosLoading() {

  return (
    <div className="LoadingTodo-container">
        <p className="LoadingTodo-completeIcon">C</p>
        <p className="LoadingTodo-text"></p>
        <p className="LoadingTodo-deleteIcon">D</p>
    </div>
  )
}

export { TodosLoading };
