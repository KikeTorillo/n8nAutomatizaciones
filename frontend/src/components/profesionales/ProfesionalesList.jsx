import {
  Users,
  User,
  Edit,
  Trash2,
  Clock,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ProfesionalStatsCard from './ProfesionalStatsCard';

/**
 * Componente de lista de profesionales con cards responsivos
 * Muestra información detallada y acciones por profesional
 */
function ProfesionalesList({
  profesionales,
  isLoading,
  onEdit,
  onDelete,
  onGestionarHorarios,
  onGestionarServicios,
}) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cargando profesionales...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!profesionales || profesionales.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No se encontraron profesionales
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Intenta ajustar los filtros o la búsqueda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con contador */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {profesionales.length}
          </span>{' '}
          profesional(es) encontrado(s)
        </p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {profesionales.map((profesional) => (
          <div
            key={profesional.id}
            id={`profesional-${profesional.id}`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
          >
            {/* Header del Card con Avatar */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4">
                {/* Avatar con foto o iniciales */}
                {profesional.foto_url ? (
                  <img
                    src={profesional.foto_url}
                    alt={profesional.nombre_completo}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2"
                    style={{ borderColor: profesional.color_calendario || '#753572' }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                    style={{
                      backgroundColor: profesional.color_calendario || '#753572',
                    }}
                  >
                    {profesional.nombre_completo?.split(' ')[0]?.charAt(0)}
                    {profesional.nombre_completo?.split(' ')[1]?.charAt(0) || ''}
                  </div>
                )}

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {profesional.nombre_completo || 'Sin nombre'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {profesional.puesto_nombre || profesional.departamento_nombre || 'Sin puesto asignado'}
                  </p>

                  {/* Badge de estado */}
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        profesional.activo
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {profesional.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="p-6 space-y-3">
              {profesional.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {profesional.email}
                  </span>
                </div>
              )}

              {profesional.telefono && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">{profesional.telefono}</span>
                </div>
              )}

              {profesional.biografia && (
                <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                  {profesional.biografia}
                </div>
              )}
            </div>

            {/* Estadísticas */}
            <div className="px-6 pb-6">
              <ProfesionalStatsCard profesional={profesional} />
            </div>

            {/* Acciones */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-2">
                {/* Editar */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(profesional)}
                  className="w-full"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>

                {/* Eliminar */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(profesional)}
                  className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Eliminar
                </Button>

                {/* Horarios */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGestionarHorarios(profesional)}
                  className="w-full"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Horarios
                </Button>

                {/* Servicios */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGestionarServicios(profesional)}
                  className="w-full"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Servicios
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfesionalesList;
