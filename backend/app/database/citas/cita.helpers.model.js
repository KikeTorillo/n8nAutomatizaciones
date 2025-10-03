/**
 * Helpers y Constantes del Modelo de Citas
 * Funciones auxiliares compartidas y configuración del sistema
 */

const { getDb } = require('../../config/database');
const logger = require('../../utils/logger');

// Constantes del sistema
const DEFAULTS = {
    ZONA_HORARIA: 'America/Mexico_City',
    ORIGEN_APLICACION: 'api',
    DURACION_SLOT_DEFAULT: 30,
    HORAS_CANCELACION_MINIMA: 2
};

/**
 * Clase de helpers compartidos para el modelo de citas
 */
class CitaHelpersModel {

    /**
     * Buscar o crear cliente para IA
     * @param {Object} datosIA - Datos de IA
     * @returns {Promise<Object>} Cliente encontrado o creado
     */
    static async buscarOCrearCliente(datosIA) {
        const db = await getDb();

        // Buscar cliente existente por teléfono
        const clienteExistente = await db.query(
            'SELECT id, nombre, telefono, email FROM clientes WHERE telefono = $1 AND organizacion_id = $2',
            [datosIA.telefono_cliente, datosIA.organizacion_id]
        );

        if (clienteExistente.rows.length > 0) {
            logger.info('[CitaHelpersModel.buscarOCrearCliente] Cliente existente encontrado', {
                cliente_id: clienteExistente.rows[0].id,
                telefono: datosIA.telefono_cliente
            });
            return {
                ...clienteExistente.rows[0],
                es_nuevo: false
            };
        }

        // Crear cliente nuevo si se permite
        if (datosIA.crear_cliente_si_no_existe) {
            const nuevoCliente = await db.query(`
                INSERT INTO clientes (
                    organizacion_id, nombre, telefono, email,
                    origen_cliente, activo, creado_en
                ) VALUES ($1, $2, $3, $4, $5, true, NOW())
                RETURNING id, nombre, telefono, email
            `, [
                datosIA.organizacion_id,
                datosIA.nombre_cliente_nuevo || `Cliente ${datosIA.telefono_cliente}`,
                datosIA.telefono_cliente,
                datosIA.email_cliente_nuevo || null,
                'ia_automatica'
            ]);

            logger.info('[CitaHelpersModel.buscarOCrearCliente] Cliente nuevo creado por IA', {
                cliente_id: nuevoCliente.rows[0].id,
                telefono: datosIA.telefono_cliente,
                nombre: nuevoCliente.rows[0].nombre
            });

            return {
                ...nuevoCliente.rows[0],
                es_nuevo: true
            };
        }

        throw new Error('Cliente no encontrado y creación automática deshabilitada');
    }

    /**
     * Obtener información completa del servicio
     * @param {number} servicioId - ID del servicio
     * @param {number} organizacionId - ID de la organización
     * @param {Object} db - Conexión a la base de datos
     * @returns {Promise<Object>} Servicio completo
     */
    static async obtenerServicioCompleto(servicioId, organizacionId, db) {
        const servicio = await db.query(`
            SELECT s.*, ps.precio
            FROM servicios s
            LEFT JOIN plantillas_servicios ps ON s.plantilla_id = ps.id
            WHERE s.id = $1 AND s.organizacion_id = $2 AND s.activo = true
        `, [servicioId, organizacionId]);

        if (servicio.rows.length === 0) {
            return null;
        }

        return {
            ...servicio.rows[0],
            duracion_minutos: servicio.rows[0].duracion_minutos || DEFAULTS.DURACION_SLOT_DEFAULT,
            precio: servicio.rows[0].precio || 0
        };
    }

    /**
     * Buscar horario compatible para IA
     * @param {Object} criterios - Criterios de búsqueda
     * @param {Object} db - Conexión a la base de datos
     * @returns {Promise<Object>} Horario disponible
     */
    static async buscarHorarioCompatible(criterios, db) {
        const {
            organizacion_id,
            servicio_id,
            fecha_solicitada,
            turno_preferido,
            profesional_preferido,
            duracion_minutos
        } = criterios;

        // Convertir fecha solicitada a fecha específica
        let fechaObjetivo;
        const hoy = new Date();

        if (fecha_solicitada === 'hoy') {
            fechaObjetivo = hoy;
        } else if (fecha_solicitada === 'mañana') {
            fechaObjetivo = new Date(hoy);
            fechaObjetivo.setDate(hoy.getDate() + 1);
        } else {
            fechaObjetivo = new Date(fecha_solicitada);
        }

        const fechaFormateada = fechaObjetivo.toISOString().split('T')[0];

        // Definir rango de horas según turno preferido
        let horaInicio, horaFin;
        switch (turno_preferido) {
            case 'mañana':
                horaInicio = '08:00';
                horaFin = '12:00';
                break;
            case 'tarde':
                horaInicio = '14:00';
                horaFin = '18:00';
                break;
            case 'noche':
                horaInicio = '18:00';
                horaFin = '21:00';
                break;
            default:
                horaInicio = '08:00';
                horaFin = '21:00';
        }

        // Buscar horarios disponibles
        let query = `
            SELECT
                h.id as horario_id,
                h.profesional_id,
                h.fecha,
                h.hora_inicio,
                h.hora_fin,
                p.nombre as profesional_nombre
            FROM horarios_disponibilidad h
            JOIN profesionales p ON h.profesional_id = p.id
            JOIN servicios_profesionales sp ON sp.profesional_id = p.id AND sp.servicio_id = $2
            WHERE h.organizacion_id = $1
                AND h.fecha = $3
                AND h.disponible = true
                AND h.cita_id IS NULL
                AND h.hora_inicio >= $4::time
                AND h.hora_fin <= $5::time
                AND p.activo = true
        `;

        const params = [organizacion_id, servicio_id, fechaFormateada, horaInicio, horaFin];

        if (profesional_preferido) {
            query += ' AND h.profesional_id = $6';
            params.push(profesional_preferido);
        }

        query += ' ORDER BY h.hora_inicio ASC LIMIT 1';

        const horarios = await db.query(query, params);

        if (horarios.rows.length === 0) {
            logger.warn('[CitaHelpersModel.buscarHorarioCompatible] No hay horarios disponibles', {
                organizacion_id,
                fecha: fechaFormateada,
                turno: turno_preferido,
                profesional_preferido
            });
            return null;
        }

        return horarios.rows[0];
    }

    /**
     * Generar código único de cita
     * @param {number} organizacionId - ID de la organización
     * @param {Object} db - Conexión a la base de datos
     * @returns {Promise<string>} Código único
     */
    static async generarCodigoCita(organizacionId, db) {
        let codigo;
        let intentos = 0;
        const maxIntentos = 5;

        do {
            // Generar código alfanumérico de 8 caracteres
            const fecha = new Date().toISOString().slice(2, 10).replace(/-/g, '');
            const aleatorio = Math.random().toString(36).substring(2, 6).toUpperCase();
            codigo = `${fecha}${aleatorio}`;

            // Verificar que no existe
            const existeCodigo = await db.query(
                'SELECT id FROM citas WHERE codigo_cita = $1',
                [codigo]
            );

            if (existeCodigo.rows.length === 0) {
                break;
            }

            intentos++;
        } while (intentos < maxIntentos);

        if (intentos >= maxIntentos) {
            throw new Error('No se pudo generar un código único para la cita');
        }

        return codigo;
    }

    /**
     * Insertar cita completa con validaciones
     * @param {Object} citaData - Datos de la cita
     * @param {Object} db - Conexión a la base de datos
     * @returns {Promise<Object>} Cita creada
     */
    static async insertarCitaCompleta(citaData, db) {
        const cita = await db.query(`
            INSERT INTO citas (
                organizacion_id, codigo_cita, cliente_id, profesional_id, servicio_id,
                fecha_cita, hora_inicio, hora_fin, zona_horaria, precio_servicio,
                descuento, precio_final, estado, metodo_pago, pagado,
                notas_cliente, notas_internas, confirmacion_requerida,
                confirmada_por_cliente, recordatorio_enviado, creado_por,
                ip_origen, user_agent, origen_aplicacion, creado_en
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18,
                $19, $20, $21, $22, $23, $24, NOW()
            ) RETURNING *
        `, [
            citaData.organizacion_id, citaData.codigo_cita, citaData.cliente_id,
            citaData.profesional_id, citaData.servicio_id, citaData.fecha_cita,
            citaData.hora_inicio, citaData.hora_fin, citaData.zona_horaria,
            citaData.precio_servicio, citaData.descuento, citaData.precio_final,
            citaData.estado, citaData.metodo_pago, citaData.pagado,
            citaData.notas_cliente, citaData.notas_internas, citaData.confirmacion_requerida,
            citaData.confirmada_por_cliente, citaData.recordatorio_enviado,
            citaData.creado_por, citaData.ip_origen, citaData.user_agent,
            citaData.origen_aplicacion
        ]);

        return cita.rows[0];
    }

    /**
     * Marcar horario como ocupado y vincular a cita
     * @param {number} horarioId - ID del horario
     * @param {number} citaId - ID de la cita
     * @param {number} organizacionId - ID de la organización
     * @param {Object} db - Conexión a la base de datos
     */
    static async marcarHorarioOcupado(horarioId, citaId, organizacionId, db) {
        const resultado = await db.query(`
            UPDATE horarios_disponibilidad
            SET estado = 'ocupado',
                cita_id = $1,
                reservado_hasta = NULL,
                session_id = NULL,
                reservado_por = NULL,
                actualizado_en = NOW(),
                version = version + 1
            WHERE id = $2
              AND organizacion_id = $3
              AND estado IN ('disponible', 'reservado_temporal')
            RETURNING id, profesional_id, fecha, hora_inicio, hora_fin, estado
        `, [citaId, horarioId, organizacionId]);

        if (resultado.rows.length === 0) {
            logger.warn('[CitaHelpersModel.marcarHorarioOcupado] Horario no disponible o no existe', {
                horario_id: horarioId,
                cita_id: citaId,
                organizacion_id: organizacionId
            });
            throw new Error('El horario no está disponible o no pertenece a la organización');
        }

        logger.info('[CitaHelpersModel.marcarHorarioOcupado] Horario marcado como ocupado', {
            horario_id: horarioId,
            cita_id: citaId,
            profesional_id: resultado.rows[0].profesional_id,
            fecha: resultado.rows[0].fecha,
            hora: `${resultado.rows[0].hora_inicio}-${resultado.rows[0].hora_fin}`
        });

        return resultado.rows[0];
    }

    /**
     * Registrar evento de auditoría
     * @param {Object} evento - Datos del evento
     * @param {Object} db - Conexión a la base de datos
     */
    static async registrarEventoAuditoria(evento, db) {
        try {
            await db.query(`
                INSERT INTO eventos_sistema (
                    organizacion_id, tipo_evento, descripcion,
                    cita_id, usuario_id, metadatos, creado_en
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [
                evento.organizacion_id,
                evento.tipo_evento || 'cita_creada',
                evento.descripcion || 'Cita creada automáticamente por IA',
                evento.cita_id,
                evento.usuario_id || null,
                JSON.stringify(evento.metadatos || {})
            ]);
        } catch (error) {
            // No fallar si la auditoría falla
            logger.warn('[CitaHelpersModel.registrarEventoAuditoria] Error registrando evento', {
                error: error.message,
                evento
            });
        }
    }

    /**
     * Validar entidades relacionadas
     * @param {number} clienteId - ID del cliente
     * @param {number} profesionalId - ID del profesional
     * @param {number} servicioId - ID del servicio
     * @param {number} organizacionId - ID de la organización
     * @param {Object} db - Conexión a la base de datos
     * @returns {Promise<boolean>} Validación exitosa
     */
    static async validarEntidadesRelacionadas(clienteId, profesionalId, servicioId, organizacionId, db) {
        // Validar cliente
        const cliente = await db.query(
            'SELECT id FROM clientes WHERE id = $1 AND organizacion_id = $2 AND activo = true',
            [clienteId, organizacionId]
        );
        if (cliente.rows.length === 0) {
            throw new Error('Cliente no encontrado o inactivo');
        }

        // Validar profesional
        const profesional = await db.query(
            'SELECT id FROM profesionales WHERE id = $1 AND organizacion_id = $2 AND activo = true',
            [profesionalId, organizacionId]
        );
        if (profesional.rows.length === 0) {
            throw new Error('Profesional no encontrado o inactivo');
        }

        // Validar servicio
        const servicio = await db.query(
            'SELECT id FROM servicios WHERE id = $1 AND organizacion_id = $2 AND activo = true',
            [servicioId, organizacionId]
        );
        if (servicio.rows.length === 0) {
            throw new Error('Servicio no encontrado o inactivo');
        }

        // Validar que el profesional puede realizar el servicio
        const servicioprofesional = await db.query(
            'SELECT id FROM servicios_profesionales WHERE profesional_id = $1 AND servicio_id = $2',
            [profesionalId, servicioId]
        );
        if (servicioprofesional.rows.length === 0) {
            throw new Error('El profesional no está autorizado para realizar este servicio');
        }

        return true;
    }

    /**
     * Validar conflicto de horario
     * @param {number} profesionalId - ID del profesional
     * @param {string} fecha - Fecha de la cita
     * @param {string} horaInicio - Hora de inicio
     * @param {string} horaFin - Hora de fin
     * @param {number} citaIdExcluir - ID de cita a excluir (para updates)
     * @param {Object} db - Conexión a la base de datos
     * @returns {Promise<boolean>} Sin conflicto
     */
    static async validarConflictoHorario(profesionalId, fecha, horaInicio, horaFin, citaIdExcluir, db) {
        let query = `
            SELECT id FROM citas
            WHERE profesional_id = $1
                AND fecha_cita = $2
                AND estado NOT IN ('cancelada', 'no_asistio')
                AND (
                    (hora_inicio < $4 AND hora_fin > $3) OR
                    (hora_inicio < $3 AND hora_fin > $3) OR
                    (hora_inicio < $4 AND hora_fin > $4)
                )
        `;

        const params = [profesionalId, fecha, horaInicio, horaFin];

        if (citaIdExcluir) {
            query += ' AND id != $5';
            params.push(citaIdExcluir);
        }

        const conflictos = await db.query(query, params);

        if (conflictos.rows.length > 0) {
            throw new Error('Conflicto de horario: el profesional ya tiene una cita en ese horario');
        }

        return true;
    }
}

// Exportar constantes y clase
module.exports = {
    DEFAULTS,
    CitaHelpersModel
};