import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Check, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { authApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';
import AuthLayout from '@/components/auth/AuthLayout';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';

/**
 * Schema de validación para activación de cuenta
 */
const activacionSchema = z.object({
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  password_confirm: z.string()
}).refine((data) => data.password === data.password_confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['password_confirm'],
});

/**
 * Página de Activación de Cuenta - Estilo minimalista homologado
 */
export default function ActivarCuentaPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { setAuth } = useAuthStore();

  const [validando, setValidando] = useState(true);
  const [activacion, setActivacion] = useState(null);
  const [error, setError] = useState(null);
  const [activando, setActivando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
  } = useForm({
    resolver: zodResolver(activacionSchema),
    defaultValues: {
      password: '',
      password_confirm: ''
    }
  });

  const password = watch('password');

  // Validar token al cargar
  useEffect(() => {
    const validarToken = async () => {
      try {
        const response = await authApi.validarActivacion(token);
        if (response.data.data.valido) {
          setActivacion(response.data.data);
        } else {
          setError(response.data.data.error || 'Enlace de activación no válido');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error al validar el enlace de activación');
      } finally {
        setValidando(false);
      }
    };

    if (token) {
      validarToken();
    }
  }, [token]);

  // Manejar activación
  const onSubmit = async (data) => {
    setActivando(true);
    try {
      const response = await authApi.activarCuenta(token, {
        password: data.password,
        password_confirm: data.password_confirm
      });

      const { usuario, accessToken, refreshToken } = response.data.data;

      // Login automático
      setAuth({
        user: usuario,
        accessToken,
        refreshToken
      });

      toast.success('¡Cuenta activada exitosamente!');
      navigate('/home');

    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al activar la cuenta');
    } finally {
      setActivando(false);
    }
  };

  // Estado: Validando
  if (validando) {
    return (
      <AuthLayout title="Validando enlace..." subtitle="Por favor espera">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 dark:text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Validando enlace de activación...</p>
        </div>
      </AuthLayout>
    );
  }

  // Estado: Error
  if (error) {
    return (
      <AuthLayout title="Enlace no válido" subtitle={error}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-3">
            <Link to="/registro">
              <Button variant="primary" className="w-full">
                Crear nueva cuenta
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="secondary" className="w-full">
                Iniciar sesión
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Formulario de activación
  return (
    <AuthLayout
      title="Activa tu cuenta"
      subtitle="Crea tu contraseña para comenzar"
    >
      {/* Info del negocio */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
          <Building2 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{activacion?.nombre_negocio}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{activacion?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Contraseña */}
        <div className="relative">
          <FormField
            name="password"
            control={control}
            type={showPassword ? 'text' : 'password'}
            label="Contraseña"
            placeholder="Crea una contraseña segura"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {password && <PasswordStrengthIndicator password={password} />}

        {/* Confirmar contraseña */}
        <div className="relative">
          <FormField
            name="password_confirm"
            control={control}
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirmar contraseña"
            placeholder="Repite la contraseña"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[38px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Requisitos de contraseña */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">La contraseña debe tener:</p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li className={`flex items-center gap-2 ${password?.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
              {password?.length >= 8 ? <Check className="h-4 w-4" /> : <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500" />}
              Al menos 8 caracteres
            </li>
            <li className={`flex items-center gap-2 ${/[A-Z]/.test(password || '') ? 'text-green-600 dark:text-green-400' : ''}`}>
              {/[A-Z]/.test(password || '') ? <Check className="h-4 w-4" /> : <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500" />}
              Una letra mayúscula
            </li>
            <li className={`flex items-center gap-2 ${/[a-z]/.test(password || '') ? 'text-green-600 dark:text-green-400' : ''}`}>
              {/[a-z]/.test(password || '') ? <Check className="h-4 w-4" /> : <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500" />}
              Una letra minúscula
            </li>
            <li className={`flex items-center gap-2 ${/[0-9]/.test(password || '') ? 'text-green-600 dark:text-green-400' : ''}`}>
              {/[0-9]/.test(password || '') ? <Check className="h-4 w-4" /> : <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500" />}
              Un número
            </li>
          </ul>
        </div>

        {/* Botón de activación */}
        <Button
          type="submit"
          className="w-full"
          isLoading={activando}
          disabled={activando}
        >
          {activando ? 'Activando cuenta...' : 'Activar mi cuenta'}
        </Button>

        {/* Info de expiración */}
        {activacion?.tiempo_restante && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Este enlace expira en {activacion.tiempo_restante}
          </p>
        )}
      </form>
    </AuthLayout>
  );
}
