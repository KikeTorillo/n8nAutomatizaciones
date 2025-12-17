import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { authApi } from '@/services/api/endpoints';
import AuthLayout from '@/components/auth/AuthLayout';
import FormField from '@/components/forms/FormField';
import Button from '@/components/ui/Button';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

/**
 * Schema de validación - Flujo unificado (Dic 2025)
 * Solo nombre + email (igual que Google OAuth)
 */
const registroSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre es muy largo'),
  email: z.string()
    .email('El email no es válido')
});

/**
 * Página de Registro Simplificado - Flujo Unificado (Dic 2025)
 * Solo pide nombre + email, igual que el flujo de Google OAuth
 * El usuario completará los datos del negocio en el onboarding
 */
function RegistroPage() {
  const toast = useToast();

  const [registrando, setRegistrando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');

  const {
    control,
    handleSubmit,
  } = useForm({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: '',
      email: ''
    }
  });

  const onSubmit = async (data) => {
    setRegistrando(true);
    try {
      const response = await authApi.registrar(data);
      setEmailEnviado(response.data.data.email_enviado);
      setRegistroExitoso(true);
      toast.success('¡Registro iniciado! Revisa tu email.');
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al registrar. Intenta de nuevo.';
      toast.error(mensaje);
    } finally {
      setRegistrando(false);
    }
  };

  // Estado: Registro exitoso - Mostrar mensaje de email enviado
  if (registroExitoso) {
    return (
      <AuthLayout
        title="¡Revisa tu email!"
        subtitle="Hemos enviado un enlace de activación"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>

          <p className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-6">
            {emailEnviado}
          </p>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Próximos pasos:</p>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Abre el email que te enviamos</li>
              <li>Haz clic en "Activar mi cuenta"</li>
              <li>Crea tu contraseña</li>
              <li>Configura tu negocio y ¡listo!</li>
            </ol>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            El enlace expira en 24 horas
          </p>

          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Formulario de registro simplificado
  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Empieza gratis en segundos"
      footer={
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        {/* Google Sign In */}
        <GoogleSignInButton text="signup_with" />

        {/* Separador */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              o continúa con email
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre */}
          <FormField
            name="nombre"
            control={control}
            type="text"
            label="Tu nombre"
            placeholder="Juan Pérez"
            required
          />

          {/* Email */}
          <FormField
            name="email"
            control={control}
            type="email"
            label="Email"
            placeholder="tu@email.com"
            required
          />

          {/* Botón de registro */}
          <Button
            type="submit"
            className="w-full"
            isLoading={registrando}
            disabled={registrando}
          >
            {registrando ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>

          {/* Términos */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Al crear tu cuenta, aceptas nuestros{' '}
            <a href="/terminos" className="text-primary-600 dark:text-primary-400 hover:underline">Términos de Servicio</a>
            {' '}y{' '}
            <a href="/privacidad" className="text-primary-600 dark:text-primary-400 hover:underline">Política de Privacidad</a>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}

export default RegistroPage;
