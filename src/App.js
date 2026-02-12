import { TodoCounter } from './components/TodoCounter';
import { TodoSearch } from './components/TodoSearch';
import { TodoList } from './components/TodoList';
import { CreateTodoButton } from './components/CreateTodoButton';
import { TodoItem } from './components/TodoItem';
import React from 'react';
import './App.css';


/* const defaultTodos = [
  { text: 'Cortar cebolla', completed: true },
  { text: 'Tomar el curso de intro a React', completed: false },
  { text: 'Llorar con la llorona', completed: false },
  { text: 'Ver a mi exa', completed: false },
  { text: 'LALALALALA', completed: true },
];

 */
function App() {
  
  const localStorageTodos = localStorage.getItem('TODOS_V1');
  
  let parsedTodos;

  if (!localStorageTodos) {
    localStorage.setItem(
      'TODOS_V1',
       JSON.stringify([]));
    parsedTodos = [];
  } else {
    parsedTodos = JSON.parse(localStorageTodos);
  }
  

  const [todos, setTodos] = React.useState(parsedTodos);
  const [searchValue, setSearchValue] = React.useState('');

  const completedTodos = todos.filter(todo => !!todo.completed).length;
  const totalTodos = todos.length;

  const searchTodos = todos.filter(todo => {
    const todoText = todo.text.toLowerCase();
    const searchText = searchValue.toLowerCase();
    return todoText.includes(searchText);
  });

  console.log('Search Value: ' + searchValue);
  
  const saveTodos = (newTodos) => {
    localStorage.setItem('TODOS_V1', JSON.stringify(newTodos));
    setTodos(newTodos);
  }

  const completeTodo = (text) => {
    const newTodos = [...todos];
    const todoIndex = newTodos.findIndex(todo => todo.text === text);
    newTodos[todoIndex].completed = true;
    saveTodos(newTodos);
  }

  const deleteTodo = (text) => {
    const newTodos = [...todos];
    const todoIndex = newTodos.findIndex(todo => todo.text === text);
    newTodos.splice(todoIndex, 1);
    saveTodos(newTodos)
  }


  return (
    <>
      <TodoCounter 
      completed={completedTodos} 
      total={totalTodos} />
      
      <TodoSearch 
      searchValue={searchValue}
      setSearchValue={setSearchValue}
      />

      <TodoList>
        {searchTodos.map(todo => (
          <TodoItem 
          key={todo.text} 
          text={todo.text} 
          completed={todo.completed}
          onComplete={() => completeTodo(todo.text)}
          onDelete={() => deleteTodo(todo.text)}
          />
        ))}
      </TodoList>

      <CreateTodoButton />
    </>
  );}


export default App;