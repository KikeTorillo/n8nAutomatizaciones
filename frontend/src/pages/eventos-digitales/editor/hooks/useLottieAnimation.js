/**
 * ====================================================================
 * useLottieAnimation - Hook de carga lazy de animaciones Lottie
 * ====================================================================
 * Carga dinámicamente el JSON de una animación Lottie con cache
 * para evitar re-descargas innecesarias.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import { useState, useEffect } from 'react';
import { getAnimacionById } from '../config/animacionesDecorativas';

// Cache global de animaciones ya cargadas
const animationCache = new Map();

/**
 * Hook para cargar una animación Lottie por ID
 * @param {string} tipoAnimacion - ID de la animación ('sobre', 'globos', 'flores')
 * @returns {{ animationData: object|null, loading: boolean, error: string|null }}
 */
export function useLottieAnimation(tipoAnimacion) {
  const [animationData, setAnimationData] = useState(
    () => animationCache.get(tipoAnimacion) || null
  );
  const [loading, setLoading] = useState(!animationCache.has(tipoAnimacion));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tipoAnimacion) return;

    // Si ya está en cache, usar directamente
    if (animationCache.has(tipoAnimacion)) {
      setAnimationData(animationCache.get(tipoAnimacion));
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const animacion = getAnimacionById(tipoAnimacion);

    animacion
      .loader()
      .then((module) => {
        if (cancelled) return;
        const data = module.default || module;
        animationCache.set(tipoAnimacion, data);
        setAnimationData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`[useLottieAnimation] Error cargando ${tipoAnimacion}:`, err);
        setError('Error al cargar la animación');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tipoAnimacion]);

  return { animationData, loading, error };
}
