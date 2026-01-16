import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Calendar, Edit } from 'lucide-react';
import { Button } from '@/components/ui';
import EtiquetasBadges from './EtiquetasBadges';

/**
 * Componente Card individual de cliente
 * Para vistas de cuadrícula o destacados
 */
function ClienteCard({ cliente }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {cliente.foto_url ? (
            <img
              src={cliente.foto_url}
              alt={cliente.nombre}
              className="flex-shrink-0 h-12 w-12 rounded-full object-cover border border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="flex-shrink-0 h-12 w-12 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                {cliente.nombre?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {cliente.nombre}
            </h3>
            <span
              className={`
                inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full
                ${cliente.activo
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }
              `}
            >
              {cliente.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Etiquetas (Fase 2 - Ene 2026) */}
      {cliente.etiquetas && cliente.etiquetas.length > 0 && (
        <div className="mb-4">
          <EtiquetasBadges etiquetas={cliente.etiquetas} size="sm" maxVisible={3} />
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {cliente.telefono && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
            {cliente.telefono}
          </div>
        )}
        {cliente.email && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
            {cliente.email}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {cliente.total_citas || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Citas</p>
        </div>

        {cliente.ultima_cita && (
          <div className="text-center">
            <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
              <span>Última cita</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Date(cliente.ultima_cita).toLocaleDateString('es-ES')}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/clientes/${cliente.id}`)}
          aria-label={`Ver detalle de ${cliente.nombre}`}
        >
          Ver Detalle
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/clientes/${cliente.id}/editar`)}
          aria-label={`Editar cliente ${cliente.nombre}`}
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default ClienteCard;
