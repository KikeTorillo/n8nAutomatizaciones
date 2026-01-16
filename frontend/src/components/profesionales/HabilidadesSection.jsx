/**
 * HabilidadesSection - Gestión de habilidades del empleado
 * Refactorizado con ExpandableCrudSection - Enero 2026
 *
 * Reducido de 273 LOC a ~130 LOC (-52%)
 * Nota: Este componente usa renderList en lugar de renderItem
 * porque las habilidades se muestran como tags en flex-wrap
 */
import { Wrench, Edit2, Trash2, CheckCircle, Shield } from 'lucide-react';
import { ExpandableCrudSection } from '@/components/ui';
import HabilidadDrawer from './drawers/HabilidadDrawer';
import { useToast } from '@/hooks/useToast';
import {
  useHabilidadesEmpleado,
  useEliminarHabilidadEmpleado,
  useVerificarHabilidadEmpleado,
  getCategoriaConfig,
  getNivelConfig,
} from '@/hooks/useHabilidades';

// Colores para niveles
const nivelColors = {
  basico: 'bg-gray-200 dark:bg-gray-600',
  intermedio: 'bg-blue-200 dark:bg-blue-800',
  avanzado: 'bg-green-200 dark:bg-green-800',
  experto: 'bg-purple-200 dark:bg-purple-800',
};

// Colores para categorías
const categoriaColors = {
  tecnica: 'text-blue-600 dark:text-blue-400',
  blanda: 'text-purple-600 dark:text-purple-400',
  idioma: 'text-green-600 dark:text-green-400',
  software: 'text-orange-600 dark:text-orange-400',
  certificacion: 'text-red-600 dark:text-red-400',
  otro: 'text-gray-600 dark:text-gray-400',
};

/**
 * Tag individual de habilidad
 */
function HabilidadTag({ item: hab, onEdit, onDelete, onVerificar, canVerify, isVerifying }) {
  const categoria = getCategoriaConfig(hab.categoria || hab.habilidad?.categoria);
  const nivel = getNivelConfig(hab.nivel);

  return (
    <div
      className={`group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
        hab.verificado
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
      }`}
    >
      {/* Nombre de habilidad */}
      <span className={`font-medium text-sm ${categoriaColors[categoria.value] || categoriaColors.otro}`}>
        {hab.habilidad?.nombre || hab.nombre}
      </span>

      {/* Nivel */}
      <span className={`text-xs px-2 py-0.5 rounded ${nivelColors[hab.nivel]}`}>{nivel.label}</span>

      {/* Verificado badge */}
      {hab.verificado && <CheckCircle className="h-4 w-4 text-green-600" />}

      {/* Botones de acción (visible en móvil, hover en desktop) */}
      <div className="flex md:opacity-0 md:group-hover:opacity-100 items-center gap-1 ml-1 transition-opacity">
        {canVerify && (
          <button
            type="button"
            onClick={() => onVerificar(hab)}
            disabled={isVerifying}
            className={`p-1 rounded transition-colors ${
              hab.verificado
                ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
            }`}
            title={hab.verificado ? 'Quitar verificación' : 'Verificar'}
          >
            <Shield className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
          title="Editar"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Sección de Habilidades
 */
function HabilidadesSection({ profesionalId, canVerify = false }) {
  const toast = useToast();

  // Query y mutations
  const { data: habilidadesData, isLoading, error } = useHabilidadesEmpleado(profesionalId);
  const eliminarMutation = useEliminarHabilidadEmpleado();
  const verificarMutation = useVerificarHabilidadEmpleado();

  const habilidades = habilidadesData?.habilidades || [];
  const conteo = habilidadesData?.conteo || { total: 0 };

  // Handler para verificar/desverificar
  const handleVerificar = async (hab) => {
    try {
      await verificarMutation.mutateAsync({
        profesionalId,
        habilidadEmpleadoId: hab.id,
        verificado: !hab.verificado,
      });
    } catch (err) {
      toast.error(err.message || 'Error al verificar habilidad');
    }
  };

  return (
    <ExpandableCrudSection
      icon={Wrench}
      title="Habilidades"
      count={conteo.total}
      items={habilidades}
      isLoading={isLoading}
      error={error}
      emptyMessage="No hay habilidades registradas"
      loadingMessage="Cargando habilidades..."
      errorMessage="Error al cargar habilidades"
      addButtonText="Agregar Habilidad"
      // Usamos renderList para layout flex-wrap personalizado
      renderList={(items, actions) => (
        <>
          <div className="flex flex-wrap gap-2">
            {items.map((hab) => (
              <HabilidadTag
                key={hab.id}
                item={hab}
                onEdit={() => actions.onEdit(hab)}
                onDelete={() => actions.onDelete(hab)}
                onVerificar={handleVerificar}
                canVerify={canVerify}
                isVerifying={verificarMutation.isPending}
              />
            ))}
          </div>
          {items.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Pasa el cursor sobre una habilidad para ver las opciones
            </p>
          )}
        </>
      )}
      deleteConfig={{
        title: 'Eliminar Habilidad',
        getMessage: (item) =>
          `¿Estás seguro de eliminar la habilidad "${item.habilidad?.nombre || item.nombre}"? Esta acción no se puede deshacer.`,
        mutation: eliminarMutation,
        getDeleteParams: (item) => ({
          profesionalId,
          habilidadEmpleadoId: item.id,
        }),
        successMessage: 'Habilidad eliminada',
      }}
      DrawerComponent={HabilidadDrawer}
      drawerProps={{ profesionalId }}
    />
  );
}

export default HabilidadesSection;
