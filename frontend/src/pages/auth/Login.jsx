import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';
import { loginSchema } from '@/lib/validations';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Eye, EyeOff } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data) => {
      console.log('📤 Iniciando sesión:', { email: data.email });
      const response = await authApi.login(data);
      console.log('✅ Login exitoso:', response.data);
      return response.data.data;
    },
    onSuccess: (data) => {
      console.log('🔐 Guardando auth en store:', data.usuario);

      // 🧹 CRÍTICO: Limpiar cache de React Query al cambiar de organización
      // Evita que se muestren datos de la sesión anterior
      queryClient.clear();
      console.log('✅ Cache de React Query limpiado');

      // El backend retorna "usuario" no "user"
      setAuth({
        user: data.usuario,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      // Redirección según rol (Nov 2025)
      const userRole = data.usuario.rol;

      if (userRole === 'super_admin') {
        // Super admin es usuario de plataforma (sin organización)
        // Va directo al panel de administración
        console.log(`➡️ Super Admin - Redirigiendo a Panel Admin`);
        navigate('/superadmin/dashboard');
      } else {
        // Usuarios normales van al App Home
        console.log(`➡️ Usuario ${userRole} - Redirigiendo a App Home`);
        navigate('/home');
      }
    },
    onError: (error) => {
      console.error('❌ Error en login:', error);
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
    },
  });

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-gray-600">
            Accede a tu cuenta de SaaS Agendamiento
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            name="email"
            control={control}
            type="email"
            label="Email"
            placeholder="tu@email.com"
            required
          />

          <div className="relative">
            <FormField
              name="password"
              control={control}
              type={showPassword ? 'text' : 'password'}
              label="Contraseña"
              placeholder="••••••••"
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

          <div className="text-right">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={loginMutation.isPending}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
