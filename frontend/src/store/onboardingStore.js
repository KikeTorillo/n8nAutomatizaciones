import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store de Onboarding con Zustand
 * Maneja el flujo de registro y configuración inicial
 *
 * Modelo Free/Pro (Nov 2025):
 * - 3 pasos: Info Negocio → Plan (con selección de app) → Cuenta
 * - Plan Free: 1 app gratis a elegir
 * - Plan Pro: Todas las apps incluidas
 */
const useOnboardingStore = create(
  persist(
    (set, get) => ({
      // ========== STATE ==========
      currentStep: 1,
      completedSteps: [],
      totalSteps: 3,  // Antes eran 4, ahora son 3

      // Datos del formulario por paso
      formData: {
        // Paso 1: Información del Negocio
        businessInfo: {
          nombre_comercial: '',
          nombre_fiscal: '',
          industria: '',
          estado_id: '',       // ID del catálogo de estados (México)
          ciudad_id: '',       // ID del catálogo de ciudades
          telefono_principal: '',
        },

        // Paso 2: Plan seleccionado (Modelo Free/Pro)
        plan: {
          plan_id: null,
          plan_codigo: '',           // Código interno: 'free', 'pro', 'trial'
          plan_nombre: '',           // Nombre para mostrar
          plan_precio: 0,
          app_seleccionada: null,    // App elegida en Plan Free: 'agendamiento', 'inventario', 'pos'
        },

        // Paso 3: Cuenta de usuario (antes era Paso 4)
        account: {
          email: '',
          password: '',
          nombre_completo: '',
        },
      },

      // IDs generados durante el proceso
      organizacion_id: null,
      usuario_id: null,

      // ========== ACTIONS ==========

      /**
       * Avanzar al siguiente paso
       */
      nextStep: () => {
        const { currentStep, completedSteps } = get();
        const newStep = currentStep + 1;

        set({
          currentStep: newStep,
          completedSteps: [...new Set([...completedSteps, currentStep])],
        });
      },

      /**
       * Retroceder al paso anterior
       */
      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      /**
       * Ir a un paso específico
       * @param {number} step
       */
      goToStep: (step) => {
        set({ currentStep: step });
      },

      /**
       * Actualizar datos del formulario
       * @param {string} section - businessInfo, plan, account
       * @param {Object} data
       */
      updateFormData: (section, data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            [section]: {
              ...state.formData[section],
              ...data,
            },
          },
        }));
      },

      /**
       * Guardar IDs generados
       * @param {Object} ids - { organizacion_id, usuario_id }
       */
      setIds: (ids) => {
        set(ids);
      },

      /**
       * Marcar paso como completado
       * @param {number} step
       */
      completeStep: (step) => {
        set((state) => ({
          completedSteps: [...new Set([...state.completedSteps, step])],
        }));
      },

      /**
       * Verificar si un paso está completado
       * @param {number} step
       * @returns {boolean}
       */
      isStepCompleted: (step) => {
        const { completedSteps } = get();
        return completedSteps.includes(step);
      },

      /**
       * Resetear todo el onboarding
       */
      resetOnboarding: () => {
        set({
          currentStep: 1,
          completedSteps: [],
          totalSteps: 3,
          formData: {
            businessInfo: {
              nombre_comercial: '',
              nombre_fiscal: '',
              industria: '',
              estado_id: '',
              ciudad_id: '',
              telefono_principal: '',
            },
            plan: {
              plan_id: null,
              plan_codigo: '',
              plan_nombre: '',
              plan_precio: 0,
              app_seleccionada: null,
            },
            account: {
              email: '',
              password: '',
              nombre_completo: '',
            },
          },
          organizacion_id: null,
          usuario_id: null,
        });
      },

      /**
       * Obtener progreso total (%)
       * @returns {number}
       */
      getProgress: () => {
        const { completedSteps, totalSteps } = get();
        return Math.round((completedSteps.length / totalSteps) * 100);
      },
    }),
    {
      name: 'onboarding-storage', // Nombre en localStorage
    }
  )
);

export default useOnboardingStore;
