import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoHeaderTools } from './TodoHeaderTools';

const sections = [
  { id: 'data', label: 'Datos y copias', description: 'Exportar e importar', content: <button>Exportar backup</button> },
  { id: 'settings', label: 'Preferencias', description: 'Vista y densidad', content: <p>Configuracion</p> },
];

test('opens data directly and restores focus after Escape', async () => {
  const user = userEvent.setup();
  render(<TodoHeaderTools sections={sections} shortcutSectionId="data" />);
  const shortcut = screen.getByRole('button', { name: 'Exportar / importar' });
  await user.click(shortcut);
  expect(shortcut).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: 'Exportar backup' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Exportar backup' }));
  await user.keyboard('{Escape}');
  expect(shortcut).toHaveAttribute('aria-expanded', 'false');
  expect(shortcut).toHaveFocus();
});

test('switches between the data shortcut and options without rendering duplicate panels', async () => {
  const user = userEvent.setup();
  render(<TodoHeaderTools sections={sections} shortcutSectionId="data" />);
  const shortcut = screen.getByRole('button', { name: 'Exportar / importar' });
  await user.click(shortcut);
  await user.click(screen.getByRole('button', { name: 'Opciones' }));
  expect(screen.getByRole('button', { name: /Preferencias/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Exportar backup' })).not.toBeInTheDocument();
  await user.click(shortcut);
  expect(screen.getAllByRole('button', { name: 'Exportar backup' })).toHaveLength(1);
  await user.click(shortcut);
  expect(screen.queryByRole('button', { name: 'Exportar backup' })).not.toBeInTheDocument();
});

test('only shows a shortcut when its public section exists', () => {
  render(<TodoHeaderTools sections={sections} shortcutSectionId="missing" />);
  expect(screen.queryByRole('button', { name: 'Exportar / importar' })).not.toBeInTheDocument();
});
