import React, { ChangeEvent } from 'react';
import './TodoBackupActions.css';

function createBackupFilename() {
  return `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function getFoundTaskLabel(count: number) {
  return count === 1 ? '1 tarea encontrada' : `${count} tareas encontradas`;
}

function getTaskLabel(count: number) {
  return count === 1 ? '1 tarea' : `${count} tareas`;
}

function getBoardLabel(count: number) {
  return count === 1 ? '1 tablero' : `${count} tableros`;
}

function getSavedViewLabel(count: number) {
  return count === 1 ? '1 filtro guardado' : `${count} filtros guardados`;
}

function getImportedTaskLabel(count: number) {
  return count === 1 ? '1 tarea importada' : `${count} tareas importadas`;
}

function getAddedTaskLabel(count: number) {
  return count === 1 ? '1 tarea agregada' : `${count} tareas agregadas`;
}

function getOmittedDuplicateLabel(count: number) {
  return count === 1 ? '1 duplicada omitida' : `${count} duplicadas omitidas`;
}

function getImportStatusMessage(result: any) {
  if (result.mode === 'workspace') {
    return `Backup restaurado: ${getBoardLabel(result.boardCount)}, ${getTaskLabel(result.count)} y ${getSavedViewLabel(result.savedViewCount)}.`;
  }

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

interface TodoBackupActionsProps {
  loading?: boolean;
  onExportTodos: () => any;
  onPreviewImport: (backup: any) => any;
  onImportTodos: (backup: any, options: { mode: any }) => any;
}

function TodoBackupActions({ loading, onExportTodos, onPreviewImport, onImportTodos }: TodoBackupActionsProps) {
  const [statusMessage, setStatusMessage] = React.useState('');
  const [importPreview, setImportPreview] = React.useState<any>(null);

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

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

  const confirmImport = (mode: string) => {
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
        aria-label="Exportar backup completo"
        onClick={handleExport}
      >
        Exportar backup
      </button>
      <label className="TodoBackupActions-button">
        Importar backup
        <input
          type="file"
          accept="application/json,.json"
          aria-label="Importar backup JSON"
          disabled={loading}
          onChange={handleImport}
        />
      </label>
      {importPreview && (
        <div className="TodoBackupActions-preview" role="region" aria-label="Previsualizacion de importacion">
          <div>
            <p className="TodoBackupActions-previewTitle">Revisar importacion</p>
            {importPreview.kind === 'workspace' ? (
              <>
                <p className="TodoBackupActions-previewText">
                  {importPreview.fileName}: {getBoardLabel(importPreview.boardCount)}, {getTaskLabel(importPreview.totalCount)} y {getSavedViewLabel(importPreview.savedViewCount)}.
                </p>
                <p className="TodoBackupActions-previewText">
                  Al restaurar, se reemplazan tus tableros, tareas y filtros guardados.
                </p>
              </>
            ) : (
              <>
                <p className="TodoBackupActions-previewText">
                  {importPreview.fileName}: {getFoundTaskLabel(importPreview.totalCount)}.
                </p>
                <p className="TodoBackupActions-previewText">
                  Al fusionar: {getAddedTaskLabel(importPreview.newCount)} y {getOmittedDuplicateLabel(importPreview.duplicateCount)}.
                </p>
              </>
            )}
          </div>
          <div className="TodoBackupActions-previewActions">
            {importPreview.kind !== 'workspace' && (
              <button
                type="button"
                className="TodoBackupActions-button"
                onClick={() => confirmImport('merge')}
              >
                Fusionar sin duplicados
              </button>
            )}
            <button
              type="button"
              className="TodoBackupActions-button TodoBackupActions-button--danger"
              onClick={() => confirmImport('replace')}
            >
              {importPreview.kind === 'workspace' ? 'Restaurar backup' : 'Reemplazar tareas'}
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
