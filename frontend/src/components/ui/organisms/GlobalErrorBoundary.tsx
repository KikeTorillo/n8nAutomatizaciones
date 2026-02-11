import React, { type ReactNode, type ErrorInfo } from 'react';
import {
  AlertCircle,
  RefreshCw,
  Home,
  Bug,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../atoms/Button';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(
    error: Error
  ): Partial<GlobalErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    console.error('[GlobalErrorBoundary] Error no capturado:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/home';
  };

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center max-w-lg w-full">
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Algo salió mal
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ocurrió un error inesperado en la aplicación. Puedes intentar
              recargar la página o volver al inicio.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Button onClick={this.handleRetry} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>

              <Button
                variant="outline"
                onClick={this.handleReload}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recargar página
              </Button>

              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto"
              >
                <Home className="h-4 w-4 mr-2" />
                Ir al inicio
              </Button>
            </div>

            {(import.meta.env.DEV || error) && (
              <div className="text-left">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-2"
                >
                  <Bug className="h-4 w-4" />
                  <span>Detalles técnicos</span>
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showDetails && (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-left overflow-auto max-h-64">
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Error:
                      </h4>
                      <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                        {error?.message || 'Error desconocido'}
                      </pre>
                    </div>

                    {import.meta.env.DEV && error?.stack && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Stack trace:
                        </h4>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </div>
                    )}

                    {import.meta.env.DEV && errorInfo?.componentStack && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Component stack:
                        </h4>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
              Si el problema persiste, contacta a soporte técnico.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
