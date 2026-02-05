/**
 * Datos dummy para preview de plantillas
 * Genera evento y bloques ficticios por tipo de evento
 */

const DATOS_POR_TIPO = {
  boda: {
    nombre: 'Ana & Carlos',
    descripcion: 'Nos casamos y queremos celebrarlo contigo',
    hero: {
      titulo: 'Ana & Carlos',
      subtitulo: 'Nos casamos',
      mensaje: '¡Estás cordialmente invitado/a a celebrar nuestra boda!',
    },
    timeline: [
      { hora: '16:00', titulo: 'Ceremonia Religiosa', descripcion: 'Parroquia San José', icono: 'Church' },
      { hora: '18:00', titulo: 'Recepción', descripcion: 'Salón de eventos Los Jardines', icono: 'UtensilsCrossed' },
      { hora: '20:00', titulo: 'Primer Vals', descripcion: 'Baile de los novios', icono: 'Music' },
      { hora: '21:00', titulo: '¡Fiesta!', descripcion: 'Música y diversión toda la noche', icono: 'PartyPopper' },
    ],
    ubicaciones: [
      { nombre: 'Parroquia San José', direccion: 'Av. Principal #123, Centro', lat: 19.4326, lng: -99.1332, tipo: 'ceremonia' },
      { nombre: 'Salón Los Jardines', direccion: 'Blvd. de la Luz #456', lat: 19.4350, lng: -99.1400, tipo: 'recepcion' },
    ],
    regalos: [
      { nombre: 'Juego de sábanas', url: '#', precio: 1500 },
      { nombre: 'Set de cocina', url: '#', precio: 2500 },
    ],
  },
  xv_anos: {
    nombre: 'XV Años de Sofía',
    descripcion: 'Celebra conmigo mis XV años',
    hero: {
      titulo: 'Mis XV Años',
      subtitulo: 'Sofía',
      mensaje: 'Te invito a celebrar conmigo este día tan especial',
    },
    timeline: [
      { hora: '17:00', titulo: 'Misa de Acción de Gracias', descripcion: 'Iglesia de la Asunción', icono: 'Church' },
      { hora: '19:00', titulo: 'Recepción', descripcion: 'Salón Imperial', icono: 'UtensilsCrossed' },
      { hora: '20:30', titulo: 'Vals', descripcion: 'El primer vals de Sofía', icono: 'Music' },
      { hora: '21:00', titulo: '¡Fiesta!', descripcion: 'DJ y pista de baile', icono: 'PartyPopper' },
    ],
    ubicaciones: [
      { nombre: 'Iglesia de la Asunción', direccion: 'Calle Morelos #89', lat: 19.4326, lng: -99.1332, tipo: 'ceremonia' },
      { nombre: 'Salón Imperial', direccion: 'Av. Reforma #200', lat: 19.4350, lng: -99.1400, tipo: 'recepcion' },
    ],
    regalos: [
      { nombre: 'Contribución al viaje', url: '#', precio: 500 },
      { nombre: 'Set de maquillaje', url: '#', precio: 800 },
    ],
  },
  cumpleanos: {
    nombre: 'Fiesta de Emilio',
    descripcion: '¡Celebra conmigo un año más de vida!',
    hero: {
      titulo: '¡Fiesta de Emilio!',
      subtitulo: 'Cumpleaños',
      mensaje: 'Te espero para festejar juntos',
    },
    timeline: [
      { hora: '15:00', titulo: 'Bienvenida', descripcion: 'Llegada de invitados', icono: 'Users' },
      { hora: '16:00', titulo: 'Comida', descripcion: 'Parrillada y snacks', icono: 'UtensilsCrossed' },
      { hora: '17:30', titulo: '¡Pastel!', descripcion: 'Las mañanitas y pastel', icono: 'Cake' },
    ],
    ubicaciones: [
      { nombre: 'Casa de Emilio', direccion: 'Calle Luna #42, Col. Estrella', lat: 19.4326, lng: -99.1332, tipo: 'fiesta' },
    ],
    regalos: [],
  },
  bautizo: {
    nombre: 'Bautizo de Valentina',
    descripcion: 'Acompáñanos en el bautizo de nuestra pequeña',
    hero: {
      titulo: 'Bautizo de Valentina',
      subtitulo: 'Bendiciones',
      mensaje: 'Con la bendición de Dios, te invitamos a acompañarnos',
    },
    timeline: [
      { hora: '11:00', titulo: 'Misa de Bautizo', descripcion: 'Parroquia del Carmen', icono: 'Church' },
      { hora: '13:00', titulo: 'Recepción', descripcion: 'Restaurante La Terraza', icono: 'UtensilsCrossed' },
    ],
    ubicaciones: [
      { nombre: 'Parroquia del Carmen', direccion: 'Av. del Carmen #15', lat: 19.4326, lng: -99.1332, tipo: 'ceremonia' },
      { nombre: 'Restaurante La Terraza', direccion: 'Paseo de los Álamos #78', lat: 19.4350, lng: -99.1400, tipo: 'recepcion' },
    ],
    regalos: [],
  },
  corporativo: {
    nombre: 'Gala Anual 2026',
    descripcion: 'Celebrando un año de logros y crecimiento',
    hero: {
      titulo: 'Gala Anual 2026',
      subtitulo: 'Corporativo',
      mensaje: 'Lo invitamos a nuestra gala anual de fin de año',
    },
    timeline: [
      { hora: '19:00', titulo: 'Registro', descripcion: 'Bienvenida y cóctel de recepción', icono: 'ClipboardList' },
      { hora: '20:00', titulo: 'Cena', descripcion: 'Cena de gala con menú especial', icono: 'UtensilsCrossed' },
      { hora: '21:30', titulo: 'Premiación', descripcion: 'Reconocimientos anuales', icono: 'Award' },
      { hora: '22:30', titulo: 'Networking', descripcion: 'Música y convivencia', icono: 'Users' },
    ],
    ubicaciones: [
      { nombre: 'Hotel Grand Plaza', direccion: 'Av. Empresarial #500', lat: 19.4326, lng: -99.1332, tipo: 'evento' },
    ],
    regalos: [],
  },
};

/**
 * Genera una fecha futura (30 días desde hoy)
 */
function getFechaFutura() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 30);
  return fecha.toISOString();
}

/**
 * Genera un ID único para bloques dummy
 */
let idCounter = 0;
function generateId() {
  idCounter++;
  return `preview-${idCounter}`;
}

/**
 * Genera datos de preview para una plantilla
 * @param {string} tipoEvento - Tipo de evento (boda, xv_anos, etc.)
 * @param {Object} tema - Tema de la plantilla (colores, fuentes)
 * @returns {{ evento: Object, bloques: Array }}
 */
export function generarPreviewData(tipoEvento, tema = {}) {
  idCounter = 0;
  const datos = DATOS_POR_TIPO[tipoEvento] || DATOS_POR_TIPO.boda;
  const fechaEvento = getFechaFutura();

  const temaCompleto = {
    color_primario: '#ec4899',
    color_secundario: '#fce7f3',
    color_fondo: '#fdf2f8',
    color_texto: '#1f2937',
    color_texto_claro: '#6b7280',
    fuente_titulo: 'Playfair Display',
    fuente_cuerpo: 'Inter',
    ...tema,
  };

  // Generar gradiente desde colores del tema para el hero
  const heroGradient = `linear-gradient(135deg, ${temaCompleto.color_primario}dd, ${temaCompleto.color_secundario}cc)`;

  const bloques = [
    // Hero
    {
      id: generateId(),
      tipo: 'hero_invitacion',
      orden: 0,
      visible: true,
      contenido: {
        titulo: datos.hero.titulo,
        subtitulo: datos.hero.subtitulo,
        mensaje: datos.hero.mensaje,
        fecha_evento: fechaEvento,
        fondo_tipo: 'gradiente',
        fondo_gradiente: heroGradient,
        mostrar_fecha: true,
        mostrar_scroll: true,
        mostrar_calendario: false,
      },
      estilos: {},
    },
    // Countdown
    {
      id: generateId(),
      tipo: 'countdown',
      orden: 1,
      visible: true,
      contenido: {
        titulo: 'Faltan',
        fecha_objetivo: fechaEvento,
        estilo: 'cajas',
        mostrar_segundos: true,
      },
      estilos: {},
    },
    // Timeline
    {
      id: generateId(),
      tipo: 'timeline',
      orden: 2,
      visible: true,
      contenido: {
        titulo: 'Itinerario',
        eventos: datos.timeline,
        estilo: 'vertical',
      },
      estilos: {},
    },
    // Ubicación
    {
      id: generateId(),
      tipo: 'ubicacion',
      orden: 3,
      visible: true,
      contenido: {
        titulo: 'Ubicación',
        mostrar_mapa: false,
        ubicaciones: datos.ubicaciones,
      },
      estilos: {},
    },
    // RSVP
    {
      id: generateId(),
      tipo: 'rsvp',
      orden: 4,
      visible: true,
      contenido: {
        titulo: 'Confirma tu Asistencia',
        mensaje: '¡Esperamos contar contigo!',
        permitir_acompanantes: true,
        max_acompanantes: 3,
        campos_adicionales: ['mensaje_rsvp'],
      },
      estilos: {},
    },
  ];

  // Agregar mesa de regalos si aplica
  if (datos.regalos.length > 0) {
    bloques.push({
      id: generateId(),
      tipo: 'mesa_regalos',
      orden: 5,
      visible: true,
      contenido: {
        titulo: 'Mesa de Regalos',
        mensaje: 'Tu presencia es nuestro mejor regalo, pero si deseas tener un detalle...',
        regalos: datos.regalos,
      },
      estilos: {},
    });
  }

  const evento = {
    id: 0,
    nombre: datos.nombre,
    tipo: tipoEvento,
    descripcion: datos.descripcion,
    fecha_evento: fechaEvento,
    hora_evento: datos.timeline[0]?.hora || '18:00',
    slug: 'preview',
    estado: 'publicado',
    tema: temaCompleto,
    configuracion: {
      mostrar_contador: true,
      mostrar_ubicaciones: true,
      mostrar_mesa_regalos: datos.regalos.length > 0,
      permitir_felicitaciones: false,
      mostrar_qr_invitado: false,
    },
    ubicaciones: datos.ubicaciones,
    mesa_regalos: datos.regalos,
    bloques_invitacion: bloques,
  };

  return { evento, bloques };
}

export default generarPreviewData;
