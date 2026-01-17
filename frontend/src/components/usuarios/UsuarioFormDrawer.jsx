/**
 * ====================================================================
 * COMPONENTE - UsuarioFormDrawer
 * ====================================================================
 *
 * Drawer para invitar/editar usuarios
 * Dic 2025: Cambiado para usar sistema de invitaciones
 * Fase 5.2 - Diciembre 2025
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Loader2, Mail, Info } from 'lucide-react';
import { Button, Drawer, Select } from '@/components/ui';
import FormField from '@/components/forms/FormField';
import {
  useCrearUsuarioDirecto,
  useActualizarUsuario,
  ROLES_USUARIO,
} from '@/hooks/personas';
import { useToast } from '@/hooks/utils';

// ====================================================================
// SCHEMA DE VALIDACIÓN (sin password - se usa invitación)
// ====================================================================

const usuarioSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requerido')
    .email('Email no válido')
    .max(150, 'Máximo 150 caracteres'),
  nombre: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  apellidos: z.string().max(150, 'Máximo 150 caracteres').optional(),
  rol: z.enum(['admin', 'propietario', 'empleado']),
});

// ====================================================================
// COMPONENTE
// ====================================================================

function UsuarioFormDrawer({ isOpen, onClose, mode = 'create', usuario = null }) {
  const toast = useToast();
  const isEditMode = mode === 'edit';

  // Hooks de mutación
  const crearMutation = useCrearUsuarioDirecto();
  const actualizarMutation = useActualizarUsuario();

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      email: '',
      nombre: '',
      apellidos: '',
      rol: 'empleado',
    },
  });

  // Observar el rol para mostrar descripción
  const rolActual = watch('rol');

  // Reset form cuando cambia el modo o usuario
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && usuario) {
        reset({
          email: usuario.email || '',
          nombre: usuario.nombre || '',
          apellidos: usuario.apellidos || '',
          rol: usuario.rol || 'empleado',
        });
      } else {
        reset({
          email: '',
          nombre: '',
          apellidos: '',
          rol: 'empleado',
        });
      }
    }
  }, [isOpen, isEditMode, usuario, reset]);

  // Submit handler
  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await actualizarMutation.mutateAsync({
          id: usuario.id,
          data: {
            nombre: data.nombre,
            apellidos: data.apellidos || undefined,
          },
        });
        toast.success('Usuario actualizado correctamente');
      } else {
        await crearMutation.mutateAsync({
          email: data.email,
          nombre: data.nombre,
          apellidos: data.apellidos || undefined,
          rol: data.rol,
        });
        toast.success('Invitación enviada correctamente');
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al guardar usuario');
    }
  };

  const isPending = crearMutation.isPending || actualizarMutation.isPending || isSubmitting;

  // Opciones de rol
  const opcionesRol = Object.entries(ROLES_USUARIO).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Usuario' : 'Invitar Usuario'}
      subtitle={
        isEditMode
          ? 'Modifica los datos del usuario'
          : 'Envía una invitación para unirse al sistema'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Mensaje informativo sobre invitación */}
        {!isEditMode && (
          <div className="flex items-start gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <Info className="w-5 h-5 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary-700 dark:text-primary-300">
              <p className="font-medium">Se enviará un correo de invitación</p>
              <p className="text-primary-600 dark:text-primary-400 mt-1">
                El usuario recibirá un enlace para crear su contraseña y activar su cuenta.
              </p>
            </div>
          </div>
        )}

        {/* Email (solo en creación) */}
        {!isEditMode && (
          <FormField
            name="email"
            control={control}
            type="email"
            label="Email"
            placeholder="usuario@ejemplo.com"
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />
        )}

        {/* Nombre */}
        <FormField
          name="nombre"
          control={control}
          label="Nombre"
          placeholder="Nombre del usuario"
          required
        />

        {/* Apellidos */}
        <FormField
          name="apellidos"
          control={control}
          label="Apellidos"
          placeholder="Apellidos (opcional)"
        />

        {/* Rol (solo en creación) */}
        {!isEditMode && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rol <span className="text-red-500">*</span>
            </label>
            <Controller
              name="rol"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={opcionesRol}
                  leftIcon={<Shield className="w-4 h-4" />}
                  error={errors.rol?.message}
                />
              )}
            />
            {ROLES_USUARIO[rolActual]?.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {ROLES_USUARIO[rolActual].description}
              </p>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditMode ? 'Guardando...' : 'Enviando...'}
              </>
            ) : isEditMode ? (
              'Guardar cambios'
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Enviar invitación
              </>
            )}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default UsuarioFormDrawer;
