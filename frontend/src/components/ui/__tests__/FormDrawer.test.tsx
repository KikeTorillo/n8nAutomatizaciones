import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormDrawer } from '../organisms/FormDrawer';

// Mock vaul Drawer
vi.mock('vaul', () => ({
  Drawer: {
    Root: ({
      children,
      open,
    }: {
      children: React.ReactNode;
      open?: boolean;
    }) => (open ? <>{children}</> : null),
    Trigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Overlay: (props: Record<string, unknown>) => (
      <div data-testid="overlay" {...props} />
    ),
    Content: ({ children, ...props }: { children: React.ReactNode }) => (
      <div data-testid="drawer-content" {...props}>
        {children}
      </div>
    ),
    Title: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    Description: ({ children }: { children: React.ReactNode }) => (
      <p>{children}</p>
    ),
    Close: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

// Mock focus-trap-react
vi.mock('focus-trap-react', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
  children: <input data-testid="form-field" />,
};

describe('FormDrawer', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('auto-generates title for create mode', () => {
    render(
      <FormDrawer {...defaultProps} entityName="Producto" mode="create" />
    );
    const matches = screen.getAllByText('Nuevo/a Producto');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('auto-generates title for edit mode', () => {
    render(<FormDrawer {...defaultProps} entityName="Producto" mode="edit" />);
    const matches = screen.getAllByText('Editar Producto');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('prefers explicit title over auto-generated', () => {
    render(
      <FormDrawer
        {...defaultProps}
        title="Custom Title"
        entityName="Producto"
        mode="edit"
      />
    );
    const matches = screen.getAllByText('Custom Title');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Editar Producto')).not.toBeInTheDocument();
  });

  it('renders submit button with correct label for create', () => {
    render(<FormDrawer {...defaultProps} entityName="Item" mode="create" />);
    expect(screen.getByRole('button', { name: /crear/i })).toBeInTheDocument();
  });

  it('renders submit button with correct label for edit', () => {
    render(<FormDrawer {...defaultProps} entityName="Item" mode="edit" />);
    expect(
      screen.getByRole('button', { name: /actualizar/i })
    ).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <FormDrawer {...defaultProps} onSubmit={onSubmit} entityName="Test" />
    );
    await user.click(screen.getByRole('button', { name: /crear/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('disables buttons when isSubmitting', () => {
    render(<FormDrawer {...defaultProps} isSubmitting entityName="Test" />);
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    expect(cancelBtn).toBeDisabled();
  });

  it('renders children inside form', () => {
    render(<FormDrawer {...defaultProps} />);
    expect(screen.getByTestId('form-field')).toBeInTheDocument();
  });

  it('hides footer when hideFooter is true', () => {
    render(<FormDrawer {...defaultProps} hideFooter />);
    expect(
      screen.queryByRole('button', { name: /cancelar/i })
    ).not.toBeInTheDocument();
  });
});
