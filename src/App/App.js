import './App.css';
import React from 'react';
import { useTodos } from './useTodos';
import { TodoCounter } from '../components/TodoHeader/TodoCounter/TodoCounter';
import { TodoSearch } from '../components/TodoHeader/TodoSearch/TodoSearch';
import { TodoList } from '../components/TodoList/TodoList';
import { TodoItem } from '../components/TodoList/TodoItem/TodoItem';
import { CreateTodoButton } from '../components/CreateTodoButton/CreateTodoButton';
import { Modal } from '../components/Modal/Modal';
import { TodoForm } from '../components/TodoList/TodoForm/TodoForm';
import { TodoHeader } from '../components/TodoHeader/TodoHeader';
import { TodosLoading } from '../components/TodoList/TodosLoading/TodosLoading';
import { TodosError } from '../components/TodoList/TodosError/TodosError';
import { EmptyTodos } from '../components/TodoList/EmptyTodos/EmptyTodos';
import { ChangeAlertWithStorageListener } from '../components/ChangeAlert/ChangeAlert';

function App() {

    const {
        loading,
        error,
        searchTodos,
        completeTodo,
        deleteTodo,
        openModal,
        toogleModal,
        addTodo,
        totalTodos,
        completedTodos,
        searchValue,
        setSearchValue,
        sincronizeTodos,

    } = useTodos();

    return (
        <>
            <TodoHeader
                loading={loading}>

                <TodoCounter
                    totalTodos={totalTodos}
                    completedTodos={completedTodos}
                />
                <TodoSearch
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    sincronize={sincronizeTodos}
                />
            </TodoHeader>

            <TodoList
                error={error}
                loading={loading}
                searchTodos={searchTodos}
                totalTodos={totalTodos}
                searchValue={searchValue}
                onError={() => <TodosError />}
                onLoading={() => <TodosLoading />}
                onEmptyTodos={() => <EmptyTodos />}
                onEmptySearchResults={() => <p>No hay resultados para "{searchValue}"</p>}
                render={todo => (
                    <TodoItem
                        key={todo.text}
                        text={todo.text}
                        completed={todo.completed}
                        onComplete={() => completeTodo(todo.text)}
                        onDelete={() => deleteTodo(todo.text)}
                    />
                )}
            >
                {
                    todo => (
                        <TodoItem
                            key={todo.text}
                            text={todo.text}
                            completed={todo.completed}
                            onComplete={() => completeTodo(todo.text)}
                            onDelete={() => deleteTodo(todo.text)}
                            />
                    )
                }
            </TodoList>

            <CreateTodoButton
                toogleModal={toogleModal}
                loading={loading}
             />

            {openModal && (
                <Modal>
                    <TodoForm 
                        addTodo={addTodo}
                        toogleModal={toogleModal}
                    />
                </Modal>
            )}

            <ChangeAlertWithStorageListener
                sincronize={sincronizeTodos} />
        </>
    );
}

export default App;