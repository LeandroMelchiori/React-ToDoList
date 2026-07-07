import React from 'react';
import './TodoBackupActions.css';

function createBackupFilename() {
  return `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function getFoundTaskLabel(count) {
  return count === 1 ? '1 tarea encontrada' : `${count} tareas encontradas`;
}

function getImportedTaskLabel(count) {
  return count === 1 ? '1 tarea importada' : `${count} tareas importadas`;
}

function getAddedTaskLabel(count) {
  return count === 1 ? '1 tarea agregada' : `${count} tareas agregadas`;
}

function getOmittedDuplicateLabel(count) {
  return count === 1 ? '1 duplicada omitida' : `${count} duplicadas omitidas`;
}

function getImportStatusMessage(result) {
  if (result.mode === 'merge') {
    const importedMessage = result.count
      ? `${getAddedTaskLabel(result.count)}.`
      : 'No se agregaron tareas nuevas.';
    const skippedMessage = result.skippedDuplicates
      ? ` ${getOmittedDuplicateLabel(result.skippedDuplicates)}.`
      : '';

    return `${importedMessage}${skippedMessage}`;
  }

  return `${getImportedTaskLabel(result.count)}. Tus tareas anteriores fueron reemplazadas.`;
}

function TodoBackupActions({ loading, onExportTodos, onPreviewImport, onImportTodos }) {
  const [statusMessage, setStatusMessage] = React.useState('');
  const [importPreview, setImportPreview] = React.useState(null);

  const handleExport = () => {
    const backup = onExportTodos();
    const backupBlob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const backupUrl = URL.createObjectURL(backupBlob);
    const downloadLink = document.createElement('a');

    downloadLink.href = backupUrl;
    downloadLink.download = createBackupFilename();
    downloadLink.click();
    URL.revokeObjectURL(backupUrl);
    setStatusMessage('Backup exportado.');
  };

  const handleImport = async (event) => {
    const [file] = event.target.files;
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const fileContent = await file.text();
      const backup = JSON.parse(fileContent);
      const result = onPreviewImport(backup);

      if (!result.ok) {
        setImportPreview(null);
        setStatusMessage(result.error);
        return;
      }

      setImportPreview({
        backup,
        fileName: file.name,
        ...result,
      });
      setStatusMessage('Backup listo para revisar.');
    } catch {
      setImportPreview(null);
      setStatusMessage('No pudimos leer ese archivo JSON.');
    }
  };

  const confirmImport = (mode) => {
    if (!importPreview) {
      return;
    }

    const result = onImportTodos(importPreview.backup, { mode });

    if (!result.ok) {
      setStatusMessage(result.error);
      return;
    }

    setImportPreview(null);
    setStatusMessage(getImportStatusMessage(result));
  };

  const cancelImport = () => {
    setImportPreview(null);
    setStatusMessage('Importacion cancelada.');
  };

  return (
    <div className="TodoBackupActions">
      <button
        type="button"
        className="TodoBackupActions-button"
        disabled={loading}
        aria-label="Exportar tareas"
        onClick={handleExport}
      >
        Exportar
      </button>
      <label className="TodoBackupActions-button">
        Importar
        <input
          type="file"
          accept="application/json,.json"
          aria-label="Importar tareas desde JSON"
          disabled={loading}
          onChange={handleImport}
        />
      </label>
      {importPreview && (
        <div className="TodoBackupActions-preview" role="region" aria-label="Previsualizacion de importacion">
          <div>
            <p className="TodoBackupActions-previewTitle">Revisar importacion</p>
            <p className="TodoBackupActions-previewText">
              {importPreview.fileName}: {getFoundTaskLabel(importPreview.totalCount)}.
            </p>
            <p className="TodoBackupActions-previewText">
              Al fusionar: {getAddedTaskLabel(importPreview.newCount)} y {getOmittedDuplicateLabel(importPreview.duplicateCount)}.
            </p>
          </div>
          <div className="TodoBackupActions-previewActions">
            <button
              type="button"
              className="TodoBackupActions-button"
              onClick={() => confirmImport('merge')}
            >
              Fusionar sin duplicados
            </button>
            <button
              type="button"
              className="TodoBackupActions-button TodoBackupActions-button--danger"
              onClick={() => confirmImport('replace')}
            >
              Reemplazar tareas
            </button>
            <button
              type="button"
              className="TodoBackupActions-button"
              onClick={cancelImport}
            >
              Cancelar importacion
            </button>
          </div>
        </div>
      )}
      {statusMessage && (
        <p className="TodoBackupActions-status" role="status">
          {statusMessage}
        </p>
      )}
    </div>
  );
}

export { TodoBackupActions, createBackupFilename };
