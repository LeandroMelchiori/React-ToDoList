import { performance } from 'node:perf_hooks';

const CASES = [100, 1000, 5000];

function createTodo(index) {
  return {
    id: `benchmark-${index}`,
    text: `Tarea de rendimiento ${index}`,
    kind: 'task',
    description: 'Descripcion representativa para medir un workspace local con datos reales.',
    completed: index % 4 === 0,
    order: index,
    priority: index % 5 === 0 ? 'high' : 'medium',
    dateType: 'due',
    dueDate: `2026-08-${String((index % 28) + 1).padStart(2, '0')}`,
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    recurrence: index % 7 === 0 ? 'weekly' : 'none',
    recurrenceDays: index % 7 === 0 ? [1, 3] : [],
    recurrenceEndDate: null,
    recurrenceCount: null,
    completedOccurrences: [],
    excludedOccurrences: [],
    reminder: 'none',
    project: `Proyecto ${index % 8}`,
    tags: ['benchmark', `grupo-${index % 5}`],
    timeBlocks: [],
    subtasks: [
      { id: `subtask-${index}-1`, text: 'Primer paso', completed: false },
      { id: `subtask-${index}-2`, text: 'Segundo paso', completed: index % 3 === 0 },
    ],
    createdAt: '2026-07-15T12:00:00.000Z',
    completedAt: null,
    archivedAt: null,
  };
}

function measure(operation, iterations) {
  const samples = [];

  for (let index = 0; index < iterations; index += 1) {
    const startedAt = performance.now();
    operation();
    samples.push(performance.now() - startedAt);
  }

  samples.sort((first, second) => first - second);

  return {
    average: samples.reduce((total, sample) => total + sample, 0) / samples.length,
    p95: samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))],
  };
}

console.log('TaskFlow storage serialization benchmark');
console.log('Todos | Payload KB | Stringify avg/p95 ms | Parse avg/p95 ms');

for (const todoCount of CASES) {
  const workspace = Array.from({ length: todoCount }, (_, index) => createTodo(index));
  const serializedWorkspace = JSON.stringify(workspace);
  const iterations = todoCount >= 5000 ? 20 : 50;

  JSON.stringify(workspace);
  JSON.parse(serializedWorkspace);

  const stringify = measure(() => JSON.stringify(workspace), iterations);
  const parse = measure(() => JSON.parse(serializedWorkspace), iterations);
  const payloadKilobytes = Buffer.byteLength(serializedWorkspace) / 1024;

  console.log([
    String(todoCount).padStart(5),
    payloadKilobytes.toFixed(1).padStart(10),
    `${stringify.average.toFixed(2)}/${stringify.p95.toFixed(2)}`.padStart(21),
    `${parse.average.toFixed(2)}/${parse.p95.toFixed(2)}`.padStart(17),
  ].join(' | '));
}
