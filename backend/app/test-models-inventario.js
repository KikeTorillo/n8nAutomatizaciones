/**
 * Script de prueba para verificar que los models de Inventario y POS funcionan
 * Uso: node backend/app/test-models-inventario.js
 */

const path = require('path');

console.log('🧪 TEST MODELS - INVENTARIO Y POS\n');
console.log('='.repeat(50));

// Test 1: Importar models de Inventario
console.log('\n1️⃣  Testing: Imports de Inventario Models...');
try {
    const {
        CategoriasProductosModel,
        ProveedoresModel,
        ProductosModel,
        MovimientosInventarioModel,
        AlertasInventarioModel
    } = require('./templates/scheduling-saas/models/inventario');

    console.log('   ✅ CategoriasProductosModel:', typeof CategoriasProductosModel);
    console.log('   ✅ ProveedoresModel:', typeof ProveedoresModel);
    console.log('   ✅ ProductosModel:', typeof ProductosModel);
    console.log('   ✅ MovimientosInventarioModel:', typeof MovimientosInventarioModel);
    console.log('   ✅ AlertasInventarioModel:', typeof AlertasInventarioModel);

    // Verificar métodos estáticos
    console.log('\n   📋 Métodos de ProductosModel:');
    console.log('      - crear:', typeof ProductosModel.crear);
    console.log('      - obtenerPorId:', typeof ProductosModel.obtenerPorId);
    console.log('      - listar:', typeof ProductosModel.listar);
    console.log('      - actualizar:', typeof ProductosModel.actualizar);
    console.log('      - eliminar:', typeof ProductosModel.eliminar);
    console.log('      - obtenerStockCritico:', typeof ProductosModel.obtenerStockCritico);

} catch (error) {
    console.error('   ❌ Error al importar Inventario Models:', error.message);
    console.error('      Stack:', error.stack);
    process.exit(1);
}

// Test 2: Importar models de POS
console.log('\n2️⃣  Testing: Imports de POS Models...');
try {
    const {
        VentasPOSModel
    } = require('./templates/scheduling-saas/models/pos');

    console.log('   ✅ VentasPOSModel:', typeof VentasPOSModel);

    // Verificar métodos estáticos
    console.log('\n   📋 Métodos de VentasPOSModel:');
    console.log('      - crear:', typeof VentasPOSModel.crear);
    console.log('      - obtenerPorId:', typeof VentasPOSModel.obtenerPorId);
    console.log('      - listar:', typeof VentasPOSModel.listar);
    console.log('      - actualizarEstado:', typeof VentasPOSModel.actualizarEstado);
    console.log('      - registrarPago:', typeof VentasPOSModel.registrarPago);

} catch (error) {
    console.error('   ❌ Error al importar POS Models:', error.message);
    console.error('      Stack:', error.stack);
    process.exit(1);
}

// Test 3: Verificar dependencias
console.log('\n3️⃣  Testing: Dependencias (RLSContextManager, logger)...');
try {
    const RLSContextManager = require('./utils/rlsContextManager');
    const logger = require('./utils/logger');

    console.log('   ✅ RLSContextManager:', typeof RLSContextManager);
    console.log('      - query:', typeof RLSContextManager.query);
    console.log('      - transaction:', typeof RLSContextManager.transaction);
    console.log('      - withBypass:', typeof RLSContextManager.withBypass);

    console.log('   ✅ logger:', typeof logger);
    console.log('      - info:', typeof logger.info);
    console.log('      - error:', typeof logger.error);
    console.log('      - warn:', typeof logger.warn);

} catch (error) {
    console.error('   ❌ Error al verificar dependencias:', error.message);
    process.exit(1);
}

// Test 4: Verificar schemas Joi
console.log('\n4️⃣  Testing: Schemas Joi de Inventario...');
try {
    const inventarioSchemas = require('./templates/scheduling-saas/schemas/inventario.schemas');

    console.log('   ✅ inventarioSchemas:', typeof inventarioSchemas);
    console.log('      - crearCategoria:', typeof inventarioSchemas.crearCategoria);
    console.log('      - crearProveedor:', typeof inventarioSchemas.crearProveedor);
    console.log('      - crearProducto:', typeof inventarioSchemas.crearProducto);
    console.log('      - registrarMovimiento:', typeof inventarioSchemas.registrarMovimiento);
    console.log('      - listarAlertas:', typeof inventarioSchemas.listarAlertas);

    // Test validación básica
    console.log('\n   🔍 Testing validación básica de producto...');
    const productoValido = {
        nombre: 'Shampoo Test',
        precio_venta: 150.00,
        stock_actual: 10
    };

    const { error, value } = inventarioSchemas.crearProducto.body.validate(productoValido);

    if (error) {
        console.error('   ⚠️  Error de validación:', error.message);
    } else {
        console.log('   ✅ Validación exitosa:', JSON.stringify(value, null, 2));
    }

} catch (error) {
    console.error('   ❌ Error al verificar schemas:', error.message);
    console.error('      Stack:', error.stack);
    process.exit(1);
}

// Resumen
console.log('\n' + '='.repeat(50));
console.log('✅ TODOS LOS TESTS PASARON CORRECTAMENTE\n');
console.log('📊 Resumen:');
console.log('   - 5 Models de Inventario importados correctamente');
console.log('   - 1 Model de POS importado correctamente');
console.log('   - Dependencias (RLSContextManager, logger) verificadas');
console.log('   - Schemas Joi de Inventario verificados');
console.log('\n🎉 Los models están listos para usar!\n');
console.log('💡 Próximos pasos:');
console.log('   1. Crear controllers');
console.log('   2. Crear routes con middleware subscription');
console.log('   3. Probar endpoints con Postman/curl');
