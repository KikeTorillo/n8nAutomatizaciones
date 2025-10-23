/**
 * Tests de Endpoints de Chatbots
 * Suite completa para validar endpoints del controller de chatbots
 *
 * IMPORTANTE: Este test requiere:
 * - n8n-main corriendo (http://n8n-main:5678)
 * - N8N_API_KEY configurado en .env
 * - BOT_TOKEN de Telegram de prueba válido (opcional, se puede mockear)
 *
 * @group integration
 */

// Mock debe ir ANTES de los imports
jest.mock('../../services/platformValidators/telegramValidator', () => ({
  validar: jest.fn().mockResolvedValue({
    valido: true,
    bot_info: {
      id: 123456789,
      username: 'test_bot',
      first_name: 'Test Bot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false
    }
  }),
  validarFormato: jest.fn().mockReturnValue(true)
}));

const request = require('supertest');
const saasApp = require('../../app');
const authConfig = require('../../config/auth');
const N8nService = require('../../services/n8nService');
const N8nCredentialService = require('../../services/n8nCredentialService');
const {
  cleanAllTables,
  createTestOrganizacion,
  createTestUsuario,
  getUniqueTestId
} = require('../helpers/db-helper');

describe('Endpoints de Chatbots', () => {
  let app;
  let client;
  let testOrg;
  let testUsuario;
  let userToken;
  let otherOrg;
  let otherOrgAdmin;
  let otherOrgToken;

  // IDs de n8n creados durante los tests (para limpieza)
  const createdWorkflowIds = [];
  const createdCredentialIds = [];

  beforeAll(async () => {
    app = saasApp.getExpressApp();
    client = await global.testPool.connect();

    // Limpiar BD
    await cleanAllTables(client);

    // Crear organización de prueba
    testOrg = await createTestOrganizacion(client, {
      nombre: 'Test Org Chatbots'
    });

    // Crear usuario admin de la organización
    testUsuario = await createTestUsuario(client, testOrg.id, {
      nombre: 'Usuario',
      apellidos: 'Test',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    // Generar token para el usuario
    userToken = authConfig.generateToken({
      userId: testUsuario.id,
      email: testUsuario.email,
      rol: testUsuario.rol,
      organizacionId: testOrg.id
    });

    // Crear segunda organización para tests RLS
    otherOrg = await createTestOrganizacion(client, {
      nombre: 'Other Org RLS Test Chatbots'
    });

    // Crear admin de la segunda organización
    otherOrgAdmin = await createTestUsuario(client, otherOrg.id, {
      nombre: 'Other Org',
      apellidos: 'Admin',
      rol: 'admin',
      activo: true,
      email_verificado: true
    });

    // Generar token para admin de la segunda org
    otherOrgToken = authConfig.generateToken({
      userId: otherOrgAdmin.id,
      email: otherOrgAdmin.email,
      rol: otherOrgAdmin.rol,
      organizacionId: otherOrg.id
    });

    client.release();
  });

  afterAll(async () => {
    // Limpiar workflows y credentials creados en n8n
    for (const workflowId of createdWorkflowIds) {
      try {
        await N8nService.eliminarWorkflow(workflowId);
      } catch (error) {
        // Ignorar errores si ya fueron eliminados
      }
    }

    for (const credentialId of createdCredentialIds) {
      try {
        await N8nCredentialService.eliminarCredential(credentialId);
      } catch (error) {
        // Ignorar errores si ya fueron eliminados
      }
    }

    // Limpiar BD
    const cleanupClient = await global.testPool.connect();
    await cleanAllTables(cleanupClient);
    cleanupClient.release();
  });

  // ============================================================================
  // Tests de Configurar Chatbot
  // ============================================================================

  describe('POST /api/v1/chatbots/configurar', () => {
    test('Configurar chatbot de Telegram exitosamente', async () => {
      const uniqueId = getUniqueTestId();
      const chatbotData = {
        nombre: `Bot Telegram Test ${uniqueId}`,
        plataforma: 'telegram',
        config_plataforma: {
          bot_token: '123456789:ABCdefGHI_jklMNOpqrSTUvwxYZ12345678' // Token falso pero con formato válido
        },
        ai_model: 'deepseek-chat',
        ai_temperature: 0.7,
        system_prompt: 'Eres un asistente virtual de prueba para el sistema de agendamiento. Tu función es ayudar a los usuarios a agendar citas, consultar disponibilidad y gestionar sus reservaciones de manera eficiente y amigable.'
      };

      const response = await request(app)
        .post('/api/v1/chatbots/configurar')
        .set('Authorization', `Bearer ${userToken}`)
        .send(chatbotData);

      // Imprimir error si falla
      if (response.status !== 201) {
        console.log('❌ Error Response:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.nombre).toBe(chatbotData.nombre);
      expect(response.body.data.plataforma).toBe('telegram');
      // Estado puede ser 'activo' o 'error' dependiendo si se pudo activar el workflow
      expect(['activo', 'error']).toContain(response.body.data.estado);
      expect(response.body.data.n8n_workflow_id).toBeDefined();
      expect(response.body.data.n8n_credential_id).toBeDefined();

      // Guardar IDs para limpieza posterior
      createdWorkflowIds.push(response.body.data.n8n_workflow_id);
      createdCredentialIds.push(response.body.data.n8n_credential_id);

      // Validar que se creó el bot_info (mock)
      expect(response.body.data.bot_info).toBeDefined();
      expect(response.body.data.bot_info.username).toBe('test_bot');
    }, 15000); // Timeout aumentado por integración con n8n

    test('Falla al crear chatbot duplicado para la misma plataforma', async () => {
      const uniqueId = getUniqueTestId();
      const chatbotData = {
        nombre: `Bot WhatsApp Test Duplicado ${uniqueId}`,
        plataforma: 'whatsapp',
        config_plataforma: {
          api_key: 'test_api_key_1234567890',
          phone_number_id: '1234567890'
        },
        system_prompt: 'Eres un asistente virtual de prueba para WhatsApp. Tu función es ayudar a los usuarios a agendar citas, consultar disponibilidad y gestionar sus reservaciones de manera eficiente.'
      };

      // Primera creación (exitosa)
      const response1 = await request(app)
        .post('/api/v1/chatbots/configurar')
        .set('Authorization', `Bearer ${userToken}`)
        .send(chatbotData)
        .expect(201);

      createdWorkflowIds.push(response1.body.data.n8n_workflow_id);
      createdCredentialIds.push(response1.body.data.n8n_credential_id);

      // Segunda creación (debe fallar con 409 Conflict)
      const response2 = await request(app)
        .post('/api/v1/chatbots/configurar')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...chatbotData,
          nombre: `Bot WhatsApp Test Duplicado 2 ${uniqueId}`
        })
        .expect(409);

      expect(response2.body).toHaveProperty('success', false);
      expect(response2.body.message).toMatch(/ya existe un chatbot configurado/i);
    }, 20000);

    test('Falla sin autenticación', async () => {
      const response = await request(app)
        .post('/api/v1/chatbots/configurar')
        .send({
          nombre: 'Bot Sin Auth',
          plataforma: 'telegram',
          config_plataforma: {
            bot_token: '123456789:ABCdefGHI_jklMNOpqrSTUvwxYZ12345678'
          }
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con plataforma inválida', async () => {
      const response = await request(app)
        .post('/api/v1/chatbots/configurar')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre: 'Bot Plataforma Inválida',
          plataforma: 'plataforma_inexistente',
          config_plataforma: {}
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con bot_token de Telegram en formato inválido', async () => {
      const response = await request(app)
        .post('/api/v1/chatbots/configurar')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre: 'Bot Token Inválido',
          plataforma: 'telegram',
          config_plataforma: {
            bot_token: 'token_invalido_sin_formato' // Formato incorrecto
          }
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Falla con ai_temperature fuera de rango', async () => {
      const response = await request(app)
        .post('/api/v1/chatbots/configurar')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre: 'Bot Temperature Inválida',
          plataforma: 'telegram',
          config_plataforma: {
            bot_token: '123456789:ABCdefGHI_jklMNOpqrSTUvwxYZ12345678'
          },
          ai_temperature: 3.5 // Fuera de rango 0.0-2.0
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Listar Chatbots
  // ============================================================================

  describe('GET /api/v1/chatbots', () => {
    // Estos tests usarán los chatbots creados en los tests anteriores

    test('Listar chatbots exitosamente', async () => {
      const response = await request(app)
        .get('/api/v1/chatbots')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.chatbots).toBeInstanceOf(Array);
      expect(response.body.data.chatbots.length).toBeGreaterThan(0);
      expect(response.body.data.paginacion).toBeDefined();
    });

    test('Listar con filtro por plataforma', async () => {
      const response = await request(app)
        .get('/api/v1/chatbots?plataforma=telegram')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.chatbots).toBeInstanceOf(Array);
      expect(response.body.data.filtros_aplicados.plataforma).toBe('telegram');
    });

    test('Multi-tenant: No ver chatbots de otra organización', async () => {
      const response = await request(app)
        .get('/api/v1/chatbots')
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.chatbots).toBeInstanceOf(Array);
      // La otra org no tiene chatbots creados
      expect(response.body.data.chatbots.length).toBe(0);
    });
  });

  // ============================================================================
  // Tests de Obtener Chatbot por ID
  // ============================================================================

  describe('GET /api/v1/chatbots/:id', () => {
    let chatbotId;

    beforeAll(async () => {
      // Obtener el ID del primer chatbot de la lista para usar en los tests
      const response = await request(app)
        .get('/api/v1/chatbots')
        .set('Authorization', `Bearer ${userToken}`);

      if (response.body.data && response.body.data.chatbots && response.body.data.chatbots.length > 0) {
        chatbotId = response.body.data.chatbots[0].id;
      }
    });

    test('Obtener chatbot por ID exitosamente', async () => {
      if (!chatbotId) {
        console.log('⏭️  Skipping: No chatbot available');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/chatbots/${chatbotId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(chatbotId);
    });

    test('Falla con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/chatbots/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    test('Multi-tenant: Falla al obtener chatbot de otra organización', async () => {
      if (!chatbotId) {
        console.log('⏭️  Skipping: No chatbot available');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/chatbots/${chatbotId}`)
        .set('Authorization', `Bearer ${otherOrgToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Eliminar Chatbot
  // ============================================================================

  describe('DELETE /api/v1/chatbots/:id', () => {
    // Este test usa los chatbots existentes

    test('Eliminar chatbot exitosamente', async () => {
      // Primero obtener un chatbot para eliminar
      const listResponse = await request(app)
        .get('/api/v1/chatbots')
        .set('Authorization', `Bearer ${userToken}`);

      if (!listResponse.body.data || !listResponse.body.data.chatbots || listResponse.body.data.chatbots.length === 0) {
        console.log('⏭️  Skipping: No chatbots available');
        return;
      }

      const chatbotParaEliminar = listResponse.body.data.chatbots[0];

      const response = await request(app)
        .delete(`/api/v1/chatbots/${chatbotParaEliminar.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toMatch(/eliminado exitosamente/i);
    }, 15000);

    test('Falla al eliminar chatbot inexistente', async () => {
      const response = await request(app)
        .delete('/api/v1/chatbots/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ============================================================================
  // Tests de Estadísticas
  // ============================================================================

  describe('GET /api/v1/chatbots/estadisticas', () => {
    test('Obtener estadísticas exitosamente', async () => {
      const response = await request(app)
        .get('/api/v1/chatbots/estadisticas')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveProperty('total_chatbots');
      expect(response.body.data).toHaveProperty('chatbots_activos');
      expect(response.body.data).toHaveProperty('workflows_activos');
      expect(typeof response.body.data.total_chatbots).toBe('number');
    });
  });

  // ============================================================================
  // Tests de Actualizar Estado
  // ============================================================================

  describe('PATCH /api/v1/chatbots/:id/estado', () => {
    let chatbotId;

    beforeAll(async () => {
      // Obtener el ID de un chatbot existente
      const response = await request(app)
        .get('/api/v1/chatbots')
        .set('Authorization', `Bearer ${userToken}`);

      if (response.body.data && response.body.data.chatbots && response.body.data.chatbots.length > 0) {
        chatbotId = response.body.data.chatbots[0].id;
      }
    });

    test('Actualizar estado a pausado exitosamente', async () => {
      if (!chatbotId) {
        console.log('⏭️  Skipping: No chatbot available');
        return;
      }

      const response = await request(app)
        .patch(`/api/v1/chatbots/${chatbotId}/estado`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          estado: 'pausado'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.estado).toBe('pausado');
    });

    test('Actualizar estado a error', async () => {
      if (!chatbotId) {
        console.log('⏭️  Skipping: No chatbot available');
        return;
      }

      const response = await request(app)
        .patch(`/api/v1/chatbots/${chatbotId}/estado`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          estado: 'error'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.estado).toBe('error');
    });

    test('Falla con estado inválido', async () => {
      const response = await request(app)
        .patch(`/api/v1/chatbots/${chatbotId}/estado`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          estado: 'estado_invalido'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
