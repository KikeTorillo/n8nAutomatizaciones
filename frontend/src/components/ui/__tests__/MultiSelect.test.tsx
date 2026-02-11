import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect, type MultiSelectOption } from '../organisms/MultiSelect';

const options: MultiSelectOption[] = [
  { value: 'a', label: 'Opcion A' },
  { value: 'b', label: 'Opcion B' },
  { value: 'c', label: 'Opcion C' },
];

describe('MultiSelect', () => {
  it('renders with placeholder when no value selected', () => {
    render(<MultiSelect options={options} placeholder="Selecciona" />);
    expect(screen.getByText('Selecciona')).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('renders options with role="option"', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} />);
    await user.click(screen.getByRole('combobox'));
    const opts = screen.getAllByRole('option');
    expect(opts).toHaveLength(3);
  });

  it('calls onChange with selected value on option click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={options} value={[]} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Opcion A'));
    expect(onChange).toHaveBeenCalledWith(['a']);
  });

  it('renders selected options as badges', () => {
    render(<MultiSelect options={options} value={['a', 'b']} />);
    expect(screen.getByText('Opcion A')).toBeInTheDocument();
    expect(screen.getByText('Opcion B')).toBeInTheDocument();
  });

  it('removes selected option when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelect options={options} value={['a', 'b']} onChange={onChange} />
    );
    // Each badge has a remove button with X icon
    const removeButtons = screen.getAllByRole('button');
    await user.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(['b']);
  });

  it('shows error message when error prop is provided', () => {
    render(<MultiSelect options={options} error="Campo requerido" />);
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });

  it('sets aria-selected on selected options', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} value={['a']} />);
    await user.click(screen.getByRole('combobox'));
    const opts = screen.getAllByRole('option');
    expect(opts[0]).toHaveAttribute('aria-selected', 'true');
    expect(opts[1]).toHaveAttribute('aria-selected', 'false');
  });
});
