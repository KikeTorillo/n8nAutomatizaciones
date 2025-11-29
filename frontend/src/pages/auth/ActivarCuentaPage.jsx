import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Check, AlertCircle, Loader2, Building2, Lock, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { authApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';
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
 * Página de Activación de Cuenta
 * Fase 2 - Onboarding Simplificado (Nov 2025)
 *
 * El usuario llega aquí desde el email de activación.
 * Solo necesita crear su contraseña para activar la cuenta.
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
    register,
    handleSubmit,
    watch,
    formState: { errors }
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

      // Redirigir inmediatamente al home
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Validando enlace de activación...</p>
        </div>
      </div>
    );
  }

  // Estado: Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enlace no válido</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              to="/registro"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear nueva cuenta
            </Link>
            <Link
              to="/auth/login"
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de activación
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Último paso</span>
          </div>
          <h1 className="text-2xl font-bold">Activa tu cuenta</h1>
          <p className="text-blue-100 mt-1">
            Crea tu contraseña para comenzar
          </p>
        </div>

        {/* Info del negocio */}
        <div className="px-8 pt-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{activacion?.nombre_negocio}</p>
              <p className="text-sm text-gray-500">{activacion?.email}</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Crea una contraseña segura"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
            {password && <PasswordStrengthIndicator password={password} />}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('password_confirm')}
                placeholder="Repite la contraseña"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password_confirm ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password_confirm && (
              <p className="text-red-500 text-sm mt-1">{errors.password_confirm.message}</p>
            )}
          </div>

          {/* Requisitos de contraseña */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">La contraseña debe tener:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className={`flex items-center gap-2 ${password?.length >= 8 ? 'text-green-600' : ''}`}>
                {password?.length >= 8 ? <Check className="h-4 w-4" /> : <span className="w-4 h-4 rounded-full border border-gray-300" />}
                Al menos 8 caracteres
              </li>
              <li className={`flex items-center gap-2 ${/[A-Z]/.test(password || '') ? 'text-green-600' : ''}`}>
                {/[A-Z]/.test(password || '') ? <Check className="h-4 w-4" /> : <span className="w-4 h-4 rounded-full border border-gray-300" />}
                Una letra mayúscula
              </li>
              <li className={`flex items-center gap-2 ${/[a-z]/.test(password || '') ? 'text-green-600' : ''}`}>
                {/[a-z]/.test(password || '') ? <Check className="h-4 w-4" /> : <span className="w-4 h-4 rounded-full border border-gray-300" />}
                Una letra minúscula
              </li>
              <li className={`flex items-center gap-2 ${/[0-9]/.test(password || '') ? 'text-green-600' : ''}`}>
                {/[0-9]/.test(password || '') ? <Check className="h-4 w-4" /> : <span className="w-4 h-4 rounded-full border border-gray-300" />}
                Un número
              </li>
            </ul>
          </div>

          {/* Botón de activación */}
          <button
            type="submit"
            disabled={activando}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {activando ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Activando cuenta...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Activar mi cuenta
              </>
            )}
          </button>

          {/* Info de expiración */}
          {activacion?.tiempo_restante && (
            <p className="text-center text-sm text-gray-500">
              Este enlace expira en {activacion.tiempo_restante}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
