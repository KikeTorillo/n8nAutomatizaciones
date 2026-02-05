/**
 * ====================================================================
 * INVITACION BLOCK MIGRATORS
 * ====================================================================
 * Funciones de migración de bloques específicos de invitaciones
 * al formato de secciones con elementos de posición libre.
 *
 * @version 1.0.0
 * @since 2026-02-05
 */

import {
  createElementFromType,
  createSection,
  registerBlockMigrators,
  registerElementoToBloqueMapping,
} from '@/components/editor-framework';

// ========== MIGRATORS ==========

export function migrateHeroInvitacionBlock(bloque) {
  const contenido = bloque.contenido || {};
  const elementos = [];

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
    _rsvpConfig: contenido,
  });
}

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

// ========== ELEMENTO → BLOQUE MAP ==========

export const INVITACION_ELEMENTO_TO_BLOQUE_MAP = {
  hero_invitacion: 'hero_invitacion',
  countdown: 'countdown',
  rsvp_button: 'rsvp',
  timeline: 'timeline',
  ubicacion: 'ubicacion',
  galeria: 'galeria',
  mesa_regalos: 'mesa_regalos',
  faq: 'faq',
};

// ========== REGISTRATION ==========

/**
 * Registra los migradores de invitaciones en el framework.
 * Llamar esta función al inicializar el módulo de invitaciones.
 */
export function registerInvitacionMigrators() {
  registerBlockMigrators({
    hero_invitacion: migrateHeroInvitacionBlock,
    countdown: migrateCountdownBlock,
    timeline: migrateTimelineBlock,
    rsvp: migrateRsvpBlock,
    ubicacion: migrateUbicacionBlock,
    galeria: migrateGaleriaBlock,
    faq: migrateFaqBlock,
    mesa_regalos: migrateMesaRegalosBlock,
  });

  registerElementoToBloqueMapping(INVITACION_ELEMENTO_TO_BLOQUE_MAP);
}
