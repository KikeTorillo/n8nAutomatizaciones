/**
 * ====================================================================
 * ELEMENT TYPES REGISTRY
 * ====================================================================
 * Registry centralizado de tipos de elementos para el canvas de posición libre.
 * Cada módulo (Invitaciones, Website) puede registrar sus propios tipos.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import {
  Type,
  Image,
  MousePointer,
  Square,
  Minus,
  Play,
} from 'lucide-react';

// ========== REGISTRY ==========

/**
 * Registry de tipos de elementos
 * Estructura: { [tipo]: ElementTypeConfig }
 */
const elementTypesRegistry = new Map();

// ========== ELEMENT TYPE CONFIG SCHEMA ==========

/**
 * @typedef {Object} ElementTypeConfig
 * @property {string} tipo - Identificador único del tipo
 * @property {string} label - Nombre para mostrar
 * @property {string} categoria - Categoría para agrupar en paleta
 * @property {React.ComponentType} icon - Icono para la paleta
 * @property {string[]} variantes - Variantes disponibles (ej: titulo, subtitulo)
 * @property {Object} defaultSize - Tamaño por defecto { ancho, altura }
 * @property {Object} defaultPosition - Posición por defecto { x, y, ancla }
 * @property {Object} defaultContent - Contenido inicial
 * @property {Object} defaultStyles - Estilos iniciales
 * @property {React.ComponentType} renderer - Componente para renderizar el elemento
 * @property {React.ComponentType} editor - Componente para editar propiedades
 * @property {boolean} canResize - Si permite redimensionar
 * @property {boolean} canRotate - Si permite rotar
 * @property {boolean} maintainAspectRatio - Si mantiene proporción al resize
 */

// ========== BUILT-IN ELEMENT TYPES ==========

/**
 * Tipos de elementos base (compartidos por todos los módulos)
 */
export const BUILT_IN_ELEMENT_TYPES = {
  texto: {
    tipo: 'texto',
    label: 'Texto',
    categoria: 'basico',
    icon: Type,
    variantes: ['titulo', 'subtitulo', 'parrafo', 'cita', 'etiqueta'],
    defaultSize: { ancho: 60, altura: 'auto' },
    defaultPosition: { x: 50, y: 50, ancla: 'center' },
    defaultContent: {
      texto: 'Texto de ejemplo',
      variante: 'parrafo',
    },
    defaultStyles: {
      fuente: null, // null = usa tema
      tamano: 'base',
      color: null,
      alineacion: 'center',
      peso: 'normal',
      espaciadoLetras: 0,
      espaciadoLineas: 1.5,
    },
    canResize: true,
    canRotate: false,
    maintainAspectRatio: false,
  },

  imagen: {
    tipo: 'imagen',
    label: 'Imagen',
    categoria: 'media',
    icon: Image,
    variantes: ['foto', 'icono', 'avatar', 'logo', 'decoracion'],
    defaultSize: { ancho: 40, altura: 'auto' },
    defaultPosition: { x: 50, y: 50, ancla: 'center' },
    defaultContent: {
      url: '',
      alt: '',
      variante: 'foto',
    },
    defaultStyles: {
      objetoFit: 'cover',
      borderRadius: 0,
      sombra: 'none',
      opacidad: 100,
    },
    canResize: true,
    canRotate: true,
    maintainAspectRatio: true,
  },

  boton: {
    tipo: 'boton',
    label: 'Botón',
    categoria: 'interaccion',
    icon: MousePointer,
    variantes: ['primario', 'secundario', 'outline', 'ghost', 'link'],
    defaultSize: { ancho: 'auto', altura: 'auto' },
    defaultPosition: { x: 50, y: 70, ancla: 'center' },
    defaultContent: {
      texto: 'Botón',
      variante: 'primario',
      url: '',
      accion: 'link', // link | scroll | modal
    },
    defaultStyles: {
      tamano: 'md', // sm | md | lg | xl
      fullWidth: false,
      icono: null,
      iconoPosicion: 'left',
    },
    canResize: false,
    canRotate: false,
    maintainAspectRatio: false,
  },

  forma: {
    tipo: 'forma',
    label: 'Forma',
    categoria: 'decoracion',
    icon: Square,
    variantes: ['linea', 'rectangulo', 'circulo', 'triangulo'],
    defaultSize: { ancho: 100, altura: 2 },
    defaultPosition: { x: 50, y: 50, ancla: 'center' },
    defaultContent: {
      variante: 'linea',
    },
    defaultStyles: {
      color: null, // null = usa color primario
      opacidad: 100,
      grosor: 2,
      estilo: 'solid', // solid | dashed | dotted
      relleno: false,
      colorRelleno: null,
    },
    canResize: true,
    canRotate: true,
    maintainAspectRatio: false,
  },

  separador: {
    tipo: 'separador',
    label: 'Separador',
    categoria: 'decoracion',
    icon: Minus,
    variantes: ['linea', 'puntos', 'gradiente', 'decorativo'],
    defaultSize: { ancho: 80, altura: 'auto' },
    defaultPosition: { x: 50, y: 50, ancla: 'center' },
    defaultContent: {
      variante: 'linea',
    },
    defaultStyles: {
      grosor: 1,
      color: null,
      estilo: 'solid',
    },
    canResize: true,
    canRotate: false,
    maintainAspectRatio: false,
  },

  video: {
    tipo: 'video',
    label: 'Video',
    categoria: 'media',
    icon: Play,
    variantes: ['embed', 'background'],
    defaultSize: { ancho: 80, altura: 'auto' },
    defaultPosition: { x: 50, y: 50, ancla: 'center' },
    defaultContent: {
      url: '',
      variante: 'embed',
      autoplay: false,
      loop: false,
      muted: true,
      controles: true,
    },
    defaultStyles: {
      borderRadius: 8,
      sombra: 'md',
    },
    canResize: true,
    canRotate: false,
    maintainAspectRatio: true,
  },

  espaciador: {
    tipo: 'espaciador',
    label: 'Espaciador',
    categoria: 'layout',
    icon: Square,
    variantes: ['vertical'],
    defaultSize: { ancho: 100, altura: 40 },
    defaultPosition: { x: 50, y: 50, ancla: 'center' },
    defaultContent: {},
    defaultStyles: {},
    canResize: true,
    canRotate: false,
    maintainAspectRatio: false,
  },
};

// ========== REGISTRY FUNCTIONS ==========

/**
 * Registra un tipo de elemento en el registry
 * @param {ElementTypeConfig} config - Configuración del tipo
 */
export function registerElementType(config) {
  if (!config.tipo) {
    throw new Error('El tipo de elemento debe tener un identificador "tipo"');
  }
  elementTypesRegistry.set(config.tipo, config);
}

/**
 * Registra múltiples tipos de elementos
 * @param {Object.<string, ElementTypeConfig>} types - Tipos a registrar
 */
export function registerElementTypes(types) {
  Object.values(types).forEach(registerElementType);
}

/**
 * Obtiene la configuración de un tipo de elemento
 * @param {string} tipo - Identificador del tipo
 * @returns {ElementTypeConfig|null}
 */
export function getElementType(tipo) {
  return elementTypesRegistry.get(tipo) || BUILT_IN_ELEMENT_TYPES[tipo] || null;
}

/**
 * Obtiene todos los tipos registrados
 * @returns {ElementTypeConfig[]}
 */
export function getAllElementTypes() {
  const builtIn = Object.values(BUILT_IN_ELEMENT_TYPES);
  const custom = Array.from(elementTypesRegistry.values());
  // Evitar duplicados si un built-in fue sobrescrito
  const customTipos = new Set(custom.map(c => c.tipo));
  const filteredBuiltIn = builtIn.filter(b => !customTipos.has(b.tipo));
  return [...filteredBuiltIn, ...custom];
}

/**
 * Obtiene tipos agrupados por categoría
 * @param {string[]} allowedTypes - Tipos permitidos (null = todos)
 * @returns {Object.<string, ElementTypeConfig[]>}
 */
export function getElementTypesByCategory(allowedTypes = null) {
  const allTypes = getAllElementTypes();
  const filtered = allowedTypes
    ? allTypes.filter(t => allowedTypes.includes(t.tipo))
    : allTypes;

  return filtered.reduce((acc, type) => {
    const categoria = type.categoria || 'otros';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(type);
    return acc;
  }, {});
}

/**
 * Limpia el registry (útil para testing)
 */
export function clearElementTypesRegistry() {
  elementTypesRegistry.clear();
}

// ========== CATEGORÍAS ==========

export const ELEMENT_CATEGORIES = {
  basico: {
    id: 'basico',
    label: 'Básico',
    orden: 1,
  },
  media: {
    id: 'media',
    label: 'Media',
    orden: 2,
  },
  interaccion: {
    id: 'interaccion',
    label: 'Interacción',
    orden: 3,
  },
  decoracion: {
    id: 'decoracion',
    label: 'Decoración',
    orden: 4,
  },
  layout: {
    id: 'layout',
    label: 'Layout',
    orden: 5,
  },
  especiales: {
    id: 'especiales',
    label: 'Especiales',
    orden: 6,
  },
};

// ========== HELPERS ==========

/**
 * Crea un nuevo elemento con valores por defecto
 * @param {string} tipo - Tipo del elemento
 * @param {Object} overrides - Sobrescritura de valores
 * @returns {Object} Nuevo elemento
 */
export function createElementFromType(tipo, overrides = {}) {
  const config = getElementType(tipo);
  if (!config) {
    throw new Error(`Tipo de elemento no encontrado: ${tipo}`);
  }

  return {
    id: crypto.randomUUID(),
    tipo: config.tipo,
    variante: overrides.variante || config.defaultContent?.variante || null,
    contenido: {
      ...config.defaultContent,
      ...(overrides.contenido || {}),
    },
    posicion: {
      ...config.defaultPosition,
      ancho: config.defaultSize.ancho,
      altura: config.defaultSize.altura,
      rotacion: 0,
      ...(overrides.posicion || {}),
    },
    responsive: overrides.responsive || {},
    estilos: {
      ...config.defaultStyles,
      ...(overrides.estilos || {}),
    },
    capa: overrides.capa ?? 1,
    visible: overrides.visible ?? true,
  };
}

export default {
  BUILT_IN_ELEMENT_TYPES,
  ELEMENT_CATEGORIES,
  registerElementType,
  registerElementTypes,
  getElementType,
  getAllElementTypes,
  getElementTypesByCategory,
  clearElementTypesRegistry,
  createElementFromType,
};
