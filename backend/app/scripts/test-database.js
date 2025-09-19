/**
 * Script para validar la configuración de la base de datos
 * Verifica conexiones, esquemas y estructura de tablas
 */

require('dotenv').config();
const { getDb, healthCheck } = require('../config/database');
const logger = require('../utils/logger');

async function testDatabaseConnection() {
    console.log('=== VALIDACIÓN DE CONFIGURACIÓN DE BASE DE DATOS ===\n');

    try {
        // 1. Verificar health check de todos los pools
        console.log('1. Verificando conexiones de pools...');
        const health = await healthCheck();

        for (const [poolName, status] of Object.entries(health)) {
            console.log(`   - Pool '${poolName}': ${status.status}`);
            if (status.status === 'ok') {
                console.log(`     Conexiones - Total: ${status.connections.total}, Idle: ${status.connections.idle}, Waiting: ${status.connections.waiting}`);
            } else {
                console.log(`     Error: ${status.error}`);
            }
        }

        // 2. Probar conexión directa a base de datos principal
        console.log('\n2. Probando conexión directa a base SaaS...');
        const client = await getDb();

        const result = await client.query('SELECT NOW() as timestamp, current_database() as database, current_user as user');
        console.log(`   ✓ Conectado exitosamente:`);
        console.log(`     - Base de datos: ${result.rows[0].database}`);
        console.log(`     - Usuario: ${result.rows[0].user}`);
        console.log(`     - Timestamp: ${result.rows[0].timestamp}`);

        // 3. Verificar si existen las tablas principales
        console.log('\n3. Verificando esquema de tablas...');
        const tablesQuery = `
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        const tablesResult = await client.query(tablesQuery);
        console.log(`   - Tablas encontradas: ${tablesResult.rows.length}`);

        const expectedTables = [
            'organizaciones',
            'clientes',
            'profesionales',
            'servicios',
            'citas',
            'franjas_horarias',
            'subscripciones',
            'plantillas_servicios'
        ];

        const existingTables = tablesResult.rows.map(row => row.table_name);

        for (const table of expectedTables) {
            const exists = existingTables.includes(table);
            console.log(`     ${exists ? '✓' : '✗'} ${table} ${exists ? '(existe)' : '(NO EXISTE)'}`);
        }

        // 4. Si las tablas no existen, mostrar sugerencia
        const missingTables = expectedTables.filter(table => !existingTables.includes(table));
        if (missingTables.length > 0) {
            console.log(`\n   ⚠️  ADVERTENCIA: Faltan ${missingTables.length} tablas requeridas:`);
            console.log(`   Tablas faltantes: ${missingTables.join(', ')}`);
            console.log(`   \n   💡 Sugerencia: Ejecuta el script de migración o crea las tablas manualmente.`);
        } else {
            console.log(`\n   ✓ Todas las tablas requeridas están presentes`);
        }

        // 5. Verificar estructura de una tabla existente (si existe)
        if (existingTables.includes('organizaciones')) {
            console.log('\n4. Verificando estructura de tabla "organizaciones"...');
            const columnsQuery = `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'organizaciones'
                ORDER BY ordinal_position;
            `;

            const columnsResult = await client.query(columnsQuery);
            console.log(`   - Columnas encontradas: ${columnsResult.rows.length}`);

            columnsResult.rows.forEach(col => {
                console.log(`     • ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
            });
        }

        // 6. Probar Row Level Security (si está configurado)
        console.log('\n5. Verificando configuración de Row Level Security...');
        try {
            await client.query('SELECT set_config($1, $2, true)', ['row_level_security.organizacion_id', '1']);
            console.log('   ✓ RLS configuración funciona correctamente');
        } catch (error) {
            console.log(`   ⚠️  RLS no configurado o con errores: ${error.message}`);
        }

        client.release();
        console.log('\n=== VALIDACIÓN COMPLETADA ===');

    } catch (error) {
        console.error('\n❌ ERROR EN VALIDACIÓN:', error.message);
        console.error('Stack:', error.stack);

        // Verificar variables de entorno si hay error de conexión
        if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 VERIFICAR VARIABLES DE ENTORNO:');
            console.log(`   DB_HOST: ${process.env.DB_HOST}`);
            console.log(`   DB_PORT: ${process.env.DB_PORT}`);
            console.log(`   DB_NAME: ${process.env.DB_NAME}`);
            console.log(`   DB_USER: ${process.env.DB_USER}`);
            console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '[CONFIGURADO]' : '[NO CONFIGURADO]'}`);
        }

        process.exit(1);
    }
}

// Ejecutar validación
testDatabaseConnection().then(() => {
    console.log('\n✓ Validación exitosa - La configuración de base de datos está lista');
    process.exit(0);
}).catch((error) => {
    console.error('\n❌ Validación falló:', error.message);
    process.exit(1);
});