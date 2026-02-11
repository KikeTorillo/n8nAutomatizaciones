import { render, screen } from '@testing-library/react';
import { FormGroup } from '../molecules/FormGroup';

describe('FormGroup', () => {
  it('renders label text', () => {
    render(
      <FormGroup label="Email">
        <input />
      </FormGroup>
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <FormGroup label="Nombre">
        <input data-testid="child-input" />
      </FormGroup>
    );
    expect(screen.getByTestId('child-input')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(
      <FormGroup label="Email" error="Campo requerido">
        <input />
      </FormGroup>
    );
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
  });

  it('shows helper text when no error', () => {
    render(
      <FormGroup label="Email" helper="Ingresa tu correo">
        <input />
      </FormGroup>
    );
    expect(screen.getByText('Ingresa tu correo')).toBeInTheDocument();
  });

  it('hides helper text when error is present', () => {
    render(
      <FormGroup label="Email" helper="Ingresa tu correo" error="Invalido">
        <input />
      </FormGroup>
    );
    expect(screen.queryByText('Ingresa tu correo')).not.toBeInTheDocument();
    expect(screen.getByText('Invalido')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(
      <FormGroup label="Email" required>
        <input />
      </FormGroup>
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(
      <FormGroup>
        <input data-testid="solo-input" />
      </FormGroup>
    );
    expect(screen.getByTestId('solo-input')).toBeInTheDocument();
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
  });
});
