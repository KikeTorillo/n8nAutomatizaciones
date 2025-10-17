import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Palette } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/forms/FormField';
import { useCrearProfesional, useActualizarProfesional, useProfesional } from '@/hooks/useProfesionales';
import { useToast } from '@/hooks/useToast';

/**
 * Colores predefinidos para el calendario
 */
const COLORES_CALENDARIO = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
];

/**
 * Schema de validación Zod para CREAR profesional
 */
const profesionalCreateSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  tipo_profesional: z.string().max(50, 'Máximo 50 caracteres').optional(),
  email: z.string().email('Email inválido').max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  telefono: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, 'Formato de teléfono inválido').optional().or(z.literal('')),
  color_calendario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').default('#3b82f6'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  activo: z.boolean().default(true),
});

/**
 * Schema de validación Zod para EDITAR profesional
 */
const profesionalEditSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres').optional(),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres').optional(),
  tipo_profesional: z.string().max(50, 'Máximo 50 caracteres').optional(),
  email: z.string().email('Email inválido').max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  telefono: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, 'Formato de teléfono inválido').optional().or(z.literal('')),
  color_calendario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido').optional(),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  activo: z.boolean().optional(),
}).refine((data) => {
  return Object.keys(data).some(key => data[key] !== undefined && data[key] !== '');
}, {
  message: 'Debes modificar al menos un campo',
});

/**
 * Modal de formulario para crear y editar profesionales
 * @param {string} mode - 'create' o 'edit'
 * @param {object|null} profesional - Datos del profesional a editar (solo en modo edit)
 */
function ProfesionalFormModal({ isOpen, onClose, mode = 'create', profesional = null }) {
  const toast = useToast();
  const [selectedColor, setSelectedColor] = useState(COLORES_CALENDARIO[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const isEditMode = mode === 'edit';
  const profesionalId = profesional?.id;

  // Fetch datos del profesional en modo edición
  const { data: profesionalData, isLoading: loadingProfesional } = useProfesional(profesionalId);

  // Hooks de mutación
  const crearMutation = useCrearProfesional();
  const actualizarMutation = useActualizarProfesional();

  // React Hook Form con validación Zod
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditMode ? profesionalEditSchema : profesionalCreateSchema),
    defaultValues: isEditMode
      ? {}
      : {
          nombre: '',
          apellidos: '',
          tipo_profesional: '',
          email: '',
          telefono: '',
          color_calendario: COLORES_CALENDARIO[0],
          descripcion: '',
          activo: true,
        },
  });

  // Reset formulario cuando cambia el modo (create/edit)
  useEffect(() => {
    if (isOpen) {
      if (!isEditMode) {
        // Modo creación: resetear a valores vacíos
        reset({
          nombre: '',
          apellidos: '',
          tipo_profesional: '',
          email: '',
          telefono: '',
          color_calendario: COLORES_CALENDARIO[0],
          descripcion: '',
          activo: true,
        });
        setSelectedColor(COLORES_CALENDARIO[0]);
      }
    }
  }, [isOpen, isEditMode, profesionalId, reset]);

  // Pre-cargar datos del profesional en modo edición
  useEffect(() => {
    if (isEditMode && profesionalData && isOpen) {
      // Dividir nombre_completo en nombre y apellidos
      const nombreCompleto = profesionalData.nombre_completo || '';
      const partes = nombreCompleto.split(' ');
      const nombre = partes[0] || '';
      const apellidos = partes.slice(1).join(' ') || '';

      reset({
        nombre,
        apellidos,
        tipo_profesional: profesionalData.tipo_profesional || '',
        email: profesionalData.email || '',
        telefono: profesionalData.telefono || '',
        color_calendario: profesionalData.color_calendario || COLORES_CALENDARIO[0],
        descripcion: profesionalData.biografia || '', // Backend usa 'biografia'
        activo: profesionalData.activo !== undefined ? profesionalData.activo : true,
      });
      setSelectedColor(profesionalData.color_calendario || COLORES_CALENDARIO[0]);
    }
  }, [isEditMode, profesionalData, isOpen, reset]);

  // Reset form cuando cierra el modal
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedColor(COLORES_CALENDARIO[0]);
      setShowColorPicker(false);
    }
  }, [isOpen, reset]);

  // Handler para seleccionar color
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setValue('color_calendario', color);
    setShowColorPicker(false);
  };

  // Handler de submit
  const onSubmit = async (data) => {
    try {
      // Combinar nombre y apellidos en nombre_completo (backend usa este campo)
      const nombre_completo = `${data.nombre || ''} ${data.apellidos || ''}`.trim();

      // Sanitizar campos opcionales vacíos
      const sanitized = {
        nombre_completo,
        tipo_profesional: data.tipo_profesional?.trim() || undefined,
        email: data.email?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        color_calendario: data.color_calendario,
        biografia: data.descripcion?.trim() || undefined, // Backend usa 'biografia'
        activo: data.activo,
      };

      if (isEditMode) {
        // Modo edición
        await actualizarMutation.mutateAsync({ id: profesionalId, data: sanitized });
        toast.success('Profesional actualizado exitosamente');
      } else {
        // Modo creación
        await crearMutation.mutateAsync(sanitized);
        toast.success('Profesional creado exitosamente');
      }

      onClose();
      reset();
      setSelectedColor(COLORES_CALENDARIO[0]);
    } catch (error) {
      toast.error(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} profesional`);
    }
  };

  // Loading state durante fetch de datos
  const isLoadingData = isEditMode && loadingProfesional;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Profesional' : 'Nuevo Profesional'}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header con icono */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: selectedColor }}
          >
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditMode ? 'Editar Profesional' : 'Crear Nuevo Profesional'}
            </h3>
            <p className="text-sm text-gray-600">
              {isEditMode
                ? 'Modifica los datos del profesional'
                : 'Completa la información del profesional'}
            </p>
          </div>
        </div>

        {/* Loading state durante fetch de datos en modo edición */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-600">Cargando datos del profesional...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Campos del formulario */}
            <div className="space-y-4">
              {/* Nombre y Apellidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="nombre"
                  control={control}
                  label="Nombre"
                  placeholder="Ej: Juan"
                  required={!isEditMode}
                />
                <FormField
                  name="apellidos"
                  control={control}
                  label="Apellidos"
                  placeholder="Ej: Pérez"
                  required={!isEditMode}
                />
              </div>

              {/* Tipo de Profesional */}
              <FormField
                name="tipo_profesional"
                control={control}
                label="Tipo de Profesional (Opcional)"
                placeholder="Ej: Barbero, Estilista"
              />

              {/* Email y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="email"
                  control={control}
                  label="Email (Opcional)"
                  type="email"
                  placeholder="ejemplo@correo.com"
                />
                <FormField
                  name="telefono"
                  control={control}
                  label="Teléfono (Opcional)"
                  placeholder="+57 300 123 4567"
                />
              </div>

              {/* Selector de Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color para Calendario
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-12 h-12 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <Palette className="w-5 h-5 text-white" />
                  </button>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Color seleccionado: <span className="font-mono font-medium">{selectedColor}</span>
                    </p>
                  </div>
                </div>

                {/* Paleta de colores */}
                {showColorPicker && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-6 gap-2">
                      {COLORES_CALENDARIO.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorSelect(color)}
                          className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                            selectedColor === color
                              ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {errors.color_calendario && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.color_calendario.message}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción (Opcional)
                    </label>
                    <textarea
                      {...field}
                      id="descripcion"
                      rows={3}
                      placeholder="Información adicional sobre el profesional..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    {errors.descripcion && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.descripcion.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Estado Activo */}
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                    <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                      Profesional activo
                    </label>
                  </div>
                )}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={crearMutation.isPending || actualizarMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={crearMutation.isPending || actualizarMutation.isPending}
                disabled={crearMutation.isPending || actualizarMutation.isPending}
              >
                {isEditMode
                  ? actualizarMutation.isPending
                    ? 'Actualizando...'
                    : 'Actualizar Profesional'
                  : crearMutation.isPending
                    ? 'Creando...'
                    : 'Crear Profesional'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

export default ProfesionalFormModal;
