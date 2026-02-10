import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../atoms/Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows loading state with aria-busy and disabled', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('does not fire onClick when isLoading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button isLoading onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies variant classes without error', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('defaults to type="button"', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('accepts type="submit"', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('renders icon on the left by default', () => {
    render(<Button icon={<span data-testid="icon">+</span>}>Add</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders icon on the right when iconPosition="right"', () => {
    render(
      <Button icon={<span data-testid="icon">-&gt;</span>} iconPosition="right">
        Next
      </Button>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
