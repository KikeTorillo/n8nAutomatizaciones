/**
 * ====================================================================
 * CLIENTE GENERAL TAB - INFORMACIÓN BÁSICA Y SMART BUTTONS
 * ====================================================================
 *
 * Fase 4C - Vista con Tabs (Ene 2026)
 * Tab de información general del cliente
 *
 * ====================================================================
 */

import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Heart,
  CalendarCheck,
  ShoppingCart,
  Clock,
  Building2,
  UserCircle,
  FileText,
  AlertCircle,
  Send,
  MessageCircle,
  User,
} from 'lucide-react';
import { Button, AsyncBoundary } from '@/components/ui';
import { citasApi } from '@/services/api/endpoints';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente SmartButton clickeable
 */
function SmartButton({ icon: Icon, value, label, onClick, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-all ${colorClasses[color]} cursor-pointer`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
    </button>
  );
}

export default function ClienteGeneralTab({ cliente, estadisticas }) {
  const navigate = useNavigate();
  const clienteId = cliente?.id;

  // Obtener historial de citas del cliente (últimas 5)
  const { data: citasData, isLoading: loadingCitas } = useQuery({
    queryKey: ['citas-cliente', clienteId],
    queryFn: async () => {
      const response = await citasApi.listar({ cliente_id: clienteId, limit: 5 });
      return response.data.data.citas || [];
    },
    enabled: !!clienteId,
  });

  // Formatear dirección estructurada
  const formatearDireccion = () => {
    if (!cliente) return null;
    const partes = [];
    if (cliente.calle) partes.push(cliente.calle);
    if (cliente.colonia) partes.push(`Col. ${cliente.colonia}`);
    if (cliente.ciudad) partes.push(cliente.ciudad);
    if (cliente.estado_nombre) partes.push(cliente.estado_nombre);
    if (cliente.codigo_postal) partes.push(`CP ${cliente.codigo_postal}`);
    return partes.length > 0 ? partes.join(', ') : null;
  };

  // Formatear última visita
  const formatearUltimaVisita = () => {
    const fecha = estadisticas?.ultima_cita;
    if (!fecha) return 'Sin visitas';
    try {
      return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const direccionFormateada = formatearDireccion();

  return (
    <div className="space-y-6">
      {/* Smart Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SmartButton
          icon={CalendarCheck}
          value={estadisticas?.total_citas || 0}
          label="Total Citas"
          color="primary"
          onClick={() => navigate(`/citas?cliente_id=${clienteId}`)}
        />
        <SmartButton
          icon={DollarSign}
          value={`$${((estadisticas?.total_lifetime_value || 0) / 1000).toFixed(1)}k`}
          label="Total Gastado"
          color="green"
          onClick={() => navigate(`/pos/historial?cliente_id=${clienteId}`)}
        />
        <SmartButton
          icon={ShoppingCart}
          value={estadisticas?.total_compras || 0}
          label="Ventas POS"
          color="primary"
          onClick={() => navigate(`/pos/historial?cliente_id=${clienteId}`)}
        />
        <SmartButton
          icon={Clock}
          value={formatearUltimaVisita()}
          label="Última Visita"
          color="yellow"
          onClick={() => estadisticas?.ultima_cita && navigate(`/citas?cliente_id=${clienteId}`)}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda */}
        <div className="space-y-6">
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

              {cliente.tipo === 'persona' && cliente.fecha_nacimiento && (
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

              {/* Canales Digitales */}
              {cliente.telegram_chat_id && (
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Telegram</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                      {cliente.telegram_chat_id}
                    </p>
                  </div>
                </div>
              )}

              {cliente.whatsapp_phone && (
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">WhatsApp</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {cliente.whatsapp_phone}
                    </p>
                  </div>
                </div>
              )}

              {/* Profesional Preferido */}
              {cliente.profesional_preferido_id && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Profesional Preferido</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {cliente.profesional_preferido_nombre || 'Asignado'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Datos Fiscales - Solo Empresas */}
          {cliente.tipo === 'empresa' && (cliente.rfc || cliente.razon_social) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                Datos Fiscales
              </h3>

              <div className="space-y-3">
                {cliente.rfc && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">RFC</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                      {cliente.rfc}
                    </p>
                  </div>
                )}

                {cliente.razon_social && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Razón Social</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {cliente.razon_social}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dirección Estructurada */}
          {direccionFormateada && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                Dirección
              </h3>

              <div className="space-y-2">
                {cliente.calle && (
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {cliente.calle}
                  </p>
                )}
                {cliente.colonia && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Col. {cliente.colonia}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {[cliente.ciudad, cliente.estado_nombre].filter(Boolean).join(', ')}
                  {cliente.codigo_postal && ` CP ${cliente.codigo_postal}`}
                </p>
              </div>
            </div>
          )}

          {/* Alergias / Notas */}
          {cliente.alergias && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Alergias / Notas Médicas
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {cliente.alergias}
              </p>
            </div>
          )}
        </div>

        {/* Columna Derecha: Historial Reciente */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Historial Reciente
              </h3>
              {citasData && citasData.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/citas?cliente_id=${clienteId}`)}
                >
                  Ver todo →
                </Button>
              )}
            </div>

            <AsyncBoundary
              isLoading={loadingCitas}
              isEmpty={!citasData || citasData.length === 0}
              loadingText="Cargando citas..."
              emptyIcon={Heart}
              emptyTitle="Sin citas registradas"
              emptyDescription="Este cliente aún no tiene citas registradas"
              emptyActionLabel="Agendar Primera Cita"
              onEmptyAction={() => navigate('/citas', { state: { abrirModal: true, clienteId } })}
            >
              <div className="space-y-4">
                {citasData?.map((cita) => (
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
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          cita.estado === 'completada'
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                            : cita.estado === 'confirmada'
                            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300'
                            : cita.estado === 'cancelada'
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {cita.estado}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(cita.fecha_cita).toLocaleDateString('es-ES')}
                      </div>
                      {cita.hora_inicio && <span>{cita.hora_inicio}</span>}
                      {cita.precio && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${cita.precio.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AsyncBoundary>
          </div>

          {/* Servicios Frecuentes */}
          {estadisticas?.servicios_frecuentes && estadisticas.servicios_frecuentes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Servicios Frecuentes
              </h3>

              <div className="space-y-2">
                {estadisticas.servicios_frecuentes.map((servicio, index) => (
                  <div
                    key={servicio.id || servicio.servicio || `srv-${index}`}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {servicio.servicio}
                    </span>
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {servicio.veces} {servicio.veces === 1 ? 'vez' : 'veces'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
