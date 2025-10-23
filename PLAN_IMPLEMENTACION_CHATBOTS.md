# 📋 PLAN DE IMPLEMENTACIÓN - Sistema Multi-Plataforma de Chatbots con IA

**Versión:** 7.0
**Fecha:** 23 Octubre 2025
**Estado:** Fase 5 Completada ✅ | Fase 6 En Planificación 📝

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
| **6. MCP Server** | 📝 | Herramientas para AI Agent (En Planificación) |

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

## 📋 FASE 6: MCP SERVER (En Planificación)

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

#### Sprint 1: Setup MCP Server (5 días)
- [ ] Crear estructura `backend/mcp-server/`
- [ ] Instalar `@modelcontextprotocol/sdk`
- [ ] Implementar servidor básico con health check
- [ ] Configurar autenticación JWT con Backend
- [ ] Tests: health check + autenticación

#### Sprint 2: Implementar Tools (8 días)
- [ ] Tool: `crearCita` + tests
- [ ] Tool: `verificarDisponibilidad` + tests
- [ ] Tool: `listarServicios` + tests
- [ ] Tool: `buscarCliente` + tests
- [ ] Validaciones Joi para inputs de cada tool
- [ ] Error handling y logging

#### Sprint 3: Integración n8n (5 días)
- [ ] Actualizar `plantilla.json` con URLs MCP Server
- [ ] Configurar 3 nodos MCP Client en workflow
- [ ] Testing E2E: Telegram → AI Agent → MCP Tools → Backend
- [ ] Documentación de uso para AI Agent
- [ ] Deployment MCP Server en Docker

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

## 📚 REFERENCIAS

- **CLAUDE.md:** Arquitectura general del proyecto
- **ANEXO_CODIGO_CHATBOTS.md:** Código detallado de implementación
- **Tests Backend:** `backend/app/__tests__/endpoints/chatbots.test.js`
- **n8n API Docs:** https://docs.n8n.io/api/
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **MCP Protocol:** https://modelcontextprotocol.io/

---

**Última actualización:** 23 Octubre 2025
**Estado:** ✅ Fase 5 Producción | 📝 Fase 6 En Planificación
**Próximo Hito:** Iniciar Sprint 1 de MCP Server
