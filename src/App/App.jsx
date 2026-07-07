import React from 'react';
import './App.css';
import { useTodos } from './useTodos';
import { TodoCounter } from '../components/TodoHeader/TodoCounter/TodoCounter';
import { TodoSearch } from '../components/TodoHeader/TodoSearch/TodoSearch';
import { TodoFilters } from '../components/TodoHeader/TodoFilters/TodoFilters';
import { TodoFacetFilters } from '../components/TodoHeader/TodoFacetFilters/TodoFacetFilters';
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
import { PwaStatus } from '../components/PwaStatus/PwaStatus';
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle';
import { usePwaStatus } from './usePwaStatus';
import { useTheme } from './useTheme';

function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.isContentEditable ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
}

function App() {

    const { states, stateUpdaters } = useTodos();
    const { isDarkTheme, toggleTheme } = useTheme();
    const {
        applyUpdate,
        hasUpdate,
        isOfflineReady,
        isOnline,
    } = usePwaStatus();
    const searchInputRef = React.useRef(null);

    const { 
        loading,
        error,
        searchValue,
        filter,
        totalTodos,
        completedTodos,
        pendingTodos,
        overdueTodos,
        todayTodos,
        upcomingTodos,
        projectOptions,
        tagOptions,
        activeProject,
        activeTag,
        visibleTodos,
        visibleTodoGroups,
        openModal,
        editingTodo,
        deletingTodo,
    } = states;
    
    const {
        setSearchValue,
        setFilter,
        selectProjectFilter,
        selectTagFilter,
        clearFacetFilters,
        completeTodo,
        toggleSubtask,
        moveTodo,
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

    React.useEffect(() => {
        const handleKeyboardShortcuts = (event) => {
            if (
                event.defaultPrevented ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                isEditableTarget(event.target)
            ) {
                return;
            }

            if (event.key === '/') {
                event.preventDefault();
                searchInputRef.current?.focus();
            }

            if (event.key.toLowerCase() === 'n') {
                event.preventDefault();
                openCreateModal();
            }
        };

        window.addEventListener('keydown', handleKeyboardShortcuts);

        return () => {
            window.removeEventListener('keydown', handleKeyboardShortcuts);
        };
    }, [openCreateModal]);

    return (
        <>
            <main className="App">
                <ThemeToggle
                    isDarkTheme={isDarkTheme}
                    onToggleTheme={toggleTheme}
                />
                <PwaStatus
                    hasUpdate={hasUpdate}
                    isOfflineReady={isOfflineReady}
                    isOnline={isOnline}
                    onApplyUpdate={applyUpdate}
                />

                <TodoHeader loading={loading}>

                <TodoCounter
                    totalTodos={totalTodos}
                    completedTodos={completedTodos}
                />
                <TodoSearch
                    ref={searchInputRef}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                />
                <TodoFilters
                    filter={filter}
                    setFilter={setFilter}
                    totalTodos={totalTodos}
                    completedTodos={completedTodos}
                    pendingTodos={pendingTodos}
                    overdueTodos={overdueTodos}
                    todayTodos={todayTodos}
                    upcomingTodos={upcomingTodos}
                />
                <TodoFacetFilters
                    projectOptions={projectOptions}
                    tagOptions={tagOptions}
                    activeProject={activeProject}
                    activeTag={activeTag}
                    onSelectProject={selectProjectFilter}
                    onSelectTag={selectTagFilter}
                    onClearFacetFilters={clearFacetFilters}
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
                visibleTodoGroups={visibleTodoGroups}
                totalTodos={totalTodos}
                searchValue={searchValue}
                onError={() => <TodosError />}
                onLoading={() => <TodosLoading />}
                onEmptyTodos={() => <EmptyTodos />}
                onEmptySearchResults={() => (
                    <p className="TodoList-emptySearch">
                        {searchValue
                            ? 'No hay tareas que coincidan con tu busqueda.'
                            : 'No hay tareas para este filtro.'}
                    </p>
                )}
                render={todo => (
                        <TodoItem
                            key={todo.id}
                            text={todo.text}
                            completed={todo.completed}
                            priority={todo.priority}
                            dueDate={todo.dueDate}
                            project={todo.project}
                            tags={todo.tags}
                            subtasks={todo.subtasks}
                            canMoveUp={todo.order > 0}
                            canMoveDown={todo.order < totalTodos - 1}
                            onComplete={() => completeTodo(todo.id)}
                            onToggleSubtask={(subtaskId) => toggleSubtask(todo.id, subtaskId)}
                            onMoveUp={() => moveTodo(todo.id, 'up')}
                            onMoveDown={() => moveTodo(todo.id, 'down')}
                            onFilterProject={() => selectProjectFilter(todo.project)}
                            onFilterTag={selectTagFilter}
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
                            initialProject={editingTodo?.project}
                            initialTags={editingTodo?.tags}
                            initialSubtasks={editingTodo?.subtasks}
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
