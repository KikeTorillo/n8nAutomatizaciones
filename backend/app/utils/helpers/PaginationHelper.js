/**
 * Helper para paginación
 * @module utils/helpers/PaginationHelper
 */

class PaginationHelper {
  /**
   * Calcula offset y limit para paginación
   */
  static calculatePagination(page = 1, limit = 20) {
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
   * Genera información de paginación para respuesta
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
