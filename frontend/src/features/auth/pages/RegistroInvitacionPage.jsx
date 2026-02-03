import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Check, AlertCircle, Loader2, Building2, User, Lock } from 'lucide-react';
import { useToast } from '@/hooks/utils';
import { invitacionesApi } from '@/services/api/endpoints';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

/**
 * Schema de validación para registro por invitación
 * Solo valida contraseña (nombre/apellidos vienen de la invitación)
 */
const registroSchema = z.object({
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  confirmarPassword: z.string()
}).refine((data) => data.password === data.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
});

/**
 * Página de registro para usuarios invitados
 * Flujo simplificado: solo pide nombre y contraseña
 * El email y organización vienen de la invitación
 */
export default function RegistroInvitacionPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [validando, setValidando] = useState(true);
  const [invitacion, setInvitacion] = useState(null);
  const [error, setError] = useState(null);
  const [registrando, setRegistrando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      password: '',
      confirmarPassword: ''
    }
  });

  const password = watch('password');

  // Validar token al cargar
  useEffect(() => {
    const validarInvitacion = async () => {
      try {
        const response = await invitacionesApi.validar(token);
        if (response.data.data.valido) {
          setInvitacion(response.data.data.invitacion);
        } else {
          setError(response.data.data.error || 'Invitación no válida');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error al validar la invitación');
      } finally {
        setValidando(false);
      }
    };

    if (token) {
      validarInvitacion();
    }
  }, [token]);

  // Manejar envío del formulario
  const onSubmit = async (data) => {
    setRegistrando(true);
    try {
      // Usar nombre/apellidos de la invitación (campos deshabilitados)
      await invitacionesApi.aceptar(token, {
        nombre: invitacion.nombre_sugerido,
        apellidos: invitacion.apellidos_sugerido || undefined,
        password: data.password
      });

      setRegistroExitoso(true);
      toast.success('Cuenta creada exitosamente');

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear la cuenta');
    } finally {
      setRegistrando(false);
    }
  };

  // Estado: Validando
  if (validando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          <Loader2 className="h-12 w-12 text-primary-600 dark:text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Validando invitación...</p>
        </div>
      </div>
    );
  }

  // Estado: Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Invitación no válida</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            to="/auth/login"
            className="inline-block px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          >
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  // Estado: Registro exitoso
  if (registroExitoso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">¡Cuenta creada!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Tu cuenta ha sido creada exitosamente.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Serás redirigido al inicio de sesión en unos segundos...
          </p>
          <Link
            to="/auth/login"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Iniciar sesión ahora
          </Link>
        </div>
      </div>
    );
  }

  // Estado: Formulario de registro
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-6 w-6" />
            <span className="font-medium">{invitacion.organizacion_nombre}</span>
          </div>
          <h1 className="text-2xl font-bold">Completa tu registro</h1>
          <p className="text-primary-100 mt-1">
            {invitacion.profesional_nombre
              ? <>Has sido invitado como <strong>{invitacion.profesional_nombre}</strong></>
              : <>Has sido invitado a unirte al equipo</>
            }
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={invitacion.email}
                disabled
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Check className="h-5 w-5 text-primary-500" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Este será tu email de acceso
            </p>
          </div>

          {/* Nombre (pre-llenado desde invitación) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={invitacion.apellidos_sugerido
                  ? `${invitacion.nombre_sugerido} ${invitacion.apellidos_sugerido}`
                  : invitacion.nombre_sugerido}
                disabled
                className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Check className="h-5 w-5 text-primary-500" />
              </div>
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Crea una contraseña segura"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmarPassword')}
                placeholder="Repite la contraseña"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                  errors.confirmarPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmarPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmarPassword.message}</p>
            )}
          </div>

          {/* Botón de registro */}
          <button
            type="submit"
            disabled={registrando}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {registrando ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Completar Registro
              </>
            )}
          </button>

          {/* Info de expiración */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Esta invitación expira en {invitacion.minutos_restantes > 60
              ? `${Math.floor(invitacion.minutos_restantes / 60)} horas`
              : `${invitacion.minutos_restantes} minutos`
            }
          </p>
        </form>
      </div>
    </div>
  );
}
