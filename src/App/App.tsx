import React from 'react';
import './App.css';
import { useTodos } from './useTodos';
import { TodoCounter } from '../components/TodoHeader/TodoCounter/TodoCounter';
import { TodoSearch } from '../components/TodoHeader/TodoSearch/TodoSearch';
import { TodoQuickAdd } from '../components/TodoHeader/TodoQuickAdd/TodoQuickAdd';
import { TodoFilters } from '../components/TodoHeader/TodoFilters/TodoFilters';
import { TodoInsights } from '../components/TodoHeader/TodoInsights/TodoInsights';
import { TodoFacetFilters } from '../components/TodoHeader/TodoFacetFilters/TodoFacetFilters';
import { TodoBoards } from '../components/TodoHeader/TodoBoards/TodoBoards';
import { TodoSavedViews } from '../components/TodoHeader/TodoSavedViews/TodoSavedViews';
import { TodoBackupActions } from '../components/TodoHeader/TodoBackupActions/TodoBackupActions';
import { TodoHeaderTools } from '../components/TodoHeader/TodoHeaderTools/TodoHeaderTools';
import { TodoReminderStatus } from '../components/TodoHeader/TodoReminderStatus/TodoReminderStatus';
import { TodoList } from '../components/TodoList/TodoList';
import { TodoItem } from '../components/TodoList/TodoItem/TodoItem';
import { TodoBoardView } from '../components/TodoBoardView/TodoBoardView';
import { TodoCalendar } from '../components/TodoCalendar/TodoCalendar';
import { TodoToday } from '../components/TodoToday/TodoToday';
import { TodoWeekCalendar } from '../components/TodoWeekCalendar/TodoWeekCalendar';
import { TodoViewMode, TodoViewToggle } from '../components/TodoViewToggle/TodoViewToggle';
import { CreateTodoButton } from '../components/CreateTodoButton/CreateTodoButton';
import { Modal } from '../components/Modal/Modal';
import { TodoForm } from '../components/TodoList/TodoForm/TodoForm';
import { DeleteTodoDialog } from '../components/TodoList/DeleteTodoDialog/DeleteTodoDialog';
import { TodoDetail } from '../components/TodoList/TodoDetail/TodoDetail';
import { TodoHeader } from '../components/TodoHeader/TodoHeader';
import { TodosLoading } from '../components/TodoList/TodosLoading/TodosLoading';
import { TodosError } from '../components/TodoList/TodosError/TodosError';
import { EmptyTodos } from '../components/TodoList/EmptyTodos/EmptyTodos';
import { ChangeAlert } from '../components/ChangeAlert/ChangeAlert';
import { PwaStatus } from '../components/PwaStatus/PwaStatus';
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle';
import { UndoToast } from '../components/UndoToast/UndoToast';
import { TodoBulkActions } from '../components/TodoList/TodoBulkActions/TodoBulkActions';
import { BulkDeleteDialog } from '../components/TodoList/BulkDeleteDialog/BulkDeleteDialog';
import { usePwaStatus } from './usePwaStatus';
import { useTheme } from './useTheme';
import { useTodoReminders } from './useTodoReminders';
import { TodoSettings as TodoSettingsPanel } from '../components/TodoHeader/TodoSettings/TodoSettings';
import { TodoSettings, useTodoSettings } from './useTodoSettings';

function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.isContentEditable ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
}

function getTodoDropPosition(event: React.DragEvent<any>): 'before' | 'after' {
    const { top, height } = event.currentTarget.getBoundingClientRect();

    return event.clientY > top + height / 2 ? 'after' : 'before';
}

function App() {

    const { states, stateUpdaters } = useTodos();
    const { isDarkTheme, toggleTheme } = useTheme();
    const { settings, updateSettings } = useTodoSettings();
    const {
        applyUpdate,
        hasUpdate,
        isOfflineReady,
        isOnline,
    } = usePwaStatus();
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const [todoViewMode, setTodoViewMode] = React.useState<TodoViewMode>(settings.defaultView);
    const [isSelectionMode, setIsSelectionMode] = React.useState(false);
    const [selectedTodoIds, setSelectedTodoIds] = React.useState<Set<string>>(() => new Set());
    const [bulkActionMessage, setBulkActionMessage] = React.useState('');
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false);
    const [dragState, setDragState] = React.useState<{
        draggedTodoId: string | null;
        targetTodoId: string | null;
        position: 'before' | 'after' | null;
    }>({
        draggedTodoId: null,
        targetTodoId: null,
        position: null,
    });

    const { 
        loading,
        error,
        searchValue,
        filter,
        todoBoards,
        activeBoardId,
        savedViews,
        totalTodos,
        totalTasks,
        completedTodos,
        filterCounts,
        insights,
        projectOptions,
        tagOptions,
        activeProject,
        activeTag,
        reminderTodos,
        visibleTodos,
        visibleTodoGroups,
        openModal,
        detailTodo,
        editingTodo,
        deletingTodo,
        recentlyDeletedTodo,
    } = states;
    
    const {
        setSearchValue,
        setFilter,
        selectTodoBoard,
        createBoard,
        renameBoard,
        deleteBoard,
        saveCurrentView,
        applySavedView,
        deleteSavedView,
        selectProjectFilter,
        selectTagFilter,
        clearFacetFilters,
        completeTodo,
        completeTodos,
        archiveTodo,
        archiveTodos,
        unarchiveTodo,
        toggleSubtask,
        moveTodo,
        moveTodoToPosition,
        openCreateModal,
        startViewingTodo,
        startEditingTodo,
        startDeletingTodo,
        confirmDeleteTodo,
        undoDeleteTodo,
        dismissUndoDelete,
        closeModal,
        addTodo,
        duplicateTodo,
        deleteTodos,
        updateTodo,
        exportTodos,
        exportCalendar,
        previewTodosImport,
        previewCalendarImport,
        importTodos,
        importCalendar,
        syncTodos
    } = stateUpdaters;
    const reminderStatus = useTodoReminders(reminderTodos);
    const visibleTodoIds = React.useMemo(
        () => visibleTodos.map(todo => todo.id),
        [visibleTodos]
    );
    const allVisibleSelected = visibleTodoIds.length > 0 &&
        visibleTodoIds.every(id => selectedTodoIds.has(id));
    const changeSettings = (nextSettings: Partial<TodoSettings>) => {
        updateSettings(nextSettings);

        if (nextSettings.defaultView) {
            setTodoViewMode(nextSettings.defaultView);
        }
    };

    const formMode = editingTodo ? 'edit' : 'create';
    const modalLabel = deletingTodo
        ? 'Eliminar tarea'
        : editingTodo
            ? 'Editar tarea'
            : detailTodo
                ? 'Detalle del elemento'
                : 'Crear tarea';
    const clearDragState = React.useCallback(() => {
        setDragState({
            draggedTodoId: null,
            targetTodoId: null,
            position: null,
        });
    }, []);
    const closeSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedTodoIds(new Set());
        setBulkActionMessage('');
    };
    const changeTodoView = (view: TodoViewMode) => {
        setTodoViewMode(view);

        if (view !== 'list') {
            closeSelectionMode();
        }
    };
    const toggleTodoSelection = (todoId: string) => {
        setSelectedTodoIds(currentIds => {
            const nextIds = new Set(currentIds);

            if (nextIds.has(todoId)) {
                nextIds.delete(todoId);
            } else {
                nextIds.add(todoId);
            }

            return nextIds;
        });
        setBulkActionMessage('');
    };
    const toggleVisibleSelection = () => {
        setSelectedTodoIds(currentIds => {
            const nextIds = new Set(currentIds);

            if (allVisibleSelected) {
                visibleTodoIds.forEach(id => nextIds.delete(id));
            } else {
                visibleTodoIds.forEach(id => nextIds.add(id));
            }

            return nextIds;
        });
        setBulkActionMessage('');
    };
    const completeSelectedTodos = () => {
        const completedCount = completeTodos(Array.from(selectedTodoIds));
        setSelectedTodoIds(new Set());
        setBulkActionMessage(completedCount > 0
            ? completedCount === 1
                ? '1 elemento completado.'
                : `${completedCount} elementos completados.`
            : 'No habia tareas pendientes para completar.');
    };
    const archiveSelectedTodos = () => {
        const archivedCount = archiveTodos(Array.from(selectedTodoIds));
        setSelectedTodoIds(new Set());
        setBulkActionMessage(archivedCount > 0
            ? archivedCount === 1
                ? '1 tarea archivada.'
                : `${archivedCount} tareas archivadas.`
            : 'Selecciona tareas completadas para archivarlas.');
    };
    const confirmBulkDelete = () => {
        deleteTodos(Array.from(selectedTodoIds));
        setIsBulkDeleteOpen(false);
        closeSelectionMode();
    };

    React.useEffect(() => {
        closeSelectionMode();
    }, [activeBoardId]);

    const startTodoDrag = React.useCallback((todoId: string, event: React.DragEvent<any>) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', todoId);
        setDragState({
            draggedTodoId: todoId,
            targetTodoId: null,
            position: null,
        });
    }, []);

    const updateTodoDropTarget = React.useCallback((todoId: string, event: React.DragEvent<any>) => {
        const draggedTodoId = dragState.draggedTodoId || event.dataTransfer.getData('text/plain');

        if (!draggedTodoId || draggedTodoId === todoId) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        const position = getTodoDropPosition(event);

        setDragState(currentState => {
            if (
                currentState.draggedTodoId === draggedTodoId &&
                currentState.targetTodoId === todoId &&
                currentState.position === position
            ) {
                return currentState;
            }

            return {
                draggedTodoId,
                targetTodoId: todoId,
                position,
            };
        });
    }, [dragState.draggedTodoId]);

    const clearTodoDropTarget = React.useCallback((todoId: string, event: React.DragEvent<any>) => {
        if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.contains(event.relatedTarget)
        ) {
            return;
        }

        setDragState(currentState =>
            currentState.targetTodoId === todoId
                ? { ...currentState, targetTodoId: null, position: null }
                : currentState
        );
    }, []);

    const dropTodo = React.useCallback((todoId: string, event: React.DragEvent<any>) => {
        event.preventDefault();

        const draggedTodoId = dragState.draggedTodoId || event.dataTransfer.getData('text/plain');

        if (draggedTodoId && draggedTodoId !== todoId) {
            moveTodoToPosition(draggedTodoId, todoId, dragState.position || getTodoDropPosition(event));
        }

        clearDragState();
    }, [clearDragState, dragState.draggedTodoId, dragState.position, moveTodoToPosition]);

    React.useEffect(() => {
        const handleKeyboardShortcuts = (event: KeyboardEvent) => {
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
            <a className="SkipLink" href="#todo-list">Saltar a la lista de tareas</a>
            <main
                className={`App ${settings.density === 'compact' ? 'App--compact' : ''}`}
                aria-labelledby="app-title"
            >
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
                    totalTodos={totalTasks}
                    totalItems={totalTodos}
                    completedTodos={completedTodos}
                />
                <TodoBoards
                    activeBoardId={activeBoardId}
                    boards={todoBoards}
                    onCreateBoard={createBoard}
                    onSelectBoard={selectTodoBoard}
                    showCreateForm={false}
                />
                {settings.showQuickAdd && <TodoQuickAdd onAddTodo={addTodo} />}
                <TodoSearch
                    ref={searchInputRef}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                />
                <TodoFilters
                    filter={filter}
                    setFilter={setFilter}
                    filterCounts={filterCounts}
                />
                <TodoInsights insights={insights} />
                <TodoFacetFilters
                    projectOptions={projectOptions}
                    tagOptions={tagOptions}
                    activeProject={activeProject}
                    activeTag={activeTag}
                    onSelectProject={selectProjectFilter}
                    onSelectTag={selectTagFilter}
                    onClearFacetFilters={clearFacetFilters}
                />
                <TodoHeaderTools>
                    <TodoReminderStatus
                        isSupported={reminderStatus.isSupported}
                        permission={reminderStatus.permission}
                        scheduledCount={reminderStatus.scheduledCount}
                        onRequestPermission={reminderStatus.requestPermission}
                    />
                    <TodoBoards
                        activeBoardId={activeBoardId}
                        boards={todoBoards}
                        onDeleteBoard={deleteBoard}
                        onCreateBoard={createBoard}
                        onRenameBoard={renameBoard}
                        onSelectBoard={selectTodoBoard}
                        showBoardList={false}
                        showManagement
                    />
                    <TodoSavedViews
                        savedViews={savedViews}
                        onSaveView={saveCurrentView}
                        onApplyView={applySavedView}
                        onDeleteView={deleteSavedView}
                    />
                    <TodoBackupActions
                        activeBoardId={activeBoardId}
                        onExportTodos={exportTodos}
                        onExportCalendar={exportCalendar}
                        onPreviewImport={previewTodosImport}
                        onPreviewCalendarImport={previewCalendarImport}
                        onImportTodos={importTodos}
                        onImportCalendar={importCalendar}
                    />
                    <TodoSettingsPanel
                        settings={settings}
                        onChange={changeSettings}
                    />
                </TodoHeaderTools>
            </TodoHeader>

            <CreateTodoButton
                onCreateTodo={openCreateModal}
                loading={loading}
             />

            <TodoViewToggle
                activeView={todoViewMode}
                onChangeView={changeTodoView}
            />

            {todoViewMode === 'today' ? (
                <TodoToday
                    error={error}
                    loading={loading}
                    visibleTodos={visibleTodos}
                    totalTodos={totalTodos}
                    onEditTodo={startViewingTodo}
                    onError={() => <TodosError />}
                    onLoading={() => <TodosLoading />}
                    onEmptyTodos={() => (
                        <EmptyTodos
                            onCreateTemplate={(template) => addTodo(template.todo.text, template.todo)}
                        />
                    )}
                    onEmptySearchResults={() => (
                        <p className="TodoList-emptySearch">
                            {searchValue
                                ? 'No hay elementos que coincidan con tu busqueda.'
                                : 'No hay elementos para este filtro.'}
                        </p>
                    )}
                />
            ) : todoViewMode === 'board' ? (
                <TodoBoardView
                    error={error}
                    loading={loading}
                    visibleTodos={visibleTodos}
                    visibleTodoGroups={visibleTodoGroups}
                    totalTodos={totalTodos}
                    onOpenTodo={startViewingTodo}
                    onError={() => <TodosError />}
                    onLoading={() => <TodosLoading />}
                    onEmptyTodos={() => (
                        <EmptyTodos
                            onCreateTemplate={(template) => addTodo(template.todo.text, template.todo)}
                        />
                    )}
                    onEmptySearchResults={() => (
                        <p className="TodoList-emptySearch">
                            {searchValue
                                ? 'No hay tareas que coincidan con tu busqueda.'
                                : 'No hay tareas para este filtro.'}
                        </p>
                    )}
                />
            ) : todoViewMode === 'calendar' ? (
                <TodoCalendar
                    error={error}
                    loading={loading}
                    visibleTodos={visibleTodos}
                    totalTodos={totalTodos}
                    onEditTodo={startViewingTodo}
                    onError={() => <TodosError />}
                    onLoading={() => <TodosLoading />}
                    onEmptyTodos={() => (
                        <EmptyTodos
                            onCreateTemplate={(template) => addTodo(template.todo.text, template.todo)}
                        />
                    )}
                    onEmptySearchResults={() => (
                        <p className="TodoList-emptySearch">
                            {searchValue
                                ? 'No hay tareas que coincidan con tu busqueda.'
                                : 'No hay tareas para este filtro.'}
                        </p>
                    )}
                />
            ) : todoViewMode === 'week' ? (
                <TodoWeekCalendar
                    error={error}
                    loading={loading}
                    visibleTodos={visibleTodos}
                    totalTodos={totalTodos}
                    onEditTodo={startViewingTodo}
                    onError={() => <TodosError />}
                    onLoading={() => <TodosLoading />}
                    onEmptyTodos={() => (
                        <EmptyTodos
                            onCreateTemplate={(template) => addTodo(template.todo.text, template.todo)}
                        />
                    )}
                    onEmptySearchResults={() => (
                        <p className="TodoList-emptySearch">
                            {searchValue
                                ? 'No hay tareas que coincidan con tu busqueda.'
                                : 'No hay tareas para este filtro.'}
                        </p>
                    )}
                />
            ) : (
                <>
                <TodoBulkActions
                    allVisibleSelected={allVisibleSelected}
                    isSelectionMode={isSelectionMode}
                    message={bulkActionMessage}
                    selectedCount={selectedTodoIds.size}
                    visibleCount={visibleTodoIds.length}
                    onStart={() => {
                        setIsSelectionMode(true);
                        setBulkActionMessage('');
                    }}
                    onCancel={closeSelectionMode}
                    onSelectAll={toggleVisibleSelection}
                    onComplete={completeSelectedTodos}
                    onArchive={archiveSelectedTodos}
                    onDelete={() => setIsBulkDeleteOpen(true)}
                />
                <TodoList
                    error={error}
                    loading={loading}
                    visibleTodos={visibleTodos}
                    visibleTodoGroups={visibleTodoGroups}
                    totalTodos={totalTodos}
                    searchValue={searchValue}
                    onError={() => <TodosError />}
                    onLoading={() => <TodosLoading />}
                    onEmptyTodos={() => (
                        <EmptyTodos
                            onCreateTemplate={(template) => addTodo(template.todo.text, template.todo)}
                        />
                    )}
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
                                kind={todo.kind}
                                description={todo.description}
                                completed={todo.completed}
                                priority={todo.priority}
                                dateType={todo.dateType}
                                dueDate={todo.dueDate}
                                startDate={todo.startDate}
                                endDate={todo.endDate}
                                startTime={todo.startTime}
                                endTime={todo.endTime}
                                recurrence={todo.recurrence}
                                recurrenceDays={todo.recurrenceDays}
                                recurrenceEndDate={todo.recurrenceEndDate}
                                recurrenceCount={todo.recurrenceCount}
                                completedOccurrences={todo.completedOccurrences}
                                selectionMode={isSelectionMode}
                                selected={selectedTodoIds.has(todo.id)}
                                reminder={todo.reminder}
                                archivedAt={todo.archivedAt}
                                project={todo.project}
                                tags={todo.tags}
                                subtasks={todo.subtasks}
                                canMoveUp={todo.order > 0}
                                canMoveDown={todo.order < totalTodos - 1}
                                isDragging={dragState.draggedTodoId === todo.id}
                                dropPosition={dragState.targetTodoId === todo.id ? dragState.position : null}
                                onComplete={() => completeTodo(todo.id)}
                                onToggleSubtask={(subtaskId) => toggleSubtask(todo.id, subtaskId)}
                                onMoveUp={() => moveTodo(todo.id, 'up')}
                                onMoveDown={() => moveTodo(todo.id, 'down')}
                                onSelect={() => toggleTodoSelection(todo.id)}
                                onDragStart={isSelectionMode ? undefined : (event) => startTodoDrag(todo.id, event)}
                                onDragOver={isSelectionMode ? undefined : (event) => updateTodoDropTarget(todo.id, event)}
                                onDragLeave={isSelectionMode ? undefined : (event) => clearTodoDropTarget(todo.id, event)}
                                onDrop={isSelectionMode ? undefined : (event) => dropTodo(todo.id, event)}
                                onDragEnd={isSelectionMode ? undefined : clearDragState}
                                onFilterProject={() => selectProjectFilter(todo.project)}
                                onFilterTag={selectTagFilter}
                                onEdit={() => startViewingTodo(todo.id)}
                                onDelete={() => startDeletingTodo(todo.id)}
                        />
                    )}
                />
                </>
            )}
            </main>

            {isBulkDeleteOpen && (
                <Modal label="Eliminar seleccion" onClose={() => setIsBulkDeleteOpen(false)}>
                    <BulkDeleteDialog
                        count={selectedTodoIds.size}
                        onCancel={() => setIsBulkDeleteOpen(false)}
                        onConfirm={confirmBulkDelete}
                    />
                </Modal>
            )}

            {openModal && (
                <Modal
                    label={modalLabel}
                    onClose={closeModal}
                    variant={detailTodo ? 'side' : 'center'}
                >
                    {deletingTodo ? (
                        <DeleteTodoDialog
                            todoText={deletingTodo.text}
                            onCancel={closeModal}
                            onConfirm={confirmDeleteTodo}
                        />
                    ) : detailTodo ? (
                        <TodoDetail
                            todo={detailTodo}
                            onClose={closeModal}
                            onDelete={() => startDeletingTodo(detailTodo.id)}
                            onDuplicate={() => duplicateTodo(detailTodo.id)}
                            onEdit={() => startEditingTodo(detailTodo.id)}
                            onArchive={() => {
                                const result = archiveTodo(detailTodo.id);

                                if (result.ok) {
                                    closeModal();
                                }
                            }}
                            onUnarchive={() => {
                                const result = unarchiveTodo(detailTodo.id);

                                if (result.ok) {
                                    closeModal();
                                }
                            }}
                            onToggleComplete={() => completeTodo(detailTodo.id)}
                        />
                    ) : (
                        <TodoForm 
                            initialValue={editingTodo?.text || ''}
                            initialKind={editingTodo?.kind}
                            initialDescription={editingTodo?.description}
                            initialPriority={editingTodo?.priority}
                            initialDueDate={editingTodo?.dueDate}
                            initialStartDate={editingTodo?.startDate}
                            initialEndDate={editingTodo?.endDate}
                            initialStartTime={editingTodo?.startTime}
                            initialEndTime={editingTodo?.endTime}
                            initialRecurrence={editingTodo?.recurrence}
                            initialRecurrenceDays={editingTodo?.recurrenceDays}
                            initialRecurrenceEndDate={editingTodo?.recurrenceEndDate}
                            initialRecurrenceCount={editingTodo?.recurrenceCount}
                            initialReminder={editingTodo?.reminder}
                            initialProject={editingTodo?.project}
                            initialTags={editingTodo?.tags}
                            initialSubtasks={editingTodo?.subtasks}
                            label={editingTodo ? 'Editar tarea' : 'Nueva tarea'}
                            lockedProject={!editingTodo ? activeProject : null}
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
            <UndoToast
                message={recentlyDeletedTodo ? `Eliminaste "${recentlyDeletedTodo.text}".` : ''}
                onDismiss={dismissUndoDelete}
                onUndo={undoDeleteTodo}
            />
        </>
    );
}

export default App;
