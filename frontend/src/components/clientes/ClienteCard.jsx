import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Calendar, Edit } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Componente Card individual de cliente
 * Para vistas de cuadrícula o destacados
 */
function ClienteCard({ cliente }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {cliente.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {cliente.nombre}
            </h3>
            <span
              className={`
                inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full
                ${cliente.activo
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                }
              `}
            >
              {cliente.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {cliente.telefono && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            {cliente.telefono}
          </div>
        )}
        {cliente.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-4 h-4 mr-2 text-gray-400" />
            {cliente.email}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between py-3 border-t border-gray-200 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {cliente.total_citas || 0}
          </p>
          <p className="text-xs text-gray-600">Citas</p>
        </div>

        {cliente.ultima_cita && (
          <div className="text-center">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1 text-gray-400" />
              <span>Última cita</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
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
        >
          Ver Detalle
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/clientes/${cliente.id}/editar`)}
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default ClienteCard;
