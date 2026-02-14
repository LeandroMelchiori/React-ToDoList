import React from 'react';
import { useLocalStorage } from './useLocalStorage';

const TodoContext = React.createContext();

function TodoProvider( {children}) {

    const { 
        item: todos,
        saveItem: saveTodos,
        loading,
        error
        } = useLocalStorage(
            'TODOS_V1',
             defaultTodos);
  
    const [searchValue, setSearchValue] = React.useState('');

    const completedTodos = todos.filter(todo => !!todo.completed).length;
    const totalTodos = todos.length;

    const searchTodos = todos.filter(todo => {
        const todoText = todo.text.toLowerCase();
        const searchText = searchValue.toLowerCase();
        return todoText.includes(searchText);
    });

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
        <TodoContext.Provider value={{
            searchValue,
            setSearchValue,
            completedTodos,
            totalTodos,
            searchTodos,
            completeTodo,
            deleteTodo,
            loading,
            error,
        }}>  
            {children}
        </TodoContext.Provider>
    );

}


export { TodoContext, TodoProvider };


const defaultTodos = [
  { text: 'Cortar cebolla', completed: false },
  { text: 'Tomar el curso de intro a React', completed: true },
  { text: 'LALALALALALLA', completed: false },
  { text: 'Terminar el proyecto', completed: false },
  { text: 'Prenderse un churrito', completed: false },
]

async function api(url) {
  const res = await fetch(url)
  const data = await res.json();
  return data;
}

function TodoMessage() {

  const [state, setState] = 
  React.useState({});

  React.useEffect(() => {
    const data = api();
    setState(data);
  }, [])

  return (
    <p>{state.message || "Cargando mensaje..."}</p>
  )
}