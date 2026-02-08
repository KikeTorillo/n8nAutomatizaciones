/**
 * ====================================================================
 * BLOCK ERROR BOUNDARY
 * ====================================================================
 * Error boundary para bloques individuales.
 * Evita que un bloque roto tire toda la página pública.
 */

import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class BlockErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[BlockErrorBoundary] Error en bloque ${this.props.bloqueId || 'desconocido'}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.silent) return null;

      return (
        <div className="py-8 px-4 text-center text-gray-400">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Este bloque no se pudo mostrar</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default BlockErrorBoundary;
