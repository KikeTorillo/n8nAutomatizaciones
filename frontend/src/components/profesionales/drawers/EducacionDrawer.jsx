/**
 * ====================================================================
 * EducacionDrawer - Drawer para crear/editar educacion formal
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
  Input,
  Textarea
} from '@/components/ui';
import { Loader2, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  useCrearEducacion,
  useActualizarEducacion,
  NIVELES_EDUCACION,
} from '@/hooks/useEducacionFormal';
import { educacionSchema } from '@/schemas/profesionales.schemas';

// ====================================================================
// DEFAULT VALUES
// ====================================================================

const DEFAULT_VALUES = {
  institucion: '',
  titulo: '',
  nivel: 'licenciatura',
  campo_estudio: '',
  fecha_inicio: '',
  fecha_fin: '',
  en_curso: false,
  promedio: '',
  descripcion: '',
  ubicacion: '',
};

// ====================================================================
// COMPONENTE
// ====================================================================

export default function EducacionDrawer({
  isOpen,
  onClose,
  profesionalId,
  educacion = null,
  onSuccess,
}) {
  const toast = useToast();
  const isEditing = !!educacion;

  // Mutations
  const crearMutation = useCrearEducacion();
  const actualizarMutation = useActualizarEducacion();
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
    resolver: zodResolver(educacionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Observar en_curso para limpiar fecha_fin
  const enCurso = watch('en_curso');

  // Limpiar fecha_fin cuando se marca en_curso
  useEffect(() => {
    if (enCurso) {
      setValue('fecha_fin', '', { shouldValidate: false });
    }
  }, [enCurso, setValue]);

  // Reset form cuando cambia isOpen o educacion
  useEffect(() => {
    if (isOpen) {
      if (isEditing && educacion) {
        reset({
          institucion: educacion.institucion || '',
          titulo: educacion.titulo || '',
          nivel: educacion.nivel || 'licenciatura',
          campo_estudio: educacion.campo_estudio || '',
          fecha_inicio: educacion.fecha_inicio
            ? educacion.fecha_inicio.slice(0, 10)
            : '',
          fecha_fin: educacion.fecha_fin
            ? educacion.fecha_fin.slice(0, 10)
            : '',
          en_curso: educacion.en_curso || false,
          promedio: educacion.promedio || '',
          descripcion: educacion.descripcion || '',
          ubicacion: educacion.ubicacion || '',
        });
      } else {
        reset(DEFAULT_VALUES);
      }
    }
  }, [isOpen, isEditing, educacion, reset]);

  // Submit handler
  const onSubmit = async (data) => {
    const dataToSend = {
      institucion: data.institucion,
      titulo: data.titulo,
      nivel: data.nivel,
      campo_estudio: data.campo_estudio || null,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.en_curso ? null : data.fecha_fin || null,
      en_curso: data.en_curso,
      promedio: data.promedio || null,
      descripcion: data.descripcion || null,
      ubicacion: data.ubicacion || null,
    };

    try {
      if (isEditing) {
        await actualizarMutation.mutateAsync({
          profesionalId,
          educacionId: educacion.id,
          data: dataToSend,
        });
        toast.success('Educacion actualizada');
      } else {
        await crearMutation.mutateAsync({
          profesionalId,
          data: dataToSend,
        });
        toast.success('Educacion agregada');
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar educacion');
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
      title={isEditing ? 'Editar Educacion' : 'Nueva Educacion'}
      subtitle="Informacion sobre estudios formales"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Institucion y Titulo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Institucion *"
            placeholder="Universidad, Instituto, Escuela..."
            error={errors.institucion?.message}
            {...register('institucion')}
          />
          <Input
            label="Titulo / Carrera *"
            placeholder="Nombre del titulo o carrera"
            error={errors.titulo?.message}
            {...register('titulo')}
          />
        </div>

        {/* Nivel y Campo de estudio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nivel de Educacion *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              {...register('nivel')}
            >
              {NIVELES_EDUCACION.map((nivel) => (
                <option key={nivel.value} value={nivel.value}>
                  {nivel.label}
                </option>
              ))}
            </select>
            {errors.nivel && (
              <p className="mt-1 text-sm text-red-500">
                {errors.nivel.message}
              </p>
            )}
          </div>
          <Input
            label="Campo de Estudio"
            placeholder="Ej: Ciencias de la Computacion"
            error={errors.campo_estudio?.message}
            {...register('campo_estudio')}
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
            disabled={enCurso}
            error={errors.fecha_fin?.message}
            {...register('fecha_fin')}
          />
        </div>

        {/* Checkbox en curso */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            {...register('en_curso')}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Actualmente estudio aqui
          </span>
        </label>

        {/* Promedio y Ubicacion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Promedio"
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="0.0 - 10.0"
            error={errors.promedio?.message}
            {...register('promedio')}
          />
          <Input
            label="Ubicacion"
            placeholder="Ciudad, Pais"
            error={errors.ubicacion?.message}
            {...register('ubicacion')}
          />
        </div>

        {/* Descripcion */}
        <Textarea
          label="Descripcion / Logros"
          placeholder="Actividades destacadas, reconocimientos, proyectos..."
          rows={3}
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
                <GraduationCap className="mr-2 h-4 w-4" />
                {isEditing ? 'Actualizar' : 'Guardar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
