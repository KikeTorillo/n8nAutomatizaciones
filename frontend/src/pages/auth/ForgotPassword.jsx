import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/services/api/endpoints';
import { forgotPasswordSchema } from '@/lib/validations';
import AuthLayout from '@/components/auth/AuthLayout';
import FormField from '@/components/forms/FormField';
import { Button } from '@/components/ui';
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
      const response = await authApi.recuperarPassword(data);
      return response.data.data;
    },
    onSuccess: () => {
      setEmailEnviado(true);
      setEmailDestino(getValues('email'));
      setTiempoRestante(60);
      toast.success('¡Email enviado! Revisa tu bandeja de entrada');
    },
    onError: (error) => {
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
    recuperarMutation.mutate({ email: emailDestino });
  };

  // Vista: Confirmación de email enviado
  if (emailEnviado) {
    return (
      <AuthLayout
        title="Email enviado"
        subtitle="Revisa tu bandeja de entrada"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Hemos enviado un enlace de recuperación a:
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              {emailDestino}
            </p>
            <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>El enlace expira en 1 hora.</span>
            </div>
          </div>

          <div className="text-left bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Próximos pasos:
            </p>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Revisa tu bandeja de entrada</li>
              <li>Haz click en el enlace del email</li>
              <li>Crea tu nueva contraseña</li>
            </ol>
          </div>

          <Link to="/auth/login">
            <Button variant="secondary" className="w-full mb-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al login
            </Button>
          </Link>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              ¿No recibiste el email?
            </p>
            <button
              onClick={handleReenviar}
              disabled={tiempoRestante > 0 || recuperarMutation.isPending}
              className={`text-sm font-medium inline-flex items-center ${
                tiempoRestante > 0 || recuperarMutation.isPending
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
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
      </AuthLayout>
    );
  }

  // Vista: Formulario de solicitud
  return (
    <AuthLayout
      title="Recuperar Contraseña"
      subtitle="Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña"
      footer={
        <Link
          to="/auth/login"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al login
        </Link>
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

        <Button
          type="submit"
          className="w-full"
          isLoading={recuperarMutation.isPending}
          disabled={recuperarMutation.isPending}
        >
          {recuperarMutation.isPending ? 'Enviando...' : 'Enviar enlace'}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
