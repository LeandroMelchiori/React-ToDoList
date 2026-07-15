import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const visualTodos = [
  {
    id: 'visual-planning',
    text: 'Preparar lanzamiento de TaskFlow',
    description: 'Revisar el recorrido principal y cerrar los detalles pendientes.',
    kind: 'task',
    dateType: 'deadline',
    dueDate: '2099-08-15',
    completed: false,
    priority: 'high',
    project: 'TaskFlow',
    tags: ['producto', 'calidad'],
    recurrence: 'none',
    subtasks: [
      { id: 'visual-subtask-1', text: 'Validar calendario', completed: true },
      { id: 'visual-subtask-2', text: 'Revisar accesibilidad', completed: false },
      { id: 'visual-subtask-3', text: 'Preparar version', completed: false },
    ],
  },
  {
    id: 'visual-focus',
    text: 'Reservar bloque de trabajo profundo',
    description: 'Avanzar sin interrupciones en la siguiente mejora.',
    kind: 'task',
    dateType: 'none',
    completed: false,
    priority: 'medium',
    project: 'Personal',
    tags: ['foco'],
    recurrence: 'none',
    subtasks: [],
  },
  {
    id: 'visual-complete',
    text: 'Definir objetivos de la semana',
    kind: 'task',
    dateType: 'none',
    completed: true,
    priority: 'low',
    project: 'Personal',
    tags: ['planificacion'],
    recurrence: 'none',
    subtasks: [],
  },
];

async function openVisualFixture(page, viewport) {
  await page.setViewportSize(viewport);
  await page.addInitScript((todos) => {
    localStorage.clear();
    localStorage.setItem('THEME_V1', 'light');
    localStorage.setItem('TODOS_V1', JSON.stringify(todos));
  }, visualTodos);
  await page.goto('/');
  await expect(page.getByText('Preparar lanzamiento de TaskFlow')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test('matches the desktop task layout', async ({ page }) => {
  await openVisualFixture(page, { width: 1440, height: 1000 });

  await expect(page).toHaveScreenshot('taskflow-list-desktop.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.08,
  });
});

test('matches the mobile task layout', async ({ page }) => {
  await openVisualFixture(page, { width: 390, height: 844 });

  await expect(page).toHaveScreenshot('taskflow-list-mobile.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.08,
  });
});
