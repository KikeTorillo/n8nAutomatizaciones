/**
 * MagicLinkVerifyPage - Verifica y procesa magic links
 * Dic 2025 - OAuth y Magic Links
 *
 * Ruta: /auth/magic-link/:token
 * Flujo: Click en email → Esta página verifica → Auto-login → Redirect
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import AuthLayout from '@/components/auth/AuthLayout';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

function MagicLinkVerifyPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const toast = useToast();

  const [status, setStatus] = useState('verificando'); // verificando, exito, error
  const [errorMessage, setErrorMessage] = useState('');

  // Mutation para verificar el magic link
  const verifyMutation = useMutation({
    mutationFn: async () => {
      const response = await authApi.verificarMagicLink(token);
      return response.data.data;
    },
    onSuccess: (data) => {
      setStatus('exito');

      // Guardar auth en store
      setAuth({
        user: data.usuario,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      toast.success('Sesión iniciada correctamente');

      // Esperar un momento para mostrar el estado de éxito
      setTimeout(() => {
        // Si requiere onboarding, redirigir al wizard
        if (data.requiere_onboarding) {
          navigate('/onboarding');
          return;
        }

        // Redirigir según rol
        if (data.usuario.rol === 'super_admin') {
          navigate('/superadmin');
        } else {
          navigate('/home');
        }
      }, 1500);
    },
    onError: (error) => {
      setStatus('error');
      const message = error.response?.data?.message || 'El enlace no es válido o ha expirado';
      setErrorMessage(message);
    },
  });

  // Verificar automáticamente al cargar
  useEffect(() => {
    if (token) {
      verifyMutation.mutate();
    } else {
      setStatus('error');
      setErrorMessage('Enlace inválido');
    }
  }, [token]);

  // Estado: Verificando
  if (status === 'verificando') {
    return (
      <AuthLayout
        title="Verificando enlace"
        subtitle="Por favor espera un momento..."
      >
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Iniciando sesión automáticamente...
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Estado: Éxito
  if (status === 'exito') {
    return (
      <AuthLayout
        title="Sesión iniciada"
        subtitle="Redirigiendo..."
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenido de nuevo. Redirigiendo al dashboard...
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Estado: Error
  return (
    <AuthLayout
      title="Enlace no válido"
      subtitle="No pudimos iniciar tu sesión"
    >
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
          {errorMessage}
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Los enlaces de acceso expiran después de 15 minutos por seguridad.
        </p>

        <div className="space-y-3">
          <Link to="/auth/login">
            <Button className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Solicitar nuevo enlace
            </Button>
          </Link>

          <Link
            to="/auth/login"
            className="block text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            O inicia sesión con contraseña
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default MagicLinkVerifyPage;
