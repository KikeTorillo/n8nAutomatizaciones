import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, DollarSign, Heart } from 'lucide-react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useCliente } from '@/hooks/useClientes';
import { citasApi } from '@/services/api/endpoints';
import { useQuery } from '@tanstack/react-query';

/**
 * Página de detalle del cliente con historial de citas
 */
function ClienteDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Obtener datos del cliente
  const { data: cliente, isLoading: loadingCliente } = useCliente(id);

  // Obtener historial de citas del cliente
  const { data: citasData, isLoading: loadingCitas } = useQuery({
    queryKey: ['citas-cliente', id],
    queryFn: async () => {
      const response = await citasApi.listar({ cliente_id: id });
      return response.data.data.citas || [];
    },
    enabled: !!id,
  });

  if (loadingCliente) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Cliente no encontrado</p>
          <Button onClick={() => navigate('/clientes')} className="mt-4">
            Volver a Clientes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/clientes')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {cliente.foto_url ? (
                <img
                  src={cliente.foto_url}
                  alt={cliente.nombre}
                  className="flex-shrink-0 h-16 w-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                />
              ) : (
                <div className="flex-shrink-0 h-16 w-16 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-semibold text-2xl">
                    {cliente.nombre?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {cliente.nombre}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${cliente.activo
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }
                    `}
                  >
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  {cliente.marketing_permitido && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300">
                      Marketing permitido
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button onClick={() => navigate(`/clientes/${id}/editar`)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Información del Cliente */}
          <div className="lg:col-span-1 space-y-6">
            {/* Información de Contacto */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Información de Contacto
              </h3>

              <div className="space-y-3">
                {cliente.telefono && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Teléfono</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cliente.telefono}
                      </p>
                    </div>
                  </div>
                )}

                {cliente.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cliente.email}
                      </p>
                    </div>
                  </div>
                )}

                {cliente.direccion && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Dirección</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cliente.direccion}
                      </p>
                    </div>
                  </div>
                )}

                {cliente.fecha_nacimiento && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Fecha de Nacimiento</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(cliente.fecha_nacimiento).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Estadísticas
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total de Citas</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {cliente.total_citas || 0}
                  </span>
                </div>

                {cliente.valor_total_gastado && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Gastado</span>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">
                          ${cliente.valor_total_gastado.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {cliente.ultima_cita && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Última Cita</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(cliente.ultima_cita).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notas Médicas / Alergias */}
            {cliente.alergias && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Alergias / Notas Médicas
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {cliente.alergias}
                </p>
              </div>
            )}
          </div>

          {/* Columna Derecha: Historial de Citas */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Historial de Citas
              </h3>

              {loadingCitas ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : citasData && citasData.length > 0 ? (
                <div className="space-y-4">
                  {citasData.map((cita) => (
                    <div
                      key={cita.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => navigate(`/citas/${cita.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {cita.servicio_nombre || 'Servicio'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {cita.profesional_nombre || 'Profesional'}
                          </p>
                        </div>
                        <span
                          className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${cita.estado === 'completada'
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                              : cita.estado === 'confirmada'
                              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300'
                              : cita.estado === 'cancelada'
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }
                          `}
                        >
                          {cita.estado}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(cita.fecha_cita).toLocaleDateString('es-ES')}
                        </div>
                        {cita.hora_inicio && (
                          <span>{cita.hora_inicio}</span>
                        )}
                        {cita.precio && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${cita.precio.toLocaleString()}
                          </div>
                        )}
                      </div>

                      {cita.notas && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {cita.notas}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Este cliente aún no tiene citas registradas
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/citas', { state: { abrirModal: true, clienteId: id } })}
                    className="mt-4"
                  >
                    Agendar Primera Cita
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClienteDetailPage;
