import { TodoSearch } from '../components/TodoSearch/TodoSearch';
import { TodoList } from '../components/TodoList/TodoList';
import { CreateTodoButton } from '../components/CreateTodoButton/CreateTodoButton';
import { TodoItem } from '../components/TodoItem/TodoItem';
import { TodoCounter } from '../components/TodoCounter/TodoCounter';
import { TodosLoading } from '../components/TodosLoading/TodosLoading';
import { TodosError } from '../components/TodosError/TodosError';
import { EmptyTodos } from '../components/EmptyTodos/EmptyTodos';
import React from 'react';

function AppUI({
    loading,
    error,
    completedTodos,
    totalTodos,
    searchValue,
    setSearchValue,
    searchTodos,
    completeTodo,
    deleteTodo
}) {
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
            {loading ? (
                <>
                    <TodosLoading />
                    <TodosLoading />
                    <TodosLoading />
                </>
                
            ) : error ? (
                <TodosError />
            ) : !searchTodos.length ? (
                <EmptyTodos />
            ) : (
                searchTodos.map(todo => (
                <TodoItem
                    key={todo.text}
                    text={todo.text}
                    completed={todo.completed}
                    onComplete={() => completeTodo(todo.text)}
                    onDelete={() => deleteTodo(todo.text)}
                />
                ))
            )}
        </TodoList>


        <CreateTodoButton />
        </>
    );
}

export { AppUI };