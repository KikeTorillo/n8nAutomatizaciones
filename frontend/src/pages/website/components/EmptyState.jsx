/**
 * ====================================================================
 * EMPTY STATE - Website Editor
 * ====================================================================
 * Pantalla inicial cuando no existe sitio web.
 * Muestra opciones para crear con IA, elegir template, o empezar de cero.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import {
  Globe2,
  Plus,
  FileText,
  Palette,
  Layout,
  Sparkles,
} from 'lucide-react';
import { BackButton } from '@/components/ui';
import WebsiteTemplateGallery from './WebsiteTemplateGallery';
import AIWizardModal from './AIWizard/AIWizardModal';

/**
 * EmptyState - Estado vacío cuando no hay sitio creado
 *
 * @param {Object} props
 * @param {Function} props.onShowAIWizard - Callback para mostrar wizard IA
 * @param {Function} props.onShowTemplates - Callback para mostrar galería de templates
 * @param {Function} props.onShowCreateSite - Callback para mostrar modal crear sitio
 * @param {boolean} props.mostrarTemplates - Estado del modal de templates
 * @param {Function} props.setMostrarTemplates - Setter del estado de templates
 * @param {boolean} props.mostrarAIWizard - Estado del modal IA
 * @param {Function} props.setMostrarAIWizard - Setter del estado de IA
 */
function EmptyState({
  onShowAIWizard,
  onShowTemplates,
  onShowCreateSite,
  mostrarTemplates,
  setMostrarTemplates,
  mostrarAIWizard,
  setMostrarAIWizard,
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Mi Sitio Web
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Crea tu página web pública
        </p>
      </div>

      {/* Empty state */}
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Globe2 className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Crea tu sitio web
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Diseña una página web profesional para tu negocio con nuestro
            editor visual. Arrastra y suelta bloques para crear tu sitio en
            minutos.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onShowAIWizard}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all font-medium shadow-lg shadow-primary-500/25"
            >
              <Sparkles className="w-5 h-5" />
              Crear con IA
            </button>
            <button
              onClick={onShowTemplates}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Layout className="w-5 h-5" />
              Elegir plantilla
            </button>
            <button
              onClick={onShowCreateSite}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Empezar de cero
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-primary-700 dark:text-primary-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              11 tipos de bloques
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Hero, servicios, equipo, contacto y más
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Palette className="w-6 h-6 text-primary-500 dark:text-primary-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Personalizable
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Colores, fuentes y estilos a tu gusto
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Globe2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              SEO optimizado
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Meta tags y Open Graph incluidos
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WebsiteTemplateGallery
        isOpen={mostrarTemplates}
        onClose={() => setMostrarTemplates(false)}
        onTemplateApplied={() => setMostrarTemplates(false)}
      />
      <AIWizardModal
        isOpen={mostrarAIWizard}
        onClose={() => setMostrarAIWizard(false)}
        onSitioCreado={() => setMostrarAIWizard(false)}
      />
    </div>
  );
}

export default memo(EmptyState);
