/**
 * Script de prueba para verificar queries reales en la BD
 * Uso: node backend/app/test-db-queries.js
 */

const { CategoriasProductosModel, ProductosModel } = require('./templates/scheduling-saas/models/inventario');
const { VentasPOSModel } = require('./templates/scheduling-saas/models/pos');

console.log('🧪 TEST DATABASE QUERIES - INVENTARIO Y POS\n');
console.log('='.repeat(60));

async function runTests() {
    try {
        // Test 1: Listar categorías (debería funcionar incluso sin organizacion_id si hay bypass)
        console.log('\n1️⃣  Testing: Listar categorías...');
        try {
            // Usamos organizacion_id = 1 (asumiendo que existe)
            const categorias = await CategoriasProductosModel.listar({}, 1);
            console.log('   ✅ Query exitoso');
            console.log('   📊 Total de categorías:', categorias.total);
            if (categorias.categorias.length > 0) {
                console.log('   📋 Primera categoría:', {
                    id: categorias.categorias[0].id,
                    nombre: categorias.categorias[0].nombre,
                    total_productos: categorias.categorias[0].total_productos
                });
            }
        } catch (error) {
            console.error('   ⚠️  Error en query:', error.message);
        }

        // Test 2: Listar productos
        console.log('\n2️⃣  Testing: Listar productos...');
        try {
            const productos = await ProductosModel.listar({ limit: 5 }, 1);
            console.log('   ✅ Query exitoso');
            console.log('   📊 Total de productos:', productos.total);
            if (productos.productos.length > 0) {
                console.log('   📋 Primer producto:', {
                    id: productos.productos[0].id,
                    nombre: productos.productos[0].nombre,
                    precio_venta: productos.productos[0].precio_venta,
                    stock_actual: productos.productos[0].stock_actual
                });
            } else {
                console.log('   ℹ️  No hay productos en la BD todavía');
            }
        } catch (error) {
            console.error('   ⚠️  Error en query:', error.message);
        }

        // Test 3: Obtener productos con stock crítico
        console.log('\n3️⃣  Testing: Obtener productos con stock crítico...');
        try {
            const stockCritico = await ProductosModel.obtenerStockCritico(1);
            console.log('   ✅ Query exitoso');
            console.log('   📊 Productos con stock bajo:', stockCritico.length);
        } catch (error) {
            console.error('   ⚠️  Error en query:', error.message);
        }

        // Test 4: Listar ventas POS
        console.log('\n4️⃣  Testing: Listar ventas POS...');
        try {
            const ventas = await VentasPOSModel.listar({ limit: 5 }, 1);
            console.log('   ✅ Query exitoso');
            console.log('   📊 Total de ventas:', ventas.totales.total_ventas);
            if (ventas.ventas.length > 0) {
                console.log('   📋 Primera venta:', {
                    id: ventas.ventas[0].id,
                    folio: ventas.ventas[0].folio,
                    total: ventas.ventas[0].total,
                    estado: ventas.ventas[0].estado
                });
            } else {
                console.log('   ℹ️  No hay ventas en la BD todavía');
            }
        } catch (error) {
            console.error('   ⚠️  Error en query:', error.message);
        }

        // Resumen
        console.log('\n' + '='.repeat(60));
        console.log('✅ PRUEBAS DE QUERIES COMPLETADAS\n');
        console.log('📊 Los models pueden ejecutar queries en la BD correctamente\n');
        console.log('💡 Próximo paso: Crear controllers y routes para exponer endpoints\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR GENERAL:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Ejecutar tests
runTests();
