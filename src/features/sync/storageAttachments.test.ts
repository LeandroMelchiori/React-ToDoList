import { describe, expect, test } from 'vitest';

describe('todo attachment storage contract', () => {
  test('keeps attachment blobs outside the todo JSON model', async () => {
    const module = await import('./storage');

    expect(module.saveTodoAttachment).toBeTypeOf('function');
    expect(module.listTodoAttachments).toBeTypeOf('function');
    expect(module.readTodoAttachment).toBeTypeOf('function');
    expect(module.removeTodoAttachment).toBeTypeOf('function');
  });
});
