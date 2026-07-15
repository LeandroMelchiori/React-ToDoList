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
import { TodoSnapshots } from '../components/TodoHeader/TodoSnapshots/TodoSnapshots';
import { TodoDataCenter } from '../components/TodoHeader/TodoDataCenter/TodoDataCenter';
import type { CommandPaletteItem } from '../components/CommandPalette/CommandPalette';
import { TodoSettings, useTodoSettings } from './useTodoSettings';
import type { TodoKind, TodoRecurrence } from './todoModel';
import { TodoMobileSummary } from '../components/TodoHeader/TodoMobileSummary/TodoMobileSummary';

const CommandPalette = React.lazy(() => import('../components/CommandPalette/CommandPalette')
    .then(module => ({ default: module.CommandPalette })));
const TodoBoardView = React.lazy(() => import('../components/TodoBoardView/TodoBoardView')
    .then(module => ({ default: module.TodoBoardView })));
const TodoCalendar = React.lazy(() => import('../components/TodoCalendar/TodoCalendar')
    .then(module => ({ default: module.TodoCalendar })));
const TodoToday = React.lazy(() => import('../components/TodoToday/TodoToday')
    .then(module => ({ default: module.TodoToday })));
const TodoWeekCalendar = React.lazy(() => import('../components/TodoWeekCalendar/TodoWeekCalendar')
    .then(module => ({ default: module.TodoWeekCalendar })));

type CreateTodoDefaults = {
    kind?: TodoKind;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    recurrence?: TodoRecurrence;
};

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
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
    const [createTodoDefaults, setCreateTodoDefaults] = React.useState<CreateTodoDefaults>({});
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
        todoSnapshots,
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
        detailOccurrenceDate,
        editingTodo,
        editingOccurrenceDate,
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
        checkTodoScheduleConflicts,
        createManualTodoSnapshot,
        deleteTodoSnapshot,
        restoreTodoSnapshot,
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
        startEditingTodoOccurrence,
        skipTodoOccurrence,
        restoreTodoOccurrence,
        startDeletingTodo,
        confirmDeleteTodo,
        undoDeleteTodo,
        dismissUndoDelete,
        closeModal,
        addTodo,
        duplicateTodo,
        deleteTodos,
        updateTodo,
        updateTodoOccurrence,
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
    const launchCreateTodo = React.useCallback((defaults: CreateTodoDefaults = {}) => {
        setCreateTodoDefaults(defaults);
        openCreateModal();
    }, [openCreateModal]);

    const formMode = editingTodo ? 'edit' : 'create';
    const modalLabel = deletingTodo
        ? 'Eliminar tarea'
        : editingOccurrenceDate
            ? 'Editar ocurrencia'
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
    const closeCommandPaletteAndRun = (action: () => void) => {
        setIsCommandPaletteOpen(false);
        window.setTimeout(action, 0);
    };
    const commandPaletteItems: CommandPaletteItem[] = [
        {
            id: 'create',
            label: 'Crear tarea',
            description: 'Abre el formulario de un nuevo elemento.',
            keywords: ['nuevo', 'agregar'],
            shortcut: 'N',
            onSelect: () => closeCommandPaletteAndRun(() => launchCreateTodo()),
        },
        {
            id: 'search',
            label: 'Buscar tareas',
            description: 'Lleva el foco al buscador principal.',
            keywords: ['encontrar', 'filtrar'],
            shortcut: '/',
            onSelect: () => closeCommandPaletteAndRun(() => searchInputRef.current?.focus()),
        },
        {
            id: 'clear-filters',
            label: 'Limpiar busqueda y filtros',
            description: 'Vuelve a mostrar todos los elementos.',
            keywords: ['restablecer', 'todos'],
            onSelect: () => closeCommandPaletteAndRun(() => {
                setSearchValue('');
                setFilter('all');
                clearFacetFilters();
            }),
        },
        ...([
            ['list', 'Abrir Lista', 'Muestra las tareas agrupadas.'],
            ['today', 'Abrir Hoy', 'Muestra el foco del dia.'],
            ['board', 'Abrir Tablero', 'Muestra la planificacion por columnas.'],
            ['calendar', 'Abrir Calendario', 'Muestra la agenda mensual.'],
            ['week', 'Abrir Semana', 'Muestra la grilla semanal por horario.'],
        ] as Array<[TodoViewMode, string, string]>).map(([view, label, description]) => ({
            id: `view-${view}`,
            label,
            description,
            keywords: ['vista', view],
            onSelect: () => closeCommandPaletteAndRun(() => changeTodoView(view)),
        })),
        {
            id: 'theme',
            label: isDarkTheme ? 'Usar tema claro' : 'Usar tema oscuro',
            description: 'Cambia la apariencia de toda la aplicacion.',
            keywords: ['color', 'apariencia'],
            onSelect: () => closeCommandPaletteAndRun(toggleTheme),
        },
    ];
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
            const isCommandPaletteShortcut =
                !event.altKey &&
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === 'k';

            if (isCommandPaletteShortcut) {
                event.preventDefault();

                if (!openModal && !isBulkDeleteOpen) {
                    setIsCommandPaletteOpen(currentValue => !currentValue);
                }

                return;
            }

            if (
                event.defaultPrevented ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                isCommandPaletteOpen ||
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
                launchCreateTodo();
            }
        };

        window.addEventListener('keydown', handleKeyboardShortcuts);

        return () => {
            window.removeEventListener('keydown', handleKeyboardShortcuts);
        };
    }, [isBulkDeleteOpen, isCommandPaletteOpen, launchCreateTodo, openModal]);

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
                <TodoMobileSummary
                    summary={`${totalTodos} elementos - ${insights?.completionRate || 0}%`}
                >
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
                </TodoMobileSummary>
            </TodoHeader>

            <CreateTodoButton
                onCreateTodo={() => launchCreateTodo()}
                loading={loading}
             />

            <div className="App-viewControls">
                <TodoViewToggle
                    activeView={todoViewMode}
                    onChangeView={changeTodoView}
                />
                <div className="App-workspaceActions">
                    <button
                        aria-keyshortcuts="Control+K Meta+K"
                        className="App-commandButton"
                        onClick={() => setIsCommandPaletteOpen(true)}
                        type="button"
                    >
                        Comandos <kbd>Ctrl K</kbd>
                    </button>
                    <TodoHeaderTools
                        loading={loading}
                        sections={[
                            {
                                id: 'reminders',
                                label: 'Recordatorios',
                                description: 'Permisos y avisos locales',
                                content: (
                                    <TodoReminderStatus
                                        isSupported={reminderStatus.isSupported}
                                        permission={reminderStatus.permission}
                                        scheduledCount={reminderStatus.scheduledCount}
                                        onRequestPermission={reminderStatus.requestPermission}
                                    />
                                ),
                            },
                            {
                                id: 'organization',
                                label: 'Tableros y filtros',
                                description: 'Organizacion y filtros guardados',
                                content: [
                                    <TodoBoards
                                        activeBoardId={activeBoardId}
                                        boards={todoBoards}
                                        key="boards"
                                        onDeleteBoard={deleteBoard}
                                        onCreateBoard={createBoard}
                                        onRenameBoard={renameBoard}
                                        onSelectBoard={selectTodoBoard}
                                        showBoardList={false}
                                        showManagement
                                    />,
                                    <TodoSavedViews
                                        key="saved-views"
                                        savedViews={savedViews}
                                        onSaveView={saveCurrentView}
                                        onApplyView={applySavedView}
                                        onDeleteView={deleteSavedView}
                                    />,
                                ],
                            },
                            {
                                id: 'data',
                                label: 'Datos y copias',
                                description: 'Importar, exportar y recuperar',
                                content: [
                                    <TodoBackupActions
                                        activeBoardId={activeBoardId}
                                        key="backups"
                                        onExportTodos={exportTodos}
                                        onExportCalendar={exportCalendar}
                                        onPreviewImport={previewTodosImport}
                                        onPreviewCalendarImport={previewCalendarImport}
                                        onImportTodos={importTodos}
                                        onImportCalendar={importCalendar}
                                    />,
                                    <TodoDataCenter
                                        agendaCount={totalTodos - totalTasks}
                                        archivedCount={filterCounts.archived}
                                        boardCount={todoBoards.length}
                                        key="data-center"
                                        lastSnapshot={todoSnapshots[0] || null}
                                        onCreateSnapshot={createManualTodoSnapshot}
                                        savedViewCount={savedViews.length}
                                        snapshotCount={todoSnapshots.length}
                                        taskCount={totalTasks}
                                    />,
                                    <TodoSnapshots
                                        key="snapshots"
                                        snapshots={todoSnapshots}
                                        onDeleteSnapshot={deleteTodoSnapshot}
                                        onRestoreSnapshot={restoreTodoSnapshot}
                                    />,
                                ],
                            },
                            {
                                id: 'settings',
                                label: 'Preferencias',
                                description: 'Vista, densidad y carga rapida',
                                content: (
                                    <TodoSettingsPanel settings={settings} onChange={changeSettings} />
                                ),
                            },
                        ]}
                    />
                </div>
            </div>

            {settings.showQuickAdd && (
                <div className="App-workspaceQuickAdd">
                    <TodoQuickAdd compact onAddTodo={addTodo} />
                </div>
            )}

            <div
                aria-labelledby={`todo-view-tab-${todoViewMode}`}
                className="App-viewPanel"
                id="todo-view-panel"
                role="tabpanel"
                tabIndex={0}
            >
            <React.Suspense fallback={<TodosLoading />}>
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
                    onCreateTodoForDate={(dateValue) => launchCreateTodo({
                        kind: 'event',
                        startDate: dateValue,
                        recurrence: 'none',
                    })}
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
                    onCreateTodoForSlot={(dateValue, hour) => launchCreateTodo({
                        kind: 'schedule',
                        startDate: dateValue,
                        endDate: dateValue,
                        startTime: `${String(hour).padStart(2, '0')}:00`,
                        endTime: hour < 23 ? `${String(hour + 1).padStart(2, '0')}:00` : '23:59',
                        recurrence: 'none',
                    })}
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
                                excludedOccurrences={todo.excludedOccurrences}
                                selectionMode={isSelectionMode}
                                selected={selectedTodoIds.has(todo.id)}
                                reminder={todo.reminder}
                                archivedAt={todo.archivedAt}
                                project={todo.project}
                                tags={todo.tags}
                                timeBlocks={todo.timeBlocks}
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
            </React.Suspense>
            </div>
            </main>

            {isCommandPaletteOpen && (
                <Modal label="Paleta de comandos" onClose={() => setIsCommandPaletteOpen(false)}>
                    <React.Suspense fallback={<TodosLoading />}>
                        <CommandPalette commands={commandPaletteItems} />
                    </React.Suspense>
                </Modal>
            )}

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
                    variant={deletingTodo ? 'center' : 'side'}
                >
                    {deletingTodo ? (
                        <DeleteTodoDialog
                            todoText={deletingTodo.text}
                            onCancel={closeModal}
                            onConfirm={confirmDeleteTodo}
                        />
                    ) : detailTodo ? (
                        <TodoDetail
                            occurrenceDate={detailOccurrenceDate}
                            todo={detailTodo}
                            onClose={closeModal}
                            onDelete={() => startDeletingTodo(detailTodo.id)}
                            onDuplicate={() => duplicateTodo(detailTodo.id)}
                            onEdit={() => startEditingTodo(detailTodo.id)}
                            onEditOccurrence={detailOccurrenceDate
                                ? () => startEditingTodoOccurrence(detailTodo.id, detailOccurrenceDate)
                                : undefined}
                            onSkipOccurrence={detailOccurrenceDate
                                ? () => skipTodoOccurrence(detailTodo.id, detailOccurrenceDate)
                                : undefined}
                            onRestoreOccurrence={(dateValue) => restoreTodoOccurrence(detailTodo.id, dateValue)}
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
                            initialKind={editingTodo?.kind || createTodoDefaults.kind}
                            initialDescription={editingTodo?.description}
                            initialPriority={editingTodo?.priority}
                            initialDueDate={editingOccurrenceDate || editingTodo?.dueDate}
                            initialStartDate={editingOccurrenceDate || editingTodo?.startDate || createTodoDefaults.startDate}
                            initialEndDate={editingOccurrenceDate || editingTodo?.endDate || createTodoDefaults.endDate}
                            initialStartTime={editingTodo?.startTime || createTodoDefaults.startTime}
                            initialEndTime={editingTodo?.endTime || createTodoDefaults.endTime}
                            initialRecurrence={editingOccurrenceDate ? 'none' : editingTodo?.recurrence || createTodoDefaults.recurrence}
                            initialRecurrenceDays={editingTodo?.recurrenceDays}
                            initialRecurrenceEndDate={editingTodo?.recurrenceEndDate}
                            initialRecurrenceCount={editingTodo?.recurrenceCount}
                            initialReminder={editingTodo?.reminder}
                            initialProject={editingTodo?.project}
                            initialTags={editingTodo?.tags}
                            initialSubtasks={editingTodo?.subtasks}
                            initialTimeBlocks={editingOccurrenceDate ? [] : editingTodo?.timeBlocks}
                            label={editingOccurrenceDate ? 'Editar esta fecha' : editingTodo ? 'Editar tarea' : 'Nueva tarea'}
                            lockedProject={!editingTodo ? activeProject : null}
                            lockRecurrence={Boolean(editingOccurrenceDate)}
                            mode={formMode}
                            onCancel={closeModal}
                            onCheckConflicts={(text, details) => (
                                checkTodoScheduleConflicts(text, details, editingTodo?.id || null)
                            )}
                            onSubmitTodo={(text, details) => (
                                editingTodo && editingOccurrenceDate
                                    ? updateTodoOccurrence(editingTodo.id, editingOccurrenceDate, text, details)
                                    : editingTodo
                                        ? updateTodo(editingTodo.id, text, details)
                                        : addTodo(text, details)
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
