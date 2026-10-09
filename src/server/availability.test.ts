import { describe, expect, test } from 'vitest';
import { findCommonAvailability } from './availability';
import type { AvailabilityParticipant } from './availability';

const at = (time: string) => Date.parse(`2026-10-09T${time.padStart(5, '0')}:00Z`);
const interval = (start: string, end: string) => ({ start: at(start), end: at(end) });
const participant = (userId: string, busy: ReturnType<typeof interval>[] = []): AvailabilityParticipant =>
  ({ userId, available: [interval('09:00', '18:00')], busy });
const query = () => ({ participants: [participant('a'), participant('b')], range: interval('09:00', '18:00'), durationMinutes: 60 });

describe('common availability', () => {
  test('finds slots for two friends within both permitted windows', () => {
    const result = findCommonAvailability({ ...query(), participants: [participant('a', [interval('09:00', '12:00')]),
      { ...participant('b'), available: [interval('10:00', '14:00')], busy: [interval('13:00', '14:00')] }] });
    expect(result).toEqual([interval('12:00', '13:00')]);
  });
  test('handles five participants without special-casing a fixed group', () => {
    const participants = Array.from({ length: 5 }, (_, i) => participant(`user-${i}`, [interval(`${9 + i}:00`, `${10 + i}:00`)]));
    expect(findCommonAvailability({ ...query(), participants, limit: 1 })).toEqual([interval('14:00', '15:00')]);
  });
  test('merges overlaps, supports adjacency and leaves input untouched', () => {
    const input = { ...query(), participants: [participant('a', [interval('10:00', '12:00'), interval('09:00', '11:00'), interval('12:00', '13:00')]), participant('b')], limit: 1 };
    const original = structuredClone(input);
    expect(findCommonAvailability(input)).toEqual([interval('13:00', '14:00')]);
    expect(input).toEqual(original);
  });
  test('keeps disconnected windows and respects duration and granularity', () => {
    expect(findCommonAvailability({ ...query(), durationMinutes: 30,
      participants: [{ ...participant('a'), available: [interval('09:07', '09:45'), interval('15:00', '15:20')] }, participant('b')] }))
      .toEqual([interval('09:15', '09:45')]);
  });
  test('returns no slots when one participant has no availability', () => {
    expect(findCommonAvailability({ ...query(), participants: [participant('a'), { ...participant('b'), available: [] }] })).toEqual([]);
  });
  test('rejects duplicates, malformed intervals and unbounded requests', () => {
    expect(() => findCommonAvailability({ ...query(), participants: [participant('a'), participant('a')] })).toThrow(RangeError);
    expect(() => findCommonAvailability({ ...query(), durationMinutes: 0 })).toThrow(RangeError);
    expect(() => findCommonAvailability({ ...query(), range: { start: 0, end: 32 * 86_400_000 } })).toThrow(RangeError);
    expect(() => findCommonAvailability({ ...query(), participants: [{ ...participant('a'), available: [] },
      participant('b', [{ start: NaN, end: Infinity }])] })).toThrow(RangeError);
  });
  test('clips busy intervals to the requested range', () => {
    expect(findCommonAvailability({ ...query(), participants: [participant('a', [interval('08:00', '10:00'), interval('17:00', '19:00')]), participant('b')], limit: 1 }))
      .toEqual([interval('10:00', '11:00')]);
  });
});
