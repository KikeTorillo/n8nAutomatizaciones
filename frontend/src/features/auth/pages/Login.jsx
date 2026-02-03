import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import useAuthStore, { selectSetAuth, selectIsAuthenticated, selectUser } from '../store/authStore';
import { loginSchema } from '@/lib/validations';
import AuthLayout from '../components/AuthLayout';
import FormField from '@/components/forms/FormField';
import { Button } from '@/components/ui';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useToast } from '@/hooks/utils';
import { Eye, EyeOff, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';

// Schema para magic link
const magicLinkSchema = z.object({
  email: z.string().email('El email no es válido'),
});

function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore(selectSetAuth);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');

  // Redirigir si ya tiene sesión activa
  // Ene 2026: super_admin ahora tiene organización, todos van a /home
  useEffect(() => {
    if (isAuthenticated && user) {
      // Verificar si necesita onboarding (roles de sistema nunca necesitan)
      // FASE 7: Usa nivel_jerarquia >= 100 para super_admin
      if (user.nivel_jerarquia < 100 && !user.organizacion_id && user.onboarding_completado === false) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Form para login tradicional
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

  // Form para magic link
  const {
    control: magicLinkControl,
    handleSubmit: handleMagicLinkSubmit,
    reset: resetMagicLink,
  } = useForm({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  });

  // Mutation login tradicional
  const loginMutation = useMutation({
    mutationFn: async (data) => {
      const response = await authApi.login(data);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Feb 2026: Invalidar queries específicas en lugar de clear() para mejor UX
      queryClient.invalidateQueries({ queryKey: ['usuario'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['organizacion'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['modulos'], refetchType: 'active' });
      // Ene 2026: refreshToken viene por cookie httpOnly, no se guarda en frontend
      setAuth({
        user: data.usuario,
        accessToken: data.accessToken,
      });

      // Dic 2025 - Flujo unificado: redirigir a onboarding si es necesario
      // Ene 2026: super_admin ahora tiene organización, va a /home (puede acceder a /superadmin desde menú)
      if (data.requiere_onboarding) {
        navigate('/onboarding');
      } else {
        navigate('/home');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
    },
  });

  // Mutation magic link
  const magicLinkMutation = useMutation({
    mutationFn: async (data) => {
      const response = await authApi.solicitarMagicLink(data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      setMagicLinkEmail(variables.email);
      setMagicLinkSent(true);
      toast.success('Enlace enviado a tu email');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al enviar el enlace';
      toast.error(message);
    },
  });

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  const onMagicLinkSubmit = (data) => {
    magicLinkMutation.mutate(data);
  };

  const handleBackToLogin = () => {
    setShowMagicLink(false);
    setMagicLinkSent(false);
    resetMagicLink();
  };

  // Estado: Magic link enviado
  if (magicLinkSent) {
    return (
      <AuthLayout
        title="Revisa tu email"
        subtitle="Te enviamos un enlace de acceso"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>

          <p className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">
            {magicLinkEmail}
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Haz clic en el enlace del email para iniciar sesión automáticamente.
            El enlace expira en 15 minutos.
          </p>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => magicLinkMutation.mutate({ email: magicLinkEmail })}
              isLoading={magicLinkMutation.isPending}
            >
              Reenviar enlace
            </Button>

            <button
              onClick={handleBackToLogin}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center justify-center gap-1 w-full"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al login
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Estado: Formulario Magic Link
  if (showMagicLink) {
    return (
      <AuthLayout
        title="Accede sin contraseña"
        subtitle="Te enviaremos un enlace a tu email"
        footer={
          <button
            onClick={handleBackToLogin}
            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al login con contraseña
          </button>
        }
      >
        <form onSubmit={handleMagicLinkSubmit(onMagicLinkSubmit)} className="space-y-6">
          <FormField
            name="email"
            control={magicLinkControl}
            type="email"
            label="Email"
            placeholder="tu@email.com"
            required
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={magicLinkMutation.isPending}
            disabled={magicLinkMutation.isPending}
          >
            <Mail className="w-4 h-4 mr-2" />
            Enviar enlace de acceso
          </Button>
        </form>
      </AuthLayout>
    );
  }

  // Estado: Login principal
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
      <div className="space-y-6">
        {/* Google Sign-In */}
        <GoogleSignInButton />

        {/* Separador */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-gray-800 px-4 text-gray-500 dark:text-gray-400">
              o continúa con email
            </span>
          </div>
        </div>

        {/* Formulario tradicional */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setShowMagicLink(true)}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Acceder sin contraseña
            </button>
            <Link
              to="/auth/forgot-password"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
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
      </div>
    </AuthLayout>
  );
}

export default Login;
