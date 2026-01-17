import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store de Onboarding con Zustand
 *
 * Fase 2 - Onboarding Simplificado (Nov 2025)
 *
 * Flujo simplificado:
 * 1. Usuario llena formulario (7 campos)
 * 2. Se crea org + suscripción + activación pendiente
 * 3. Usuario recibe email de activación
 * 4. Usuario crea contraseña -> auto-login
 *
 * Este store ahora solo guarda datos temporales durante el proceso de registro.
 */
const useOnboardingStore = create(
  persist(
    (set, get) => ({
      // ========== STATE ==========

      // Datos del formulario de registro
      formData: {
        nombre: '',
        email: '',
        nombre_negocio: '',
        industria: '',
        estado_id: '',
        ciudad_id: '',
        plan: 'trial',
        app_seleccionada: null
      },

      // Estado del proceso
      registroEnviado: false,
      emailEnviado: '',

      // IDs generados durante el proceso (para debugging)
      organizacion_id: null,

      // ========== ACTIONS ==========

      /**
       * Actualizar datos del formulario
       * @param {Object} data - Campos a actualizar
       */
      updateFormData: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            ...data
          }
        }));
      },

      /**
       * Marcar registro como enviado
       * @param {string} email - Email al que se envió la activación
       */
      setRegistroEnviado: (email) => {
        set({
          registroEnviado: true,
          emailEnviado: email
        });
      },

      /**
       * Guardar ID de organización (para debugging)
       * @param {number} orgId
       */
      setOrganizacionId: (orgId) => {
        set({ organizacion_id: orgId });
      },

      /**
       * Resetear todo el onboarding
       */
      resetOnboarding: () => {
        set({
          formData: {
            nombre: '',
            email: '',
            nombre_negocio: '',
            industria: '',
            estado_id: '',
            ciudad_id: '',
            plan: 'trial',
            app_seleccionada: null
          },
          registroEnviado: false,
          emailEnviado: '',
          organizacion_id: null
        });
      }
    }),
    {
      name: 'onboarding-storage', // Nombre en localStorage
    }
  )
);

// ====================================================================
// SELECTORES - Ene 2026: Optimización para evitar re-renders
// Usar estos selectores en lugar de desestructurar todo el store
// ====================================================================

// State
export const selectFormData = (state) => state.formData;
export const selectRegistroEnviado = (state) => state.registroEnviado;
export const selectEmailEnviado = (state) => state.emailEnviado;
export const selectOrganizacionId = (state) => state.organizacion_id;

// Actions
export const selectUpdateFormData = (state) => state.updateFormData;
export const selectSetRegistroEnviado = (state) => state.setRegistroEnviado;
export const selectSetOrganizacionId = (state) => state.setOrganizacionId;
export const selectResetOnboarding = (state) => state.resetOnboarding;

export default useOnboardingStore;
