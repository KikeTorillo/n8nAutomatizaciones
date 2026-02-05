/**
 * ====================================================================
 * SECCIONES TO BLOQUES
 * ====================================================================
 * Utilidades para convertir entre formato de secciones (modo libre)
 * y formato de bloques (API existente).
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

/**
 * Convierte secciones del store de posición libre a formato de bloques
 * compatible con la API existente.
 *
 * @param {Array} secciones - Secciones del store
 * @returns {Array} Bloques en formato API
 */
export function seccionesToBloques(secciones) {
  if (!Array.isArray(secciones)) return [];

  return secciones.map((seccion, index) => ({
    id: seccion.id,
    tipo: 'seccion_libre',
    orden: index,
    visible: seccion.visible !== false,
    contenido: {
      config: seccion.config || {},
      elementos: seccion.elementos || [],
    },
    estilos: {},
    version: 1,
  }));
}

/**
 * Detecta si los bloques contienen secciones del modo libre.
 *
 * @param {Array} bloques - Bloques de la API
 * @returns {boolean} True si hay secciones libres
 */
export function detectarModoLibre(bloques) {
  if (!Array.isArray(bloques)) return false;
  return bloques.some((b) => b.tipo === 'seccion_libre');
}

/**
 * Normaliza el objeto config, convirtiendo strings a números donde corresponde.
 * Esto es necesario porque JSON puede convertir números a strings.
 *
 * @param {Object} config - Configuración de la sección
 * @returns {Object} Configuración normalizada
 */
function normalizarConfig(config) {
  if (!config) return {};

  const normalizado = { ...config };

  // Normalizar altura
  if (normalizado.altura) {
    normalizado.altura = {
      ...normalizado.altura,
      valor: normalizado.altura.valor != null
        ? Number(normalizado.altura.valor)
        : 100,
    };
  }

  // Normalizar padding
  if (normalizado.padding) {
    normalizado.padding = {
      top: normalizado.padding.top != null ? Number(normalizado.padding.top) : 40,
      bottom: normalizado.padding.bottom != null ? Number(normalizado.padding.bottom) : 40,
    };
  }

  // Normalizar overlay opacidad
  if (normalizado.fondo?.overlay) {
    normalizado.fondo = {
      ...normalizado.fondo,
      overlay: {
        ...normalizado.fondo.overlay,
        opacidad: normalizado.fondo.overlay.opacidad != null
          ? Number(normalizado.fondo.overlay.opacidad)
          : 0.4,
      },
    };
  }

  return normalizado;
}

/**
 * Normaliza un elemento, convirtiendo strings a números en posición/tamaño.
 * Las propiedades de posición están dentro de elemento.posicion (español).
 *
 * @param {Object} elemento - Elemento de la sección
 * @returns {Object} Elemento normalizado
 */
function normalizarElemento(elemento) {
  if (!elemento) return elemento;

  // Normalizar objeto posicion (donde realmente están las coordenadas)
  const posicionOriginal = elemento.posicion || {};
  const posicion = {
    x: posicionOriginal.x != null ? Number(posicionOriginal.x) : 50,
    y: posicionOriginal.y != null ? Number(posicionOriginal.y) : 50,
    ancho: posicionOriginal.ancho != null
      ? (posicionOriginal.ancho === 'auto' ? 'auto' : Number(posicionOriginal.ancho))
      : 60,
    altura: posicionOriginal.altura != null
      ? (posicionOriginal.altura === 'auto' ? 'auto' : Number(posicionOriginal.altura))
      : 'auto',
    ancla: posicionOriginal.ancla || 'center',
    rotacion: posicionOriginal.rotacion != null ? Number(posicionOriginal.rotacion) : 0,
  };

  return {
    ...elemento,
    posicion,
    capa: elemento.capa != null ? Number(elemento.capa) : 1,
  };
}

/**
 * Convierte bloques con tipo 'seccion_libre' a formato de secciones
 * para el store de posición libre.
 *
 * @param {Array} bloques - Bloques de la API
 * @returns {Array} Secciones para el store
 */
export function bloquesToSecciones(bloques) {
  if (!Array.isArray(bloques)) return [];

  return bloques
    .filter((b) => b.tipo === 'seccion_libre')
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((b) => ({
      id: b.id,
      orden: b.orden ?? 0,
      visible: b.visible !== false,
      config: normalizarConfig(b.contenido?.config),
      elementos: (b.contenido?.elementos || []).map(normalizarElemento),
    }));
}

/**
 * Genera un hash simple para detectar cambios en las secciones.
 * Usado por useAutosave para comparar estados.
 *
 * @param {Array} secciones - Secciones del store
 * @returns {string} Hash de las secciones
 */
export function hashSecciones(secciones) {
  if (!Array.isArray(secciones)) return '';
  return JSON.stringify(secciones);
}

/**
 * Compara dos arrays de secciones para determinar si son iguales.
 *
 * @param {Array} a - Primer array de secciones
 * @param {Array} b - Segundo array de secciones
 * @returns {boolean} True si son iguales
 */
export function seccionesEqual(a, b) {
  return hashSecciones(a) === hashSecciones(b);
}
