/**
 * ChunkErrorBoundary - Error Boundary para errores de carga de chunks dinámicos
 * BUG-003 FIX: Captura errores de lazy loading y ofrece opción de reintentar
 * Fase de Corrección de Bugs - Enero 2026
 */
import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui';

class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error) {
    // Detectar si es error de chunk/módulo dinámico
    const isChunkError =
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Loading CSS chunk') ||
      error.message?.includes('Unable to preload CSS') ||
      error.name === 'ChunkLoadError';

    if (isChunkError) {
      return {
        hasError: true,
        errorMessage: error.message,
      };
    }

    // Re-lanzar otros errores para que los maneje otro Error Boundary
    throw error;
  }

  componentDidCatch(error, errorInfo) {
    // Log para debugging
    console.error('[ChunkErrorBoundary] Error de carga de módulo:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    const newErrorCount = this.state.errorCount + 1;

    if (newErrorCount < 3) {
      // Reintentar cargando el componente de nuevo
      this.setState({
        hasError: false,
        errorCount: newErrorCount,
      });
    } else {
      // Después de 3 intentos, forzar recarga completa
      // Limpiar cache del service worker si existe
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });
        });
      }
      // Recarga forzada (ignorar cache)
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center max-w-md">
            {/* Icono de error */}
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Error al cargar la página
            </h2>

            {/* Descripción */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No pudimos cargar algunos recursos necesarios.
              Esto puede ser un problema de conexión temporal.
            </p>

            {/* Contador de intentos */}
            {this.state.errorCount > 0 && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-4">
                Intento {this.state.errorCount} de 3
              </p>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={this.handleRetry}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {this.state.errorCount >= 2 ? 'Recargar página' : 'Reintentar'}
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

            {/* Info técnica (solo en desarrollo) */}
            {import.meta.env.DEV && this.state.errorMessage && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Detalles técnicos
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
                  {this.state.errorMessage}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
