/**
 * Página de Setup Inicial del Sistema
 * Se muestra cuando no existe ningún super administrador
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { authApi } from '@/services/api/endpoints';
import apiClient from '@/services/api/client';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

// Esquema de validación con Zod
const setupSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'El email es requerido'),
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  apellidos: z.string()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(50, 'Los apellidos no pueden exceder 50 caracteres'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  passwordConfirm: z.string()
    .min(1, 'Debe confirmar la contraseña'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Las contraseñas no coinciden',
  path: ['passwordConfirm'],
});

export default function InitialSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      email: '',
      nombre: '',
      apellidos: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const password = watch('password');

  // Validaciones de complejidad del password
  const passwordValidations = {
    length: password?.length >= 8,
    uppercase: /[A-Z]/.test(password || ''),
    lowercase: /[a-z]/.test(password || ''),
    number: /[0-9]/.test(password || ''),
  };

  const createSuperAdminMutation = useMutation({
    mutationFn: async (data) => {
      // Llamar al endpoint unificado que crea super admin + n8n owner
      const response = await apiClient.post('/setup/unified-setup', {
        superAdmin: {
          email: data.email,
          nombre: data.nombre,
          apellidos: data.apellidos,
          password: data.password,
        },
        n8nOwner: {
          email: data.email, // Mismo email que super admin
          password: data.password, // Mismo password que super admin
          firstName: data.nombre,
          lastName: data.apellidos,
        },
      });
      return response.data;
    },
    onSuccess: async (data, variables) => {
      toast.success('Super administrador creado exitosamente');

      // Invalidar cache del setup check para que el SetupGuard se actualice
      queryClient.setQueryData(['setup', 'check'], {
        needsSetup: false,
        hasSuperAdmin: true,
      });

      // Hacer login automático usando el password de las variables originales
      try {
        const loginResponse = await authApi.login({
          email: variables.email,
          password: variables.password,
        });

        setAuth({
          user: loginResponse.data.data.usuario,
          accessToken: loginResponse.data.data.accessToken,
          refreshToken: loginResponse.data.data.refreshToken,
        });

        // Redirigir al panel super admin
        navigate('/superadmin', { replace: true });
      } catch (error) {
        console.error('Error en login automático:', error);
        toast.info('Por favor, inicie sesión con sus credenciales');
        navigate('/login', { replace: true });
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al crear super administrador';
      toast.error(message);
    },
  });

  const onSubmit = (data) => {
    createSuperAdminMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header con bienvenida */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            ¡Bienvenido! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Configure su cuenta de Super Administrador
          </p>
          <p className="text-sm text-gray-500">
            Esta es la configuración inicial del sistema. Solo se realiza una vez.
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Personal */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información Personal
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="nombre"
                  control={control}
                  label="Nombre"
                  placeholder="Nombre"
                  required
                />
                <FormField
                  name="apellidos"
                  control={control}
                  label="Apellidos"
                  placeholder="Apellidos"
                  required
                />
              </div>
            </div>

            {/* Credenciales de Acceso */}
            <div className="pb-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Credenciales de Acceso
              </h2>

              <FormField
                name="email"
                control={control}
                type="email"
                label="Email"
                placeholder="admin@empresa.com"
                required
              />

              <div className="mt-4 relative">
                <FormField
                  name="password"
                  control={control}
                  type={showPassword ? 'text' : 'password'}
                  label="Contraseña"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="mt-4 relative">
                <FormField
                  name="passwordConfirm"
                  control={control}
                  type={showPasswordConfirm ? 'text' : 'password'}
                  label="Confirmar Contraseña"
                  placeholder="Repita su contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                >
                  {showPasswordConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Requisitos de contraseña */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Requisitos de seguridad de la contraseña:
              </h3>
              <div className="space-y-2">
                <PasswordRequirement
                  met={passwordValidations.length}
                  text="Mínimo 8 caracteres"
                />
                <PasswordRequirement
                  met={passwordValidations.uppercase}
                  text="Al menos una mayúscula (A-Z)"
                />
                <PasswordRequirement
                  met={passwordValidations.lowercase}
                  text="Al menos una minúscula (a-z)"
                />
                <PasswordRequirement
                  met={passwordValidations.number}
                  text="Al menos un número (0-9)"
                />
              </div>
            </div>

            {/* Botón de submit */}
            <Button
              type="submit"
              className="w-full text-lg py-3"
              isLoading={createSuperAdminMutation.isPending}
              disabled={createSuperAdminMutation.isPending}
            >
              {createSuperAdminMutation.isPending
                ? 'Creando cuenta...'
                : 'Crear Cuenta de Super Administrador'}
            </Button>
          </form>

          {/* Nota de seguridad */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Nota importante de seguridad:</p>
                <p>
                  Esta cuenta tendrá acceso completo al sistema. Guarde sus credenciales
                  en un lugar seguro y no las comparta con nadie.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para mostrar requisitos de password
function PasswordRequirement({ met, text }) {
  return (
    <div className="flex items-center space-x-2">
      {met ? (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
      )}
      <span className={`text-sm ${met ? 'text-green-700' : 'text-gray-600'}`}>
        {text}
      </span>
    </div>
  );
}
