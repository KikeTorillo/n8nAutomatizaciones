import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/services/api/endpoints';
import { forgotPasswordSchema } from '@/lib/validations';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react';

function ForgotPassword() {
  const toast = useToast();

  const [emailEnviado, setEmailEnviado] = useState(false);
  const [emailDestino, setEmailDestino] = useState('');
  const [tiempoRestante, setTiempoRestante] = useState(0);

  const {
    control,
    handleSubmit,
    getValues,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const recuperarMutation = useMutation({
    mutationFn: async (data) => {
      console.log('📤 Solicitando recuperación de contraseña:', { email: data.email });
      const response = await authApi.recuperarPassword(data);
      console.log('✅ Recuperación solicitada:', response.data);
      return response.data.data;
    },
    onSuccess: () => {
      console.log('✉️ Email de recuperación enviado');
      setEmailEnviado(true);
      setEmailDestino(getValues('email'));
      setTiempoRestante(60); // Cooldown de 60 segundos
      toast.success('¡Email enviado! Revisa tu bandeja de entrada');
    },
    onError: (error) => {
      console.error('❌ Error al solicitar recuperación:', error);
      const message = error.response?.data?.message || 'Error al enviar el email de recuperación';
      toast.error(message);
    },
  });

  // Countdown para reenvío
  useEffect(() => {
    if (tiempoRestante > 0) {
      const timer = setInterval(() => {
        setTiempoRestante((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [tiempoRestante]);

  const onSubmit = (data) => {
    recuperarMutation.mutate(data);
  };

  const handleReenviar = () => {
    if (tiempoRestante > 0) return;

    const data = {
      email: emailDestino,
    };
    recuperarMutation.mutate(data);
  };

  // Vista: Confirmación de email enviado
  if (emailEnviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            {/* Ícono de éxito */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email enviado
            </h1>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 mb-2">
                Hemos enviado un enlace de recuperación a:
              </p>
              <p className="font-medium text-gray-900 mb-3">
                {emailDestino}
              </p>
              <div className="flex items-start text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>El enlace expira en 30 minutos.</span>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Próximos pasos:
              </p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Revisa tu bandeja de entrada</li>
                <li>Haz click en el enlace del email</li>
                <li>Crea tu nueva contraseña</li>
              </ol>
            </div>

            {/* Botón volver al login */}
            <Link to="/auth/login">
              <Button variant="secondary" className="w-full mb-3">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al login
              </Button>
            </Link>

            {/* Reenviar email */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                ¿No recibiste el email?
              </p>
              <button
                onClick={handleReenviar}
                disabled={tiempoRestante > 0 || recuperarMutation.isPending}
                className={`text-sm font-medium inline-flex items-center ${
                  tiempoRestante > 0 || recuperarMutation.isPending
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-primary-600 hover:text-primary-700'
                }`}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1 ${recuperarMutation.isPending ? 'animate-spin' : ''}`}
                />
                {tiempoRestante > 0
                  ? `Reenviar en ${tiempoRestante}s`
                  : 'Reenviar enlace'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista: Formulario de solicitud
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recuperar Contraseña
          </h1>
          <p className="text-gray-600">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            name="email"
            control={control}
            type="email"
            label="Email"
            placeholder="tu@email.com"
            required
            icon={<Mail className="w-5 h-5" />}
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={recuperarMutation.isPending}
            disabled={recuperarMutation.isPending}
          >
            {recuperarMutation.isPending ? 'Enviando...' : 'Enviar enlace'}
          </Button>
        </form>

        {/* Volver al login */}
        <div className="mt-6 text-center">
          <Link
            to="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
