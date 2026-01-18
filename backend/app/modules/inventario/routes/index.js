/**
 * ====================================================================
 * ROUTES - INVENTARIO (INDEX)
 * ====================================================================
 *
 * Agregador de rutas del modulo de inventario.
 * Cada dominio tiene su propio archivo de rutas.
 */

const express = require('express');
const router = express.Router();

// Importar rutas por dominio
const categoriasRoutes = require('./categorias.routes');
const proveedoresRoutes = require('./proveedores.routes');
const productosRoutes = require('./productos.routes');
const movimientosRoutes = require('./movimientos.routes');
const alertasRoutes = require('./alertas.routes');
const reportesRoutes = require('./reportes.routes');
const ordenesCompraRoutes = require('./ordenes-compra.routes');
const landedCostsRoutes = require('./landed-costs.routes');
const reservasRoutes = require('./reservas.routes');
const ubicacionesRoutes = require('./ubicaciones.routes');
const valoracionRoutes = require('./valoracion.routes');
const numerosSerieRoutes = require('./numeros-serie.routes');
const rutasOperacionRoutes = require('./rutas-operacion.routes');
const atributosRoutes = require('./atributos.routes');
const variantesRoutes = require('./variantes.routes');
const snapshotsRoutes = require('./snapshots.routes');
const conteosRoutes = require('./conteos.routes');
const ajustesMasivosRoutes = require('./ajustes-masivos.routes');
const reordenRoutes = require('./reorden.routes');
const dropshipRoutes = require('./dropship.routes');
const operacionesAlmacenRoutes = require('./operaciones-almacen.routes');
const batchPickingRoutes = require('./batch-picking.routes');
const configuracionAlmacenRoutes = require('./configuracion-almacen.routes');
const paquetesRoutes = require('./paquetes.routes');
const consignaRoutes = require('./consigna.routes');
const combosRoutes = require('./combos.routes');

// Montar rutas
router.use(categoriasRoutes);
router.use(proveedoresRoutes);
router.use(productosRoutes);
router.use(movimientosRoutes);
router.use(alertasRoutes);
router.use(reportesRoutes);
router.use(ordenesCompraRoutes);
router.use(landedCostsRoutes);
router.use(reservasRoutes);
router.use(ubicacionesRoutes);
router.use(valoracionRoutes);
router.use(numerosSerieRoutes);
router.use(rutasOperacionRoutes);
router.use(atributosRoutes);
router.use(variantesRoutes);
router.use(snapshotsRoutes);
router.use(conteosRoutes);
router.use(ajustesMasivosRoutes);
router.use(reordenRoutes);
router.use(dropshipRoutes);
router.use(operacionesAlmacenRoutes);
router.use(batchPickingRoutes);
router.use(configuracionAlmacenRoutes);
router.use(paquetesRoutes);
router.use(consignaRoutes);
router.use(combosRoutes);

module.exports = router;
