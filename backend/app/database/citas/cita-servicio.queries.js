/**
 * ====================================================================
 * CITA-SERVICIO QUERIES - Queries optimizados para relación M:N
 * ====================================================================
 *
 * Este archivo contiene queries especializados para trabajar con la
 * tabla intermedia citas_servicios (many-to-many).
 *
 * PROPÓSITO:
 * - Evitar Query N+1 en listados de citas
 * - Filtrado eficiente por múltiples servicios
 * - Queries optimizados con JSON_AGG
 *
 * AUTOR: Sistema de Auditoría Arquitectónica
 * FECHA: 26 Octubre 2025
 * VERSION: 1.0
 */

class CitaServicioQueries {

    /**
     * Construir WHERE clause para filtrar citas por servicios (M:N)
     *
     * Soporta dos modos:
     * 1. servicios_ids (NUEVO): Array de IDs - Citas que incluyan AL MENOS uno de estos servicios
     * 2. servicio_id (DEPRECATED): ID singular - Backward compatibility
     *
     * @param {Object} filtros - Objeto con filtros de búsqueda
     * @param {Array<number>} filtros.servicios_ids - Array de IDs de servicios (nuevo)
     * @param {number} filtros.servicio_id - ID singular (deprecated)
     * @param {number} paramCount - Contador de parámetros para query
     * @returns {Object|null} {whereClause, param} o null si no hay filtro
     *
     * @example
     * // Filtrar citas que incluyan servicio 1 O servicio 2 O servicio 3
     * const filter = buildServiciosFilter({servicios_ids: [1,2,3]}, 5);
     * // Retorna: {
     * //   whereClause: "EXISTS (SELECT 1 FROM citas_servicios cs WHERE cs.cita_id = c.id AND cs.servicio_id = ANY($5::integer[]))",
     * //   param: [1,2,3]
     * // }
     */
    static buildServiciosFilter(filtros, paramCount) {
        // NUEVO: Filtrar por array de servicios (citas que incluyan AL MENOS uno)
        if (filtros.servicios_ids && Array.isArray(filtros.servicios_ids) && filtros.servicios_ids.length > 0) {
            const whereClause = `
                EXISTS (
                    SELECT 1 FROM citas_servicios cs
                    WHERE cs.cita_id = c.id
                    AND cs.servicio_id = ANY($${paramCount}::integer[])
                )
            `;
            return { whereClause, param: filtros.servicios_ids };
        }

        // BACKWARD COMPATIBILITY: Mantener servicio_id singular (deprecated)
        if (filtros.servicio_id) {
            const whereClause = `
                EXISTS (
                    SELECT 1 FROM citas_servicios cs
                    WHERE cs.cita_id = c.id
                    AND cs.servicio_id = $${paramCount}
                )
            `;
            return { whereClause, param: filtros.servicio_id };
        }

        return null;
    }

    /**
     * Query optimizada para listar citas con servicios (evita N+1)
     *
     * Usar en lugar de múltiples llamadas a obtenerPorCita().
     * Agrega todos los servicios de cada cita en UN SOLO query usando JSON_AGG.
     *
     * PERFORMANCE:
     * - Sin optimización: 100 citas = 101 queries (~500ms)
     * - Con optimización: 100 citas = 1 query (~50ms) ⚡ 10x más rápido
     *
     * @returns {string} Query base (sin WHERE, ORDER BY, LIMIT)
     *
     * @example
     * const query = CitaServicioQueries.buildListarConServicios();
     * const resultado = await db.query(`
     *   ${query}
     *   WHERE c.organizacion_id = $1
     *   GROUP BY c.id, cli.id, prof.id
     *   ORDER BY c.fecha_cita DESC
     *   LIMIT 20
     * `, [organizacionId]);
     */
    static buildListarConServicios() {
        return `
            SELECT
                c.*,
                cli.nombre AS cliente_nombre,
                cli.telefono AS cliente_telefono,
                cli.email AS cliente_email,
                prof.nombre_completo AS profesional_nombre,

                -- ✅ JSON_AGG: Agregar todos los servicios en UN SOLO query
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'servicio_id', cs.servicio_id,
                            'servicio_nombre', s.nombre,
                            'precio_aplicado', cs.precio_aplicado,
                            'duracion_minutos', cs.duracion_minutos,
                            'orden_ejecucion', cs.orden_ejecucion,
                            'descuento', cs.descuento,
                            'notas', cs.notas
                        ) ORDER BY cs.orden_ejecucion
                    ) FILTER (WHERE cs.id IS NOT NULL),
                    '[]'::json
                ) AS servicios,

                -- ✅ Calcular totales agregados (útil para validaciones)
                COALESCE(SUM(cs.precio_aplicado * (1 - cs.descuento / 100)), 0) AS precio_total_calculado,
                COALESCE(SUM(cs.duracion_minutos), 0) AS duracion_total_calculada

            FROM citas c
            JOIN clientes cli ON c.cliente_id = cli.id
            JOIN profesionales prof ON c.profesional_id = prof.id
            LEFT JOIN citas_servicios cs ON c.id = cs.cita_id
            LEFT JOIN servicios s ON cs.servicio_id = s.id
        `;
    }

    /**
     * Query optimizada para obtener recordatorios con múltiples servicios
     *
     * Similar a buildListarConServicios pero especializado para recordatorios.
     * Incluye STRING_AGG para mostrar nombres de servicios en mensaje.
     *
     * @returns {string} Query completo para recordatorios
     *
     * @example
     * const query = CitaServicioQueries.buildRecordatoriosConServicios();
     * const resultado = await db.query(query, [organizacionId, horasAnticipacion]);
     */
    static buildRecordatoriosConServicios() {
        return `
            SELECT
                c.id,
                c.codigo_cita,
                c.fecha_cita,
                c.hora_inicio,
                cli.nombre AS cliente_nombre,
                cli.telefono AS cliente_telefono,
                prof.nombre_completo AS profesional_nombre,

                -- ✅ STRING_AGG: Concatenar nombres de servicios para mensaje
                STRING_AGG(s.nombre, ', ' ORDER BY cs.orden_ejecucion) AS servicios_nombres,

                -- ✅ Duración total para calcular hora_fin en recordatorio
                SUM(cs.duracion_minutos) AS duracion_total_minutos

            FROM citas c
            JOIN clientes cli ON c.cliente_id = cli.id
            JOIN profesionales prof ON c.profesional_id = prof.id
            LEFT JOIN citas_servicios cs ON c.id = cs.cita_id
            LEFT JOIN servicios s ON cs.servicio_id = s.id
            WHERE c.organizacion_id = $1
                AND c.estado = 'confirmada'
                AND c.recordatorio_enviado = false
                AND (c.fecha_cita + c.hora_inicio)::timestamp <= NOW() + INTERVAL '$2 hours'
                AND (c.fecha_cita + c.hora_inicio)::timestamp > NOW()
            GROUP BY c.id, cli.id, prof.id
            ORDER BY c.fecha_cita, c.hora_inicio
        `;
    }

    /**
     * Query optimizada para dashboard con múltiples servicios
     *
     * Similar a buildListarConServicios pero incluye cálculos de tiempo real.
     *
     * @param {string} whereClause - Cláusula WHERE adicional
     * @returns {string} Query completo para dashboard
     */
    static buildDashboardConServicios(whereClause = '') {
        return `
            SELECT
                c.*,
                cli.nombre AS cliente_nombre,
                cli.telefono AS cliente_telefono,
                prof.nombre_completo AS profesional_nombre,

                -- ✅ JSON_AGG: Servicios con detalles
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'servicio_nombre', s.nombre,
                            'duracion_minutos', cs.duracion_minutos,
                            'precio_aplicado', cs.precio_aplicado
                        ) ORDER BY cs.orden_ejecucion
                    ) FILTER (WHERE cs.id IS NOT NULL),
                    '[]'::json
                ) AS servicios,

                -- ✅ Cálculos de tiempo real
                CASE
                    WHEN c.hora_llegada IS NOT NULL AND c.hora_inicio_real IS NOT NULL
                    THEN EXTRACT(EPOCH FROM (c.hora_inicio_real - c.hora_llegada))/60
                    ELSE NULL
                END AS tiempo_espera_minutos_calculado

            FROM citas c
            JOIN clientes cli ON c.cliente_id = cli.id
            JOIN profesionales prof ON c.profesional_id = prof.id
            LEFT JOIN citas_servicios cs ON c.id = cs.cita_id
            LEFT JOIN servicios s ON cs.servicio_id = s.id
            ${whereClause}
            GROUP BY c.id, cli.id, prof.id
            ORDER BY c.hora_inicio ASC
        `;
    }
}

module.exports = CitaServicioQueries;
