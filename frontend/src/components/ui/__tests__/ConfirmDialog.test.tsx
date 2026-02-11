import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '../organisms/ConfirmDialog';

// Mock framer-motion to render children immediately without animation
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

// Mock focus-trap-react to render children without trapping
vi.mock('focus-trap-react', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ConfirmDialog', () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Eliminar registro',
    message: '¿Estás seguro de que deseas eliminar este registro?',
  };

  beforeEach(() => {
    baseProps.onClose.mockClear();
    baseProps.onConfirm.mockClear();
  });

  it('renders title and message when open', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByText('Eliminar registro')).toBeInTheDocument();
    expect(
      screen.getByText('¿Estás seguro de que deseas eliminar este registro?')
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmDialog {...baseProps} isOpen={false} />);
    expect(screen.queryByText('Eliminar registro')).not.toBeInTheDocument();
  });

  it('renders with alertdialog role', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('renders default confirm and cancel buttons', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(
      screen.getByRole('button', { name: /confirmar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cancelar/i })
    ).toBeInTheDocument();
  });

  it('renders custom confirm and cancel text', () => {
    render(
      <ConfirmDialog
        {...baseProps}
        confirmText="Sí, eliminar"
        cancelText="No, volver"
      />
    );
    expect(
      screen.getByRole('button', { name: /sí, eliminar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /no, volver/i })
    ).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...baseProps} />);
    await user.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(baseProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...baseProps} />);
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(baseProps.onClose).toHaveBeenCalledOnce();
  });

  it('applies danger variant with red confirm button styling', () => {
    render(<ConfirmDialog {...baseProps} variant="danger" />);
    const confirmBtn = screen.getByRole('button', { name: /confirmar/i });
    expect(confirmBtn.className).toMatch(/bg-red/);
  });

  it('applies warning variant styling by default', () => {
    render(<ConfirmDialog {...baseProps} />);
    const confirmBtn = screen.getByRole('button', { name: /confirmar/i });
    expect(confirmBtn.className).toMatch(/bg-yellow/);
  });

  it('applies success variant with green confirm button', () => {
    render(<ConfirmDialog {...baseProps} variant="success" />);
    const confirmBtn = screen.getByRole('button', { name: /confirmar/i });
    expect(confirmBtn.className).toMatch(/bg-green/);
  });

  it('disables confirm button when isLoading is true', () => {
    render(<ConfirmDialog {...baseProps} isLoading />);
    const confirmBtn = screen.getByRole('button', { name: /confirmar/i });
    expect(confirmBtn).toBeDisabled();
    expect(confirmBtn).toHaveAttribute('aria-busy', 'true');
  });

  it('disables cancel button when isLoading is true', () => {
    render(<ConfirmDialog {...baseProps} isLoading />);
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    expect(cancelBtn).toBeDisabled();
  });

  it('disables confirm button when disabled prop is true', () => {
    render(<ConfirmDialog {...baseProps} disabled />);
    const confirmBtn = screen.getByRole('button', { name: /confirmar/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('renders children content when provided', () => {
    render(
      <ConfirmDialog {...baseProps}>
        <p>Contenido adicional</p>
      </ConfirmDialog>
    );
    expect(screen.getByText('Contenido adicional')).toBeInTheDocument();
  });

  it('uses confirmLabel over confirmText when both provided', () => {
    render(
      <ConfirmDialog
        {...baseProps}
        confirmText="Confirmar"
        confirmLabel="Aceptar"
      />
    );
    expect(
      screen.getByRole('button', { name: /aceptar/i })
    ).toBeInTheDocument();
  });
});
