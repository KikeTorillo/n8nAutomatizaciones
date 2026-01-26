const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

/**
 * ====================================================================
 * MODEL - WEBSITE BLOQUES
 * ====================================================================
 *
 * Bloques de contenido dentro de cada página.
 * Sistema drag-and-drop: cada bloque puede reordenarse.
 *
 * TIPOS DE BLOQUES:
 * • hero - Banner principal con imagen/video
 * • servicios - Cards de servicios
 * • testimonios - Reseñas de clientes
 * • equipo - Staff/profesionales
 * • cta - Call to action
 * • contacto - Formulario + info de contacto
 * • footer - Pie de página
 * • texto - Contenido HTML libre
 * • galeria - Galería de imágenes
 * • video - Video embebido
 * • separador - Separador visual
 * • pricing - Tablas de precios comparativas
 * • faq - Accordion de preguntas frecuentes
 * • countdown - Contador regresivo
 * • stats - Números/estadísticas animadas
 * • timeline - Línea de tiempo
 *
 * Fecha creación: 6 Diciembre 2025
 */
class WebsiteBloquesModel {

    /**
     * Máximo de bloques permitidos por página
     * Límite para evitar degradación de performance en el canvas
     */
    static MAX_BLOQUES_POR_PAGINA = 50;

    /**
     * Tipos de bloques válidos
     */
    static TIPOS_VALIDOS = [
        'hero', 'servicios', 'testimonios', 'equipo', 'cta',
        'contacto', 'footer', 'texto', 'galeria', 'video', 'separador',
        'pricing', 'faq', 'countdown', 'stats', 'timeline'
    ];

    /**
     * Crear nuevo bloque
     *
     * @param {Object} datos - Datos del bloque
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Bloque creado
     * @throws {Error} Si se excede el límite de bloques por página
     */
    static async crear(datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar límite de bloques por página
            const countResult = await db.query(
                'SELECT COUNT(*) as total FROM website_bloques WHERE pagina_id = $1',
                [datos.pagina_id]
            );
            const totalBloques = parseInt(countResult.rows[0].total, 10);

            if (totalBloques >= this.MAX_BLOQUES_POR_PAGINA) {
                ErrorHelper.throwValidation(
                    `Se ha alcanzado el límite máximo de ${this.MAX_BLOQUES_POR_PAGINA} bloques por página. ` +
                    'Elimina algunos bloques antes de agregar más.'
                );
            }

            // Obtener el orden máximo actual
            const ordenResult = await db.query(
                'SELECT COALESCE(MAX(orden), -1) + 1 as next_orden FROM website_bloques WHERE pagina_id = $1',
                [datos.pagina_id]
            );
            const orden = datos.orden !== undefined ? datos.orden : ordenResult.rows[0].next_orden;

            const query = `
                INSERT INTO website_bloques (
                    pagina_id,
                    tipo,
                    contenido,
                    estilos,
                    orden,
                    visible
                ) VALUES (
                    $1, $2, $3::jsonb, $4::jsonb, $5, $6
                )
                RETURNING *
            `;

            const valores = [
                datos.pagina_id,
                datos.tipo,
                JSON.stringify(datos.contenido || {}),
                JSON.stringify(datos.estilos || {}),
                orden,
                datos.visible !== undefined ? datos.visible : true
            ];

            logger.info('[WebsiteBloquesModel.crear] Creando bloque', {
                pagina_id: datos.pagina_id,
                tipo: datos.tipo,
                orden
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Listar bloques de una página
     *
     * @param {string} paginaId - ID de la página
     * @param {number} organizacionId - ID de la organización
     * @returns {Array} Lista de bloques ordenados
     */
    static async listar(paginaId, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT wb.*
                FROM website_bloques wb
                WHERE wb.pagina_id = $1
                ORDER BY wb.orden ASC
            `;

            const result = await db.query(query, [paginaId]);
            return result.rows;
        });
    }

    /**
     * Listar bloques visibles (para vista pública)
     *
     * @param {string} paginaId - ID de la página
     * @returns {Array} Lista de bloques visibles ordenados
     */
    static async listarVisibles(paginaId) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT wb.*
                FROM website_bloques wb
                JOIN website_paginas wp ON wp.id = wb.pagina_id
                JOIN website_config wc ON wc.id = wp.website_id
                WHERE wb.pagina_id = $1
                AND wb.visible = true
                AND wp.publicada = true
                AND wc.publicado = true
                ORDER BY wb.orden ASC
            `;

            const result = await db.query(query, [paginaId]);
            return result.rows;
        });
    }

    /**
     * Obtener bloque por ID
     *
     * @param {string} id - ID del bloque
     * @param {number} organizacionId - ID de la organización
     * @returns {Object|null} Bloque o null
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT wb.*,
                    wp.titulo as pagina_titulo,
                    wp.slug as pagina_slug,
                    wc.slug as website_slug
                FROM website_bloques wb
                JOIN website_paginas wp ON wp.id = wb.pagina_id
                JOIN website_config wc ON wc.id = wp.website_id
                WHERE wb.id = $1
            `;

            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        });
    }

    /**
     * Actualizar bloque
     *
     * @param {string} id - ID del bloque
     * @param {Object} datos - Datos a actualizar
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Bloque actualizado
     */
    static async actualizar(id, datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const campos = [];
            const valores = [id];
            let paramIndex = 2;

            // Campos permitidos (sin pagina_id para evitar mover entre páginas)
            if (datos.tipo !== undefined) {
                campos.push(`tipo = $${paramIndex}`);
                valores.push(datos.tipo);
                paramIndex++;
            }

            if (datos.contenido !== undefined) {
                campos.push(`contenido = $${paramIndex}::jsonb`);
                valores.push(JSON.stringify(datos.contenido));
                paramIndex++;
            }

            if (datos.estilos !== undefined) {
                campos.push(`estilos = $${paramIndex}::jsonb`);
                valores.push(JSON.stringify(datos.estilos));
                paramIndex++;
            }

            if (datos.orden !== undefined) {
                campos.push(`orden = $${paramIndex}`);
                valores.push(datos.orden);
                paramIndex++;
            }

            if (datos.visible !== undefined) {
                campos.push(`visible = $${paramIndex}`);
                valores.push(datos.visible);
                paramIndex++;
            }

            if (campos.length === 0) {
                ErrorHelper.throwValidation('No hay campos para actualizar');
            }

            const query = `
                UPDATE website_bloques
                SET ${campos.join(', ')},
                    actualizado_en = NOW()
                WHERE id = $1
                RETURNING *
            `;

            logger.info('[WebsiteBloquesModel.actualizar] Actualizando bloque', {
                bloque_id: id,
                organizacion_id: organizacionId,
                campos_actualizados: Object.keys(datos)
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Reordenar bloques de una página
     *
     * @param {string} paginaId - ID de la página
     * @param {Array} ordenamiento - Array de {id, orden}
     * @param {number} organizacionId - ID de la organización
     * @returns {boolean} true si se reordenó correctamente
     */
    static async reordenar(paginaId, ordenamiento, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            for (const item of ordenamiento) {
                await db.query(
                    'UPDATE website_bloques SET orden = $1, actualizado_en = NOW() WHERE id = $2 AND pagina_id = $3',
                    [item.orden, item.id, paginaId]
                );
            }

            logger.info('[WebsiteBloquesModel.reordenar] Bloques reordenados', {
                pagina_id: paginaId,
                organizacion_id: organizacionId,
                total_bloques: ordenamiento.length
            });

            return true;
        });
    }

    /**
     * Duplicar bloque
     *
     * @param {string} id - ID del bloque a duplicar
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Nuevo bloque duplicado
     */
    static async duplicar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // Obtener bloque original
            const bloqueResult = await db.query(
                'SELECT * FROM website_bloques WHERE id = $1',
                [id]
            );

            ErrorHelper.throwIfNotFound(bloqueResult.rows[0], 'Bloque');

            const original = bloqueResult.rows[0];

            // Obtener el orden máximo actual
            const ordenResult = await db.query(
                'SELECT COALESCE(MAX(orden), -1) + 1 as next_orden FROM website_bloques WHERE pagina_id = $1',
                [original.pagina_id]
            );

            // Insertar copia
            const query = `
                INSERT INTO website_bloques (
                    pagina_id, tipo, contenido, estilos, orden, visible
                ) VALUES (
                    $1, $2, $3, $4, $5, $6
                )
                RETURNING *
            `;

            const result = await db.query(query, [
                original.pagina_id,
                original.tipo,
                original.contenido,
                original.estilos,
                ordenResult.rows[0].next_orden,
                original.visible
            ]);

            logger.info('[WebsiteBloquesModel.duplicar] Bloque duplicado', {
                bloque_original: id,
                bloque_nuevo: result.rows[0].id,
                organizacion_id: organizacionId
            });

            return result.rows[0];
        });
    }

    /**
     * Eliminar bloque
     *
     * @param {string} id - ID del bloque
     * @param {number} organizacionId - ID de la organización
     * @returns {boolean} true si se eliminó
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                DELETE FROM website_bloques
                WHERE id = $1
                RETURNING id, pagina_id
            `;

            logger.info('[WebsiteBloquesModel.eliminar] Eliminando bloque', {
                bloque_id: id,
                organizacion_id: organizacionId
            });

            const result = await db.query(query, [id]);
            return result.rows.length > 0;
        });
    }

    /**
     * Obtener contenido por defecto para un tipo de bloque
     *
     * @param {string} tipo - Tipo de bloque
     * @returns {Object} Contenido por defecto
     */
    static obtenerContenidoDefault(tipo) {
        const defaults = {
            hero: {
                titulo: 'Bienvenido a nuestro negocio',
                subtitulo: 'Los mejores servicios de la ciudad',
                imagen_url: '',
                imagen_overlay: 0.5,
                alineacion: 'center',
                boton_texto: 'Agendar Cita',
                boton_url: '#contacto',
                boton_tipo: 'agendar'
            },
            servicios: {
                titulo_seccion: 'Nuestros Servicios',
                subtitulo_seccion: 'Lo que ofrecemos',
                columnas: 3,
                origen: 'manual',
                mostrar_precio: true,
                items: []
            },
            testimonios: {
                titulo_seccion: 'Lo que dicen nuestros clientes',
                origen: 'manual',
                layout: 'carousel',
                items: []
            },
            equipo: {
                titulo_seccion: 'Nuestro Equipo',
                origen: 'manual',
                layout: 'grid',
                mostrar_redes: true,
                items: []
            },
            cta: {
                titulo: '¿Listo para agendar?',
                descripcion: 'Reserva tu cita en minutos',
                boton_texto: 'Agendar Ahora',
                boton_tipo: 'agendar',
                boton_url: '',
                fondo_tipo: 'color',
                fondo_valor: '#3B82F6'
            },
            contacto: {
                titulo_seccion: 'Contáctanos',
                mostrar_formulario: true,
                campos_formulario: ['nombre', 'email', 'telefono', 'mensaje'],
                mostrar_info: true,
                telefono: '',
                email: '',
                direccion: '',
                mostrar_mapa: false,
                coordenadas: { lat: 0, lng: 0 },
                horarios: ''
            },
            footer: {
                logo_url: '',
                descripcion: 'Tu negocio de confianza',
                columnas: [],
                mostrar_redes: true,
                copyright: `© ${new Date().getFullYear()} Mi Negocio. Todos los derechos reservados.`
            },
            texto: {
                contenido: '<p>Escribe tu contenido aquí...</p>',
                alineacion: 'left'
            },
            galeria: {
                titulo_seccion: 'Galería',
                layout: 'grid',
                columnas: 3,
                imagenes: []
            },
            video: {
                titulo_seccion: '',
                tipo: 'youtube',
                url: '',
                autoplay: false,
                mostrar_controles: true
            },
            separador: {
                tipo: 'linea',
                altura: 50,
                color: '#E5E7EB'
            },
            pricing: {
                titulo_seccion: 'Nuestros Planes',
                subtitulo_seccion: 'Elige el plan perfecto para ti',
                columnas: 3,
                mostrar_popular: true,
                planes: [
                    {
                        nombre: 'Básico',
                        precio: 29,
                        periodo: 'mes',
                        descripcion: 'Ideal para empezar',
                        caracteristicas: ['Característica 1', 'Característica 2', 'Característica 3'],
                        es_popular: false,
                        boton_texto: 'Comenzar',
                        boton_url: '#contacto'
                    },
                    {
                        nombre: 'Profesional',
                        precio: 59,
                        periodo: 'mes',
                        descripcion: 'Para negocios en crecimiento',
                        caracteristicas: ['Todo del Básico', 'Característica 4', 'Característica 5', 'Característica 6'],
                        es_popular: true,
                        boton_texto: 'Comenzar',
                        boton_url: '#contacto'
                    },
                    {
                        nombre: 'Empresarial',
                        precio: 99,
                        periodo: 'mes',
                        descripcion: 'Para grandes equipos',
                        caracteristicas: ['Todo del Profesional', 'Característica 7', 'Característica 8', 'Soporte prioritario'],
                        es_popular: false,
                        boton_texto: 'Contactar',
                        boton_url: '#contacto'
                    }
                ],
                moneda: 'USD',
                mostrar_toggle_anual: false,
                descuento_anual: 20
            },
            faq: {
                titulo_seccion: 'Preguntas Frecuentes',
                subtitulo_seccion: 'Encuentra respuestas a las preguntas más comunes',
                layout: 'accordion',
                permitir_multiple: false,
                items: [
                    {
                        pregunta: '¿Cómo puedo agendar una cita?',
                        respuesta: 'Puedes agendar una cita fácilmente a través de nuestro formulario de contacto o llamando a nuestro número de teléfono.'
                    },
                    {
                        pregunta: '¿Cuáles son los métodos de pago aceptados?',
                        respuesta: 'Aceptamos efectivo, tarjetas de crédito/débito y transferencias bancarias.'
                    },
                    {
                        pregunta: '¿Tienen política de cancelación?',
                        respuesta: 'Sí, puedes cancelar tu cita con al menos 24 horas de anticipación sin ningún cargo.'
                    }
                ]
            },
            countdown: {
                titulo: 'Gran Inauguración',
                subtitulo: 'No te pierdas este evento especial',
                fecha_objetivo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                mostrar_dias: true,
                mostrar_horas: true,
                mostrar_minutos: true,
                mostrar_segundos: true,
                texto_finalizado: '¡El evento ha comenzado!',
                accion_finalizado: 'ocultar',
                fondo_tipo: 'color',
                fondo_valor: '#1F2937',
                color_texto: '#FFFFFF',
                boton_texto: '',
                boton_url: ''
            },
            stats: {
                titulo_seccion: 'Nuestros Números',
                subtitulo_seccion: 'Lo que hemos logrado',
                columnas: 4,
                animar: true,
                duracion_animacion: 2000,
                items: [
                    {
                        numero: 500,
                        sufijo: '+',
                        prefijo: '',
                        titulo: 'Clientes Satisfechos',
                        icono: 'users'
                    },
                    {
                        numero: 10,
                        sufijo: '',
                        prefijo: '',
                        titulo: 'Años de Experiencia',
                        icono: 'calendar'
                    },
                    {
                        numero: 1000,
                        sufijo: '+',
                        prefijo: '',
                        titulo: 'Proyectos Completados',
                        icono: 'briefcase'
                    },
                    {
                        numero: 98,
                        sufijo: '%',
                        prefijo: '',
                        titulo: 'Satisfacción',
                        icono: 'star'
                    }
                ]
            },
            timeline: {
                titulo_seccion: 'Nuestra Historia',
                subtitulo_seccion: 'Un recorrido por nuestros logros',
                layout: 'alternado',
                mostrar_linea: true,
                color_linea: '#3B82F6',
                items: [
                    {
                        fecha: '2020',
                        titulo: 'Fundación',
                        descripcion: 'Comenzamos nuestra aventura con una visión clara.',
                        icono: 'rocket'
                    },
                    {
                        fecha: '2021',
                        titulo: 'Primer Hito',
                        descripcion: 'Alcanzamos nuestros primeros 100 clientes.',
                        icono: 'flag'
                    },
                    {
                        fecha: '2022',
                        titulo: 'Expansión',
                        descripcion: 'Abrimos nuestra segunda ubicación.',
                        icono: 'map-pin'
                    },
                    {
                        fecha: '2023',
                        titulo: 'Reconocimiento',
                        descripcion: 'Recibimos el premio a la excelencia en servicio.',
                        icono: 'award'
                    }
                ]
            }
        };

        return defaults[tipo] || {};
    }
}

module.exports = WebsiteBloquesModel;
