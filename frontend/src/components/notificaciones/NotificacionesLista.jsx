import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  ChevronRight,
  Calendar,
  Package,
  DollarSign,
  Users,
  Store,
  Settings,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  PartyPopper,
  Filter,
  Loader2,
} from 'lucide-react';
import {
  useNotificaciones,
  useNotificacionesCount,
  useMarcarNotificacionLeida,
  useMarcarTodasNotificacionesLeidas,
  useArchivarNotificacion,
  useEliminarNotificacion,
  NOTIFICACION_NIVELES,
  NOTIFICACION_CATEGORIAS,
} from '@/hooks/useNotificaciones';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

/**
 * Iconos por categoria de notificacion
 */
const CATEGORIA_ICONS = {
  citas: Calendar,
  inventario: Package,
  pagos: DollarSign,
  clientes: Users,
  profesionales: Users,
  marketplace: Store,
  sistema: Settings,
  eventos: PartyPopper,
  comisiones: DollarSign,
  suscripcion: DollarSign,
};

/**
 * Iconos por nivel de notificacion
 */
const NIVEL_ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

/**
 * Formatear fecha relativa
 */
function formatearFecha(fecha) {
  if (!fecha) return '';

  const ahora = new Date();
  const fechaNotif = new Date(fecha);
  const diffMs = ahora - fechaNotif;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHoras < 24) return `Hace ${diffHoras}h`;
  if (diffDias < 7) return `Hace ${diffDias} dias`;

  return fechaNotif.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: fechaNotif.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * NotificacionesLista - Lista completa de notificaciones con filtros
 */
function NotificacionesLista() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState({
    solo_no_leidas: false,
    categoria: '',
  });
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Queries
  const { data: count = 0 } = useNotificacionesCount();
  const { data: notificaciones = [], isLoading, isFetching } = useNotificaciones({
    ...filtros,
    limit,
    offset,
  });

  // Mutations
  const marcarLeida = useMarcarNotificacionLeida();
  const marcarTodasLeidas = useMarcarTodasNotificacionesLeidas();
  const archivar = useArchivarNotificacion();
  const eliminar = useEliminarNotificacion();

  const handleMarcarLeida = (id) => {
    marcarLeida.mutate(id);
  };

  const handleArchivar = (id) => {
    archivar.mutate(id);
  };

  const handleEliminar = (id) => {
    eliminar.mutate(id);
  };

  const handleMarcarTodasLeidas = () => {
    marcarTodasLeidas.mutate();
  };

  const handleClickNotificacion = (notif) => {
    if (!notif.leida) {
      marcarLeida.mutate(notif.id);
    }
    if (notif.accion_url) {
      navigate(notif.accion_url);
    }
  };

  const handleCambiarFiltro = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
    setOffset(0);
  };

  return (
    <div className="space-y-4">
      {/* Header con filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notificaciones
          </h2>
          {count > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
              {count} sin leer
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por categoria */}
          <Select
            value={filtros.categoria}
            onChange={(e) => handleCambiarFiltro('categoria', e.target.value)}
            className="w-40"
          >
            <option value="">Todas las categorias</option>
            {NOTIFICACION_CATEGORIAS.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Select>

          {/* Filtro solo no leidas */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filtros.solo_no_leidas}
              onChange={(e) => handleCambiarFiltro('solo_no_leidas', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Solo sin leer</span>
          </label>

          {/* Marcar todas como leidas */}
          {count > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarcarTodasLeidas}
              isLoading={marcarTodasLeidas.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-primary-500 animate-spin" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando notificaciones...</p>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              No hay notificaciones
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filtros.solo_no_leidas || filtros.categoria
                ? 'No hay notificaciones que coincidan con los filtros'
                : 'Cuando tengas notificaciones, apareceran aqui'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {notificaciones.map((notif) => {
              const IconCategoria = CATEGORIA_ICONS[notif.categoria] || Bell;
              const IconNivel = NIVEL_ICONS[notif.nivel] || Info;
              const nivelConfig = NOTIFICACION_NIVELES[notif.nivel] || NOTIFICACION_NIVELES.info;

              return (
                <div
                  key={notif.id}
                  className={`relative p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !notif.leida ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icono */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${nivelConfig.bg}`}>
                      <IconNivel className={`w-6 h-6 ${nivelConfig.color}`} />
                    </div>

                    {/* Contenido */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleClickNotificacion(notif)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className={`font-medium ${!notif.leida ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notif.titulo}
                          </p>
                          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                            {notif.categoria}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {formatearFecha(notif.creado_en)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {notif.mensaje}
                      </p>

                      {/* Accion */}
                      {notif.accion_texto && (
                        <button className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2">
                          {notif.accion_texto}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex-shrink-0 flex items-start gap-1">
                      {!notif.leida && (
                        <button
                          onClick={() => handleMarcarLeida(notif.id)}
                          disabled={marcarLeida.isPending}
                          className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Marcar como leida"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleArchivar(notif.id)}
                        disabled={archivar.isPending}
                        className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Archivar"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(notif.id)}
                        disabled={eliminar.isPending}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Indicador de no leida */}
                  {!notif.leida && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Loading indicator for refetch */}
        {isFetching && !isLoading && (
          <div className="p-2 text-center border-t border-gray-100 dark:border-gray-700">
            <Loader2 className="w-4 h-4 mx-auto text-primary-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Paginacion simple */}
      {notificaciones.length >= limit && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setOffset(prev => prev + limit)}
          >
            Cargar mas
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotificacionesLista;
