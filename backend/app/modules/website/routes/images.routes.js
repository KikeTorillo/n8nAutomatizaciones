/**
 * ====================================================================
 * IMAGES ROUTES
 * ====================================================================
 * Rutas para busqueda y descarga de imagenes.
 */

const express = require('express');
const router = express.Router();
const imagesController = require('../controllers/images.controller');
const { auth } = require('../../../middleware');

// Todas las rutas requieren autenticacion
router.use(auth.authenticateToken);

/**
 * @route   GET /api/v1/website/images/search
 * @desc    Buscar imagenes en Unsplash
 * @access  Private
 * @query   q - Termino de busqueda (requerido)
 * @query   page - Numero de pagina (default: 1)
 * @query   per_page - Resultados por pagina (default: 20)
 * @query   orientation - 'landscape' | 'portrait' | 'squarish'
 */
router.get('/search', imagesController.buscarImagenes);

/**
 * @route   POST /api/v1/website/images/download
 * @desc    Descargar imagen (registra descarga y retorna URL optimizada)
 * @access  Private
 * @body    url - URL de la imagen
 * @body    photographer - Nombre del fotografo
 * @body    unsplashId - ID de Unsplash
 * @body    downloadLocation - URL de tracking de descarga
 */
router.post('/download', imagesController.descargarImagen);

/**
 * @route   GET /api/v1/website/images/random
 * @desc    Obtener imagen aleatoria
 * @access  Private
 * @query   query - Termino de busqueda opcional
 */
router.get('/random', imagesController.imagenAleatoria);

module.exports = router;
