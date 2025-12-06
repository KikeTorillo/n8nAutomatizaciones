const RLSContextManager = require('../../../utils/rlsContextManager');
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
 *
 * Fecha creación: 6 Diciembre 2025
 */
class WebsiteBloquesModel {

    /**
     * Tipos de bloques válidos
     */
    static TIPOS_VALIDOS = [
        'hero', 'servicios', 'testimonios', 'equipo', 'cta',
        'contacto', 'footer', 'texto', 'galeria', 'video', 'separador'
    ];

    /**
     * Crear nuevo bloque
     *
     * @param {Object} datos - Datos del bloque
     * @param {number} organizacionId - ID de la organización
     * @returns {Object} Bloque creado
     */
    static async crear(datos, organizacionId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
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
                throw new Error('No hay campos para actualizar');
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

            if (bloqueResult.rows.length === 0) {
                throw new Error('Bloque no encontrado');
            }

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
            }
        };

        return defaults[tipo] || {};
    }
}

module.exports = WebsiteBloquesModel;
