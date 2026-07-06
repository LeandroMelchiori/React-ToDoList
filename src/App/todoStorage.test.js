import { getStoredItem, setStoredItem } from './todoStorage';

describe('todo storage adapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('stores and reads serialized items through the available local adapter', async () => {
    await setStoredItem('TEST_KEY', JSON.stringify([{ text: 'Persistir tarea' }]));

    expect(await getStoredItem('TEST_KEY')).toBe('[{"text":"Persistir tarea"}]');
  });

  test('returns null when an item does not exist', async () => {
    expect(await getStoredItem('MISSING_KEY')).toBeNull();
  });
});
