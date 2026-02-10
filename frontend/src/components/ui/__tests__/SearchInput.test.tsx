import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../molecules/SearchInput';

describe('SearchInput', () => {
  it('renders with default placeholder', () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchInput placeholder="Buscar productos..." />);
    expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
  });

  it('has role="search" on container', () => {
    render(<SearchInput />);
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} placeholder="Buscar" />);
    await user.type(screen.getByPlaceholderText('Buscar'), 'test');
    expect(onChange).toHaveBeenCalled();
  });

  it('calls onValueChange with new value when typing', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SearchInput onValueChange={onValueChange} placeholder="Buscar" />);
    await user.type(screen.getByPlaceholderText('Buscar'), 'a');
    expect(onValueChange).toHaveBeenCalledWith('a');
  });

  it('shows clear button when value exists', () => {
    render(<SearchInput value="test" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /limpiar/i })).toBeInTheDocument();
  });

  it('does not show clear button when value is empty', () => {
    render(<SearchInput value="" onChange={() => {}} />);
    expect(screen.queryByRole('button', { name: /limpiar/i })).not.toBeInTheDocument();
  });

  it('does not show clear button when disabled', () => {
    render(<SearchInput value="test" onChange={() => {}} disabled />);
    expect(screen.queryByRole('button', { name: /limpiar/i })).not.toBeInTheDocument();
  });

  it('calls onValueChange with empty string on clear', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SearchInput value="test" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: /limpiar/i }));
    expect(onValueChange).toHaveBeenCalledWith('');
  });

  it('is disabled when disabled prop is true', () => {
    render(<SearchInput disabled placeholder="Buscar" />);
    expect(screen.getByPlaceholderText('Buscar')).toBeDisabled();
  });
});
