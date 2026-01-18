/**
 * Tests de Modelos CRUD Básicos
 * Valida operaciones Create, Read, Update, Delete con RLS
 *
 * Cobertura:
 * - OrganizacionModel
 * - UsuarioModel
 * - ClienteModel
 * - ProfesionalModel
 * - ServicioModel
 */

const {
  setRLSContext,
  bypassRLS,
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario
} = require('../helpers/db-helper');

const OrganizacionModel = require('../../modules/core/models/organizacion.model');
const UsuarioModel = require('../../modules/core/models/usuario.model');
const ClienteModel = require('../../modules/clientes/models/cliente.model');
const ProfesionalModel = require('../../models/profesional.model');
const ServicioModel = require('../../models/servicio.model');

describe('📦 Modelos CRUD Básicos', () => {
  let client;
  let org1, org2;
  let usuario1;

  beforeAll(async () => {
    client = await global.testPool.connect();
    await cleanAllTables(client);

    // Crear 2 organizaciones para probar aislamiento
    // NO especificar codigo_tenant para evitar colisiones
    org1 = await createTestOrganizacion(client, {
      nombre_comercial: 'Org1 Test'
    });

    org2 = await createTestOrganizacion(client, {
      nombre_comercial: 'Org2 Test'
    });

    // Crear usuario admin para org1
    usuario1 = await createTestUsuario(client, org1.id, {
      rol: 'admin'
    });
  });

  afterAll(async () => {
    await cleanAllTables(client);
    client.release();
  });

  // ====================================================================
  // MODELO: ORGANIZACIONES
  // ====================================================================

  describe('OrganizacionModel', () => {
    test('listar() retorna organizaciones', async () => {
      const resultado = await OrganizacionModel.listar();

      expect(resultado).toBeDefined();
      expect(resultado.data).toBeDefined();
      expect(Array.isArray(resultado.data)).toBe(true);
      expect(resultado.data.length).toBeGreaterThanOrEqual(2);
    });

    test('obtenerPorId() retorna organización correcta', async () => {
      const org = await OrganizacionModel.obtenerPorId(org1.id);

      expect(org).toBeDefined();
      expect(org.id).toBe(org1.id);
      expect(org.codigo_tenant).toBe(org1.codigo_tenant);
    });

    test('actualizar() modifica organización', async () => {
      const updated = await OrganizacionModel.actualizar(org1.id, {
        nombre_comercial: 'Org1 Actualizada'
      });

      expect(updated.nombre_comercial).toBe('Org1 Actualizada');
    });
  });

  // ====================================================================
  // MODELO: USUARIOS
  // ====================================================================

  describe('UsuarioModel', () => {
    let empleado1;

    test('crear() crea nuevo usuario', async () => {
      empleado1 = await UsuarioModel.crear({
        organizacion_id: org1.id,
        email: `empleado-${Date.now()}@test.com`,
        password: 'Password123!', // UsuarioModel hashea internamente
        nombre: 'Juan',
        apellidos: 'Pérez',
        rol: 'empleado'
      });

      expect(empleado1).toBeDefined();
      expect(empleado1.email).toContain('empleado-');
      expect(empleado1.organizacion_id).toBe(org1.id);
    });

    test('listarPorOrganizacion() retorna usuarios', async () => {
      const resultado = await UsuarioModel.listarPorOrganizacion(org1.id);

      expect(resultado).toBeDefined();
      expect(resultado.data).toBeDefined();
      expect(Array.isArray(resultado.data)).toBe(true);
      expect(resultado.pagination).toBeDefined();
      // Verificar que al menos hay usuarios (el admin del beforeAll)
      expect(resultado.data.length).toBeGreaterThanOrEqual(1);
    });

    test('buscarPorEmail() retorna usuario', async () => {
      const usuario = await UsuarioModel.buscarPorEmail(usuario1.email);

      expect(usuario).toBeDefined();
      expect(usuario.email).toBeDefined();
    });
  });

  // ====================================================================
  // MODELO: CLIENTES
  // ====================================================================

  describe('ClienteModel', () => {
    let cliente1;

    test('crear() crea nuevo cliente', async () => {
      cliente1 = await ClienteModel.crear(org1.id, {
        nombre: 'Cliente Test',
        telefono: '5512345678',
        email: `cliente-${Date.now()}@test.com`
      });

      expect(cliente1).toBeDefined();
      expect(cliente1.nombre).toBe('Cliente Test');
      expect(cliente1.organizacion_id).toBe(org1.id);
    });

    test('listar() respeta RLS y retorna paginación', async () => {
      const resultado = await ClienteModel.listar(org1.id, {});

      expect(resultado).toBeDefined();
      expect(resultado.clientes).toBeDefined();
      expect(Array.isArray(resultado.clientes)).toBe(true);
      expect(resultado.clientes.every(c => c.organizacion_id === org1.id)).toBe(true);
    });

    test('buscarPorId() retorna cliente', async () => {
      const cliente = await ClienteModel.buscarPorId(org1.id, cliente1.id);

      expect(cliente).toBeDefined();
      expect(cliente.id).toBe(cliente1.id);
    });

    test('buscarPorTelefono() encuentra clientes', async () => {
      const resultado = await ClienteModel.buscarPorTelefono('5512345678', org1.id);

      expect(resultado).toBeDefined();
      expect(resultado.encontrado).toBe(true);
      expect(resultado.cliente).toBeDefined();
      expect(resultado.cliente.telefono).toBe('5512345678');
    });

    test('actualizar() modifica cliente', async () => {
      const updated = await ClienteModel.actualizar(org1.id, cliente1.id, {
        nombre: 'Cliente Actualizado',
        notas_especiales: 'Cliente VIP'
      });

      expect(updated).toBeDefined();
      expect(updated.nombre).toBe('Cliente Actualizado');
    });

    test('eliminar() desactiva cliente (soft delete)', async () => {
      const resultado = await ClienteModel.eliminar(org1.id, cliente1.id);

      expect(resultado).toBe(true);
    });
  });

  // ====================================================================
  // MODELO: PROFESIONALES
  // ====================================================================

  describe('ProfesionalModel', () => {
    let profesional1;

    test('crear() crea nuevo profesional', async () => {
      profesional1 = await ProfesionalModel.crear(org1.id, {
        nombre_completo: 'Barbero Test',
        tipo_profesional_id: 1, // barbero
        telefono: '5587654321'
      });

      expect(profesional1).toBeDefined();
      expect(profesional1.nombre_completo).toBe('Barbero Test');
    });

    test('listar() respeta RLS', async () => {
      const resultado = await ProfesionalModel.listar(org1.id, {});

      expect(resultado).toBeDefined();
      // El método retorna objeto con profesionales y paginación
      const profesionales = resultado.profesionales;
      expect(profesionales).toBeDefined();
      expect(Array.isArray(profesionales)).toBe(true);
      if (profesionales.length > 0) {
        expect(profesionales.every(p => p.organizacion_id === org1.id)).toBe(true);
      }
    });

    test('buscarPorId() retorna profesional', async () => {
      const profesional = await ProfesionalModel.buscarPorId(org1.id, profesional1.id);

      expect(profesional).toBeDefined();
      expect(profesional.id).toBe(profesional1.id);
    });

    test('actualizar() modifica profesional', async () => {
      const updated = await ProfesionalModel.actualizar(org1.id, profesional1.id, {
        nombre_completo: 'Barbero Profesional',
        biografia: 'Experto en cortes modernos'
      });

      expect(updated).toBeDefined();
      expect(updated.nombre_completo).toBe('Barbero Profesional');
    });
  });

  // ====================================================================
  // MODELO: SERVICIOS
  // ====================================================================

  describe('ServicioModel', () => {
    let servicio1;

    test('crear() crea nuevo servicio', async () => {
      servicio1 = await ServicioModel.crear(org1.id, {
        nombre: 'Corte de Cabello',
        descripcion: 'Corte clásico',
        duracion_minutos: 30,
        precio: 150.00
      });

      expect(servicio1).toBeDefined();
      expect(servicio1.nombre).toBe('Corte de Cabello');
      expect(parseFloat(servicio1.precio)).toBe(150.00);
    });

    test('listar() retorna objeto con paginación y respeta RLS', async () => {
      const resultado = await ServicioModel.listar(org1.id);

      expect(resultado).toBeDefined();
      expect(resultado.servicios).toBeDefined();
      expect(Array.isArray(resultado.servicios)).toBe(true);
      expect(resultado.paginacion).toBeDefined();
      expect(resultado.servicios.every(s => s.organizacion_id === org1.id)).toBe(true);
    });

    test('buscarPorId() retorna servicio', async () => {
      const servicio = await ServicioModel.buscarPorId(org1.id, servicio1.id);

      expect(servicio).toBeDefined();
      expect(servicio.id).toBe(servicio1.id);
    });

    test('actualizar() modifica servicio', async () => {
      const updated = await ServicioModel.actualizar(org1.id, servicio1.id, {
        precio: 180.00,
        descripcion: 'Corte premium actualizado'
      });

      expect(updated).toBeDefined();
      expect(parseFloat(updated.precio)).toBe(180.00);
    });
  });
});
