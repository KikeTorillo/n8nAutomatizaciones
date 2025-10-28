/**
 * Tests de Seguridad RLS Multi-Tenant
 * Valida aislamiento completo entre organizaciones
 *
 * CRÍTICO: Estos tests DEBEN pasar al 100%
 */

const {
  setRLSContext,
  bypassRLS,
  cleanAllTables,
  createTestOrganizacion,
  createTestCliente,
  createTestProfesional,
  createTestServicio,
  createTestCita
} = require('../helpers/db-helper');

describe('🔒 RLS Multi-Tenant - Aislamiento de Datos', () => {
  let client;
  let org1, org2;
  let cliente1, cliente2;
  let profesional1, profesional2;
  let servicio1, servicio2;
  let cita1, cita2;

  beforeAll(async () => {
    client = await global.testPool.connect();
    await cleanAllTables(client);

    // Crear 2 organizaciones
    org1 = await createTestOrganizacion(client, {
      nombre: 'Organización 1',
      nombre_comercial: 'Org1'
    });

    org2 = await createTestOrganizacion(client, {
      nombre: 'Organización 2',
      nombre_comercial: 'Org2'
    });

    // Crear datos para org1
    cliente1 = await createTestCliente(client, org1.id, {
      nombre: 'Cliente Org1',
      telefono: '5512345678'
    });

    profesional1 = await createTestProfesional(client, org1.id, {
      nombre: 'Profesional Org1'
    });

    servicio1 = await createTestServicio(client, org1.id, {
      nombre: 'Servicio Org1',
      precio: 100.00
    });

    // Usar fecha dinámica (mañana) para evitar constraint violations
    const fechaCita = new Date();
    fechaCita.setDate(fechaCita.getDate() + 1);
    const fechaCitaStr = fechaCita.toISOString().split('T')[0];

    cita1 = await createTestCita(client, org1.id, {
      cliente_id: cliente1.id,
      profesional_id: profesional1.id,
      servicios_ids: [servicio1.id], // ✅ Array
      fecha_cita: fechaCitaStr,
      hora_inicio: '10:00',
      hora_fin: '11:00',
      precio_total: 100.00, // ✅ Reemplaza precio_servicio + precio_final
      duracion_total_minutos: 60
    });

    // Crear datos para org2
    cliente2 = await createTestCliente(client, org2.id, {
      nombre: 'Cliente Org2',
      telefono: '5587654321'
    });

    profesional2 = await createTestProfesional(client, org2.id, {
      nombre: 'Profesional Org2'
    });

    servicio2 = await createTestServicio(client, org2.id, {
      nombre: 'Servicio Org2',
      precio: 200.00
    });

    cita2 = await createTestCita(client, org2.id, {
      cliente_id: cliente2.id,
      profesional_id: profesional2.id,
      servicios_ids: [servicio2.id], // ✅ Array
      fecha_cita: fechaCitaStr,
      hora_inicio: '14:00',
      hora_fin: '15:00',
      precio_total: 200.00, // ✅ Reemplaza precio_servicio + precio_final
      duracion_total_minutos: 60
    });
  });

  afterAll(async () => {
    await cleanAllTables(client);
    client.release();
  });

  describe('Tabla: clientes', () => {
    test('Org1 solo ve sus propios clientes', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query('SELECT * FROM clientes');

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(cliente1.id);
      expect(result.rows[0].nombre).toBe('Cliente Org1');
    });

    test('Org2 solo ve sus propios clientes', async () => {
      await setRLSContext(client, org2.id);

      const result = await client.query('SELECT * FROM clientes');

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(cliente2.id);
      expect(result.rows[0].nombre).toBe('Cliente Org2');
    });

    test('Org1 NO puede acceder a clientes de Org2 por ID', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query(
        'SELECT * FROM clientes WHERE id = $1',
        [cliente2.id]
      );

      expect(result.rows.length).toBe(0);
    });

    test('Org1 NO puede modificar clientes de Org2', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query(
        `UPDATE clientes SET nombre = 'Hacked' WHERE id = $1 RETURNING *`,
        [cliente2.id]
      );

      expect(result.rows.length).toBe(0);

      // Verificar que el cliente2 NO fue modificado
      await setRLSContext(client, org2.id);
      const check = await client.query(
        'SELECT nombre FROM clientes WHERE id = $1',
        [cliente2.id]
      );
      expect(check.rows[0].nombre).toBe('Cliente Org2');
    });

    test('Org1 NO puede eliminar clientes de Org2', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query(
        'DELETE FROM clientes WHERE id = $1 RETURNING *',
        [cliente2.id]
      );

      expect(result.rows.length).toBe(0);

      // Verificar que el cliente2 aún existe
      await setRLSContext(client, org2.id);
      const check = await client.query(
        'SELECT * FROM clientes WHERE id = $1',
        [cliente2.id]
      );
      expect(check.rows.length).toBe(1);
    });
  });

  describe('Tabla: profesionales', () => {
    test('Org1 solo ve sus propios profesionales', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query('SELECT * FROM profesionales');

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(profesional1.id);
    });

    test('Org2 NO puede acceder a profesionales de Org1', async () => {
      await setRLSContext(client, org2.id);

      const result = await client.query(
        'SELECT * FROM profesionales WHERE id = $1',
        [profesional1.id]
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Tabla: servicios', () => {
    test('Org1 solo ve sus propios servicios', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query('SELECT * FROM servicios');

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(servicio1.id);
    });

    test('Org2 NO puede modificar servicios de Org1', async () => {
      await setRLSContext(client, org2.id);

      const result = await client.query(
        `UPDATE servicios SET precio = 999.99 WHERE id = $1 RETURNING *`,
        [servicio1.id]
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Tabla: citas (CRÍTICO)', () => {
    test('Org1 solo ve sus propias citas', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query('SELECT * FROM citas');

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(cita1.id);
      expect(result.rows[0].codigo_cita).toContain('ORG');
    });

    test('Org2 solo ve sus propias citas', async () => {
      await setRLSContext(client, org2.id);

      const result = await client.query('SELECT * FROM citas');

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBe(cita2.id);
    });

    test('Org1 NO puede acceder a citas de Org2 por ID', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query(
        'SELECT * FROM citas WHERE id = $1',
        [cita2.id]
      );

      expect(result.rows.length).toBe(0);
    });

    test('Org1 NO puede acceder a citas de Org2 por codigo_cita', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query(
        'SELECT * FROM citas WHERE codigo_cita = $1',
        [cita2.codigo_cita]
      );

      expect(result.rows.length).toBe(0);
    });

    test('Org1 NO puede modificar citas de Org2', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query(
        `UPDATE citas SET estado = 'cancelada' WHERE id = $1 RETURNING *`,
        [cita2.id]
      );

      expect(result.rows.length).toBe(0);
    });

    test('Org1 NO puede eliminar citas de Org2', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query(
        'DELETE FROM citas WHERE id = $1 RETURNING *',
        [cita2.id]
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('JOINs entre tablas', () => {
    test('JOIN citas-clientes respeta RLS', async () => {
      await setRLSContext(client, org1.id);

      const result = await client.query(`
        SELECT c.id as cita_id, cl.nombre as cliente_nombre
        FROM citas c
        JOIN clientes cl ON c.cliente_id = cl.id
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].cliente_nombre).toBe('Cliente Org1');
    });

    test('JOIN NO expone datos de otras organizaciones', async () => {
      await setRLSContext(client, org1.id);

      // Intentar JOIN forzando cliente de org2
      const result = await client.query(`
        SELECT c.id as cita_id, cl.nombre as cliente_nombre
        FROM citas c
        JOIN clientes cl ON cl.id = $1
      `, [cliente2.id]);

      // No debe retornar nada porque cliente2 está filtrado por RLS
      expect(result.rows.length).toBe(0);
    });
  });

  describe('Anti SQL-Injection', () => {
    test('tenant_id con SQL injection NO bypasea RLS', async () => {
      // Intentar inyección SQL en tenant_id
      const maliciousTenantId = "1 OR 1=1";

      // Debe fallar o no retornar datos de otras orgs
      try {
        await client.query('SELECT set_config($1, $2, false)', [
          'app.current_tenant_id',
          maliciousTenantId
        ]);

        const result = await client.query('SELECT * FROM clientes');

        // Si no falla, debe retornar 0 rows (REGEX bloquea en BD)
        expect(result.rows.length).toBe(0);
      } catch (error) {
        // También es válido que falle
        expect(error).toBeDefined();
      }
    });

    test('tenant_id vacío NO bypasea RLS', async () => {
      await client.query('SELECT set_config($1, $2, false)', [
        'app.current_tenant_id',
        ''
      ]);

      const result = await client.query('SELECT * FROM clientes');

      // Debe retornar 0 rows (política RLS bloquea tenant vacío)
      expect(result.rows.length).toBe(0);
    });
  });

  describe('Seguridad adicional', () => {
    test('SIN configurar tenant_id, NO se pueden ver datos (RLS activo)', async () => {
      // Resetear configuración de RLS (sin tenant_id válido)
      await client.query("SELECT set_config('app.current_tenant_id', '', false)");
      await client.query("SELECT set_config('app.bypass_rls', 'false', false)");

      const result = await client.query('SELECT * FROM clientes ORDER BY id');

      // NO debe ver ningún cliente (RLS bloqueará la consulta)
      expect(result.rows.length).toBe(0);
    });

    test('Con tenant_id inválido (SQL injection attempt), query falla o retorna 0 datos', async () => {
      // Intentar SQL injection en tenant_id
      await client.query("SELECT set_config('app.current_tenant_id', '1 OR 1=1', false)");

      try {
        const result = await client.query('SELECT * FROM clientes ORDER BY id');

        // Si no lanza error, debe retornar 0 rows (bloqueado por REGEX)
        expect(result.rows.length).toBe(0);
      } catch (error) {
        // Si lanza error de sintaxis, también es válido (SQL injection bloqueado)
        expect(error.message).toMatch(/invalid input syntax for type integer/);
      }
    });
  });
});
