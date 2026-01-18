/**
 * GlobalErrorBoundary - Error Boundary global para la aplicación
 * Captura errores no manejados de React y ofrece opciones de recuperación
 * Fase de Mejoras Frontend - Enero 2026
 */
import React from 'react';
import { AlertCircle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    // Marcar que ocurrió un error para mostrar UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Guardar información del error para debugging
    this.setState({ errorInfo });

    // Log del error
    console.error('[GlobalErrorBoundary] Error no capturado:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // En producción, aquí se podría enviar a un servicio de monitoreo
    // Por ejemplo: Sentry, LogRocket, etc.
    if (import.meta.env.PROD) {
      // TODO: Integrar con servicio de monitoreo de errores
      // errorMonitoringService.captureException(error, { extra: errorInfo });
    }
  }

  handleReload = () => {
    // Limpiar estado y recargar la página
    window.location.reload();
  };

  handleGoHome = () => {
    // Navegar al inicio (sin usar React Router para evitar posibles errores)
    window.location.href = '/';
  };

  handleRetry = () => {
    // Reintentar renderizar el componente
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center max-w-lg w-full">
            {/* Icono de error */}
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Algo salió mal
            </h1>

            {/* Descripción */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ocurrió un error inesperado en la aplicación.
              Puedes intentar recargar la página o volver al inicio.
            </p>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Button
                onClick={this.handleRetry}
                className="w-full sm:w-auto"
              >
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

            {/* Detalles del error (solo en desarrollo o si el usuario lo solicita) */}
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

            {/* Mensaje de ayuda */}
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
