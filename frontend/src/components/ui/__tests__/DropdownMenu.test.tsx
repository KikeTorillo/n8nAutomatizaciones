import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropdownMenu } from '../organisms/DropdownMenu';
import type { DropdownMenuItem } from '../types';

const defaultItems: DropdownMenuItem[] = [
  { label: 'Editar', onClick: vi.fn() },
  { label: 'Duplicar', onClick: vi.fn() },
  { label: 'Eliminar', onClick: vi.fn(), variant: 'danger' },
];

describe('DropdownMenu', () => {
  it('renders default trigger button', () => {
    render(<DropdownMenu items={defaultItems} />);
    expect(
      screen.getByRole('button', { name: /más opciones/i })
    ).toBeInTheDocument();
  });

  it('renders custom trigger element', () => {
    render(
      <DropdownMenu trigger={<span>Acciones</span>} items={defaultItems} />
    );
    expect(screen.getByText('Acciones')).toBeInTheDocument();
  });

  it('opens menu on trigger click and renders items', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu items={defaultItems} />);
    await user.click(screen.getByRole('button', { name: /más opciones/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /editar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /duplicar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /eliminar/i })
    ).toBeInTheDocument();
  });

  it('calls item onClick and closes menu on item click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const items: DropdownMenuItem[] = [{ label: 'Editar', onClick }];
    render(<DropdownMenu items={items} />);
    await user.click(screen.getByRole('button', { name: /más opciones/i }));
    await user.click(screen.getByRole('menuitem', { name: /editar/i }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes menu when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu items={defaultItems} />);
    await user.click(screen.getByRole('button', { name: /más opciones/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('sets aria-expanded on trigger', async () => {
    const user = userEvent.setup();
    render(<DropdownMenu items={defaultItems} />);
    const trigger = screen.getByRole('button', { name: /más opciones/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders divider as separator', async () => {
    const user = userEvent.setup();
    const items: DropdownMenuItem[] = [
      { label: 'Editar', onClick: vi.fn() },
      { divider: true },
      { label: 'Eliminar', onClick: vi.fn(), variant: 'danger' },
    ];
    render(<DropdownMenu items={items} />);
    await user.click(screen.getByRole('button', { name: /más opciones/i }));
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
