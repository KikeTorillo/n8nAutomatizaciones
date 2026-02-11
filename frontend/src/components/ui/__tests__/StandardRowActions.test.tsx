import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StandardRowActions } from '../organisms/StandardRowActions';

// Mock framer-motion (ConfirmDialog -> Modal uses it)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
    }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock focus-trap-react
vi.mock('focus-trap-react', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const testRow = { id: 1, nombre: 'Test Item' };

describe('StandardRowActions', () => {
  it('renders edit button when onEdit is provided', () => {
    render(<StandardRowActions row={testRow} onEdit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
  });

  it('renders delete button when onDelete is provided', () => {
    render(<StandardRowActions row={testRow} onDelete={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /eliminar/i })
    ).toBeInTheDocument();
  });

  it('renders both edit and delete buttons', () => {
    render(
      <StandardRowActions row={testRow} onEdit={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /eliminar/i })
    ).toBeInTheDocument();
  });

  it('calls onEdit with the row when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<StandardRowActions row={testRow} onEdit={onEdit} />);
    await user.click(screen.getByRole('button', { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledWith(testRow);
  });

  it('calls onDelete with the row when delete is confirmed', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <StandardRowActions row={testRow} onDelete={onDelete} confirmDelete />
    );

    // Click inline delete button (aria-label="Eliminar") to open confirm dialog
    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    // Confirm dialog should appear
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/eliminar registro/i)).toBeInTheDocument();

    // Click the confirm button inside the dialog (not the inline one)
    const dialogButtons = within(dialog).getAllByRole('button');
    const confirmBtn = dialogButtons.find(
      (btn) => btn.textContent === 'Eliminar'
    )!;
    await user.click(confirmBtn);
    expect(onDelete).toHaveBeenCalledWith(testRow);
  });

  it('calls onDelete directly when confirmDelete is false', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <StandardRowActions
        row={testRow}
        onDelete={onDelete}
        confirmDelete={false}
      />
    );
    await user.click(screen.getByRole('button', { name: /eliminar/i }));
    expect(onDelete).toHaveBeenCalledWith(testRow);
    // No dialog should appear
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('does not render edit button when canEdit is false', () => {
    render(
      <StandardRowActions row={testRow} onEdit={vi.fn()} canEdit={false} />
    );
    expect(
      screen.queryByRole('button', { name: /editar/i })
    ).not.toBeInTheDocument();
  });

  it('does not render delete button when canDelete is false', () => {
    render(
      <StandardRowActions row={testRow} onDelete={vi.fn()} canDelete={false} />
    );
    expect(
      screen.queryByRole('button', { name: /eliminar/i })
    ).not.toBeInTheDocument();
  });

  it('renders view detail button when onView is provided', () => {
    render(<StandardRowActions row={testRow} onView={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /ver detalle/i })
    ).toBeInTheDocument();
  });

  it('calls onView with the row when view button is clicked', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    render(<StandardRowActions row={testRow} onView={onView} />);
    await user.click(screen.getByRole('button', { name: /ver detalle/i }));
    expect(onView).toHaveBeenCalledWith(testRow);
  });

  it('renders compact mode with dropdown trigger', () => {
    render(
      <StandardRowActions
        row={testRow}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        compact
      />
    );
    expect(
      screen.getByRole('button', { name: /más opciones/i })
    ).toBeInTheDocument();
    // Inline buttons should not be visible
    expect(
      screen.queryByRole('button', { name: /^editar$/i })
    ).not.toBeInTheDocument();
  });

  it('opens dropdown with actions in compact mode', async () => {
    const user = userEvent.setup();
    render(
      <StandardRowActions
        row={testRow}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        compact
      />
    );
    await user.click(screen.getByRole('button', { name: /más opciones/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /editar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /eliminar/i })
    ).toBeInTheDocument();
  });

  it('shows confirm dialog with custom entityName', async () => {
    const user = userEvent.setup();
    render(
      <StandardRowActions
        row={testRow}
        onDelete={vi.fn()}
        confirmDelete
        entityName="producto"
      />
    );
    await user.click(screen.getByRole('button', { name: /eliminar/i }));
    expect(screen.getByText(/eliminar producto/i)).toBeInTheDocument();
    expect(screen.getByText(/eliminar este producto/i)).toBeInTheDocument();
  });
});
