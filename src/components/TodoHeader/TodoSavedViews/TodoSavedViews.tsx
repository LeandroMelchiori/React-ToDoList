import React, { FormEvent } from 'react';
import { handleButtonGroupNavigation } from '../../buttonGroupNavigation';
import './TodoSavedViews.css';

interface SavedView {
  id: string;
  name: string;
}

interface TodoSavedViewsProps {
  loading?: boolean;
  onApplyView: (viewId: string) => { ok: boolean; error?: string };
  onDeleteView: (viewId: string) => void;
  onSaveView: (name: string) => { ok: boolean; error?: string };
  savedViews: SavedView[];
}

function TodoSavedViews({
  loading,
  onApplyView,
  onDeleteView,
  onSaveView,
  savedViews,
}: TodoSavedViewsProps) {
  const [viewName, setViewName] = React.useState('');
  const [message, setMessage] = React.useState('');
  const hasSavedViews = savedViews.length > 0;

  const handleSaveView = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = onSaveView(viewName);

    if (!result.ok) {
      setMessage(result.error || '');
      return;
    }

    setViewName('');
    setMessage('Filtros guardados.');
  };

  const handleApplyView = (viewId: string) => {
    const result = onApplyView(viewId);

    setMessage(result.ok ? 'Filtros aplicados.' : (result.error || ''));
  };

  const handleDeleteView = (view: SavedView) => {
    onDeleteView(view.id);
    setMessage(`Filtros "${view.name}" eliminados.`);
  };

  return (
    <section className="TodoSavedViews" aria-label="Filtros guardados">
      {hasSavedViews && (
        <div
          className="TodoSavedViews-list"
          role="group"
          aria-label="Aplicar filtros guardados"
          onKeyDown={handleButtonGroupNavigation}
        >
          <span>Filtros guardados</span>
          {savedViews.map(view => (
            <div className="TodoSavedViews-item" key={view.id}>
              <button
                type="button"
                className="TodoSavedViews-button"
                disabled={loading}
                onClick={() => handleApplyView(view.id)}
              >
                {view.name}
              </button>
              <button
                type="button"
                className="TodoSavedViews-delete"
                aria-label={`Eliminar filtros guardados ${view.name}`}
                disabled={loading}
                onClick={() => handleDeleteView(view)}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="TodoSavedViews-form" aria-label="Guardar filtros actuales" onSubmit={handleSaveView}>
        <p className="TodoSavedViews-help">
          Guarda la busqueda y filtros activos para volver a usarlos.
        </p>
        <input
          aria-label="Nombre para estos filtros"
          disabled={loading}
          maxLength={40}
          onChange={(event) => setViewName(event.target.value)}
          placeholder="Ej: Talleres pendientes"
          type="text"
          value={viewName}
        />
        <button type="submit" disabled={loading}>
          Guardar filtros
        </button>
      </form>

      {message && (
        <p className="TodoSavedViews-status" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

export { TodoSavedViews };
