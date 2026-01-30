import { memo, useState, useRef, useCallback } from 'react';
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
  MoreHorizontal,
} from 'lucide-react';
import {
  useNotificaciones,
  useNotificacionesCount,
  useMarcarNotificacionLeida,
  useMarcarTodasNotificacionesLeidas,
  useArchivarNotificacion,
  NOTIFICACION_NIVELES,
} from '@/hooks/sistema';
import { useClickOutsideRef } from '@/hooks/utils';

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
function formatearFechaRelativa(fecha) {
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
  if (diffDias < 7) return `Hace ${diffDias}d`;

  return fechaNotif.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
}

/**
 * NotificacionItem - Ítem individual memoizado
 */
const NotificacionItem = memo(function NotificacionItem({
  notif,
  menuAbierto,
  onMenuToggle,
  onMarcarLeida,
  onArchivar,
  onClick,
}) {
  const IconNivel = NIVEL_ICONS[notif.nivel] || Info;
  const nivelConfig = NOTIFICACION_NIVELES[notif.nivel] || NOTIFICACION_NIVELES.info;

  const handleMenuToggle = useCallback((e) => {
    e.stopPropagation();
    onMenuToggle(notif.id);
  }, [onMenuToggle, notif.id]);

  const handleMarcarLeida = useCallback((e) => {
    e.stopPropagation();
    onMarcarLeida(notif.id);
  }, [onMarcarLeida, notif.id]);

  const handleArchivar = useCallback((e) => {
    e.stopPropagation();
    onArchivar(notif.id);
  }, [onArchivar, notif.id]);

  const handleClick = useCallback(() => onClick(notif), [onClick, notif]);

  return (
    <div
      onClick={handleClick}
      className={`relative px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
        !notif.leida ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Icono */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${nivelConfig.bg}`}>
          <IconNivel className={`w-5 h-5 ${nivelConfig.color}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${!notif.leida ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
              {notif.titulo}
            </p>
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {formatearFechaRelativa(notif.creado_en)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
            {notif.mensaje}
          </p>

          {/* Accion */}
          {notif.accion_texto && (
            <span className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 mt-1">
              {notif.accion_texto}
              <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Menu de acciones */}
        <div className="relative flex-shrink-0">
          <button
            onClick={handleMenuToggle}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Submenu */}
          {menuAbierto === notif.id && (
            <div className="absolute right-0 top-6 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
              {!notif.leida && (
                <button
                  onClick={handleMarcarLeida}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Check className="w-4 h-4" />
                  Marcar como leida
                </button>
              )}
              <button
                onClick={handleArchivar}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Archive className="w-4 h-4" />
                Archivar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Indicador de no leida */}
      {!notif.leida && (
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full" />
      )}
    </div>
  );
});

NotificacionItem.displayName = 'NotificacionItem';

/**
 * NotificacionesBell - Componente de campana con dropdown de notificaciones
 */
export const NotificacionesBell = memo(function NotificacionesBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const dropdownRef = useRef(null);

  // Queries
  const { data: count = 0 } = useNotificacionesCount();
  const { data: notificaciones = [], isLoading } = useNotificaciones({
    limit: 10,
    solo_no_leidas: false,
  });

  // Mutations
  const marcarLeida = useMarcarNotificacionLeida();
  const marcarTodasLeidas = useMarcarTodasNotificacionesLeidas();
  const archivar = useArchivarNotificacion();

  // Cerrar dropdown al hacer click fuera (hook centralizado)
  useClickOutsideRef(dropdownRef, () => {
    setIsOpen(false);
    setMenuAbierto(null);
  }, isOpen);

  // Handlers memoizados
  const handleToggleDropdown = useCallback(() => setIsOpen(prev => !prev), []);

  const handleMenuToggle = useCallback((id) => {
    setMenuAbierto(prev => prev === id ? null : id);
  }, []);

  const handleMarcarLeida = useCallback((id) => {
    marcarLeida.mutate(id);
    setMenuAbierto(null);
  }, [marcarLeida]);

  const handleArchivar = useCallback((id) => {
    archivar.mutate(id);
    setMenuAbierto(null);
  }, [archivar]);

  const handleMarcarTodasLeidas = useCallback(() => {
    marcarTodasLeidas.mutate();
  }, [marcarTodasLeidas]);

  const handleClickNotificacion = useCallback((notif) => {
    if (!notif.leida) {
      marcarLeida.mutate(notif.id);
    }
    if (notif.accion_url) {
      navigate(notif.accion_url);
      setIsOpen(false);
    }
  }, [marcarLeida, navigate]);

  const handleVerTodas = useCallback(() => {
    setIsOpen(false);
    navigate('/notificaciones');
  }, [navigate]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Boton de campana */}
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label={`${count} notificaciones no leidas`}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Notificaciones
            </h3>
            {count > 0 && (
              <button
                onClick={handleMarcarTodasLeidas}
                disabled={marcarTodasLeidas.isPending}
                className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas como leidas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Cargando...
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notificaciones.map((notif) => (
                  <NotificacionItem
                    key={notif.id}
                    notif={notif}
                    menuAbierto={menuAbierto}
                    onMenuToggle={handleMenuToggle}
                    onMarcarLeida={handleMarcarLeida}
                    onArchivar={handleArchivar}
                    onClick={handleClickNotificacion}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
            <button
              onClick={handleVerTodas}
              className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Ver todas las notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

NotificacionesBell.displayName = 'NotificacionesBell';

export default NotificacionesBell;
