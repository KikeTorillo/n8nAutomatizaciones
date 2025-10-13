/**
 * Tests de Triggers Automáticos de BD
 * Valida que los triggers funcionan correctamente sin intervención del backend
 *
 * Triggers validados:
 * - trigger_actualizar_timestamp (timestamps automáticos)
 * - trigger_sync_capacidad_ocupada (capacidad de citas)
 * - trigger_validar_coherencia_cita (validaciones organizacionales)
 */

const {
  setRLSContext,
  cleanAllTables,
  createTestOrganizacion,
  createTestCliente,
  createTestProfesional,
  createTestServicio,
  createTestCita
} = require('../helpers/db-helper');

describe('⚡ Triggers Automáticos de BD', () => {
  let client;
  let org;
  let cliente, profesional, servicio;

  // Fecha dinámica para evitar constraint violations
  const getFechaManana = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 1);
    return fecha.toISOString().split('T')[0];
  };

  beforeAll(async () => {
    client = await global.testPool.connect();
    await cleanAllTables(client);

    org = await createTestOrganizacion(client);
    cliente = await createTestCliente(client, org.id);
    profesional = await createTestProfesional(client, org.id);
    servicio = await createTestServicio(client, org.id);
  });

  afterAll(async () => {
    await cleanAllTables(client);
    client.release();
  });

  describe('Trigger: actualizar_timestamp', () => {
    test('creado_en se establece automáticamente al insertar', async () => {
      const cita = await createTestCita(client, org.id, {
        cliente_id: cliente.id,
        profesional_id: profesional.id,
        servicio_id: servicio.id,
        fecha_cita: getFechaManana(),
        hora_inicio: '10:00',
        hora_fin: '11:00',
        precio_servicio: 100.00,
        precio_final: 100.00
      });

      expect(cita.creado_en).toBeDefined();
      expect(cita.creado_en).toBeInstanceOf(Date);
    });

    test('actualizado_en se actualiza automáticamente en UPDATE', async () => {
      const cita = await createTestCita(client, org.id, {
        cliente_id: cliente.id,
        profesional_id: profesional.id,
        servicio_id: servicio.id,
        fecha_cita: getFechaManana(),
        hora_inicio: '10:00',
        hora_fin: '11:00',
        precio_servicio: 100.00,
        precio_final: 100.00
      });

      const creadoEn = cita.creado_en;

      // Esperar 1 segundo para asegurar timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 1000));

      await setRLSContext(client, org.id);

      // Actualizar cita
      const result = await client.query(
        `UPDATE citas SET estado = 'confirmada' WHERE id = $1 RETURNING *`,
        [cita.id]
      );

      const citaActualizada = result.rows[0];

      expect(citaActualizada.actualizado_en).toBeDefined();
      expect(new Date(citaActualizada.actualizado_en)).toBeInstanceOf(Date);

      // actualizado_en debe ser posterior a creado_en
      expect(new Date(citaActualizada.actualizado_en).getTime())
        .toBeGreaterThan(new Date(creadoEn).getTime());
    });

    test('creado_en NO cambia en UPDATE', async () => {
      const cita = await createTestCita(client, org.id, {
        cliente_id: cliente.id,
        profesional_id: profesional.id,
        servicio_id: servicio.id,
        fecha_cita: getFechaManana(),
        hora_inicio: '10:00',
        hora_fin: '11:00',
        precio_servicio: 100.00,
        precio_final: 100.00
      });

      const creadoEnOriginal = cita.creado_en;

      await setRLSContext(client, org.id);

      // Actualizar cita
      const result = await client.query(
        `UPDATE citas SET estado = 'en_curso' WHERE id = $1 RETURNING *`,
        [cita.id]
      );

      const citaActualizada = result.rows[0];

      // creado_en debe ser el mismo
      expect(new Date(citaActualizada.creado_en).getTime())
        .toBe(new Date(creadoEnOriginal).getTime());
    });
  });

  describe('Trigger: validar_coherencia_cita', () => {
    test('Cliente debe pertenecer a la misma organización que la cita', async () => {
      // Crear segunda organización con cliente
      const org2 = await createTestOrganizacion(client, {
        nombre: 'Org 2'
      });
      const clienteOrg2 = await createTestCliente(client, org2.id);

      await setRLSContext(client, org.id);

      try {
        // Intentar crear cita con cliente de otra org
        await client.query(`
          INSERT INTO citas (
            organizacion_id, cliente_id, profesional_id, servicio_id,
            fecha_cita, hora_inicio, hora_fin, precio_servicio, precio_final
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          org.id,
          clienteOrg2.id, // ❌ Cliente de org2
          profesional.id,
          servicio.id,
          getFechaManana(),
          '10:00',
          '11:00',
          100.00,
          100.00
        ]);

        fail('Debería haber lanzado error de validación');
      } catch (error) {
        // Debe fallar por trigger de coherencia
        expect(error.message).toContain('no pertenece a organización');
      }
    });

    test('Profesional debe pertenecer a la misma organización que la cita', async () => {
      const org2 = await createTestOrganizacion(client, {
        nombre: 'Org 3'
      });
      const profesionalOrg2 = await createTestProfesional(client, org2.id);

      await setRLSContext(client, org.id);

      try {
        await client.query(`
          INSERT INTO citas (
            organizacion_id, cliente_id, profesional_id, servicio_id,
            fecha_cita, hora_inicio, hora_fin, precio_servicio, precio_final
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          org.id,
          cliente.id,
          profesionalOrg2.id, // ❌ Profesional de org2
          servicio.id,
          getFechaManana(),
          '11:00',
          '12:00',
          100.00,
          100.00
        ]);

        fail('Debería haber lanzado error de validación');
      } catch (error) {
        expect(error.message).toContain('no pertenece a organización');
      }
    });

    test('Servicio debe pertenecer a la misma organización que la cita', async () => {
      const org2 = await createTestOrganizacion(client, {
        nombre: 'Org 4'
      });
      const servicioOrg2 = await createTestServicio(client, org2.id);

      await setRLSContext(client, org.id);

      try {
        await client.query(`
          INSERT INTO citas (
            organizacion_id, cliente_id, profesional_id, servicio_id,
            fecha_cita, hora_inicio, hora_fin, precio_servicio, precio_final
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          org.id,
          cliente.id,
          profesional.id,
          servicioOrg2.id, // ❌ Servicio de org2
          getFechaManana(),
          '12:00',
          '13:00',
          100.00,
          100.00
        ]);

        fail('Debería haber lanzado error de validación');
      } catch (error) {
        expect(error.message).toContain('no pertenece a organización');
      }
    });
  });

  describe('Validaciones de horario', () => {
    test('hora_fin debe ser posterior a hora_inicio', async () => {
      await setRLSContext(client, org.id);

      try {
        await client.query(`
          INSERT INTO citas (
            organizacion_id, cliente_id, profesional_id, servicio_id,
            fecha_cita, hora_inicio, hora_fin, precio_servicio, precio_final
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          org.id,
          cliente.id,
          profesional.id,
          servicio.id,
          getFechaManana(),
          '14:00',
          '13:00', // ❌ hora_fin antes de hora_inicio
          100.00,
          100.00
        ]);

        fail('Debería haber lanzado error de validación');
      } catch (error) {
        expect(error.code).toBe('23514'); // Check constraint violation
      }
    });

    test('fecha_cita debe ser presente o futura (no pasada)', async () => {
      await setRLSContext(client, org.id);

      try {
        await client.query(`
          INSERT INTO citas (
            organizacion_id, cliente_id, profesional_id, servicio_id,
            fecha_cita, hora_inicio, hora_fin, precio_servicio, precio_final
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          org.id,
          cliente.id,
          profesional.id,
          servicio.id,
          '2020-01-01', // ❌ Fecha en el pasado
          '10:00',
          '11:00',
          100.00,
          100.00
        ]);

        fail('Debería haber lanzado error de validación');
      } catch (error) {
        expect(error.code).toBe('23514');
      }
    });
  });

  describe('Validaciones de precio', () => {
    test('precio_servicio debe ser mayor a 0', async () => {
      await setRLSContext(client, org.id);

      try {
        await client.query(`
          INSERT INTO citas (
            organizacion_id, cliente_id, profesional_id, servicio_id,
            fecha_cita, hora_inicio, hora_fin, precio_servicio, precio_final
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          org.id,
          cliente.id,
          profesional.id,
          servicio.id,
          getFechaManana(),
          '10:00',
          '11:00',
          -10.00, // ❌ Precio negativo
          -10.00
        ]);

        fail('Debería haber lanzado error de validación');
      } catch (error) {
        expect(error.code).toBe('23514');
      }
    });

    test('descuento no puede ser mayor que precio_servicio', async () => {
      await setRLSContext(client, org.id);

      try {
        await client.query(`
          INSERT INTO citas (
            organizacion_id, cliente_id, profesional_id, servicio_id,
            fecha_cita, hora_inicio, hora_fin, precio_servicio, descuento, precio_final
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          org.id,
          cliente.id,
          profesional.id,
          servicio.id,
          getFechaManana(),
          '10:00',
          '11:00',
          100.00,
          150.00, // ❌ Descuento > precio
          0.00
        ]);

        fail('Debería haber lanzado error de validación');
      } catch (error) {
        expect(error.code).toBe('23514');
      }
    });
  });

  describe('Estados de cita', () => {
    test('Estado debe ser uno de los valores permitidos', async () => {
      await setRLSContext(client, org.id);

      try {
        await client.query(`
          INSERT INTO citas (
            organizacion_id, cliente_id, profesional_id, servicio_id,
            fecha_cita, hora_inicio, hora_fin, precio_servicio, precio_final, estado
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          org.id,
          cliente.id,
          profesional.id,
          servicio.id,
          getFechaManana(),
          '10:00',
          '11:00',
          100.00,
          100.00,
          'invalido' // ❌ Estado no permitido
        ]);

        fail('Debería haber lanzado error de validación');
      } catch (error) {
        expect(error.code).toBe('22P02'); // Invalid enum value
      }
    });

    test('Estados permitidos funcionan correctamente', async () => {
      const estadosPermitidos = [
        'pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'
      ];

      await setRLSContext(client, org.id);

      for (const estado of estadosPermitidos) {
        // Campos base
        const params = [
          org.id,
          cliente.id,
          profesional.id,
          servicio.id,
          getFechaManana(),
          `${10 + estadosPermitidos.indexOf(estado)}:00`,
          `${11 + estadosPermitidos.indexOf(estado)}:00`,
          100.00,
          100.00
        ];

        let query = `
          INSERT INTO citas (
            organizacion_id, cliente_id, profesional_id, servicio_id,
            fecha_cita, hora_inicio, hora_fin, precio_servicio, precio_final`;

        // Si estado es 'completada', debe incluir pagado = true
        if (estado === 'completada') {
          query += `, estado, pagado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
          params.push(estado, true);
        }
        // Si estado es 'cancelada', debe incluir motivo_cancelacion
        else if (estado === 'cancelada') {
          query += `, estado, motivo_cancelacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;
          params.push(estado, 'Cancelada por test');
        }
        else {
          query += `, estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
          params.push(estado);
        }

        query += ` RETURNING *`;

        const result = await client.query(query, params);

        expect(result.rows[0].estado).toBe(estado);
      }
    });
  });
});
