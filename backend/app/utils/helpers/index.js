/**
 * Exportador central de Helpers
 * Mantiene backward compatibility con imports existentes
 *
 * @module utils/helpers
 */

// Helpers generales
const ResponseHelper = require('./ResponseHelper');
const ValidationHelper = require('./ValidationHelper');
const DateHelper = require('./DateHelper');
const CodeGenerator = require('./CodeGenerator');
const SanitizeHelper = require('./SanitizeHelper');
const PaginationHelper = require('./PaginationHelper');
const ErrorHelper = require('./ErrorHelper');
const OrganizacionHelper = require('./OrganizacionHelper');
const SecureRandom = require('./SecureRandom');
const ParseHelper = require('./ParseHelper');
const JSONHelper = require('./JSONHelper');
const RolHelper = require('./RolHelper');

// Helpers de dominio
const InventarioHelper = require('./InventarioHelper');
const POSHelper = require('./POSHelper');

module.exports = {
  // Helpers generales (backward compatibility)
  ResponseHelper,
  ValidationHelper,
  DateHelper,
  CodeGenerator,
  SanitizeHelper,
  PaginationHelper,
  ErrorHelper,
  OrganizacionHelper,
  SecureRandom,
  ParseHelper,
  JSONHelper,
  RolHelper,
  // Helpers de dominio
  InventarioHelper,
  POSHelper
};
