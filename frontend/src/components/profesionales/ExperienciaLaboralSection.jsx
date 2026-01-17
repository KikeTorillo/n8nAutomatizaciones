/**
 * ExperienciaLaboralSection - Gestión de experiencia laboral del empleado
 * Refactorizado con ExpandableCrudSection - Enero 2026
 *
 * Reducido de 234 LOC a ~90 LOC (-62%)
 */
import { Briefcase, Building2, Edit2, Trash2 } from 'lucide-react';
import { ExpandableCrudSection } from '@/components/ui';
import ExperienciaDrawer from './drawers/ExperienciaDrawer';
import {
  useExperienciaLaboral,
  useEliminarExperiencia,
  formatearRangoFechas,
  calcularDuracion,
} from '@/hooks/useExperienciaLaboral';

/**
 * Card individual de experiencia laboral
 */
function ExperienciaCard({ item: exp, onEdit, onDelete }) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        exp.empleo_actual
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Building2 className={`h-5 w-5 mt-0.5 ${exp.empleo_actual ? 'text-green-600' : 'text-gray-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 dark:text-gray-100">{exp.puesto}</span>
              {exp.empleo_actual && (
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                  Empleo actual
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{exp.empresa}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatearRangoFechas(exp.fecha_inicio, exp.fecha_fin)}</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>{calcularDuracion(exp.fecha_inicio, exp.fecha_fin)}</span>
            </div>
            {exp.descripcion && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{exp.descripcion}</p>
            )}
            {exp.ubicacion && <p className="text-xs text-gray-500 mt-1">{exp.ubicacion}</p>}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Sección de Experiencia Laboral
 */
function ExperienciaLaboralSection({ profesionalId }) {
  // Query y mutation
  const { data: experienciaData, isLoading, error } = useExperienciaLaboral(profesionalId);
  const eliminarMutation = useEliminarExperiencia();

  // Fallback para inconsistencias de API (plural/singular)
  const experiencias = experienciaData?.experiencias || experienciaData?.experiencia || [];

  return (
    <ExpandableCrudSection
      icon={Briefcase}
      title="Experiencia Laboral"
      items={experiencias}
      isLoading={isLoading}
      error={error}
      emptyMessage="No hay experiencia laboral registrada"
      loadingMessage="Cargando experiencia..."
      errorMessage="Error al cargar experiencia laboral"
      addButtonText="Agregar Experiencia"
      listClassName="space-y-3"
      renderItem={(item, actions) => <ExperienciaCard item={item} {...actions} />}
      deleteConfig={{
        title: 'Eliminar Experiencia Laboral',
        getMessage: (item) =>
          `¿Estás seguro de eliminar la experiencia en ${item.empresa}? Esta acción no se puede deshacer.`,
        mutation: eliminarMutation,
        getDeleteParams: (item) => ({
          profesionalId,
          experienciaId: item.id,
        }),
        successMessage: 'Experiencia laboral eliminada',
      }}
      DrawerComponent={ExperienciaDrawer}
      drawerProps={{ profesionalId }}
      itemPropName="experiencia"
    />
  );
}

export default ExperienciaLaboralSection;
