/**
 * ====================================================================
 * TOOL: VERIFICAR DISPONIBILIDAD
 * ====================================================================
 *
 * Herramienta MCP para verificar horarios disponibles en una fecha específica.
 * ✅ FEATURE: Soporta múltiples servicios (1-10 servicios)
 * ✅ BACKWARD COMPATIBLE: Acepta servicio_id (singular) o servicios_ids (array)
 *
 * Llamada al backend:
 * 1. GET /api/v1/servicios/:id (validar TODOS los servicios)
 * 2. GET /api/v1/disponibilidad (buscar slots con duración total)
 */

const Joi = require('joi');
const { createApiClient } = require('../utils/apiClient');
const logger = require('../utils/logger');

/**
 * Schema de validación de inputs
 */
const inputSchema = {
  type: 'object',
  properties: {
    servicios_ids: {
      type: 'array',
      description: 'Array de IDs de servicios a consultar (1-10 servicios)',
      items: {
        type: 'number',
      },
      minItems: 1,
      maxItems: 10,
    },
    servicio_id: {
      type: 'number',
      description: 'ID del servicio a consultar (DEPRECATED: usar servicios_ids)',
    },
    fecha: {
      type: 'string',
      description: 'Fecha a consultar en formato DD/MM/YYYY',
      pattern: '^\\d{2}/\\d{2}/\\d{4}$',
    },
    profesional_id: {
      type: 'number',
      description: 'ID del profesional a consultar (opcional, si no se especifica busca en todos)',
    },
    hora: {
      type: 'string',
      description: 'Hora específica a consultar en formato HH:MM (opcional)',
      pattern: '^\\d{2}:\\d{2}$',
    },
    duracion: {
      type: 'number',
      description: 'Duración en minutos (opcional, se calcula automáticamente si se proporcionan servicios_ids)',
    },
  },
  required: ['fecha'],
};

/**
 * Schema Joi para validación estricta
 */
const joiSchema = Joi.object({
  // ✅ Nuevo: Array de servicios (1-10 servicios)
  servicios_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(10)
    .optional()
    .messages({
      'array.min': 'Debes proporcionar al menos 1 servicio',
      'array.max': 'No puedes consultar más de 10 servicios',
    }),
  // ⚠️ DEPRECATED: Mantener backward compatibility
  servicio_id: Joi.number().integer().positive().optional(),
  fecha: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/).required()
    .messages({
      'string.pattern.base': 'fecha debe tener formato DD/MM/YYYY',
    }),
  profesional_id: Joi.number().integer().positive().optional(),
  hora: Joi.string().pattern(/^\d{2}:\d{2}$/).optional()
    .messages({
      'string.pattern.base': 'hora debe tener formato HH:MM',
    }),
  duracion: Joi.number().integer().min(10).max(480).optional(),
})
  // Validar que al menos uno de los dos campos esté presente
  .or('servicios_ids', 'servicio_id')
  .messages({
    'object.missing': 'Debes proporcionar servicios_ids (recomendado) o servicio_id',
  });

/**
 * Función principal de ejecución
 * @param {Object} args - Argumentos de la tool
 * @param {string} jwtToken - Token JWT del chatbot para autenticación
 */
async function execute(args, jwtToken) {
  try {
    if (!jwtToken) {
      return {
        success: false,
        message: 'Token JWT no proporcionado',
        data: null,
      };
    }

    // ========== 1. Validar inputs ==========
    const { error, value } = joiSchema.validate(args);

    if (error) {
      logger.warn('Validación fallida en verificarDisponibilidad:', error.details);
      return {
        success: false,
        message: `Error de validación: ${error.details[0].message}`,
        data: null,
      };
    }

    // ========== 2. Normalizar servicios (backward compatibility) ==========
    let serviciosIds = [];
    if (value.servicios_ids && Array.isArray(value.servicios_ids)) {
      serviciosIds = value.servicios_ids;
    } else if (value.servicio_id) {
      // Backward compatibility: convertir servicio_id a array
      serviciosIds = [value.servicio_id];
      logger.warn('[verificarDisponibilidad] ⚠️ DEPRECATED: servicio_id usado en lugar de servicios_ids', {
        servicio_id: value.servicio_id
      });
    }

    logger.info('[verificarDisponibilidad] Consultando disponibilidad para múltiples servicios', {
      cantidad_servicios: serviciosIds.length,
      servicios_ids: serviciosIds,
      fecha: value.fecha
    });

    // ========== 3. Crear cliente API con token del chatbot ==========
    const apiClient = createApiClient(jwtToken);

    // ========== 4. VALIDAR TODOS LOS SERVICIOS y calcular duración total ==========
    let duracionTotalMinutos = 0;
    const serviciosData = [];

    try {
      // Validar y obtener información de TODOS los servicios
      for (const servicioId of serviciosIds) {
        const servicio = await apiClient.get(`/api/v1/servicios/${servicioId}`);
        const servicioInfo = servicio.data.data;

        duracionTotalMinutos += servicioInfo.duracion_minutos || 0;
        serviciosData.push({
          id: servicioInfo.id,
          nombre: servicioInfo.nombre,
          duracion_minutos: servicioInfo.duracion_minutos,
          precio: servicioInfo.precio
        });

        logger.info(`✅ Servicio ${servicioId} validado: ${servicioInfo.nombre} (${servicioInfo.duracion_minutos}min)`);
      }

      logger.info(`✅ TODOS los servicios validados. Duración total: ${duracionTotalMinutos} minutos`, {
        cantidad: serviciosData.length,
        servicios: serviciosData.map(s => s.nombre).join(', ')
      });
    } catch (error) {
      logger.error('[verificarDisponibilidad] Error validando servicios:', error.response?.data || error.message);
      return {
        success: false,
        message: `Servicio no encontrado o inactivo. Por favor verifica los IDs de servicios proporcionados.`,
        data: null,
      };
    }

    // ========== 5. Convertir fecha DD/MM/YYYY a YYYY-MM-DD ==========
    const [dia, mes, anio] = value.fecha.split('/');
    const fechaISO = `${anio}-${mes}-${dia}`;

    // ========== 6. Preparar parámetros para backend ==========
    const params = {
      fecha: fechaISO,
      servicio_id: serviciosIds[0],      // ✅ Primer servicio (requerido por backend)
      duracion: value.duracion || duracionTotalMinutos,  // ✅ Duración total o manual
      solo_disponibles: true,            // Solo mostrar slots disponibles
    };

    // Agregar parámetros opcionales si se proporcionan
    if (value.profesional_id) {
      params.profesional_id = value.profesional_id;
    }

    if (value.hora) {
      params.hora = value.hora;
    }

    logger.info('Consultando disponibilidad con duración total:', {
      ...params,
      cantidad_servicios: serviciosIds.length,
      duracion_total_minutos: duracionTotalMinutos
    });

    // ========== 7. Llamar al endpoint de disponibilidad ==========
    const response = await apiClient.get('/api/v1/disponibilidad', {
      params,
    });

    const data = response.data.data;

    logger.info(`Disponibilidad obtenida para ${serviciosIds.length} servicio(s)`);

    // ========== 8. Si se especificó hora, buscar ese slot específico ==========
    if (value.hora) {
      const slotBuscado = this._buscarSlotEspecifico(
        data,
        value.hora,
        value.profesional_id
      );

      const mensajeServicios = serviciosIds.length > 1
        ? ` para ${serviciosIds.length} servicios (${duracionTotalMinutos} minutos)`
        : '';

      return {
        success: true,
        message: slotBuscado.disponible
          ? `Sí, hay disponibilidad el ${value.fecha} a las ${value.hora}${mensajeServicios}${slotBuscado.profesional ? ` con ${slotBuscado.profesional}` : ''}`
          : `No disponible: ${slotBuscado.razon}`,
        data: {
          disponible: slotBuscado.disponible,
          fecha: value.fecha,
          hora: value.hora,
          profesional: slotBuscado.profesional,
          profesional_id: slotBuscado.profesional_id,
          razon: slotBuscado.razon,
          // ✅ Información de múltiples servicios
          servicios_ids: serviciosIds,
          servicios: serviciosData.map(s => s.nombre).join(', '),
          cantidad_servicios: serviciosIds.length,
          duracion_total_minutos: duracionTotalMinutos,
        },
      };
    }

    // ========== 9. Si NO se especificó hora, retornar primeros N slots disponibles ==========
    if (data.disponibilidad_por_fecha.length === 0) {
      const mensajeServicios = serviciosIds.length > 1
        ? ` para ${serviciosIds.length} servicios (${duracionTotalMinutos} minutos)`
        : '';

      return {
        success: true,
        message: `No hay disponibilidad${mensajeServicios} para el ${value.fecha}`,
        data: {
          fecha: value.fecha,
          disponible: false,
          profesionales_disponibles: [],
          // ✅ Información de múltiples servicios
          servicios_ids: serviciosIds,
          servicios: serviciosData.map(s => s.nombre).join(', '),
          cantidad_servicios: serviciosIds.length,
          duracion_total_minutos: duracionTotalMinutos,
        },
      };
    }

    const fecha = data.disponibilidad_por_fecha[0];
    const profesionalesConSlots = fecha.profesionales.map((prof) => ({
      profesional_id: prof.profesional_id,
      nombre: prof.nombre,
      horarios_disponibles: prof.slots.slice(0, 5).map((s) => s.hora.substring(0, 5)), // Primeros 5 slots, HH:MM
      total_disponibles: prof.total_slots_disponibles,
    }));

    const mensajeServicios = serviciosIds.length > 1
      ? ` para ${serviciosIds.length} servicios (${duracionTotalMinutos} minutos)`
      : '';

    return {
      success: true,
      message: `Disponibilidad consultada${mensajeServicios} para ${value.fecha}. ${fecha.total_slots_disponibles_dia} slots disponibles.`,
      data: {
        fecha: value.fecha,
        disponible: fecha.total_slots_disponibles_dia > 0,
        profesionales_disponibles: profesionalesConSlots,
        total_slots: fecha.total_slots_disponibles_dia,
        // ✅ Información de múltiples servicios
        servicios_ids: serviciosIds,
        servicios: serviciosData.map(s => s.nombre).join(', '),
        cantidad_servicios: serviciosIds.length,
        duracion_total_minutos: duracionTotalMinutos,
      },
    };

  } catch (error) {
    logger.error('Error al verificar disponibilidad:', {
      message: error.message,
      response: error.response?.data,
    });

    // Manejar errores del backend
    if (error.response) {
      const { status, data } = error.response;

      if (status === 404) {
        const serviciosMensaje = args.servicios_ids
          ? `uno o más servicios en [${args.servicios_ids.join(', ')}]`
          : `servicio con ID ${args.servicio_id}`;
        return {
          success: false,
          message: `${serviciosMensaje} no encontrado`,
          data: null,
        };
      }

      if (status === 400) {
        return {
          success: false,
          message: `Error de validación: ${data.error || data.message}`,
          data: null,
        };
      }
    }

    // Error genérico
    return {
      success: false,
      message: `Error al verificar disponibilidad: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Buscar slot específico en la respuesta de disponibilidad
 */
function _buscarSlotEspecifico(disponibilidad, hora, profesionalId) {
  if (disponibilidad.disponibilidad_por_fecha.length === 0) {
    return {
      disponible: false,
      razon: 'No hay disponibilidad para esta fecha',
      profesional: null,
      profesional_id: null,
    };
  }

  const fecha = disponibilidad.disponibilidad_por_fecha[0];
  const horaConSegundos = hora.length === 5 ? `${hora}:00` : hora;

  if (profesionalId) {
    // Buscar en profesional específico
    const prof = fecha.profesionales.find((p) => p.profesional_id === profesionalId);

    if (!prof) {
      return {
        disponible: false,
        razon: 'Profesional no encontrado o no disponible',
        profesional: null,
        profesional_id: null,
      };
    }

    const slot = prof.slots.find((s) => s.hora === horaConSegundos);

    return {
      disponible: slot?.disponible || false,
      razon: slot?.razon_no_disponible || 'Horario no encontrado',
      profesional: prof.nombre,
      profesional_id: prof.profesional_id,
    };
  }

  // Buscar en cualquier profesional disponible
  for (const prof of fecha.profesionales) {
    const slot = prof.slots.find((s) => s.hora === horaConSegundos && s.disponible);
    if (slot) {
      return {
        disponible: true,
        razon: null,
        profesional: prof.nombre,
        profesional_id: prof.profesional_id,
      };
    }
  }

  return {
    disponible: false,
    razon: 'No hay profesionales disponibles en ese horario',
    profesional: null,
    profesional_id: null,
  };
}

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
  name: 'verificarDisponibilidad',
  description: 'Verifica los horarios disponibles para uno o múltiples servicios (1-10) en una fecha específica. Calcula automáticamente la duración total y busca slots continuos disponibles. Retorna lista de profesionales con horarios disponibles. Puedes consultar un horario específico o ver todos los disponibles. Soporta backward compatibility con servicio_id único.',
  inputSchema,
  execute,
  _buscarSlotEspecifico,
};
