import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store de Onboarding con Zustand
 * Maneja el flujo de registro y configuración inicial
 */
const useOnboardingStore = create(
  persist(
    (set, get) => ({
      // ========== STATE ==========
      currentStep: 1,
      completedSteps: [],

      // Datos del formulario por paso
      formData: {
        // Paso 1: Información del Negocio
        businessInfo: {
          nombre_comercial: '',
          nombre_fiscal: '',
          industria: '',
          pais: '',
          ciudad: '',
          telefono_principal: '',
        },

        // Paso 2: Plan seleccionado
        plan: {
          plan_id: null,
          plan_codigo: '',       // Código interno (trial, basico, profesional, etc.)
          plan_nombre: '',       // Nombre para mostrar (Plan de Prueba, Plan Básico, etc.)
          plan_precio: 0,
        },

        // Paso 3: Cuenta de usuario
        account: {
          email: '',
          password: '',
          nombre_completo: '',
        },

        // Paso 4: Profesionales
        professionals: [],

        // Paso 5: Servicios
        services: [],

        // Paso 6: WhatsApp (Legacy - Deprecado)
        whatsapp: {
          connected: false,
          phone_number: '',
          session_id: '',
        },

        // Paso 7: Chatbot de Telegram
        telegram: {
          configurado: false,
          bot_token: '',
          nombre_bot: '',
          username_bot: '',
          chatbot_id: null,
          workflow_id: null,
          omitido: false,
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
       * @param {string} section - businessInfo, plan, account, etc.
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
       * Agregar profesional
       * @param {Object} professional
       */
      addProfessional: (professional) => {
        set((state) => ({
          formData: {
            ...state.formData,
            professionals: [...state.formData.professionals, professional],
          },
        }));
      },

      /**
       * Eliminar profesional
       * @param {number} index
       */
      removeProfessional: (index) => {
        set((state) => ({
          formData: {
            ...state.formData,
            professionals: state.formData.professionals.filter((_, i) => i !== index),
          },
        }));
      },

      /**
       * Actualizar profesional
       * @param {number} index
       * @param {Object} data
       */
      updateProfessional: (index, data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            professionals: state.formData.professionals.map((prof, i) =>
              i === index ? { ...prof, ...data } : prof
            ),
          },
        }));
      },

      /**
       * Agregar servicio
       * @param {Object} service
       */
      addService: (service) => {
        set((state) => ({
          formData: {
            ...state.formData,
            services: [...state.formData.services, service],
          },
        }));
      },

      /**
       * Eliminar servicio
       * @param {number} index
       */
      removeService: (index) => {
        set((state) => ({
          formData: {
            ...state.formData,
            services: state.formData.services.filter((_, i) => i !== index),
          },
        }));
      },

      /**
       * Actualizar servicio
       * @param {number} index
       * @param {Object} data
       */
      updateService: (index, data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            services: state.formData.services.map((service, i) =>
              i === index ? { ...service, ...data } : service
            ),
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
          formData: {
            businessInfo: {
              nombre_comercial: '',
              nombre_fiscal: '',
              industria: '',
              pais: '',
              ciudad: '',
              telefono_principal: '',
            },
            plan: {
              plan_id: null,
              plan_codigo: '',
              plan_nombre: '',
              plan_precio: 0,
            },
            account: {
              email: '',
              password: '',
              nombre_completo: '',
            },
            professionals: [],
            services: [],
            whatsapp: {
              connected: false,
              phone_number: '',
              session_id: '',
            },
            telegram: {
              configurado: false,
              bot_token: '',
              nombre_bot: '',
              username_bot: '',
              chatbot_id: null,
              workflow_id: null,
              omitido: false,
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
        const { completedSteps } = get();
        const totalSteps = 9;
        return Math.round((completedSteps.length / totalSteps) * 100);
      },
    }),
    {
      name: 'onboarding-storage', // Nombre en localStorage
    }
  )
);

export default useOnboardingStore;
