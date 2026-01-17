/**
 * CalendarioAusenciasTab - Calendario unificado de ausencias
 * Muestra vacaciones + incapacidades en un calendario mensual
 * Enero 2026
 */
import { useState, useMemo } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
  eachDayOfInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Modal } from '@/components/ui';
import { useCalendarioAusencias, formatRangoFechas } from '@/hooks/personas';
import { useDepartamentosActivos } from '@/hooks/personas';

/**
 * Celda del calendario
 */
function CalendarioDia({ dia, eventos, esDelMesActual, esHoy, onVerEvento, isLoading }) {
  const numeroDia = dia.getDate();
  const maxVisible = 3;

  // Ordenar por tipo (incapacidades primero por ser más críticas)
  const eventosOrdenados = [...eventos].sort((a, b) => {
    if (a.tipo === 'incapacidad' && b.tipo !== 'incapacidad') return -1;
    if (a.tipo !== 'incapacidad' && b.tipo === 'incapacidad') return 1;
    return 0;
  });

  const visibles = eventosOrdenados.slice(0, maxVisible);
  const ocultos = eventosOrdenados.length - maxVisible;

  if (isLoading) {
    return (
      <div className="min-h-[100px] p-1 border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={`
        min-h-[100px] p-1 border-r border-b border-gray-200 dark:border-gray-700
        ${!esDelMesActual ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'}
        ${esHoy ? 'ring-2 ring-inset ring-primary-500' : ''}
      `}
    >
      {/* Número del día */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            text-xs font-medium px-1.5 py-0.5 rounded
            ${esHoy
              ? 'bg-primary-500 text-white'
              : !esDelMesActual
                ? 'text-gray-400 dark:text-gray-600'
                : 'text-gray-700 dark:text-gray-300'
            }
          `}
        >
          {numeroDia}
        </span>
        {eventos.length > 0 && (
          <span className="text-xs text-gray-400">{eventos.length}</span>
        )}
      </div>

      {/* Eventos */}
      <div className="space-y-0.5">
        {visibles.map((evento) => {
          const esIncapacidad = evento.tipo === 'incapacidad';
          const esPendiente = evento.estado === 'pendiente';

          return (
            <button
              key={evento.id}
              onClick={() => onVerEvento(evento)}
              className={`
                w-full text-left px-1.5 py-0.5 rounded text-xs truncate
                hover:opacity-80 transition-opacity
                ${esIncapacidad
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : esPendiente
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }
              `}
            >
              <span className="mr-1">
                {esIncapacidad ? '🏥' : esPendiente ? '⏳' : '✅'}
              </span>
              {evento.profesionalNombre?.split(' ')[0]}
            </button>
          );
        })}
        {ocultos > 0 && (
          <span className="text-xs text-gray-400 pl-1.5">+{ocultos} más</span>
        )}
      </div>
    </div>
  );
}

/**
 * Modal de detalle de evento
 */
function EventoDetailModal({ isOpen, onClose, evento }) {
  if (!evento) return null;

  const esIncapacidad = evento.tipo === 'incapacidad';

  const estadoVariant = {
    aprobada: 'success',
    pendiente: 'warning',
    rechazada: 'error',
    cancelada: 'default',
    activa: 'success',
    finalizada: 'default',
  }[evento.estado] || 'default';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`
                px-2 py-1 text-xs font-medium rounded
                ${esIncapacidad
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }
              `}
            >
              {esIncapacidad ? evento.subTipoConfig?.label || 'Incapacidad' : 'Vacaciones'}
            </span>
            <Badge variant={estadoVariant}>
              {evento.estadoConfig?.label || evento.estado}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="space-y-4">
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {evento.profesionalNombre}
            </p>
            {evento.departamentoNombre && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {evento.departamentoNombre}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Inicio</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {format(new Date(evento.fechaInicio), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Fin</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {format(new Date(evento.fechaFin), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
          </div>

          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Duración</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {evento.dias} días
            </p>
          </div>

          {evento.codigo && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Código</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white">
                {evento.codigo}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Tab del Calendario
 */
function CalendarioAusenciasTab({ esAdmin }) {
  const queryClient = useQueryClient();
  const [mesActual, setMesActual] = useState(new Date());
  const [filtros, setFiltros] = useState({
    tipo: null, // null = todos, 'vacaciones', 'incapacidad'
    estado: null,
    departamento_id: null,
  });
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  // Departamentos para filtro
  const { data: departamentosData } = useDepartamentosActivos();
  const departamentos = departamentosData?.data || [];

  // Calcular rango del mes (incluyendo semanas parciales)
  const rangoMes = useMemo(() => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(mesActual);
    return {
      inicio: format(startOfWeek(inicioMes, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      fin: format(endOfWeek(finMes, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    };
  }, [mesActual]);

  // Query de eventos
  const { data: eventos, eventosPorFecha, isLoading } = useCalendarioAusencias({
    fecha_inicio: rangoMes.inicio,
    fecha_fin: rangoMes.fin,
    tipo: filtros.tipo,
    estado: filtros.estado,
    departamento_id: filtros.departamento_id,
  });

  // Días a renderizar
  const diasCalendario = useMemo(() => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(mesActual);
    const inicio = startOfWeek(inicioMes, { weekStartsOn: 1 });
    const fin = endOfWeek(finMes, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: inicio, end: fin });
  }, [mesActual]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ausencias', 'calendario'] });
    queryClient.invalidateQueries({ queryKey: ['vacaciones'] });
    queryClient.invalidateQueries({ queryKey: ['incapacidades'] });
  };

  const nombreMes = format(mesActual, 'MMMM yyyy', { locale: es });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Calendario de Ausencias
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Navegación y filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navegación del mes */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMesActual(subMonths(mesActual, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-medium text-gray-900 dark:text-white min-w-[160px] text-center capitalize">
            {nombreMes}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMesActual(addMonths(mesActual, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMesActual(new Date())}
          >
            Hoy
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filtros.tipo || ''}
            onChange={(e) =>
              setFiltros({ ...filtros, tipo: e.target.value || null })
            }
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Todos los tipos</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="incapacidad">Incapacidades</option>
          </select>

          <select
            value={filtros.estado || ''}
            onChange={(e) =>
              setFiltros({ ...filtros, estado: e.target.value || null })
            }
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Todos los estados</option>
            <option value="aprobada">Aprobadas</option>
            <option value="pendiente">Pendientes</option>
            <option value="activa">Activas</option>
          </select>

          {esAdmin && departamentos.length > 0 && (
            <select
              value={filtros.departamento_id || ''}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  departamento_id: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">Vacaciones aprobadas</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-gray-600 dark:text-gray-400">Pendientes</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500" />
          <span className="text-gray-600 dark:text-gray-400">Incapacidades</span>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header días de la semana */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
            <div
              key={dia}
              className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7">
          {diasCalendario.map((dia) => {
            const fechaISO = format(dia, 'yyyy-MM-dd');
            const eventosDelDia = eventosPorFecha[fechaISO] || [];

            return (
              <CalendarioDia
                key={fechaISO}
                dia={dia}
                eventos={eventosDelDia}
                esDelMesActual={isSameMonth(dia, mesActual)}
                esHoy={isToday(dia)}
                onVerEvento={setEventoSeleccionado}
                isLoading={isLoading}
              />
            );
          })}
        </div>
      </div>

      {/* Resumen */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {eventos?.length || 0} ausencias en {nombreMes}
      </div>

      {/* Modal de detalle */}
      <EventoDetailModal
        isOpen={!!eventoSeleccionado}
        onClose={() => setEventoSeleccionado(null)}
        evento={eventoSeleccionado}
      />
    </div>
  );
}

export default CalendarioAusenciasTab;
