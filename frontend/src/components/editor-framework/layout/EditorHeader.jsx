/**
 * ====================================================================
 * EDITOR HEADER - Framework Component
 * ====================================================================
 * Header minimalista reutilizable para editores de bloques.
 * Contiene solo: navegación, identidad del documento y publicación.
 * Los controles de edición van en EditorToolbar.
 *
 * @version 2.0.0
 * @since 2026-02-04
 * @updated 2026-02-04 - Simplificado, controles movidos a EditorToolbar
 */

import { memo } from 'react';
import { ExternalLink, Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/ui';

// ========== MAIN COMPONENT ==========

/**
 * EditorHeader - Header minimalista para editores
 *
 * @param {Object} props
 * @param {string} props.title - Titulo del documento
 * @param {React.ComponentType} props.icon - Icono de Lucide
 * @param {'draft'|'published'} props.status - Estado de publicacion
 * @param {Object} props.statusLabels - Labels personalizados para estados
 * @param {string} props.backTo - Ruta de navegacion al volver
 * @param {string} props.backLabel - Label del boton volver
 * @param {Function} props.onPublish - Callback para publicar/despublicar
 * @param {boolean} props.isPublishing - Si esta publicando
 * @param {Object} props.publishLabels - Labels para publicar/despublicar
 * @param {string} props.viewUrl - URL para ver publicado
 * @param {string} props.viewLabel - Label del link ver
 * @param {boolean} props.isMobile - Si estamos en vista movil
 * @param {string} props.className - Clases adicionales
 */
function EditorHeader({
  // Info del documento
  title,
  icon: Icon,
  status = 'draft',
  statusLabels = { draft: 'Borrador', published: 'Publicado' },

  // Navegacion
  backTo,
  backLabel = 'Volver',

  // Publicacion
  onPublish,
  isPublishing = false,
  publishLabels = { publish: 'Publicar', unpublish: 'Despublicar' },

  // Ver publicado
  viewUrl,
  viewLabel = 'Ver',

  // Responsive
  isMobile = false,

  // Custom class
  className,
}) {
  const isPublished = status === 'published';

  return (
    <header
      className={cn(
        'h-12 sm:h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        'flex items-center justify-between px-2 sm:px-4 flex-shrink-0',
        className
      )}
    >
      {/* === IZQUIERDA: Back + Info === */}
      <div className="flex items-center gap-2 sm:gap-4">
        <BackButton
          to={backTo}
          label={isMobile ? '' : backLabel}
          iconOnly={isMobile}
        />

        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
          )}
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate max-w-[100px] sm:max-w-[200px] md:max-w-none">
            {title}
          </span>
        </div>

        {/* Badge estado */}
        <span
          className={cn(
            'px-1.5 sm:px-2 py-0.5 text-xs rounded-full',
            isPublished
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          )}
        >
          {isMobile
            ? isPublished
              ? 'Pub'
              : 'Borr'
            : isPublished
              ? statusLabels.published
              : statusLabels.draft}
        </span>
      </div>

      {/* === DERECHA: Acciones === */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Ver publicado */}
        {isPublished && viewUrl && (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            title={viewLabel}
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden lg:inline">{viewLabel}</span>
          </a>
        )}

        {/* Publicar */}
        {onPublish && (
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            data-tour="publish-button"
            className={cn(
              'flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-sm',
              isPublished
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            )}
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPublished ? (
              <X className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isPublished ? publishLabels.unpublish : publishLabels.publish}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}

export default memo(EditorHeader);
