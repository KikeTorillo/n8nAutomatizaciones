import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '../molecules/Alert';

describe('Alert', () => {
  it('renders with default info variant', () => {
    render(<Alert title="Información">Contenido de alerta</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Información')).toBeInTheDocument();
    expect(screen.getByText('Contenido de alerta')).toBeInTheDocument();
  });

  it('renders info variant with aria-live="polite"', () => {
    render(
      <Alert variant="info" title="Info">
        Info text
      </Alert>
    );
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders success variant with aria-live="polite"', () => {
    render(
      <Alert variant="success" title="OK">
        Success text
      </Alert>
    );
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders warning variant with aria-live="polite"', () => {
    render(
      <Alert variant="warning" title="Cuidado">
        Warning text
      </Alert>
    );
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });

  it('renders error variant with aria-live="assertive"', () => {
    render(
      <Alert variant="error" title="Error">
        Error text
      </Alert>
    );
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders danger variant with aria-live="assertive"', () => {
    render(
      <Alert variant="danger" title="Peligro">
        Danger text
      </Alert>
    );
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders neutral/rose variant without error', () => {
    const { rerender } = render(
      <Alert variant="rose" title="Rosa">
        Rose text
      </Alert>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(
      <Alert variant="info" title="Info">
        Info text
      </Alert>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows dismiss button when dismissible and onDismiss provided', () => {
    const onDismiss = vi.fn();
    render(
      <Alert title="Cerrable" dismissible onDismiss={onDismiss}>
        Contenido
      </Alert>
    );
    expect(
      screen.getByRole('button', { name: /cerrar alerta/i })
    ).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Alert title="Cerrable" dismissible onDismiss={onDismiss}>
        Contenido
      </Alert>
    );
    await user.click(screen.getByRole('button', { name: /cerrar alerta/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('does not show dismiss button when dismissible is false', () => {
    render(
      <Alert title="No cerrable" dismissible={false}>
        Contenido
      </Alert>
    );
    expect(
      screen.queryByRole('button', { name: /cerrar alerta/i })
    ).not.toBeInTheDocument();
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    render(
      <Alert title="Sin callback" dismissible>
        Contenido
      </Alert>
    );
    expect(
      screen.queryByRole('button', { name: /cerrar alerta/i })
    ).not.toBeInTheDocument();
  });

  it('renders action slot when provided', () => {
    render(
      <Alert title="Con acción" action={<button>Reintentar</button>}>
        Algo falló
      </Alert>
    );
    expect(
      screen.getByRole('button', { name: /reintentar/i })
    ).toBeInTheDocument();
  });

  it('renders children without title', () => {
    render(<Alert>Solo contenido</Alert>);
    expect(screen.getByText('Solo contenido')).toBeInTheDocument();
  });
});
