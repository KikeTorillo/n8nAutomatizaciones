/**
 * IncapacidadesList - Lista de incapacidades con filtros
 * Módulo de Profesionales - Enero 2026
 */
import { useState, useMemo, memo, useCallback } from 'react';
import {
  HeartPulse,
  Calendar,
  Clock,
  User,
  FileText,
  MoreVertical,
  Eye,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Pagination,
  Select
} from '@/components/ui';
import {
  useIncapacidades,
  useCancelarIncapacidad,
  getTipoIncapacidadConfig,
  getEstadoIncapacidadConfig,
  formatDiasIncapacidad,
  TIPOS_INCAPACIDAD_CONFIG,
  ESTADOS_INCAPACIDAD_CONFIG,
} from '@/hooks/personas';
import IncapacidadDetailModal from './IncapacidadDetailModal';

/**
 * Formatea una fecha en formato legible
 */
function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Badge de tipo de incapacidad
 */
const TipoBadge = memo(function TipoBadge({ tipo }) {
  const config = getTipoIncapacidadConfig(tipo);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
});

/**
 * Badge de estado de incapacidad
 */
const EstadoBadge = memo(function EstadoBadge({ estado }) {
  const config = getEstadoIncapacidadConfig(estado);
  const variantMap = {
    green: 'success',
    gray: 'default',
    red: 'error',
  };
  return (
    <Badge variant={variantMap[config.color] || 'default'}>
      {config.label}
    </Badge>
  );
});

/**
 * Tarjeta de incapacidad individual
 */
const IncapacidadCard = memo(function IncapacidadCard({ incapacidad, onVerDetalle, onCancelar }) {
  const [showMenu, setShowMenu] = useState(false);
  const esActiva = incapacidad.estado === 'activa';
  const esProrroga = !!incapacidad.incapacidad_origen_id;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Info principal */}
        <div className="flex-1 min-w-0">
          {/* Header: Profesional + Tipo */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {incapacidad.profesional_nombre ||
                 incapacidad.profesional?.nombre_completo ||
                 'Sin profesional'}
              </span>
            </div>
            <TipoBadge tipo={incapacidad.tipo_incapacidad} />
            {esProrroga && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Prórroga
              </span>
            )}
          </div>

          {/* Fechas y días */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatFecha(incapacidad.fecha_inicio)} - {formatFecha(incapacidad.fecha_fin)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDiasIncapacidad(incapacidad.dias_autorizados)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Folio: {incapacidad.folio_imss}
            </span>
          </div>

          {/* Código interno */}
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {incapacidad.codigo}
          </div>

          {/* Diagnóstico (si existe) */}
          {incapacidad.diagnostico && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {incapacidad.diagnostico}
            </p>
          )}
        </div>

        {/* Estado y acciones */}
        <div className="flex items-center gap-2">
          <EstadoBadge estado={incapacidad.estado} />

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 min-w-[160px]">
                  <button
                    onClick={() => {
                      onVerDetalle(incapacidad);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalle
                  </button>
                  {esActiva && (
                    <button
                      onClick={() => {
                        onCancelar(incapacidad);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Lista de incapacidades con filtros y paginación
 */
const IncapacidadesList = memo(function IncapacidadesList({ onRegistrar }) {
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({
    estado: '',
    tipo: '',
    busqueda: '',
  });
  const [incapacidadDetalle, setIncapacidadDetalle] = useState(null);
  const limit = 10;

  const cancelarMutation = useCancelarIncapacidad();

  // Construir parámetros de consulta
  const queryParams = useMemo(() => {
    const params = { pagina: page, limite: limit };
    if (filtros.estado) params.estado = filtros.estado;
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.busqueda) params.busqueda = filtros.busqueda;
    return params;
  }, [page, filtros]);

  const { data, isLoading, error } = useIncapacidades(queryParams);

  const incapacidades = data?.data || [];
  const pagination = {
    total: data?.total || 0,
    pages: data?.paginas || 1,
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPage(1); // Reset página al cambiar filtros
  };

  const handleCancelar = async (incapacidad) => {
    const motivo = window.prompt('Ingresa el motivo de la cancelación:');
    if (motivo) {
      await cancelarMutation.mutateAsync({
        id: incapacidad.id,
        motivo_cancelacion: motivo,
      });
    }
  };

  // Opciones de filtros
  const opcionesTipo = [
    { value: '', label: 'Todos los tipos' },
    ...Object.entries(TIPOS_INCAPACIDAD_CONFIG).map(([key, config]) => ({
      value: key,
      label: config.label,
    })),
  ];

  const opcionesEstado = [
    { value: '', label: 'Todos los estados' },
    ...Object.entries(ESTADOS_INCAPACIDAD_CONFIG).map(([key, config]) => ({
      value: key,
      label: config.label,
    })),
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
          >
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        <span className="text-red-700 dark:text-red-300">
          Error al cargar incapacidades: {error.message}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, folio..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtro tipo */}
          <div className="w-full sm:w-48">
            <Select
              value={filtros.tipo}
              onChange={(e) => handleFiltroChange('tipo', e.target.value)}
              options={opcionesTipo}
            />
          </div>

          {/* Filtro estado */}
          <div className="w-full sm:w-48">
            <Select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              options={opcionesEstado}
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      {incapacidades.length === 0 ? (
        <EmptyState
          icon={HeartPulse}
          title="Sin incapacidades"
          description={
            filtros.estado || filtros.tipo || filtros.busqueda
              ? 'No hay incapacidades con los filtros seleccionados'
              : 'No hay incapacidades registradas'
          }
          action={
            <Button onClick={onRegistrar}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Incapacidad
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {incapacidades.map((incapacidad) => (
              <IncapacidadCard
                key={incapacidad.id}
                incapacidad={incapacidad}
                onVerDetalle={setIncapacidadDetalle}
                onCancelar={handleCancelar}
              />
            ))}
          </div>

          {/* Paginación */}
          {pagination.pages > 1 && (
            <Pagination
              pagination={{
                page,
                limit,
                total: pagination.total,
                totalPages: pagination.pages,
                hasNext: page < pagination.pages,
                hasPrev: page > 1,
              }}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Modal de detalle */}
      <IncapacidadDetailModal
        isOpen={!!incapacidadDetalle}
        onClose={() => setIncapacidadDetalle(null)}
        incapacidad={incapacidadDetalle}
      />
    </div>
  );
});

export default IncapacidadesList;
