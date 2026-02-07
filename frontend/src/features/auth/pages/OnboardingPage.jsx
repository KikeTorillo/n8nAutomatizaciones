/**
 * OnboardingPage - Wizard para completar registro de usuarios OAuth
 * Dic 2025 - OAuth y Magic Links
 *
 * Ruta: /onboarding
 * Flujo: Usuario nuevo via Google → Esta página → Crear organización → Dashboard
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { suscripcionesNegocioApi } from '@/services/api/modules/suscripciones-negocio.api';
import useAuthStore, { selectUser, selectSetAuth, selectIsAuthenticated } from '../store/authStore';
import { queryKeys } from '@/hooks/config';
import { useToast } from '@/hooks/utils';
import AuthLayout from '../components/AuthLayout';
import FormField from '@/components/forms/FormField';
import SelectorUbicacion from '@/components/forms/SelectorUbicacion';
import { Button } from '@/components/ui';
import { Building2, UserCheck, Sparkles, ArrowRight } from 'lucide-react';
import ModuloSelector from '@/components/onboarding/ModuloSelector';

// Schema de validación
// Industria removida del onboarding - se configura en Configuración > Mi Negocio (Ene 2026)
const onboardingSchema = z.object({
  nombre_negocio: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre es muy largo'),
  estado_id: z.string()
    .min(1, 'Selecciona un estado')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'Selecciona un estado'),
  ciudad_id: z.string()
    .min(1, 'Selecciona una ciudad')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, 'Selecciona una ciudad'),
  soy_profesional: z.boolean().default(true),
  // Módulos seleccionados (ninguno por defecto)
  modulos: z.record(z.string(), z.boolean()).default({})
});

/**
 * Validar plan guardado en localStorage
 * Función pura fuera del componente para evitar re-creación
 * @param {number} planId - ID del plan a validar
 * @param {Array} planesDisponibles - Lista de planes disponibles
 * @returns {Object|null} Plan encontrado o null
 */
const validarPlanGuardado = (planId, planesDisponibles) => {
  if (!planId || !planesDisponibles?.length) return null;
  return planesDisponibles.find(p => p.id === planId) || null;
};

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore(selectUser);
  const setAuth = useAuthStore(selectSetAuth);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const toast = useToast();

  // ═══════════════════════════════════════════════════════════════
  // CARGAR PLANES PÚBLICOS para determinar módulos disponibles
  // ═══════════════════════════════════════════════════════════════
  const { data: planesData } = useQuery({
    queryKey: ['planes', 'publicos'],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.listarPlanesPublicos();
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // Determinar los módulos disponibles según el plan del usuario
  const modulosDisponibles = useMemo(() => {
    if (!planesData?.length) return null; // Aún cargando

    // Verificar si hay plan guardado en localStorage
    const planGuardado = localStorage.getItem('nexo_plan_seleccionado');
    let plan = null;

    if (planGuardado) {
      try {
        const { plan_id, timestamp } = JSON.parse(planGuardado);
        const UNA_HORA = 60 * 60 * 1000;
        if (Date.now() - timestamp < UNA_HORA) {
          // Validar que el plan_id existe en los planes disponibles
          plan = validarPlanGuardado(plan_id, planesData);
          if (!plan && import.meta.env.DEV) {
            console.warn('[Onboarding] Plan guardado no encontrado en planesData:', plan_id);
          }
        }
      } catch (e) {
        console.error('[Onboarding] Error parseando plan guardado:', e);
        // Limpiar localStorage corrupto
        localStorage.removeItem('nexo_plan_seleccionado');
      }
    }

    // Si no hay plan guardado o no se encontró, usar plan trial
    if (!plan) {
      plan = planesData.find(p => p.codigo === 'trial');
    }

    // Fallback: usar el primer plan disponible
    if (!plan && planesData.length > 0) {
      plan = planesData[0];
    }

    return plan?.modulos_habilitados || [];
  }, [planesData]);

  // Verificar que el usuario está autenticado pero sin organización
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login', { replace: true });
      return;
    }

    // Si ya tiene organización, redirigir al home
    if (user?.organizacion_id) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      nombre_negocio: '',
      estado_id: '',
      ciudad_id: '',
      soy_profesional: true,
      modulos: {}
    }
  });

  // Mutation para completar onboarding
  const onboardingMutation = useMutation({
    mutationFn: async (data) => {
      const response = await authApi.completarOnboarding(data);
      return response.data.data;
    },
    onSuccess: async (data) => {
      // Invalidar caches relevantes (sin borrar TODO el cache)
      // FIX: Usar invalidateQueries específico en lugar de clear() agresivo
      await queryClient.invalidateQueries({ queryKey: ['planes'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.usuario, refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.organizacion, refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sistema.modulos, refetchType: 'active' });

      // Ene 2026: Actualizar auth (refreshToken viene por cookie httpOnly)
      setAuth({
        user: {
          ...user,
          ...data.usuario,
          organizacion_id: data.organizacion.id
        },
        accessToken: data.accessToken,
      });

      // ═══════════════════════════════════════════════════════════════
      // PLAN PRESELECCIONADO: Iniciar trial si hay plan en localStorage
      // ═══════════════════════════════════════════════════════════════
      const planGuardado = localStorage.getItem('nexo_plan_seleccionado');
      if (planGuardado) {
        try {
          const { plan_id, periodo, timestamp } = JSON.parse(planGuardado);
          // Solo si es reciente (menos de 1 hora)
          const UNA_HORA = 60 * 60 * 1000;
          if (Date.now() - timestamp < UNA_HORA) {
            // Iniciar trial del plan seleccionado
            await suscripcionesNegocioApi.iniciarTrial({ plan_id, periodo });
            toast.success('¡Tu negocio y prueba gratuita están listos! Bienvenido a Nexo.');
          } else {
            toast.success('¡Tu negocio está listo! Bienvenido a Nexo.');
          }
        } catch (e) {
          console.error('[Onboarding] Error iniciando trial:', e);
          // No bloquear el flujo si falla el trial
          toast.success('¡Tu negocio está listo! Bienvenido a Nexo.');
        } finally {
          localStorage.removeItem('nexo_plan_seleccionado');
        }
      } else {
        toast.success('¡Tu negocio está listo! Bienvenido a Nexo.');
      }

      navigate('/home');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al crear tu negocio';
      toast.error(message);
    },
  });

  const onSubmit = (data) => {
    onboardingMutation.mutate(data);
  };

  const onError = (errors) => {
    // Validation errors are shown inline in the form
    if (import.meta.env.DEV) {
      console.error('[Onboarding] Errores de validación:', errors);
    }
  };

  return (
    <AuthLayout
      title="Configura tu negocio"
      subtitle={`¡Hola ${user?.nombre || 'Usuario'}! Solo faltan unos datos`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {/* Indicador de progreso */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <span>Último paso para empezar</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
          {/* Nombre del negocio */}
          <div className="relative">
            <FormField
              name="nombre_negocio"
              control={control}
              type="text"
              label="Nombre de tu negocio"
              placeholder="Barbería El Clásico"
              required
            />
            <Building2 className="absolute right-3 top-[38px] w-5 h-5 text-gray-400" />
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ubicación <span className="text-red-500">*</span>
            </label>
            <SelectorUbicacion
              control={control}
              setValue={setValue}
              watch={watch}
              errors={errors}
              required
              horizontal
            />
          </div>

          {/* Soy Profesional */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...control.register('soy_profesional')}
                defaultChecked={true}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Yo atiendo clientes</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Activa esto si tú también realizarás servicios o ventas.
                </p>
              </div>
            </label>
          </div>

          {/* Selector de Módulos */}
          {/* Solo mostrar módulos habilitados en el plan del usuario */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
            <ModuloSelector
              value={watch('modulos')}
              onChange={(modulos) => setValue('modulos', modulos)}
              modulosDisponibles={modulosDisponibles}
            />
          </div>

          {/* Botón de envío */}
          <Button
            type="submit"
            className="w-full"
            isLoading={onboardingMutation.isPending}
            disabled={onboardingMutation.isPending}
          >
            {onboardingMutation.isPending ? (
              'Creando tu negocio...'
            ) : (
              <>
                Comenzar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {/* Info adicional */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Podrás modificar estos datos más tarde en la configuración.
        </p>
      </div>
    </AuthLayout>
  );
}

export default OnboardingPage;
