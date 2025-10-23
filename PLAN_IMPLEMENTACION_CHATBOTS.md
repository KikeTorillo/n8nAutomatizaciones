# 📋 PLAN DE IMPLEMENTACIÓN - Sistema Multi-Plataforma de Chatbots con IA

**Versión:** 4.0
**Fecha:** 22 Octubre 2025
**Estado:** Fase 3 Completada ✅

---

## 🎯 OBJETIVO

Desarrollar un sistema **agnóstico de plataforma** que permita a cada organización conectar chatbots de IA en cualquier canal de mensajería (Telegram, WhatsApp, Instagram, Facebook Messenger, etc.).

---

## 📊 PROGRESO GENERAL

| Fase | Estado | Progreso | Validación |
|------|--------|----------|------------|
| **0. Setup Inicial** | ✅ | 100% | ✅ `npm run dev` automatizado |
| **1. Base de Datos** | ✅ | 100% | ✅ Usuario bot auto-creado, RLS validado |
| **2. Integración n8n** | ✅ | 100% | ✅ Workflows con webhook creados vía API |
| **3. Backend CRUD** | ✅ | 100% | ✅ 18/18 tests pasando, UI validada en n8n |
| **4. MCP Server** | ⏳ | 0% | Pendiente |
| **5. Workflow Templates** | ⏳ | 0% | Pendiente |
| **6. Testing Final** | ⏳ | 0% | Pendiente |

---

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────────────────────────────┐
│  CANALES → N8N WORKFLOWS → MCP SERVER → BACKEND → DB   │
│  [Telegram/WhatsApp] → [AI Agent] → [Tools] → [API]    │
└─────────────────────────────────────────────────────────┘
```

**Decisiones clave:**
- 1 usuario bot automático por organización (trigger SQL)
- 1 workflow por plataforma por organización
- Credentials en n8n, referenciadas en `chatbot_config`
- MCP Server independiente para tools del AI Agent
- Chat Memory en PostgreSQL de n8n

---

## ✅ FASE 0: Setup Inicial (COMPLETADO)

**Comando:** `npm run dev`

**Auto-genera:**
- ✅ n8n owner account
- ✅ n8n API Key (con actualización de .env)
- ✅ Backend inicia con API Key correcta

**Tiempo:** 3-5 minutos

---

## ✅ FASE 1: Base de Datos (COMPLETADO)

### Implementado:

**ENUMs:**
```sql
CREATE TYPE rol_usuario AS ENUM (..., 'bot');
CREATE TYPE plataforma_chatbot AS ENUM ('telegram', 'whatsapp', ...);
CREATE TYPE estado_chatbot AS ENUM ('configurando', 'activo', ...);
```

**Tablas:**
- `chatbot_config` (20 columnas, JSONB config, métricas)
- `chatbot_credentials` (8 columnas, auditoría)

**Triggers:**
- `trigger_crear_usuario_bot` → Crea usuario bot al insertar organización

**Functions:**
- `crear_usuario_bot_organizacion()` → Genera email `bot@org{id}.internal`
- `obtener_usuario_bot(org_id)` → Security definer para obtener bot

**RLS Policies:**
- Tenant isolation para `chatbot_config` y `chatbot_credentials`
- Super_admin bypass

**Índices:**
- 10 índices (incluyendo GIN en JSONB)

**Validación:**
```bash
# Verificar trigger funciona:
docker exec postgres_db psql -U admin -d postgres -c "
  SELECT u.email, u.rol, o.nombre_comercial
  FROM usuarios u
  JOIN organizaciones o ON u.organizacion_id = o.id
  WHERE u.rol = 'bot';
"
```

---

## ✅ FASE 2: Integración n8n (COMPLETADO)

### Servicios Implementados:

#### 1. `n8nService.js`

**Métodos:**
- `listarWorkflows(filters)`
- `obtenerWorkflow(workflowId)`
- `crearWorkflow(workflowData)`
- `actualizarWorkflow(workflowId, updates)`
- `activarWorkflow(workflowId)` → `POST /activate`
- `desactivarWorkflow(workflowId)` → `POST /deactivate`
- `eliminarWorkflow(workflowId)`
- `verificarEstado(workflowId)`

**Cliente:**
```javascript
const n8nClient = axios.create({
    baseURL: process.env.N8N_API_URL || 'http://n8n-main:5678',
    headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json'
    }
});
```

**Archivos:** `/backend/app/services/n8nService.js`

#### 2. `n8nCredentialService.js`

**Métodos:**
- `listarCredentials()` → Retorna [] (n8n no expone endpoint)
- `obtenerCredential(credentialId)`
- `crearCredentialTelegram({ name, bot_token, organizacion_id })`
- `crearCredentialWhatsApp({ name, api_key, organizacion_id })`
- `crearCredential({ plataforma, nombre, config, organizacion_id })`
- `actualizarCredential(credentialId, updates)`
- `eliminarCredential(credentialId)`
- `existeCredential(credentialId)`

**Mapeo:**
```javascript
const CREDENTIAL_TYPES = {
    telegram: 'telegramApi',
    whatsapp: 'httpHeaderAuth',
    instagram: 'facebookGraphApi',
    // ...
};
```

**Archivos:** `/backend/app/services/n8nCredentialService.js`

#### 3. `telegramValidator.js`

**Métodos:**
- `validar(botToken)` → Llama a Telegram API `/getMe`
- `validarFormato(botToken)` → Regex `/^\d{8,10}:[A-Za-z0-9_-]{35}$/`
- `obtenerInfoBot(botToken)` → GET `https://api.telegram.org/bot{token}/getMe`
- `extraerBotId(botToken)` → Extrae ID del token
- `validarConfiguracion(config)` → Valida config completa

**Archivos:** `/backend/app/services/platformValidators/telegramValidator.js`

### Endpoints n8n Descubiertos:

**Workflows:**
- ✅ `GET /api/v1/workflows` - Listar
- ✅ `POST /api/v1/workflows` - Crear
- ✅ `GET /api/v1/workflows/{id}` - Obtener
- ✅ `PUT /api/v1/workflows/{id}` - Actualizar (requiere todos campos)
- ✅ `POST /api/v1/workflows/{id}/activate` - **Activar**
- ✅ `POST /api/v1/workflows/{id}/deactivate` - **Desactivar**
- ✅ `DELETE /api/v1/workflows/{id}` - Eliminar

**Credentials:**
- ✅ `POST /api/v1/credentials` - Crear
- ✅ `GET /api/v1/credentials/{id}` - Obtener
- ✅ `PATCH /api/v1/credentials/{id}` - Actualizar
- ✅ `DELETE /api/v1/credentials/{id}` - Eliminar
- ❌ No existe endpoint para listar todas (por seguridad)

### Restricciones Importantes:

1. **Campo `active` es read-only** en PUT → Usar `/activate` y `/deactivate`
2. **PATCH no soportado** en workflows → Solo PUT
3. **Workflows requieren trigger** → Webhook/Poller/Telegram para activar
4. **PUT requiere campos completos** → name, nodes, connections, settings

### Tests:

**Archivo:** `/backend/app/test-n8n-services.js`

**Ejecutar:**
```bash
docker exec back node test-n8n-services.js
```

**Resultado esperado:**
```
✅ TODOS LOS TESTS PASARON

✓ N8nService.listarWorkflows()
✓ N8nService.crearWorkflow()
✓ N8nService.obtenerWorkflow()
✓ N8nService.activarWorkflow()
✓ N8nService.desactivarWorkflow()
✓ N8nService.eliminarWorkflow()
✓ N8nCredentialService.listarCredentials()
```

**Workflow de prueba creado:**
```javascript
{
    name: 'Test Workflow - Auto',
    nodes: [
        { /* Webhook trigger */ },
        { /* Respond to Webhook */ }
    ],
    connections: { /* ... */ },
    settings: { saveManualExecutions: true }
}
```

**Validación en UI:** El workflow aparece en http://localhost:5678/home/workflows con 2 nodos visibles

---

## ✅ FASE 3: Backend CRUD (COMPLETADO)

### Implementado:

#### Models (`/backend/app/database/`)

**chatbot-config.model.js:**
- ✅ `crear(data)` → INSERT con RLS (organizacion_id en data)
- ✅ `obtenerPorId(id, organizacionId)` → SELECT con validación
- ✅ `obtenerPorPlataforma(plataforma, organizacionId)` → Búsqueda específica
- ✅ `listarPorOrganizacion(organizacionId, filtros, paginacion)` → Con paginación
- ✅ `actualizar(id, data, organizacionId)` → UPDATE parcial
- ✅ `actualizarEstado(id, estado, organizacionId)` → Cambio de estado
- ✅ `eliminar(id, organizacionId)` → Soft delete (activo = false)
- ✅ `obtenerEstadisticas(organizacionId)` → Métricas agregadas

**Patrón RLS:**
```javascript
const data = await RLSContextManager.query(organizacionId, async (db) => {
    return await db.query('SELECT * FROM chatbot_config WHERE id = $1', [id]);
});
```

#### Schemas (`/backend/app/schemas/`)

**chatbotSchema.js:**
```javascript
// ✅ Implementado con soporte multi-plataforma
const configurarChatbotSchema = Joi.object({
    nombre: Joi.string().min(3).max(255).required(),
    plataforma: Joi.string().valid(
        'telegram', 'whatsapp', 'instagram',
        'facebook_messenger', 'slack', 'discord', 'otro'
    ).required(),
    config_plataforma: Joi.object().required(),
    ai_model: Joi.string().max(100).default('deepseek-chat'),
    ai_temperature: Joi.number().min(0).max(2).default(0.7),
    system_prompt: Joi.string().min(100).optional()
});

// Schema específico para Telegram con validación de token
const configurarTelegramSchema = Joi.object({
    nombre: Joi.string().min(3).max(255).required(),
    plataforma: Joi.string().valid('telegram').required(),
    config_plataforma: Joi.object({
        bot_token: Joi.string().pattern(/^\d{8,10}:[A-Za-z0-9_-]{35}$/).required()
    }).required(),
    ai_model: Joi.string().max(100).optional(),
    ai_temperature: Joi.number().min(0).max(2).optional(),
    system_prompt: Joi.string().min(100).optional()
});
```

#### Controllers (`/backend/app/controllers/`)

**chatbotController.js:**
```javascript
// ✅ Implementado con flujo completo de configuración
class ChatbotController {
    static configurar = asyncHandler(async (req, res) => {
        // 1. ✅ Verificar chatbot no existe para la plataforma
        // 2. ✅ Validar credenciales con platformValidator (Telegram)
        // 3. ✅ Crear credential en n8n
        // 4. ✅ Generar system prompt personalizado
        // 5. ✅ Crear workflow con template básico
        // 6. ✅ Activar workflow
        // 7. ✅ Guardar en chatbot_config
        // 8. ✅ Rollback automático en caso de error
    });

    static listar = asyncHandler(async (req, res) => {
        // ✅ Filtros: plataforma, estado, activo, workflow_activo
        // ✅ Paginación: pagina, limite
    });

    static obtener = asyncHandler(async (req, res) => {
        // ✅ Por ID con validación multi-tenant
    });

    static actualizar = asyncHandler(async (req, res) => {
        // ✅ Actualización parcial
    });

    static eliminar = asyncHandler(async (req, res) => {
        // ✅ Cascade: workflow + credential + BD
    });

    static obtenerEstadisticas = asyncHandler(async (req, res) => {
        // ✅ Métricas: total, por estado, mensajes, citas
    });

    static actualizarEstado = asyncHandler(async (req, res) => {
        // ✅ Cambio de estado
    });
}
```

#### Routes (`/backend/app/routes/api/v1/`)

**chatbots.js:**
```javascript
// ✅ 7 endpoints implementados con stack completo de middleware
const router = Router();

// POST /api/v1/chatbots/configurar
router.post('/configurar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.configurarChatbotSchema),
    ChatbotController.configurar
);

// GET /api/v1/chatbots
router.get('/', auth.authenticateToken, tenant.setTenantContext,
    rateLimiting.apiRateLimit, ChatbotController.listar);

// GET /api/v1/chatbots/estadisticas
router.get('/estadisticas', auth.authenticateToken, tenant.setTenantContext,
    rateLimiting.apiRateLimit, ChatbotController.obtenerEstadisticas);

// GET /api/v1/chatbots/:id
router.get('/:id', auth.authenticateToken, tenant.setTenantContext,
    rateLimiting.apiRateLimit, ChatbotController.obtener);

// PUT /api/v1/chatbots/:id
router.put('/:id', auth.authenticateToken, tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarChatbotSchema),
    ChatbotController.actualizar);

// PATCH /api/v1/chatbots/:id/estado
router.patch('/:id/estado', auth.authenticateToken, tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(schemas.actualizarEstadoChatbotSchema),
    ChatbotController.actualizarEstado);

// DELETE /api/v1/chatbots/:id
router.delete('/:id', auth.authenticateToken, tenant.setTenantContext,
    rateLimiting.apiRateLimit, ChatbotController.eliminar);
```

#### Tests

**chatbots.test.js:** ✅ **18/18 tests pasando**

**Suite de Tests:**
```bash
PASS  __tests__/endpoints/chatbots.test.js (11.874 s)
  Chatbot Controller API - Integración n8n
    POST /api/v1/chatbots/configurar
      ✓ debería crear chatbot Telegram exitosamente (3492 ms)
      ✓ debería retornar 409 si ya existe chatbot para la plataforma (1147 ms)
      ✓ debería retornar 400 si falta nombre (158 ms)
      ✓ debería retornar 400 si falta plataforma (174 ms)
      ✓ debería retornar 400 si falta config_plataforma (155 ms)
      ✓ debería retornar 400 si bot_token tiene formato inválido (176 ms)
      ✓ debería retornar 400 si Telegram API rechaza el token (299 ms)
    GET /api/v1/chatbots
      ✓ debería listar chatbots de la organización (2161 ms)
      ✓ debería retornar array vacío si no hay chatbots (109 ms)
      ✓ debería filtrar por plataforma (2009 ms)
      ✓ debería filtrar por estado (2034 ms)
    GET /api/v1/chatbots/:id
      ✓ debería obtener un chatbot por ID (2060 ms)
      ✓ debería retornar 404 si chatbot no existe (1143 ms)
    PUT /api/v1/chatbots/:id
      ✓ debería actualizar un chatbot (2076 ms)
    DELETE /api/v1/chatbots/:id
      ✓ debería eliminar chatbot, workflow y credential (2060 ms)
      ✓ debería retornar 404 si chatbot no existe (1121 ms)
    GET /api/v1/chatbots/estadisticas
      ✓ debería obtener estadísticas de chatbots (2074 ms)
    PATCH /api/v1/chatbots/:id/estado
      ✓ debería actualizar el estado de un chatbot (2087 ms)

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

**Validaciones Cubiertas:**
- ✅ Creación completa de chatbot con credential y workflow en n8n
- ✅ Validación de token con Telegram API
- ✅ Prevención de duplicados (409 Conflict)
- ✅ Validaciones de esquema Joi
- ✅ Multi-tenant isolation
- ✅ Cascade delete (workflow + credential + BD)
- ✅ Filtros y paginación
- ✅ Estadísticas agregadas
- ✅ Actualización de estado

**Validación en UI n8n:**
- ✅ Workflow visible en http://localhost:5678
- ✅ 2 nodos conectados (Telegram Trigger → Send Message)
- ✅ Credential vinculada correctamente

---

## ⏳ FASES 4-6 (PENDIENTES)

Ver documento completo para detalles de:
- **Fase 4:** MCP Server (auth, tools, API client)
- **Fase 5:** Workflow Templates (builder, promptBuilder)
- **Fase 6:** Testing E2E completo

---

## 📋 CHECKLIST PRE-IMPLEMENTACIÓN FASE 3

**Backend:**
- [ ] Leer `CLAUDE.md` - Patrón RLSContextManager
- [ ] Revisar estructura de models existentes en `/backend/app/database/`
- [ ] Entender stack de middleware (auth → tenant → validation)
- [ ] Revisar helpers: ResponseHelper, ValidationHelper

**Testing:**
- [ ] Tener bot de prueba en Telegram (@BotFather)
- [ ] Configurar Postman/Thunder Client
- [ ] Script para limpiar workflows de prueba en n8n

---

## 📚 ARCHIVOS CLAVE

| Archivo | Estado | Ubicación |
|---------|--------|-----------|
| ENUMs | ✅ | `sql/schema/01-types-and-enums.sql` |
| Tablas | ✅ | `sql/schema/06-operations-tables.sql` |
| Triggers | ✅ | `sql/schema/09-triggers.sql` |
| Functions | ✅ | `sql/schema/02-functions.sql` |
| RLS Policies | ✅ | `sql/schema/08-rls-policies.sql` |
| Índices | ✅ | `sql/schema/07-indexes.sql` |
| n8nService | ✅ | `backend/app/services/n8nService.js` |
| n8nCredentialService | ✅ | `backend/app/services/n8nCredentialService.js` |
| telegramValidator | ✅ | `backend/app/services/platformValidators/telegramValidator.js` |
| Test n8n | ✅ | `backend/app/test-n8n-services.js` |
| chatbot-config.model | ✅ | `backend/app/database/chatbot-config.model.js` |
| chatbot.controller | ✅ | `backend/app/controllers/chatbot.controller.js` |
| chatbotSchema | ✅ | `backend/app/schemas/chatbotSchema.js` |
| routes/chatbots | ✅ | `backend/app/routes/api/v1/chatbots.js` |
| chatbots.test | ✅ | `backend/app/__tests__/endpoints/chatbots.test.js` |

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Levantar proyecto desde cero: `docker compose down -v && npm run dev`
2. ✅ Validar Fase 1 y 2 completadas
3. ✅ Implementar Fase 3: Backend CRUD
4. 🔄 Implementar Fase 4: MCP Server
5. ⏳ Implementar Fase 5: Workflow Templates
6. ⏳ Testing E2E final

### Comandos para Ejecutar Tests

```bash
# Ejecutar todos los tests de chatbots
docker exec back npm test -- __tests__/endpoints/chatbots.test.js

# Ver workflows creados en n8n
# http://localhost:5678
# Credenciales: admin@saas-agendamiento.local / OVoy0WDEVjRtAyQwffFK7Q5KkXvjBzFO
```

---

**Última actualización:** 22 Octubre 2025
**Estado:** Fase 3 completada (18/18 tests ✅), listo para Fase 4: MCP Server

> 💡 **Consultar:** `ANEXO_CODIGO_CHATBOTS.md` para implementación detallada de código
