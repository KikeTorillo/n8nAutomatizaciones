/**
 * ====================================================================
 * USE SEO ANALYSIS HOOK
 * ====================================================================
 * Hook para analizar SEO en tiempo real.
 */

import { useMemo } from 'react';
import { calcularScoreSEO } from './seoRules';

/**
 * Hook para analizar SEO
 * @param {Object} options
 * @param {Object} options.config - Configuracion del sitio
 * @param {Object} options.pagina - Pagina activa
 * @param {Array} options.bloques - Bloques de la pagina
 * @returns {Object} Resultados del analisis SEO
 */
export function useSEOAnalysis({ config, pagina, bloques = [] } = {}) {
  // Calcular score SEO en tiempo real
  const analisis = useMemo(() => {
    const datos = {
      config,
      pagina,
      bloques,
    };

    return calcularScoreSEO(datos);
  }, [config, pagina, bloques]);

  // Agrupar reglas por categoria
  const reglasPorCategoria = useMemo(() => {
    const grupos = {};

    analisis.reglas.forEach((regla) => {
      if (!grupos[regla.categoria]) {
        grupos[regla.categoria] = [];
      }
      grupos[regla.categoria].push(regla);
    });

    return grupos;
  }, [analisis.reglas]);

  // Estadisticas rapidas
  const estadisticas = useMemo(() => {
    const pasadas = analisis.reglas.filter((r) => r.resultado.valido).length;
    const fallidas = analisis.reglas.filter((r) => !r.resultado.valido).length;
    const total = analisis.reglas.length;

    return {
      pasadas,
      fallidas,
      total,
      porcentajePasadas: Math.round((pasadas / total) * 100),
    };
  }, [analisis.reglas]);

  return {
    score: analisis.score,
    nivel: analisis.nivel,
    reglas: analisis.reglas,
    reglasPorCategoria,
    sugerencias: analisis.sugerencias,
    estadisticas,
  };
}

export default useSEOAnalysis;
