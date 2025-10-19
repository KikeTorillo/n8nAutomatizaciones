import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/services/api/endpoints';
import { resetPasswordSchema } from '@/lib/validations';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import { useToast } from '@/hooks/useToast';
import { Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [validandoToken, setValidandoToken] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [email, setEmail] = useState('');
  const [expiraEnMinutos, setExpiraEnMinutos] = useState(0);
  const [showPasswordNueva, setShowPasswordNueva] = useState(false);
  const [showConfirmarPassword, setShowConfirmarPassword] = useState(false);
  const [fortalezaPassword, setFortalezaPassword] = useState(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      passwordNueva: '',
      confirmarPassword: '',
    },
  });

  const passwordNueva = watch('passwordNueva');

  // Validar token al montar
  useEffect(() => {
    const validarToken = async () => {
      try {
        console.log('🔍 Validando token de reset...');
        const response = await authApi.validarTokenReset(token);
        const data = response.data.data;

        console.log('✅ Token válido:', data);
        setTokenValido(data.valido);
        setEmail(data.email);
        setExpiraEnMinutos(data.expira_en_minutos);
        setTokenError('');
      } catch (error) {
        console.error('❌ Error al validar token:', error);
        setTokenValido(false);

        const message = error.response?.data?.message || 'Token inválido o expirado';
        setTokenError(message);
      } finally {
        setValidandoToken(false);
      }
    };

    if (token) {
      validarToken();
    } else {
      setValidandoToken(false);
      setTokenValido(false);
      setTokenError('No se proporcionó un token válido');
    }
  }, [token]);

  const resetMutation = useMutation({
    mutationFn: async (data) => {
      console.log('📤 Confirmando reset de contraseña...');
      const response = await authApi.confirmarResetPassword(token, data);
      console.log('✅ Contraseña actualizada:', response.data);
      return response.data.data;
    },
    onSuccess: (data) => {
      console.log('🎉 Contraseña actualizada exitosamente');
      toast.success('Contraseña actualizada correctamente');

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/auth/login', {
          state: { message: 'Contraseña actualizada. Por favor, inicia sesión.' },
        });
      }, 2000);
    },
    onError: (error) => {
      console.error('❌ Error al actualizar contraseña:', error);
      const message = error.response?.data?.message || 'Error al actualizar la contraseña';
      toast.error(message);
    },
  });

  const onSubmit = (data) => {
    // Verificar que la contraseña cumpla requisitos mínimos
    if (!fortalezaPassword?.cumple_requisitos) {
      toast.error('La contraseña no cumple con los requisitos mínimos de seguridad');
      return;
    }

    resetMutation.mutate(data);
  };

  // Vista: Validando token
  if (validandoToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Validando enlace...
            </h2>
            <p className="text-gray-600">
              Por favor espera mientras verificamos tu enlace de recuperación
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Vista: Token inválido o expirado
  if (!tokenValido) {
    const esExpirado = tokenError.toLowerCase().includes('expirado');

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            {/* Ícono de error */}
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
              esExpirado ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {esExpirado ? (
                <AlertTriangle className="h-10 w-10 text-yellow-600" />
              ) : (
                <XCircle className="h-10 w-10 text-red-600" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {esExpirado ? 'Enlace expirado' : 'Enlace inválido'}
            </h1>

            <div className={`rounded-lg p-4 mb-6 ${
              esExpirado ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${esExpirado ? 'text-yellow-800' : 'text-red-800'}`}>
                {tokenError}
              </p>
            </div>

            {esExpirado && (
              <p className="text-sm text-gray-600 mb-6">
                Los enlaces de recuperación expiran después de 30 minutos por seguridad.
                Solicita un nuevo enlace para continuar.
              </p>
            )}

            {/* Botones de acción */}
            <div className="space-y-3">
              <Link to="/auth/forgot-password">
                <Button variant="primary" className="w-full">
                  Solicitar nuevo enlace
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button variant="secondary" className="w-full">
                  Volver al login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista: Formulario de reset (token válido)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Restablecer Contraseña
          </h1>
          <p className="text-gray-600 mb-4">
            Crea una nueva contraseña para tu cuenta
          </p>

          {/* Info del usuario */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
            <p className="text-sm text-gray-700">
              Cuenta: <span className="font-medium text-gray-900">{email}</span>
            </p>
          </div>

          {/* Advertencia de expiración si queda poco tiempo */}
          {expiraEnMinutos <= 5 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                ⚠️ Este enlace expira en {expiraEnMinutos} minuto{expiraEnMinutos !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nueva contraseña */}
          <div className="relative">
            <FormField
              name="passwordNueva"
              control={control}
              type={showPasswordNueva ? 'text' : 'password'}
              label="Nueva contraseña"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswordNueva(!showPasswordNueva)}
              className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
            >
              {showPasswordNueva ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Indicador de fortaleza */}
          {passwordNueva && (
            <PasswordStrengthIndicator
              password={passwordNueva}
              onChange={setFortalezaPassword}
            />
          )}

          {/* Confirmar contraseña */}
          <div className="relative">
            <FormField
              name="confirmarPassword"
              control={control}
              type={showConfirmarPassword ? 'text' : 'password'}
              label="Confirmar contraseña"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmarPassword(!showConfirmarPassword)}
              className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
            >
              {showConfirmarPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Botón submit */}
          <Button
            type="submit"
            className="w-full"
            isLoading={resetMutation.isPending}
            disabled={resetMutation.isPending || !fortalezaPassword?.cumple_requisitos}
          >
            {resetMutation.isPending ? 'Actualizando...' : 'Restablecer contraseña'}
          </Button>
        </form>

        {/* Mensaje de éxito (mostrado después del submit) */}
        {resetMutation.isSuccess && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">
                  ¡Contraseña actualizada!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Redirigiendo al login...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Volver al login */}
        <div className="mt-6 text-center">
          <Link
            to="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
