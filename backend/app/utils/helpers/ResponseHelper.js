/**
 * Helper para respuestas HTTP estandarizadas
 * @module utils/helpers/ResponseHelper
 */

class ResponseHelper {
  /**
   * Respuesta exitosa
   */
  static success(res, data = null, message = 'Operación exitosa', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de recurso creado (201)
   */
  static created(res, data = null, message = 'Recurso creado exitosamente') {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de error
   */
  static error(res, message = 'Error interno del servidor', statusCode = 500, dataOrErrors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (dataOrErrors) {
      if (dataOrErrors.valido !== undefined || dataOrErrors.token_enviado !== undefined) {
        response.data = dataOrErrors;
      } else {
        response.errors = dataOrErrors;
      }
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Respuesta de validación
   */
  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de no autorizado
   */
  static unauthorized(res, message = 'No autorizado') {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de prohibido
   */
  static forbidden(res, message = 'Acceso prohibido') {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de no encontrado
   */
  static notFound(res, message = 'Recurso no encontrado') {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta paginada
   * Soporta nomenclatura en inglés (page, limit, total) y español (paginaActual, elementosPorPagina, totalElementos)
   */
  static paginated(res, data, pagination, message = 'Datos obtenidos exitosamente') {
    // Normalizar nomenclatura (soportar español e inglés)
    const page = pagination.page ?? pagination.paginaActual ?? 1;
    const limit = pagination.limit ?? pagination.elementosPorPagina ?? 20;
    const total = pagination.total ?? pagination.totalElementos ?? 0;

    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ResponseHelper;
