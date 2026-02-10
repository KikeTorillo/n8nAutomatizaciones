import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from '../molecules/Tooltip';

describe('Tooltip', () => {
  it('renders children', () => {
    render(<Tooltip content="Help text"><button>Hover me</button></Tooltip>);
    expect(screen.getByRole('button', { name: /hover me/i })).toBeInTheDocument();
  });

  it('does not show tooltip by default', () => {
    render(<Tooltip content="Help text"><button>Hover me</button></Tooltip>);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on hover after delay', async () => {
    const user = userEvent.setup();
    render(<Tooltip content="Help text" delay={0}><button>Hover me</button></Tooltip>);
    await user.hover(screen.getByRole('button'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Help text');
  });

  it('hides tooltip on unhover', async () => {
    const user = userEvent.setup();
    render(<Tooltip content="Help text" delay={0}><button>Hover me</button></Tooltip>);
    await user.hover(screen.getByRole('button'));
    await screen.findByRole('tooltip');
    await user.unhover(screen.getByRole('button'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('sets aria-describedby on trigger when visible', async () => {
    const user = userEvent.setup();
    render(<Tooltip content="Help text" delay={0}><button>Hover me</button></Tooltip>);
    await user.hover(screen.getByRole('button'));
    const tooltip = await screen.findByRole('tooltip');
    const trigger = screen.getByRole('button').parentElement;
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
  });

  it('does not render tooltip when content is empty string', () => {
    render(<Tooltip content=""><button>No tooltip</button></Tooltip>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
