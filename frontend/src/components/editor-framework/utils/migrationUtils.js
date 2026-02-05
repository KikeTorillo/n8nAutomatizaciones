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

// ========== MIGRADORES ESPECÍFICOS PARA INVITACIONES ==========

/**
 * Migra un bloque Hero de Invitación al formato de sección
 * @param {Object} bloque - Bloque hero_invitacion original
 * @returns {Object} Sección con elementos
 */
export function migrateHeroInvitacionBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  // Crear un elemento de tipo hero_invitacion que renderiza todo el bloque completo
  // Usar top-left para elementos full-width para evitar desplazamiento
  elementos.push(createElementFromType('hero_invitacion', {
    contenido: { ...contenido },
    posicion: {
      x: 0,
      y: 0,
      ancho: 100,
      altura: 'auto',
      ancla: 'top-left',
    },
    capa: 1,
  }));

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'hero_invitacion',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: {
        valor: contenido.altura === 'full' ? 100 : contenido.altura === 'medium' ? 50 : 'auto',
        unidad: contenido.altura === 'auto' ? 'auto' : 'vh',
      },
      padding: { top: 0, bottom: 0 },
      fondo: {
        tipo: contenido.imagen_url ? 'imagen' : 'color',
        valor: contenido.imagen_url || contenido.color_fondo_hero || '#ffffff',
        posicion: contenido.imagen_posicion || 'center center',
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
 * Migra un bloque Countdown al formato de sección
 * @param {Object} bloque - Bloque countdown original
 * @returns {Object} Sección con elementos
 */
export function migrateCountdownBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  elementos.push(createElementFromType('countdown', {
    contenido: {
      titulo: contenido.titulo || 'Faltan',
      fecha: contenido.fecha_objetivo || null,
      hora: contenido.hora_objetivo || null,
      variante: contenido.estilo || 'cajas',
      mostrar_dias: contenido.mostrar_dias !== false,
      mostrar_horas: contenido.mostrar_horas !== false,
      mostrar_minutos: contenido.mostrar_minutos !== false,
      mostrar_segundos: contenido.mostrar_segundos === true,
      texto_finalizado: contenido.texto_finalizado || '¡Es hoy!',
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
    preset: 'countdown',
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
 * Migra un bloque Calendario al formato de sección
 * @param {Object} bloque - Bloque calendario/agregar_calendario original
 * @returns {Object} Sección con elementos
 */
export function migrateCalendarioBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  elementos.push(createElementFromType('calendario', {
    contenido: {
      titulo: contenido.titulo || '',
      variante: contenido.variante || 'default',
      alineacion: contenido.alineacion || 'center',
      mostrar_google: contenido.mostrar_google !== false,
      mostrar_ics: contenido.mostrar_ics !== false,
      texto_google: contenido.texto_google || 'Google Calendar',
      texto_ics: contenido.texto_ics || 'Descargar .ics',
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
    preset: 'calendario',
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
 * Migra un bloque Timeline al formato de sección
 * @param {Object} bloque - Bloque timeline original
 * @returns {Object} Sección con elementos
 */
export function migrateTimelineBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  elementos.push(createElementFromType('timeline', {
    contenido: {
      titulo: contenido.titulo_seccion || contenido.titulo || 'Itinerario',
      subtitulo: contenido.subtitulo_seccion || contenido.subtitulo || '',
      layout: contenido.layout || 'vertical',
      items: contenido.items || [],
    },
    posicion: {
      x: 50,
      y: 50,
      ancho: 90,
      altura: 'auto',
      ancla: 'center',
    },
    capa: 1,
  }));

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'timeline',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: { valor: 'auto', unidad: 'auto' },
      padding: { top: 60, bottom: 60 },
      fondo: {
        tipo: 'color',
        valor: '#ffffff',
      },
    },
    elementos,
  });
}

/**
 * Migra un bloque RSVP al formato de sección
 * @param {Object} bloque - Bloque rsvp original
 * @returns {Object} Sección con elementos
 */
export function migrateRsvpBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  elementos.push(createElementFromType('rsvp_button', {
    contenido: {
      texto: contenido.titulo || 'Confirmar Asistencia',
      texto_confirmado: contenido.texto_confirmado || '¡Confirmado!',
      variante: 'primario',
      tamano: 'lg',
      mostrar_icono: true,
    },
    posicion: {
      x: 50,
      y: 50,
      ancho: 'auto',
      altura: 'auto',
      ancla: 'center',
    },
    capa: 1,
  }));

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'rsvp',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: { valor: 'auto', unidad: 'auto' },
      padding: { top: 60, bottom: 60 },
      fondo: {
        tipo: 'color',
        valor: '#ffffff',
      },
    },
    elementos,
    // Guardar contenido completo para renderizado
    _rsvpConfig: contenido,
  });
}

/**
 * Migra un bloque Ubicación al formato de sección
 * @param {Object} bloque - Bloque ubicacion original
 * @returns {Object} Sección con elementos
 */
export function migrateUbicacionBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  elementos.push(createElementFromType('ubicacion', {
    contenido: { ...contenido },
    posicion: {
      x: 50,
      y: 50,
      ancho: 90,
      altura: 'auto',
      ancla: 'center',
    },
    capa: 1,
  }));

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'ubicacion',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: { valor: 'auto', unidad: 'auto' },
      padding: { top: 60, bottom: 60 },
      fondo: {
        tipo: 'color',
        valor: '#ffffff',
      },
    },
    elementos,
  });
}

/**
 * Migra un bloque Galería al formato de sección
 * @param {Object} bloque - Bloque galeria original
 * @returns {Object} Sección con elementos
 */
export function migrateGaleriaBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  elementos.push(createElementFromType('galeria', {
    contenido: { ...contenido },
    posicion: {
      x: 50,
      y: 50,
      ancho: 95,
      altura: 'auto',
      ancla: 'center',
    },
    capa: 1,
  }));

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'galeria',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: { valor: 'auto', unidad: 'auto' },
      padding: { top: 60, bottom: 60 },
      fondo: {
        tipo: 'color',
        valor: '#ffffff',
      },
    },
    elementos,
  });
}

/**
 * Migra un bloque FAQ al formato de sección
 * @param {Object} bloque - Bloque faq original
 * @returns {Object} Sección con elementos
 */
export function migrateFaqBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  elementos.push(createElementFromType('faq', {
    contenido: { ...contenido },
    posicion: {
      x: 50,
      y: 50,
      ancho: 90,
      altura: 'auto',
      ancla: 'center',
    },
    capa: 1,
  }));

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'faq',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: { valor: 'auto', unidad: 'auto' },
      padding: { top: 60, bottom: 60 },
      fondo: {
        tipo: 'color',
        valor: '#ffffff',
      },
    },
    elementos,
  });
}

/**
 * Migra un bloque Mesa de Regalos al formato de sección
 * @param {Object} bloque - Bloque mesa_regalos original
 * @returns {Object} Sección con elementos
 */
export function migrateMesaRegalosBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

  elementos.push(createElementFromType('mesa_regalos', {
    contenido: { ...contenido },
    posicion: {
      x: 50,
      y: 50,
      ancho: 90,
      altura: 'auto',
      ancla: 'center',
    },
    capa: 1,
  }));

  return createSection({
    id: bloque.id,
    tipo: 'seccion',
    preset: 'mesa_regalos',
    orden: bloque.orden,
    visible: bloque.visible !== false,
    config: {
      altura: { valor: 'auto', unidad: 'auto' },
      padding: { top: 60, bottom: 60 },
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
    switch (bloque.tipo) {
      // Bloques genéricos (Website Builder)
      case 'hero':
        return migrateHeroBlock(bloque);
      case 'texto':
      case 'text':
        return migrateTextoBlock(bloque);
      case 'imagen':
      case 'image':
        return migrateImagenBlock(bloque);

      // Bloques específicos de Invitaciones
      case 'hero_invitacion':
        return migrateHeroInvitacionBlock(bloque);
      case 'countdown':
        return migrateCountdownBlock(bloque);
      case 'calendario':
      case 'agregar_calendario':
        return migrateCalendarioBlock(bloque);
      case 'timeline':
        return migrateTimelineBlock(bloque);
      case 'rsvp':
        return migrateRsvpBlock(bloque);
      case 'ubicacion':
        return migrateUbicacionBlock(bloque);
      case 'galeria':
        return migrateGaleriaBlock(bloque);
      case 'faq':
        return migrateFaqBlock(bloque);
      case 'mesa_regalos':
        return migrateMesaRegalosBlock(bloque);
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
