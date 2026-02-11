import { render, screen } from '@testing-library/react';
import { Drawer } from '../organisms/Drawer';

// Mock vaul to render children directly, simulating open/closed behavior
vi.mock('vaul', () => {
  const Root = ({
    open,
    _onOpenChange,
    children,
  }: {
    open: boolean;
    _onOpenChange?: (open: boolean) => void;
    modal?: boolean;
    dismissible?: boolean;
    children: React.ReactNode;
  }) => {
    if (!open) return null;
    return (
      <div data-testid="vaul-root" data-open={open}>
        {children}
      </div>
    );
  };

  const Portal = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );

  const Overlay = ({
    className,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="drawer-overlay" className={className} {...props} />
  );

  const Content = ({
    children,
    role,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => (
    <div role={role} {...props}>
      {children}
    </div>
  );

  const Title = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <span className={className}>{children}</span>;

  const Description = ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  );
  const Trigger = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );
  const Close = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );

  return {
    Drawer: {
      Root,
      Portal,
      Overlay,
      Content,
      Title,
      Description,
      Trigger,
      Close,
    },
  };
});

describe('Drawer', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it('renders children when open', () => {
    render(
      <Drawer isOpen onClose={onClose}>
        <p>Drawer content</p>
      </Drawer>
    );
    expect(screen.getByText('Drawer content')).toBeInTheDocument();
  });

  it('does not render children when closed', () => {
    render(
      <Drawer isOpen={false} onClose={onClose}>
        <p>Drawer content</p>
      </Drawer>
    );
    expect(screen.queryByText('Drawer content')).not.toBeInTheDocument();
  });

  it('renders with role="dialog" and aria-modal', () => {
    render(
      <Drawer isOpen onClose={onClose} title="Test Drawer">
        Content
      </Drawer>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('renders title as sr-only VaulDrawer.Title', () => {
    render(
      <Drawer isOpen onClose={onClose} title="Mi Drawer">
        Content
      </Drawer>
    );
    const matches = screen.getAllByText('Mi Drawer');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders footer when provided', () => {
    render(
      <Drawer isOpen onClose={onClose} footer={<button>Guardar</button>}>
        Content
      </Drawer>
    );
    expect(
      screen.getByRole('button', { name: /guardar/i })
    ).toBeInTheDocument();
  });

  it('does not render footer when not provided', () => {
    render(
      <Drawer isOpen onClose={onClose}>
        Content
      </Drawer>
    );
    expect(
      screen.queryByRole('button', { name: /guardar/i })
    ).not.toBeInTheDocument();
  });

  it('renders overlay element', () => {
    render(
      <Drawer isOpen onClose={onClose}>
        Content
      </Drawer>
    );
    expect(screen.getByTestId('drawer-overlay')).toBeInTheDocument();
  });

  it('renders drag handle when disableClose is false', () => {
    const { container } = render(
      <Drawer isOpen onClose={onClose}>
        Content
      </Drawer>
    );
    // The drag handle is a small rounded div with w-12 class
    const handle = container.querySelector('.w-12.rounded-full');
    expect(handle).toBeInTheDocument();
  });

  it('hides drag handle when disableClose is true', () => {
    const { container } = render(
      <Drawer isOpen onClose={onClose} disableClose>
        Content
      </Drawer>
    );
    const handle = container.querySelector('.w-12.rounded-full');
    expect(handle).not.toBeInTheDocument();
  });

  it('renders close button when showCloseButton is true', () => {
    render(
      <Drawer isOpen onClose={onClose} showCloseButton title="Test">
        Content
      </Drawer>
    );
    expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument();
  });
});
