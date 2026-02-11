import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../organisms/Pagination';
import type { PaginationInfo } from '../types';

function makePagination(
  overrides: Partial<PaginationInfo> = {}
): PaginationInfo {
  return {
    page: 1,
    limit: 10,
    total: 50,
    totalPages: 5,
    hasNext: true,
    hasPrev: false,
    ...overrides,
  };
}

describe('Pagination', () => {
  it('renders page info text', () => {
    render(<Pagination pagination={makePagination()} onPageChange={vi.fn()} />);
    expect(screen.getByText(/mostrando/i)).toBeInTheDocument();
    expect(screen.getByText('1-10')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders page number buttons', () => {
    render(<Pagination pagination={makePagination()} onPageChange={vi.fn()} />);
    // Pages 1-5 should be visible
    for (let i = 1; i <= 5; i++) {
      expect(
        screen.getByRole('button', { name: `Ir a página ${i}` })
      ).toBeInTheDocument();
    }
  });

  it('marks current page with aria-current="page"', () => {
    render(
      <Pagination
        pagination={makePagination({ page: 3, hasPrev: true })}
        onPageChange={vi.fn()}
      />
    );
    const currentBtn = screen.getByRole('button', { name: 'Ir a página 3' });
    expect(currentBtn).toHaveAttribute('aria-current', 'page');

    // Other pages should NOT have aria-current
    const otherBtn = screen.getByRole('button', { name: 'Ir a página 1' });
    expect(otherBtn).not.toHaveAttribute('aria-current');
  });

  it('calls onPageChange with correct page on click', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination pagination={makePagination()} onPageChange={onPageChange} />
    );
    await user.click(screen.getByRole('button', { name: 'Ir a página 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination
        pagination={makePagination({ page: 1, hasPrev: false })}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination
        pagination={makePagination({
          page: 5,
          totalPages: 5,
          hasNext: false,
          hasPrev: true,
        })}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled();
  });

  it('enables previous button when not on first page', () => {
    render(
      <Pagination
        pagination={makePagination({ page: 3, hasPrev: true })}
        onPageChange={vi.fn()}
      />
    );
    expect(
      screen.getByRole('button', { name: /anterior/i })
    ).not.toBeDisabled();
  });

  it('calls onPageChange with page-1 when clicking previous', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination
        pagination={makePagination({ page: 3, hasPrev: true })}
        onPageChange={onPageChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /anterior/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with page+1 when clicking next', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination
        pagination={makePagination({ page: 2, hasPrev: true, hasNext: true })}
        onPageChange={onPageChange}
      />
    );
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('returns null when only 1 page and showInfo is false', () => {
    const { container } = render(
      <Pagination
        pagination={makePagination({
          page: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
          total: 5,
        })}
        onPageChange={vi.fn()}
        showInfo={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows info text with role="status" and aria-live="polite"', () => {
    render(<Pagination pagination={makePagination()} onPageChange={vi.fn()} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});
