const RLSContextManager = require('../../../../utils/rlsContextManager');
const logger = require('../../../../utils/logger');

/**
 * ====================================================================
 * MODEL - ANALYTICS DE MARKETPLACE
 * ====================================================================
 *
 * Gestiona tracking y reporting de eventos del marketplace.
 *
 * MÉTODOS:
 * • registrar() - Registrar evento (público con RLS)
 * • obtener() - Obtener analytics agrupados
 * • obtenerEstadisticas() - Stats generales por período
 * • limpiar() - Eliminar datos antiguos (GDPR)
 *
 * CARACTERÍSTICAS:
 * • Fire-and-forget tracking (sin validaciones pesadas)
 * • Hash de IPs (GDPR-compliant)
 * • Agrupamiento flexible (día, semana, mes, evento)
 * • Limpieza automática de datos antiguos
 *
 * Fecha creación: 17 Noviembre 2025
 */
class AnalyticsMarketplaceModel {

    /**
     * Registrar evento de analytics
     * Acceso público (RLS policy permite INSERT a PUBLIC)
     *
     * @param {Object} datos - Datos del evento
     * @returns {Object} Evento registrado
     */
    static async registrar(datos) {
        // Usar withBypass porque es público y no tenemos usuario autenticado
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                INSERT INTO marketplace_analytics (
                    organizacion_id,
                    evento_tipo,
                    fuente,
                    ip_hash,
                    user_agent,
                    pais_visitante,
                    ciudad_visitante
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7
                )
                RETURNING id, organizacion_id, evento_tipo, creado_en
            `;

            const valores = [
                datos.organizacion_id,
                datos.evento_tipo,
                datos.fuente,
                datos.ip_hash,
                datos.user_agent,
                datos.pais_visitante,
                datos.ciudad_visitante
            ];

            logger.info('[AnalyticsMarketplaceModel.registrar] Registrando evento', {
                organizacion_id: datos.organizacion_id,
                evento_tipo: datos.evento_tipo,
                fuente: datos.fuente
            });

            const result = await db.query(query, valores);
            return result.rows[0];
        });
    }

    /**
     * Obtener analytics agrupados
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - {fecha_inicio, fecha_fin, evento_tipo, agrupar_por}
     * @returns {Array} Analytics agrupados
     */
    static async obtener(organizacionId, filtros = {}) {
        return await RLSContextManager.withBypass(async (db) => {
            let whereConditions = ['organizacion_id = $1'];
            let queryParams = [organizacionId];
            let paramIndex = 2;

            // Filtros de fecha
            if (filtros.fecha_inicio) {
                whereConditions.push(`fecha >= $${paramIndex}`);
                queryParams.push(filtros.fecha_inicio);
                paramIndex++;
            }

            if (filtros.fecha_fin) {
                whereConditions.push(`fecha <= $${paramIndex}`);
                queryParams.push(filtros.fecha_fin);
                paramIndex++;
            }

            // Filtro de tipo de evento
            if (filtros.evento_tipo) {
                whereConditions.push(`evento_tipo = $${paramIndex}`);
                queryParams.push(filtros.evento_tipo);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            // Determinar agrupamiento
            let groupBy = '';
            let selectFields = '';

            switch (filtros.agrupar_por) {
                case 'semana':
                    selectFields = `
                        DATE_TRUNC('week', fecha)::date as periodo,
                        evento_tipo,
                        COUNT(*) as total_eventos,
                        COUNT(DISTINCT ip_hash) as visitantes_unicos
                    `;
                    groupBy = 'DATE_TRUNC(\'week\', fecha), evento_tipo';
                    break;

                case 'mes':
                    selectFields = `
                        DATE_TRUNC('month', fecha)::date as periodo,
                        evento_tipo,
                        COUNT(*) as total_eventos,
                        COUNT(DISTINCT ip_hash) as visitantes_unicos
                    `;
                    groupBy = 'DATE_TRUNC(\'month\', fecha), evento_tipo';
                    break;

                case 'evento':
                    selectFields = `
                        evento_tipo,
                        COUNT(*) as total_eventos,
                        COUNT(DISTINCT ip_hash) as visitantes_unicos,
                        COUNT(DISTINCT DATE(creado_en)) as dias_activos
                    `;
                    groupBy = 'evento_tipo';
                    break;

                case 'dia':
                default:
                    selectFields = `
                        fecha as periodo,
                        evento_tipo,
                        COUNT(*) as total_eventos,
                        COUNT(DISTINCT ip_hash) as visitantes_unicos
                    `;
                    groupBy = 'fecha, evento_tipo';
                    break;
            }

            const query = `
                SELECT ${selectFields}
                FROM marketplace_analytics
                WHERE ${whereClause}
                GROUP BY ${groupBy}
                ORDER BY periodo DESC
            `;

            logger.info('[AnalyticsMarketplaceModel.obtener] Obteniendo analytics', {
                organizacion_id: organizacionId,
                filtros
            });

            const result = await db.query(query, queryParams);

            // Convertir a números enteros
            return result.rows.map(row => ({
                ...row,
                total_eventos: parseInt(row.total_eventos),
                visitantes_unicos: parseInt(row.visitantes_unicos),
                dias_activos: row.dias_activos ? parseInt(row.dias_activos) : undefined
            }));
        });
    }

    /**
     * Obtener estadísticas generales por período
     *
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - {periodo: '7dias'|'30dias'|'90dias'|'año'}
     * @returns {Object} Estadísticas generales
     */
    static async obtenerEstadisticas(organizacionId, filtros = {}) {
        return await RLSContextManager.withBypass(async (db) => {
            // Calcular fecha de inicio según período
            let diasAtras = 30; // default: 30 días

            switch (filtros.periodo) {
                case '7dias':
                    diasAtras = 7;
                    break;
                case '90dias':
                    diasAtras = 90;
                    break;
                case 'año':
                    diasAtras = 365;
                    break;
                default:
                    diasAtras = 30;
            }

            const query = `
                SELECT
                    COUNT(*) as total_eventos,
                    COUNT(DISTINCT ip_hash) as visitantes_unicos,
                    COUNT(*) FILTER (WHERE evento_tipo = 'vista_perfil') as total_vistas,
                    COUNT(*) FILTER (WHERE evento_tipo = 'clic_agendar') as clics_agendar,
                    COUNT(*) FILTER (WHERE evento_tipo = 'clic_telefono') as clics_telefono,
                    COUNT(*) FILTER (WHERE evento_tipo = 'clic_sitio_web') as clics_sitio_web,
                    COUNT(*) FILTER (WHERE evento_tipo = 'clic_instagram') as clics_instagram,
                    COUNT(*) FILTER (WHERE evento_tipo = 'clic_facebook') as clics_facebook,
                    COUNT(DISTINCT fuente) FILTER (WHERE fuente IS NOT NULL) as fuentes_unicas,
                    COUNT(DISTINCT pais_visitante) FILTER (WHERE pais_visitante IS NOT NULL) as paises_unicos,
                    COUNT(DISTINCT ciudad_visitante) FILTER (WHERE ciudad_visitante IS NOT NULL) as ciudades_unicas,
                    COUNT(DISTINCT DATE(creado_en)) as dias_activos
                FROM marketplace_analytics
                WHERE organizacion_id = $1
                  AND fecha >= CURRENT_DATE - INTERVAL '${diasAtras} days'
            `;

            logger.info('[AnalyticsMarketplaceModel.obtenerEstadisticas] Obteniendo estadísticas', {
                organizacion_id: organizacionId,
                periodo: filtros.periodo,
                dias_atras: diasAtras
            });

            const result = await db.query(query, [organizacionId]);
            const stats = result.rows[0];

            // Calcular métricas derivadas
            const totalVistas = parseInt(stats.total_vistas) || 0;
            const clicsAgendar = parseInt(stats.clics_agendar) || 0;
            const totalClics = clicsAgendar +
                              parseInt(stats.clics_telefono || 0) +
                              parseInt(stats.clics_sitio_web || 0) +
                              parseInt(stats.clics_instagram || 0) +
                              parseInt(stats.clics_facebook || 0);

            const tasaConversion = totalVistas > 0
                ? ((clicsAgendar / totalVistas) * 100).toFixed(2)
                : '0.00';

            const tasaInteraccion = totalVistas > 0
                ? ((totalClics / totalVistas) * 100).toFixed(2)
                : '0.00';

            return {
                periodo: filtros.periodo || '30dias',
                total_eventos: parseInt(stats.total_eventos),
                visitantes_unicos: parseInt(stats.visitantes_unicos),
                total_vistas: totalVistas,
                clics_agendar: clicsAgendar,
                clics_telefono: parseInt(stats.clics_telefono),
                clics_sitio_web: parseInt(stats.clics_sitio_web),
                clics_instagram: parseInt(stats.clics_instagram),
                clics_facebook: parseInt(stats.clics_facebook),
                total_clics: totalClics,
                tasa_conversion: tasaConversion,
                tasa_interaccion: tasaInteraccion,
                fuentes_unicas: parseInt(stats.fuentes_unicas),
                paises_unicos: parseInt(stats.paises_unicos),
                ciudades_unicas: parseInt(stats.ciudades_unicas),
                dias_activos: parseInt(stats.dias_activos)
            };
        });
    }

    /**
     * Limpiar datos antiguos de analytics
     * GDPR compliance: eliminar eventos más antiguos que X días
     *
     * @param {number} diasAntiguedad - Días de antigüedad mínima (mínimo 90)
     * @returns {Object} {registros_eliminados}
     */
    static async limpiar(diasAntiguedad) {
        return await RLSContextManager.withBypass(async (db) => {
            const query = `
                DELETE FROM marketplace_analytics
                WHERE fecha < CURRENT_DATE - INTERVAL '${diasAntiguedad} days'
            `;

            logger.info('[AnalyticsMarketplaceModel.limpiar] Limpiando datos antiguos', {
                dias_antiguedad: diasAntiguedad
            });

            const result = await db.query(query);
            const registrosEliminados = result.rowCount;

            logger.info('[AnalyticsMarketplaceModel.limpiar] Limpieza completada', {
                registros_eliminados: registrosEliminados
            });

            return {
                registros_eliminados: registrosEliminados,
                dias_antiguedad: diasAntiguedad
            };
        });
    }
}

module.exports = AnalyticsMarketplaceModel;
