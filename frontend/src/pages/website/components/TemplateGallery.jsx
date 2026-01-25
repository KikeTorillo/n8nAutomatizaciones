/**
 * ====================================================================
 * TEMPLATE GALLERY
 * ====================================================================
 * Galería de templates prediseñados para crear sitios web.
 * Permite explorar, previsualizar y aplicar templates.
 */

import { useState, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Search,
  Loader2,
  Sparkles,
  Star,
  Check,
  Eye,
  ChevronRight,
  Building2,
  Scissors,
  UtensilsCrossed,
  Stethoscope,
  Dumbbell,
  Rocket,
  Briefcase,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { websiteApi } from '@/services/api/modules/website.api';

// ========== INDUSTRIA ICONS ==========

const INDUSTRIA_ICONS = {
  salon: Scissors,
  restaurante: UtensilsCrossed,
  consultorio: Stethoscope,
  gym: Dumbbell,
  landing: Rocket,
  portfolio: Briefcase,
  tienda: Building2,
  agencia: Building2,
};

const INDUSTRIA_COLORS = {
  salon: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  restaurante: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  consultorio: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gym: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  landing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  portfolio: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  tienda: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  agencia: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

// ========== MAIN COMPONENT ==========

/**
 * TemplateGallery
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback para cerrar
 * @param {Function} props.onTemplateApplied - Callback cuando se aplica template
 */
function TemplateGallery({ isOpen, onClose, onTemplateApplied }) {
  const queryClient = useQueryClient();
  const [selectedIndustria, setSelectedIndustria] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ========== QUERIES ==========

  // Listar templates
  const {
    data: templates = [],
    isLoading: loadingTemplates,
  } = useQuery({
    queryKey: ['website', 'templates', selectedIndustria],
    queryFn: () =>
      websiteApi.listarTemplates({ industria: selectedIndustria }),
    enabled: isOpen,
  });

  // Listar industrias
  const { data: industrias = [] } = useQuery({
    queryKey: ['website', 'templates', 'industrias'],
    queryFn: () => websiteApi.listarIndustrias(),
    enabled: isOpen,
  });

  // ========== MUTATIONS ==========

  const aplicarTemplate = useMutation({
    mutationFn: (templateId) => websiteApi.aplicarTemplate(templateId, {}),
    onSuccess: () => {
      toast.success('Template aplicado exitosamente');
      queryClient.invalidateQueries(['website']);
      onTemplateApplied?.();
      onClose?.();
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Error al aplicar template'
      );
    },
  });

  // ========== FILTRADO ==========

  const templatesFiltrados = templates.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.nombre.toLowerCase().includes(query) ||
      t.descripcion?.toLowerCase().includes(query)
    );
  });

  // ========== RENDER ==========

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
                Galería de Templates
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Elige un diseño profesional para tu sitio web
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
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar templates..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Industry Filters */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedIndustria(null)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  !selectedIndustria
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                Todos
              </button>
              {industrias.map((ind) => {
                const Icon = INDUSTRIA_ICONS[ind.industria] || Building2;
                return (
                  <button
                    key={ind.industria}
                    onClick={() => setSelectedIndustria(ind.industria)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      selectedIndustria === ind.industria
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {ind.label}
                    <span className="text-xs opacity-70">
                      ({ind.total_templates})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : templatesFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No se encontraron templates
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templatesFiltrados.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplate?.id === template.id}
                      onClick={() => setSelectedTemplate(template)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <AnimatePresence>
              {selectedTemplate && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden"
                >
                  <TemplatePreview
                    template={selectedTemplate}
                    onApply={() => aplicarTemplate.mutate(selectedTemplate.id)}
                    isApplying={aplicarTemplate.isPending}
                    onClose={() => setSelectedTemplate(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ========== TEMPLATE CARD ==========

const TemplateCard = memo(function TemplateCard({
  template,
  isSelected,
  onClick,
}) {
  const Icon = INDUSTRIA_ICONS[template.industria] || Building2;
  const colorClass = INDUSTRIA_COLORS[template.industria] || 'bg-gray-100 text-gray-700';

  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'text-left bg-white dark:bg-gray-800 rounded-xl overflow-hidden border-2 transition-all',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
      )}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
        {template.thumbnail_url ? (
          <img
            src={template.thumbnail_url}
            alt={template.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Featured Badge */}
        {template.es_destacado && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Destacado
          </div>
        )}

        {/* Premium Badge */}
        {template.es_premium && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">
            Premium
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {template.nombre}
          </h3>
          <span
            className={cn(
              'flex-shrink-0 p-1 rounded',
              colorClass
            )}
          >
            <Icon className="w-4 h-4" />
          </span>
        </div>

        {template.descripcion && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {template.descripcion}
          </p>
        )}

        {/* Stats */}
        {template.veces_usado > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Usado {template.veces_usado} veces
          </p>
        )}
      </div>
    </motion.button>
  );
});

// ========== TEMPLATE PREVIEW ==========

function TemplatePreview({ template, onApply, isApplying, onClose }) {
  const Icon = INDUSTRIA_ICONS[template.industria] || Building2;

  return (
    <div className="w-80 h-full flex flex-col">
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

      {/* Preview */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Thumbnail */}
        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
          {template.thumbnail_url ? (
            <img
              src={template.thumbnail_url}
              alt={template.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>

        {/* Features */}
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
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
              Usar este template
            </>
          )}
        </button>

        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <Eye className="w-4 h-4" />
          Ver demo
        </button>
      </div>
    </div>
  );
}

export default memo(TemplateGallery);
