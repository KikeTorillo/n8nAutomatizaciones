import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/utils';
import { authApi } from '@/services/api/endpoints';
import FormField from '@/components/forms/FormField';
import { Button } from '@/components/ui';
import { PasswordStrengthIndicator } from '@/features/auth';

/**
 * Schema de validación para cambio de contraseña
 */
const cambiarPasswordSchema = z.object({
  passwordAnterior: z.string().min(1, 'La contraseña actual es requerida'),
  passwordNueva: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  passwordConfirm: z.string()
}).refine((data) => data.passwordNueva === data.passwordConfirm, {
  message: 'Las contraseñas no coinciden',
  path: ['passwordConfirm'],
}).refine((data) => data.passwordAnterior !== data.passwordNueva, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['passwordNueva'],
});

/**
 * Formulario de cambio de contraseña
 * Permite al usuario cambiar su contraseña actual por una nueva
 */
function CambiarPasswordForm() {
  const toast = useToast();
  const [showPasswordAnterior, setShowPasswordAnterior] = useState(false);
  const [showPasswordNueva, setShowPasswordNueva] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [cambioExitoso, setCambioExitoso] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: {
      passwordAnterior: '',
      passwordNueva: '',
      passwordConfirm: ''
    }
  });

  const passwordNueva = watch('passwordNueva');

  // Mutation para cambiar contraseña
  const cambiarPasswordMutation = useMutation({
    mutationFn: (data) => authApi.cambiarPassword({
      passwordAnterior: data.passwordAnterior,
      passwordNueva: data.passwordNueva,
    }),
    onSuccess: () => {
      toast.success('Contraseña cambiada exitosamente');
      setCambioExitoso(true);
      reset();
      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => setCambioExitoso(false), 5000);
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(mensaje);
    },
  });

  const onSubmit = (data) => {
    cambiarPasswordMutation.mutate(data);
  };

  // Mostrar mensaje de éxito
  if (cambioExitoso) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Contraseña actualizada
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Tu contraseña ha sido cambiada exitosamente
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCambioExitoso(false)}
        >
          Cambiar de nuevo
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Contraseña actual */}
      <div className="relative">
        <FormField
          name="passwordAnterior"
          control={control}
          type={showPasswordAnterior ? 'text' : 'password'}
          label="Contraseña actual"
          placeholder="Tu contraseña actual"
          required
        />
        <button
          type="button"
          onClick={() => setShowPasswordAnterior(!showPasswordAnterior)}
          className="absolute right-3 top-[38px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showPasswordAnterior ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* Nueva contraseña */}
      <div className="relative">
        <FormField
          name="passwordNueva"
          control={control}
          type={showPasswordNueva ? 'text' : 'password'}
          label="Nueva contraseña"
          placeholder="Tu nueva contraseña"
          required
        />
        <button
          type="button"
          onClick={() => setShowPasswordNueva(!showPasswordNueva)}
          className="absolute right-3 top-[38px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showPasswordNueva ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* Indicador de fortaleza */}
      {passwordNueva && <PasswordStrengthIndicator password={passwordNueva} />}

      {/* Confirmar contraseña */}
      <div className="relative">
        <FormField
          name="passwordConfirm"
          control={control}
          type={showPasswordConfirm ? 'text' : 'password'}
          label="Confirmar nueva contraseña"
          placeholder="Repite la nueva contraseña"
          required
        />
        <button
          type="button"
          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
          className="absolute right-3 top-[38px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* Botón de envío */}
      <Button
        type="submit"
        className="w-full"
        isLoading={cambiarPasswordMutation.isPending}
        disabled={cambiarPasswordMutation.isPending}
      >
        <Lock className="h-4 w-4 mr-2" />
        {cambiarPasswordMutation.isPending ? 'Cambiando...' : 'Cambiar Contraseña'}
      </Button>
    </form>
  );
}

export default CambiarPasswordForm;
