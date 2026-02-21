import React from 'react';
import { useLocalStorage } from './useLocalStorage';

function useTodos() {

    const { 
        item: todos,
        saveItem: saveTodos,
        sincronizeItem: sincronizeTodos,
        loading,
        error
        } = useLocalStorage(
                'TODOS_V1',
                []
            );
  
    const [searchValue, setSearchValue] =
     React.useState('');

    const [openModal, setOpenModal] =
     React.useState(false);


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
        newTodos[todoIndex].completed = !newTodos[todoIndex].completed;
        saveTodos(newTodos);
    }

    const deleteTodo = (text) => {
        const newTodos = [...todos];
        const todoIndex = newTodos.findIndex(todo => todo.text === text);
        newTodos.splice(todoIndex, 1);
        saveTodos(newTodos)
    }

    const addTodo = (text) => {
        const newTodos = [...todos];
        newTodos.push({ text, completed: false });
        saveTodos(newTodos);
    }

    const toogleModal = () => {
        setOpenModal(!openModal);
    }

    return {
            searchValue,
            setSearchValue,
            completedTodos,
            totalTodos,
            searchTodos,
            completeTodo,
            deleteTodo,
            loading,
            error,
            openModal,
            toogleModal,
            addTodo,
            sincronizeTodos
        }
}

export { useTodos }; 

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