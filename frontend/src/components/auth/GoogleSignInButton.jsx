/**
 * GoogleSignInButton - Botón de inicio de sesión con Google
 * Dic 2025 - OAuth y Magic Links
 *
 * Usa Google Identity Services (GSI) para autenticación
 * @see https://developers.google.com/identity/gsi/web
 */

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { Loader2 } from 'lucide-react';

// Google Client ID desde variables de entorno
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Componente de botón de Google Sign-In
 * @param {Object} props
 * @param {string} [props.text='signin_with'] - Texto del botón: 'signin_with', 'signup_with', 'continue_with'
 * @param {string} [props.theme='outline'] - Tema: 'outline', 'filled_blue', 'filled_black'
 * @param {string} [props.size='large'] - Tamaño: 'small', 'medium', 'large'
 * @param {Function} [props.onSuccess] - Callback al completar login exitoso
 * @param {Function} [props.onError] - Callback en caso de error
 */
function GoogleSignInButton({
  text = 'signin_with',
  theme = 'outline',
  size = 'large',
  onSuccess,
  onError
}) {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Mutation para enviar el token al backend
  const googleLoginMutation = useMutation({
    mutationFn: async (credential) => {
      const response = await authApi.loginGoogle({ credential });
      return response.data.data;
    },
    onSuccess: (data) => {
      setIsLoading(false);

      // Guardar auth en store
      setAuth({
        user: data.usuario,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      // Callback personalizado
      if (onSuccess) {
        onSuccess(data);
        return;
      }

      // Si requiere onboarding, redirigir al wizard
      if (data.requiere_onboarding) {
        toast.success('¡Bienvenido! Completa tu perfil para continuar.');
        navigate('/onboarding');
        return;
      }

      // Login exitoso, redirigir según rol
      toast.success(data.es_nuevo ? '¡Cuenta creada exitosamente!' : '¡Bienvenido de nuevo!');

      if (data.usuario.rol === 'super_admin') {
        navigate('/superadmin');
      } else {
        navigate('/home');
      }
    },
    onError: (error) => {
      setIsLoading(false);
      const message = error.response?.data?.message || 'Error al iniciar sesión con Google';
      toast.error(message);

      if (onError) {
        onError(error);
      }
    },
  });

  // Cargar script de Google y renderizar botón
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('[GoogleSignIn] VITE_GOOGLE_CLIENT_ID no está configurado');
      return;
    }

    // Verificar si el script ya está cargado
    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    // Cargar script de Google
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);

    return () => {
      // Cleanup: remover callback global si existe
      if (window.handleGoogleCredentialResponse) {
        delete window.handleGoogleCredentialResponse;
      }
    };
  }, []);

  // Inicializar Google Identity Services
  const initializeGoogle = () => {
    if (!window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Renderizar botón
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: theme,
          size: size,
          text: text,
          shape: 'rectangular',
          logo_alignment: 'left',
          width: buttonRef.current.offsetWidth || 300,
        });
      }

      setIsGoogleLoaded(true);
    } catch (error) {
      console.error('[GoogleSignIn] Error inicializando:', error);
    }
  };

  // Manejar respuesta de Google
  const handleCredentialResponse = (response) => {
    if (response.credential) {
      setIsLoading(true);
      googleLoginMutation.mutate(response.credential);
    }
  };

  // Si no hay Client ID configurado
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="text-center py-3 text-sm text-gray-500 dark:text-gray-400">
        Google Sign-In no configurado
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Contenedor del botón de Google */}
      <div
        ref={buttonRef}
        className={`flex justify-center ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        style={{ minHeight: size === 'large' ? '44px' : size === 'medium' ? '36px' : '28px' }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded">
          <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
        </div>
      )}

      {/* Fallback mientras carga */}
      {!isGoogleLoaded && !isLoading && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Cargando Google...</span>
        </div>
      )}
    </div>
  );
}

export default GoogleSignInButton;
