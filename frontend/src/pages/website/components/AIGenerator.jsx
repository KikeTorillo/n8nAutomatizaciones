/**
 * ====================================================================
 * AI GENERATOR
 * ====================================================================
 * Componentes para generación de contenido con IA en el editor de website.
 */

import { useState, useCallback, memo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { websiteApi } from '@/services/api/modules/website.api';

// ========== AI GENERATE BUTTON ==========

/**
 * Botón para generar contenido con IA
 *
 * @param {Object} props
 * @param {string} props.tipo - Tipo de bloque (hero, servicios, etc.)
 * @param {string} props.campo - Campo específico a generar
 * @param {string} props.industria - Industria del negocio
 * @param {Object} props.contexto - Contexto adicional
 * @param {Function} props.onGenerate - Callback con el contenido generado
 * @param {string} props.size - Tamaño del botón ('sm' | 'md')
 * @param {string} props.variant - Variante visual ('icon' | 'button')
 */
export const AIGenerateButton = memo(function AIGenerateButton({
  tipo,
  campo,
  industria = 'default',
  contexto = {},
  onGenerate,
  size = 'sm',
  variant = 'icon',
  className,
}) {
  const generateMutation = useMutation({
    mutationFn: () =>
      websiteApi.generarContenidoIA({ tipo, campo, industria, contexto }),
    onSuccess: (data) => {
      onGenerate?.(data.contenido);
      if (data.generado_con_ia) {
        toast.success('Contenido generado con IA');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Error al generar contenido');
    },
  });

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending}
        className={cn(
          'p-1 rounded transition-colors',
          'text-purple-500 hover:text-purple-600 hover:bg-purple-50',
          'dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        title="Generar con IA"
      >
        {generateMutation.isPending ? (
          <Loader2 className={cn('animate-spin', size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
        ) : (
          <Sparkles className={cn(size === 'sm' ? 'w-4 h-4' : 'w-5 h-5')} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => generateMutation.mutate()}
      disabled={generateMutation.isPending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors',
        'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
        'hover:from-purple-600 hover:to-pink-600',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base',
        className
      )}
    >
      {generateMutation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      <span>{generateMutation.isPending ? 'Generando...' : 'Generar con IA'}</span>
    </button>
  );
});

// ========== AI BLOCK GENERATOR ==========

/**
 * Modal/Card para generar contenido completo de un bloque
 *
 * @param {Object} props
 * @param {string} props.tipo - Tipo de bloque
 * @param {string} props.industria - Industria del negocio
 * @param {Function} props.onGenerate - Callback con el contenido completo
 * @param {Function} props.onClose - Callback para cerrar
 */
export const AIBlockGenerator = memo(function AIBlockGenerator({
  tipo,
  industria = 'default',
  onGenerate,
  onClose,
}) {
  const [selectedIndustria, setSelectedIndustria] = useState(industria);

  const generateMutation = useMutation({
    mutationFn: () =>
      websiteApi.generarBloqueIA({
        tipo,
        industria: selectedIndustria,
      }),
    onSuccess: (data) => {
      onGenerate?.(data.contenido);
      toast.success(
        data.generado_con_ia
          ? 'Contenido generado con IA'
          : 'Contenido generado con plantilla'
      );
      onClose?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Error al generar contenido');
    },
  });

  const industrias = [
    { value: 'salon', label: 'Salón de Belleza' },
    { value: 'restaurante', label: 'Restaurante' },
    { value: 'consultorio', label: 'Consultorio Médico' },
    { value: 'gym', label: 'Gimnasio' },
    { value: 'default', label: 'Otro Negocio' },
  ];

  return (
    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <Wand2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-purple-900 dark:text-purple-100">
            Generar con IA
          </h4>
          <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
            Crea contenido automáticamente
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
            Tipo de negocio
          </label>
          <select
            value={selectedIndustria}
            onChange={(e) => setSelectedIndustria(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            {industrias.map((ind) => (
              <option key={ind.value} value={ind.value}>
                {ind.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generar
              </>
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ========== AI TEXT FIELD WRAPPER ==========

/**
 * Wrapper para campos de texto con botón de IA
 *
 * @param {Object} props
 * @param {string} props.value - Valor actual del campo
 * @param {Function} props.onChange - Callback de cambio
 * @param {string} props.tipo - Tipo de bloque
 * @param {string} props.campo - Campo específico
 * @param {string} props.industria - Industria
 * @param {React.ReactNode} props.children - Input/textarea children
 */
export const AITextField = memo(function AITextField({
  value,
  onChange,
  tipo,
  campo,
  industria = 'default',
  contexto = {},
  children,
  className,
}) {
  const handleGenerate = useCallback(
    (contenido) => {
      onChange?.(contenido);
    },
    [onChange]
  );

  return (
    <div className={cn('relative group', className)}>
      {children}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <AIGenerateButton
          tipo={tipo}
          campo={campo}
          industria={industria}
          contexto={contexto}
          onGenerate={handleGenerate}
          size="sm"
          variant="icon"
        />
      </div>
    </div>
  );
});

// ========== AI SUGGESTION BANNER ==========

/**
 * Banner que sugiere generar contenido con IA para bloques vacíos
 *
 * @param {Object} props
 * @param {string} props.tipo - Tipo de bloque
 * @param {string} props.industria - Industria
 * @param {Function} props.onGenerate - Callback con contenido generado
 */
export const AISuggestionBanner = memo(function AISuggestionBanner({
  tipo,
  industria = 'default',
  onGenerate,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-lg text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">
              ¿Quieres que generemos contenido con IA?
            </span>
          </button>
        ) : (
          <AIBlockGenerator
            tipo={tipo}
            industria={industria}
            onGenerate={onGenerate}
            onClose={() => setIsExpanded(false)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
});

export default AIGenerateButton;
