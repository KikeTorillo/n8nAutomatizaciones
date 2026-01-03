/**
 * ExperienciaModal - Modal para crear/editar experiencia laboral
 * Fase 4 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Loader2, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  useCrearExperiencia,
  useActualizarExperiencia
} from '@/hooks/useExperienciaLaboral';

const INITIAL_FORM_DATA = {
  empresa: '',
  puesto: '',
  fecha_inicio: '',
  fecha_fin: '',
  empleo_actual: false,
  descripcion: '',
  ubicacion: '',
  tipo_empleo: 'tiempo_completo',
  sector_industria: ''
};

const TIPOS_EMPLEO = [
  { value: 'tiempo_completo', label: 'Tiempo completo' },
  { value: 'medio_tiempo', label: 'Medio tiempo' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'contrato', label: 'Contrato temporal' },
  { value: 'practicas', label: 'Prácticas/Becario' },
  { value: 'voluntariado', label: 'Voluntariado' }
];

export default function ExperienciaModal({
  isOpen,
  onClose,
  profesionalId,
  experiencia = null,
  onSuccess
}) {
  const toast = useToast();
  const isEditing = !!experiencia;

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});

  const crearMutation = useCrearExperiencia();
  const actualizarMutation = useActualizarExperiencia();

  const isLoading = crearMutation.isPending || actualizarMutation.isPending;

  // Cargar datos al editar
  useEffect(() => {
    if (isOpen && experiencia) {
      setFormData({
        empresa: experiencia.empresa || '',
        puesto: experiencia.puesto || '',
        fecha_inicio: experiencia.fecha_inicio ? experiencia.fecha_inicio.slice(0, 10) : '',
        fecha_fin: experiencia.fecha_fin ? experiencia.fecha_fin.slice(0, 10) : '',
        empleo_actual: experiencia.empleo_actual || false,
        descripcion: experiencia.descripcion || '',
        ubicacion: experiencia.ubicacion || '',
        tipo_empleo: experiencia.tipo_empleo || 'tiempo_completo',
        sector_industria: experiencia.sector_industria || ''
      });
    } else if (isOpen && !experiencia) {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [isOpen, experiencia]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Si marca empleo actual, limpiar fecha fin
      if (field === 'empleo_actual' && value) {
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

    if (!formData.empresa?.trim()) {
      newErrors.empresa = 'El nombre de la empresa es requerido';
    }

    if (!formData.puesto?.trim()) {
      newErrors.puesto = 'El puesto es requerido';
    }

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es requerida';
    }

    if (!formData.empleo_actual && !formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es requerida si no es empleo actual';
    }

    if (formData.fecha_inicio && formData.fecha_fin) {
      if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
        newErrors.fecha_fin = 'La fecha de fin no puede ser anterior a la de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const dataToSend = {
      empresa: formData.empresa.trim(),
      puesto: formData.puesto.trim(),
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.empleo_actual ? null : (formData.fecha_fin || null),
      empleo_actual: formData.empleo_actual,
      descripcion: formData.descripcion?.trim() || null,
      ubicacion: formData.ubicacion?.trim() || null,
      tipo_empleo: formData.tipo_empleo,
      sector_industria: formData.sector_industria?.trim() || null
    };

    try {
      if (isEditing) {
        await actualizarMutation.mutateAsync({
          profesionalId,
          experienciaId: experiencia.id,
          data: dataToSend
        });
        toast.success('Experiencia actualizada');
      } else {
        await crearMutation.mutateAsync({
          profesionalId,
          data: dataToSend
        });
        toast.success('Experiencia agregada');
      }

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar experiencia');
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
            <Briefcase className="mr-2 h-4 w-4" />
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
      title={isEditing ? 'Editar Experiencia Laboral' : 'Nueva Experiencia Laboral'}
      size="md"
      footer={footer}
      disableClose={isLoading}
    >
      <div className="space-y-4">
        {/* Empresa y Puesto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Empresa *"
            value={formData.empresa}
            onChange={(e) => handleInputChange('empresa', e.target.value)}
            placeholder="Nombre de la empresa"
            error={errors.empresa}
          />
          <Input
            label="Puesto *"
            value={formData.puesto}
            onChange={(e) => handleInputChange('puesto', e.target.value)}
            placeholder="Cargo o posición"
            error={errors.puesto}
          />
        </div>

        {/* Tipo de empleo y ubicación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Empleo
            </label>
            <select
              value={formData.tipo_empleo}
              onChange={(e) => handleInputChange('tipo_empleo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {TIPOS_EMPLEO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Ubicación"
            value={formData.ubicacion}
            onChange={(e) => handleInputChange('ubicacion', e.target.value)}
            placeholder="Ciudad, País"
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
            disabled={formData.empleo_actual}
            error={errors.fecha_fin}
          />
        </div>

        {/* Checkbox empleo actual */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.empleo_actual}
            onChange={(e) => handleInputChange('empleo_actual', e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Trabajo aquí actualmente
          </span>
        </label>

        {/* Sector/Industria */}
        <Input
          label="Sector / Industria"
          value={formData.sector_industria}
          onChange={(e) => handleInputChange('sector_industria', e.target.value)}
          placeholder="Ej: Tecnología, Salud, Educación..."
        />

        {/* Descripción */}
        <Textarea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          placeholder="Describe tus responsabilidades y logros principales..."
          rows={4}
        />
      </div>
    </Modal>
  );
}
