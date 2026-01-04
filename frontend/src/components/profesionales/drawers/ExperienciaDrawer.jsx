/**
 * ====================================================================
 * ExperienciaDrawer - Drawer para crear/editar experiencia laboral
 * ====================================================================
 *
 * Migrado a React Hook Form + Zod - Enero 2026
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Loader2, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  useCrearExperiencia,
  useActualizarExperiencia,
} from '@/hooks/useExperienciaLaboral';
import { experienciaSchema } from '@/schemas/profesionales.schemas';

// ====================================================================
// CONSTANTES
// ====================================================================

const TIPOS_EMPLEO = [
  { value: 'tiempo_completo', label: 'Tiempo completo' },
  { value: 'medio_tiempo', label: 'Medio tiempo' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'contrato', label: 'Contrato temporal' },
  { value: 'practicas', label: 'Practicas/Becario' },
  { value: 'voluntariado', label: 'Voluntariado' },
];

const DEFAULT_VALUES = {
  empresa: '',
  puesto: '',
  fecha_inicio: '',
  fecha_fin: '',
  empleo_actual: false,
  descripcion: '',
  ubicacion: '',
  tipo_empleo: 'tiempo_completo',
  sector_industria: '',
};

// ====================================================================
// COMPONENTE
// ====================================================================

export default function ExperienciaDrawer({
  isOpen,
  onClose,
  profesionalId,
  experiencia = null,
  onSuccess,
}) {
  const toast = useToast();
  const isEditing = !!experiencia;

  // Mutations
  const crearMutation = useCrearExperiencia();
  const actualizarMutation = useActualizarExperiencia();
  const isLoading = crearMutation.isPending || actualizarMutation.isPending;

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(experienciaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Observar empleo_actual para limpiar fecha_fin
  const empleoActual = watch('empleo_actual');

  // Limpiar fecha_fin cuando se marca empleo_actual
  useEffect(() => {
    if (empleoActual) {
      setValue('fecha_fin', '', { shouldValidate: false });
    }
  }, [empleoActual, setValue]);

  // Reset form cuando cambia isOpen o experiencia
  useEffect(() => {
    if (isOpen) {
      if (isEditing && experiencia) {
        reset({
          empresa: experiencia.empresa || '',
          puesto: experiencia.puesto || '',
          fecha_inicio: experiencia.fecha_inicio
            ? experiencia.fecha_inicio.slice(0, 10)
            : '',
          fecha_fin: experiencia.fecha_fin
            ? experiencia.fecha_fin.slice(0, 10)
            : '',
          empleo_actual: experiencia.empleo_actual || false,
          descripcion: experiencia.descripcion || '',
          ubicacion: experiencia.ubicacion || '',
          tipo_empleo: experiencia.tipo_empleo || 'tiempo_completo',
          sector_industria: experiencia.sector_industria || '',
        });
      } else {
        reset(DEFAULT_VALUES);
      }
    }
  }, [isOpen, isEditing, experiencia, reset]);

  // Submit handler
  const onSubmit = async (data) => {
    const dataToSend = {
      empresa: data.empresa,
      puesto: data.puesto,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.empleo_actual ? null : data.fecha_fin || null,
      empleo_actual: data.empleo_actual,
      descripcion: data.descripcion || null,
      ubicacion: data.ubicacion || null,
      tipo_empleo: data.tipo_empleo,
      sector_industria: data.sector_industria || null,
    };

    try {
      if (isEditing) {
        await actualizarMutation.mutateAsync({
          profesionalId,
          experienciaId: experiencia.id,
          data: dataToSend,
        });
        toast.success('Experiencia actualizada');
      } else {
        await crearMutation.mutateAsync({
          profesionalId,
          data: dataToSend,
        });
        toast.success('Experiencia agregada');
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar experiencia');
    }
  };

  const handleClose = () => {
    reset(DEFAULT_VALUES);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Experiencia Laboral' : 'Nueva Experiencia Laboral'}
      subtitle="Informacion sobre empleos anteriores"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Empresa y Puesto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Empresa *"
            placeholder="Nombre de la empresa"
            error={errors.empresa?.message}
            {...register('empresa')}
          />
          <Input
            label="Puesto *"
            placeholder="Cargo o posicion"
            error={errors.puesto?.message}
            {...register('puesto')}
          />
        </div>

        {/* Tipo de empleo y ubicacion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Empleo
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              {...register('tipo_empleo')}
            >
              {TIPOS_EMPLEO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Ubicacion"
            placeholder="Ciudad, Pais"
            error={errors.ubicacion?.message}
            {...register('ubicacion')}
          />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Fecha de Inicio *"
            error={errors.fecha_inicio?.message}
            {...register('fecha_inicio')}
          />
          <Input
            type="date"
            label="Fecha de Fin"
            disabled={empleoActual}
            error={errors.fecha_fin?.message}
            {...register('fecha_fin')}
          />
        </div>

        {/* Checkbox empleo actual */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            {...register('empleo_actual')}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Trabajo aqui actualmente
          </span>
        </label>

        {/* Sector/Industria */}
        <Input
          label="Sector / Industria"
          placeholder="Ej: Tecnologia, Salud, Educacion..."
          error={errors.sector_industria?.message}
          {...register('sector_industria')}
        />

        {/* Descripcion */}
        <Textarea
          label="Descripcion"
          placeholder="Describe tus responsabilidades y logros principales..."
          rows={4}
          error={errors.descripcion?.message}
          {...register('descripcion')}
        />

        {/* Footer con botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
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
      </form>
    </Drawer>
  );
}
