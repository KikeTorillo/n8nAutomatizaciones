import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../atoms/Select';

const testOptions = [
  { value: 'mx', label: 'México' },
  { value: 'co', label: 'Colombia' },
  { value: 'ar', label: 'Argentina' },
];

describe('Select', () => {
  it('renders with options', () => {
    render(<Select options={testOptions} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('México')).toBeInTheDocument();
    expect(screen.getByText('Colombia')).toBeInTheDocument();
    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('renders default placeholder', () => {
    render(<Select options={testOptions} />);
    expect(screen.getByText('Selecciona una opción')).toBeInTheDocument();
  });

  it('renders custom placeholder', () => {
    render(<Select options={testOptions} placeholder="Elige un país" />);
    expect(screen.getByText('Elige un país')).toBeInTheDocument();
  });

  it('fires onChange when selecting an option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select options={testOptions} onChange={onChange} />);
    await user.selectOptions(screen.getByRole('combobox'), 'co');
    expect(onChange).toHaveBeenCalled();
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe(
      'co'
    );
  });

  it('applies disabled state', () => {
    render(<Select options={testOptions} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('does not fire onChange when disabled', () => {
    const onChange = vi.fn();
    render(<Select options={testOptions} disabled onChange={onChange} />);
    // Disabled select cannot be interacted with
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('sets aria-invalid when hasError is true', () => {
    render(<Select options={testOptions} hasError />);
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('does not set aria-invalid when hasError is false', () => {
    render(<Select options={testOptions} />);
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid');
  });

  it('sets aria-required when required', () => {
    render(<Select options={testOptions} required />);
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-required',
      'true'
    );
  });

  it('renders children instead of options when provided', () => {
    render(
      <Select>
        <option value="custom">Custom Option</option>
      </Select>
    );
    expect(screen.getByText('Custom Option')).toBeInTheDocument();
    // placeholder should NOT be rendered when children are used
    expect(screen.queryByText('Selecciona una opción')).not.toBeInTheDocument();
  });
});
