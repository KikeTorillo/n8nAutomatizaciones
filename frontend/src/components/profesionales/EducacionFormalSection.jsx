/**
 * EducacionFormalSection - Gestión de educación formal del empleado
 * Refactorizado con ExpandableCrudSection - Enero 2026
 *
 * Reducido de 247 LOC a ~80 LOC (-67%)
 */
import { GraduationCap, BookOpen, Edit2, Trash2 } from 'lucide-react';
import { ExpandableCrudSection } from '@/components/ui';
import EducacionDrawer from './drawers/EducacionDrawer';
import {
  useEducacionFormal,
  useEliminarEducacion,
  getNivelEducacionLabel,
  getEstadoEstudio,
  formatearRangoAnios,
} from '@/hooks/useEducacionFormal';

/**
 * Card individual de educación
 */
function EducacionCard({ item: edu, onEdit, onDelete }) {
  const estado = getEstadoEstudio(edu.en_curso, edu.fecha_fin);
  const estadoColors = {
    blue: 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-400',
    green: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  };

  return (
    <div
      className={`p-3 rounded-lg border ${
        edu.en_curso
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <BookOpen className={`h-5 w-5 mt-0.5 ${edu.en_curso ? 'text-primary-600' : 'text-gray-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 dark:text-gray-100">{edu.titulo}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColors[estado.color]}`}>
                {estado.label}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{edu.institucion}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                {getNivelEducacionLabel(edu.nivel)}
              </span>
              <span>{formatearRangoAnios(edu.fecha_inicio, edu.fecha_fin, edu.en_curso)}</span>
            </div>
            {edu.campo_estudio && <p className="text-xs text-gray-500 mt-1">Campo: {edu.campo_estudio}</p>}
            {edu.promedio && <p className="text-xs text-gray-500 mt-1">Promedio: {edu.promedio}</p>}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
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
 * Sección de Educación Formal
 */
function EducacionFormalSection({ profesionalId }) {
  // Query y mutation
  const { data: educacionData, isLoading, error } = useEducacionFormal(profesionalId);
  const eliminarMutation = useEliminarEducacion();

  // BUG-001 FIX: API devuelve 'educaciones' (plural), fallback a 'educacion'
  const educaciones = educacionData?.educaciones || educacionData?.educacion || [];

  return (
    <ExpandableCrudSection
      icon={GraduationCap}
      title="Educación Formal"
      items={educaciones}
      isLoading={isLoading}
      error={error}
      emptyMessage="No hay educación formal registrada"
      loadingMessage="Cargando educación..."
      errorMessage="Error al cargar educación formal"
      addButtonText="Agregar Educación"
      listClassName="space-y-3"
      renderItem={(item, actions) => <EducacionCard item={item} {...actions} />}
      deleteConfig={{
        title: 'Eliminar Educación',
        getMessage: (item) =>
          `¿Estás seguro de eliminar "${item.titulo}" de ${item.institucion}? Esta acción no se puede deshacer.`,
        mutation: eliminarMutation,
        getDeleteParams: (item) => ({
          profesionalId,
          educacionId: item.id,
        }),
        successMessage: 'Educación eliminada',
      }}
      DrawerComponent={EducacionDrawer}
      drawerProps={{ profesionalId }}
      itemPropName="educacion"
    />
  );
}

export default EducacionFormalSection;
