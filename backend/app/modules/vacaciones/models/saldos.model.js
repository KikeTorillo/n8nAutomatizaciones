/**
 * SaldosVacacionesModel - Enero 2026
 * Gestión de saldos de vacaciones por profesional y año
 * Fase 3 del Plan de Empleados Competitivo
 */
const RLSContextManager = require('../../../utils/rlsContextManager');
const NivelesVacacionesModel = require('./niveles.model');
const PoliticasVacacionesModel = require('./politicas.model');

class SaldosVacacionesModel {

    /**
     * Obtiene el saldo de vacaciones de un profesional para un año específico
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {number} anio - Año (default: actual)
     * @returns {Promise<Object|null>} Saldo o null
     */
    static async obtenerSaldo(organizacionId, profesionalId, anio = null) {
        const anioConsulta = anio || new Date().getFullYear();

        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    sv.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    p.fecha_ingreso as profesional_fecha_ingreso
                FROM saldos_vacaciones sv
                JOIN profesionales p ON p.id = sv.profesional_id
                WHERE sv.organizacion_id = $1
                  AND sv.profesional_id = $2
                  AND sv.anio = $3
            `;

            const result = await db.query(query, [organizacionId, profesionalId, anioConsulta]);

            if (result.rows.length === 0) {
                // Intentar crear saldo automáticamente
                return await this.crearSaldoAutomatico(organizacionId, profesionalId, anioConsulta);
            }

            return result.rows[0];
        });
    }

    /**
     * Crea saldo automáticamente para un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {number} anio - Año
     * @returns {Promise<Object|null>} Saldo creado o null si no se puede
     */
    static async crearSaldoAutomatico(organizacionId, profesionalId, anio) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener fecha de ingreso del profesional
            const profQuery = await db.query(
                `SELECT fecha_ingreso FROM profesionales WHERE id = $1 AND organizacion_id = $2`,
                [profesionalId, organizacionId]
            );

            if (profQuery.rows.length === 0 || !profQuery.rows[0].fecha_ingreso) {
                return null;
            }

            const fechaIngreso = profQuery.rows[0].fecha_ingreso;

            // Calcular días correspondientes según antigüedad
            const diasCorrespondientes = await NivelesVacacionesModel.calcularDiasPorAntiguedad(
                organizacionId,
                fechaIngreso
            );

            // Obtener días acumulados del año anterior
            let diasAcumuladosAnterior = 0;
            const saldoAnteriorQuery = await db.query(
                `SELECT dias_pendientes FROM saldos_vacaciones
                 WHERE organizacion_id = $1 AND profesional_id = $2 AND anio = $3`,
                [organizacionId, profesionalId, anio - 1]
            );

            if (saldoAnteriorQuery.rows.length > 0) {
                const politica = await PoliticasVacacionesModel.obtener(organizacionId);
                const maxAcumulable = politica?.dias_maximos_acumulables || 30;
                const pendientesAnterior = parseFloat(saldoAnteriorQuery.rows[0].dias_pendientes) || 0;
                diasAcumuladosAnterior = Math.min(pendientesAnterior, maxAcumulable);
            }

            // Crear saldo
            const insertQuery = `
                INSERT INTO saldos_vacaciones (
                    organizacion_id, profesional_id, anio,
                    dias_correspondientes, dias_acumulados_anterior
                ) VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (organizacion_id, profesional_id, anio)
                DO UPDATE SET
                    dias_correspondientes = EXCLUDED.dias_correspondientes,
                    dias_acumulados_anterior = EXCLUDED.dias_acumulados_anterior
                RETURNING *
            `;

            const result = await db.query(insertQuery, [
                organizacionId,
                profesionalId,
                anio,
                diasCorrespondientes,
                diasAcumuladosAnterior
            ]);

            return result.rows[0];
        });
    }

    /**
     * Lista saldos de vacaciones con filtros
     * @param {number} organizacionId - ID de la organización
     * @param {Object} filtros - Filtros
     * @returns {Promise<Object>} { data, total, page, limit }
     */
    static async listar(organizacionId, filtros = {}) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const {
                anio = new Date().getFullYear(),
                profesional_id = null,
                con_pendientes = null,
                page = 1,
                limit = 20,
            } = filtros;

            let whereClause = 'sv.organizacion_id = $1 AND sv.anio = $2';
            const values = [organizacionId, anio];
            let contador = 3;

            if (profesional_id) {
                whereClause += ` AND sv.profesional_id = $${contador}`;
                values.push(profesional_id);
                contador++;
            }

            if (con_pendientes !== null) {
                if (con_pendientes) {
                    whereClause += ` AND sv.dias_pendientes > 0`;
                } else {
                    whereClause += ` AND sv.dias_pendientes <= 0`;
                }
            }

            // Contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM saldos_vacaciones sv
                JOIN profesionales p ON p.id = sv.profesional_id
                WHERE ${whereClause}
                  AND p.activo = true
                  AND p.eliminado_en IS NULL
            `;
            const countResult = await db.query(countQuery, values);
            const total = parseInt(countResult.rows[0].total);

            // Obtener datos paginados
            const offset = (page - 1) * limit;
            const dataQuery = `
                SELECT
                    sv.*,
                    p.nombre_completo as profesional_nombre,
                    p.email as profesional_email,
                    p.codigo_empleado,
                    p.fecha_ingreso,
                    d.nombre as departamento_nombre
                FROM saldos_vacaciones sv
                JOIN profesionales p ON p.id = sv.profesional_id
                LEFT JOIN departamentos d ON d.id = p.departamento_id
                WHERE ${whereClause}
                  AND p.activo = true
                  AND p.eliminado_en IS NULL
                ORDER BY p.nombre ASC
                LIMIT $${contador} OFFSET $${contador + 1}
            `;
            values.push(limit, offset);

            const dataResult = await db.query(dataQuery, values);

            return {
                data: dataResult.rows,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        });
    }

    /**
     * Ajusta manualmente el saldo de un profesional
     * @param {number} organizacionId - ID de la organización
     * @param {number} saldoId - ID del saldo
     * @param {number} diasAjuste - Días a ajustar (+/-)
     * @param {string} motivo - Motivo del ajuste
     * @param {number} usuarioId - ID del usuario que ajusta
     * @returns {Promise<Object>} Saldo actualizado
     */
    static async ajustar(organizacionId, saldoId, diasAjuste, motivo, usuarioId) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Verificar que existe el saldo
            const saldoQuery = await db.query(
                `SELECT * FROM saldos_vacaciones WHERE id = $1 AND organizacion_id = $2`,
                [saldoId, organizacionId]
            );

            if (saldoQuery.rows.length === 0) {
                throw new Error('Saldo no encontrado');
            }

            const saldoActual = saldoQuery.rows[0];
            const nuevoAjuste = parseFloat(saldoActual.dias_ajuste_manual || 0) + diasAjuste;

            // Agregar nota al historial
            const notasActuales = saldoActual.notas_ajuste || '';
            const fechaAjuste = new Date().toISOString().split('T')[0];
            const nuevaNota = `[${fechaAjuste}] ${diasAjuste > 0 ? '+' : ''}${diasAjuste} días: ${motivo}`;
            const notasNuevas = notasActuales
                ? `${notasActuales}\n${nuevaNota}`
                : nuevaNota;

            const updateQuery = `
                UPDATE saldos_vacaciones
                SET
                    dias_ajuste_manual = $1,
                    notas_ajuste = $2,
                    actualizado_por = $3
                WHERE id = $4
                  AND organizacion_id = $5
                RETURNING *
            `;

            const result = await db.query(updateQuery, [
                nuevoAjuste,
                notasNuevas,
                usuarioId,
                saldoId,
                organizacionId
            ]);

            return result.rows[0];
        });
    }

    /**
     * Genera saldos para todos los profesionales activos de un año
     * @param {number} organizacionId - ID de la organización
     * @param {number} anio - Año
     * @param {number} profesionalId - Opcional: solo para un profesional
     * @param {boolean} sobrescribir - Si sobrescribe saldos existentes
     * @returns {Promise<Object>} { creados, actualizados, errores }
     */
    static async generarSaldosAnio(organizacionId, anio, profesionalId = null, sobrescribir = false) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            // Obtener profesionales activos
            let profQuery = `
                SELECT id, fecha_ingreso
                FROM profesionales
                WHERE organizacion_id = $1
                  AND activo = true
                  AND eliminado_en IS NULL
                  AND fecha_ingreso IS NOT NULL
            `;
            const profValues = [organizacionId];

            if (profesionalId) {
                profQuery += ` AND id = $2`;
                profValues.push(profesionalId);
            }

            const profResult = await db.query(profQuery, profValues);
            const profesionales = profResult.rows;

            const resultados = { creados: 0, actualizados: 0, errores: [] };

            for (const prof of profesionales) {
                try {
                    // Verificar si ya existe saldo
                    const saldoExistente = await db.query(
                        `SELECT id FROM saldos_vacaciones
                         WHERE organizacion_id = $1 AND profesional_id = $2 AND anio = $3`,
                        [organizacionId, prof.id, anio]
                    );

                    if (saldoExistente.rows.length > 0 && !sobrescribir) {
                        continue; // Ya existe y no sobrescribir
                    }

                    // Calcular días
                    const diasCorrespondientes = await NivelesVacacionesModel.calcularDiasPorAntiguedad(
                        organizacionId,
                        prof.fecha_ingreso
                    );

                    // Obtener acumulado del año anterior
                    let diasAcumuladosAnterior = 0;
                    const saldoAnterior = await db.query(
                        `SELECT dias_pendientes FROM saldos_vacaciones
                         WHERE organizacion_id = $1 AND profesional_id = $2 AND anio = $3`,
                        [organizacionId, prof.id, anio - 1]
                    );

                    if (saldoAnterior.rows.length > 0) {
                        const politica = await PoliticasVacacionesModel.obtener(organizacionId);
                        const maxAcumulable = politica?.dias_maximos_acumulables || 30;
                        diasAcumuladosAnterior = Math.min(
                            parseFloat(saldoAnterior.rows[0].dias_pendientes) || 0,
                            maxAcumulable
                        );
                    }

                    // Insertar o actualizar
                    if (saldoExistente.rows.length > 0) {
                        await db.query(
                            `UPDATE saldos_vacaciones
                             SET dias_correspondientes = $1, dias_acumulados_anterior = $2
                             WHERE id = $3`,
                            [diasCorrespondientes, diasAcumuladosAnterior, saldoExistente.rows[0].id]
                        );
                        resultados.actualizados++;
                    } else {
                        await db.query(
                            `INSERT INTO saldos_vacaciones
                             (organizacion_id, profesional_id, anio, dias_correspondientes, dias_acumulados_anterior)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [organizacionId, prof.id, anio, diasCorrespondientes, diasAcumuladosAnterior]
                        );
                        resultados.creados++;
                    }
                } catch (error) {
                    resultados.errores.push({
                        profesional_id: prof.id,
                        error: error.message,
                    });
                }
            }

            return resultados;
        });
    }

    /**
     * Actualiza días usados en el saldo (llamado al aprobar solicitud)
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {number} anio - Año
     * @param {number} diasUsados - Días a sumar a usados
     * @returns {Promise<Object>} Saldo actualizado
     */
    static async sumarDiasUsados(organizacionId, profesionalId, anio, diasUsados) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE saldos_vacaciones
                SET dias_usados = dias_usados + $1
                WHERE organizacion_id = $2
                  AND profesional_id = $3
                  AND anio = $4
                RETURNING *
            `;

            const result = await db.query(query, [diasUsados, organizacionId, profesionalId, anio]);
            return result.rows[0];
        });
    }

    /**
     * Actualiza días solicitados pendientes (reservados)
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {number} anio - Año
     * @param {number} dias - Días a sumar (+) o restar (-)
     * @returns {Promise<Object>} Saldo actualizado
     */
    static async actualizarDiasSolicitadosPendientes(organizacionId, profesionalId, anio, dias) {
        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                UPDATE saldos_vacaciones
                SET dias_solicitados_pendientes = GREATEST(0, dias_solicitados_pendientes + $1)
                WHERE organizacion_id = $2
                  AND profesional_id = $3
                  AND anio = $4
                RETURNING *
            `;

            const result = await db.query(query, [dias, organizacionId, profesionalId, anio]);
            return result.rows[0];
        });
    }

    /**
     * Verifica si hay saldo suficiente para solicitar días
     * @param {number} organizacionId - ID de la organización
     * @param {number} profesionalId - ID del profesional
     * @param {number} anio - Año
     * @param {number} diasSolicitar - Días a solicitar
     * @returns {Promise<{disponible: boolean, saldoActual: number, mensaje: string}>}
     */
    static async verificarSaldoDisponible(organizacionId, profesionalId, anio, diasSolicitar) {
        const saldo = await this.obtenerSaldo(organizacionId, profesionalId, anio);

        if (!saldo) {
            return {
                disponible: false,
                saldoActual: 0,
                mensaje: 'No hay saldo de vacaciones para este período',
            };
        }

        const diasPendientes = parseFloat(saldo.dias_pendientes) || 0;
        const politica = await PoliticasVacacionesModel.obtener(organizacionId);

        // Si permite saldo negativo, siempre disponible
        if (politica?.permite_saldo_negativo) {
            return {
                disponible: true,
                saldoActual: diasPendientes,
                mensaje: 'OK',
            };
        }

        if (diasPendientes >= diasSolicitar) {
            return {
                disponible: true,
                saldoActual: diasPendientes,
                mensaje: 'OK',
            };
        }

        return {
            disponible: false,
            saldoActual: diasPendientes,
            mensaje: `Saldo insuficiente. Disponible: ${diasPendientes} días, Solicitados: ${diasSolicitar} días`,
        };
    }
}

module.exports = SaldosVacacionesModel;
