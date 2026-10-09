import { expect, test } from 'vitest';
import rawContract from '../../docs/backend/openapi.json?raw';

const contract = JSON.parse(rawContract);

test('the API contract resolves local references and requires authenticated access', () => {
  expect(contract.openapi).toMatch(/^3\.1\./);
  expect(contract.security).toEqual([{ bearerAuth: [] }]);
  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    if ('$ref' in value) {
      const reference = String(value.$ref);
      expect(reference).toMatch(/^#\//);
      let target: any = contract;
      for (const segment of reference.slice(2).split('/')) target = target?.[segment];
      expect(target, reference).toBeDefined();
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(contract);
});

test('mutations require idempotency and versioned resources require If-Match', () => {
  const ids = new Set<string>();
  for (const [path, methods] of Object.entries(contract.paths) as [string, Record<string, any>][]) {
    for (const operation of Object.values(methods)) {
      expect(ids.has(operation.operationId)).toBe(false);
      ids.add(operation.operationId);
      if (operation['x-mutation']) expect(operation.parameters).toContainEqual({ $ref: '#/components/parameters/IdempotencyKey' });
      for (const placeholder of path.matchAll(/\{([^}]+)\}/g)) {
        expect(operation.parameters).toContainEqual(expect.objectContaining({ name: placeholder[1], in: 'path', required: true }));
      }
    }
  }
  expect(contract.paths['/calendars/{calendarId}/items/{itemId}'].put.parameters)
    .toContainEqual({ $ref: '#/components/parameters/IfMatch' });
});

test('availability exposes slots and an opaque revision token, not private event details', () => {
  expect(Object.keys(contract.components.schemas.Availability.properties).sort()).toEqual(['availabilityToken', 'slots']);
  expect(Object.keys(contract.components.schemas.Slot.properties).sort()).toEqual(['end', 'start']);
  expect(contract.paths['/availability/query'].post['x-mutation']).toBe(false);
  expect(contract.paths['/availability/query'].post.responses['403']).toBeDefined();
  expect(contract.paths['/meetings'].post.responses['409']).toBeDefined();
});
