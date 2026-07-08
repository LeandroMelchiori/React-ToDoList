import React from 'react';
import { handleButtonGroupNavigation } from '../../buttonGroupNavigation';
import './TodoBoards.css';

function TodoBoards({
  activeBoardId,
  boards,
  loading,
  onCreateBoard,
  onSelectBoard,
  showBoardList = true,
  showCreateForm = true,
}) {
  const [boardName, setBoardName] = React.useState('');
  const [error, setError] = React.useState('');

  if (!boards.length) {
    return null;
  }

  const handleSelectBoard = (boardId) => {
    const result = onSelectBoard(boardId);

    setError(result.ok ? '' : result.error);
  };

  const handleCreateBoard = (event) => {
    event.preventDefault();

    const result = onCreateBoard(boardName);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setBoardName('');
    setError('');
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

      {error && (
        <p className="TodoBoards-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export { TodoBoards };
