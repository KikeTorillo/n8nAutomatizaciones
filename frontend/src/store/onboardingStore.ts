import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ========== TYPES ==========

interface OnboardingFormData {
  nombre: string;
  email: string;
  nombre_negocio: string;
  estado_id: string;
  ciudad_id: string;
  plan: string;
  app_seleccionada: string | null;
}

interface OnboardingState {
  formData: OnboardingFormData;
  registroEnviado: boolean;
  emailEnviado: string;
  organizacion_id: number | null;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  setRegistroEnviado: (email: string) => void;
  setOrganizacionId: (orgId: number) => void;
  resetOnboarding: () => void;
}

const INITIAL_FORM_DATA: OnboardingFormData = {
  nombre: '',
  email: '',
  nombre_negocio: '',
  estado_id: '',
  ciudad_id: '',
  plan: 'trial',
  app_seleccionada: null,
};

/**
 * Store de Onboarding con Zustand
 */
const useOnboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set) => ({
      formData: { ...INITIAL_FORM_DATA },
      registroEnviado: false,
      emailEnviado: '',
      organizacion_id: null,

      updateFormData: (data) => {
        set((state) => ({
          formData: {
            ...state.formData,
            ...data
          }
        }));
      },

      setRegistroEnviado: (email) => {
        set({
          registroEnviado: true,
          emailEnviado: email
        });
      },

      setOrganizacionId: (orgId) => {
        set({ organizacion_id: orgId });
      },

      resetOnboarding: () => {
        set({
          formData: { ...INITIAL_FORM_DATA },
          registroEnviado: false,
          emailEnviado: '',
          organizacion_id: null
        });
      }
    }),
      {
        name: 'onboarding-storage',
        partialize: (state) => ({
          formData: state.formData,
          registroEnviado: state.registroEnviado,
          emailEnviado: state.emailEnviado,
        }),
      }
    ),
    { name: 'OnboardingStore', enabled: import.meta.env.DEV }
  )
);

// ====================================================================
// SELECTORES
// ====================================================================

export const selectFormData = (state: OnboardingState) => state.formData;
export const selectRegistroEnviado = (state: OnboardingState) => state.registroEnviado;
export const selectEmailEnviado = (state: OnboardingState) => state.emailEnviado;
export const selectOrganizacionId = (state: OnboardingState) => state.organizacion_id;

export const selectUpdateFormData = (state: OnboardingState) => state.updateFormData;
export const selectSetRegistroEnviado = (state: OnboardingState) => state.setRegistroEnviado;
export const selectSetOrganizacionId = (state: OnboardingState) => state.setOrganizacionId;
export const selectResetOnboarding = (state: OnboardingState) => state.resetOnboarding;

export default useOnboardingStore;
