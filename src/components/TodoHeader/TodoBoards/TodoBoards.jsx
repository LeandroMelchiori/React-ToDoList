import React from 'react';
import { handleButtonGroupNavigation } from '../../buttonGroupNavigation';
import './TodoBoards.css';

function TodoBoards({
  activeBoardId,
  boards,
  loading,
  onCreateBoard,
  onDeleteBoard,
  onRenameBoard,
  onSelectBoard,
  showBoardList = true,
  showCreateForm = true,
  showManagement = false,
}) {
  const [boardName, setBoardName] = React.useState('');
  const [currentBoardName, setCurrentBoardName] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const activeBoard = boards.find(board => board.id === activeBoardId) || null;

  React.useEffect(() => {
    setCurrentBoardName(activeBoard?.name || '');
  }, [activeBoard?.id, activeBoard?.name]);

  React.useEffect(() => {
    setError('');
    setMessage('');
    setIsConfirmingDelete(false);
  }, [activeBoard?.id]);

  if (!boards.length) {
    return null;
  }

  const handleSelectBoard = (boardId) => {
    const result = onSelectBoard(boardId);

    setError(result.ok ? '' : result.error);
    setMessage('');
    setIsConfirmingDelete(false);
  };

  const handleCreateBoard = (event) => {
    event.preventDefault();

    const result = onCreateBoard(boardName);

    if (!result.ok) {
      setError(result.error);
      setMessage('');
      return;
    }

    setBoardName('');
    setError('');
    setMessage('');
    setIsConfirmingDelete(false);
  };

  const handleRenameBoard = (event) => {
    event.preventDefault();

    if (!activeBoard || !onRenameBoard) {
      return;
    }

    const result = onRenameBoard(activeBoard.id, currentBoardName);

    if (!result.ok) {
      setError(result.error);
      setMessage('');
      return;
    }

    setError('');
    setMessage('Tablero actualizado.');
    setIsConfirmingDelete(false);
  };

  const handleDeleteBoard = () => {
    if (!activeBoard || !onDeleteBoard) {
      return;
    }

    const result = onDeleteBoard(activeBoard.id);

    if (!result.ok) {
      setError(result.error);
      setMessage('');
      setIsConfirmingDelete(false);
      return;
    }

    setError('');
    setMessage('');
  };

  return (
    <section className={`TodoBoards ${!showCreateForm ? 'TodoBoards--compact' : ''}`} aria-label="Tableros locales">
      {showBoardList && (
        <div
          className="TodoBoards-list"
          role="group"
          aria-label="Cambiar tablero"
          onKeyDown={handleButtonGroupNavigation}
        >
          <span>Tableros</span>
          {boards.map(board => {
            const isActive = board.id === activeBoardId;

            return (
              <button
                key={board.id}
                type="button"
                className={`TodoBoards-button ${isActive ? 'TodoBoards-button--active' : ''}`}
                aria-pressed={isActive}
                disabled={loading}
                onClick={() => handleSelectBoard(board.id)}
              >
                {board.name}
                {' '}
                <span>{board.totalTodos}</span>
              </button>
            );
          })}
        </div>
      )}

      {showCreateForm && (
        <form className="TodoBoards-form" aria-label="Crear tablero" onSubmit={handleCreateBoard}>
          <input
            aria-label="Nombre del tablero"
            disabled={loading}
            maxLength={40}
            onChange={(event) => setBoardName(event.target.value)}
            placeholder="Nuevo tablero"
            type="text"
            value={boardName}
          />
          <button type="submit" disabled={loading}>
            Crear
          </button>
        </form>
      )}

      {showManagement && activeBoard && (
        <div className="TodoBoards-management">
          <form className="TodoBoards-managementForm" aria-label="Renombrar tablero actual" onSubmit={handleRenameBoard}>
            <input
              aria-label="Nombre del tablero actual"
              disabled={loading}
              maxLength={40}
              onChange={(event) => setCurrentBoardName(event.target.value)}
              placeholder="Nombre del tablero"
              type="text"
              value={currentBoardName}
            />
            <button type="submit" disabled={loading}>
              Renombrar
            </button>
          </form>

          <div className="TodoBoards-delete">
            <p>
              Tablero actual:
              {' '}
              <strong>{activeBoard.name}</strong>
            </p>
            {isConfirmingDelete ? (
              <div className="TodoBoards-deleteActions" role="group" aria-label={`Confirmar eliminar tablero ${activeBoard.name}`}>
                <button
                  type="button"
                  className="TodoBoards-button"
                  disabled={loading}
                  onClick={() => setIsConfirmingDelete(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="TodoBoards-dangerButton"
                  disabled={loading}
                  onClick={handleDeleteBoard}
                >
                  Confirmar eliminacion
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="TodoBoards-dangerButton"
                aria-label={`Eliminar tablero ${activeBoard.name}`}
                disabled={loading || boards.length <= 1}
                onClick={() => {
                  setError('');
                  setMessage('');
                  setIsConfirmingDelete(true);
                }}
              >
                Eliminar tablero
              </button>
            )}
            {boards.length <= 1 && (
              <small>Crea otro tablero para poder eliminar este.</small>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="TodoBoards-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="TodoBoards-status" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

export { TodoBoards };
