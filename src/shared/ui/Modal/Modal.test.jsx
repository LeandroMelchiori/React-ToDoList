import { render } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal scroll isolation', () => {
  beforeEach(() => {
    const root = document.createElement('div');
    root.id = 'modal';
    document.body.appendChild(root);
    document.body.style.overflow = 'auto';
  });

  afterEach(() => {
    document.getElementById('modal')?.remove();
    document.body.style.overflow = '';
  });

  test('locks background scrolling and restores the previous overflow on close', () => {
    const { unmount } = render(<Modal><button>Cerrar</button></Modal>);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  test('keeps scrolling locked until the last dialog closes', () => {
    const first = render(<Modal label="Primero"><button>Primero</button></Modal>);
    const second = render(<Modal label="Segundo"><button>Segundo</button></Modal>);
    first.unmount();
    expect(document.body.style.overflow).toBe('hidden');
    second.unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});
