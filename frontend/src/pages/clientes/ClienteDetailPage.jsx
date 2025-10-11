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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cliente no encontrado</p>
          <Button onClick={() => navigate('/clientes')} className="mt-4">
            Volver a Clientes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
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
              <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-2xl">
                  {cliente.nombre?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {cliente.nombre}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${cliente.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }
                    `}
                  >
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  {cliente.marketing_permitido && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información de Contacto
              </h3>

              <div className="space-y-3">
                {cliente.telefono && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="text-sm font-medium text-gray-900">
                        {cliente.telefono}
                      </p>
                    </div>
                  </div>
                )}

                {cliente.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-sm font-medium text-gray-900">
                        {cliente.email}
                      </p>
                    </div>
                  </div>
                )}

                {cliente.direccion && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Dirección</p>
                      <p className="text-sm font-medium text-gray-900">
                        {cliente.direccion}
                      </p>
                    </div>
                  </div>
                )}

                {cliente.fecha_nacimiento && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(cliente.fecha_nacimiento).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estadísticas
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total de Citas</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {cliente.total_citas || 0}
                  </span>
                </div>

                {cliente.valor_total_gastado && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Gastado</span>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-xl font-bold text-green-600">
                          ${cliente.valor_total_gastado.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {cliente.ultima_cita && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Última Cita</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(cliente.ultima_cita).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notas Médicas / Alergias */}
            {cliente.alergias && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Alergias / Notas Médicas
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {cliente.alergias}
                </p>
              </div>
            )}
          </div>

          {/* Columna Derecha: Historial de Citas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/citas/${cita.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {cita.servicio_nombre || 'Servicio'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {cita.profesional_nombre || 'Profesional'}
                          </p>
                        </div>
                        <span
                          className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${cita.estado === 'completada'
                              ? 'bg-green-100 text-green-800'
                              : cita.estado === 'confirmada'
                              ? 'bg-blue-100 text-blue-800'
                              : cita.estado === 'cancelada'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                            }
                          `}
                        >
                          {cita.estado}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
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
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {cita.notas}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">
                    Este cliente aún no tiene citas registradas
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/citas/nueva', { state: { clienteId: id } })}
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
