/**
 * ====================================================================
 * CLIENTE OPORTUNIDADES TAB - PIPELINE B2B
 * ====================================================================
 *
 * Fase 5 - Oportunidades B2B (Ene 2026)
 * Tab de oportunidades comerciales del cliente
 *
 * ====================================================================
 */

import { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Loader2,
  DollarSign,
  Target,
  Calendar,
  User,
  MoreVertical,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useOportunidadesCliente,
  useEstadisticasOportunidadesCliente,
  useCrearOportunidad,
  useMarcarGanada,
  useMarcarPerdida,
  useEliminarOportunidad,
  getPrioridad,
  getEstado,
  formatMoney,
} from '@/hooks/useOportunidades';
import { useEtapasPipeline } from '@/hooks/useOportunidades';
import { useToast } from '@/hooks/useToast';
import OportunidadFormDrawer from '@/components/clientes/OportunidadFormDrawer';

/**
 * Card de oportunidad individual
 */
function OportunidadCard({
  oportunidad,
  onGanar,
  onPerder,
  onEliminar,
  isLoading,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const prioridadInfo = getPrioridad(oportunidad.prioridad);
  const estadoInfo = getEstado(oportunidad.estado);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Nombre y etapa */}
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {oportunidad.nombre}
            </h4>
            {oportunidad.etapa_nombre && (
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: oportunidad.etapa_color || '#6366F1' }}
              >
                {oportunidad.etapa_nombre}
              </span>
            )}
          </div>

          {/* Valor y probabilidad */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatMoney(oportunidad.ingreso_esperado, oportunidad.moneda)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Target className="w-4 h-4" />
              <span>{oportunidad.probabilidad}%</span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Estado */}
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${estadoInfo.bgColor} ${estadoInfo.color}`}>
              {oportunidad.estado === 'ganada' && <CheckCircle className="w-3 h-3" />}
              {oportunidad.estado === 'perdida' && <XCircle className="w-3 h-3" />}
              {estadoInfo.label}
            </span>

            {/* Prioridad */}
            <span className={`text-xs px-2 py-1 rounded-full ${prioridadInfo.bgColor} ${prioridadInfo.color}`}>
              {prioridadInfo.label}
            </span>
          </div>

          {/* Fecha cierre esperada */}
          {oportunidad.fecha_cierre_esperada && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>
                Cierre esperado: {new Date(oportunidad.fecha_cierre_esperada).toLocaleDateString('es-MX')}
              </span>
            </div>
          )}

          {/* Vendedor */}
          {oportunidad.vendedor_nombre && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span>{oportunidad.vendedor_nombre}</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        {oportunidad.estado === 'abierta' && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px]">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onGanar(oportunidad);
                    }}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar ganada
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onPerder(oportunidad);
                    }}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Marcar perdida
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEliminar(oportunidad);
                    }}
                    disabled={isLoading}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Resumen de estadísticas
 */
function ResumenStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {stats.total || 0}
        </div>
        <div className="text-sm text-gray-500">Total</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-2xl font-bold text-blue-500">
          {stats.abiertas || 0}
        </div>
        <div className="text-sm text-gray-500">Abiertas</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-2xl font-bold text-green-500">
          {formatMoney(stats.valor_ganado || 0)}
        </div>
        <div className="text-sm text-gray-500">Ganado</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-2xl font-bold text-primary-500">
          {stats.tasa_conversion || 0}%
        </div>
        <div className="text-sm text-gray-500">Conversión</div>
      </div>
    </div>
  );
}

export default function ClienteOportunidadesTab({ clienteId, usuarios = [] }) {
  const { toast } = useToast();

  // Estado local
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [perderConfirm, setPerderConfirm] = useState({ open: false, oportunidad: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, oportunidad: null });
  const [motivoPerdida, setMotivoPerdida] = useState('');

  // Queries y mutations
  const { data, isLoading, isError, refetch } = useOportunidadesCliente(clienteId, {
    estado: filtroEstado || undefined,
  });
  const { data: stats } = useEstadisticasOportunidadesCliente(clienteId);
  const { data: etapas } = useEtapasPipeline();

  const crearOportunidad = useCrearOportunidad();
  const marcarGanada = useMarcarGanada();
  const marcarPerdida = useMarcarPerdida();
  const eliminarOportunidad = useEliminarOportunidad();

  // Handlers
  const handleCrear = async (data) => {
    try {
      await crearOportunidad.mutateAsync({
        ...data,
        cliente_id: clienteId,
      });
      toast('Oportunidad creada exitosamente', { type: 'success' });
      setDrawerOpen(false);
    } catch (error) {
      toast(error.message || 'No se pudo crear la oportunidad', { type: 'error' });
    }
  };

  const handleGanar = async (oportunidad) => {
    try {
      await marcarGanada.mutateAsync(oportunidad.id);
      toast('Oportunidad marcada como ganada', { type: 'success' });
    } catch (error) {
      toast(error.message || 'No se pudo marcar como ganada', { type: 'error' });
    }
  };

  const handlePerder = (oportunidad) => {
    setMotivoPerdida('');
    setPerderConfirm({ open: true, oportunidad });
  };

  const confirmPerder = async () => {
    if (!perderConfirm.oportunidad) return;

    try {
      await marcarPerdida.mutateAsync({
        oportunidadId: perderConfirm.oportunidad.id,
        motivoPerdida,
      });
      toast('Oportunidad marcada como perdida', { type: 'success' });
    } catch (error) {
      toast(error.message || 'No se pudo marcar como perdida', { type: 'error' });
    } finally {
      setPerderConfirm({ open: false, oportunidad: null });
      setMotivoPerdida('');
    }
  };

  const handleEliminar = (oportunidad) => {
    setDeleteConfirm({ open: true, oportunidad });
  };

  const confirmEliminar = async () => {
    if (!deleteConfirm.oportunidad) return;

    try {
      await eliminarOportunidad.mutateAsync(deleteConfirm.oportunidad.id);
      toast('Oportunidad eliminada', { type: 'success' });
    } catch (error) {
      toast(error.message || 'No se pudo eliminar', { type: 'error' });
    } finally {
      setDeleteConfirm({ open: false, oportunidad: null });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error al cargar oportunidades</p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  const oportunidades = data?.oportunidades || [];

  return (
    <div className="space-y-6">
      {/* Resumen de estadísticas */}
      <ResumenStats stats={stats} />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Oportunidades
          </h3>
          {oportunidades.length > 0 && (
            <span className="text-sm text-gray-500">
              ({oportunidades.length})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro por estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="
              appearance-none px-3 py-2 rounded-lg text-sm
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              text-gray-700 dark:text-gray-300
              focus:outline-none focus:ring-2 focus:ring-primary-500
            "
          >
            <option value="">Todos los estados</option>
            <option value="abierta">Abiertas</option>
            <option value="ganada">Ganadas</option>
            <option value="perdida">Perdidas</option>
          </select>

          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva oportunidad
          </Button>
        </div>
      </div>

      {/* Lista de oportunidades */}
      {oportunidades.length > 0 ? (
        <div className="grid gap-4">
          {oportunidades.map((oportunidad) => (
            <OportunidadCard
              key={oportunidad.id}
              oportunidad={oportunidad}
              onGanar={handleGanar}
              onPerder={handlePerder}
              onEliminar={handleEliminar}
              isLoading={
                marcarGanada.isPending ||
                marcarPerdida.isPending ||
                eliminarOportunidad.isPending
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="Sin oportunidades"
          description="Crea una oportunidad B2B para este cliente"
          action={
            <Button onClick={() => setDrawerOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva oportunidad
            </Button>
          }
        />
      )}

      {/* Drawer para crear oportunidad */}
      <OportunidadFormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCrear}
        isLoading={crearOportunidad.isPending}
        etapas={etapas || []}
        usuarios={usuarios}
      />

      {/* Confirmación de pérdida */}
      <ConfirmDialog
        isOpen={perderConfirm.open}
        onClose={() => setPerderConfirm({ open: false, oportunidad: null })}
        onConfirm={confirmPerder}
        title="Marcar como perdida"
        description={
          <div className="space-y-3">
            <p>¿Estás seguro de marcar "{perderConfirm.oportunidad?.nombre}" como perdida?</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motivo de pérdida (opcional)
              </label>
              <input
                type="text"
                value={motivoPerdida}
                onChange={(e) => setMotivoPerdida(e.target.value)}
                placeholder="Ej: Precio muy alto, eligió competencia..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        }
        confirmText="Marcar perdida"
        confirmVariant="danger"
        isLoading={marcarPerdida.isPending}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, oportunidad: null })}
        onConfirm={confirmEliminar}
        title="Eliminar oportunidad"
        description={`¿Estás seguro de eliminar "${deleteConfirm.oportunidad?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={eliminarOportunidad.isPending}
      />
    </div>
  );
}
