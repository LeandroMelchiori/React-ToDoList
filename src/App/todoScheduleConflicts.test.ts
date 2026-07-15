import { describe, expect, test } from 'vitest';
import { createTodo } from './todoModel';
import {
  getTodoScheduleConflictMatches,
  getTodoScheduleConflicts,
} from './todoScheduleConflicts';

function createSchedule(
  id: string,
  startTime: string,
  endTime: string,
  options: { startDate?: string; endDate?: string; recurrence?: string; recurrenceDays?: number[] } = {}
) {
  return {
    ...createTodo(id, {
      kind: 'schedule',
      dateType: 'period',
      startDate: options.startDate || '2026-08-10',
      endDate: options.endDate || '2026-08-10',
      startTime,
      endTime,
      recurrence: options.recurrence || 'none',
      recurrenceDays: options.recurrenceDays,
    }),
    id,
  };
}

describe('todoScheduleConflicts', () => {
  test('groups overlapping ranges on the same day', () => {
    const todos = [
      createSchedule('algebra', '10:00', '12:00'),
      createSchedule('consulta', '11:30', '12:30'),
      createSchedule('laboratorio', '12:15', '13:00'),
    ];

    expect(getTodoScheduleConflicts(todos, ['2026-08-10'])).toEqual([
      {
        dateValue: '2026-08-10',
        todoIds: ['algebra', 'consulta', 'laboratorio'],
      },
    ]);
  });

  test('ignores adjacent ranges, different days and items without an end time', () => {
    const todos = [
      createSchedule('algebra', '10:00', '12:00'),
      createSchedule('consulta', '12:00', '13:00'),
      createSchedule('otro-dia', '10:30', '11:30', { startDate: '2026-08-11', endDate: '2026-08-11' }),
      { ...createSchedule('sin-fin', '10:30', '11:00'), endTime: null },
    ];

    expect(getTodoScheduleConflicts(todos, ['2026-08-10'])).toEqual([]);
  });

  test('detects weekly recurring ranges only on matching weekdays', () => {
    const recurring = createSchedule('cursada', '10:00', '12:00', {
      endDate: '2026-09-30',
      recurrence: 'weekly',
      recurrenceDays: [1],
    });
    const mondayEvent = createSchedule('consulta', '11:00', '11:30');

    expect(getTodoScheduleConflicts([recurring, mondayEvent], [
      '2026-08-10',
      '2026-08-11',
    ])).toEqual([
      {
        dateValue: '2026-08-10',
        todoIds: ['cursada', 'consulta'],
      },
    ]);
  });

  test('summarizes recurring conflicts for a candidate before saving', () => {
    const existing = createSchedule('cursada', '10:00', '12:00', {
      endDate: '2026-08-31',
      recurrence: 'weekly',
      recurrenceDays: [1],
    });
    const candidate = createSchedule('consulta', '11:00', '11:30', {
      endDate: '2026-08-31',
      recurrence: 'weekly',
      recurrenceDays: [1],
    });

    expect(getTodoScheduleConflictMatches([existing], candidate)).toEqual([
      {
        firstDate: '2026-08-10',
        occurrences: 4,
        text: 'cursada',
        todoId: 'cursada',
      },
    ]);
    expect(getTodoScheduleConflictMatches([candidate], candidate, candidate.id)).toEqual([]);
  });

  test('detects task work blocks that overlap agenda items', () => {
    const course = createSchedule('cursada', '10:00', '12:00');
    const task = {
      ...createTodo('Preparar entrega', {
        timeBlocks: [
          { id: 'block-1', date: '2026-08-10', startTime: '11:00', endTime: '13:00' },
        ],
      }),
      id: 'entrega',
    };

    expect(getTodoScheduleConflicts([course, task], ['2026-08-10'])).toEqual([
      { dateValue: '2026-08-10', todoIds: ['cursada', 'entrega'] },
    ]);
    expect(getTodoScheduleConflictMatches([course], task)).toEqual([
      {
        firstDate: '2026-08-10',
        occurrences: 1,
        text: 'cursada',
        todoId: 'cursada',
      },
    ]);
  });
});
