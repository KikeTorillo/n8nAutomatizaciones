/**
 * Exportación centralizada de todos los models de Inventario
 */

const CategoriasProductosModel = require('./categorias.model');
const ProveedoresModel = require('./proveedores.model');
const ProductosModel = require('./productos.model');
const MovimientosInventarioModel = require('./movimientos.model');
const AlertasInventarioModel = require('./alertas.model');
const ReportesInventarioModel = require('./reportes.model');
const OrdenesCompraModel = require('./ordenes-compra.model');
const UbicacionesAlmacenModel = require('./ubicaciones.model');
const SnapshotsModel = require('./snapshots.model');
const ConteosModel = require('./conteos.model');
const AjustesMasivosModel = require('./ajustes-masivos.model');

module.exports = {
    CategoriasProductosModel,
    ProveedoresModel,
    ProductosModel,
    MovimientosInventarioModel,
    AlertasInventarioModel,
    ReportesInventarioModel,
    OrdenesCompraModel,
    UbicacionesAlmacenModel,
    SnapshotsModel,
    ConteosModel,
    AjustesMasivosModel
};
