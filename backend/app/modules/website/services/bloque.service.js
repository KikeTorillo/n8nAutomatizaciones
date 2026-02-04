/**
 * ====================================================================
 * BLOQUE SERVICE
 * ====================================================================
 * Servicio con lógica de dominio para bloques del website.
 * Contiene validaciones de negocio y coordinación entre modelos.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

const { WebsiteBloquesModel, WebsitePaginasModel } = require('../models');
const { ErrorHelper } = require('../../../utils/helpers');

/**
 * BloqueService - Lógica de negocio para bloques
 */
class BloqueService {
    /**
     * Crear un nuevo bloque con validaciones de negocio
     *
     * @param {Object} datos - Datos del bloque
     * @param {string} datos.pagina_id - ID de la página
     * @param {string} datos.tipo - Tipo de bloque
     * @param {Object} [datos.contenido] - Contenido del bloque
     * @param {Object} [datos.estilos] - Estilos del bloque
     * @param {number} [datos.orden] - Orden del bloque
     * @param {boolean} [datos.visible=true] - Visibilidad
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Bloque creado
     * @throws {Error} Si la página no existe o tipo inválido
     */
    static async crear(datos, organizacionId) {
        const { pagina_id, tipo, contenido, estilos, orden, visible } = datos;

        // 1. Validar tipo de bloque
        if (!WebsiteBloquesModel.TIPOS_VALIDOS.includes(tipo)) {
            ErrorHelper.throwValidation(
                `Tipo de bloque inválido. Tipos permitidos: ${WebsiteBloquesModel.TIPOS_VALIDOS.join(', ')}`
            );
        }

        // 2. Verificar que la página existe y pertenece a la organización
        const pagina = await WebsitePaginasModel.obtenerPorId(pagina_id, organizacionId);
        if (!pagina) {
            ErrorHelper.throwNotFound('Página');
        }

        // 3. Obtener contenido default si no se proporciona
        const contenidoFinal = contenido || WebsiteBloquesModel.obtenerContenidoDefault(tipo);

        // 4. Crear el bloque
        const bloque = await WebsiteBloquesModel.crear({
            pagina_id,
            tipo,
            contenido: contenidoFinal,
            estilos: estilos || {},
            orden,
            visible
        }, organizacionId);

        return bloque;
    }

    /**
     * Actualizar un bloque existente
     *
     * @param {string} bloqueId - ID del bloque
     * @param {Object} datos - Datos a actualizar
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Bloque actualizado o null si no existe
     * @throws {Error} Si el tipo es inválido
     */
    static async actualizar(bloqueId, datos, organizacionId) {
        // Validar tipo si se está actualizando
        if (datos.tipo && !WebsiteBloquesModel.TIPOS_VALIDOS.includes(datos.tipo)) {
            ErrorHelper.throwValidation(
                `Tipo de bloque inválido. Tipos permitidos: ${WebsiteBloquesModel.TIPOS_VALIDOS.join(', ')}`
            );
        }

        return await WebsiteBloquesModel.actualizar(bloqueId, datos, organizacionId);
    }

    /**
     * Duplicar un bloque
     *
     * @param {string} bloqueId - ID del bloque a duplicar
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Bloque duplicado
     * @throws {Error} Si el bloque no existe
     */
    static async duplicar(bloqueId, organizacionId) {
        // Verificar que el bloque existe
        const bloqueOriginal = await WebsiteBloquesModel.obtenerPorId(bloqueId, organizacionId);
        if (!bloqueOriginal) {
            ErrorHelper.throwNotFound('Bloque');
        }

        return await WebsiteBloquesModel.duplicar(bloqueId, organizacionId);
    }

    /**
     * Reordenar bloques de una página
     *
     * @param {string} paginaId - ID de la página
     * @param {Array<{id: string, orden: number}>} ordenamiento - Nuevo orden
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} Lista de bloques reordenados
     * @throws {Error} Si la página no existe
     */
    static async reordenar(paginaId, ordenamiento, organizacionId) {
        // Verificar que la página existe
        const pagina = await WebsitePaginasModel.obtenerPorId(paginaId, organizacionId);
        if (!pagina) {
            ErrorHelper.throwNotFound('Página');
        }

        // Ejecutar reordenamiento
        await WebsiteBloquesModel.reordenar(paginaId, ordenamiento, organizacionId);

        // Retornar lista actualizada
        return await WebsiteBloquesModel.listar(paginaId, organizacionId);
    }

    /**
     * Eliminar un bloque
     *
     * @param {string} bloqueId - ID del bloque
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>} True si se eliminó
     */
    static async eliminar(bloqueId, organizacionId) {
        return await WebsiteBloquesModel.eliminar(bloqueId, organizacionId);
    }

    /**
     * Obtener un bloque por ID
     *
     * @param {string} bloqueId - ID del bloque
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object|null>} Bloque o null
     */
    static async obtenerPorId(bloqueId, organizacionId) {
        return await WebsiteBloquesModel.obtenerPorId(bloqueId, organizacionId);
    }

    /**
     * Listar bloques de una página
     *
     * @param {string} paginaId - ID de la página
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Array>} Lista de bloques
     * @throws {Error} Si la página no existe
     */
    static async listar(paginaId, organizacionId) {
        // Verificar que la página existe
        const pagina = await WebsitePaginasModel.obtenerPorId(paginaId, organizacionId);
        if (!pagina) {
            ErrorHelper.throwNotFound('Página');
        }

        return await WebsiteBloquesModel.listar(paginaId, organizacionId);
    }

    /**
     * Obtener contenido por defecto para un tipo de bloque
     *
     * @param {string} tipo - Tipo de bloque
     * @returns {Object} Contenido por defecto
     * @throws {Error} Si el tipo es inválido
     */
    static obtenerContenidoDefault(tipo) {
        if (!WebsiteBloquesModel.TIPOS_VALIDOS.includes(tipo)) {
            ErrorHelper.throwValidation(
                `Tipo de bloque inválido. Tipos permitidos: ${WebsiteBloquesModel.TIPOS_VALIDOS.join(', ')}`
            );
        }

        return WebsiteBloquesModel.obtenerContenidoDefault(tipo);
    }

    /**
     * Obtener todos los tipos de bloques disponibles con descripciones
     *
     * @returns {Array<{tipo: string, descripcion: string}>}
     */
    static listarTipos() {
        const descripciones = {
            hero: 'Banner principal con imagen/video',
            servicios: 'Cards de servicios',
            testimonios: 'Reseñas de clientes',
            equipo: 'Staff/profesionales',
            cta: 'Call to action',
            contacto: 'Formulario + info de contacto',
            footer: 'Pie de página',
            texto: 'Contenido HTML libre',
            galeria: 'Galería de imágenes',
            video: 'Video embebido',
            separador: 'Separador visual',
            pricing: 'Tabla de precios',
            faq: 'Preguntas frecuentes',
            countdown: 'Cuenta regresiva',
            stats: 'Estadísticas',
            timeline: 'Línea de tiempo'
        };

        return WebsiteBloquesModel.TIPOS_VALIDOS.map(tipo => ({
            tipo,
            descripcion: descripciones[tipo] || tipo
        }));
    }
}

module.exports = BloqueService;
