# 📋 PLAN DE IMPLEMENTACIÓN - Sistema Multi-Plataforma de Chatbots con IA

**Versión:** 7.2
**Fecha:** 24 Octubre 2025
**Estado:** Fase 5 Completada ✅ | Fase 6 En Progreso 🚧 (95% completado)

---

## 📊 PROGRESO GENERAL

| Fase | Estado | Descripción |
|------|--------|-------------|
| **0. Setup Inicial** | ✅ | Docker, n8n, PostgreSQL, Redis configurados |
| **1. Base de Datos** | ✅ | Tablas, ENUMs, RLS, triggers, índices |
| **2. Integración n8n** | ✅ | Servicios API workflows/credentials |
| **3. Backend CRUD** | ✅ | Model, Controller, Routes, Schemas, Tests (18/18 ✅) |
| **4. Template Engine** | ✅ | plantilla.json con 15 nodos + credentials globales |
| **5. Frontend Onboarding** | ✅ | Step 7 + hooks React Query |
| **6. MCP Server** | 🚧 | MCP Server + credentials httpHeaderAuth operativos (95%) |
| **7. System Prompt Personalizable** | 📋 | Próximo: Análisis e implementación |

---

## 🎯 LOGROS PRINCIPALES

### ✅ Creación End-to-End de Chatbot Telegram

**Flujo Completo Implementado:**

```
Usuario → Formulario Telegram
         ↓
    Backend API (/chatbots/configurar)
    ├─ Validar token con Telegram API
    ├─ Crear credential en n8n
    ├─ Generar workflow desde plantilla.json
    ├─ Activar workflow automáticamente
    └─ Guardar en BD (chatbot_config)
         ↓
    Bot Activo en Telegram
    (IA: DeepSeek + Chat Memory + Redis Anti-flood)
```

**Componentes del Workflow (15 nodos):**
- Telegram Trigger → Edit Fields → Redis Queue (anti-flood)
- Wait 20s (debouncing) → Redis Get → If (nuevos mensajes?)
- AI Agent (DeepSeek + PostgreSQL Memory + 3 MCP Clients)
- Send Message → No Operation

---

## 🔧 PROBLEMAS CRÍTICOS RESUELTOS

| # | Problema | Solución Aplicada | Archivo |
|---|----------|-------------------|---------|
| 1 | Schema PostgreSQL n8n rechaza credential | Agregar campos SSH vacíos | `n8nGlobalCredentialsService.js` |
| 2 | Regex token Telegram muy estricto | Cambiar a `/^\d{8,10}:[A-Za-z0-9_-]{35,}$/` | `Step7_WhatsAppIntegration.jsx` |
| 3 | n8n rechaza campos auto-generados | Eliminar `id`, `versionId`, `meta`, `pinData`, `tags`, `webhookId`, etc. | `chatbot.controller.js:502-529` |
| 4 | System prompt < 100 chars (constraint BD) | Backend genera prompt de 647 chars, frontend NO envía | `useChatbots.js:53-55` |
| 5 | MCP Client nodes sin autenticación visible | Implementar credentials `httpHeaderAuth` dinámicas (1 por org) | `n8nMcpCredentialsService.js` |
| 6 | serverUrl (v1.1) → endpointUrl (v1.2) | Migración automática en controller + actualizar typeVersion | `chatbot.controller.js:538-548` |
| 7 | Conexiones MCP Client desactualizadas | Corregir nombres en connections de plantilla.json | `plantilla.json:427-459` |

---

## 📝 COMPONENTES IMPLEMENTADOS

### Backend (8 archivos)
```
controllers/
  └─ chatbot.controller.js        (8 endpoints, rollback strategy)
database/
  └─ chatbot-config.model.js      (13 métodos CRUD con RLS)
routes/api/v1/
  └─ chatbots.js                  (7 rutas + middleware stack)
schemas/
  └─ chatbotSchema.js             (8 schemas Joi con validación dinámica)
services/
  ├─ n8nService.js                (11 métodos API workflows)
  ├─ n8nCredentialService.js      (CRUD credentials por plataforma)
  ├─ n8nGlobalCredentialsService.js (DeepSeek, PostgreSQL, Redis)
  └─ platformValidators/
      └─ telegramValidator.js     (Validación con Telegram API)
```

### Frontend (4 archivos)
```
pages/onboarding/steps/
  └─ Step7_WhatsAppIntegration.jsx  (Form + validación Zod)
hooks/
  └─ useChatbots.js                 (7 hooks React Query)
services/api/
  └─ endpoints.js                   (API chatbots + configurarTelegram)
store/
  └─ onboardingStore.js             (Estado Telegram)
```

### Base de Datos
```sql
-- ENUMs
plataforma_chatbot (7 valores)
estado_chatbot (5 valores)

-- Tablas
chatbot_config (20 columnas)
  - Constraint UNIQUE: (organizacion_id, plataforma)
  - JSONB: config_plataforma
  - Métricas: total_mensajes_procesados, total_citas_creadas

chatbot_credentials (auditoría)
  - Tracking de credentials n8n

-- RLS Policies (2)
-- Índices (8 optimizados)
-- Triggers (timestamps automáticos)
```

### Template n8n
```
flows/plantilla/plantilla.json
  - 15 nodos configurados
  - Credentials dinámicas (Telegram + globales)
  - System prompt personalizable
  - Anti-flood con Redis (20s debouncing)
  - Chat Memory persistente (PostgreSQL)
  - 3 MCP Client placeholders (Fase 6)
```

---

## 🔑 CONFIGURACIÓN REQUERIDA

### Variables .env Mínimas

```bash
# n8n (auto-generadas por setup)
N8N_API_KEY=<generada-automaticamente>
N8N_API_URL=http://n8n-main:5678

# Modelos IA
DEEPSEEKAPIKEY=sk-xxx

# PostgreSQL Chat Memory
CHAT_DB_HOST=postgres
CHAT_DB_NAME=chat_memories_db
CHAT_DB_USER=n8n_app
CHAT_DB_PASSWORD=<password-seguro>

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Opcional: IDs de credentials globales (para evitar recrear)
N8N_DEEPSEEK_CREDENTIAL_ID=<id>
N8N_POSTGRES_CREDENTIAL_ID=<id>
N8N_REDIS_CREDENTIAL_ID=<id>
```

---

## 🚀 COMANDOS ESENCIALES

```bash
# Desarrollo
npm run dev                      # Levantar stack completo
docker logs -f back              # Ver logs backend
docker exec back npm test -- __tests__/endpoints/chatbots.test.js

# Debugging
docker exec postgres_db psql -U admin -d postgres -c \
  "SELECT id, nombre, plataforma, estado, workflow_activo FROM chatbot_config;"

# Acceso n8n UI
# http://localhost:5678
# Credenciales en .env (N8N_OWNER_EMAIL / N8N_OWNER_PASSWORD)
```

---

## 📋 FASE 6: MCP SERVER (En Progreso - 95% ✅)

### 📍 ESTADO ACTUAL (24 Octubre 2025)

#### ✅ Completado

**MCP Server Operativo:**
- ✅ Estructura `backend/mcp-server/` creada
- ✅ Servidor MCP levantado en puerto 3100
- ✅ Health check endpoint funcionando (`/health`, `/mcp/tools`)
- ✅ Autenticación JWT multi-tenant implementada
  - **ESTRATEGIA:** 1 credential `httpHeaderAuth` por organización (compartida entre chatbots)
  - Token JWT único por organización con `organizacion_id` embebido
  - Validación con middleware `authMiddleware.js`
  - RLS aplicado según `organizacion_id` del token
- ✅ 4 Tools MCP implementados y operativos:
  1. `crearCita` - Crea citas validando disponibilidad
  2. `verificarDisponibilidad` - Consulta horarios libres
  3. `listarServicios` - Obtiene catálogo con precios
  4. `buscarCliente` - Búsqueda fuzzy por teléfono/nombre
- ✅ Integración con Backend API REST vía `apiClient.js`
- ✅ Dockerfile y docker-compose configurados
- ✅ **NUEVO:** Servicio `n8nMcpCredentialsService.js` implementado
  - Método `obtenerOCrearPorOrganizacion()`
  - Reutilización inteligente de credentials
  - Naming convention: `"MCP Auth - Org {organizacion_id}"`
- ✅ **NUEVO:** Credentials MCP configuradas en nodos MCP Client
  - Campo `authentication: "headerAuth"` en parameters
  - Campo `credentials.httpHeaderAuth` con ID y nombre
  - Migración automática `serverUrl` → `endpointUrl` (v1.1 → v1.2)
  - TypeVersion actualizado a 1.2
- ✅ **NUEVO:** Conexiones corregidas en `plantilla.json`
  - Nombres de nodos MCP Client actualizados en objeto `connections`
  - AI Agent correctamente vinculado a los 3 tools MCP

**Testing Realizado:**
- ✅ MCP Server responde correctamente con JWT válido
- ✅ Endpoint `/mcp/tools` retorna 4 tools con schemas completos
- ✅ Validación de token JWT con `aud: "mcp-server"` e `iss: "saas-backend"`
- ✅ Workflow de Telegram se ejecuta exitosamente
- ✅ **NUEVO:** Credential MCP creada y vinculada correctamente (verificado vía n8n API)
- ✅ **NUEVO:** Nodos MCP Client muestran `endpointUrl` y `authentication` configurados
- ✅ **NUEVO:** Onboarding completo E2E exitoso (Barbería Test MCP 2, workflow ID: Jqdi55lNpiOlrdRE)

#### ⏳ Pendiente (5% Restante)

**Próximas Tareas:**

1. **Testing E2E Completo con Telegram Real** (1-2 horas)
   - [ ] Enviar mensaje al bot configurado
   - [ ] Verificar que AI Agent ejecuta MCP tools
   - [ ] Validar logs del MCP Server con requests reales
   - [ ] Confirmar creación de cita en base de datos

2. **Análisis System Prompt Personalizable** (PRÓXIMO PASO)
   - [ ] Analizar sistema actual de generación de prompts
   - [ ] Diseñar estrategia de personalización por organización
   - [ ] Proponer estructura de datos (BD o configuración dinámica)
   - [ ] Implementar UI/backend para personalización

---

### 🎯 Objetivo

Dotar al AI Agent de herramientas (tools) para interactuar con el backend y realizar acciones reales:
- Crear citas
- Verificar disponibilidad de profesionales
- Listar servicios disponibles
- Buscar clientes existentes

### 🏗️ Arquitectura Propuesta

```
Telegram User → n8n Workflow → AI Agent
                                  ↓
                           MCP Client Tools (x3)
                                  ↓
                            MCP Server (Node.js)
                                  ↓
                           Backend API REST
                                  ↓
                          PostgreSQL (SaaS DB)
```

### 📦 Componentes a Implementar

#### 6.1 MCP Server (Node.js)

**Ubicación:** `backend/mcp-server/`

```
backend/mcp-server/
├── index.js                  # Servidor MCP principal
├── package.json              # Dependencies: @modelcontextprotocol/sdk
├── tools/
│   ├── crearCita.js         # Tool: Crear nueva cita
│   ├── verificarDisponibilidad.js  # Tool: Consultar horarios libres
│   ├── listarServicios.js   # Tool: Obtener catálogo de servicios
│   └── buscarCliente.js     # Tool: Buscar cliente por teléfono/nombre
├── config/
│   └── auth.js              # Autenticación con Backend API
└── utils/
    └── apiClient.js         # Axios client para Backend
```

**Tecnologías:**
- Runtime: Node.js 20+
- MCP SDK: `@modelcontextprotocol/sdk`
- HTTP Client: Axios
- Auth: JWT tokens del Backend
- Puerto: `3100` (configurable)

#### 6.2 Tools (Herramientas MCP)

##### Tool 1: `crearCita`

**Descripción:** Crea una nueva cita en el sistema de agendamiento

**Inputs:**
```typescript
{
  fecha: string;           // "DD/MM/YYYY"
  hora: string;            // "HH:MM" formato 24hrs
  profesional_id: number;  // ID del barbero/estilista
  servicio_id: number;     // ID del servicio (corte, barba, etc)
  cliente: {
    nombre: string;
    telefono: string;
    email?: string;
  };
  notas?: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  cita_id?: number;
  codigo_cita?: string;    // ej: "ORG001-20251023-001"
  mensaje: string;
  error?: string;
}
```

**Backend Endpoint:** `POST /api/v1/citas`

---

##### Tool 2: `verificarDisponibilidad`

**Descripción:** Verifica horarios disponibles de un profesional en una fecha

**Inputs:**
```typescript
{
  profesional_id: number;
  fecha: string;           // "DD/MM/YYYY"
  duracion?: number;       // minutos (default: 30)
}
```

**Output:**
```typescript
{
  fecha: string;
  profesional: {
    id: number;
    nombre: string;
  };
  horarios_disponibles: [
    { hora: "09:00", disponible: true },
    { hora: "09:30", disponible: false },
    // ...
  ];
  total_disponibles: number;
}
```

**Backend Endpoint:** `GET /api/v1/citas/disponibilidad`

---

##### Tool 3: `listarServicios`

**Descripción:** Lista servicios activos de la organización

**Inputs:**
```typescript
{
  activo?: boolean;        // Filtrar solo activos (default: true)
}
```

**Output:**
```typescript
{
  servicios: [
    {
      id: number;
      nombre: string;
      duracion_minutos: number;
      precio: number;
      descripcion: string;
      profesionales_ids: number[];  // IDs de profesionales que ofrecen este servicio
    }
  ];
  total: number;
}
```

**Backend Endpoint:** `GET /api/v1/servicios`

---

##### Tool 4: `buscarCliente`

**Descripción:** Busca un cliente existente por teléfono o nombre

**Inputs:**
```typescript
{
  busqueda: string;        // Teléfono o nombre
  tipo?: 'telefono' | 'nombre';  // Auto-detect si no se especifica
}
```

**Output:**
```typescript
{
  encontrado: boolean;
  cliente?: {
    id: number;
    nombre: string;
    telefono: string;
    email: string;
    ultima_cita?: string;  // Fecha última cita
  };
  mensaje: string;
}
```

**Backend Endpoint:** `GET /api/v1/clientes/buscar`

---

#### 6.3 Autenticación MCP Server → Backend

**Estrategia:** JWT Service Account

1. Crear usuario `mcp-service` con rol especial `mcp_bot`
2. Generar JWT de larga duración (180 días, renovable)
3. MCP Server usa JWT en header `Authorization: Bearer <token>`
4. Backend valida JWT y extrae `organizacion_id` del context

**Variables .env MCP Server:**
```bash
MCP_PORT=3100
BACKEND_API_URL=http://back:3000
MCP_JWT_TOKEN=<token-servicio>
```

**Generación de token:**
```bash
# Script de setup
docker exec back node scripts/generate-mcp-token.js
```

#### 6.4 Configuración en n8n Workflow

**Actualizar plantilla.json:**

```json
{
  "type": "@n8n/n8n-nodes-langchain.mcpClientTool",
  "name": "MCP Client - Crear Cita",
  "parameters": {
    "serverUrl": "http://mcp-server:3100",
    "tool": "crearCita",
    "options": {}
  }
}
```

**3 Nodos MCP Client:**
1. `MCP Client` → `crearCita`
2. `MCP Client1` → `verificarDisponibilidad`
3. `MCP Client2` → `listarServicios` + `buscarCliente`

---

#### 6.5 Testing MCP Server

**Archivo:** `backend/mcp-server/__tests__/tools.test.js`

```bash
# Tests unitarios de cada tool
npm test

# Test E2E con Backend mock
npm run test:e2e

# Test integración con n8n workflow
docker exec back npm test -- __tests__/integration/mcp-workflow.test.js
```

---

### 📅 Plan de Implementación Fase 6

#### Sprint 1: Setup MCP Server ✅ COMPLETADO
- [x] Crear estructura `backend/mcp-server/`
- [x] Instalar `@modelcontextprotocol/sdk`
- [x] Implementar servidor básico con health check
- [x] Configurar autenticación JWT con Backend
- [x] Tests: health check + autenticación

#### Sprint 2: Implementar Tools ✅ COMPLETADO
- [x] Tool: `crearCita` + tests
- [x] Tool: `verificarDisponibilidad` + tests
- [x] Tool: `listarServicios` + tests
- [x] Tool: `buscarCliente` + tests
- [x] Validaciones Joi para inputs de cada tool
- [x] Error handling y logging

#### Sprint 3: Integración n8n ✅ COMPLETADO (95%)
- [x] Actualizar `plantilla.json` con URLs MCP Server
- [x] Configurar 3 nodos MCP Client en workflow
- [x] Crear credentials `httpHeaderAuth` dinámicas (1 por org)
- [x] Implementar servicio `n8nMcpCredentialsService.js`
- [x] Migración `serverUrl` → `endpointUrl` (v1.1 → v1.2)
- [x] Corregir conexiones AI Agent → MCP Client Tools
- [ ] Testing E2E completo: Telegram → AI Agent → MCP Tools → Backend (95%, falta prueba real)
- [x] Documentación de uso para AI Agent
- [x] Deployment MCP Server en Docker

#### 🆕 Sprint 0: System Prompt Personalizable (PRÓXIMO - Fase 7)

**Objetivo:** Permitir que cada organización personalice el system prompt de su chatbot según sus necesidades específicas.

**Análisis Actual:**
- ✅ System prompt se genera dinámicamente en backend (`_generarSystemPrompt()`)
- ✅ Incluye datos del bot (nombre, username) obtenidos de Telegram API
- ✅ Incluye `organizacion_id` y `plataforma` automáticamente
- ⚠️ Contenido del prompt es **estático** (plantilla hardcodeada)
- ⚠️ No hay forma de personalizar según:
  - Servicios específicos de la organización
  - Horarios de atención
  - Profesionales disponibles
  - Políticas de cancelación
  - Tono de comunicación (formal/casual)
  - Idioma regional

**Tareas de Análisis:**

1. **Diseño de Estrategia de Personalización** (2-3 horas)
   - [ ] Analizar casos de uso de personalización
   - [ ] Definir campos personalizables del prompt
   - [ ] Diseñar estructura de datos (JSON schema)
   - [ ] Evaluar opciones de almacenamiento:
     - Opción A: Campo `system_prompt` en `chatbot_config` (editable por usuario)
     - Opción B: Tabla `prompt_templates` con versionado
     - Opción C: Variables de template con datos dinámicos de la org
   - [ ] Evaluar integración con datos de organización (servicios, profesionales, horarios)

2. **Propuesta de Implementación Backend** (Pendiente)
   - [ ] Modificar schema de BD si necesario
   - [ ] Implementar método de personalización en controller
   - [ ] Crear endpoint para actualizar system prompt
   - [ ] Validación de longitud y contenido

3. **Propuesta de Implementación Frontend** (Pendiente)
   - [ ] Diseñar UI para editor de prompt (textarea avanzado)
   - [ ] Implementar preview del prompt generado
   - [ ] Variables dinámicas disponibles para interpolación
   - [ ] Validación en tiempo real

4. **Variables Dinámicas Sugeridas:**
   - `{{bot_name}}` - Nombre del bot
   - `{{organization_name}}` - Nombre de la organización
   - `{{services}}` - Lista de servicios automática
   - `{{professionals}}` - Lista de profesionales
   - `{{schedule}}` - Horarios de atención
   - `{{policies}}` - Políticas de la empresa
   - `{{contact}}` - Información de contacto

**Estimación:** 3-5 días (análisis + implementación)

**Criterios de Éxito:**
- [ ] Cada organización puede personalizar su system prompt
- [ ] Prompt incluye datos dinámicos de la organización (servicios, profesionales)
- [ ] UI intuitiva para editar el prompt
- [ ] Preview del prompt antes de guardar
- [ ] Validaciones de longitud y coherencia
- [ ] Tests de actualización de prompt + regeneración de workflow

#### Sprint 4: Validación y Monitoreo (3 días)
- [ ] Pruebas de usuario con bot real
- [ ] Monitoreo de latencia MCP Server → Backend
- [ ] Logs estructurados (Winston)
- [ ] Alertas de errores (webhooks a Slack/Discord)
- [ ] Documentación final

**Total:** ~21 días (1 mes)

---

### 🎯 Criterios de Éxito Fase 6

- [ ] MCP Server responde en < 500ms
- [ ] AI Agent puede crear citas exitosamente via Telegram
- [ ] Tests E2E pasando (min 20 tests)
- [ ] Logs estructurados en JSON
- [ ] Documentación completa de tools
- [ ] Zero downtime deployment (Docker)

---

### 🔒 Consideraciones de Seguridad

1. **Rate Limiting:** MCP Server debe tener rate limits por organización
2. **JWT Rotation:** Tokens MCP deben rotar cada 180 días
3. **Input Validation:** Validar TODOS los inputs con Joi antes de llamar Backend
4. **Audit Log:** Registrar todas las acciones de tools (quién, cuándo, qué)
5. **Timeout:** Todas las llamadas a Backend con timeout 10s

---

## 📋 FASE 7: SYSTEM PROMPT PERSONALIZABLE (Próxima - 0% 📋)

### 🎯 Objetivo

Implementar un sistema que permita a cada organización personalizar el system prompt de su chatbot según:
- Servicios específicos ofrecidos
- Horarios de atención
- Profesionales disponibles
- Políticas internas (cancelación, pagos, etc.)
- Tono de comunicación (formal/casual)
- Idioma y modismos regionales

### 📊 Situación Actual

**Generación Actual del System Prompt:**

```javascript
// chatbot.controller.js línea 600-618
static _generarSystemPrompt(plataforma, botInfo, organizacionId) {
    const botName = botInfo?.first_name || 'Asistente Virtual';
    const username = botInfo?.username ? `@${botInfo.username}` : '';

    return `Eres ${botName} ${username}, un asistente virtual inteligente...

Tu misión es ayudar a los clientes a:
- Agendar nuevas citas
- Consultar sus citas existentes
...

IMPORTANTE:
- Sé amable, profesional y empático
- Organización ID: ${organizacionId}
- Plataforma: ${plataforma}
...`;
}
```

**Problemas Identificados:**
- 🔴 **Contenido estático** - No refleja servicios/profesionales reales de cada negocio
- 🔴 **No personalizable** - Usuario no puede modificar el prompt
- 🔴 **Plantilla genérica** - No se adapta a industrias específicas (barbería vs spa vs clínica)
- 🟡 **Falta contexto de negocio** - No incluye horarios, políticas, precios reales

### 🏗️ Propuestas de Implementación

#### **Opción A: Prompt Editable Simple**

**Ventajas:**
- ✅ Implementación rápida (1-2 días)
- ✅ Control total del usuario
- ✅ Sin complejidad de template engine

**Desventajas:**
- ❌ Usuario debe escribir todo el prompt manualmente
- ❌ Sin ayuda para estructura correcta
- ❌ No integra datos dinámicos de la org

**Implementación:**
```javascript
// BD: Usar campo existente system_prompt en chatbot_config
// Frontend: Textarea grande con contador de caracteres
// Backend: Validar longitud (100-5000 chars)
```

---

#### **Opción B: Template con Variables Dinámicas** ⭐ **RECOMENDADA**

**Ventajas:**
- ✅ Balance entre flexibilidad y estructura
- ✅ Integra datos reales de la organización automáticamente
- ✅ Usuario puede personalizar secciones clave
- ✅ Mantiene calidad del prompt (estructura válida)

**Desventajas:**
- 🟡 Requiere template engine simple (Handlebars/Mustache)
- 🟡 Implementación media (3-4 días)

**Ejemplo de Template:**
```handlebars
Eres {{bot_name}} {{bot_username}}, asistente virtual de {{organization_name}}.

SERVICIOS DISPONIBLES:
{{#each services}}
- {{name}} ({{duration}} min) - ${{price}}
{{/each}}

PROFESIONALES:
{{#each professionals}}
- {{name}} - {{specialty}}
{{/each}}

HORARIOS DE ATENCIÓN:
{{schedule}}

POLÍTICAS:
{{custom_policies}}

Tu misión es ayudar a los clientes a:
- Agendar citas (verificando disponibilidad real)
- {{custom_tasks}}
```

**Variables Disponibles:**
```javascript
{
  bot_name: "Bot Barbería Pro",
  bot_username: "@barberia_bot",
  organization_name: "Barbería Suavecito",
  services: [
    { name: "Corte", duration: 30, price: 150 },
    { name: "Barba", duration: 20, price: 100 }
  ],
  professionals: [
    { name: "Luis Enrique", specialty: "Barbero Senior" },
    { name: "Diego", specialty: "Estilista" }
  ],
  schedule: "Lunes a Sábado 9:00 - 18:00",
  custom_policies: "Cancelaciones con 24hrs de anticipación",
  custom_tasks: "Resolver dudas sobre productos"
}
```

---

#### **Opción C: Tabla de Templates por Industria**

**Ventajas:**
- ✅ Templates pre-diseñados profesionales
- ✅ Versionado y A/B testing
- ✅ Fácil cambiar de template sin reescribir

**Desventajas:**
- ❌ Complejidad alta (5-7 días)
- ❌ Requiere mantener múltiples templates
- ❌ Migración compleja

---

### 📝 Plan de Implementación (Opción B)

#### Sprint 1: Análisis y Diseño (1 día)
- [ ] Documentar casos de uso de personalización
- [ ] Diseñar schema de variables dinámicas
- [ ] Crear 3 templates de ejemplo (barbería, spa, clínica)
- [ ] Definir límites de personalización

#### Sprint 2: Backend (2 días)
- [ ] Instalar template engine (Handlebars.js)
- [ ] Crear servicio `PromptGeneratorService.js`
  - Método: `generarPrompt(templateStr, organizacionId, botInfo)`
  - Método: `obtenerVariablesOrganizacion(organizacionId)`
- [ ] Modificar `_generarSystemPrompt()` para usar template
- [ ] Crear endpoint `PUT /api/v1/chatbots/:id/system-prompt`
- [ ] Tests unitarios (min 10 casos)

#### Sprint 3: Frontend (2 días)
- [ ] Página de configuración del prompt en dashboard
- [ ] Editor con sintaxis highlighting para variables
- [ ] Preview en tiempo real del prompt generado
- [ ] Lista de variables disponibles con documentación
- [ ] Validaciones (longitud, variables válidas)
- [ ] Botón "Restaurar template por defecto"

#### Sprint 4: Testing E2E (1 día)
- [ ] Actualizar prompt desde UI
- [ ] Verificar regeneración de workflow en n8n
- [ ] Validar nuevo prompt en AI Agent
- [ ] Testing conversacional con diferentes prompts
- [ ] Documentación de usuario

---

### 🎯 Criterios de Éxito

- [ ] Usuario puede personalizar secciones clave del prompt
- [ ] Variables dinámicas se interpolan automáticamente
- [ ] Prompt actualizado se refleja en workflow de n8n
- [ ] Preview muestra prompt final antes de guardar
- [ ] No rompe funcionalidad del AI Agent
- [ ] Tests E2E pasando

---

## 📚 REFERENCIAS

- **CLAUDE.md:** Arquitectura general del proyecto
- **ANEXO_CODIGO_CHATBOTS.md:** Código detallado de implementación
- **Tests Backend:** `backend/app/__tests__/endpoints/chatbots.test.js`
- **n8n API Docs:** https://docs.n8n.io/api/
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **MCP Protocol:** https://modelcontextprotocol.io/

---

**Última actualización:** 24 Octubre 2025 - 01:00
**Estado:** ✅ Fase 5 Producción | 🚧 Fase 6 En Progreso (95%)
**Próximo Hito:** Fase 7 - Análisis e Implementación de System Prompt Personalizable por Organización
**Estimación:** 3-5 días (análisis + implementación + testing)
