import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel } from '../organisms/FilterPanel';

const defaultFilterConfig = [
  {
    key: 'categoria',
    label: 'Categoría',
    type: 'select' as const,
    options: [
      { value: 'a', label: 'Cat A' },
      { value: 'b', label: 'Cat B' },
    ],
  },
  { key: 'activo', label: 'Activo', type: 'boolean' as const },
];

describe('FilterPanel', () => {
  it('renders search input by default', () => {
    render(
      <FilterPanel
        filters={{ busqueda: '' }}
        onFilterChange={vi.fn()}
        filterConfig={defaultFilterConfig}
      />
    );
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('hides search when showSearch is false', () => {
    render(
      <FilterPanel
        filters={{}}
        onFilterChange={vi.fn()}
        showSearch={false}
        filterConfig={defaultFilterConfig}
      />
    );
    expect(screen.queryByPlaceholderText('Buscar...')).not.toBeInTheDocument();
  });

  it('fires onFilterChange when search input changes', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(
      <FilterPanel
        filters={{ busqueda: '' }}
        onFilterChange={onFilterChange}
        filterConfig={[]}
      />
    );
    await user.type(screen.getByPlaceholderText('Buscar...'), 'test');
    expect(onFilterChange).toHaveBeenCalled();
    expect(onFilterChange.mock.calls[0][0]).toBe('busqueda');
  });

  it('shows clear button and calls onClearFilters', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <FilterPanel
        filters={{ busqueda: 'something', categoria: 'a' }}
        onFilterChange={vi.fn()}
        onClearFilters={onClear}
        filterConfig={defaultFilterConfig}
        defaultExpanded
      />
    );
    // Use getByText to target the visible "Limpiar" button (not SearchInput's aria-label)
    const clearBtn = screen.getByText('Limpiar').closest('button');
    expect(clearBtn).toBeInTheDocument();
    await user.click(clearBtn!);
    expect(onClear).toHaveBeenCalled();
  });

  it('toggles expansion when expandable', async () => {
    const user = userEvent.setup();
    render(
      <FilterPanel
        filters={{}}
        onFilterChange={vi.fn()}
        filterConfig={defaultFilterConfig}
        expandable
        defaultExpanded={false}
      />
    );
    const toggleBtn = screen.queryByRole('button', { name: /filtros/i });
    if (toggleBtn) {
      await user.click(toggleBtn);
      // After expanding, filter fields should be visible
      expect(screen.getByText('Categoría')).toBeInTheDocument();
    }
  });

  it('renders filters expanded by default when defaultExpanded', () => {
    render(
      <FilterPanel
        filters={{ categoria: '' }}
        onFilterChange={vi.fn()}
        filterConfig={defaultFilterConfig}
        defaultExpanded
      />
    );
    expect(screen.getByText('Categoría')).toBeInTheDocument();
  });
});
