import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

async function expectNoAccessibilityViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const details = results.violations
    .map(violation => {
      const targets = violation.nodes.map(node => node.target.join(' ')).join(', ');
      return `${violation.id}: ${violation.help} (${targets})`;
    })
    .join('\n');

  expect(results.violations, details).toEqual([]);
}

async function seedAccessibleTodo(page) {
  await page.addInitScript(() => {
    localStorage.setItem('TODOS_V1', JSON.stringify([{
      id: 'axe-task',
      text: 'Revisar accesibilidad',
      description: 'Validar los flujos principales con tecnologia asistiva.',
      completed: false,
      kind: 'task',
      dateType: 'none',
      priority: 'high',
      project: 'TaskFlow',
      tags: ['calidad'],
      recurrence: 'none',
      subtasks: [
        { id: 'axe-subtask', text: 'Ejecutar Axe', completed: false },
      ],
    }]));
  });
}

test('has no detectable accessibility violations in the task list', async ({ page }) => {
  await seedAccessibleTodo(page);
  await page.goto('/');
  await expect(page.getByText('Revisar accesibilidad')).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

test('has no detectable accessibility violations in the creation dialog', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Crear nueva tarea' }).click();
  await expect(page.getByRole('dialog', { name: 'Crear tarea' })).toBeVisible();

  await expectNoAccessibilityViolations(page);
});

test('has no detectable accessibility violations in the dark mobile calendar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const date = new Date();
    const today = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');

    localStorage.setItem('THEME_V1', 'dark');
    localStorage.setItem('TODOS_V1', JSON.stringify([{
      id: 'axe-event',
      text: 'Rendir examen',
      completed: false,
      kind: 'event',
      dateType: 'event',
      startDate: today,
      startTime: '10:00',
      priority: 'medium',
      recurrence: 'none',
    }]));
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Calendario' }).click();
  await expect(page.getByRole('grid', { name: /Calendario/ })).toBeVisible();

  await expectNoAccessibilityViolations(page);
});
