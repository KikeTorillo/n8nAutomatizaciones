/**
 * Agregador de schemas - Inventario
 * Mantiene backward compatibility con imports existentes
 * @module inventario/schemas
 */

// Importar todos los módulos de schemas
const sharedSchemas = require('./shared.schemas');
const categoriasSchemas = require('./categorias.schemas');
const proveedoresSchemas = require('./proveedores.schemas');
const productosSchemas = require('./productos.schemas');
const movimientosSchemas = require('./movimientos.schemas');
const alertasSchemas = require('./alertas.schemas');
const reportesSchemas = require('./reportes.schemas');
const ordenesCompraSchemas = require('./ordenes-compra.schemas');
const reservasSchemas = require('./reservas.schemas');
const ubicacionesSchemas = require('./ubicaciones.schemas');
const conteosSchemas = require('./conteos.schemas');
const ajustesMasivosSchemas = require('./ajustes-masivos.schemas');
const reordenSchemas = require('./reorden.schemas');
const landedCostsSchemas = require('./landed-costs.schemas');
const dropshipSchemas = require('./dropship.schemas');
const paquetesSchemas = require('./paquetes.schemas');
const consignaSchemas = require('./consigna.schemas');

// Schemas existentes de atributos y variantes (formato diferente - schemas directos sin body/params/query)
const variantesSchemas = require('./variantes.schemas');

// Backward compatibility: objeto único con todos los schemas
const inventarioSchemas = {
    ...sharedSchemas,
    ...categoriasSchemas,
    ...proveedoresSchemas,
    ...productosSchemas,
    ...movimientosSchemas,
    ...alertasSchemas,
    ...reportesSchemas,
    ...ordenesCompraSchemas,
    ...reservasSchemas,
    ...ubicacionesSchemas,
    ...conteosSchemas,
    ...ajustesMasivosSchemas,
    ...reordenSchemas,
    ...landedCostsSchemas,
    ...dropshipSchemas,
    ...paquetesSchemas,
    ...consignaSchemas
};

// Exportar objeto único para backward compatibility
module.exports = inventarioSchemas;

// También exportar módulos individuales para imports específicos
module.exports.sharedSchemas = sharedSchemas;
module.exports.categoriasSchemas = categoriasSchemas;
module.exports.proveedoresSchemas = proveedoresSchemas;
module.exports.productosSchemas = productosSchemas;
module.exports.movimientosSchemas = movimientosSchemas;
module.exports.alertasSchemas = alertasSchemas;
module.exports.reportesSchemas = reportesSchemas;
module.exports.ordenesCompraSchemas = ordenesCompraSchemas;
module.exports.reservasSchemas = reservasSchemas;
module.exports.ubicacionesSchemas = ubicacionesSchemas;
module.exports.conteosSchemas = conteosSchemas;
module.exports.ajustesMasivosSchemas = ajustesMasivosSchemas;
module.exports.reordenSchemas = reordenSchemas;
module.exports.landedCostsSchemas = landedCostsSchemas;
module.exports.dropshipSchemas = dropshipSchemas;
module.exports.paquetesSchemas = paquetesSchemas;
module.exports.consignaSchemas = consignaSchemas;

// Schemas de atributos y variantes (formato diferente)
module.exports.variantesSchemas = variantesSchemas;

// Exportar schema compartido de precio-moneda para uso externo
module.exports.precioMonedaSchema = sharedSchemas.precioMonedaSchema;
