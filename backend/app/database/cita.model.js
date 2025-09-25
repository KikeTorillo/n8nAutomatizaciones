/**
 * @fileoverview Modelo de Citas para sistema SaaS con integración IA
 * @description SÚPER CRÍTICO PARA IA - Maneja creación automática y gestión de citas
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const { getDb } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modelo Citas - COMPONENTE MÁS CRÍTICO DEL SISTEMA
 * Implementa todas las operaciones automáticas para IA n8n
 * @class CitaModel
 */
class CitaModel {

    /**
     * 🤖 SÚPER CRÍTICO PARA IA: Crear cita automáticamente desde webhook n8n
     * Esta función es LA MÁS IMPORTANTE del sistema - permite a la IA crear citas completas
     * @param {Object} datosIA - Datos procesados por IA conversacional
     * @param {string} datosIA.telefono_cliente - Teléfono del cliente (requerido)
     * @param {number} datosIA.organizacion_id - ID de la organización (requerido)
     * @param {number} datosIA.servicio_id - ID del servicio solicitado (requerido)
     * @param {string} [datosIA.fecha_solicitada] - 'mañana', 'pasado mañana', '2025-09-25'
     * @param {string} [datosIA.turno_preferido] - 'mañana', 'tarde', 'cualquiera'
     * @param {string} [datosIA.profesional_preferido] - Nombre del profesional (opcional)
     * @param {boolean} [datosIA.crear_cliente_si_no_existe] - Auto-crear cliente (default: true)
     * @param {string} [datosIA.nombre_cliente_nuevo] - Nombre si se crea cliente nuevo
     * @param {string} [datosIA.email_cliente_nuevo] - Email si se crea cliente nuevo
     * @param {Object} [datosIA.metadata] - Metadata adicional de la conversación IA
     * @returns {Promise<Object>} Cita creada completa con toda la información
     */
    static async crearAutomatica(datosIA) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', datosIA.organizacion_id.toString()]);

            logger.info('[CitaModel.crearAutomatica] Iniciando creación automática', {
                telefono: datosIA.telefono_cliente,
                organizacion_id: datosIA.organizacion_id,
                servicio_id: datosIA.servicio_id,
                fecha_solicitada: datosIA.fecha_solicitada,
                turno: datosIA.turno_preferido
            });

            // PASO 1: Buscar o crear cliente
            let cliente = await this.buscarOCrearCliente(datosIA, db);

            // PASO 2: Obtener información del servicio
            const servicio = await this.obtenerServicioCompleto(datosIA.servicio_id, datosIA.organizacion_id, db);
            if (!servicio) {
                throw new Error('Servicio no encontrado o inactivo');
            }

            // PASO 3: Buscar horario compatible disponible
            const horarioDisponible = await this.buscarHorarioCompatible({
                organizacion_id: datosIA.organizacion_id,
                servicio_id: datosIA.servicio_id,
                fecha_solicitada: datosIA.fecha_solicitada || 'mañana',
                turno_preferido: datosIA.turno_preferido || 'cualquiera',
                profesional_preferido: datosIA.profesional_preferido,
                duracion_minutos: servicio.duracion_minutos
            }, db);

            if (!horarioDisponible) {
                throw new Error('No hay horarios disponibles para la fecha y condiciones solicitadas');
            }

            // PASO 4: Generar código único de cita
            const codigoCita = await this.generarCodigoCita(datosIA.organizacion_id, db);

            // PASO 5: Crear la cita con transacción atómica
            const citaCreada = await this.insertarCitaCompleta({
                organizacion_id: datosIA.organizacion_id,
                codigo_cita: codigoCita,
                cliente_id: cliente.id,
                profesional_id: horarioDisponible.profesional_id,
                servicio_id: datosIA.servicio_id,
                fecha_cita: horarioDisponible.fecha,
                hora_inicio: horarioDisponible.hora_inicio,
                hora_fin: horarioDisponible.hora_fin,
                zona_horaria: 'America/Mexico_City', // TODO: obtener de organización
                precio_servicio: servicio.precio,
                precio_final: servicio.precio, // Sin descuentos por ahora
                estado: 'confirmada',
                origen_cita: 'ia_automatica',
                notas_cliente: `Cita creada por IA. Teléfono: ${datosIA.telefono_cliente}`,
                metadata_ia: datosIA.metadata || {},
                creado_por: 'sistema_ia'
            }, db);

            // PASO 6: Marcar horario como ocupado
            await this.marcarHorarioOcupado(horarioDisponible.horario_id, citaCreada.id, db);

            // PASO 7: Registrar en auditoría del sistema
            await this.registrarEventoAuditoria({
                organizacion_id: datosIA.organizacion_id,
                evento_tipo: 'cita_creada_ia',
                entidad_tipo: 'cita',
                entidad_id: citaCreada.id,
                descripcion: 'Cita creada automáticamente por IA conversacional',
                metadatos: {
                    telefono_cliente: datosIA.telefono_cliente,
                    servicio_nombre: servicio.nombre,
                    precio: servicio.precio,
                    profesional_nombre: horarioDisponible.profesional_nombre,
                    fecha_hora: `${horarioDisponible.fecha} ${horarioDisponible.hora_inicio}`,
                    origen: 'webhook_n8n',
                    cliente_nuevo: cliente.creado_automaticamente || false
                },
                usuario_id: cliente.id
            }, db);

            await db.query('COMMIT');

            // Preparar respuesta completa para IA
            const respuestaCompleta = {
                exito: true,
                cita: {
                    id: citaCreada.id,
                    codigo: codigoCita,
                    fecha: horarioDisponible.fecha,
                    hora_inicio: horarioDisponible.hora_inicio,
                    hora_fin: horarioDisponible.hora_fin,
                    duracion_minutos: servicio.duracion_minutos,
                    estado: 'confirmada',
                    precio: servicio.precio
                },
                cliente: {
                    id: cliente.id,
                    nombre: cliente.nombre,
                    telefono: cliente.telefono,
                    email: cliente.email,
                    es_nuevo: cliente.creado_automaticamente || false
                },
                profesional: {
                    id: horarioDisponible.profesional_id,
                    nombre: horarioDisponible.profesional_nombre,
                    tipo: horarioDisponible.tipo_profesional
                },
                servicio: {
                    id: servicio.id,
                    nombre: servicio.nombre,
                    categoria: servicio.categoria,
                    duracion_minutos: servicio.duracion_minutos,
                    precio: servicio.precio
                },
                mensaje_confirmacion: `✅ Cita ${codigoCita} confirmada para ${horarioDisponible.fecha} a las ${horarioDisponible.hora_inicio}. ¡Te esperamos!`,
                instrucciones_cliente: [
                    'Llega 5 minutos antes de tu cita',
                    'Si necesitas cancelar, avísanos con al menos 2 horas de anticipación',
                    'Trae una identificación oficial'
                ]
            };

            logger.info('[CitaModel.crearAutomatica] Cita creada exitosamente', {
                codigo_cita: codigoCita,
                cliente_id: cliente.id,
                profesional_id: horarioDisponible.profesional_id,
                servicio_id: datosIA.servicio_id,
                fecha_hora: `${horarioDisponible.fecha} ${horarioDisponible.hora_inicio}`,
                precio: servicio.precio
            });

            return respuestaCompleta;

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[CitaModel.crearAutomatica] Error:', {
                error: error.message,
                stack: error.stack,
                datos_ia: datosIA
            });
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * 🤖 CRÍTICO PARA IA: Buscar citas existentes por teléfono
     * @param {string} telefono - Teléfono del cliente
     * @param {number} organizacionId - ID de la organización
     * @param {Array<string>} [estados] - Estados de citas a buscar
     * @param {boolean} [incluir_historicas] - Incluir citas pasadas
     * @returns {Promise<Array>} Lista de citas encontradas
     */
    static async buscarPorTelefono(telefono, organizacionId, estados = ['confirmada', 'pendiente'], incluir_historicas = false) {
        const db = await getDb();

        try {
            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const fechaCondicion = incluir_historicas ? '' : 'AND c.fecha_cita >= CURRENT_DATE';

            const query = `
                SELECT
                    c.id, c.codigo_cita, c.fecha_cita, c.hora_inicio, c.hora_fin,
                    c.zona_horaria, c.estado, c.precio_final, c.notas_cliente,
                    c.confirmacion_requerida, c.confirmada_por_cliente,
                    cl.nombre as cliente_nombre,
                    cl.telefono as cliente_telefono,
                    cl.email as cliente_email,
                    p.nombre_completo as profesional_nombre,
                    p.tipo_profesional,
                    s.nombre as servicio_nombre,
                    s.categoria as servicio_categoria,
                    s.duracion_minutos,
                    o.nombre_comercial as organizacion_nombre,
                    -- Calcular tiempo hasta la cita
                    CASE
                        WHEN c.fecha_cita = CURRENT_DATE THEN
                            EXTRACT(EPOCH FROM (c.fecha_cita + c.hora_inicio - NOW())) / 60
                        ELSE
                            EXTRACT(EPOCH FROM (c.fecha_cita + c.hora_inicio - NOW())) / (60 * 24)
                    END as minutos_hasta_cita,
                    -- Mensaje para IA
                    'Cita ' || c.codigo_cita || ' para ' ||
                    TO_CHAR(c.fecha_cita, 'DD/MM/YYYY') || ' a las ' ||
                    TO_CHAR(c.hora_inicio, 'HH12:MI AM') || ' - ' || s.nombre ||
                    ' con ' || p.nombre_completo ||
                    CASE WHEN c.estado = 'confirmada' THEN ' (Confirmada)' ELSE ' (Pendiente)' END as mensaje_ia
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN profesionales p ON c.profesional_id = p.id
                JOIN servicios s ON c.servicio_id = s.id
                JOIN organizaciones o ON c.organizacion_id = o.id
                WHERE cl.telefono = $1
                  AND c.organizacion_id = $2
                  AND c.estado = ANY($3)
                  ${fechaCondicion}
                ORDER BY c.fecha_cita DESC, c.hora_inicio DESC
                LIMIT 10
            `;

            const result = await db.query(query, [telefono, organizacionId, estados]);

            // Enriquecer resultados para IA
            const citasEnriquecidas = result.rows.map(cita => ({
                ...cita,
                tiempo_relativo: this.calcularTiempoRelativo(cita.minutos_hasta_cita),
                puede_cancelar: this.puedeCancelar(cita.fecha_cita, cita.hora_inicio),
                puede_modificar: this.puedeModificar(cita.fecha_cita, cita.hora_inicio, cita.estado),
                requiere_confirmacion: cita.confirmacion_requerida && !cita.confirmada_por_cliente
            }));

            logger.info('[CitaModel.buscarPorTelefono] Búsqueda completada', {
                telefono: telefono,
                organizacion_id: organizacionId,
                citas_encontradas: citasEnriquecidas.length,
                estados_buscados: estados
            });

            return citasEnriquecidas;

        } catch (error) {
            logger.error('[CitaModel.buscarPorTelefono] Error:', {
                error: error.message,
                telefono: telefono,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * 🤖 CRÍTICO PARA IA: Modificar cita automáticamente
     * @param {string} codigoCita - Código de la cita a modificar
     * @param {Object} cambios - Cambios solicitados por IA
     * @param {string} [cambios.nueva_fecha] - Nueva fecha 'mañana', '2025-09-25'
     * @param {string} [cambios.nuevo_turno] - Nuevo turno 'mañana', 'tarde'
     * @param {number} [cambios.nuevo_servicio_id] - Cambio de servicio
     * @param {string} [cambios.motivo] - Motivo del cambio
     * @param {number} organizacionId - ID de la organización
     * @returns {Promise<Object>} Cita modificada con confirmación
     */
    static async modificarAutomatica(codigoCita, cambios, organizacionId) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            logger.info('[CitaModel.modificarAutomatica] Iniciando modificación', {
                codigo_cita: codigoCita,
                cambios: cambios,
                organizacion_id: organizacionId
            });

            // PASO 1: Obtener cita actual con lock para evitar concurrencia
            const citaActual = await this.obtenerCitaParaModificar(codigoCita, organizacionId, db);
            if (!citaActual) {
                throw new Error('Cita no encontrada o no puede ser modificada');
            }

            // PASO 2: Validar que se pueda modificar
            if (!this.puedeModificar(citaActual.fecha_cita, citaActual.hora_inicio, citaActual.estado)) {
                throw new Error('La cita no puede ser modificada (muy próxima o estado no permite cambios)');
            }

            // PASO 3: Buscar nuevo horario si hay cambio de fecha/hora
            let nuevoHorario = null;
            if (cambios.nueva_fecha || cambios.nuevo_turno) {
                const servicioId = cambios.nuevo_servicio_id || citaActual.servicio_id;

                nuevoHorario = await this.buscarHorarioCompatible({
                    organizacion_id: organizacionId,
                    servicio_id: servicioId,
                    fecha_solicitada: cambios.nueva_fecha || 'mañana',
                    turno_preferido: cambios.nuevo_turno || 'cualquiera',
                    excluir_profesional: null, // Permitir cambio de profesional
                    duracion_minutos: citaActual.duracion_minutos
                }, db);

                if (!nuevoHorario) {
                    throw new Error('No hay horarios disponibles para la nueva fecha solicitada');
                }
            }

            // PASO 4: Liberar horario anterior
            await this.liberarHorarioAnterior(citaActual.horario_disponibilidad_id, db);

            // PASO 5: Actualizar la cita
            const datosActualizacion = {
                ...(nuevoHorario && {
                    profesional_id: nuevoHorario.profesional_id,
                    fecha_cita: nuevoHorario.fecha,
                    hora_inicio: nuevoHorario.hora_inicio,
                    hora_fin: nuevoHorario.hora_fin
                }),
                ...(cambios.nuevo_servicio_id && {
                    servicio_id: cambios.nuevo_servicio_id
                }),
                notas_internas: `${citaActual.notas_internas || ''}\n[${new Date().toISOString()}] Modificada por IA: ${cambios.motivo || 'Sin motivo especificado'}`,
                actualizado_en: new Date()
            };

            const citaActualizada = await this.actualizarCita(citaActual.id, datosActualizacion, db);

            // PASO 6: Marcar nuevo horario como ocupado
            if (nuevoHorario) {
                await this.marcarHorarioOcupado(nuevoHorario.horario_id, citaActualizada.id, db);
            }

            // PASO 7: Registrar cambio en auditoría
            await this.registrarEventoAuditoria({
                organizacion_id: organizacionId,
                evento_tipo: 'cita_modificada_ia',
                entidad_tipo: 'cita',
                entidad_id: citaActualizada.id,
                descripcion: 'Cita modificada automáticamente por IA',
                metadatos: {
                    codigo_cita: codigoCita,
                    cambios_solicitados: cambios,
                    fecha_anterior: citaActual.fecha_cita,
                    fecha_nueva: nuevoHorario?.fecha,
                    profesional_anterior: citaActual.profesional_nombre,
                    profesional_nuevo: nuevoHorario?.profesional_nombre,
                    motivo: cambios.motivo
                },
                usuario_id: citaActual.cliente_id
            }, db);

            await db.query('COMMIT');

            // Preparar respuesta para IA
            const respuesta = {
                exito: true,
                cita_modificada: {
                    codigo: codigoCita,
                    fecha_anterior: citaActual.fecha_cita,
                    fecha_nueva: nuevoHorario?.fecha || citaActual.fecha_cita,
                    hora_anterior: citaActual.hora_inicio,
                    hora_nueva: nuevoHorario?.hora_inicio || citaActual.hora_inicio,
                    profesional_anterior: citaActual.profesional_nombre,
                    profesional_nuevo: nuevoHorario?.profesional_nombre || citaActual.profesional_nombre,
                    servicio_nombre: citaActualizada.servicio_nombre,
                    estado: citaActualizada.estado
                },
                mensaje_confirmacion: `✅ Cita ${codigoCita} modificada exitosamente. ${
                    nuevoHorario
                        ? `Nueva fecha: ${nuevoHorario.fecha} a las ${nuevoHorario.hora_inicio} con ${nuevoHorario.profesional_nombre}`
                        : 'Otros cambios aplicados correctamente'
                }`
            };

            logger.info('[CitaModel.modificarAutomatica] Modificación completada', {
                codigo_cita: codigoCita,
                cambios_aplicados: Object.keys(cambios),
                nueva_fecha: nuevoHorario?.fecha,
                nuevo_profesional: nuevoHorario?.profesional_id
            });

            return respuesta;

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[CitaModel.modificarAutomatica] Error:', {
                error: error.message,
                codigo_cita: codigoCita,
                cambios: cambios,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    }

    /**
     * 🤖 CRÍTICO PARA IA: Cancelar cita automáticamente
     * @param {string} codigoCita - Código de la cita a cancelar
     * @param {number} organizacionId - ID de la organización
     * @param {string} [motivo] - Motivo de cancelación
     * @param {boolean} [notificar] - Si notificar al cliente y profesional
     * @returns {Promise<Object>} Confirmación de cancelación
     */
    static async cancelarAutomatica(codigoCita, organizacionId, motivo = 'Cancelada por cliente', notificar = true) {
        const db = await getDb();

        try {
            await db.query('BEGIN');

            // Configurar contexto RLS
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            // Obtener cita actual
            const citaActual = await this.obtenerCitaParaCancelar(codigoCita, organizacionId, db);
            if (!citaActual) {
                throw new Error('Cita no encontrada o ya fue cancelada');
            }

            // Validar que se pueda cancelar
            if (!this.puedeCancelar(citaActual.fecha_cita, citaActual.hora_inicio)) {
                throw new Error('La cita no puede ser cancelada (muy próxima al horario)');
            }

            // Actualizar estado de la cita
            const citaCancelada = await this.actualizarCita(citaActual.id, {
                estado: 'cancelada',
                estado_anterior: citaActual.estado,
                motivo_cancelacion: motivo,
                notas_internas: `${citaActual.notas_internas || ''}\n[${new Date().toISOString()}] Cancelada por IA: ${motivo}`,
                actualizado_en: new Date()
            }, db);

            // Liberar horario
            await this.liberarHorarioAnterior(citaActual.horario_disponibilidad_id, db);

            // Registrar en auditoría
            await this.registrarEventoAuditoria({
                organizacion_id: organizacionId,
                evento_tipo: 'cita_cancelada_ia',
                entidad_tipo: 'cita',
                entidad_id: citaActual.id,
                descripcion: 'Cita cancelada automáticamente por IA',
                metadatos: {
                    codigo_cita: codigoCita,
                    motivo: motivo,
                    fecha_cita: citaActual.fecha_cita,
                    hora_inicio: citaActual.hora_inicio,
                    profesional_nombre: citaActual.profesional_nombre,
                    servicio_nombre: citaActual.servicio_nombre,
                    precio_liberado: citaActual.precio_final
                },
                usuario_id: citaActual.cliente_id
            }, db);

            await db.query('COMMIT');

            logger.info('[CitaModel.cancelarAutomatica] Cita cancelada exitosamente', {
                codigo_cita: codigoCita,
                motivo: motivo,
                fecha_cita: citaActual.fecha_cita,
                profesional_id: citaActual.profesional_id
            });

            return {
                exito: true,
                cita_cancelada: {
                    codigo: codigoCita,
                    fecha: citaActual.fecha_cita,
                    hora_inicio: citaActual.hora_inicio,
                    profesional: citaActual.profesional_nombre,
                    servicio: citaActual.servicio_nombre,
                    motivo: motivo,
                    estado: 'cancelada'
                },
                mensaje_confirmacion: `✅ Cita ${codigoCita} cancelada correctamente. El horario ya está disponible para otros clientes.`
            };

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[CitaModel.cancelarAutomatica] Error:', {
                error: error.message,
                codigo_cita: codigoCita,
                motivo: motivo,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    }

    // ==========================================
    // FUNCIONES AUXILIARES PRIVADAS
    // ==========================================

    /**
     * Buscar o crear cliente automáticamente
     * @private
     */
    static async buscarOCrearCliente(datosIA, db) {
        const ClienteModel = require('./cliente.model');

        // Intentar buscar cliente existente
        const busquedaCliente = await ClienteModel.buscarPorTelefono(
            datosIA.telefono_cliente,
            datosIA.organizacion_id,
            {
                exacto: false,
                incluir_inactivos: false,
                crear_si_no_existe: false
            }
        );

        if (busquedaCliente.encontrado && busquedaCliente.cliente) {
            return busquedaCliente.cliente;
        }

        // Crear cliente nuevo si está permitido
        if (datosIA.crear_cliente_si_no_existe !== false) {
            const nuevoCliente = await ClienteModel.crear({
                organizacion_id: datosIA.organizacion_id,
                nombre: datosIA.nombre_cliente_nuevo || `Cliente ${datosIA.telefono_cliente.slice(-4)}`,
                telefono: datosIA.telefono_cliente,
                email: datosIA.email_cliente_nuevo || null,
                notas_especiales: `Cliente creado automáticamente por IA desde teléfono ${datosIA.telefono_cliente}`,
                como_conocio: 'automatico_ia',
                activo: true,
                marketing_permitido: false
            });

            return { ...nuevoCliente, creado_automaticamente: true };
        }

        throw new Error('Cliente no encontrado y creación automática deshabilitada');
    }

    /**
     * Obtener información completa del servicio
     * @private
     */
    static async obtenerServicioCompleto(servicioId, organizacionId, db) {
        const query = `
            SELECT s.*, COUNT(sp.profesional_id) as profesionales_asignados
            FROM servicios s
            LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id AND sp.activo = true
            WHERE s.id = $1 AND s.organizacion_id = $2 AND s.activo = true
            GROUP BY s.id
        `;
        const result = await db.query(query, [servicioId, organizacionId]);
        return result.rows[0] || null;
    }

    /**
     * Buscar horario compatible disponible
     * @private
     */
    static async buscarHorarioCompatible(criterios, db) {
        const HorarioModel = require('./horario.model');

        // Convertir fecha de lenguaje natural a fecha concreta
        let fecha_sql;
        const fecha = criterios.fecha_solicitada.toLowerCase();

        if (fecha === 'hoy') {
            fecha_sql = new Date().toISOString().split('T')[0];
        } else if (fecha === 'mañana') {
            const mañana = new Date();
            mañana.setDate(mañana.getDate() + 1);
            fecha_sql = mañana.toISOString().split('T')[0];
        } else if (fecha === 'pasado mañana') {
            const pasadoMañana = new Date();
            pasadoMañana.setDate(pasadoMañana.getDate() + 2);
            fecha_sql = pasadoMañana.toISOString().split('T')[0];
        } else if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
            fecha_sql = fecha;
        } else {
            // Parsear fecha en lenguaje natural (implementación básica)
            fecha_sql = new Date().toISOString().split('T')[0];
        }

        // Construir filtros de turno
        let hora_inicio_filtro = null;
        let hora_fin_filtro = null;

        if (criterios.turno_preferido === 'mañana') {
            hora_inicio_filtro = '06:00';
            hora_fin_filtro = '12:00';
        } else if (criterios.turno_preferido === 'tarde') {
            hora_inicio_filtro = '12:00';
            hora_fin_filtro = '20:00';
        }

        const query = `
            SELECT
                hd.id as horario_id,
                hd.profesional_id,
                hd.fecha_hora_inicio,
                hd.fecha_hora_fin,
                hd.duracion_minutos,
                DATE(hd.fecha_hora_inicio) as fecha,
                TO_CHAR(hd.fecha_hora_inicio, 'HH24:MI') as hora_inicio,
                TO_CHAR(hd.fecha_hora_fin, 'HH24:MI') as hora_fin,
                p.nombre_completo as profesional_nombre,
                p.tipo_profesional
            FROM horarios_disponibilidad hd
            JOIN profesionales p ON hd.profesional_id = p.id
            JOIN servicios_profesionales sp ON p.id = sp.profesional_id
            WHERE hd.organizacion_id = $1
              AND hd.estado = 'disponible'
              AND sp.servicio_id = $2
              AND sp.activo = true
              AND p.activo = true
              AND p.disponible_online = true
              AND DATE(hd.fecha_hora_inicio) = $3
              AND hd.duracion_minutos >= $4
              AND NOT EXISTS (
                  SELECT 1 FROM citas c
                  WHERE c.profesional_id = hd.profesional_id
                    AND c.estado IN ('confirmada', 'en_progreso')
                    AND c.fecha_cita = DATE(hd.fecha_hora_inicio)
                    AND (
                        (c.hora_inicio <= TO_CHAR(hd.fecha_hora_inicio, 'HH24:MI')::time AND c.hora_fin > TO_CHAR(hd.fecha_hora_inicio, 'HH24:MI')::time)
                        OR (c.hora_inicio < TO_CHAR(hd.fecha_hora_fin, 'HH24:MI')::time AND c.hora_fin >= TO_CHAR(hd.fecha_hora_fin, 'HH24:MI')::time)
                        OR (c.hora_inicio >= TO_CHAR(hd.fecha_hora_inicio, 'HH24:MI')::time AND c.hora_fin <= TO_CHAR(hd.fecha_hora_fin, 'HH24:MI')::time)
                    )
              )
              ${hora_inicio_filtro ? `AND TO_CHAR(hd.fecha_hora_inicio, 'HH24:MI')::time >= '${hora_inicio_filtro}'::time` : ''}
              ${hora_fin_filtro ? `AND TO_CHAR(hd.fecha_hora_inicio, 'HH24:MI')::time <= '${hora_fin_filtro}'::time` : ''}
            ORDER BY hd.fecha_hora_inicio ASC
            LIMIT 1
        `;

        const result = await db.query(query, [
            criterios.organizacion_id,
            criterios.servicio_id,
            fecha_sql,
            criterios.duracion_minutos || 30
        ]);

        return result.rows[0] || null;
    }

    /**
     * Generar código único de cita
     * @private
     */
    static async generarCodigoCita(organizacionId, db) {
        // Obtener prefijo de la organización
        const orgQuery = `
            SELECT codigo_tenant, tipo_industria
            FROM organizaciones
            WHERE id = $1
        `;
        const orgResult = await db.query(orgQuery, [organizacionId]);

        let prefijo = 'CITA';
        if (orgResult.rows[0]) {
            switch (orgResult.rows[0].tipo_industria) {
                case 'barberia': prefijo = 'BARB'; break;
                case 'salon_belleza': prefijo = 'SALON'; break;
                case 'spa': prefijo = 'SPA'; break;
                case 'consultorio_medico': prefijo = 'MED'; break;
                default: prefijo = 'CITA';
            }
        }

        // Obtener siguiente número
        const countQuery = `
            SELECT COUNT(*) + 1 as siguiente
            FROM citas
            WHERE organizacion_id = $1
              AND DATE(creado_en) = CURRENT_DATE
        `;
        const countResult = await db.query(countQuery, [organizacionId]);
        const numero = countResult.rows[0].siguiente;

        return `${prefijo}${numero.toString().padStart(3, '0')}`;
    }

    /**
     * Insertar cita completa en base de datos
     * @private
     */
    static async insertarCitaCompleta(citaData, db) {
        const query = `
            INSERT INTO citas (
                organizacion_id, codigo_cita, cliente_id, profesional_id, servicio_id,
                fecha_cita, hora_inicio, hora_fin, zona_horaria, estado,
                precio_servicio, precio_final, origen_cita, notas_cliente,
                creado_por, actualizado_en
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
            ) RETURNING *
        `;

        const result = await db.query(query, [
            citaData.organizacion_id, citaData.codigo_cita, citaData.cliente_id,
            citaData.profesional_id, citaData.servicio_id, citaData.fecha_cita,
            citaData.hora_inicio, citaData.hora_fin, citaData.zona_horaria,
            citaData.estado, citaData.precio_servicio, citaData.precio_final,
            citaData.origen_cita, citaData.notas_cliente, citaData.creado_por
        ]);

        return result.rows[0];
    }

    /**
     * Marcar horario como ocupado
     * @private
     */
    static async marcarHorarioOcupado(horarioId, citaId, db) {
        const query = `
            UPDATE horarios_disponibilidad
            SET estado = 'ocupado',
                cita_id = $1,
                actualizado_en = NOW()
            WHERE id = $2
        `;
        await db.query(query, [citaId, horarioId]);
    }

    /**
     * Registrar evento en auditoría
     * @private
     */
    static async registrarEventoAuditoria(evento, db) {
        try {
            const query = `
                INSERT INTO eventos_sistema (
                    organizacion_id, evento_tipo, entidad_tipo, entidad_id,
                    descripcion, metadatos, usuario_id, creado_en
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `;

            await db.query(query, [
                evento.organizacion_id, evento.evento_tipo, evento.entidad_tipo,
                evento.entidad_id, evento.descripcion, JSON.stringify(evento.metadatos),
                evento.usuario_id
            ]);
        } catch (auditError) {
            // No fallar por errores de auditoría
            logger.warn('[CitaModel] Error registrando auditoría:', auditError.message);
        }
    }

    /**
     * Obtener cita para modificar con lock
     * @private
     */
    static async obtenerCitaParaModificar(codigoCita, organizacionId, db) {
        const query = `
            SELECT c.*,
                   hd.id as horario_disponibilidad_id,
                   s.duracion_minutos,
                   s.nombre as servicio_nombre,
                   p.nombre_completo as profesional_nombre
            FROM citas c
            JOIN servicios s ON c.servicio_id = s.id
            JOIN profesionales p ON c.profesional_id = p.id
            LEFT JOIN horarios_disponibilidad hd ON hd.cita_id = c.id
            WHERE c.codigo_cita = $1
              AND c.organizacion_id = $2
              AND c.estado IN ('confirmada', 'pendiente')
            FOR UPDATE
        `;
        const result = await db.query(query, [codigoCita, organizacionId]);
        return result.rows[0] || null;
    }

    /**
     * Obtener cita para cancelar
     * @private
     */
    static async obtenerCitaParaCancelar(codigoCita, organizacionId, db) {
        const query = `
            SELECT c.*,
                   hd.id as horario_disponibilidad_id,
                   s.nombre as servicio_nombre,
                   p.nombre_completo as profesional_nombre
            FROM citas c
            JOIN servicios s ON c.servicio_id = s.id
            JOIN profesionales p ON c.profesional_id = p.id
            LEFT JOIN horarios_disponibilidad hd ON hd.cita_id = c.id
            WHERE c.codigo_cita = $1
              AND c.organizacion_id = $2
              AND c.estado != 'cancelada'
        `;
        const result = await db.query(query, [codigoCita, organizacionId]);
        return result.rows[0] || null;
    }

    /**
     * Actualizar datos de una cita
     * @private
     */
    static async actualizarCita(citaId, datosActualizacion, db) {
        const campos = Object.keys(datosActualizacion);
        const valores = Object.values(datosActualizacion);
        const setClauses = campos.map((campo, index) => `${campo} = $${index + 2}`);

        const query = `
            UPDATE citas
            SET ${setClauses.join(', ')}
            WHERE id = $1
            RETURNING *
        `;

        const result = await db.query(query, [citaId, ...valores]);
        return result.rows[0];
    }

    /**
     * Liberar horario anterior
     * @private
     */
    static async liberarHorarioAnterior(horarioId, db) {
        if (!horarioId) return;

        const query = `
            UPDATE horarios_disponibilidad
            SET estado = 'disponible',
                cita_id = NULL,
                reservado_hasta = NULL,
                actualizado_en = NOW()
            WHERE id = $1
        `;
        await db.query(query, [horarioId]);
    }

    /**
     * Calcular tiempo relativo para IA
     * @private
     */
    static calcularTiempoRelativo(minutosHastaCita) {
        if (minutosHastaCita < 0) return 'Ya pasó';
        if (minutosHastaCita < 60) return `En ${Math.round(minutosHastaCita)} minutos`;
        if (minutosHastaCita < 1440) return `En ${Math.round(minutosHastaCita / 60)} horas`;
        return `En ${Math.round(minutosHastaCita / 1440)} días`;
    }

    /**
     * Verificar si se puede cancelar
     * @private
     */
    static puedeCancelar(fechaCita, horaInicio) {
        const ahora = new Date();
        const fechaHoraCita = new Date(`${fechaCita}T${horaInicio}`);
        const horasHastaCita = (fechaHoraCita - ahora) / (1000 * 60 * 60);
        return horasHastaCita >= 2; // Mínimo 2 horas de anticipación
    }

    /**
     * Verificar si se puede modificar
     * @private
     */
    static puedeModificar(fechaCita, horaInicio, estado) {
        if (!['confirmada', 'pendiente'].includes(estado)) return false;
        return this.puedeCancelar(fechaCita, horaInicio); // Misma lógica que cancelar
    }
}

module.exports = CitaModel;