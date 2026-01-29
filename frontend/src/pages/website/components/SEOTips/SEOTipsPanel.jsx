/**
 * ====================================================================
 * SEO TIPS PANEL
 * ====================================================================
 * Panel con sugerencias SEO en tiempo real.
 */

import { memo } from 'react';
import {
  Search,
  FileText,
  Layout,
  Target,
  Eye,
  Smartphone,
  ChevronDown,
  Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import SEOScore from './SEOScore';
import SEORule from './SEORule';
import { useSEOAnalysis } from './useSEOAnalysis';
import { SEO_CATEGORIES } from './seoRules';

// Iconos por categoria
const CATEGORY_ICONS = {
  seo: Search,
  contenido: FileText,
  estructura: Layout,
  conversion: Target,
  accesibilidad: Eye,
  usabilidad: Smartphone,
};

/**
 * Panel de tips SEO
 *
 * @param {Object} props
 * @param {Object} props.config - Configuracion del sitio
 * @param {Object} props.pagina - Pagina activa
 * @param {Array} props.bloques - Bloques de la pagina
 * @param {boolean} props.compacto - Modo compacto
 */
function SEOTipsPanel({ config, pagina, bloques = [], compacto = false }) {
  const {
    score,
    nivel,
    reglas,
    sugerencias,
    estadisticas,
  } = useSEOAnalysis({ config, pagina, bloques });

  if (compacto) {
    return (
      <div className="space-y-3">
        {/* Score compacto */}
        <div className="flex items-center gap-3">
          <SEOScore score={score} nivel={nivel} size={60} />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {estadisticas.pasadas}/{estadisticas.total} reglas
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {sugerencias.length > 0
                ? `${sugerencias.length} mejoras sugeridas`
                : 'Todo optimizado'}
            </p>
          </div>
        </div>

        {/* Sugerencias principales */}
        {sugerencias.length > 0 && (
          <div className="space-y-1.5">
            {sugerencias.slice(0, 3).map((sug) => (
              <div
                key={sug.id}
                className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400"
              >
                <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{sug.mensaje}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header con score */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Analisis SEO
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Optimiza tu sitio para buscadores
            </p>
          </div>
          <SEOScore score={score} nivel={nivel} size={80} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {estadisticas.pasadas}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
              Pasadas
            </p>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {estadisticas.fallidas}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
              Fallidas
            </p>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {estadisticas.total}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
              Total
            </p>
          </div>
        </div>
      </div>

      {/* Sugerencias prioritarias */}
      {sugerencias.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Mejoras sugeridas
          </h4>
          <div className="space-y-2">
            {sugerencias.map((sug) => {
              const Icon = CATEGORY_ICONS[sug.categoria] || Search;
              return (
                <div
                  key={sug.id}
                  className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
                >
                  <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                      {sug.nombre}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      {sug.mensaje}
                    </p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded flex-shrink-0">
                    {sug.peso}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de reglas */}
      <div className="p-4">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          Todas las reglas
        </h4>
        <div className="space-y-2">
          {reglas.map((regla) => (
            <SEORule
              key={regla.id}
              regla={regla}
              showDescripcion={!regla.resultado.valido}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(SEOTipsPanel);
