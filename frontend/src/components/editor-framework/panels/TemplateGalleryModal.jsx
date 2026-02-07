/**
 * ====================================================================
 * TEMPLATE GALLERY MODAL
 * ====================================================================
 * Modal genérico de galería de templates para ambos módulos.
 * Se parametriza con render props para cards y preview panel.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { useState, useMemo, memo } from 'react';
import { X, Search, Loader2, Sparkles, Check, Star, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Extrae colores del tema de un template (soporta ambos formatos)
 */
function getTemplateColors(template) {
  const tema = template.tema || {};
  return {
    primario: tema.color_primario || template.colores?.primario || '#4F46E5',
    secundario: tema.color_secundario || template.colores?.secundario || '#6366F1',
    fondo: tema.color_fondo || template.colores?.fondo || '#F0F0FF',
  };
}

// ========== DEFAULT CARD ==========

const DefaultGalleryCard = memo(function DefaultGalleryCard({ template, isSelected, onClick }) {
  const { primario, secundario, fondo } = getTemplateColors(template);

  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'text-left bg-white dark:bg-gray-800 rounded-xl overflow-hidden border-2 transition-all w-full',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
      )}
    >
      {/* Visual: thumbnail o gradient */}
      <div className="aspect-[4/3] relative overflow-hidden">
        {template.thumbnail_url ? (
          <img
            src={template.thumbnail_url}
            alt={template.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4"
            style={{
              background: `linear-gradient(135deg, ${primario}22, ${secundario}44, ${fondo})`,
            }}
          >
            <div className="w-full max-w-[100px] space-y-1.5">
              <div
                className="h-1.5 rounded-full mx-auto w-3/4"
                style={{ backgroundColor: primario }}
              />
              <div
                className="rounded-lg p-2.5 text-center"
                style={{ backgroundColor: `${secundario}88` }}
              >
                <div
                  className="text-[9px] font-bold mb-0.5"
                  style={{ color: template.tema?.color_texto || '#1f2937' }}
                >
                  Plantilla
                </div>
                <div
                  className="h-0.5 rounded w-full mb-1"
                  style={{ backgroundColor: primario }}
                />
                <div className="flex justify-center gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: fondo,
                        border: `1px solid ${primario}`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div
                className="h-1 rounded-full mx-auto w-1/2"
                style={{ backgroundColor: secundario }}
              />
            </div>
            <Sparkles
              className="w-6 h-6 mt-2 opacity-40"
              style={{ color: primario }}
            />
          </div>
        )}

        {/* Badges */}
        {template.es_destacado && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Destacado
          </div>
        )}
        {template.es_premium && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Premium
          </div>
        )}

        {/* Selected indicator */}
        {isSelected && !template.es_destacado && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
          {template.nombre}
        </h3>
        {template.descripcion && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
            {template.descripcion}
          </p>
        )}
        {/* Color dots */}
        <div className="flex items-center gap-1 mt-1.5">
          <div
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: primario }}
          />
          <div
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: secundario }}
          />
          {template.veces_usado > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
              {template.veces_usado}x usado
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
});

// ========== DEFAULT PREVIEW ==========

function DefaultPreviewPanel({ template, onApply, isApplying, onClose, applyButtonText }) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {template.nombre}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {template.descripcion && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {template.descripcion}
          </p>
        )}
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
          {template.thumbnail_url ? (
            <img
              src={template.thumbnail_url}
              alt={template.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Incluye:
          </h4>
          <ul className="space-y-2">
            {[
              'Diseño profesional optimizado',
              'Secciones pre-configuradas',
              'Tema de colores personalizable',
              'Responsive (móvil y escritorio)',
              'Listo para publicar',
            ].map((feature, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onApply}
          disabled={isApplying}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {isApplying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Aplicando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              {applyButtonText}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ========== MAIN MODAL ==========

/**
 * TemplateGalleryModal - Modal genérico de galería de templates
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback para cerrar
 * @param {Array} props.templates - Lista de templates
 * @param {boolean} [props.isLoading] - Cargando templates
 * @param {Array<{key: string, label: string}>} [props.categories] - Categorías para filtrar
 * @param {string} [props.categoryField] - Campo del template para filtrar por categoría
 * @param {Function} [props.renderCard] - (template, isSelected, onClick) => ReactNode
 * @param {Function} [props.renderPreview] - (template, { onApply, isApplying, onClose }) => ReactNode
 * @param {number} [props.previewWidth] - Ancho del panel preview (default 320)
 * @param {Function} props.onApply - Callback al aplicar template
 * @param {boolean} [props.isApplying] - Aplicando template
 * @param {string} [props.title] - Título del modal
 * @param {string} [props.subtitle] - Subtítulo del modal
 * @param {string} [props.searchPlaceholder] - Placeholder del buscador
 * @param {string} [props.emptyMessage] - Mensaje cuando no hay templates
 * @param {string} [props.applyButtonText] - Texto del botón aplicar
 */
function TemplateGalleryModal({
  isOpen,
  onClose,
  templates = [],
  isLoading = false,
  categories = [],
  categoryField = 'categoria',
  renderCard,
  renderPreview,
  previewWidth = 320,
  onApply,
  isApplying = false,
  title = 'Galería de Plantillas',
  subtitle = 'Elige un diseño profesional',
  searchPlaceholder = 'Buscar plantilla...',
  emptyMessage = 'No se encontraron plantillas',
  applyButtonText = 'Usar esta plantilla',
}) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado
  const filteredTemplates = useMemo(() => {
    let result = templates;

    if (selectedCategory) {
      result = result.filter((t) => t[categoryField] === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.nombre?.toLowerCase().includes(query) ||
          t.descripcion?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [templates, selectedCategory, searchQuery, categoryField]);

  const handleApply = () => {
    if (selectedTemplate && onApply) {
      onApply(selectedTemplate);
    }
  };

  const handleClosePreview = () => {
    setSelectedTemplate(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" />
                {title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filters */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    !selectedCategory
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  Todas
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      selectedCategory === cat.key
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {emptyMessage}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) =>
                    renderCard ? (
                      <div key={template.id}>
                        {renderCard(
                          template,
                          selectedTemplate?.id === template.id,
                          () => setSelectedTemplate(template)
                        )}
                      </div>
                    ) : (
                      <DefaultGalleryCard
                        key={template.id}
                        template={template}
                        isSelected={selectedTemplate?.id === template.id}
                        onClick={() => setSelectedTemplate(template)}
                      />
                    )
                  )}
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <AnimatePresence>
              {selectedTemplate && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: previewWidth, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden flex-shrink-0"
                >
                  {renderPreview ? (
                    renderPreview(selectedTemplate, {
                      onApply: handleApply,
                      isApplying,
                      onClose: handleClosePreview,
                    })
                  ) : (
                    <DefaultPreviewPanel
                      template={selectedTemplate}
                      onApply={handleApply}
                      isApplying={isApplying}
                      onClose={handleClosePreview}
                      applyButtonText={applyButtonText}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default memo(TemplateGalleryModal);
