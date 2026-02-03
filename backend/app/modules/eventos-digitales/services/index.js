/**
 * ====================================================================
 * SERVICES - EVENTOS DIGITALES
 * ====================================================================
 * Barrel export de todos los servicios del módulo.
 *
 * Fecha creación: 3 Febrero 2026
 */

const qrService = require('./qr.service');
const calendarService = require('./calendar.service');

module.exports = {
    qrService,
    calendarService,
    // Re-exports directos para conveniencia
    ...qrService,
    ...calendarService
};
