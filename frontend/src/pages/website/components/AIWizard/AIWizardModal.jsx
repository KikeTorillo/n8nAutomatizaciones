/**
 * ====================================================================
 * AI WIZARD MODAL
 * ====================================================================
 * Modal multi-paso para generar un sitio web completo con IA.
 * Guia al usuario a traves del proceso de descripcion, industria,
 * estilo y preview antes de aplicar.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
  Wand2,
  Building2,
  Palette,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui';
import websiteApi from '@/services/api/modules/website.api';

// Industrias disponibles (20 total)
const INDUSTRIAS = [
  // Originales
  { id: 'salon', nombre: 'Salon de Belleza', emoji: '💇', descripcion: 'Peluquerias, spas, esteticas' },
  { id: 'restaurante', nombre: 'Restaurante', emoji: '🍽️', descripcion: 'Restaurantes, cafes, bares' },
  { id: 'consultorio', nombre: 'Consultorio', emoji: '🏥', descripcion: 'Medicos, dentistas, psicologos' },
  { id: 'gym', nombre: 'Gimnasio', emoji: '💪', descripcion: 'Gyms, studios de fitness, yoga' },
  { id: 'tienda', nombre: 'Tienda', emoji: '🛍️', descripcion: 'Tiendas, boutiques, comercios' },
  { id: 'agencia', nombre: 'Agencia', emoji: '🚀', descripcion: 'Marketing, diseno, software' },
  // Nuevas industrias
  { id: 'ecommerce', nombre: 'E-commerce', emoji: '🛒', descripcion: 'Tienda online, marketplace' },
  { id: 'educacion', nombre: 'Educacion', emoji: '📚', descripcion: 'Cursos, academia, tutoria' },
  { id: 'inmobiliaria', nombre: 'Inmobiliaria', emoji: '🏠', descripcion: 'Venta, renta de propiedades' },
  { id: 'legal', nombre: 'Legal', emoji: '⚖️', descripcion: 'Abogados, notarias, bufetes' },
  { id: 'veterinaria', nombre: 'Veterinaria', emoji: '🐾', descripcion: 'Clinicas, petshops, grooming' },
  { id: 'automotriz', nombre: 'Automotriz', emoji: '🚗', descripcion: 'Talleres, refacciones, autos' },
  { id: 'hotel', nombre: 'Hotel', emoji: '🏨', descripcion: 'Hoteles, hostales, Airbnb' },
  { id: 'eventos', nombre: 'Eventos', emoji: '🎉', descripcion: 'Bodas, fiestas, catering' },
  { id: 'fotografia', nombre: 'Fotografia', emoji: '📷', descripcion: 'Fotografos, estudios, video' },
  { id: 'construccion', nombre: 'Construccion', emoji: '🏗️', descripcion: 'Constructoras, arquitectos' },
  { id: 'coaching', nombre: 'Coaching', emoji: '🎯', descripcion: 'Coaches, mentores, terapeutas' },
  { id: 'finanzas', nombre: 'Finanzas', emoji: '💼', descripcion: 'Contadores, asesores, seguros' },
  { id: 'marketing', nombre: 'Marketing', emoji: '📈', descripcion: 'Agencias digitales, SEO, ads' },
  { id: 'tecnologia', nombre: 'Tecnologia', emoji: '💻', descripcion: 'Software, apps, startups' },
  // Default
  { id: 'default', nombre: 'Otro', emoji: '🏢', descripcion: 'Cualquier otro tipo de negocio' },
];

// Estilos visuales
const ESTILOS = [
  { id: 'moderno', nombre: 'Moderno', descripcion: 'Colores vibrantes y diseno actual', preview: 'bg-gradient-to-r from-primary-500 to-secondary-500' },
  { id: 'minimalista', nombre: 'Minimalista', descripcion: 'Limpio, blanco y elegante', preview: 'bg-white border-2 border-gray-200' },
  { id: 'oscuro', nombre: 'Oscuro', descripcion: 'Fondo oscuro con acentos brillantes', preview: 'bg-gray-900' },
];

// Pasos del wizard
const PASOS = ['descripcion', 'industria', 'estilo', 'preview'];

/**
 * AIWizardModal - Modal principal del wizard
 */
function AIWizardModal({ isOpen, onClose, onSitioCreado }) {
  // Estado del wizard
  const [pasoActual, setPasoActual] = useState(0);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    industria: null,
    estilo: 'moderno',
  });

  // Estado de generacion
  const [isGenerando, setIsGenerando] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isAplicando, setIsAplicando] = useState(false);

  // Handlers de navegacion
  const irSiguiente = useCallback(() => {
    if (pasoActual < PASOS.length - 1) {
      setPasoActual((prev) => prev + 1);
    }
  }, [pasoActual]);

  const irAnterior = useCallback(() => {
    if (pasoActual > 0) {
      setPasoActual((prev) => prev - 1);
    }
  }, [pasoActual]);

  // Validar paso actual
  const puedeAvanzar = useCallback(() => {
    switch (PASOS[pasoActual]) {
      case 'descripcion':
        return formData.nombre.trim().length >= 2 && formData.descripcion.trim().length >= 10;
      case 'industria':
        return formData.industria !== null;
      case 'estilo':
        return formData.estilo !== null;
      case 'preview':
        return preview !== null;
      default:
        return false;
    }
  }, [pasoActual, formData, preview]);

  // Generar preview
  const generarPreview = useCallback(async () => {
    setIsGenerando(true);
    try {
      const response = await websiteApi.generarSitioIA({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        industria: formData.industria,
        estilo: formData.estilo,
        aplicar: false,
      });

      setPreview(response.preview);
      irSiguiente();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al generar preview');
    } finally {
      setIsGenerando(false);
    }
  }, [formData, irSiguiente]);

  // Aplicar sitio
  const aplicarSitio = useCallback(async () => {
    setIsAplicando(true);
    try {
      const response = await websiteApi.generarSitioIA({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        industria: formData.industria,
        estilo: formData.estilo,
        aplicar: true,
      });

      toast.success('Sitio web creado exitosamente');
      onSitioCreado?.(response.sitio);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear sitio');
    } finally {
      setIsAplicando(false);
    }
  }, [formData, onSitioCreado, onClose]);

  // Handler para siguiente paso
  const handleSiguiente = useCallback(() => {
    if (PASOS[pasoActual] === 'estilo') {
      generarPreview();
    } else if (PASOS[pasoActual] === 'preview') {
      aplicarSitio();
    } else {
      irSiguiente();
    }
  }, [pasoActual, generarPreview, aplicarSitio, irSiguiente]);

  // Resetear al cerrar
  const handleClose = useCallback(() => {
    setPasoActual(0);
    setFormData({
      nombre: '',
      descripcion: '',
      industria: null,
      estilo: 'moderno',
    });
    setPreview(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="lg"
      showCloseButton={false}
    >
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Crear sitio con IA
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Paso {pasoActual + 1} de {PASOS.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-700">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
            initial={{ width: 0 }}
            animate={{ width: `${((pasoActual + 1) / PASOS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {PASOS[pasoActual] === 'descripcion' && (
              <StepDescripcion
                key="descripcion"
                formData={formData}
                onChange={setFormData}
              />
            )}
            {PASOS[pasoActual] === 'industria' && (
              <StepIndustria
                key="industria"
                formData={formData}
                onChange={setFormData}
              />
            )}
            {PASOS[pasoActual] === 'estilo' && (
              <StepEstilo
                key="estilo"
                formData={formData}
                onChange={setFormData}
              />
            )}
            {PASOS[pasoActual] === 'preview' && (
              <StepPreview
                key="preview"
                preview={preview}
                formData={formData}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={irAnterior}
            disabled={pasoActual === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              pasoActual === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <button
            onClick={handleSiguiente}
            disabled={!puedeAvanzar() || isGenerando || isAplicando}
            className={cn(
              'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
              puedeAvanzar() && !isGenerando && !isAplicando
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            )}
          >
            {isGenerando || isAplicando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isGenerando ? 'Generando...' : 'Creando...'}
              </>
            ) : PASOS[pasoActual] === 'preview' ? (
              <>
                <Check className="w-4 h-4" />
                Crear sitio
              </>
            ) : PASOS[pasoActual] === 'estilo' ? (
              <>
                <Wand2 className="w-4 h-4" />
                Generar preview
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ========== STEP COMPONENTS ==========

/**
 * Paso 1: Descripcion del negocio
 */
function StepDescripcion({ formData, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wand2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Cuentanos sobre tu negocio
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Con esta informacion generaremos un sitio personalizado para ti.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre del negocio *
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => onChange({ ...formData, nombre: e.target.value })}
            placeholder="Ej: Salon Maria"
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Describe tu negocio *
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => onChange({ ...formData, descripcion: e.target.value })}
            placeholder="Ej: Somos un salon de belleza en CDMX especializado en colorimetria y tratamientos capilares. Ofrecemos cortes, tintes, peinados y manicure."
            rows={4}
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Minimo 10 caracteres. Mientras mas detallado, mejor sera el resultado.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Paso 2: Seleccion de industria
 */
function StepIndustria({ formData, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Que tipo de negocio es?
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Esto nos ayuda a elegir la estructura y contenido ideal.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[320px] overflow-y-auto pr-1">
        {INDUSTRIAS.map((industria) => (
          <button
            key={industria.id}
            onClick={() => onChange({ ...formData, industria: industria.id })}
            className={cn(
              'p-3 rounded-lg border-2 text-left transition-all',
              formData.industria === industria.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <span className="text-xl mb-1 block">{industria.emoji}</span>
            <p className="font-medium text-gray-900 dark:text-white text-xs">
              {industria.nombre}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
              {industria.descripcion}
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Paso 3: Seleccion de estilo
 */
function StepEstilo({ formData, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Palette className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Elige un estilo visual
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Puedes personalizarlo despues en el editor.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ESTILOS.map((estilo) => (
          <button
            key={estilo.id}
            onClick={() => onChange({ ...formData, estilo: estilo.id })}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition-all',
              formData.estilo === estilo.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            )}
          >
            <div
              className={cn(
                'w-full h-20 rounded-lg mb-3',
                estilo.preview
              )}
            />
            <p className="font-medium text-gray-900 dark:text-white">
              {estilo.nombre}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {estilo.descripcion}
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Paso 4: Preview del sitio generado
 */
function StepPreview({ preview, formData }) {
  if (!preview) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          No se pudo generar el preview
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Tu sitio esta listo!
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Revisa la estructura generada antes de crear el sitio.
        </p>
      </div>

      {/* Preview card */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        {/* Config preview */}
        <div className="flex items-start gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: preview.config.color_primario }}
          >
            {formData.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {preview.config.nombre_sitio}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {preview.config.descripcion_seo}
            </p>
          </div>
        </div>

        {/* Pages preview */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Paginas ({preview.paginas.length})
          </h5>
          <div className="space-y-2">
            {preview.paginas.map((pagina, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded text-primary-600 dark:text-primary-400 text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {pagina.titulo}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {pagina.bloques.length} bloques
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Total: {preview.metadata.totalBloques} bloques</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Generado con IA
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default AIWizardModal;
