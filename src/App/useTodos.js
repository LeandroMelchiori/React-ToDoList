import React from 'react';
import { useLocalStorage } from './useLocalStorage';

function useTodos() {
    const { 
        item: todos,
        saveItem: saveTodos,
        sincronizeItem: sincronizeTodos,
        loading,
        error
        } = useLocalStorage('TODOS_V1',[]);
  
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

    const states = {
        loading,
        error,
        searchValue,
        totalTodos,
        completedTodos,
        searchTodos,
        openModal,
    }

    const stateUpdaters = {
        setSearchValue,
        completeTodo,
        deleteTodo,
        toogleModal,
        addTodo,
        sincronizeTodos
    }

    return { states, stateUpdaters };
}

export { useTodos }; 