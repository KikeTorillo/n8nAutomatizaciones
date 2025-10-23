# 📦 ANEXO DE CÓDIGO - Sistema Multi-Plataforma de Chatbots

**Versión:** 7.0
**Fecha:** 23 Octubre 2025
**Estado:** Fase 5 Completada ✅

> Referencia técnica de implementación. Consultar archivos originales para código completo.

---

## 📑 ÍNDICE

1. [Fase 1: Base de Datos](#fase-1-base-de-datos)
2. [Fase 2: Servicios n8n](#fase-2-servicios-n8n)
3. [Fase 3: Backend CRUD](#fase-3-backend-crud)
4. [Fase 4: Template Engine](#fase-4-template-engine)
5. [Fase 5: Frontend](#fase-5-frontend)

---

## FASE 1: BASE DE DATOS

### Archivos SQL

**Ubicación:** `sql/schema/`

#### 1.1 ENUMs

**Archivo:** `01-types-and-enums.sql`

```sql
-- Plataformas soportadas
CREATE TYPE plataforma_chatbot AS ENUM (
    'telegram', 'whatsapp', 'instagram',
    'facebook_messenger', 'slack', 'discord', 'otro'
);

-- Estados del ciclo de vida
CREATE TYPE estado_chatbot AS ENUM (
    'configurando', 'activo', 'error', 'pausado', 'desactivado'
);

-- Ampliar rol_usuario con 'bot'
ALTER TYPE rol_usuario ADD VALUE 'bot';
```

#### 1.2 Tablas

**Archivo:** `06-operations-tables.sql`

**chatbot_config (20 columnas):**
- Identificación: `id`, `organizacion_id`, `nombre`, `plataforma`
- Config: `config_plataforma` (JSONB flexible)
- n8n: `n8n_workflow_id`, `n8n_credential_id`, `workflow_activo`
- IA: `ai_model`, `ai_temperature`, `system_prompt`
- Estado: `estado`, `activo`, `ultimo_mensaje_recibido`
- Métricas: `total_mensajes_procesados`, `total_citas_creadas`
- Timestamps: `creado_en`, `actualizado_en`

**Constraints:**
- UNIQUE: `(organizacion_id, plataforma)`
- CHECK: `ai_temperature BETWEEN 0.0 AND 2.0`

**chatbot_credentials (auditoría):**
- Tracking de credentials creadas en n8n
- Campos: `n8n_credential_id`, `credential_type`, `is_valid`, `last_used`

#### 1.3 Índices

**Archivo:** `07-indexes.sql`

8 índices optimizados:
- `idx_chatbot_organizacion` - Búsqueda por org
- `idx_chatbot_workflow` - Por workflow ID (UNIQUE)
- `idx_chatbot_estado` - Filtro por estado + activo
- `idx_chatbot_plataforma` - Por plataforma
- `idx_chatbot_org_plataforma` - Covering index
- `idx_chatbot_config_jsonb` - GIN para JSONB
- `idx_chatbot_created` - Ordenamiento temporal

#### 1.4 Functions

**Archivo:** `02-functions.sql`

**crear_usuario_bot_organizacion():**
- Trigger AFTER INSERT en `organizaciones`
- Crea usuario con rol 'bot' automáticamente
- Email: `bot@org{id}.internal`
- Password: 32 bytes aleatorios (bcrypt)

**obtener_usuario_bot(org_id):**
- SECURITY DEFINER para bypass RLS
- Retorna usuario bot de la organización

#### 1.5 RLS Policies

**Archivo:** `08-rls-policies.sql`

**chatbot_config_tenant_isolation:**
- Bypass si `app.bypass_rls = 'true'`
- Bypass para `super_admin`
- Filtro por `organizacion_id` para usuarios normales

**chatbot_credentials_tenant_isolation:**
- Aislamiento vía JOIN con `chatbot_config.organizacion_id`

---

## FASE 2: SERVICIOS N8N

### Archivos Backend

**Ubicación:** `backend/app/services/`

#### 2.1 n8nService.js

**Cliente Axios:**
- Base URL: `process.env.N8N_API_URL`
- Header: `X-N8N-API-KEY`
- Timeout: 10s
- Interceptors: logging requests/responses

**Métodos (11):**
1. `listarWorkflows(filters)` - GET /api/v1/workflows
2. `obtenerWorkflow(id)` - GET /api/v1/workflows/:id
3. `crearWorkflow(data)` - POST /api/v1/workflows
4. `actualizarWorkflow(id, updates)` - PUT /api/v1/workflows/:id
5. `activarWorkflow(id)` - POST /api/v1/workflows/:id/activate
6. `desactivarWorkflow(id)` - POST /api/v1/workflows/:id/deactivate
7. `eliminarWorkflow(id)` - DELETE /api/v1/workflows/:id
8. `verificarEstado(id)` - Wrapper de obtenerWorkflow

**Error Handling:**
- 404: Workflow no encontrado
- 400: Workflow sin nodos trigger (no se puede activar)

#### 2.2 n8nCredentialService.js

**Mapeo de tipos:**
```javascript
const CREDENTIAL_TYPES = {
    telegram: 'telegramApi',
    whatsapp: 'httpHeaderAuth',
    instagram: 'facebookGraphApi',
    facebook_messenger: 'facebookGraphApi',
    slack: 'slackApi',
    discord: 'discordApi'
};
```

**Métodos:**
- `crearCredential({ plataforma, nombre, config, organizacion_id })`
- `crearCredentialTelegram(data)` - Específico Telegram
- `crearCredentialWhatsApp(data)` - Específico WhatsApp
- `obtenerCredential(id)`
- `actualizarCredential(id, updates)`
- `eliminarCredential(id)`

#### 2.3 n8nGlobalCredentialsService.js

**Credentials compartidas:**
- **DeepSeek:** Modelo IA (var env: `DEEPSEEKAPIKEY`)
- **PostgreSQL:** Chat Memory (var env: `CHAT_DB_*`)
- **Redis:** Anti-flood (var env: `REDIS_*`)

**Pattern:**
1. Verificar si existe ID en `.env`
2. Si no existe, crear credential en n8n
3. Loggear warning para agregar ID al `.env`
4. Retornar `{ id, name, type }`

**Fix PostgreSQL (líneas 149-156):**
```javascript
// Campos SSH requeridos por schema n8n (aunque no se use SSH)
sshAuthenticateWith: 'password',
sshHost: '',
sshPort: 22,
sshUser: '',
sshPassword: '',
privateKey: '',
passphrase: ''
```

#### 2.4 telegramValidator.js

**Ubicación:** `backend/app/services/platformValidators/`

**Regex Token:**
```javascript
const TELEGRAM_TOKEN_REGEX = /^\d{8,10}:[A-Za-z0-9_-]{35,}$/;
```

**Métodos:**
- `validar(botToken)` - Valida formato + llama API Telegram
- `validarFormato(botToken)` - Solo regex
- `obtenerInfoBot(botToken)` - GET https://api.telegram.org/bot{token}/getMe

**Output:**
```javascript
{
  valido: boolean,
  bot_info?: {
    id, username, first_name,
    can_join_groups, can_read_all_group_messages,
    supports_inline_queries
  },
  error?: string
}
```

---

## FASE 3: BACKEND CRUD

### Archivos Core

#### 3.1 chatbot-config.model.js

**Ubicación:** `backend/app/database/chatbot-config.model.js`

**Patrón RLS:** 100% uso de `RLSContextManager.query()`

**Métodos CRUD (13):**

**Escritura:**
- `crear(chatbotData)` - INSERT con validación constraints
- `actualizar(id, data, orgId)` - UPDATE campos permitidos
- `actualizarEstado(id, estado, orgId)` - Solo campo estado
- `actualizarWorkflow(id, workflowData, orgId)` - n8n fields
- `incrementarMetricas(id, orgId, { mensajes, citas })` - Counters

**Lectura:**
- `obtenerPorId(id, orgId)`
- `obtenerPorPlataforma(plataforma, orgId)` - Para validar duplicados
- `obtenerPorWorkflowId(workflowId, orgId)`
- `listarPorOrganizacion(orgId, filtros, paginacion)` - Con WHERE dinámico
- `obtenerEstadisticas(orgId)` - Agregaciones

**Eliminación:**
- `eliminar(id, orgId)` - Soft delete (activo = false)
- `eliminarPermanente(id, orgId)` - Hard delete (CASCADE)

**Error Handling:**
- 23505: Duplicate key (UNIQUE constraint)
- 23514: Check constraint (temperatura)
- 23503: Foreign key (organización no existe)

#### 3.2 chatbot.controller.js

**Ubicación:** `backend/app/controllers/chatbot.controller.js`

**Endpoint Principal: `configurar()`** (líneas 36-216)

**Flujo completo:**
1. Verificar duplicados (409 Conflict)
2. Validar credenciales con plataforma
3. Crear credential en n8n
4. Generar system prompt (647 chars)
5. Cargar plantilla.json
6. Obtener credentials globales
7. Reemplazar credentials en nodos
8. Limpiar campos read-only (líneas 502-529)
9. Crear workflow en n8n
10. Activar workflow
11. Guardar en BD

**Rollback Strategy:**
```javascript
try {
  credential = await createCredential();
  workflow = await createWorkflow();
  chatbot = await saveToDb();
} catch (error) {
  await deleteWorkflow(workflow);
  await deleteCredential(credential);
  throw error;
}
```

**Otros Endpoints (7):**
- `listar()` - GET con filtros
- `obtener(id)` - GET por ID
- `actualizar(id)` - PUT
- `eliminar(id)` - DELETE con cascade n8n
- `obtenerEstadisticas()` - GET /estadisticas
- `actualizarEstado(id)` - PATCH /estado

**Método `_generarWorkflowTemplate()`** (líneas 425-539):
1. Leer `flows/plantilla/plantilla.json`
2. Actualizar nombre workflow
3. Reemplazar credentials por tipo de nodo:
   - Telegram: `credentialId` del bot
   - DeepSeek: `globalCreds.deepseek.id`
   - PostgreSQL: `globalCreds.postgres.id`
   - Redis: `globalCreds.redis.id`
4. Actualizar system prompt en AI Agent
5. Limpiar campos auto-generados (id, webhookId, assignments[].id, conditions[].id)

#### 3.3 chatbot.schemas.js

**Ubicación:** `backend/app/schemas/chatbotSchema.js`

**Schemas Joi (8):**

1. **configurar** - Validación dinámica con `Joi.when('plataforma')`
2. **listar** - Filtros + paginación
3. **obtenerPorId** - Param ID
4. **actualizar** - Campos opcionales (min 1 requerido)
5. **eliminar** - Solo param ID
6. **actualizarEstado** - Estado válido (ENUM)
7. **obtenerEstadisticas** - Sin params

**Constantes exportadas:**
```javascript
PLATAFORMAS_VALIDAS (7)
ESTADOS_VALIDOS (5)
MODELOS_IA_VALIDOS (7)
TELEGRAM_TOKEN_REGEX
```

**Config por plataforma:**
```javascript
// Telegram
configTelegramSchema = {
  bot_token: Joi.string().pattern(TELEGRAM_TOKEN_REGEX).required(),
  webhook_url: Joi.string().uri().optional(),
  allowed_updates: Joi.array().items(Joi.string()).optional()
}

// WhatsApp
configWhatsAppSchema = {
  api_key: Joi.string().min(10).required(),
  phone_number_id: Joi.string().required(),
  business_account_id: Joi.string().optional()
}
```

#### 3.4 chatbots.routes.js

**Ubicación:** `backend/app/routes/api/v1/chatbots.js`

**Stack Middleware Estándar:**
```javascript
router.METHOD('/path',
    rateLimiting.apiRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    validation.validate(schema),
    Controller.method
);
```

**7 Rutas:**
- `POST /configurar` - heavyOperationRateLimit
- `GET /` - listar
- `GET /estadisticas` - ANTES de `/:id` para evitar conflicto
- `GET /:id` - obtener
- `PUT /:id` - actualizar
- `PATCH /:id/estado` - cambiar estado
- `DELETE /:id` - requiere `auth.requireAdminRole`

#### 3.5 Tests

**Ubicación:** `backend/app/__tests__/endpoints/chatbots.test.js`

**18 Tests implementados:**

**Setup:**
- Mock de `TelegramValidator` (retorna siempre válido)
- Limpieza BD con `cleanAllTables()`
- Limpieza n8n workflows/credentials en `afterEach()`

**Tests:**
1. ✅ Crear chatbot Telegram exitosamente
2. ✅ 409 si ya existe chatbot para plataforma
3. ✅ 400 si falta nombre
4. ✅ 400 si falta plataforma
5. ✅ 400 si falta config_plataforma
6. ✅ 400 si bot_token formato inválido
7. ✅ 400 si Telegram API rechaza token
8. ✅ Listar chatbots de la organización
9. ✅ Array vacío si no hay chatbots
10. ✅ Filtrar por plataforma
11. ✅ Filtrar por estado
12. ✅ Obtener chatbot por ID
13. ✅ 404 si chatbot no existe
14. ✅ Actualizar chatbot
15. ✅ Eliminar chatbot + workflow + credential
16. ✅ 404 al eliminar chatbot inexistente
17. ✅ Obtener estadísticas
18. ✅ Actualizar estado del chatbot

**Ejecutar:**
```bash
docker exec back npm test -- __tests__/endpoints/chatbots.test.js
```

---

## FASE 4: TEMPLATE ENGINE

### 4.1 plantilla.json

**Ubicación:** `backend/app/flows/plantilla/plantilla.json`

**Estructura Workflow (15 nodos):**

#### Nodos de Flujo Principal (9)

1. **Telegram Trigger** (`n8n-nodes-base.telegramTrigger`)
   - Updates: `['message']`
   - Credential: reemplazada dinámicamente

2. **Edit Fields** (`n8n-nodes-base.set`)
   - Extrae: `sender`, `conversation`, `sessionId`
   - 3 assignments (IDs limpiados en controller)

3. **Redis Push** (`n8n-nodes-base.redis`)
   - Operation: `push`
   - List key: `{{ $json.sender }}`
   - Tail: true

4. **Wait** (`n8n-nodes-base.wait`)
   - Amount: 20 segundos (debouncing)

5. **Redis Get** (`n8n-nodes-base.redis`)
   - Operation: `get`
   - Key: `{{ $('Redis').item.json.sender }}`

6. **If** (`n8n-nodes-base.if`)
   - Condición: último mensaje == mensaje actual
   - Rama TRUE: procesar
   - Rama FALSE: no operation

7. **Redis Delete** (`n8n-nodes-base.redis`)
   - Operation: `delete`
   - Key: limpiar después de procesar

8. **Send Message** (`n8n-nodes-base.telegram`)
   - Chat ID: `{{ $('Telegram Trigger').item.json.message.from.id }}`
   - Text: `{{ $json.output }}` (del AI Agent)

9. **No Operation** (`n8n-nodes-base.noOp`)
   - Rama alternativa (sin mensajes nuevos)

#### Nodos IA (6)

10. **AI Agent** (`@n8n/n8n-nodes-langchain.agent`)
    - System message: reemplazado dinámicamente
    - Conectado a: Chat Model, Memory, 3 Tools

11. **DeepSeek Chat Model** (`@n8n/n8n-nodes-langchain.lmChatDeepSeek`)
    - Credential global compartida

12. **Postgres Chat Memory** (`@n8n/n8n-nodes-langchain.memoryPostgresChat`)
    - Session ID: `{{ $('Redis').item.json.sender }}`
    - Credential global PostgreSQL

13-15. **MCP Client x3** (`@n8n/n8n-nodes-langchain.mcpClientTool`)
    - Placeholders sin configurar (Fase 6)

**Limpieza de Campos (controller:502-529):**
```javascript
// Workflow level
delete plantilla.id;
delete plantilla.versionId;
delete plantilla.meta;
delete plantilla.pinData;
delete plantilla.tags;
delete plantilla.active;

// Node level
plantilla.nodes.forEach(node => {
  delete node.id;
  delete node.webhookId;

  // Nested IDs
  if (node.parameters?.assignments?.assignments) {
    node.parameters.assignments.assignments.forEach(a => delete a.id);
  }
  if (node.parameters?.conditions?.conditions) {
    node.parameters.conditions.conditions.forEach(c => delete c.id);
  }
});
```

---

## FASE 5: FRONTEND

### 5.1 useChatbots.js

**Ubicación:** `frontend/src/hooks/useChatbots.js`

**7 Hooks React Query:**

**Queries (2):**
1. `useChatbots(params)` - Lista con filtros
2. `useChatbot(id)` - Detalle por ID

**Mutations (5):**
3. `useConfigurarTelegram()` - **Principal** para onboarding
4. `useActualizarChatbot()` - Update
5. `useEliminarChatbot()` - Delete
6. `useCambiarEstadoChatbot()` - Toggle activo/pausado
7. `useEstadisticasChatbot(id)` - Métricas

**Fix System Prompt (líneas 53-55):**
```javascript
// ✅ NO enviar system_prompt - el backend lo generará
// data.descripcion es solo descripción corta, no el system prompt
const payload = {
  nombre: data.nombre,
  plataforma: 'telegram',
  config_plataforma: { bot_token: data.bot_token },
  ai_model: data.configuracion?.ai_model || 'deepseek-chat',
  ai_temperature: data.configuracion?.ai_temperature || 0.7,
  // NO incluir system_prompt aquí
};
```

**Invalidación Cache:**
```javascript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['chatbots'] });
  queryClient.invalidateQueries({ queryKey: ['chatbot', data.id] });
}
```

### 5.2 Step7_WhatsAppIntegration.jsx

**Ubicación:** `frontend/src/pages/onboarding/steps/Step7_WhatsAppIntegration.jsx`

**Validación Zod:**
```javascript
const telegramSchema = z.object({
  bot_token: z.string()
    .min(1, 'Token requerido')
    .regex(/^\d{8,10}:[A-Za-z0-9_-]{35,}$/, 'Formato inválido'),
  nombre_bot: z.string().min(3).max(100),
  descripcion: z.string().max(500).optional()
});
```

**Flow onSubmit:**
1. Llamar `configurarTelegramMutation.mutateAsync()`
2. Guardar resultado en `onboardingStore`
3. Toast success
4. `nextStep()` al resumen

**Instrucciones @BotFather:**
- Colapsables con `showInstructions` state
- Link a https://t.me/BotFather
- Pasos numerados para crear bot

**Opción Skip:**
```javascript
handleSkip() {
  updateFormData('telegram', {
    configurado: false,
    omitido: true
  });
  nextStep();
}
```

### 5.3 endpoints.js

**Ubicación:** `frontend/src/services/api/endpoints.js`

**Módulo chatbotsApi:**
```javascript
export const chatbotsApi = {
  configurarTelegram: (data) => client.post('/chatbots/configurar', data),
  listar: (params) => client.get('/chatbots', { params }),
  obtener: (id) => client.get(`/chatbots/${id}`),
  actualizar: (id, data) => client.put(`/chatbots/${id}`, data),
  eliminar: (id) => client.delete(`/chatbots/${id}`),
  cambiarEstado: (id, estado) => client.patch(`/chatbots/${id}/estado`, { estado }),
  obtenerEstadisticas: (id, params) => client.get(`/chatbots/${id}/estadisticas`, { params })
};
```

**Client Axios:**
- Base URL: `process.env.VITE_API_URL`
- Auto-refresh JWT en 401
- Interceptors para tokens

---

## 📋 RESUMEN DE ARCHIVOS

### Backend (11 archivos core)

| Tipo | Archivo | Líneas | Descripción |
|------|---------|--------|-------------|
| Controller | `chatbot.controller.js` | 543 | 8 endpoints + template engine |
| Model | `chatbot-config.model.js` | 546 | 13 métodos CRUD con RLS |
| Routes | `chatbots.js` | ~100 | 7 rutas + middleware stack |
| Schema | `chatbotSchema.js` | ~300 | 8 schemas Joi |
| Service | `n8nService.js` | 716 | 11 métodos API workflows |
| Service | `n8nCredentialService.js` | ~400 | CRUD credentials |
| Service | `n8nGlobalCredentialsService.js` | 263 | Credentials globales |
| Validator | `telegramValidator.js` | ~100 | Validación Telegram API |
| Tests | `chatbots.test.js` | ~500 | 18 tests E2E |

### Frontend (4 archivos core)

| Tipo | Archivo | Líneas | Descripción |
|------|---------|--------|-------------|
| Hook | `useChatbots.js` | 135 | 7 hooks React Query |
| Page | `Step7_WhatsAppIntegration.jsx` | ~300 | Form + validación Zod |
| API | `endpoints.js` | ~50 | Módulo chatbotsApi |
| Store | `onboardingStore.js` | ~200 | Estado Telegram |

### Database (6 archivos SQL)

| Archivo | Descripción |
|---------|-------------|
| `01-types-and-enums.sql` | 2 ENUMs + ampliación rol_usuario |
| `02-functions.sql` | 2 funciones PL/pgSQL |
| `06-operations-tables.sql` | 2 tablas (20 + 7 columnas) |
| `07-indexes.sql` | 8 índices optimizados |
| `08-rls-policies.sql` | 2 políticas RLS |
| `09-triggers.sql` | 2 triggers automáticos |

### Template

| Archivo | Descripción |
|---------|-------------|
| `plantilla.json` | 15 nodos n8n, 466 líneas JSON |

---

## 🔗 DEPENDENCIAS CLAVE

### Backend NPM
```json
{
  "axios": "^1.6.0",
  "joi": "^17.11.0",
  "winston": "^3.11.0"
}
```

### Frontend NPM
```json
{
  "@tanstack/react-query": "^5.90.2",
  "react-hook-form": "^7.64.0",
  "@hookform/resolvers": "^3.3.0",
  "zod": "^4.1.12",
  "axios": "^1.12.2"
}
```

### n8n Nodes
- `n8n-nodes-base` (Telegram, Redis, Set, Wait, If, NoOp)
- `@n8n/n8n-nodes-langchain` (AI Agent, DeepSeek, Memory, MCP Client)

---

## 📚 REFERENCIAS AL CÓDIGO FUENTE

Para ver el código completo, consultar los archivos originales:

**Backend:**
- `backend/app/controllers/chatbot.controller.js:1-543`
- `backend/app/database/chatbot-config.model.js:1-546`
- `backend/app/services/n8nService.js:1-716`
- `backend/app/services/n8nGlobalCredentialsService.js:1-263`

**Frontend:**
- `frontend/src/hooks/useChatbots.js:1-135`
- `frontend/src/pages/onboarding/steps/Step7_WhatsAppIntegration.jsx:1-300`

**SQL:**
- `sql/schema/01-types-and-enums.sql` (líneas ENUMs chatbot)
- `sql/schema/06-operations-tables.sql` (líneas tablas chatbot)

**Template:**
- `backend/app/flows/plantilla/plantilla.json:1-466`

---

**Última actualización:** 23 Octubre 2025
**Estado:** ✅ Código completo y validado (Fase 5)
**Próximo:** Ver `PLAN_IMPLEMENTACION_CHATBOTS.md` para Fase 6 (MCP Server)
