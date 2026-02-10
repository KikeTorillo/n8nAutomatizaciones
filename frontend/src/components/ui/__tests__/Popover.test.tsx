import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover } from '../molecules/Popover';

describe('Popover', () => {
  it('renders trigger element', () => {
    render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
      />
    );
    expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();
  });

  it('does not show content by default', () => {
    render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Popover content</div>}
      />
    );
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });

  it('shows content on trigger click', async () => {
    const user = userEvent.setup();
    render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Popover content</div>}
      />
    );
    await user.click(screen.getByRole('button', { name: /open/i }));
    expect(await screen.findByText('Popover content')).toBeInTheDocument();
  });

  it('renders content with role="dialog" and aria-modal', async () => {
    const user = userEvent.setup();
    render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Dialog content</div>}
      />
    );
    await user.click(screen.getByRole('button', { name: /open/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('sets aria-haspopup and aria-expanded on trigger wrapper', () => {
    render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
      />
    );
    const triggerWrapper = screen.getByRole('button', { name: /open/i }).parentElement;
    expect(triggerWrapper).toHaveAttribute('aria-haspopup', 'dialog');
    expect(triggerWrapper).toHaveAttribute('aria-expanded', 'false');
  });

  it('updates aria-expanded when open', async () => {
    const user = userEvent.setup();
    render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Content</div>}
      />
    );
    const triggerWrapper = screen.getByRole('button', { name: /open/i }).parentElement!;
    expect(triggerWrapper).toHaveAttribute('aria-expanded', 'false');
    await user.click(screen.getByRole('button', { name: /open/i }));
    expect(triggerWrapper).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on second trigger click (toggle)', async () => {
    const user = userEvent.setup();
    render(
      <Popover
        trigger={<button>Open</button>}
        content={<div>Popover content</div>}
      />
    );
    const trigger = screen.getByRole('button', { name: /open/i });
    await user.click(trigger);
    expect(screen.getByText('Popover content')).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
  });
});
