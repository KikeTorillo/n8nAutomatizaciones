import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenericNavTabs } from '../organisms/GenericNavTabs';
import type { NavItem } from '../organisms/MobileNavSelector';

const testItems: NavItem[] = [
  { id: 'citas', label: 'Citas', path: '/citas' },
  { id: 'bloqueos', label: 'Bloqueos', path: '/bloqueos' },
  { id: 'vacaciones', label: 'Vacaciones', path: '/vacaciones' },
];

/**
 * Helper: returns the desktop tabs container (hidden md:flex).
 * Both desktop and mobile render the same labels, so we scope queries
 * to the desktop container to avoid duplicate-element errors.
 */
function getDesktopContainer(): HTMLElement {
  const nav = screen.getByRole('navigation');
  // The desktop div is the first child (hidden md:flex)
  return nav.querySelector('.md\\:flex') as HTMLElement;
}

describe('GenericNavTabs', () => {
  it('renders all items in controlled mode', () => {
    render(
      <GenericNavTabs
        items={testItems}
        activeItemId="citas"
        onItemSelect={vi.fn()}
      />
    );
    const desktop = getDesktopContainer();
    expect(within(desktop).getByText('Citas')).toBeInTheDocument();
    expect(within(desktop).getByText('Bloqueos')).toBeInTheDocument();
    expect(within(desktop).getByText('Vacaciones')).toBeInTheDocument();
  });

  it('highlights the active item by activeItemId', () => {
    render(
      <GenericNavTabs
        items={testItems}
        activeItemId="bloqueos"
        onItemSelect={vi.fn()}
      />
    );
    const desktop = getDesktopContainer();
    // The active tab gets primary-colored classes
    const bloqueosBtn = within(desktop)
      .getByText('Bloqueos')
      .closest('button')!;
    expect(bloqueosBtn.className).toMatch(/primary/);

    // Inactive tabs should not have primary styling
    const citasBtn = within(desktop).getByText('Citas').closest('button')!;
    expect(citasBtn.className).not.toMatch(/primary/);
  });

  it('calls onItemSelect when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onItemSelect = vi.fn();
    render(
      <GenericNavTabs
        items={testItems}
        activeItemId="citas"
        onItemSelect={onItemSelect}
      />
    );
    const desktop = getDesktopContainer();
    await user.click(within(desktop).getByText('Bloqueos'));
    expect(onItemSelect).toHaveBeenCalledOnce();
    expect(onItemSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'bloqueos', label: 'Bloqueos' })
    );
  });

  it('does not highlight any tab when activeItemId is undefined', () => {
    render(<GenericNavTabs items={testItems} onItemSelect={vi.fn()} />);
    const desktop = getDesktopContainer();
    // All buttons should have the inactive (non-primary) styling
    for (const item of testItems) {
      const btn = within(desktop).getByText(item.label).closest('button')!;
      expect(btn.className).not.toMatch(/primary/);
    }
  });

  it('renders nav element', () => {
    render(
      <GenericNavTabs
        items={testItems}
        activeItemId="citas"
        onItemSelect={vi.fn()}
      />
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('applies className prop', () => {
    render(
      <GenericNavTabs
        items={testItems}
        activeItemId="citas"
        onItemSelect={vi.fn()}
        className="extra-class"
      />
    );
    expect(screen.getByRole('navigation').className).toMatch(/extra-class/);
  });
});
