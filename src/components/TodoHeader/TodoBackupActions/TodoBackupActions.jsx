import React from 'react';
import './TodoBackupActions.css';

function createBackupFilename() {
  return `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function TodoBackupActions({ loading, onExportTodos, onImportTodos }) {
  const [statusMessage, setStatusMessage] = React.useState('');

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
      const result = onImportTodos(backup);

      if (!result.ok) {
        setStatusMessage(result.error);
        return;
      }

      setStatusMessage(
        result.count === 1
          ? '1 tarea importada.'
          : `${result.count} tareas importadas.`,
      );
    } catch {
      setStatusMessage('No pudimos leer ese archivo JSON.');
    }
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
      {statusMessage && (
        <p className="TodoBackupActions-status" role="status">
          {statusMessage}
        </p>
      )}
    </div>
  );
}

export { TodoBackupActions, createBackupFilename };
