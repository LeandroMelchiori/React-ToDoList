import React from 'react';
import {
  listTodoAttachments,
  readTodoAttachment,
  removeTodoAttachment,
  saveTodoAttachment,
} from '../../../App/todoStorage';
import type { TodoAttachment } from '../../../App/todoStorage';
import './TodoAttachments.css';

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 8;
const ACCEPTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg', 'webp'];

interface TodoAttachmentsProps {
  todoId: string;
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function TodoAttachments({ todoId }: TodoAttachmentsProps) {
  const [attachments, setAttachments] = React.useState<TodoAttachment[]>([]);
  const [status, setStatus] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      setAttachments(await listTodoAttachments(todoId));
      setStatus('');
    } catch {
      setStatus('No pudimos leer los adjuntos guardados.');
    } finally {
      setIsLoading(false);
    }
  }, [todoId]);

  React.useEffect(() => {
    setIsLoading(true);
    refresh();
  }, [refresh]);

  const addAttachments = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (!files.length) {
      return;
    }

    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setStatus(`Podes guardar hasta ${MAX_ATTACHMENTS} adjuntos por elemento.`);
      return;
    }

    const invalidFile = files.find(file =>
      file.size > MAX_ATTACHMENT_SIZE || !ACCEPTED_EXTENSIONS.includes(getFileExtension(file.name))
    );

    if (invalidFile) {
      setStatus('Usa PDF, Word, texto o imagenes de hasta 10 MB por archivo.');
      return;
    }

    try {
      for (const file of files) {
        await saveTodoAttachment(todoId, file);
      }

      await refresh();
      setStatus(files.length === 1 ? 'Adjunto guardado.' : 'Adjuntos guardados.');
    } catch {
      setStatus('No pudimos guardar el adjunto en este dispositivo.');
    }
  };

  const downloadAttachment = async (attachment: TodoAttachment) => {
    try {
      const storedAttachment = await readTodoAttachment(attachment.id);

      if (!storedAttachment) {
        setStatus('Ese adjunto ya no esta disponible.');
        return;
      }

      const url = URL.createObjectURL(storedAttachment.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = storedAttachment.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setStatus('No pudimos abrir el adjunto.');
    }
  };

  const deleteAttachment = async (attachmentId: string) => {
    try {
      await removeTodoAttachment(attachmentId);
      await refresh();
      setStatus('Adjunto eliminado.');
    } catch {
      setStatus('No pudimos eliminar el adjunto.');
    }
  };

  return (
    <section className="TodoAttachments" aria-labelledby="todo-attachments-title">
      <div className="TodoAttachments-heading">
        <div>
          <h3 id="todo-attachments-title">Documentos</h3>
          <p>Se guardan localmente en este dispositivo.</p>
        </div>
        <label className="TodoAttachments-add">
          Adjuntar
          <input
            accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
            multiple
            onChange={addAttachments}
            type="file"
          />
        </label>
      </div>

      {isLoading ? (
        <p className="TodoAttachments-empty">Cargando adjuntos...</p>
      ) : attachments.length ? (
        <ul>
          {attachments.map(attachment => (
            <li key={attachment.id}>
              <button
                className="TodoAttachments-file"
                onClick={() => downloadAttachment(attachment)}
                type="button"
              >
                <strong>{attachment.name}</strong>
                <small>{formatFileSize(attachment.size)}</small>
              </button>
              <button
                aria-label={`Eliminar ${attachment.name}`}
                className="TodoAttachments-delete"
                onClick={() => deleteAttachment(attachment.id)}
                type="button"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="TodoAttachments-empty">Todavia no hay documentos adjuntos.</p>
      )}

      {status && <p className="TodoAttachments-status" role="status">{status}</p>}
    </section>
  );
}

export { TodoAttachments };
