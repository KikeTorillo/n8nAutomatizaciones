/**
 * EducacionModal - Modal para crear/editar educación formal
 * Fase 4 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Loader2, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  useCrearEducacion,
  useActualizarEducacion,
  NIVELES_EDUCACION
} from '@/hooks/useEducacionFormal';

const INITIAL_FORM_DATA = {
  institucion: '',
  titulo: '',
  nivel: 'licenciatura',
  campo_estudio: '',
  fecha_inicio: '',
  fecha_fin: '',
  en_curso: false,
  promedio: '',
  descripcion: '',
  ubicacion: ''
};

export default function EducacionModal({
  isOpen,
  onClose,
  profesionalId,
  educacion = null,
  onSuccess
}) {
  const toast = useToast();
  const isEditing = !!educacion;

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});

  const crearMutation = useCrearEducacion();
  const actualizarMutation = useActualizarEducacion();

  const isLoading = crearMutation.isPending || actualizarMutation.isPending;

  // Cargar datos al editar
  useEffect(() => {
    if (isOpen && educacion) {
      setFormData({
        institucion: educacion.institucion || '',
        titulo: educacion.titulo || '',
        nivel: educacion.nivel || 'licenciatura',
        campo_estudio: educacion.campo_estudio || '',
        fecha_inicio: educacion.fecha_inicio ? educacion.fecha_inicio.slice(0, 10) : '',
        fecha_fin: educacion.fecha_fin ? educacion.fecha_fin.slice(0, 10) : '',
        en_curso: educacion.en_curso || false,
        promedio: educacion.promedio || '',
        descripcion: educacion.descripcion || '',
        ubicacion: educacion.ubicacion || ''
      });
    } else if (isOpen && !educacion) {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [isOpen, educacion]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Si marca en curso, limpiar fecha fin
      if (field === 'en_curso' && value) {
        newData.fecha_fin = '';
      }
      return newData;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.institucion?.trim()) {
      newErrors.institucion = 'La institución es requerida';
    }

    if (!formData.titulo?.trim()) {
      newErrors.titulo = 'El título/carrera es requerido';
    }

    if (!formData.nivel) {
      newErrors.nivel = 'El nivel es requerido';
    }

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    }

    if (formData.fecha_inicio && formData.fecha_fin) {
      if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
        newErrors.fecha_fin = 'La fecha de fin no puede ser anterior a la de inicio';
      }
    }

    if (formData.promedio) {
      const promedio = parseFloat(formData.promedio);
      if (isNaN(promedio) || promedio < 0 || promedio > 10) {
        newErrors.promedio = 'El promedio debe ser un número entre 0 y 10';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const dataToSend = {
      institucion: formData.institucion.trim(),
      titulo: formData.titulo.trim(),
      nivel: formData.nivel,
      campo_estudio: formData.campo_estudio?.trim() || null,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.en_curso ? null : (formData.fecha_fin || null),
      en_curso: formData.en_curso,
      promedio: formData.promedio ? parseFloat(formData.promedio) : null,
      descripcion: formData.descripcion?.trim() || null,
      ubicacion: formData.ubicacion?.trim() || null
    };

    try {
      if (isEditing) {
        await actualizarMutation.mutateAsync({
          profesionalId,
          educacionId: educacion.id,
          data: dataToSend
        });
        toast.success('Educación actualizada');
      } else {
        await crearMutation.mutateAsync({
          profesionalId,
          data: dataToSend
        });
        toast.success('Educación agregada');
      }

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar educación');
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <GraduationCap className="mr-2 h-4 w-4" />
            {isEditing ? 'Actualizar' : 'Guardar'}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Educación' : 'Nueva Educación'}
      size="md"
      footer={footer}
      disableClose={isLoading}
    >
      <div className="space-y-4">
        {/* Institución y Título */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Institución *"
            value={formData.institucion}
            onChange={(e) => handleInputChange('institucion', e.target.value)}
            placeholder="Universidad, Instituto, Escuela..."
            error={errors.institucion}
          />
          <Input
            label="Título / Carrera *"
            value={formData.titulo}
            onChange={(e) => handleInputChange('titulo', e.target.value)}
            placeholder="Nombre del título o carrera"
            error={errors.titulo}
          />
        </div>

        {/* Nivel y Campo de estudio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nivel de Educación *
            </label>
            <select
              value={formData.nivel}
              onChange={(e) => handleInputChange('nivel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {NIVELES_EDUCACION.map(nivel => (
                <option key={nivel.value} value={nivel.value}>{nivel.label}</option>
              ))}
            </select>
            {errors.nivel && (
              <p className="mt-1 text-sm text-red-500">{errors.nivel}</p>
            )}
          </div>
          <Input
            label="Campo de Estudio"
            value={formData.campo_estudio}
            onChange={(e) => handleInputChange('campo_estudio', e.target.value)}
            placeholder="Ej: Ciencias de la Computación"
          />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Fecha de Inicio *"
            value={formData.fecha_inicio}
            onChange={(e) => handleInputChange('fecha_inicio', e.target.value)}
            error={errors.fecha_inicio}
          />
          <Input
            type="date"
            label="Fecha de Fin"
            value={formData.fecha_fin}
            onChange={(e) => handleInputChange('fecha_fin', e.target.value)}
            disabled={formData.en_curso}
            error={errors.fecha_fin}
          />
        </div>

        {/* Checkbox en curso */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.en_curso}
            onChange={(e) => handleInputChange('en_curso', e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Actualmente estudio aquí
          </span>
        </label>

        {/* Promedio y Ubicación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Promedio"
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.promedio}
            onChange={(e) => handleInputChange('promedio', e.target.value)}
            placeholder="0.0 - 10.0"
            error={errors.promedio}
          />
          <Input
            label="Ubicación"
            value={formData.ubicacion}
            onChange={(e) => handleInputChange('ubicacion', e.target.value)}
            placeholder="Ciudad, País"
          />
        </div>

        {/* Descripción */}
        <Textarea
          label="Descripción / Logros"
          value={formData.descripcion}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          placeholder="Actividades destacadas, reconocimientos, proyectos..."
          rows={3}
        />
      </div>
    </Modal>
  );
}
