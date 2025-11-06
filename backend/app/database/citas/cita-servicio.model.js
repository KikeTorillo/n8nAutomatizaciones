/**
 * ====================================================================
 * 🔗 CITA-SERVICIO MODEL - RELACIÓN M:N ENTRE CITAS Y SERVICIOS
 * ====================================================================
 *
 * Modelo para gestionar la relación many-to-many entre citas y servicios.
 * Reemplaza la relación 1:N anterior (citas.servicio_id).
 *
 * 🔧 CARACTERÍSTICAS:
 * • CRUD completo para servicios de una cita
 * • Cálculo automático de totales (precio + duración)
 * • Validación de duración máxima (480 minutos = 8 horas)
 * • Snapshot de precios/duración (no afectados por cambios futuros)
 * • RLS multi-tenant mediante JOIN con citas
 *
 * 📊 MÉTODOS PRINCIPALES:
 * • crearMultiples() - Crea múltiples servicios para una cita
 * • obtenerPorCita() - Lista servicios de una cita
 * • actualizarPorCita() - Actualiza servicios de una cita (DELETE + INSERT)
 * • eliminarPorCita() - Elimina todos los servicios de una cita
 * • calcularTotales() - Calcula precio_total y duracion_total
 *
 * ⚡ OPTIMIZACIÓN:
 * • Usa CitaServicioQueries para evitar N+1 queries
 * • INSERT múltiple en una sola query
 * • Transacciones para operaciones atómicas
 * ====================================================================
 */

const RLSContextManager = require('../../utils/rlsContextManager');
const { DatabaseError } = require('../../utils/helpers');

class CitaServicioModel {
    /**
     * ================================================================
     * 📝 CREAR MÚLTIPLES SERVICIOS PARA UNA CITA
     * ================================================================
     * Inserta múltiples servicios asociados a una cita en una sola transacción.
     * Valida que la duración total no exceda 480 minutos (8 horas).
     *
     * @param {number} citaId - ID de la cita
     * @param {Array<Object>} serviciosData - Array de servicios a insertar
     * @param {number} serviciosData[].servicio_id - ID del servicio
     * @param {number} serviciosData[].orden_ejecucion - Orden de ejecución (1, 2, 3...)
     * @param {number} serviciosData[].precio_aplicado - Precio snapshot
     * @param {number} serviciosData[].duracion_minutos - Duración snapshot
     * @param {number} [serviciosData[].descuento=0] - Descuento en porcentaje (0-100)
     * @param {string} [serviciosData[].notas] - Notas específicas del servicio
     * @param {number} organizacionId - ID de la organización (para RLS)
     * @returns {Promise<Array>} Array de servicios creados
     * @throws {DatabaseError} Si la duración total excede 480 minutos
     */
    static async crearMultiples(citaId, serviciosData, organizacionId) {
        // Validar input básico
        if (!citaId || !serviciosData || !Array.isArray(serviciosData) || serviciosData.length === 0) {
            throw new DatabaseError('citaId y serviciosData (array) son requeridos', 400);
        }

        // Validar duración total
        const { duracion_total_minutos } = this.calcularTotales(serviciosData);
        if (duracion_total_minutos > 480) {
            throw new DatabaseError(
                `La duración total (${duracion_total_minutos} minutos) excede el máximo permitido (480 minutos = 8 horas)`,
                400
            );
        }

        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // ✅ PARTITIONING: Validar cita y obtener fecha_cita para FK compuesto
            const citaExists = await db.query(
                'SELECT id, fecha_cita FROM citas WHERE id = $1',
                [citaId]
            );

            if (citaExists.rows.length === 0) {
                throw new DatabaseError(`Cita con ID ${citaId} no encontrada o no pertenece a esta organización`, 404);
            }

            const fechaCita = citaExists.rows[0].fecha_cita;

            // Construir query de inserción múltiple
            const values = [];
            const placeholders = [];
            let paramCount = 1;

            serviciosData.forEach((servicio, index) => {
                const {
                    servicio_id,
                    orden_ejecucion,
                    precio_aplicado,
                    duracion_minutos,
                    descuento = 0,
                    notas = null
                } = servicio;

                // Validaciones básicas
                if (!servicio_id || !precio_aplicado || !duracion_minutos) {
                    throw new DatabaseError(
                        `Servicio en posición ${index}: servicio_id, precio_aplicado y duracion_minutos son requeridos`,
                        400
                    );
                }

                placeholders.push(
                    `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, $${paramCount + 5}, $${paramCount + 6}, $${paramCount + 7})`
                );

                values.push(
                    citaId,
                    fechaCita,  // ✅ PARTITIONING: Requerido para FK compuesto
                    servicio_id,
                    orden_ejecucion || (index + 1), // Si no se proporciona, usar índice del array
                    precio_aplicado,
                    duracion_minutos,
                    descuento,
                    notas
                );

                paramCount += 8;
            });

            const query = `
                INSERT INTO citas_servicios (
                    cita_id,
                    fecha_cita,
                    servicio_id,
                    orden_ejecucion,
                    precio_aplicado,
                    duracion_minutos,
                    descuento,
                    notas
                ) VALUES ${placeholders.join(', ')}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * ================================================================
     * 📋 OBTENER SERVICIOS DE UNA CITA
     * ================================================================
     * Recupera todos los servicios asociados a una cita, ordenados por orden_ejecucion.
     * Incluye información completa del servicio mediante LEFT JOIN.
     *
     * @param {number} citaId - ID de la cita
     * @param {number} organizacionId - ID de la organización (para RLS)
     * @returns {Promise<Array>} Array de servicios con información completa
     */
    static async obtenerPorCita(citaId, organizacionId) {
        if (!citaId) {
            throw new DatabaseError('citaId es requerido', 400);
        }

        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT
                    cs.*,
                    s.nombre as servicio_nombre,
                    s.descripcion as servicio_descripcion,
                    s.activo as servicio_activo
                FROM citas_servicios cs
                LEFT JOIN servicios s ON cs.servicio_id = s.id
                WHERE cs.cita_id = $1
                ORDER BY cs.orden_ejecucion ASC
            `;

            const result = await db.query(query, [citaId]);
            return result.rows;
        });
    }

    /**
     * ================================================================
     * 🔄 ACTUALIZAR SERVICIOS DE UNA CITA
     * ================================================================
     * Actualiza los servicios de una cita usando estrategia DELETE + INSERT.
     * Más eficiente que UPDATE individual para cambios masivos.
     *
     * IMPORTANTE: Esta operación es atómica (transacción).
     * Si falla la inserción, se hace rollback del DELETE.
     *
     * @param {number} citaId - ID de la cita
     * @param {Array<Object>} serviciosData - Nuevo array de servicios
     * @param {number} organizacionId - ID de la organización (para RLS)
     * @returns {Promise<Array>} Array de servicios actualizados
     */
    static async actualizarPorCita(citaId, serviciosData, organizacionId) {
        if (!citaId || !serviciosData || !Array.isArray(serviciosData)) {
            throw new DatabaseError('citaId y serviciosData (array) son requeridos', 400);
        }

        // Validar duración total
        const { duracion_total_minutos } = this.calcularTotales(serviciosData);
        if (duracion_total_minutos > 480) {
            throw new DatabaseError(
                `La duración total (${duracion_total_minutos} minutos) excede el máximo permitido (480 minutos = 8 horas)`,
                400
            );
        }

        return await RLSContextManager.transaction(organizacionId, async (db) => {
            // ✅ PARTITIONING: Validar cita y obtener fecha_cita para FK compuesto
            const citaExists = await db.query(
                'SELECT id, fecha_cita FROM citas WHERE id = $1',
                [citaId]
            );

            if (citaExists.rows.length === 0) {
                throw new DatabaseError(`Cita con ID ${citaId} no encontrada`, 404);
            }

            const fechaCita = citaExists.rows[0].fecha_cita;

            // DELETE servicios actuales
            await db.query('DELETE FROM citas_servicios WHERE cita_id = $1', [citaId]);

            // Si no hay servicios nuevos, retornar array vacío
            if (serviciosData.length === 0) {
                return [];
            }

            // INSERT nuevos servicios usando el método crearMultiples
            // IMPORTANTE: Ya estamos dentro de una transacción iniciada por RLSContextManager.transaction
            // Por lo tanto, no podemos llamar a crearMultiples que intenta iniciar otra transacción.
            // Debemos replicar la lógica de inserción aquí.

            const values = [];
            const placeholders = [];
            let paramCount = 1;

            serviciosData.forEach((servicio, index) => {
                const {
                    servicio_id,
                    orden_ejecucion,
                    precio_aplicado,
                    duracion_minutos,
                    descuento = 0,
                    notas = null
                } = servicio;

                if (!servicio_id || !precio_aplicado || !duracion_minutos) {
                    throw new DatabaseError(
                        `Servicio en posición ${index}: servicio_id, precio_aplicado y duracion_minutos son requeridos`,
                        400
                    );
                }

                placeholders.push(
                    `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4}, $${paramCount + 5}, $${paramCount + 6}, $${paramCount + 7})`
                );

                values.push(
                    citaId,
                    fechaCita,  // ✅ PARTITIONING: Requerido para FK compuesto
                    servicio_id,
                    orden_ejecucion || (index + 1),
                    precio_aplicado,
                    duracion_minutos,
                    descuento,
                    notas
                );

                paramCount += 8;
            });

            const query = `
                INSERT INTO citas_servicios (
                    cita_id,
                    fecha_cita,
                    servicio_id,
                    orden_ejecucion,
                    precio_aplicado,
                    duracion_minutos,
                    descuento,
                    notas
                ) VALUES ${placeholders.join(', ')}
                RETURNING *
            `;

            const result = await db.query(query, values);
            return result.rows;
        });
    }

    /**
     * ================================================================
     * 🗑️ ELIMINAR TODOS LOS SERVICIOS DE UNA CITA
     * ================================================================
     * Elimina todos los servicios asociados a una cita.
     * Útil para limpieza o cuando se cancela una cita.
     *
     * @param {number} citaId - ID de la cita
     * @param {number} organizacionId - ID de la organización (para RLS)
     * @returns {Promise<number>} Cantidad de servicios eliminados
     */
    static async eliminarPorCita(citaId, organizacionId) {
        if (!citaId) {
            throw new DatabaseError('citaId es requerido', 400);
        }

        return await RLSContextManager.query(organizacionId, async (db) => {
            // Validar que la cita existe (RLS valida que pertenece a la org)
            const citaExists = await db.query(
                'SELECT id FROM citas WHERE id = $1',
                [citaId]
            );

            if (citaExists.rows.length === 0) {
                throw new DatabaseError(`Cita con ID ${citaId} no encontrada`, 404);
            }

            // DELETE todos los servicios
            const result = await db.query(
                'DELETE FROM citas_servicios WHERE cita_id = $1',
                [citaId]
            );

            return result.rowCount;
        });
    }

    /**
     * ================================================================
     * 🧮 CALCULAR TOTALES (PRECIO Y DURACIÓN)
     * ================================================================
     * Calcula el precio total y duración total de un array de servicios.
     * Aplica descuentos individuales al precio de cada servicio.
     *
     * FÓRMULA DESCUENTO:
     * precio_final_servicio = precio_aplicado - (precio_aplicado * descuento / 100)
     *
     * @param {Array<Object>} serviciosData - Array de servicios
     * @param {number} serviciosData[].precio_aplicado - Precio del servicio
     * @param {number} serviciosData[].duracion_minutos - Duración del servicio
     * @param {number} [serviciosData[].descuento=0] - Descuento en porcentaje
     * @returns {Object} { precio_total, duracion_total_minutos }
     */
    static calcularTotales(serviciosData) {
        if (!Array.isArray(serviciosData) || serviciosData.length === 0) {
            return {
                precio_total: 0,
                duracion_total_minutos: 0
            };
        }

        const totales = serviciosData.reduce((acc, servicio) => {
            const { precio_aplicado, duracion_minutos, descuento = 0 } = servicio;

            // Validar valores numéricos
            const precio = parseFloat(precio_aplicado) || 0;
            const duracion = parseInt(duracion_minutos) || 0;
            const desc = parseFloat(descuento) || 0;

            // Calcular precio con descuento
            const precioConDescuento = precio - (precio * desc / 100);

            return {
                precio_total: acc.precio_total + precioConDescuento,
                duracion_total_minutos: acc.duracion_total_minutos + duracion
            };
        }, { precio_total: 0, duracion_total_minutos: 0 });

        // Redondear precio a 2 decimales
        totales.precio_total = Math.round(totales.precio_total * 100) / 100;

        return totales;
    }

    /**
     * ================================================================
     * 🔍 VALIDAR SERVICIOS PERTENECEN A LA ORGANIZACIÓN
     * ================================================================
     * Valida que todos los servicios en el array pertenezcan a la organización
     * y estén activos. Útil antes de crear/actualizar una cita.
     *
     * @param {Array<number>} servicioIds - Array de IDs de servicios
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<boolean>} true si todos son válidos
     * @throws {DatabaseError} Si algún servicio no existe o está inactivo
     */
    static async validarServiciosOrganizacion(servicioIds, organizacionId) {
        if (!Array.isArray(servicioIds) || servicioIds.length === 0) {
            throw new DatabaseError('Se requiere al menos un servicio_id', 400);
        }

        return await RLSContextManager.query(organizacionId, async (db) => {
            const query = `
                SELECT id, nombre, activo
                FROM servicios
                WHERE id = ANY($1::int[])
            `;

            const result = await db.query(query, [servicioIds]);

            // Verificar que encontramos todos los servicios
            if (result.rows.length !== servicioIds.length) {
                const encontrados = result.rows.map(s => s.id);
                const faltantes = servicioIds.filter(id => !encontrados.includes(id));
                throw new DatabaseError(
                    `Los siguientes servicios no existen o no pertenecen a esta organización: ${faltantes.join(', ')}`,
                    404
                );
            }

            // Verificar que todos estén activos
            const inactivos = result.rows.filter(s => !s.activo);
            if (inactivos.length > 0) {
                throw new DatabaseError(
                    `Los siguientes servicios están inactivos: ${inactivos.map(s => s.nombre).join(', ')}`,
                    400
                );
            }

            return true;
        });
    }
}

module.exports = CitaServicioModel;
