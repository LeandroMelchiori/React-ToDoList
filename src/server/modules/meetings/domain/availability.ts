/** Intervals are UTC epoch milliseconds, expanded and authorized by the API adapter. */
export type AvailabilityInterval = { start: number; end: number };
export type AvailabilityParticipant = {
  userId: string;
  available: AvailabilityInterval[];
  busy: AvailabilityInterval[];
};
export type AvailabilityQuery = {
  participants: AvailabilityParticipant[];
  range: AvailabilityInterval;
  durationMinutes: number;
  stepMinutes?: number;
  limit?: number;
};

const MINUTE = 60_000;

function validateInterval(interval: AvailabilityInterval): void {
  if (!Number.isSafeInteger(interval.start) || !Number.isSafeInteger(interval.end) || interval.end <= interval.start) {
    throw new RangeError('Invalid availability interval');
  }
}

function merge(intervals: AvailabilityInterval[], range: AvailabilityInterval): AvailabilityInterval[] {
  const sorted = intervals.flatMap(interval => {
    validateInterval(interval);
    const start = Math.max(interval.start, range.start);
    const end = Math.min(interval.end, range.end);
    return start < end ? [{ start, end }] : [];
  }).sort((a, b) => a.start - b.start || a.end - b.end);
  const result: AvailabilityInterval[] = [];
  for (const interval of sorted) {
    const last = result[result.length - 1];
    if (last && interval.start <= last.end) last.end = Math.max(last.end, interval.end);
    else result.push({ ...interval });
  }
  return result;
}

function freeWindows(participant: AvailabilityParticipant, range: AvailabilityInterval): AvailabilityInterval[] {
  const available = merge(participant.available, range);
  const busy = merge(participant.busy, range);
  return available.flatMap(window => {
    const result: AvailabilityInterval[] = [];
    let cursor = window.start;
    for (const block of busy) {
      if (block.end <= cursor) continue;
      if (block.start >= window.end) break;
      if (block.start > cursor) result.push({ start: cursor, end: Math.min(block.start, window.end) });
      cursor = Math.max(cursor, block.end);
      if (cursor >= window.end) break;
    }
    if (cursor < window.end) result.push({ start: cursor, end: window.end });
    return result;
  });
}

function intersect(a: AvailabilityInterval[], b: AvailabilityInterval[]): AvailabilityInterval[] {
  const result: AvailabilityInterval[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const start = Math.max(a[i].start, b[j].start);
    const end = Math.min(a[i].end, b[j].end);
    if (start < end) result.push({ start, end });
    if (a[i].end <= b[j].end) i += 1;
    else j += 1;
  }
  return result;
}

export function findCommonAvailability(query: AvailabilityQuery): AvailabilityInterval[] {
  const { participants, range, durationMinutes, stepMinutes = 15, limit = 5 } = query;
  validateInterval(range);
  if (participants.length < 2 || participants.length > 20 ||
      new Set(participants.map(p => p.userId)).size !== participants.length || participants.some(p => !p.userId) ||
      !Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 480 ||
      !Number.isInteger(stepMinutes) || stepMinutes < 1 || stepMinutes > 60 ||
      !Number.isInteger(limit) || limit < 1 || limit > 100 || range.end - range.start > 31 * 24 * 60 * MINUTE) {
    throw new RangeError('Invalid availability query');
  }
  // Validate every input, even if an earlier participant has no available windows.
  const windows = participants.map(participant => freeWindows(participant, range));
  let common = windows[0];
  for (const participantWindows of windows.slice(1)) common = intersect(common, participantWindows);
  const duration = durationMinutes * MINUTE;
  const step = stepMinutes * MINUTE;
  const suggestions: AvailabilityInterval[] = [];
  for (const window of common) {
    for (let start = Math.ceil(window.start / step) * step; start + duration <= window.end; start += step) {
      suggestions.push({ start, end: start + duration });
      if (suggestions.length === limit) return suggestions;
    }
  }
  return suggestions;
}
