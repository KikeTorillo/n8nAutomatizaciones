import { useState, useEffect } from 'react';
import { Clock, Trash2, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useHorariosProfesional,
  useCrearHorarioSemanal,
  useEliminarHorario,
} from '@/hooks/useHorarios';
import { useToast } from '@/hooks/useToast';
import { aFormatoISO } from '@/utils/dateHelpers';

/**
 * Días de la semana (0=Domingo, 6=Sábado según ISO)
 */
const DIAS_SEMANA = [
  { id: 1, nombre: 'Lunes', corto: 'Lun' },
  { id: 2, nombre: 'Martes', corto: 'Mar' },
  { id: 3, nombre: 'Miércoles', corto: 'Mié' },
  { id: 4, nombre: 'Jueves', corto: 'Jue' },
  { id: 5, nombre: 'Viernes', corto: 'Vie' },
  { id: 6, nombre: 'Sábado', corto: 'Sáb' },
  { id: 0, nombre: 'Domingo', corto: 'Dom' },
];

/**
 * Plantillas de horarios predefinidos
 */
const PLANTILLAS = [
  { nombre: 'Jornada Completa (9am-6pm)', hora_inicio: '09:00', hora_fin: '18:00', dias: [1, 2, 3, 4, 5] },
  { nombre: 'Media Jornada (9am-1pm)', hora_inicio: '09:00', hora_fin: '13:00', dias: [1, 2, 3, 4, 5] },
  { nombre: 'Tarde (2pm-8pm)', hora_inicio: '14:00', hora_fin: '20:00', dias: [1, 2, 3, 4, 5] },
  { nombre: 'Fin de Semana (10am-6pm)', hora_inicio: '10:00', hora_fin: '18:00', dias: [6, 0] },
];

/**
 * Modal para gestión de horarios de un profesional
 */
function HorariosProfesionalModal({ isOpen, onClose, profesional }) {
  const toast = useToast();
  const [diasSeleccionados, setDiasSeleccionados] = useState([1, 2, 3, 4, 5]); // Lun-Vie por defecto
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('18:00');
  const [tipoHorario, setTipoHorario] = useState('regular');
  const [nombreHorario, setNombreHorario] = useState('Horario Laboral');

  // Estado para modal de confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, horarioId: null, diaNombre: '' });

  // Fetch horarios existentes
  const { data: horarios, isLoading: loadingHorarios } = useHorariosProfesional(
    profesional?.id,
    { incluir_inactivos: false }
  );

  // Mutations
  const crearMutation = useCrearHorarioSemanal();
  const eliminarMutation = useEliminarHorario();

  // Reset form cuando abre el modal
  useEffect(() => {
    if (isOpen) {
      setDiasSeleccionados([1, 2, 3, 4, 5]);
      setHoraInicio('09:00');
      setHoraFin('18:00');
      setTipoHorario('regular');
      setNombreHorario('Horario Laboral');
    }
  }, [isOpen]);

  // Handler para toggle de días
  const handleToggleDia = (diaId) => {
    setDiasSeleccionados((prev) =>
      prev.includes(diaId) ? prev.filter((d) => d !== diaId) : [...prev, diaId].sort()
    );
  };

  // Handler para aplicar plantilla
  const handleAplicarPlantilla = (plantilla) => {
    setDiasSeleccionados(plantilla.dias);
    setHoraInicio(plantilla.hora_inicio);
    setHoraFin(plantilla.hora_fin);
    toast.success(`Plantilla "${plantilla.nombre}" aplicada`);
  };

  // Handler para crear horarios
  const handleCrearHorarios = async () => {
    if (diasSeleccionados.length === 0) {
      toast.error('Selecciona al menos un día');
      return;
    }

    if (horaInicio >= horaFin) {
      toast.error('La hora de fin debe ser mayor que la hora de inicio');
      return;
    }

    try {
      const data = {
        profesional_id: profesional.id,
        dias: diasSeleccionados,
        hora_inicio: `${horaInicio}:00`,
        hora_fin: `${horaFin}:00`,
        tipo_horario: tipoHorario,
        nombre_horario: nombreHorario.trim() || 'Horario Laboral',
        fecha_inicio: aFormatoISO(new Date()), // ✅ FIX: Usar fecha LOCAL
      };

      const resultado = await crearMutation.mutateAsync(data);

      // Mensaje descriptivo según el resultado
      if (resultado.data.horarios_creados === 0) {
        toast.warning(
          'No se crearon horarios. Los días seleccionados ya tienen horarios configurados que se solapan con el rango especificado.'
        );
      } else if (resultado.data.horarios_creados === 1) {
        toast.success('1 horario creado exitosamente');
      } else {
        toast.success(
          `${resultado.data.horarios_creados} horarios creados exitosamente`
        );
      }
    } catch (error) {
      toast.error(error.message || 'Error al crear horarios');
    }
  };

  // Handler para abrir modal de confirmación de eliminación
  const handleEliminarHorario = (horarioId, diaNombre) => {
    setConfirmDelete({ isOpen: true, horarioId, diaNombre });
  };

  // Handler para confirmar eliminación
  const handleConfirmDelete = async () => {
    try {
      await eliminarMutation.mutateAsync(confirmDelete.horarioId);
      toast.success('Horario eliminado exitosamente');
      setConfirmDelete({ isOpen: false, horarioId: null, diaNombre: '' });
    } catch (error) {
      toast.error(error.message || 'Error al eliminar horario');
    }
  };

  // Obtener nombre del día por ID
  const getDiaNombre = (diaId) => {
    return DIAS_SEMANA.find((d) => d.id === diaId)?.nombre || 'Desconocido';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Horarios"
      maxWidth="5xl"
    >
      <div className="space-y-6">
        {/* Header con info del profesional */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: profesional?.color_calendario || '#3b82f6' }}
          >
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {profesional?.nombre} {profesional?.apellidos}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configura los horarios de disponibilidad
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo: Configuración de horarios */}
          <div className="space-y-6">
            <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-primary-900 dark:text-primary-300">Nuevo Horario</p>
                  <p className="text-xs text-primary-700 dark:text-primary-400 mt-1">
                    Selecciona los días y horarios en que el profesional estará disponible
                  </p>
                </div>
              </div>
            </div>

            {/* Plantillas rápidas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plantillas Rápidas
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PLANTILLAS.map((plantilla) => (
                  <Button
                    key={plantilla.nombre}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAplicarPlantilla(plantilla)}
                    className="text-xs"
                  >
                    {plantilla.nombre.split('(')[0].trim()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selector de días */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Días de la Semana
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DIAS_SEMANA.map((dia) => (
                  <button
                    key={dia.id}
                    type="button"
                    onClick={() => handleToggleDia(dia.id)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      diasSeleccionados.includes(dia.id)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {dia.corto}
                  </button>
                ))}
              </div>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora Inicio
                </label>
                <Input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hora Fin
                </label>
                <Input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                />
              </div>
            </div>

            {/* Tipo de horario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Horario
              </label>
              <Select
                value={tipoHorario}
                onChange={(e) => setTipoHorario(e.target.value)}
              >
                <option value="regular">Regular</option>
                <option value="premium">Premium</option>
              </Select>
            </div>

            {/* Nombre del horario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Horario (Opcional)
              </label>
              <Input
                type="text"
                value={nombreHorario}
                onChange={(e) => setNombreHorario(e.target.value)}
                placeholder="Ej: Horario Laboral, Horario Premium..."
                maxLength={50}
              />
            </div>

            {/* Botón crear */}
            <Button
              onClick={handleCrearHorarios}
              isLoading={crearMutation.isPending}
              disabled={crearMutation.isPending || diasSeleccionados.length === 0}
              className="w-full"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {crearMutation.isPending ? 'Creando...' : 'Crear Horarios'}
            </Button>
          </div>

          {/* Panel derecho: Horarios existentes */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horarios Configurados
              </h4>

              {/* Loading state */}
              {loadingHorarios ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
              ) : !horarios || horarios.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No hay horarios configurados
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Crea el primer horario usando el formulario
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {horarios.map((horario) => (
                    <div
                      key={horario.id}
                      className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:border-primary-300 dark:hover:border-primary-500 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {getDiaNombre(horario.dia_semana)}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                horario.tipo_horario === 'premium'
                                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400'
                                  : 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-400'
                              }`}
                            >
                              {horario.tipo_horario === 'premium' ? 'Premium' : 'Regular'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              {horario.hora_inicio.slice(0, 5)} - {horario.hora_fin.slice(0, 5)}
                            </span>
                          </div>
                          {horario.nombre_horario && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {horario.nombre_horario}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEliminarHorario(horario.id, getDiaNombre(horario.dia_semana))}
                          disabled={eliminarMutation.isPending}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>

      {/* Modal de confirmación para eliminar horario */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, horarioId: null, diaNombre: '' })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Horario"
        message={`¿Estás seguro de eliminar el horario del ${confirmDelete.diaNombre}?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </Modal>
  );
}

export default HorariosProfesionalModal;
