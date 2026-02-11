import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../atoms/Checkbox';

describe('Checkbox', () => {
  it('renders a checkbox input', () => {
    render(<Checkbox aria-label="Aceptar términos" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders unchecked by default', () => {
    render(<Checkbox aria-label="Test" />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('renders checked when checked prop is true', () => {
    render(<Checkbox checked aria-label="Test" onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox aria-label="Test" onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox disabled aria-label="Test" onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Checkbox disabled aria-label="Test" />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('sets aria-invalid when hasError is true', () => {
    render(<Checkbox hasError aria-label="Test" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('supports indeterminate state via ref', () => {
    // indeterminate is a DOM property, not an HTML attribute.
    // We test it by passing a ref callback.
    const ref = { current: null as HTMLInputElement | null };

    render(
      <Checkbox
        aria-label="Test"
        ref={(el) => {
          ref.current = el;
          if (el) el.indeterminate = true;
        }}
      />
    );

    expect(ref.current).not.toBeNull();
    expect(ref.current!.indeterminate).toBe(true);
  });

  it('has type="checkbox"', () => {
    render(<Checkbox aria-label="Test" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('type', 'checkbox');
  });
});
