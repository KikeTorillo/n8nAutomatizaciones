import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from '../atoms/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('adds role="button" when onClick is provided', () => {
    render(<Card onClick={() => {}}>Clickable</Card>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not add role="button" when not clickable', () => {
    render(<Card>Static</Card>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onClick on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Click</Card>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onClick on Enter key', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Card</Card>);
    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onClick on Space key', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Card</Card>);
    screen.getByRole('button').focus();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('has tabIndex=0 when clickable', () => {
    render(<Card onClick={() => {}}>Card</Card>);
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
  });

  it('does not have tabIndex when not clickable', () => {
    render(<Card>Card</Card>);
    expect(screen.getByText('Card')).not.toHaveAttribute('tabindex');
  });

  it('renders as different HTML element with "as" prop', () => {
    render(<Card as="article">Content</Card>);
    expect(screen.getByText('Content').tagName).toBe('ARTICLE');
  });
});
