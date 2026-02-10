import { render, screen } from '@testing-library/react';
import { Badge } from '../atoms/Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('has role="status"', () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(<Badge icon={<span data-testid="icon">*</span>}>With icon</Badge>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('With icon')).toBeInTheDocument();
  });

  it('icon has aria-hidden', () => {
    render(<Badge icon={<span data-testid="badge-icon">!</span>}>Alert</Badge>);
    const iconWrapper = screen.getByTestId('badge-icon').parentElement;
    expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports aria-label', () => {
    render(<Badge aria-label="3 new items">3</Badge>);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', '3 new items');
  });

  it('renders different variants without error', () => {
    const { rerender } = render(<Badge variant="success">Ok</Badge>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<Badge variant="default">Default</Badge>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders different sizes without error', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
