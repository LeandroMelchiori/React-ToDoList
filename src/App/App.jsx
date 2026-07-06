import './App.css';
import { useTodos } from './useTodos';
import { TodoCounter } from '../components/TodoHeader/TodoCounter/TodoCounter';
import { TodoSearch } from '../components/TodoHeader/TodoSearch/TodoSearch';
import { TodoFilters } from '../components/TodoHeader/TodoFilters/TodoFilters';
import { TodoBackupActions } from '../components/TodoHeader/TodoBackupActions/TodoBackupActions';
import { TodoList } from '../components/TodoList/TodoList';
import { TodoItem } from '../components/TodoList/TodoItem/TodoItem';
import { CreateTodoButton } from '../components/CreateTodoButton/CreateTodoButton';
import { Modal } from '../components/Modal/Modal';
import { TodoForm } from '../components/TodoList/TodoForm/TodoForm';
import { DeleteTodoDialog } from '../components/TodoList/DeleteTodoDialog/DeleteTodoDialog';
import { TodoHeader } from '../components/TodoHeader/TodoHeader';
import { TodosLoading } from '../components/TodoList/TodosLoading/TodosLoading';
import { TodosError } from '../components/TodoList/TodosError/TodosError';
import { EmptyTodos } from '../components/TodoList/EmptyTodos/EmptyTodos';
import { ChangeAlert } from '../components/ChangeAlert/ChangeAlert';
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle';
import { useTheme } from './useTheme';

function App() {

    const { states, stateUpdaters } = useTodos();
    const { isDarkTheme, toggleTheme } = useTheme();

    const { 
        loading,
        error,
        searchValue,
        filter,
        totalTodos,
        completedTodos,
        pendingTodos,
        visibleTodos,
        openModal,
        editingTodo,
        deletingTodo,
    } = states;
    
    const {
        setSearchValue,
        setFilter,
        completeTodo,
        openCreateModal,
        startEditingTodo,
        startDeletingTodo,
        confirmDeleteTodo,
        closeModal,
        addTodo,
        updateTodo,
        exportTodos,
        importTodos,
        syncTodos
    } = stateUpdaters;

    const formMode = editingTodo ? 'edit' : 'create';
    const modalLabel = deletingTodo ? 'Eliminar tarea' : editingTodo ? 'Editar tarea' : 'Crear tarea';

    return (
        <>
            <main className="App">
                <ThemeToggle
                    isDarkTheme={isDarkTheme}
                    onToggleTheme={toggleTheme}
                />

                <TodoHeader loading={loading}>

                <TodoCounter
                    totalTodos={totalTodos}
                    completedTodos={completedTodos}
                />
                <TodoSearch
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                />
                <TodoFilters
                    filter={filter}
                    setFilter={setFilter}
                    totalTodos={totalTodos}
                    completedTodos={completedTodos}
                    pendingTodos={pendingTodos}
                />
                <TodoBackupActions
                    onExportTodos={exportTodos}
                    onImportTodos={importTodos}
                />
            </TodoHeader>

            <TodoList
                error={error}
                loading={loading}
                visibleTodos={visibleTodos}
                totalTodos={totalTodos}
                searchValue={searchValue}
                onError={() => <TodosError />}
                onLoading={() => <TodosLoading />}
                onEmptyTodos={() => <EmptyTodos />}
                onEmptySearchResults={() => (
                    <p className="TodoList-emptySearch">
                        No hay tareas que coincidan con tu busqueda.
                    </p>
                )}
                render={todo => (
                        <TodoItem
                            key={todo.id}
                            text={todo.text}
                            completed={todo.completed}
                            priority={todo.priority}
                            dueDate={todo.dueDate}
                            onComplete={() => completeTodo(todo.id)}
                            onEdit={() => startEditingTodo(todo.id)}
                            onDelete={() => startDeletingTodo(todo.id)}
                    />
                )}
            />

            <CreateTodoButton
                onCreateTodo={openCreateModal}
                loading={loading}
             />
            </main>

            {openModal && (
                <Modal label={modalLabel} onClose={closeModal}>
                    {deletingTodo ? (
                        <DeleteTodoDialog
                            todoText={deletingTodo.text}
                            onCancel={closeModal}
                            onConfirm={confirmDeleteTodo}
                        />
                    ) : (
                        <TodoForm 
                            initialValue={editingTodo?.text || ''}
                            initialPriority={editingTodo?.priority}
                            initialDueDate={editingTodo?.dueDate}
                            label={editingTodo ? 'Editar tarea' : 'Nueva tarea'}
                            mode={formMode}
                            onCancel={closeModal}
                            onSubmitTodo={(text, details) => (
                                editingTodo ? updateTodo(editingTodo.id, text, details) : addTodo(text, details)
                            )}
                            submitLabel={editingTodo ? 'Guardar' : 'Agregar'}
                        />
                    )}
                </Modal>
            )}

            <ChangeAlert
                syncTodos={syncTodos} />
        </>
    );
}

export default App;
