/**
 * HabilidadModal - Modal para asignar/editar habilidad de empleado
 * Fase 4 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Loader2, Wrench, Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  useAsignarHabilidad,
  useActualizarHabilidadEmpleado,
  useCatalogoHabilidades,
  useCrearHabilidadCatalogo,
  NIVELES_HABILIDAD,
  CATEGORIAS_HABILIDAD,
  getCategoriaConfig
} from '@/hooks/useHabilidades';

const INITIAL_FORM_DATA = {
  habilidad_id: null,
  nivel: 'basico',
  anios_experiencia: 0,
  notas: '',
  certificaciones: ''
};

const INITIAL_NEW_HABILIDAD = {
  nombre: '',
  categoria: 'tecnica',
  descripcion: ''
};

export default function HabilidadModal({
  isOpen,
  onClose,
  profesionalId,
  habilidadEmpleado = null,
  onSuccess
}) {
  const toast = useToast();
  const isEditing = !!habilidadEmpleado;

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newHabilidad, setNewHabilidad] = useState(INITIAL_NEW_HABILIDAD);

  // Queries y mutations
  const { data: catalogoData, isLoading: loadingCatalogo } = useCatalogoHabilidades({
    enabled: isOpen && !isEditing
  });
  const asignarMutation = useAsignarHabilidad();
  const actualizarMutation = useActualizarHabilidadEmpleado();
  const crearCatalogoMutation = useCrearHabilidadCatalogo();

  const catalogo = catalogoData?.habilidades || [];

  const isLoading = asignarMutation.isPending || actualizarMutation.isPending || crearCatalogoMutation.isPending;

  // Filtrar catálogo por búsqueda
  const catalogoFiltrado = useMemo(() => {
    if (!busqueda.trim()) return catalogo;
    const term = busqueda.toLowerCase();
    return catalogo.filter(h =>
      h.nombre.toLowerCase().includes(term) ||
      h.categoria?.toLowerCase().includes(term)
    );
  }, [catalogo, busqueda]);

  // Cargar datos al editar
  useEffect(() => {
    if (isOpen && habilidadEmpleado) {
      setFormData({
        habilidad_id: habilidadEmpleado.habilidad_id,
        nivel: habilidadEmpleado.nivel || 'basico',
        anios_experiencia: habilidadEmpleado.anios_experiencia || 0,
        notas: habilidadEmpleado.notas || '',
        certificaciones: habilidadEmpleado.certificaciones || ''
      });
    } else if (isOpen && !habilidadEmpleado) {
      setFormData(INITIAL_FORM_DATA);
      setBusqueda('');
      setShowNewForm(false);
      setNewHabilidad(INITIAL_NEW_HABILIDAD);
    }
  }, [isOpen, habilidadEmpleado]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSelectHabilidad = (hab) => {
    setFormData(prev => ({ ...prev, habilidad_id: hab.id }));
    setErrors(prev => ({ ...prev, habilidad_id: null }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isEditing && !formData.habilidad_id) {
      newErrors.habilidad_id = 'Selecciona una habilidad del catálogo';
    }

    if (!formData.nivel) {
      newErrors.nivel = 'El nivel es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const dataToSend = {
      habilidad_id: formData.habilidad_id,
      nivel: formData.nivel,
      anios_experiencia: parseInt(formData.anios_experiencia) || 0,
      notas: formData.notas?.trim() || null,
      certificaciones: formData.certificaciones?.trim() || null
    };

    try {
      if (isEditing) {
        await actualizarMutation.mutateAsync({
          profesionalId,
          habilidadEmpleadoId: habilidadEmpleado.id,
          data: dataToSend
        });
        toast.success('Habilidad actualizada');
      } else {
        await asignarMutation.mutateAsync({
          profesionalId,
          data: dataToSend
        });
        toast.success('Habilidad asignada');
      }

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar habilidad');
    }
  };

  // Crear nueva habilidad en catálogo
  const handleCrearNueva = async () => {
    if (!newHabilidad.nombre?.trim()) {
      toast.error('El nombre de la habilidad es requerido');
      return;
    }

    try {
      const nuevaHabilidad = await crearCatalogoMutation.mutateAsync({
        nombre: newHabilidad.nombre.trim(),
        categoria: newHabilidad.categoria,
        descripcion: newHabilidad.descripcion?.trim() || null
      });

      // Seleccionar la nueva habilidad
      setFormData(prev => ({ ...prev, habilidad_id: nuevaHabilidad.id }));
      setShowNewForm(false);
      setNewHabilidad(INITIAL_NEW_HABILIDAD);
      toast.success('Habilidad creada en catálogo');
    } catch (err) {
      toast.error(err.message || 'Error al crear habilidad');
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setBusqueda('');
    setShowNewForm(false);
    setNewHabilidad(INITIAL_NEW_HABILIDAD);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedHabilidad = catalogo.find(h => h.id === formData.habilidad_id);

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit} disabled={isLoading || (!isEditing && !formData.habilidad_id)}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Wrench className="mr-2 h-4 w-4" />
            {isEditing ? 'Actualizar' : 'Asignar'}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Habilidad' : 'Asignar Habilidad'}
      size="md"
      footer={footer}
      disableClose={isLoading}
    >
      <div className="space-y-4">
        {/* Selector de habilidad (solo para crear) */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Habilidad *
            </label>

            {/* Habilidad seleccionada */}
            {selectedHabilidad && (
              <div className="mb-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-500 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedHabilidad.nombre}
                    </span>
                    <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                      {getCategoriaConfig(selectedHabilidad.categoria).label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, habilidad_id: null }))}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            )}

            {/* Búsqueda y lista */}
            {!selectedHabilidad && !showNewForm && (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar habilidad..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {loadingCatalogo ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      {catalogoFiltrado.length === 0 ? (
                        <div className="p-3 text-center text-sm text-gray-500">
                          No se encontraron habilidades
                        </div>
                      ) : (
                        catalogoFiltrado.map(hab => {
                          const cat = getCategoriaConfig(hab.categoria);
                          return (
                            <button
                              key={hab.id}
                              type="button"
                              onClick={() => handleSelectHabilidad(hab)}
                              className="w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-800 last:border-0 flex items-center justify-between"
                            >
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {hab.nombre}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700`}>
                                {cat.label}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNewForm(true)}
                      className="mt-2 w-full flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 py-2"
                    >
                      <Plus className="h-4 w-4" />
                      Crear nueva habilidad en catálogo
                    </button>
                  </>
                )}
              </>
            )}

            {/* Formulario nueva habilidad */}
            {!selectedHabilidad && showNewForm && (
              <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg space-y-3">
                <Input
                  label="Nombre de la habilidad"
                  value={newHabilidad.nombre}
                  onChange={(e) => setNewHabilidad(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: React, Liderazgo, Inglés..."
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newHabilidad.categoria}
                    onChange={(e) => setNewHabilidad(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {CATEGORIAS_HABILIDAD.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowNewForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCrearNueva}
                    disabled={crearCatalogoMutation.isPending}
                  >
                    {crearCatalogoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Crear y Seleccionar'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {errors.habilidad_id && (
              <p className="mt-1 text-sm text-red-500">{errors.habilidad_id}</p>
            )}
          </div>
        )}

        {/* Info de habilidad (solo para editar) */}
        {isEditing && habilidadEmpleado && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {habilidadEmpleado.habilidad?.nombre || 'Habilidad'}
            </span>
            {habilidadEmpleado.habilidad?.categoria && (
              <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                {getCategoriaConfig(habilidadEmpleado.habilidad.categoria).label}
              </span>
            )}
          </div>
        )}

        {/* Nivel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nivel de Dominio *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {NIVELES_HABILIDAD.map(nivel => (
              <button
                key={nivel.value}
                type="button"
                onClick={() => handleInputChange('nivel', nivel.value)}
                className={`p-2 text-center rounded-lg border transition-colors ${
                  formData.nivel === nivel.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="text-sm font-medium">{nivel.label}</div>
                <div className="text-xs text-gray-500">{nivel.porcentaje}%</div>
              </button>
            ))}
          </div>
        </div>

        {/* Años de experiencia */}
        <Input
          type="number"
          min="0"
          max="50"
          label="Años de Experiencia"
          value={formData.anios_experiencia}
          onChange={(e) => handleInputChange('anios_experiencia', e.target.value)}
        />

        {/* Certificaciones */}
        <Input
          label="Certificaciones relacionadas"
          value={formData.certificaciones}
          onChange={(e) => handleInputChange('certificaciones', e.target.value)}
          placeholder="Ej: AWS Certified, SCRUM Master..."
        />

        {/* Notas */}
        <Textarea
          label="Notas adicionales"
          value={formData.notas}
          onChange={(e) => handleInputChange('notas', e.target.value)}
          placeholder="Observaciones o contexto adicional..."
          rows={2}
        />
      </div>
    </Modal>
  );
}
