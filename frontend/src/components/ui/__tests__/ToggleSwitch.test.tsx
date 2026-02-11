import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleSwitch } from '../molecules/ToggleSwitch';

describe('ToggleSwitch', () => {
  it('renders with role="switch"', () => {
    render(<ToggleSwitch />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('renders in off state by default', () => {
    render(<ToggleSwitch />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('renders in on state when enabled', () => {
    render(<ToggleSwitch enabled />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with toggled value on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleSwitch enabled={false} onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleSwitch disabled onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders with aria-label when label is provided', () => {
    render(<ToggleSwitch label="Activar notificaciones" />);
    expect(screen.getByRole('switch')).toHaveAttribute(
      'aria-label',
      'Activar notificaciones'
    );
  });

  it('is disabled when isLoading is true', () => {
    render(<ToggleSwitch isLoading />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
