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
        <div className="flex items-center gap-3 pb-4 border-b">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: profesional?.color_calendario || '#3b82f6' }}
          >
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {profesional?.nombre} {profesional?.apellidos}
            </h3>
            <p className="text-sm text-gray-600">
              Configura los horarios de disponibilidad
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo: Configuración de horarios */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Nuevo Horario</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Selecciona los días y horarios en que el profesional estará disponible
                  </p>
                </div>
              </div>
            </div>

            {/* Plantillas rápidas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora Inicio
                </label>
                <Input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horarios Configurados
              </h4>

              {/* Loading state */}
              {loadingHorarios ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : !horarios || horarios.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    No hay horarios configurados
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Crea el primer horario usando el formulario
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {horarios.map((horario) => (
                    <div
                      key={horario.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {getDiaNombre(horario.dia_semana)}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                horario.tipo_horario === 'premium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {horario.tipo_horario === 'premium' ? 'Premium' : 'Regular'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>
                              {horario.hora_inicio.slice(0, 5)} - {horario.hora_fin.slice(0, 5)}
                            </span>
                          </div>
                          {horario.nombre_horario && (
                            <p className="text-xs text-gray-500 mt-1">
                              {horario.nombre_horario}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEliminarHorario(horario.id, getDiaNombre(horario.dia_semana))}
                          disabled={eliminarMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <div className="flex justify-end gap-3 pt-4 border-t">
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
