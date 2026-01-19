/**
 * Helper para paginaci\u00f3n
 * @module utils/helpers/PaginationHelper
 *
 * @deprecated Este helper est\u00e1 DEPRECADO.
 * Usar ParseHelper.parsePagination() de '../helpers' en su lugar.
 *
 * @example
 * // ANTES (deprecado):
 * const { page, limit, offset } = PaginationHelper.calculatePagination(req.query.page, req.query.limit);
 *
 * // DESPU\u00c9S (recomendado):
 * const { ParseHelper } = require('../helpers');
 * const { page, limit, offset } = ParseHelper.parsePagination(req.query);
 */

const logger = require('../logger');

// Flag para evitar spam de warnings en logs
let deprecationWarningShown = false;

class PaginationHelper {
  /**
   * Calcula offset y limit para paginaci\u00f3n
   *
   * @deprecated Usar ParseHelper.parsePagination() en su lugar
   */
  static calculatePagination(page = 1, limit = 20) {
    if (!deprecationWarningShown) {
      logger.warn('[DEPRECATION] PaginationHelper.calculatePagination() est\u00e1 deprecado. ' +
        'Usar ParseHelper.parsePagination() en su lugar.');
      deprecationWarningShown = true;
    }

    const currentPage = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (currentPage - 1) * pageSize;

    return {
      page: currentPage,
      limit: pageSize,
      offset
    };
  }

  /**
   * Genera informaci\u00f3n de paginaci\u00f3n para respuesta
   *
   * @deprecated Usar ParseHelper.buildPaginationMeta() en su lugar (si existe)
   */
  static getPaginationInfo(page, limit, total) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    };
  }
}

module.exports = PaginationHelper;
