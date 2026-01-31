/**
 * ====================================================================
 * AI WRITER POPOVER
 * ====================================================================
 * Popover para generar texto con IA desde el panel de propiedades.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Check, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ToneSelector from './ToneSelector';
import { useAIWriter } from './useAIWriter';

/**
 * Popover de AI Writer
 *
 * @param {Object} props
 * @param {string} props.campo - Nombre del campo a generar
 * @param {string} props.industria - Industria del negocio
 * @param {Object} props.contexto - Contexto adicional para la generacion
 * @param {Function} props.onGenerate - Callback al generar texto (recibe el texto)
 * @param {Object} props.position - { top, left } posicion del popover
 * @param {Function} props.onClose - Callback para cerrar
 * @param {boolean} props.isOpen - Si el popover esta abierto
 */
function AIWriterPopover({
  campo,
  industria = 'default',
  contexto = {},
  onGenerate,
  position,
  onClose,
  isOpen = false,
}) {
  const popoverRef = useRef(null);
  const [previewText, setPreviewText] = useState(null);

  const {
    selectedTono,
    selectedLongitud,
    isGenerating,
    generatedText,
    setTono,
    setLongitud,
    generateText,
    reset,
  } = useAIWriter({
    industria,
    onSuccess: (texto) => {
      setPreviewText(texto);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Click fuera para cerrar
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Generar texto
  const handleGenerate = useCallback(() => {
    generateText(campo, contexto);
  }, [campo, contexto, generateText]);

  // Aplicar texto generado
  const handleApply = useCallback(() => {
    if (previewText) {
      onGenerate?.(previewText);
      handleClose();
    }
  }, [previewText, onGenerate]);

  // Cerrar y resetear
  const handleClose = useCallback(() => {
    setPreviewText(null);
    reset();
    onClose?.();
  }, [reset, onClose]);

  // Calcular si estamos en móvil
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop en móvil */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleClose}
        />
      )}
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, scale: 0.95, y: isMobile ? 20 : -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: isMobile ? 20 : -5 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col",
          isMobile
            ? "inset-x-4 bottom-4 max-h-[70vh]"
            : "w-72 max-h-[80vh]"
        )}
        style={isMobile ? {} : {
          top: Math.min(position?.top || 0, (typeof window !== 'undefined' ? window.innerHeight : 800) - 400),
          left: Math.max(16, Math.min(position?.left || 0, (typeof window !== 'undefined' ? window.innerWidth : 400) - 320)),
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium text-sm">Generar con IA</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          {/* Selector de tono y longitud */}
          <ToneSelector
            selectedTono={selectedTono}
            selectedLongitud={selectedLongitud}
            onTonoChange={setTono}
            onLongitudChange={setLongitud}
            disabled={isGenerating}
          />

          {/* Preview del texto generado */}
          {previewText && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {previewText}
              </p>
            </div>
          )}
        </div>

        {/* Botones de accion - siempre visibles */}
        <div className="px-4 pb-3 pt-2 flex gap-2 border-t border-gray-100 dark:border-gray-700">
          {!previewText ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                isGenerating
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-wait'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              )}
            >
              {isGenerating ? (
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
          ) : (
            <>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className={cn('w-4 h-4', isGenerating && 'animate-spin')} />
                Regenerar
              </button>
              <button
                onClick={handleApply}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Usar texto
              </button>
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
            Generado con IA para "{campo}"
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AIWriterPopover;
