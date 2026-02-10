import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from '../atoms/IconButton';
import { X } from 'lucide-react';

describe('IconButton', () => {
  it('renders with aria-label from label prop', () => {
    render(<IconButton icon={X} label="Close" />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon={X} label="Close" onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows loading state with aria-busy and disabled', () => {
    render(<IconButton icon={X} label="Close" isLoading />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('does not fire onClick when isLoading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon={X} label="Close" isLoading onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('supports active state with aria-pressed', () => {
    render(<IconButton icon={X} label="Close" active />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not set aria-pressed when not active', () => {
    render(<IconButton icon={X} label="Close" />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed');
  });

  it('is disabled when disabled prop is true', () => {
    render(<IconButton icon={X} label="Close" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('defaults to type="button"', () => {
    render(<IconButton icon={X} label="Close" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
