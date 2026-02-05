/**
 * ====================================================================
 * MIGRATION UTILS
 * ====================================================================
 * Utilidades para migrar del sistema de bloques al sistema de
 * secciones con elementos de posición libre.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { createElementFromType } from '../elements/elementTypes';
import { createSection } from '../store/sectionActions';

// ========== MIGRATION REGISTRY ==========

/**
 * Registry dinámico de migradores de bloques.
 * Los módulos registran sus propios migradores al inicializarse.
 */
const migrationRegistry = new Map();

/**
 * Registra un migrador de bloque en el registry
 * @param {string} tipo - Tipo de bloque
 * @param {Function} migrator - Función migradora (bloque) => seccion
 */
export function registerBlockMigrator(tipo, migrator) {
  migrationRegistry.set(tipo, migrator);
}

/**
 * Registra múltiples migradores de bloques
 * @param {Object.<string, Function>} migrators - { tipo: migrator }
 */
export function registerBlockMigrators(migrators) {
  Object.entries(migrators).forEach(([tipo, migrator]) => {
    migrationRegistry.set(tipo, migrator);
  });
}

/**
 * Migra un bloque Hero al formato de sección con elementos
 * @param {Object} bloque - Bloque Hero original
 * @returns {Object} Sección con elementos
 */
export function migrateHeroBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  // Título
  if (contenido.titulo) {
    elementos.push(createElementFromType('texto', {
      variante: 'titulo',
      contenido: {
        texto: contenido.titulo,
        variante: 'titulo',
      },
      posicion: {
        x: 50,
        y: 35,
        ancho: 80,
        altura: 'auto',
        ancla: 'center',
      },
      estilos: {
        alineacion: contenido.alineacion_texto || 'center',
        color: contenido.color_titulo || null,
      },
      capa: 3,
    }));
  }

  // Subtítulo
  if (contenido.subtitulo) {
    elementos.push(createElementFromType('texto', {
      variante: 'subtitulo',
      contenido: {
        texto: contenido.subtitulo,
        variante: 'subtitulo',
      },
      posicion: {
        x: 50,
        y: 50,
        ancho: 70,
        altura: 'auto',
        ancla: 'center',
      },
      estilos: {
        alineacion: contenido.alineacion_texto || 'center',
        color: contenido.color_subtitulo || null,
      },
      capa: 2,
    }));
  }

  // Botón CTA
  if (contenido.mostrar_cta && contenido.texto_cta) {
    elementos.push(createElementFromType('boton', {
      contenido: {
        texto: contenido.texto_cta,
        variante: 'primario',
        url: contenido.url_cta || '',
        accion: 'link',
      },
      posicion: {
        x: 50,
        y: 70,
        ancho: 'auto',
        altura: 'auto',
        ancla: 'center',
      },
      capa: 4,
    }));
  }

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'hero',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: {
        valor: contenido.altura === 'full' ? 100 : 50,
        unidad: 'vh',
      },
      padding: { top: 40, bottom: 40 },
      fondo: {
        tipo: contenido.imagen_url ? 'imagen' : 'color',
        valor: contenido.imagen_url || contenido.color_fondo_hero || '#ffffff',
        posicion: contenido.posicion_imagen || 'center center',
        overlay: contenido.imagen_url ? {
          color: contenido.color_overlay || '#000000',
          opacidad: contenido.imagen_overlay || 0.3,
        } : null,
      },
    },
    elementos,
  });
}

/**
 * Migra un bloque de Texto al formato de sección con elementos
 * @param {Object} bloque - Bloque de texto original
 * @returns {Object} Sección con elementos
 */
export function migrateTextoBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  // Título del bloque
  if (contenido.titulo) {
    elementos.push(createElementFromType('texto', {
      variante: 'titulo',
      contenido: {
        texto: contenido.titulo,
        variante: 'subtitulo', // Usar subtítulo para secciones de texto
      },
      posicion: {
        x: 50,
        y: 20,
        ancho: 80,
        altura: 'auto',
        ancla: 'center',
      },
      estilos: {
        alineacion: contenido.alineacion || 'center',
      },
      capa: 2,
    }));
  }

  // Contenido de texto
  if (contenido.contenido || contenido.texto) {
    elementos.push(createElementFromType('texto', {
      variante: 'parrafo',
      contenido: {
        texto: contenido.contenido || contenido.texto,
        variante: 'parrafo',
      },
      posicion: {
        x: 50,
        y: 50,
        ancho: 70,
        altura: 'auto',
        ancla: 'center',
      },
      estilos: {
        alineacion: contenido.alineacion || 'center',
      },
      capa: 1,
    }));
  }

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'texto',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: { valor: 'auto', unidad: 'auto' },
      padding: { top: 60, bottom: 60 },
      fondo: {
        tipo: 'color',
        valor: contenido.color_fondo || '#ffffff',
      },
    },
    elementos,
  });
}

/**
 * Migra un bloque de Imagen al formato de sección con elementos
 * @param {Object} bloque - Bloque de imagen original
 * @returns {Object} Sección con elementos
 */
export function migrateImagenBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  if (contenido.imagen_url || contenido.url) {
    elementos.push(createElementFromType('imagen', {
      contenido: {
        url: contenido.imagen_url || contenido.url,
        alt: contenido.alt || '',
        variante: 'foto',
      },
      posicion: {
        x: 50,
        y: 50,
        ancho: contenido.ancho || 80,
        altura: 'auto',
        ancla: 'center',
      },
      estilos: {
        borderRadius: contenido.border_radius || 0,
        sombra: contenido.sombra ? 'md' : 'none',
      },
      capa: 1,
    }));
  }

  // Caption
  if (contenido.caption) {
    elementos.push(createElementFromType('texto', {
      variante: 'etiqueta',
      contenido: {
        texto: contenido.caption,
        variante: 'etiqueta',
      },
      posicion: {
        x: 50,
        y: 90,
        ancho: 60,
        altura: 'auto',
        ancla: 'center',
      },
      estilos: {
        alineacion: 'center',
      },
      capa: 2,
    }));
  }

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'imagen',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: { valor: 'auto', unidad: 'auto' },
      padding: { top: 40, bottom: 40 },
      fondo: {
        tipo: 'color',
        valor: '#ffffff',
      },
    },
    elementos,
  });
}

/**
 * Migra un bloque Separador al formato de sección
 * @param {Object} bloque - Bloque separador original
 * @returns {Object} Sección con elementos
 */
export function migrateSeparadorBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  elementos.push(createElementFromType('separador', {
    contenido: {
      variante: contenido.estilo || 'linea',
    },
    posicion: {
      x: 50,
      y: 50,
      ancho: 80,
      altura: 'auto',
      ancla: 'center',
    },
    estilos: {
      grosor: contenido.altura || 40,
      color: contenido.color || null,
    },
    capa: 1,
  }));

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'separador',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: { valor: contenido.altura || 40, unidad: 'px' },
      padding: { top: 0, bottom: 0 },
      fondo: {
        tipo: 'color',
        valor: 'transparent',
      },
    },
    elementos,
  });
}

/**
 * Migra un bloque Video al formato de sección
 * @param {Object} bloque - Bloque video original
 * @returns {Object} Sección con elementos
 */
export function migrateVideoBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  elementos.push(createElementFromType('video', {
    contenido: {
      url: contenido.video_url || contenido.url || '',
      variante: 'embed',
      autoplay: contenido.autoplay || false,
      loop: contenido.loop || false,
      muted: true,
      controles: contenido.mostrar_controles !== false,
    },
    posicion: {
      x: 50,
      y: 50,
      ancho: 80,
      altura: 'auto',
      ancla: 'center',
    },
    capa: 1,
  }));

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'video',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: { valor: 'auto', unidad: 'auto' },
      padding: { top: 40, bottom: 40 },
      fondo: {
        tipo: 'color',
        valor: '#ffffff',
      },
    },
    elementos,
  });
}

/**
 * Migra un bloque genérico al formato de sección
 * @param {Object} bloque - Bloque original
 * @returns {Object} Sección con un elemento placeholder
 */
export function migrateGenericBlock(bloque) {
  const elementos = [];

  // Crear un elemento de texto con el tipo del bloque
  elementos.push(createElementFromType('texto', {
    contenido: {
      texto: `[${bloque.tipo}]`,
      variante: 'etiqueta',
    },
    posicion: {
      x: 50,
      y: 50,
      ancho: 60,
      altura: 'auto',
      ancla: 'center',
    },
    capa: 1,
  }));

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: bloque.tipo,
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: { valor: 'auto', unidad: 'auto' },
      padding: { top: 40, bottom: 40 },
      fondo: {
        tipo: 'color',
        valor: '#f9fafb',
      },
    },
    elementos,
    // Guardar contenido original para migración manual
    _originalContent: bloque.contenido,
    _originalType: bloque.tipo,
  });
}

/**
 * Migra un array de bloques al nuevo formato de secciones
 * @param {Array} bloques - Array de bloques originales
 * @returns {Array} Array de secciones
 */
export function migrateBlocksToSections(bloques) {
  if (!bloques || !Array.isArray(bloques)) {
    return [];
  }

  return bloques.map((bloque) => {
    // Primero consultar el registry dinámico (módulos registran sus migradores)
    const registeredMigrator = migrationRegistry.get(bloque.tipo);
    if (registeredMigrator) {
      return registeredMigrator(bloque);
    }

    // Migradores built-in del framework
    switch (bloque.tipo) {
      case 'hero':
        return migrateHeroBlock(bloque);
      case 'texto':
      case 'text':
        return migrateTextoBlock(bloque);
      case 'imagen':
      case 'image':
        return migrateImagenBlock(bloque);
      case 'separador':
        return migrateSeparadorBlock(bloque);
      case 'video':
        return migrateVideoBlock(bloque);
      default:
        return migrateGenericBlock(bloque);
    }
  });
}

/**
 * Detecta si los datos están en formato de bloques o secciones
 * @param {Object} datos - Datos del editor
 * @returns {string} 'bloques' | 'secciones' | 'unknown'
 */
export function detectDataFormat(datos) {
  if (!datos) return 'unknown';

  // Si tiene secciones con elementos, es el nuevo formato
  if (datos.secciones && Array.isArray(datos.secciones)) {
    const firstSection = datos.secciones[0];
    if (firstSection && Array.isArray(firstSection.elementos)) {
      return 'secciones';
    }
  }

  // Si tiene bloques con tipo y contenido, es el formato antiguo
  if (datos.bloques && Array.isArray(datos.bloques)) {
    const firstBlock = datos.bloques[0];
    if (firstBlock && firstBlock.tipo && firstBlock.contenido) {
      return 'bloques';
    }
  }

  // Si es un array directo
  if (Array.isArray(datos)) {
    const first = datos[0];
    if (first?.elementos) return 'secciones';
    if (first?.tipo && first?.contenido) return 'bloques';
  }

  return 'unknown';
}

/**
 * Convierte datos al formato de secciones si es necesario
 * @param {Object|Array} datos - Datos del editor
 * @returns {Object} Datos en formato de secciones { secciones: [...] }
 */
export function ensureSectionsFormat(datos) {
  const format = detectDataFormat(datos);

  if (format === 'secciones') {
    return datos.secciones ? datos : { secciones: datos };
  }

  if (format === 'bloques') {
    const bloques = datos.bloques || datos;
    return {
      secciones: migrateBlocksToSections(bloques),
    };
  }

  // Formato desconocido, devolver vacío
  return { secciones: [] };
}

export default {
  migrateHeroBlock,
  migrateTextoBlock,
  migrateImagenBlock,
  migrateGenericBlock,
  migrateBlocksToSections,
  detectDataFormat,
  ensureSectionsFormat,
};
