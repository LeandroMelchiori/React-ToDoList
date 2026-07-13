import { describe, expect, test } from 'vitest';
import { parseTodoQuickAdd } from './todoQuickAdd';

describe('todo quick add', () => {
    test('extracts task metadata from a short sentence', () => {
        expect(parseTodoQuickAdd(
            'Preparar parcial manana 10:30 #facultad #algebra !alta',
            new Date(2026, 6, 13, 9, 0)
        )).toEqual({
            text: 'Preparar parcial',
            details: {
                dueDate: '2026-07-14',
                priority: 'high',
                startTime: '10:30',
                tags: ['facultad', 'algebra'],
            },
            summary: ['Alta', '#facultad', '#algebra', '14/07/2026', '10:30'],
        });
    });

    test('anchors recurrence rules on today when no date is provided', () => {
        expect(parseTodoQuickAdd(
            'Repasar vocabulario cada dia',
            new Date(2026, 6, 13, 9, 0)
        )).toMatchObject({
            text: 'Repasar vocabulario',
            details: {
                dueDate: '2026-07-13',
                recurrence: 'daily',
            },
            summary: ['Diaria', '13/07/2026'],
        });
    });

    test('moves slash dates without a year to the next valid occurrence', () => {
        expect(parseTodoQuickAdd('Renovar licencia 10/01', new Date(2026, 6, 13))).toMatchObject({
            text: 'Renovar licencia',
            details: { dueDate: '2027-01-10' },
        });
    });
});
