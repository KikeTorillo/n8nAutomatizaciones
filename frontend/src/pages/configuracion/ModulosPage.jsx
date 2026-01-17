import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useModulosDisponibles,
  useModulosActivos,
  useActivarModulo,
  useDesactivarModulo,
} from '@/hooks/sistema';
import useAuthStore, { selectIsAdmin } from '@/store/authStore';
import { BackButton, ConfirmDialog } from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { useModalManager } from '@/hooks/utils';
import {
  Settings,
  Calendar,
  Package,
  ShoppingCart,
  DollarSign,
  Globe,
  Bot,
  AlertTriangle,
  Zap,
  PartyPopper,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
} from 'lucide-react';
import { configuracionAgendamientoApi } from '@/services/api/endpoints';

/**
 * Mapeo de iconos por módulo
 */
const ICONOS = {
  core: Settings,
  agendamiento: Calendar,
  inventario: Package,
  pos: ShoppingCart,
  comisiones: DollarSign,
  marketplace: Globe,
  chatbots: Bot,
  'eventos-digitales': PartyPopper,
  website: Globe,
  workflows: ClipboardCheck,
};

/**
 * Colores por módulo - Todos usan variaciones de Nexo Purple
 */
const COLORES = {
  core: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  agendamiento: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
  inventario: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300',
  pos: 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400',
  comisiones: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  marketplace: 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400',
  chatbots: 'bg-primary-50 dark:bg-primary-900/30 text-primary-400 dark:text-primary-300',
  'eventos-digitales': 'bg-primary-50 dark:bg-primary-900/30 text-primary-400 dark:text-primary-300',
  website: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
  workflows: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
};

/**
 * Página de Gestión de Módulos
 */
function ModulosPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore(selectIsAdmin);

  // Estado de expansión de módulos
  const [expandedModules, setExpandedModules] = useState({});

  // Estado de modales centralizado con useModalManager
  const { openModal, closeModal, isOpen, getModalProps } = useModalManager({
    confirm: { isOpen: false, modulo: null, accion: null },
  });

  // Queries
  const { data: disponiblesData, isLoading: loadingDisponibles } = useModulosDisponibles();
  const { data: activosData, isLoading: loadingActivos, refetch } = useModulosActivos();

  // Query para configuración de agendamiento
  const { data: configAgendamiento, isLoading: loadingConfigAgendamiento } = useQuery({
    queryKey: ['configuracion-agendamiento'],
    queryFn: async () => {
      const response = await configuracionAgendamientoApi.obtener();
      return response.data?.data || response.data || {};
    },
    staleTime: 30000,
  });

  // Mutation para toggle round-robin
  const toggleRoundRobinMutation = useMutation({
    mutationFn: configuracionAgendamientoApi.toggleRoundRobin,
    onSuccess: (response) => {
      const data = response.data?.data || response.data;
      queryClient.invalidateQueries({ queryKey: ['configuracion-agendamiento'] });
      toast.success(
        data?.round_robin_habilitado
          ? 'Round-Robin activado'
          : 'Round-Robin desactivado'
      );
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al cambiar configuración');
    },
  });

  // Toggle expanded state for module configuration
  const toggleExpanded = (moduleName) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  // Mutations
  const activarMutation = useActivarModulo();
  const desactivarMutation = useDesactivarModulo();

  // Extraer datos
  const modulosDisponibles = disponiblesData?.modulos || [];
  const modulosActivos = activosData?.modulos_activos || { core: true };

  // Verificar si un módulo está activo
  const estaActivo = (modulo) => modulosActivos[modulo] === true;

  // Verificar si puede activar (tiene dependencias satisfechas)
  const puedeActivar = (modulo) => {
    const moduloData = modulosDisponibles.find((m) => m.nombre === modulo);
    if (!moduloData?.dependencias?.length) return true;
    return moduloData.dependencias.every((dep) => modulosActivos[dep]);
  };

  // Obtener dependencias faltantes
  const getDependenciasFaltantes = (modulo) => {
    const moduloData = modulosDisponibles.find((m) => m.nombre === modulo);
    if (!moduloData?.dependencias?.length) return [];
    return moduloData.dependencias.filter((dep) => !modulosActivos[dep]);
  };

  // Verificar si puede desactivar (ningún otro módulo depende de él)
  const puedeDesactivar = (modulo) => {
    const moduloData = modulosDisponibles.find((m) => m.nombre === modulo);
    if (!moduloData?.puede_desactivar) return false;

    // Verificar que ningún módulo activo dependa de este
    return !modulosDisponibles.some(
      (m) => modulosActivos[m.nombre] && m.dependencias?.includes(modulo)
    );
  };

  // Obtener módulos que dependen de este (hard dependencies activas)
  const getModulosDependientesHard = (modulo) => {
    return modulosDisponibles
      .filter((m) => modulosActivos[m.nombre] && m.dependencias?.includes(modulo))
      .map((m) => m.display_name);
  };

  // Obtener display_name de un módulo por su nombre
  const getDisplayName = (nombre) => {
    const m = modulosDisponibles.find((mod) => mod.nombre === nombre);
    return m?.display_name || nombre;
  };

  // Obtener módulos con dependencia opcional (usado_por estático, filtrando los que son hard deps)
  const getModulosOpcionales = (modulo) => {
    const moduloData = modulosDisponibles.find((m) => m.nombre === modulo.nombre);
    const usadoPor = moduloData?.usado_por || [];
    const hardDeps = getModulosDependientesHard(modulo.nombre).map(name => {
      // Convertir display_name a nombre
      const m = modulosDisponibles.find(mod => mod.display_name === name);
      return m?.nombre || name;
    });

    // Solo los que son opcionales (están en usado_por pero NO son hard deps) y están activos
    return usadoPor
      .filter(m => modulosActivos[m] && !hardDeps.includes(m))
      .map(getDisplayName);
  };

  // Handlers
  const handleToggleModulo = (modulo, activo) => {
    if (activo) {
      // Desactivar
      if (!puedeDesactivar(modulo)) {
        const dependientes = getModulosDependientesHard(modulo);
        toast.warning(`No se puede desactivar. Los siguientes módulos dependen de este: ${dependientes.join(', ')}`);
        return;
      }
      openModal('confirm', null, { modulo, accion: 'desactivar' });
    } else {
      // Activar
      if (!puedeActivar(modulo)) {
        const faltantes = getDependenciasFaltantes(modulo);
        toast.warning(`Dependencias faltantes. Primero activa: ${faltantes.join(', ')}`);
        return;
      }
      openModal('confirm', null, { modulo, accion: 'activar' });
    }
  };

  const handleConfirm = async () => {
    const confirmProps = getModalProps('confirm');
    const { modulo, accion } = confirmProps;

    try {
      if (accion === 'activar') {
        await activarMutation.mutateAsync(modulo);
        toast.success('Módulo activado correctamente');
      } else {
        await desactivarMutation.mutateAsync(modulo);
        toast.success('Módulo desactivado correctamente');
      }
      refetch();
    } catch (err) {
      toast.error(err.message || 'Error al procesar la solicitud');
    }

    closeModal('confirm');
  };

  // Loading
  if (loadingDisponibles || loadingActivos) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  // Filtrar solo módulos que el usuario puede gestionar (excluir core)
  const modulosOpcionales = modulosDisponibles.filter((m) => m.nombre !== 'core');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <BackButton to="/configuracion" label="Configuración" className="mb-3" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestión de Módulos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Activa o desactiva módulos según tus necesidades
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info banner */}
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-8 flex items-start gap-3">
          <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-primary-900 dark:text-primary-200">
              Personaliza tu experiencia
            </h3>
            <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
              Todos los módulos están incluidos en tu suscripción. Activa solo los que necesitas
              para mantener tu menú organizado.
            </p>
          </div>
        </div>

        {/* Módulos Disponibles */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Módulos Disponibles
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modulosOpcionales.map((modulo) => {
              const Icono = ICONOS[modulo.nombre] || Settings;
              const activo = estaActivo(modulo.nombre);
              const colorClasses = COLORES[modulo.nombre] || COLORES.core;
              const puedeAct = puedeActivar(modulo.nombre);
              const puedeDesact = puedeDesactivar(modulo.nombre);
              const dependenciasFaltantes = getDependenciasFaltantes(modulo.nombre);
              const dependientesHard = getModulosDependientesHard(modulo.nombre);
              const dependientesOpcionales = getModulosOpcionales(modulo);

              return (
                <div
                  key={modulo.nombre}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 transition-all ${
                    activo ? 'border-green-300 dark:border-green-700 ring-1 ring-green-100 dark:ring-green-900/50' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${colorClasses}`}>
                        <Icono className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {modulo.display_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {modulo.descripcion}
                        </p>

                        {/* Dependencias */}
                        {modulo.dependencias?.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Requiere: {modulo.dependencias.join(', ')}
                          </p>
                        )}

                        {/* Advertencia de dependencias faltantes */}
                        {!activo && dependenciasFaltantes.length > 0 && (
                          <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 p-2 rounded">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>
                              Activa primero: {dependenciasFaltantes.join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Advertencia de módulos con dependencia HARD (bloquean desactivación) */}
                        {activo && dependientesHard.length > 0 && (
                          <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 p-2 rounded">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>
                              Requerido por: {dependientesHard.join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Info de módulos con dependencia OPCIONAL (no bloquean) */}
                        {activo && dependientesOpcionales.length > 0 && (
                          <div className="mt-3 flex items-start gap-2 text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 p-2 rounded">
                            <span>
                              Usado opcionalmente por: {dependientesOpcionales.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <div className="ml-4 flex items-center gap-2">
                      {/* Botón configuración para Agendamiento activo */}
                      {modulo.nombre === 'agendamiento' && activo && isAdmin() && (
                        <button
                          onClick={() => toggleExpanded(modulo.nombre)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                          title="Configuración avanzada"
                        >
                          {expandedModules[modulo.nombre] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {isAdmin() ? (
                        <button
                          onClick={() => handleToggleModulo(modulo.nombre, activo)}
                          disabled={
                            activarMutation.isPending ||
                            desactivarMutation.isPending ||
                            (!activo && !puedeAct) ||
                            (activo && !puedeDesact)
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                            activo
                              ? 'bg-green-500 focus:ring-green-500'
                              : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-500'
                          } ${
                            (!activo && !puedeAct) || (activo && !puedeDesact)
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              activo ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          activo
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {activo ? 'Activo' : 'Inactivo'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Configuración expandida para Agendamiento */}
                  {modulo.nombre === 'agendamiento' && activo && expandedModules[modulo.nombre] && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Configuración Avanzada
                      </h4>

                      {/* Round-Robin Toggle */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <RefreshCw className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Round-Robin
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Distribuye citas equitativamente entre profesionales cuando el cliente no elige uno específico.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleRoundRobinMutation.mutate()}
                          disabled={toggleRoundRobinMutation.isPending || loadingConfigAgendamiento}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                            configAgendamiento?.round_robin_habilitado
                              ? 'bg-primary-600 focus:ring-primary-500'
                              : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-500'
                          } ${
                            toggleRoundRobinMutation.isPending || loadingConfigAgendamiento
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              configAgendamiento?.round_robin_habilitado ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Nota informativa */}
                      <div className="mt-3 flex items-start gap-2 text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 p-2.5 rounded-lg">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          El orden de profesionales se configura en cada servicio desde Servicios &gt; Editar &gt; Profesionales.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Los cambios en módulos se aplican inmediatamente.
            {!isAdmin() && ' Contacta a un administrador para modificar los módulos activos.'}
          </p>
        </div>
      </main>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isOpen('confirm')}
        onClose={() => closeModal('confirm')}
        onConfirm={handleConfirm}
        title={getModalProps('confirm').accion === 'activar' ? 'Activar módulo' : 'Desactivar módulo'}
        message={
          getModalProps('confirm').accion === 'activar'
            ? `¿Deseas activar el módulo "${getModalProps('confirm').modulo}"? Esto habilitará todas sus funcionalidades.`
            : `¿Deseas desactivar el módulo "${getModalProps('confirm').modulo}"? Las funcionalidades asociadas dejarán de estar disponibles.`
        }
        confirmText={getModalProps('confirm').accion === 'activar' ? 'Activar' : 'Desactivar'}
        cancelText="Cancelar"
        variant={getModalProps('confirm').accion === 'activar' ? 'success' : 'warning'}
        isLoading={activarMutation.isPending || desactivarMutation.isPending}
      />
    </div>
  );
}

export default ModulosPage;
