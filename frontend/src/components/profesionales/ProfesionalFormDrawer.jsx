import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Link2, Info } from 'lucide-react';
import {
  Button,
  Drawer,
  FormGroup,
  Input,
  Select,
} from '@/components/ui';
import UsuarioSelector from './UsuarioSelector';
import { useCrearProfesional, useActualizarProfesional, useProfesional, TIPOS_CONTRATACION } from '@/hooks/personas';
import { useDepartamentos, usePuestos } from '@/hooks/personas';
import { useToast } from '@/hooks/utils';

/**
 * Schema de validacion para crear profesional
 */
const profesionalSchema = z.object({
  nombre_completo: z.string().min(2, 'Minimo 2 caracteres').max(150, 'Maximo 150 caracteres'),
  telefono: z.string().max(20, 'Maximo 20 caracteres').optional().or(z.literal('')),
  departamento_id: z.union([z.number(), z.string()]).optional().transform(val => {
    if (!val || val === '') return undefined;
    return typeof val === 'string' ? parseInt(val, 10) : val;
  }),
  puesto_id: z.union([z.number(), z.string()]).optional().transform(val => {
    if (!val || val === '') return undefined;
    return typeof val === 'string' ? parseInt(val, 10) : val;
  }),
  tipo_contratacion: z.string().optional(),
  usuario_id: z.number().nullable().optional(),
});

/**
 * Drawer para crear/editar profesionales
 * Reemplaza el wizard de 3 pasos por un formulario simple
 */
function ProfesionalFormDrawer({ isOpen, onClose, mode = 'create', profesionalId = null }) {
  const toast = useToast();
  const isEditMode = mode === 'edit';

  // Estado para usuario seleccionado
  const [usuarioId, setUsuarioId] = useState(null);

  // Datos para selects
  const { data: departamentos = [] } = useDepartamentos({ activo: true });
  const { data: puestos = [] } = usePuestos({ activo: true });

  // Fetch datos del profesional en modo edicion
  const { data: profesionalData, isLoading: loadingProfesional } = useProfesional(profesionalId, {
    enabled: isOpen && isEditMode && !!profesionalId,
  });

  // Mutations
  const crearMutation = useCrearProfesional();
  const actualizarMutation = useActualizarProfesional();

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profesionalSchema),
    defaultValues: {
      nombre_completo: '',
      telefono: '',
      departamento_id: '',
      puesto_id: '',
      tipo_contratacion: 'tiempo_completo',
      usuario_id: null,
    },
  });

  // Cargar datos en modo edicion
  useEffect(() => {
    if (isEditMode && profesionalData && isOpen) {
      reset({
        nombre_completo: profesionalData.nombre_completo || '',
        telefono: profesionalData.telefono || '',
        departamento_id: profesionalData.departamento_id || '',
        puesto_id: profesionalData.puesto_id || '',
        tipo_contratacion: profesionalData.tipo_contratacion || 'tiempo_completo',
        usuario_id: profesionalData.usuario_id || null,
      });
      setUsuarioId(profesionalData.usuario_id || null);
    }
  }, [isEditMode, profesionalData, isOpen, reset]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      reset();
      setUsuarioId(null);
    }
  }, [isOpen, reset]);

  // Submit
  const onSubmit = async (data) => {
    try {
      const payload = {
        nombre_completo: data.nombre_completo.trim(),
        telefono: data.telefono?.trim() || undefined,
        departamento_id: data.departamento_id || undefined,
        puesto_id: data.puesto_id || undefined,
        tipo_contratacion: data.tipo_contratacion || undefined,
        usuario_id: usuarioId || undefined,
      };

      if (isEditMode) {
        await actualizarMutation.mutateAsync({ id: profesionalId, data: payload });
        toast.success('Profesional actualizado correctamente');
      } else {
        const result = await crearMutation.mutateAsync(payload);
        if (result._warning) {
          toast.warning(result._warning);
        } else if (usuarioId) {
          toast.success('Profesional creado y vinculado correctamente');
        } else {
          toast.success('Profesional creado correctamente');
        }
      }

      onClose();
      reset();
      setUsuarioId(null);
    } catch (error) {
      toast.error(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} profesional`);
    }
  };

  const isLoadingData = isEditMode && loadingProfesional;
  const isSubmitting = crearMutation.isPending || actualizarMutation.isPending;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Profesional' : 'Nuevo Profesional'}
      subtitle={isEditMode
        ? 'Modifica los datos del profesional'
        : 'Completa la informacion del profesional'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header con icono */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isEditMode ? 'Editando profesional' : 'Registra un nuevo profesional'}
            </p>
          </div>
        </div>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando datos...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Nombre completo */}
              <Controller
                name="nombre_completo"
                control={control}
                render={({ field }) => (
                  <FormGroup label="Nombre completo" error={errors.nombre_completo?.message} required>
                    <Input
                      {...field}
                      placeholder="Ej: Maria Garcia Lopez"
                      hasError={!!errors.nombre_completo}
                    />
                  </FormGroup>
                )}
              />

              {/* Telefono */}
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <FormGroup label="Telefono" error={errors.telefono?.message}>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="5512345678"
                      hasError={!!errors.telefono}
                    />
                  </FormGroup>
                )}
              />

              {/* Departamento */}
              <Controller
                name="departamento_id"
                control={control}
                render={({ field }) => (
                  <FormGroup label="Departamento" error={errors.departamento_id?.message}>
                    <Select {...field} hasError={!!errors.departamento_id}>
                      <option value="">Seleccionar departamento...</option>
                      {departamentos.map((d) => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}
              />

              {/* Puesto */}
              <Controller
                name="puesto_id"
                control={control}
                render={({ field }) => (
                  <FormGroup label="Puesto" error={errors.puesto_id?.message}>
                    <Select {...field} hasError={!!errors.puesto_id}>
                      <option value="">Seleccionar puesto...</option>
                      {puestos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}
              />

              {/* Tipo de contratacion */}
              <Controller
                name="tipo_contratacion"
                control={control}
                render={({ field }) => (
                  <FormGroup label="Tipo de contratacion" error={errors.tipo_contratacion?.message}>
                    <Select {...field} hasError={!!errors.tipo_contratacion}>
                      {Object.entries(TIPOS_CONTRATACION).map(([value, { label }]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}
              />

              {/* Seccion de vinculacion de usuario - Solo en creacion */}
              {!isEditMode && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Acceso al Sistema
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                      Opcional
                    </span>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Para dar acceso al sistema, primero crea el usuario en{' '}
                        <strong>Configuracion &gt; Usuarios</strong> y luego seleccionalo aqui.
                      </p>
                    </div>
                  </div>

                  <UsuarioSelector
                    value={usuarioId}
                    onChange={setUsuarioId}
                  />
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isEditMode
                  ? isSubmitting ? 'Actualizando...' : 'Actualizar'
                  : isSubmitting ? 'Creando...' : 'Crear Profesional'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Drawer>
  );
}

export default ProfesionalFormDrawer;
