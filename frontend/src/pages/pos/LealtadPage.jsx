import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Award,
  Settings,
  Users,
  BarChart3,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  Loader2,
  Star,
  Crown,
  Gem,
  TrendingUp,
  Gift,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import NivelLealtadDrawer from '@/components/pos/NivelLealtadDrawer';
import { useToast } from '@/hooks/useToast';
import {
  useConfiguracionLealtad,
  useGuardarConfiguracionLealtad,
  useNivelesLealtad,
  useEliminarNivelLealtad,
  useCrearNivelesDefault,
  useEstadisticasLealtad,
  useClientesConPuntos
} from '@/hooks/useLealtad';

// Mapeo de iconos
const ICONOS = {
  star: Star,
  award: Award,
  crown: Crown,
  gem: Gem,
};

export default function LealtadPage() {
  const toast = useToast();
  const [tabActivo, setTabActivo] = useState('configuracion');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nivelEditando, setNivelEditando] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [drawerKey, setDrawerKey] = useState(0);

  // Queries
  const { data: config, isLoading: loadingConfig } = useConfiguracionLealtad();
  const { data: niveles, isLoading: loadingNiveles } = useNivelesLealtad({ incluir_inactivos: true });
  const { data: estadisticas, isLoading: loadingStats } = useEstadisticasLealtad();
  const { data: clientesData } = useClientesConPuntos({ limit: 10, ordenar_por: 'puntos_desc' });

  // Mutations
  const guardarConfigMutation = useGuardarConfiguracionLealtad();
  const eliminarNivelMutation = useEliminarNivelLealtad();
  const crearNivelesDefaultMutation = useCrearNivelesDefault();

  const tabs = [
    { id: 'configuracion', label: 'Configuración', icon: Settings },
    { id: 'niveles', label: 'Niveles', icon: Award },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
  ];

  // Handlers
  const handleNuevoNivel = () => {
    setNivelEditando(null);
    setDrawerKey(k => k + 1);
    setDrawerOpen(true);
  };

  const handleEditarNivel = (nivel) => {
    setNivelEditando(nivel);
    setDrawerKey(k => k + 1);
    setDrawerOpen(true);
  };

  const handleEliminarNivel = (nivel) => {
    setDeleteConfirm(nivel);
  };

  const confirmarEliminar = async () => {
    if (!deleteConfirm) return;
    try {
      await eliminarNivelMutation.mutateAsync(deleteConfirm.id);
      toast.success('Nivel eliminado');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleCrearNivelesDefault = async () => {
    try {
      await crearNivelesDefaultMutation.mutateAsync();
      toast.success('Niveles creados: Bronce, Plata, Oro, Platino');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear niveles');
    }
  };

  const handleDrawerSuccess = () => {
    setDrawerOpen(false);
    setNivelEditando(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/pos/venta"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Gift className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Programa de Lealtad
                </h1>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configura puntos, niveles y recompensas para tus clientes
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActivo(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tabActivo === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 sm:p-6">
        {tabActivo === 'configuracion' && (
          <ConfiguracionTab
            config={config}
            isLoading={loadingConfig}
            onGuardar={guardarConfigMutation}
          />
        )}
        {tabActivo === 'niveles' && (
          <NivelesTab
            niveles={niveles || []}
            isLoading={loadingNiveles}
            onNuevo={handleNuevoNivel}
            onEditar={handleEditarNivel}
            onEliminar={handleEliminarNivel}
            onCrearDefault={handleCrearNivelesDefault}
            creandoDefault={crearNivelesDefaultMutation.isPending}
          />
        )}
        {tabActivo === 'estadisticas' && (
          <EstadisticasTab
            estadisticas={estadisticas}
            clientes={clientesData?.clientes || []}
            isLoading={loadingStats}
          />
        )}
      </div>

      {/* Drawer de nivel */}
      <NivelLealtadDrawer
        key={drawerKey}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        nivel={nivelEditando}
        onSuccess={handleDrawerSuccess}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar nivel"
        message={`¿Eliminar el nivel "${deleteConfirm?.nombre}"? Los clientes en este nivel quedarán sin nivel asignado.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarNivelMutation.isPending}
      />
    </div>
  );
}

// ============================================================
// TAB: CONFIGURACIÓN
// ============================================================

function ConfiguracionTab({ config, isLoading, onGuardar }) {
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues: {
      puntos_por_peso: config?.puntos_por_peso?.toString() || '1',
      puntos_por_peso_descuento: config?.puntos_por_peso_descuento?.toString() || '1',
      minimo_puntos_canje: config?.minimo_puntos_canje?.toString() || '100',
      maximo_descuento_porcentaje: config?.maximo_descuento_porcentaje?.toString() || '50',
      meses_expiracion: config?.meses_expiracion?.toString() || '12',
      puntos_expiran: config?.puntos_expiran ?? true,
      aplica_con_cupones: config?.aplica_con_cupones ?? false,
      activo: config?.activo ?? true
    },
    values: config ? {
      puntos_por_peso: config.puntos_por_peso?.toString() || '1',
      puntos_por_peso_descuento: config.puntos_por_peso_descuento?.toString() || '1',
      minimo_puntos_canje: config.minimo_puntos_canje?.toString() || '100',
      maximo_descuento_porcentaje: config.maximo_descuento_porcentaje?.toString() || '50',
      meses_expiracion: config.meses_expiracion?.toString() || '12',
      puntos_expiran: config.puntos_expiran ?? true,
      aplica_con_cupones: config.aplica_con_cupones ?? false,
      activo: config.activo ?? true
    } : undefined
  });

  const puntosExpiran = watch('puntos_expiran');
  const programaActivo = watch('activo');

  const onSubmit = async (data) => {
    try {
      await onGuardar.mutateAsync({
        puntos_por_peso: parseFloat(data.puntos_por_peso) || 1,
        puntos_por_peso_descuento: parseInt(data.puntos_por_peso_descuento) || 1,
        minimo_puntos_canje: parseInt(data.minimo_puntos_canje) || 100,
        maximo_descuento_porcentaje: parseInt(data.maximo_descuento_porcentaje) || 50,
        meses_expiracion: parseInt(data.meses_expiracion) || 12,
        puntos_expiran: data.puntos_expiran,
        aplica_con_cupones: data.aplica_con_cupones,
        activo: data.activo
      });
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Calcular ejemplo
  const puntosGanados = parseFloat(watch('puntos_por_peso')) || 1;
  const puntosDescuento = parseInt(watch('puntos_por_peso_descuento')) || 1;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6">
      {/* Estado del programa */}
      <div className={`p-4 rounded-lg border-2 ${
        programaActivo
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              programaActivo
                ? 'bg-emerald-100 dark:bg-emerald-900/40'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              <Sparkles className={`h-5 w-5 ${
                programaActivo
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Programa de Lealtad
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {programaActivo ? 'Activo - Los clientes acumulan puntos' : 'Inactivo'}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            {...register('activo')}
            className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
        </label>
      </div>

      {/* Acumulación de puntos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-500" />
          Acumulación de Puntos
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Puntos por cada $1 gastado"
            type="number"
            step="0.1"
            min="0.1"
            {...register('puntos_por_peso', { required: 'Requerido' })}
            error={errors.puntos_por_peso?.message}
          />
          <div className="flex items-end">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-800 dark:text-blue-300 flex-1">
              Compra de $100 = <strong>{(100 * puntosGanados).toFixed(0)} puntos</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Canje de puntos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary-500" />
          Canje de Puntos
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Puntos necesarios para $1 de descuento"
            type="number"
            min="1"
            {...register('puntos_por_peso_descuento', { required: 'Requerido' })}
            error={errors.puntos_por_peso_descuento?.message}
          />
          <Input
            label="Mínimo de puntos para canjear"
            type="number"
            min="0"
            {...register('minimo_puntos_canje')}
          />
          <Input
            label="Máximo % del total como descuento"
            type="number"
            min="1"
            max="100"
            {...register('maximo_descuento_porcentaje')}
            suffix="%"
          />
          <div className="flex items-end">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-sm text-emerald-800 dark:text-emerald-300 flex-1">
              {puntosDescuento} puntos = <strong>$1 de descuento</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Expiración */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
          Expiración de Puntos
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('puntos_expiran')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Los puntos expiran después de un tiempo
            </span>
          </label>
          {puntosExpiran && (
            <Input
              label="Meses de vigencia"
              type="number"
              min="1"
              max="60"
              {...register('meses_expiracion')}
              className="max-w-xs"
            />
          )}
        </div>
      </div>

      {/* Opciones adicionales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
          Opciones Adicionales
        </h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('aplica_con_cupones')}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Acumular puntos incluso cuando se usa un cupón de descuento
          </span>
        </label>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={onGuardar.isPending}
          className="min-w-[150px]"
        >
          {onGuardar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar configuración
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// TAB: NIVELES
// ============================================================

function NivelesTab({ niveles, isLoading, onNuevo, onEditar, onEliminar, onCrearDefault, creandoDefault }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (niveles.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <EmptyState
          icon={Award}
          title="Sin niveles de lealtad"
          description="Crea niveles para recompensar a tus mejores clientes con multiplicadores de puntos"
        />
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onCrearDefault} variant="outline" disabled={creandoDefault}>
            {creandoDefault && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Sparkles className="h-4 w-4 mr-2" />
            Crear niveles por defecto
          </Button>
          <Button onClick={onNuevo}>
            <Plus className="h-4 w-4 mr-2" />
            Crear nivel personalizado
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Niveles de Membresía
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {niveles.length} nivel{niveles.length !== 1 ? 'es' : ''} configurado{niveles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={onNuevo}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Nivel
        </Button>
      </div>

      {/* Lista de niveles */}
      <div className="space-y-3">
        {niveles.map((nivel) => {
          const IconComponent = ICONOS[nivel.icono] || Award;
          return (
            <div
              key={nivel.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border p-4 ${
                nivel.activo
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Icono con color */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: nivel.color || '#6B7280' }}
                >
                  <IconComponent className="h-6 w-6 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {nivel.nombre}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      {nivel.codigo}
                    </span>
                    {!nivel.activo && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {nivel.puntos_minimos.toLocaleString()} - {nivel.puntos_maximos ? nivel.puntos_maximos.toLocaleString() : '∞'} puntos
                    {nivel.multiplicador_puntos > 1 && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-medium">
                        x{nivel.multiplicador_puntos} puntos
                      </span>
                    )}
                  </p>
                </div>

                {/* Stats */}
                {nivel.total_clientes > 0 && (
                  <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{nivel.total_clientes}</span>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditar(nivel)}
                    className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEliminar(nivel)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TAB: ESTADÍSTICAS
// ============================================================

function EstadisticasTab({ estadisticas, clientes, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const stats = estadisticas || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Clientes en programa"
          value={stats.total_clientes?.toLocaleString() || '0'}
          color="primary"
        />
        <StatCard
          icon={Star}
          label="Puntos en circulación"
          value={stats.puntos_circulacion?.toLocaleString() || '0'}
          color="yellow"
        />
        <StatCard
          icon={Gift}
          label="Puntos canjeados (30d)"
          value={stats.puntos_canjeados_mes?.toLocaleString() || '0'}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Tasa de canje"
          value={`${stats.tasa_canje?.toFixed(1) || '0'}%`}
          color="blue"
        />
      </div>

      {/* Top clientes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Top 10 Clientes con más Puntos
          </h3>
        </div>
        {clientes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Aún no hay clientes con puntos acumulados
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {clientes.map((cliente, index) => (
              <div key={cliente.cliente_id} className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {cliente.cliente_nombre || 'Cliente'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {cliente.cliente_email || cliente.cliente_telefono || ''}
                  </p>
                </div>
                {cliente.nivel_nombre && (
                  <span
                    className="text-xs px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: cliente.nivel_color || '#6B7280' }}
                  >
                    {cliente.nivel_nombre}
                  </span>
                )}
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {cliente.puntos_disponibles?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">puntos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
