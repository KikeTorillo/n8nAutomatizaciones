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
import {
  Button,
  Drawer,
  FormGroup,
  Input,
  Textarea
} from '@/components/ui';
import { Loader2, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/utils';
import {
  useCrearExperiencia,
  useActualizarExperiencia,
} from '@/hooks/personas';
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
          <FormGroup label="Empresa" required error={errors.empresa?.message}>
            <Input
              placeholder="Nombre de la empresa"
              hasError={!!errors.empresa}
              {...register('empresa')}
            />
          </FormGroup>
          <FormGroup label="Puesto" required error={errors.puesto?.message}>
            <Input
              placeholder="Cargo o posicion"
              hasError={!!errors.puesto}
              {...register('puesto')}
            />
          </FormGroup>
        </div>

        {/* Tipo de empleo y ubicacion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup label="Tipo de Empleo">
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
          </FormGroup>
          <FormGroup label="Ubicacion" error={errors.ubicacion?.message}>
            <Input
              placeholder="Ciudad, Pais"
              hasError={!!errors.ubicacion}
              {...register('ubicacion')}
            />
          </FormGroup>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormGroup label="Fecha de Inicio" required error={errors.fecha_inicio?.message}>
            <Input
              type="date"
              hasError={!!errors.fecha_inicio}
              {...register('fecha_inicio')}
            />
          </FormGroup>
          <FormGroup label="Fecha de Fin" error={errors.fecha_fin?.message}>
            <Input
              type="date"
              disabled={empleoActual}
              hasError={!!errors.fecha_fin}
              {...register('fecha_fin')}
            />
          </FormGroup>
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
        <FormGroup label="Sector / Industria" error={errors.sector_industria?.message}>
          <Input
            placeholder="Ej: Tecnologia, Salud, Educacion..."
            hasError={!!errors.sector_industria}
            {...register('sector_industria')}
          />
        </FormGroup>

        {/* Descripcion */}
        <FormGroup label="Descripcion" error={errors.descripcion?.message}>
          <Textarea
            placeholder="Describe tus responsabilidades y logros principales..."
            rows={4}
            hasError={!!errors.descripcion}
            {...register('descripcion')}
          />
        </FormGroup>

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
