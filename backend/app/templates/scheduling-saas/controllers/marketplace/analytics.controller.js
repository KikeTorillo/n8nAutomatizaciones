const { AnalyticsMarketplaceModel } = require('../../../../database/marketplace');
const { ResponseHelper } = require('../../../../utils/helpers');
const { asyncHandler } = require('../../../../middleware');
const crypto = require('crypto');

/**
 * ====================================================================
 * CONTROLLER - ANALYTICS DE MARKETPLACE
 * ====================================================================
 *
 * Gestiona tracking de eventos del marketplace (vistas, clics).
 *
 * ENDPOINTS (4):
 * • POST   /analytics                                - Registrar evento (público)
 * • GET    /analytics/:organizacion_id               - Obtener analytics (requiere auth)
 * • GET    /analytics/:organizacion_id/estadisticas  - Stats generales (requiere auth)
 * • DELETE /analytics/limpiar                        - Limpiar datos antiguos (admin)
 *
 * EVENTOS TRACKABLES:
 * • vista_perfil      - Vista de la página del perfil
 * • clic_agendar      - Click en botón "Agendar Cita"
 * • clic_telefono     - Click en teléfono
 * • clic_sitio_web    - Click en sitio web
 * • clic_instagram    - Click en Instagram
 * • clic_facebook     - Click en Facebook
 *
 * GDPR COMPLIANCE:
 * • IPs hasheadas con SHA256 (no se almacenan IPs reales)
 * • User agents opcionales
 * • Geolocalización aproximada (país/ciudad)
 *
 * Fecha creación: 17 Noviembre 2025
 */
class AnalyticsMarketplaceController {

    /**
     * Registrar evento de analytics
     * POST /api/v1/marketplace/analytics
     *
     * @public Sin autenticación requerida
     * @note Hash de IP con SHA256 para GDPR compliance
     */
    static registrarEvento = asyncHandler(async (req, res) => {
        const { organizacion_id, evento_tipo, fuente, pais_visitante, ciudad_visitante } = req.body;

        // Obtener IP del request (considerando proxies)
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress;

        // Hash de IP con SHA256 (GDPR-friendly)
        const ipHash = this._hashIP(ip);

        // Obtener user agent
        const userAgent = req.headers['user-agent'] || null;

        const datosEvento = {
            organizacion_id,
            evento_tipo,
            fuente: fuente || 'directo',
            ip_hash: ipHash,
            user_agent: userAgent,
            pais_visitante: pais_visitante || null,
            ciudad_visitante: ciudad_visitante || null
        };

        const eventoRegistrado = await AnalyticsMarketplaceModel.registrar(datosEvento);

        return ResponseHelper.success(
            res,
            eventoRegistrado,
            'Evento registrado exitosamente',
            201
        );
    });

    /**
     * Obtener analytics de un perfil
     * GET /api/v1/marketplace/analytics/:organizacion_id
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     * @note Retorna eventos agrupados por fecha o tipo
     */
    static obtener = asyncHandler(async (req, res) => {
        const { organizacion_id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Validar que el usuario tenga acceso a esta organización
        if (parseInt(organizacion_id) !== organizacionId) {
            return ResponseHelper.error(
                res,
                'No tiene permisos para ver analytics de esta organización',
                403
            );
        }

        const filtros = {
            fecha_inicio: req.query.fecha_inicio || undefined,
            fecha_fin: req.query.fecha_fin || undefined,
            evento_tipo: req.query.evento_tipo || undefined,
            agrupar_por: req.query.agrupar_por || 'dia' // dia, semana, mes, evento
        };

        const analytics = await AnalyticsMarketplaceModel.obtener(organizacionId, filtros);

        return ResponseHelper.success(
            res,
            analytics,
            'Analytics obtenidos exitosamente'
        );
    });

    /**
     * Obtener estadísticas generales de analytics
     * GET /api/v1/marketplace/analytics/:organizacion_id/estadisticas
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     * @note Retorna resumen ejecutivo: total vistas, clics, conversión, etc.
     */
    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        const { organizacion_id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Validar que el usuario tenga acceso a esta organización
        if (parseInt(organizacion_id) !== organizacionId) {
            return ResponseHelper.error(
                res,
                'No tiene permisos para ver estadísticas de esta organización',
                403
            );
        }

        const filtros = {
            periodo: req.query.periodo || '30dias' // 7dias, 30dias, 90dias, año
        };

        const estadisticas = await AnalyticsMarketplaceModel.obtenerEstadisticas(
            organizacionId,
            filtros
        );

        return ResponseHelper.success(
            res,
            estadisticas,
            'Estadísticas obtenidas exitosamente'
        );
    });

    /**
     * Limpiar datos antiguos de analytics
     * DELETE /api/v1/marketplace/analytics/limpiar
     *
     * @requires auth - solo super_admin
     * @note Elimina eventos más antiguos que X días (mínimo 90)
     */
    static limpiar = asyncHandler(async (req, res) => {
        // Validar que el usuario sea super_admin
        if (req.user.rol !== 'super_admin') {
            return ResponseHelper.error(
                res,
                'Solo super administradores pueden limpiar datos de analytics',
                403
            );
        }

        const diasAntiguedad = parseInt(req.query.dias_antiguedad);

        if (!diasAntiguedad || diasAntiguedad < 90) {
            return ResponseHelper.error(
                res,
                'Debe especificar al menos 90 días de antigüedad',
                400
            );
        }

        const resultado = await AnalyticsMarketplaceModel.limpiar(diasAntiguedad);

        return ResponseHelper.success(
            res,
            resultado,
            `${resultado.registros_eliminados} eventos eliminados exitosamente`
        );
    });

    /**
     * Hash de IP con SHA256 (GDPR-compliant)
     * No almacena IPs reales, solo hash para contar visitantes únicos
     *
     * @param {string} ip - IP del visitante
     * @returns {string} Hash SHA256 de la IP
     * @private
     */
    static _hashIP(ip) {
        if (!ip) return null;

        return crypto
            .createHash('sha256')
            .update(ip)
            .digest('hex');
    }
}

module.exports = AnalyticsMarketplaceController;
