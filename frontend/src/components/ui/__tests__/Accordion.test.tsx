import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, type AccordionItem } from '../organisms/Accordion';

const items: AccordionItem[] = [
  { id: 'item-1', title: 'Primera sección', content: <p>Contenido 1</p> },
  { id: 'item-2', title: 'Segunda sección', content: <p>Contenido 2</p> },
  { id: 'item-3', title: 'Tercera sección', content: <p>Contenido 3</p> },
];

describe('Accordion', () => {
  it('renders all item titles', () => {
    render(<Accordion items={items} />);
    expect(screen.getByText('Primera sección')).toBeInTheDocument();
    expect(screen.getByText('Segunda sección')).toBeInTheDocument();
    expect(screen.getByText('Tercera sección')).toBeInTheDocument();
  });

  it('does not show any content by default', () => {
    render(<Accordion items={items} />);
    expect(screen.queryByText('Contenido 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Contenido 2')).not.toBeInTheDocument();
  });

  it('expands content when item is clicked', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    await user.click(screen.getByText('Primera sección'));
    expect(screen.getByText('Contenido 1')).toBeInTheDocument();
  });

  it('collapses content when clicked again', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    await user.click(screen.getByText('Primera sección'));
    expect(screen.getByText('Contenido 1')).toBeInTheDocument();
    await user.click(screen.getByText('Primera sección'));
    expect(screen.queryByText('Contenido 1')).not.toBeInTheDocument();
  });

  it('sets aria-expanded to true on open item', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    const trigger = screen.getByText('Primera sección').closest('button')!;
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('sets aria-controls matching content id', () => {
    render(<Accordion items={items} defaultOpenIds={['item-1']} />);
    const trigger = screen.getByText('Primera sección').closest('button')!;
    expect(trigger).toHaveAttribute(
      'aria-controls',
      'accordion-content-item-1'
    );
    const content = document.getElementById('accordion-content-item-1');
    expect(content).toBeInTheDocument();
  });

  it('content region has aria-labelledby pointing to trigger', () => {
    render(<Accordion items={items} defaultOpenIds={['item-1']} />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute(
      'aria-labelledby',
      'accordion-trigger-item-1'
    );
  });

  it('only allows one item open in single mode', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} type="single" />);
    await user.click(screen.getByText('Primera sección'));
    expect(screen.getByText('Contenido 1')).toBeInTheDocument();
    await user.click(screen.getByText('Segunda sección'));
    expect(screen.queryByText('Contenido 1')).not.toBeInTheDocument();
    expect(screen.getByText('Contenido 2')).toBeInTheDocument();
  });

  it('allows multiple items open in multiple mode', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} type="multiple" />);
    await user.click(screen.getByText('Primera sección'));
    await user.click(screen.getByText('Segunda sección'));
    expect(screen.getByText('Contenido 1')).toBeInTheDocument();
    expect(screen.getByText('Contenido 2')).toBeInTheDocument();
  });

  it('respects defaultOpenIds prop', () => {
    render(<Accordion items={items} defaultOpenIds={['item-2']} />);
    expect(screen.queryByText('Contenido 1')).not.toBeInTheDocument();
    expect(screen.getByText('Contenido 2')).toBeInTheDocument();
  });

  it('does not toggle disabled items', async () => {
    const user = userEvent.setup();
    const disabledItems: AccordionItem[] = [
      {
        id: 'disabled-1',
        title: 'Disabled item',
        content: <p>Hidden</p>,
        disabled: true,
      },
    ];
    render(<Accordion items={disabledItems} />);
    await user.click(screen.getByText('Disabled item'));
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });
});
