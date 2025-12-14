import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';
import { loginSchema } from '@/lib/validations';
import AuthLayout from '@/components/auth/AuthLayout';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Eye, EyeOff } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Redirigir si ya tiene sesión activa
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectTo = user.rol === 'super_admin' ? '/superadmin' : '/home';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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
      const response = await authApi.login(data);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Limpiar cache de React Query al cambiar de organización
      queryClient.clear();

      setAuth({
        user: data.usuario,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      // Redirección según rol
      if (data.usuario.rol === 'super_admin') {
        navigate('/superadmin');
      } else {
        navigate('/home');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
    },
  });

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle="Accede a tu cuenta"
      footer={
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ¿No tienes cuenta?{' '}
          <Link
            to="/registro"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            Regístrate gratis
          </Link>
        </p>
      }
    >
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
            className="absolute right-3 top-[38px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
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
    </AuthLayout>
  );
}

export default Login;
