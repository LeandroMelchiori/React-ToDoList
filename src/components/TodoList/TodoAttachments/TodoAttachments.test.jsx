import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const storageMocks = vi.hoisted(() => ({
  listTodoAttachments: vi.fn(),
  readTodoAttachment: vi.fn(),
  removeTodoAttachment: vi.fn(),
  saveTodoAttachment: vi.fn(),
}));

vi.mock('../../../App/todoStorage', () => storageMocks);

import { TodoAttachments } from './TodoAttachments';

const attachment = {
  id: 'attachment-1',
  todoId: 'todo-1',
  name: 'guia.pdf',
  type: 'application/pdf',
  size: 1024,
  createdAt: '2026-10-08T18:00:00.000Z',
};

describe('TodoAttachments', () => {
  beforeEach(() => {
    storageMocks.listTodoAttachments.mockReset();
    storageMocks.readTodoAttachment.mockReset();
    storageMocks.removeTodoAttachment.mockReset();
    storageMocks.saveTodoAttachment.mockReset();
  });

  test('stores an accepted file and refreshes the local list', async () => {
    const user = userEvent.setup();

    storageMocks.listTodoAttachments
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([attachment]);
    storageMocks.saveTodoAttachment.mockResolvedValue(attachment);

    render(<TodoAttachments todoId="todo-1" />);

    expect(await screen.findByText('Todavia no hay documentos adjuntos.')).toBeInTheDocument();

    const file = new File(['contenido'], 'guia.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText('Adjuntar'), file);

    expect(storageMocks.saveTodoAttachment).toHaveBeenCalledWith('todo-1', file);
    expect(await screen.findByText('guia.pdf')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Adjunto guardado.');
  });

  test('rejects unsupported file extensions before storing them', async () => {
    const user = userEvent.setup();

    storageMocks.listTodoAttachments.mockResolvedValue([]);

    render(<TodoAttachments todoId="todo-1" />);

    await screen.findByText('Todavia no hay documentos adjuntos.');

    const file = new File(['contenido'], 'ejecutable.exe', { type: 'application/octet-stream' });
    await user.upload(screen.getByLabelText('Adjuntar'), file);

    expect(storageMocks.saveTodoAttachment).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Usa PDF, Word, texto o imagenes de hasta 10 MB por archivo.'
    );
  });
});
