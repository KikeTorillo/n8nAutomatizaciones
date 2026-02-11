import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, type DataTableColumn } from '../organisms/DataTable';

interface TestRow {
  id: number;
  name: string;
  email: string;
}

const columns: DataTableColumn<TestRow>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'email', header: 'Email' },
];

const data: TestRow[] = [
  { id: 1, name: 'Alice', email: 'alice@test.com' },
  { id: 2, name: 'Bob', email: 'bob@test.com' },
  { id: 3, name: 'Carol', email: 'carol@test.com' },
];

describe('DataTable', () => {
  it('renders column headers and row data', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(
      screen.getByRole('columnheader', { name: /nombre/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /email/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('bob@test.com')).toBeInTheDocument();
  });

  it('renders empty state when data is empty', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No hay datos')).toBeInTheDocument();
  });

  it('renders custom empty state title', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyState={{ title: 'Sin resultados' }}
      />
    );
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('calls onRowClick when a row is clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
    await user.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('makes rows focusable and clickable when onRowClick is provided', () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
    const rows = screen.getAllByRole('button');
    expect(rows.length).toBe(3);
    expect(rows[0]).toHaveAttribute('tabIndex', '0');
  });

  it('activates row with Enter key', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
    const rows = screen.getAllByRole('button');
    rows[0].focus();
    await user.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('activates row with Space key', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
    const rows = screen.getAllByRole('button');
    rows[1].focus();
    await user.keyboard(' ');
    expect(onRowClick).toHaveBeenCalledWith(data[1]);
  });

  it('has aria-live="polite" on container when data is present', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(
      screen.getByRole('table').closest('[aria-live="polite"]')
    ).toBeInTheDocument();
  });

  it('renders with custom render function in column', () => {
    const customColumns: DataTableColumn<TestRow>[] = [
      {
        key: 'name',
        header: 'Nombre',
        render: (row) => <strong>{row.name}</strong>,
      },
    ];
    render(<DataTable columns={customColumns} data={data} />);
    expect(screen.getByText('Alice').tagName).toBe('STRONG');
  });

  it('does not set tabIndex on rows when onRowClick is absent', () => {
    render(<DataTable columns={columns} data={data} />);
    const rows = screen.getAllByRole('row');
    // Body rows should not be focusable (header row is first)
    const bodyRows = rows.slice(1);
    bodyRows.forEach((row) => {
      expect(row).not.toHaveAttribute('tabIndex');
    });
  });
});
