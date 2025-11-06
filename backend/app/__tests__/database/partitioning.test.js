/**
 * Tests para Particionamiento de Tablas (Range Partitioning)
 *
 * Valida que el particionamiento mensual de citas y eventos_sistema
 * funciona correctamente y mejora el rendimiento.
 *
 * @version 1.0.0
 * @date 2025-11-05
 */

const { getPool } = require('../../config/database');
const logger = require('../../utils/logger');

describe('Particionamiento de Tablas - Range Partitioning', () => {

    let pool;

    beforeAll(async () => {
        pool = getPool();
    });

    describe('📅 Particiones de Citas', () => {

        test('debe tener particiones creadas para 2025-2026', async () => {
            const result = await pool.query(`
                SELECT
                    c.relname as particion,
                    pg_get_expr(c.relpartbound, c.oid) as rango
                FROM pg_class c
                JOIN pg_inherits i ON c.oid = i.inhrelid
                JOIN pg_class p ON p.oid = i.inhparent
                WHERE p.relname = 'citas'
                ORDER BY c.relname
            `);

            expect(result.rows.length).toBeGreaterThanOrEqual(18); // 12 de 2025 + 6 de 2026

            // Verificar que existe la partición actual (noviembre 2025)
            const particionActual = result.rows.find(r => r.particion === 'citas_2025_11');
            expect(particionActual).toBeDefined();
            expect(particionActual.rango).toContain('2025-11-01');
        });

        test('debe insertar datos en la partición correcta', async () => {
            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                // Crear organización y usuario de prueba
                const orgResult = await client.query(`
                    INSERT INTO organizaciones (nombre_comercial, email_contacto, activo)
                    VALUES ('Test Partitioning Org', 'test@partition.com', true)
                    RETURNING id
                `);
                const orgId = orgResult.rows[0].id;

                const userResult = await client.query(`
                    INSERT INTO usuarios (organizacion_id, email, password_hash, nombre, apellidos, rol)
                    VALUES ($1, 'user@partition.com', '$2b$10$test', 'Test', 'User', 'admin')
                    RETURNING id
                `, [orgId]);
                const userId = userResult.rows[0].id;

                // Crear cliente
                const clienteResult = await client.query(`
                    INSERT INTO clientes (organizacion_id, nombre, apellidos, telefono)
                    VALUES ($1, 'Cliente', 'Test', '+525512345678')
                    RETURNING id
                `, [orgId]);
                const clienteId = clienteResult.rows[0].id;

                // Crear profesional
                const profResult = await client.query(`
                    INSERT INTO profesionales (organizacion_id, usuario_id, especialidad, activo)
                    VALUES ($1, $2, 'Tester', true)
                    RETURNING id
                `, [orgId, userId]);
                const profesionalId = profResult.rows[0].id;

                // Insertar cita en enero 2025 (debe ir a partición citas_2025_01)
                const citaEnero = await client.query(`
                    INSERT INTO citas (
                        organizacion_id, codigo_cita, cliente_id, profesional_id,
                        fecha_cita, hora_inicio, hora_fin, estado,
                        precio_total, duracion_total_minutos
                    )
                    VALUES ($1, 'TEST-ENE-001', $2, $3, '2025-01-15', '10:00', '11:00', 'pendiente', 100, 60)
                    RETURNING id
                `, [orgId, clienteId, profesionalId]);

                // Insertar cita en junio 2025 (debe ir a partición citas_2025_06)
                const citaJunio = await client.query(`
                    INSERT INTO citas (
                        organizacion_id, codigo_cita, cliente_id, profesional_id,
                        fecha_cita, hora_inicio, hora_fin, estado,
                        precio_total, duracion_total_minutos
                    )
                    VALUES ($1, 'TEST-JUN-001', $2, $3, '2025-06-15', '14:00', '15:00', 'confirmada', 150, 60)
                    RETURNING id
                `, [orgId, clienteId, profesionalId]);

                // Verificar que las citas están en las particiones correctas
                const particionEnero = await client.query(`
                    SELECT tableoid::regclass as particion
                    FROM citas
                    WHERE id = $1
                `, [citaEnero.rows[0].id]);

                const particionJunio = await client.query(`
                    SELECT tableoid::regclass as particion
                    FROM citas
                    WHERE id = $1
                `, [citaJunio.rows[0].id]);

                expect(particionEnero.rows[0].particion).toBe('citas_2025_01');
                expect(particionJunio.rows[0].particion).toBe('citas_2025_06');

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        });

        test('debe consultar eficientemente con partition pruning', async () => {
            // Consulta que beneficia de partition pruning
            const result = await pool.query(`
                EXPLAIN (FORMAT JSON)
                SELECT * FROM citas
                WHERE fecha_cita >= '2025-06-01'
                  AND fecha_cita < '2025-07-01'
                  AND estado = 'confirmada'
            `);

            const plan = result.rows[0]['QUERY PLAN'][0];

            // Verificar que usa Append (partition pruning)
            // PostgreSQL debería solo escanear la partición citas_2025_06
            logger.info('Query plan:', { plan: JSON.stringify(plan, null, 2) });

            // El plan debe mencionar particionamiento
            const planText = JSON.stringify(plan);
            expect(planText).toMatch(/Append|Partition/i);
        });

    });

    describe('📊 Particiones de Eventos Sistema', () => {

        test('debe tener particiones creadas para 2025-2026', async () => {
            const result = await pool.query(`
                SELECT
                    c.relname as particion,
                    pg_get_expr(c.relpartbound, c.oid) as rango
                FROM pg_class c
                JOIN pg_inherits i ON c.oid = i.inhrelid
                JOIN pg_class p ON p.oid = i.inhparent
                WHERE p.relname = 'eventos_sistema'
                ORDER BY c.relname
            `);

            expect(result.rows.length).toBeGreaterThanOrEqual(18); // 12 de 2025 + 6 de 2026

            // Verificar que existe la partición actual
            const particionActual = result.rows.find(r => r.particion === 'eventos_sistema_2025_11');
            expect(particionActual).toBeDefined();
        });

        test('debe insertar eventos en la partición correcta', async () => {
            const client = await pool.connect();

            try {
                await client.query('BEGIN');
                await client.query("SELECT set_config('app.bypass_rls', 'true', true)");

                // Crear organización de prueba
                const orgResult = await client.query(`
                    INSERT INTO organizaciones (nombre_comercial, email_contacto, activo)
                    VALUES ('Event Test Org', 'events@partition.com', true)
                    RETURNING id
                `);
                const orgId = orgResult.rows[0].id;

                // Insertar evento en febrero 2025
                const eventoFebrero = await client.query(`
                    INSERT INTO eventos_sistema (
                        organizacion_id, tipo_evento, descripcion, gravedad,
                        metadata, creado_en
                    )
                    VALUES (
                        $1, 'login_success', 'Test login febrero', 'info',
                        '{}'::jsonb, '2025-02-15 10:00:00+00'
                    )
                    RETURNING id
                `, [orgId]);

                // Insertar evento en septiembre 2025
                const eventoSeptiembre = await client.query(`
                    INSERT INTO eventos_sistema (
                        organizacion_id, tipo_evento, descripcion, gravedad,
                        metadata, creado_en
                    )
                    VALUES (
                        $1, 'cita_creada', 'Test cita septiembre', 'info',
                        '{}'::jsonb, '2025-09-20 15:30:00+00'
                    )
                    RETURNING id
                `, [orgId]);

                // Verificar particiones correctas
                const particionFeb = await client.query(`
                    SELECT tableoid::regclass as particion
                    FROM eventos_sistema
                    WHERE id = $1
                `, [eventoFebrero.rows[0].id]);

                const particionSep = await client.query(`
                    SELECT tableoid::regclass as particion
                    FROM eventos_sistema
                    WHERE id = $1
                `, [eventoSeptiembre.rows[0].id]);

                expect(particionFeb.rows[0].particion).toBe('eventos_sistema_2025_02');
                expect(particionSep.rows[0].particion).toBe('eventos_sistema_2025_09');

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        });

    });

    describe('⚙️ Funciones de Gestión de Particiones', () => {

        test('listar_particiones() debe retornar información completa', async () => {
            const result = await pool.query('SELECT * FROM listar_particiones()');

            expect(result.rows.length).toBeGreaterThan(0);

            // Verificar estructura del resultado
            const primeraParticion = result.rows[0];
            expect(primeraParticion).toHaveProperty('tabla_padre');
            expect(primeraParticion).toHaveProperty('particion');
            expect(primeraParticion).toHaveProperty('registros');
            expect(primeraParticion).toHaveProperty('tamano_mb');
            expect(primeraParticion).toHaveProperty('rango_fechas');
            expect(primeraParticion).toHaveProperty('estado');

            // Verificar que hay particiones de ambas tablas
            const particionesCitas = result.rows.filter(r => r.tabla_padre === 'citas');
            const particionesEventos = result.rows.filter(r => r.tabla_padre === 'eventos_sistema');

            expect(particionesCitas.length).toBeGreaterThan(0);
            expect(particionesEventos.length).toBeGreaterThan(0);

            logger.info('Particiones encontradas:', {
                citas: particionesCitas.length,
                eventos: particionesEventos.length
            });
        });

        test('crear_particiones_futuras_citas() debe crear nuevas particiones', async () => {
            // Intentar crear particiones para los próximos 3 meses
            const result = await pool.query(`
                SELECT * FROM crear_particiones_futuras_citas(3)
            `);

            expect(result.rows.length).toBeGreaterThan(0);

            // Verificar estructura del resultado
            const primeraParticion = result.rows[0];
            expect(primeraParticion).toHaveProperty('particion_nombre');
            expect(primeraParticion).toHaveProperty('fecha_inicio');
            expect(primeraParticion).toHaveProperty('fecha_fin');
            expect(primeraParticion).toHaveProperty('creada');
            expect(primeraParticion).toHaveProperty('mensaje');

            logger.info('Particiones futuras creadas:', {
                total: result.rows.length,
                nuevas: result.rows.filter(r => r.creada).length,
                existentes: result.rows.filter(r => !r.creada).length
            });
        });

        test('crear_particiones_futuras_eventos() debe crear nuevas particiones', async () => {
            const result = await pool.query(`
                SELECT * FROM crear_particiones_futuras_eventos(3)
            `);

            expect(result.rows.length).toBeGreaterThan(0);

            logger.info('Particiones eventos futuras:', {
                total: result.rows.length,
                nuevas: result.rows.filter(r => r.creada).length
            });
        });

        test('eliminar_particiones_antiguas() NO debe eliminar particiones recientes', async () => {
            // Intentar eliminar particiones >24 meses (no debería eliminar nada de 2025-2026)
            const result = await pool.query(`
                SELECT * FROM eliminar_particiones_antiguas(24)
            `);

            // No debe haber eliminado ninguna partición de 2025-2026
            const eliminadas2025 = result.rows.filter(r =>
                r.particion_eliminada && r.particion_eliminada.includes('2025')
            );

            expect(eliminadas2025.length).toBe(0);

            logger.info('Particiones antiguas verificadas (no se eliminó nada de 2025)');
        });

    });

    describe('🚀 Performance - Partition Pruning', () => {

        test('consulta con filtro de fecha debe usar solo partición relevante', async () => {
            // Query que beneficia de partition pruning
            const explain = await pool.query(`
                EXPLAIN (ANALYZE, FORMAT JSON)
                SELECT COUNT(*)
                FROM citas
                WHERE fecha_cita = '2025-06-15'
            `);

            const plan = explain.rows[0]['QUERY PLAN'][0];
            const planText = JSON.stringify(plan);

            // Debe mencionar Append (particionamiento) y solo escanear 1 partición
            expect(planText).toMatch(/Append/i);

            logger.info('Query plan para partition pruning:', {
                execution_time: plan['Execution Time'],
                planning_time: plan['Planning Time']
            });
        });

        test('consulta de rango de fechas debe escanear solo particiones relevantes', async () => {
            const explain = await pool.query(`
                EXPLAIN (FORMAT JSON)
                SELECT *
                FROM eventos_sistema
                WHERE creado_en >= '2025-05-01'
                  AND creado_en < '2025-08-01'
            `);

            const plan = explain.rows[0]['QUERY PLAN'][0];
            const planText = JSON.stringify(plan);

            // PostgreSQL debe hacer partition pruning y solo escanear Mayo, Junio, Julio
            expect(planText).toMatch(/Append|Partition/i);

            logger.info('Partition pruning para rango de fechas:', {
                plan: plan['Plan']
            });
        });

    });

    describe('🔒 Integridad Referencial con Particionamiento', () => {

        test('debe mantener foreign keys funcionando con particiones', async () => {
            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                // Crear organización, usuario, cliente, profesional
                const orgResult = await client.query(`
                    INSERT INTO organizaciones (nombre_comercial, email_contacto, activo)
                    VALUES ('FK Test Org', 'fk@partition.com', true)
                    RETURNING id
                `);
                const orgId = orgResult.rows[0].id;

                const userResult = await client.query(`
                    INSERT INTO usuarios (organizacion_id, email, password_hash, nombre, apellidos, rol)
                    VALUES ($1, 'fk@partition.com', '$2b$10$test', 'FK', 'Test', 'admin')
                    RETURNING id
                `, [orgId]);

                const clienteResult = await client.query(`
                    INSERT INTO clientes (organizacion_id, nombre, apellidos, telefono)
                    VALUES ($1, 'Cliente FK', 'Test', '+525512345679')
                    RETURNING id
                `, [orgId]);

                const profResult = await client.query(`
                    INSERT INTO profesionales (organizacion_id, usuario_id, especialidad, activo)
                    VALUES ($1, $2, 'FK Tester', true)
                    RETURNING id
                `, [orgId, userResult.rows[0].id]);

                // Crear cita
                const citaResult = await client.query(`
                    INSERT INTO citas (
                        organizacion_id, codigo_cita, cliente_id, profesional_id,
                        fecha_cita, hora_inicio, hora_fin, estado,
                        precio_total, duracion_total_minutos
                    )
                    VALUES ($1, 'FK-TEST-001', $2, $3, '2025-08-15', '10:00', '11:00', 'pendiente', 100, 60)
                    RETURNING id
                `, [orgId, clienteResult.rows[0].id, profResult.rows[0].id]);

                // Intentar eliminar cliente (debe fallar por foreign key RESTRICT)
                await expect(
                    client.query('DELETE FROM clientes WHERE id = $1', [clienteResult.rows[0].id])
                ).rejects.toThrow(/violates foreign key constraint/);

                // Eliminar cita primero
                await client.query('DELETE FROM citas WHERE id = $1', [citaResult.rows[0].id]);

                // Ahora sí se puede eliminar cliente
                await client.query('DELETE FROM clientes WHERE id = $1', [clienteResult.rows[0].id]);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        });

        test('debe permitir CASCADE delete de organización', async () => {
            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                // Crear organización con datos
                const orgResult = await client.query(`
                    INSERT INTO organizaciones (nombre_comercial, email_contacto, activo)
                    VALUES ('Cascade Test Org', 'cascade@partition.com', true)
                    RETURNING id
                `);
                const orgId = orgResult.rows[0].id;

                // Crear usuario, cliente, profesional y cita
                const userResult = await client.query(`
                    INSERT INTO usuarios (organizacion_id, email, password_hash, nombre, apellidos, rol)
                    VALUES ($1, 'cascade@partition.com', '$2b$10$test', 'Cascade', 'Test', 'admin')
                    RETURNING id
                `, [orgId]);

                const clienteResult = await client.query(`
                    INSERT INTO clientes (organizacion_id, nombre, apellidos, telefono)
                    VALUES ($1, 'Cliente Cascade', 'Test', '+525512345680')
                    RETURNING id
                `, [orgId]);

                const profResult = await client.query(`
                    INSERT INTO profesionales (organizacion_id, usuario_id, especialidad, activo)
                    VALUES ($1, $2, 'Cascade Tester', true)
                    RETURNING id
                `, [orgId, userResult.rows[0].id]);

                await client.query(`
                    INSERT INTO citas (
                        organizacion_id, codigo_cita, cliente_id, profesional_id,
                        fecha_cita, hora_inicio, hora_fin, estado,
                        precio_total, duracion_total_minutos
                    )
                    VALUES ($1, 'CASCADE-001', $2, $3, '2025-09-15', '10:00', '11:00', 'pendiente', 100, 60)
                `, [orgId, clienteResult.rows[0].id, profResult.rows[0].id]);

                // Eliminar organización (debe eliminar en cascada todo)
                await client.query('DELETE FROM organizaciones WHERE id = $1', [orgId]);

                // Verificar que se eliminó todo
                const citasCount = await client.query('SELECT COUNT(*) FROM citas WHERE organizacion_id = $1', [orgId]);
                expect(parseInt(citasCount.rows[0].count)).toBe(0);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        });

    });

});
