/**
 * PlantillaFormModal - Modal para crear/editar plantilla de onboarding
 * Fase 5 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState, useEffect } from 'react';
import {
  Plus, Trash2, GripVertical, Loader2, User, UserCheck, Users,
  ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  Button,
  Checkbox,
  FormGroup,
  Input,
  Modal,
  Select,
  Textarea
} from '@/components/ui';
import { DepartamentoSelect, PuestoSelect } from '@/components/organizacion';
import {
  usePlantillaOnboarding,
  useCrearPlantilla,
  useActualizarPlantilla,
  useCrearTarea,
  useActualizarTarea,
  useEliminarTarea,
  useReordenarTareas
} from '@/hooks/personas';

const RESPONSABLES = [
  { value: 'empleado', label: 'Empleado', icon: User },
  { value: 'supervisor', label: 'Supervisor', icon: UserCheck },
  { value: 'rrhh', label: 'RRHH', icon: Users },
];

const INITIAL_PLANTILLA = {
  nombre: '',
  descripcion: '',
  departamento_id: null,
  puesto_id: null,
  duracion_dias: 30,
  activo: true
};

const INITIAL_TAREA = {
  titulo: '',
  descripcion: '',
  responsable_tipo: 'empleado',
  dias_limite: null,
  es_obligatoria: true,
  url_recurso: ''
};

export default function PlantillaFormModal({
  isOpen,
  onClose,
  plantilla = null // null = crear, objeto = editar
}) {
  const isEditing = !!plantilla;

  const [formData, setFormData] = useState(INITIAL_PLANTILLA);
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState(INITIAL_TAREA);
  const [showNuevaTarea, setShowNuevaTarea] = useState(false);
  const [errors, setErrors] = useState({});

  // Query para obtener plantilla con tareas (solo en modo edicion)
  const { data: plantillaData, isLoading: loadingPlantilla } = usePlantillaOnboarding(
    isEditing ? plantilla.id : null
  );

  // Mutations
  const crearPlantillaMutation = useCrearPlantilla();
  const actualizarPlantillaMutation = useActualizarPlantilla();
  const crearTareaMutation = useCrearTarea();
  const actualizarTareaMutation = useActualizarTarea();
  const eliminarTareaMutation = useEliminarTarea();

  const isLoading = crearPlantillaMutation.isPending ||
    actualizarPlantillaMutation.isPending ||
    crearTareaMutation.isPending;

  // Cargar datos al abrir en modo edicion
  useEffect(() => {
    if (isOpen && isEditing && plantillaData) {
      setFormData({
        nombre: plantillaData.nombre || '',
        descripcion: plantillaData.descripcion || '',
        departamento_id: plantillaData.departamento_id,
        puesto_id: plantillaData.puesto_id,
        duracion_dias: plantillaData.duracion_dias || 30,
        activo: plantillaData.activo !== false
      });
      setTareas(plantillaData.tareas || []);
    } else if (isOpen && !isEditing) {
      setFormData(INITIAL_PLANTILLA);
      setTareas([]);
    }
  }, [isOpen, isEditing, plantillaData]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_PLANTILLA);
      setTareas([]);
      setNuevaTarea(INITIAL_TAREA);
      setShowNuevaTarea(false);
      setErrors({});
    }
  }, [isOpen]);

  // Validar formulario
  const validate = () => {
    const newErrors = {};

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length < 3) {
      newErrors.nombre = 'Minimo 3 caracteres';
    }

    if (formData.duracion_dias && (formData.duracion_dias < 1 || formData.duracion_dias > 365)) {
      newErrors.duracion_dias = 'Debe ser entre 1 y 365 dias';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar plantilla
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const dataToSend = {
        ...formData,
        departamento_id: formData.departamento_id || null,
        puesto_id: formData.puesto_id || null,
        descripcion: formData.descripcion?.trim() || null
      };

      if (isEditing) {
        await actualizarPlantillaMutation.mutateAsync({
          plantillaId: plantilla.id,
          data: dataToSend
        });
      } else {
        await crearPlantillaMutation.mutateAsync(dataToSend);
      }
      onClose();
    } catch (err) {
      // Error manejado por el hook
    }
  };

  // Agregar nueva tarea
  const handleAgregarTarea = async () => {
    if (!nuevaTarea.titulo?.trim()) return;
    if (!isEditing) return; // Solo en modo edicion

    try {
      await crearTareaMutation.mutateAsync({
        plantillaId: plantilla.id,
        data: {
          ...nuevaTarea,
          dias_limite: nuevaTarea.dias_limite ? parseInt(nuevaTarea.dias_limite) : null,
          url_recurso: nuevaTarea.url_recurso?.trim() || null
        }
      });
      setNuevaTarea(INITIAL_TAREA);
      setShowNuevaTarea(false);
    } catch (err) {
      // Error manejado por el hook
    }
  };

  // Eliminar tarea
  const handleEliminarTarea = async (tareaId) => {
    if (!isEditing) return;

    try {
      await eliminarTareaMutation.mutateAsync({
        tareaId,
        plantillaId: plantilla.id
      });
    } catch (err) {
      // Error manejado por el hook
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Plantilla' : 'Nueva Plantilla'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos basicos */}
        <div className="space-y-4">
          <FormGroup label="Nombre" error={errors.nombre} required>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Onboarding General"
              hasError={!!errors.nombre}
            />
          </FormGroup>

          <FormGroup label="Descripcion">
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripcion opcional de la plantilla..."
              rows={2}
            />
          </FormGroup>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Departamento (opcional)">
              <DepartamentoSelect
                value={formData.departamento_id}
                onChange={(val) => setFormData({ ...formData, departamento_id: val })}
                placeholder="Cualquier departamento"
                allowNull
              />
            </FormGroup>

            <FormGroup label="Puesto (opcional)">
              <PuestoSelect
                value={formData.puesto_id}
                onChange={(val) => setFormData({ ...formData, puesto_id: val })}
                placeholder="Cualquier puesto"
                allowNull
              />
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Duracion (dias)" error={errors.duracion_dias}>
              <Input
                type="number"
                value={formData.duracion_dias}
                onChange={(e) => setFormData({ ...formData, duracion_dias: parseInt(e.target.value) || 30 })}
                min={1}
                max={365}
                hasError={!!errors.duracion_dias}
              />
            </FormGroup>

            <div className="flex items-end">
              <Checkbox
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                label="Plantilla activa"
              />
            </div>
          </div>
        </div>

        {/* Tareas (solo en modo edicion) */}
        {isEditing && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Tareas ({plantillaData?.tareas?.length || 0})
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNuevaTarea(!showNuevaTarea)}
              >
                {showNuevaTarea ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Agregar Tarea
                  </>
                )}
              </Button>
            </div>

            {/* Formulario nueva tarea */}
            {showNuevaTarea && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 space-y-3">
                <Input
                  value={nuevaTarea.titulo}
                  onChange={(e) => setNuevaTarea({ ...nuevaTarea, titulo: e.target.value })}
                  placeholder="Titulo de la tarea"
                />
                <Textarea
                  value={nuevaTarea.descripcion}
                  onChange={(e) => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })}
                  placeholder="Descripcion (opcional)"
                  rows={2}
                />
                <div className="grid grid-cols-3 gap-3">
                  <Select
                    value={nuevaTarea.responsable_tipo}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, responsable_tipo: e.target.value })}
                    options={RESPONSABLES}
                  />
                  <Input
                    type="number"
                    value={nuevaTarea.dias_limite || ''}
                    onChange={(e) => setNuevaTarea({ ...nuevaTarea, dias_limite: e.target.value })}
                    placeholder="Dias limite"
                    min={0}
                  />
                  <div className="flex items-center">
                    <Checkbox
                      checked={nuevaTarea.es_obligatoria}
                      onChange={(e) => setNuevaTarea({ ...nuevaTarea, es_obligatoria: e.target.checked })}
                      label="Obligatoria"
                    />
                  </div>
                </div>
                <Input
                  value={nuevaTarea.url_recurso}
                  onChange={(e) => setNuevaTarea({ ...nuevaTarea, url_recurso: e.target.value })}
                  placeholder="URL de recurso (opcional)"
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAgregarTarea}
                    disabled={!nuevaTarea.titulo?.trim() || crearTareaMutation.isPending}
                  >
                    {crearTareaMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Agregar'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de tareas */}
            {loadingPlantilla ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : (plantillaData?.tareas || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No hay tareas. Agrega la primera tarea.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(plantillaData?.tareas || []).map((tarea, idx) => {
                  const ResponsableIcon = RESPONSABLES.find(r => r.value === tarea.responsable_tipo)?.icon || User;

                  return (
                    <div
                      key={tarea.id}
                      className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <span className="text-xs text-gray-400 mt-1 w-5">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {tarea.titulo}
                          </span>
                          {tarea.es_obligatoria && (
                            <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                              Obligatoria
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <ResponsableIcon className="h-3.5 w-3.5" />
                            {RESPONSABLES.find(r => r.value === tarea.responsable_tipo)?.label}
                          </span>
                          {tarea.dias_limite && (
                            <span>Dia {tarea.dias_limite}</span>
                          )}
                          {tarea.url_recurso && (
                            <a
                              href={tarea.url_recurso}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEliminarTarea(tarea.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        disabled={eliminarTareaMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              isEditing ? 'Guardar Cambios' : 'Crear Plantilla'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
