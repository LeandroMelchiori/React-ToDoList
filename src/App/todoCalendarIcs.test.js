import {
  createTodosCalendarExport,
  readTodosCalendarImport,
} from './todoCalendarIcs';
import {
  TODO_DATE_TYPES,
  TODO_KINDS,
  TODO_RECURRENCES,
} from './todoModel';

describe('todoCalendarIcs', () => {
  test('exports dated todos as an ICS calendar', () => {
    const calendar = createTodosCalendarExport([
      {
        id: 'exam-1',
        text: 'Examen final',
        kind: TODO_KINDS.event,
        dateType: TODO_DATE_TYPES.event,
        startDate: '2026-08-08',
        startTime: '10:00',
        description: 'Aula 3',
      },
      {
        id: 'course-1',
        text: 'Cursada de programacion',
        kind: TODO_KINDS.schedule,
        dateType: TODO_DATE_TYPES.period,
        startDate: '2026-08-04',
        endDate: '2026-12-01',
        startTime: '10:00',
        endTime: '12:00',
        recurrence: TODO_RECURRENCES.weekly,
        project: 'Facultad',
      },
      {
        id: 'done-1',
        text: 'Tarea resuelta',
        completed: true,
        dueDate: '2026-08-01',
      },
    ], new Date('2026-07-13T12:00:00.000Z'));

    expect(calendar.count).toBe(2);
    expect(calendar.content).toContain('BEGIN:VCALENDAR');
    expect(calendar.content).toContain('SUMMARY:Examen final');
    expect(calendar.content).toContain('DESCRIPTION:Aula 3');
    expect(calendar.content).toContain('DTSTART:20260808T100000');
    expect(calendar.content).toContain('DTEND:20260808T110000');
    expect(calendar.content).toContain('SUMMARY:Cursada de programacion');
    expect(calendar.content).toContain('DTSTART:20260804T100000');
    expect(calendar.content).toContain('DTEND:20261201T120000');
    expect(calendar.content).toContain('RRULE:FREQ=WEEKLY;UNTIL=20261201T235959');
    expect(calendar.content).not.toContain('Tarea resuelta');
  });

  test('imports basic ICS events as agenda todos', () => {
    const result = readTodosCalendarImport([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:exam-2026@example.com',
      'SUMMARY:Examen de algebra',
      'DESCRIPTION:Aula 3\\nTraer calculadora',
      'DTSTART:20260808T100000',
      'DTEND:20260808T120000',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:inscripcion@example.com',
      'SUMMARY:Inscripcion a finales',
      'DTSTART;VALUE=DATE:20260901',
      'DTEND;VALUE=DATE:20260916',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:cursada@example.com',
      'SUMMARY:Cursada de redes',
      'DTSTART;TZID=America/Argentina/Buenos_Aires:20260804T100000',
      'DTEND;TZID=America/Argentina/Buenos_Aires:20260804T120000',
      'RRULE:FREQ=WEEKLY;UNTIL=20261201T235959',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n'));

    expect(result).toEqual({
      ok: true,
      totalCount: 3,
      todos: [
        expect.objectContaining({
          id: 'ics-exam-2026-example-com',
          text: 'Examen de algebra',
          kind: TODO_KINDS.event,
          description: 'Aula 3\nTraer calculadora',
          dateType: TODO_DATE_TYPES.event,
          startDate: '2026-08-08',
          endDate: null,
          startTime: '10:00',
          endTime: null,
          recurrence: TODO_RECURRENCES.none,
        }),
        expect.objectContaining({
          id: 'ics-inscripcion-example-com',
          text: 'Inscripcion a finales',
          kind: TODO_KINDS.period,
          dateType: TODO_DATE_TYPES.period,
          startDate: '2026-09-01',
          endDate: '2026-09-15',
        }),
        expect.objectContaining({
          id: 'ics-cursada-example-com',
          text: 'Cursada de redes',
          kind: TODO_KINDS.schedule,
          dateType: TODO_DATE_TYPES.period,
          startDate: '2026-08-04',
          endDate: '2026-12-01',
          startTime: '10:00',
          endTime: '12:00',
          recurrence: TODO_RECURRENCES.weekly,
        }),
      ],
    });
  });

  test('ignores ICS events without a title or date', () => {
    expect(readTodosCalendarImport([
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'SUMMARY:',
      'DTSTART:20260808T100000',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'SUMMARY:Sin fecha',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n'))).toEqual({
      ok: false,
      error: 'El calendario no contiene eventos importables.',
    });
  });
});

