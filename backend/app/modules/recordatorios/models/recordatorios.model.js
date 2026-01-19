/**
 * ====================================================================
 * MODELO: RECORDATORIOS
 * ====================================================================
 *
 * Gestiona las operaciones de base de datos para el sistema de
 * recordatorios automáticos de citas.
 *
 * TABLAS:
 * - configuracion_recordatorios: Config por organización
 * - historial_recordatorios: Registro de envíos
 *
 * @module modules/recordatorios/models/recordatorios.model
 */

const RLSContextManager = require('../../../utils/rlsContextManager');
const { ErrorHelper } = require('../../../utils/helpers');

class RecordatoriosModel {

  // ====================================================================
  // CONFIGURACIÓN DE RECORDATORIOS
  // ====================================================================

  /**
   * Obtener configuración de recordatorios de una organización
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object|null>} Configuración o null si no existe
   */
  static async obtenerConfiguracion(organizacionId) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const query = `
        SELECT
          id,
          organizacion_id,
          habilitado,
          recordatorio_1_horas,
          recordatorio_1_activo,
          recordatorio_2_horas,
          recordatorio_2_activo,
          plantilla_mensaje,
          hora_inicio,
          hora_fin,
          max_reintentos,
          config_avanzada,
          creado_en,
          actualizado_en
        FROM configuracion_recordatorios
        WHERE organizacion_id = $1
      `;

      const result = await db.query(query, [organizacionId]);
      return result.rows[0] || null;
    });
  }

  /**
   * Actualizar configuración de recordatorios
   * @param {number} organizacionId - ID de la organización
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Configuración actualizada
   */
  static async actualizarConfiguracion(organizacionId, datos) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const campos = [];
      const valores = [];
      let idx = 1;

      // Campos actualizables
      const camposPermitidos = [
        'habilitado',
        'recordatorio_1_horas',
        'recordatorio_1_activo',
        'recordatorio_2_horas',
        'recordatorio_2_activo',
        'plantilla_mensaje',
        'hora_inicio',
        'hora_fin',
        'max_reintentos',
        'config_avanzada'
      ];

      for (const campo of camposPermitidos) {
        if (datos[campo] !== undefined) {
          campos.push(`${campo} = $${idx}`);
          valores.push(datos[campo]);
          idx++;
        }
      }

      if (campos.length === 0) {
        ErrorHelper.throwValidation('No hay campos válidos para actualizar');
      }

      valores.push(organizacionId);

      const query = `
        UPDATE configuracion_recordatorios
        SET ${campos.join(', ')}, actualizado_en = NOW()
        WHERE organizacion_id = $${idx}
        RETURNING *
      `;

      const result = await db.query(query, valores);
      return result.rows[0];
    });
  }

  /**
   * Crear configuración por defecto si no existe
   * @param {number} organizacionId - ID de la organización
   * @returns {Promise<Object>} Configuración creada o existente
   */
  static async crearConfiguracionDefault(organizacionId) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const query = `
        INSERT INTO configuracion_recordatorios (organizacion_id)
        VALUES ($1)
        ON CONFLICT (organizacion_id) DO UPDATE
        SET actualizado_en = NOW()
        RETURNING *
      `;

      const result = await db.query(query, [organizacionId]);
      return result.rows[0];
    });
  }

  // ====================================================================
  // HISTORIAL DE RECORDATORIOS
  // ====================================================================

  /**
   * Registrar un recordatorio enviado
   * @param {Object} datos - Datos del recordatorio
   * @returns {Promise<Object>} Registro creado
   */
  static async registrarEnvio(datos) {
    return await RLSContextManager.query(datos.organizacion_id, async (db) => {
      const query = `
        INSERT INTO historial_recordatorios (
          organizacion_id,
          cita_id,
          numero_recordatorio,
          canal,
          sender,
          mensaje_enviado,
          estado,
          programado_para,
          enviado_en,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        datos.organizacion_id,
        datos.cita_id,
        datos.numero_recordatorio || 1,
        datos.canal,
        datos.sender,
        datos.mensaje_enviado,
        datos.estado || 'enviado',
        datos.programado_para,
        datos.enviado_en || new Date(),
        datos.metadata || {}
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    });
  }

  /**
   * Actualizar estado de un recordatorio
   * @param {number} organizacionId - ID de la organización
   * @param {number} recordatorioId - ID del recordatorio
   * @param {Object} datos - Datos a actualizar (estado, error_mensaje, respuesta_cliente, etc.)
   * @returns {Promise<Object>} Registro actualizado
   */
  static async actualizarEstado(organizacionId, recordatorioId, datos) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const campos = [];
      const valores = [];
      let idx = 1;

      const camposPermitidos = [
        'estado',
        'error_mensaje',
        'intento_numero',
        'respuesta_cliente',
        'fecha_respuesta',
        'enviado_en',
        'metadata'
      ];

      for (const campo of camposPermitidos) {
        if (datos[campo] !== undefined) {
          campos.push(`${campo} = $${idx}`);
          valores.push(datos[campo]);
          idx++;
        }
      }

      if (campos.length === 0) {
        ErrorHelper.throwValidation('No hay campos válidos para actualizar');
      }

      valores.push(recordatorioId);

      const query = `
        UPDATE historial_recordatorios
        SET ${campos.join(', ')}
        WHERE id = $${idx}
        RETURNING *
      `;

      const result = await db.query(query, valores);
      return result.rows[0];
    });
  }

  /**
   * Obtener historial de recordatorios de una cita
   * @param {number} organizacionId - ID de la organización
   * @param {number} citaId - ID de la cita
   * @returns {Promise<Array>} Lista de recordatorios
   */
  static async obtenerPorCita(organizacionId, citaId) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const query = `
        SELECT *
        FROM historial_recordatorios
        WHERE cita_id = $1
        ORDER BY creado_en DESC
      `;

      const result = await db.query(query, [citaId]);
      return result.rows;
    });
  }

  /**
   * Obtener estadísticas de recordatorios
   * @param {number} organizacionId - ID de la organización
   * @param {Object} filtros - Filtros opcionales (fecha_desde, fecha_hasta)
   * @returns {Promise<Object>} Estadísticas
   */
  static async obtenerEstadisticas(organizacionId, filtros = {}) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const where = ['organizacion_id = $1'];
      const values = [organizacionId];
      let idx = 2;

      if (filtros.fecha_desde) {
        where.push(`creado_en >= $${idx}`);
        values.push(filtros.fecha_desde);
        idx++;
      }

      if (filtros.fecha_hasta) {
        where.push(`creado_en <= $${idx}`);
        values.push(filtros.fecha_hasta);
        idx++;
      }

      const query = `
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE estado = 'enviado') as enviados,
          COUNT(*) FILTER (WHERE estado = 'fallido') as fallidos,
          COUNT(*) FILTER (WHERE estado = 'confirmado') as confirmados,
          COUNT(*) FILTER (WHERE estado = 'reagendado') as reagendados,
          COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
          ROUND(
            100.0 * COUNT(*) FILTER (WHERE estado = 'confirmado') /
            NULLIF(COUNT(*) FILTER (WHERE estado IN ('enviado', 'confirmado', 'reagendado')), 0),
            2
          ) as tasa_confirmacion
        FROM historial_recordatorios
        WHERE ${where.join(' AND ')}
      `;

      const result = await db.query(query, values);
      return result.rows[0];
    });
  }

  // ====================================================================
  // CONSULTAS PARA JOB DE PROCESAMIENTO
  // ====================================================================

  /**
   * Obtener citas que necesitan recordatorio
   * Esta consulta es usada por el job de procesamiento (cada 5 min)
   *
   * @param {number} limite - Máximo de recordatorios a procesar
   * @returns {Promise<Array>} Lista de citas con datos para envío
   */
  static async obtenerCitasPendientesRecordatorio(limite = 100) {
    // Usamos bypass porque esta consulta cruza múltiples organizaciones
    return await RLSContextManager.withBypass(async (db) => {
      const query = `
        SELECT
          c.id as cita_id,
          c.codigo_cita,
          c.fecha_cita,
          c.hora_inicio,
          c.precio_total,
          c.organizacion_id,
          cl.nombre as cliente_nombre,
          -- Usar campo correcto según plataforma
          CASE
            WHEN cc.plataforma = 'telegram' THEN cl.telegram_chat_id
            ELSE COALESCE(cl.whatsapp_phone, cl.telefono)
          END as cliente_telefono,
          cl.email as cliente_email,
          o.nombre_comercial as negocio_nombre,
          o.telefono as negocio_telefono,
          p.nombre_completo as profesional_nombre,
          cc.plataforma,
          cc.config_plataforma,
          cr.plantilla_mensaje,
          cr.recordatorio_1_horas,
          cr.recordatorio_2_horas,
          cr.max_reintentos,
          -- Calcular servicios
          (
            SELECT string_agg(s.nombre, ', ')
            FROM citas_servicios cs
            JOIN servicios s ON cs.servicio_id = s.id
            WHERE cs.cita_id = c.id
          ) as servicios_nombres
        FROM citas c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN organizaciones o ON c.organizacion_id = o.id
        JOIN profesionales p ON c.profesional_id = p.id
        JOIN chatbot_config cc ON c.organizacion_id = cc.organizacion_id
        JOIN configuracion_recordatorios cr ON c.organizacion_id = cr.organizacion_id
        WHERE c.estado IN ('pendiente', 'confirmada')
          AND c.recordatorio_enviado = FALSE
          -- Cita es en el futuro
          AND c.fecha_cita + c.hora_inicio > NOW()
          -- Tiempo para recordatorio 1 (default 24h)
          AND c.fecha_cita + c.hora_inicio - (cr.recordatorio_1_horas || ' hours')::INTERVAL <= NOW()
          -- Chatbot activo y no eliminado
          AND cc.activo = TRUE
          AND cc.deleted_at IS NULL
          -- Recordatorios habilitados
          AND cr.habilitado = TRUE
          AND cr.recordatorio_1_activo = TRUE
          -- Dentro de ventana horaria (hora local)
          AND CURRENT_TIME BETWEEN cr.hora_inicio AND cr.hora_fin
          -- Cliente tiene contacto según plataforma
          AND (
            (cc.plataforma = 'telegram' AND cl.telegram_chat_id IS NOT NULL AND cl.telegram_chat_id != '')
            OR (cc.plataforma = 'whatsapp' AND COALESCE(cl.whatsapp_phone, cl.telefono) IS NOT NULL AND COALESCE(cl.whatsapp_phone, cl.telefono) != '')
          )
        ORDER BY c.fecha_cita ASC, c.hora_inicio ASC
        LIMIT $1
      `;

      const result = await db.query(query, [limite]);
      return result.rows;
    });
  }

  /**
   * Obtener recordatorios fallidos para reintento
   * @param {number} limite - Máximo de reintentos a procesar
   * @returns {Promise<Array>} Lista de recordatorios para reintentar
   */
  static async obtenerRecordatoriosFallidos(limite = 50) {
    return await RLSContextManager.withBypass(async (db) => {
      const query = `
        SELECT
          hr.*,
          cr.max_reintentos
        FROM historial_recordatorios hr
        JOIN configuracion_recordatorios cr ON hr.organizacion_id = cr.organizacion_id
        WHERE hr.estado = 'fallido'
          AND hr.intento_numero < cr.max_reintentos
          -- Esperar al menos 5 minutos entre reintentos
          AND hr.creado_en < NOW() - INTERVAL '5 minutes'
        ORDER BY hr.programado_para ASC
        LIMIT $1
      `;

      const result = await db.query(query, [limite]);
      return result.rows;
    });
  }

  /**
   * Marcar cita como recordatorio enviado
   * @param {number} organizacionId - ID de la organización
   * @param {number} citaId - ID de la cita
   * @returns {Promise<Object>} Cita actualizada
   */
  static async marcarCitaRecordatorioEnviado(organizacionId, citaId) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const query = `
        UPDATE citas
        SET
          recordatorio_enviado = TRUE,
          fecha_recordatorio = NOW()
        WHERE id = $1
        RETURNING id, codigo_cita, recordatorio_enviado, fecha_recordatorio
      `;

      const result = await db.query(query, [citaId]);
      return result.rows[0];
    });
  }

  /**
   * Marcar recordatorio como confirmado (cuando cliente responde)
   * @param {number} organizacionId - ID de la organización
   * @param {number} citaId - ID de la cita
   * @param {string} respuesta - Respuesta del cliente
   * @returns {Promise<Object>} Historial actualizado
   */
  static async marcarConfirmado(organizacionId, citaId, respuesta) {
    return await RLSContextManager.query(organizacionId, async (db) => {
      const query = `
        UPDATE historial_recordatorios
        SET
          estado = 'confirmado',
          respuesta_cliente = $2,
          fecha_respuesta = NOW()
        WHERE cita_id = $1
          AND estado = 'enviado'
        RETURNING *
      `;

      const result = await db.query(query, [citaId, respuesta]);
      return result.rows[0];
    });
  }
}

module.exports = RecordatoriosModel;
