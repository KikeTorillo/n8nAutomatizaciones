import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../atoms/Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'hello');
    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it('shows error state with aria-invalid', () => {
    render(<Input hasError />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when no error', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  it('renders prefix and suffix', () => {
    render(<Input prefix="$" suffix="MXN" />);
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByText('MXN')).toBeInTheDocument();
  });

  it('supports disabled state', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('accepts placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('sets aria-required when required', () => {
    render(<Input required />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });

  it('defaults to type text', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });
});
