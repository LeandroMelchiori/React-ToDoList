import './App.css';
import React from 'react';
import { useTodos } from './useTodos';
import { TodoCounter } from '../components/TodoCounter/TodoCounter';
import { TodoSearch } from '../components/TodoSearch/TodoSearch';
import { TodoList } from '../components/TodoList/TodoList';
import { TodoItem } from '../components/TodoItem/TodoItem';
import { CreateTodoButton } from '../components/CreateTodoButton/CreateTodoButton';
import { Modal } from '../components/Modal/Modal';
import { TodoForm } from '../components/TodoForm/TodoForm';
import { TodoHeader } from '../components/TodoHeader/TodoHeader';
import { TodosLoading } from '../components/TodosLoading/TodosLoading';
import { TodosError } from '../components/TodosError/TodosError';
import { EmptyTodos } from '../components/EmptyTodos/EmptyTodos';

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
        setSearchValue

    } = useTodos();

    return (
        <>
            <TodoHeader>
                {loading ? <h1 className="TodoCounter">Cargando...</h1>
                    :
                    <TodoCounter
                        totalTodos={totalTodos}
                        completedTodos={completedTodos} />
                }
                <TodoSearch
                    searchValue={searchValue}
                    setSearchValue={setSearchValue} />
            </TodoHeader>

            <TodoList
                error={error}
                loading={loading}
                searchTodos={searchTodos}
                onError={() => <TodosError />}
                onLoading={() => <TodosLoading />}
                onEmptyTodos={() => <EmptyTodos />}
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
            </TodoList>

        {/*     <TodoList>
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
            </TodoList> */}
            <CreateTodoButton
                toogleModal={toogleModal}
             />

            {openModal && (
                <Modal>
                    <TodoForm 
                        addTodo={addTodo}
                        toogleModal={toogleModal}
                    />
                </Modal>
            )}
        </>
    );
}

export default App;