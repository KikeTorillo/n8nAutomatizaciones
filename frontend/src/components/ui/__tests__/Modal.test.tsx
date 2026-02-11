import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../organisms/Modal';

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

describe('Modal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it('renders children when open', () => {
    render(
      <Modal isOpen onClose={onClose}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render children when closed', () => {
    render(
      <Modal isOpen={false} onClose={onClose}>
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders with role="dialog" and aria-modal', () => {
    render(
      <Modal isOpen onClose={onClose} title="Test Modal">
        Content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('renders title via aria-labelledby', () => {
    render(
      <Modal isOpen onClose={onClose} title="Mi Modal">
        Content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    const titleId = dialog.getAttribute('aria-labelledby')!;
    expect(document.getElementById(titleId)).toHaveTextContent('Mi Modal');
  });

  it('closes when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={onClose} title="Test">
        Content
      </Modal>
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close on Escape when disableClose is true', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={onClose} disableClose title="Test">
        Content
      </Modal>
    );
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when clicking backdrop overlay', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={onClose} title="Test">
        Content
      </Modal>
    );
    // The backdrop has aria-hidden="true"
    const backdrop = document.querySelector('[aria-hidden="true"]')!;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders footer when provided', () => {
    render(
      <Modal isOpen onClose={onClose} footer={<button>Guardar</button>}>
        Content
      </Modal>
    );
    expect(
      screen.getByRole('button', { name: /guardar/i })
    ).toBeInTheDocument();
  });

  it('supports alertdialog role', () => {
    render(
      <Modal isOpen onClose={onClose} role="alertdialog" title="Warning">
        Danger zone
      </Modal>
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('renders close button by default', () => {
    render(
      <Modal isOpen onClose={onClose} title="Test">
        Content
      </Modal>
    );
    expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument();
  });
});
