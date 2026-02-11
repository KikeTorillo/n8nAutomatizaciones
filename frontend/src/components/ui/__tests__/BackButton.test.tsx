import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackButton } from '../molecules/BackButton';
import { UILibraryProvider } from '../providers';

describe('BackButton', () => {
  it('renders with default label "Volver"', () => {
    render(<BackButton onClick={() => {}} />);
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
    expect(screen.getByText('Volver')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<BackButton label="Regresar" onClick={() => {}} />);
    expect(
      screen.getByRole('button', { name: /regresar/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Regresar')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<BackButton onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: /volver/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders in iconOnly mode without visible text', () => {
    render(<BackButton iconOnly onClick={() => {}} />);
    const button = screen.getByRole('button', { name: /volver/i });
    expect(button).toBeInTheDocument();
    // In iconOnly mode, the label text is not rendered, only aria-label
    expect(screen.queryByText('Volver')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Volver');
  });

  it('renders in iconOnly mode with custom label as aria-label', () => {
    render(<BackButton iconOnly label="Atrás" onClick={() => {}} />);
    const button = screen.getByRole('button', { name: /atrás/i });
    expect(button).toHaveAttribute('aria-label', 'Atrás');
  });

  it('uses onNavigate prop when onClick is not provided', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<BackButton onNavigate={onNavigate} />);
    await user.click(screen.getByRole('button', { name: /volver/i }));
    expect(onNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to specific path via onNavigate', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<BackButton to="/dashboard" onNavigate={onNavigate} />);
    await user.click(screen.getByRole('button', { name: /volver/i }));
    expect(onNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('uses provider navigate when no onClick or onNavigate', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(
      <UILibraryProvider navigate={navigate} currentPath="/test">
        <BackButton />
      </UILibraryProvider>
    );
    await user.click(screen.getByRole('button', { name: /volver/i }));
    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it('logs console.warn when no navigate function available', async () => {
    const user = userEvent.setup();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<BackButton />);
    await user.click(screen.getByRole('button', { name: /volver/i }));
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[BackButton]')
    );
    warnSpy.mockRestore();
  });

  it('prioritizes onClick over onNavigate', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onNavigate = vi.fn();
    render(<BackButton onClick={onClick} onNavigate={onNavigate} />);
    await user.click(screen.getByRole('button', { name: /volver/i }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
