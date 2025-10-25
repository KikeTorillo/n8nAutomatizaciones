# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 24 Octubre 2025

| Componente | Estado | Métricas |
|------------|--------|----------|
| **Backend API** | ✅ Operativo | 13 módulos, 97 archivos, 495 tests (100%) |
| **Frontend React** | ✅ Operativo | 45 componentes, 22 páginas, 12 hooks |
| **Base de Datos** | ✅ Operativo | 19 tablas, 24 RLS policies, 114 índices |
| **Sistema IA** | ✅ Operativo | n8n + Telegram + DeepSeek + Redis + MCP Server |
| **MCP Server** | ✅ Operativo | 4 tools, JSON-RPC 2.0, JWT multi-tenant |
| **Docker** | ✅ Running | 8 contenedores activos |

---

## 🛠 Stack Técnico

### Frontend
- **Framework**: React 19.1.1 + Vite 7.1.7
- **State**: Zustand 5.0.8 + TanStack React Query 5.90.2
- **Forms**: React Hook Form 7.64.0 + Zod 4.1.12
- **HTTP**: Axios 1.12.2 (auto-refresh JWT)
- **UI**: Tailwind CSS 3.4.18 + Lucide Icons

### Backend
- **Runtime**: Node.js + Express.js
- **Auth**: JWT (7d access + 30d refresh)
- **Validación**: Joi schemas modulares
- **Testing**: Jest + Supertest (495 tests)
- **Logs**: Winston (JSON structured)

### Base de Datos
- **PostgreSQL 17 Alpine**
- **Multi-Tenant**: Row Level Security (24 políticas)
- **Índices**: 114 optimizados (GIN, trigram, covering)
- **Triggers**: 29 automáticos
- **Funciones**: 38 PL/pgSQL

### IA Conversacional
- **Orquestación**: n8n workflows (15 nodos)
- **Plataformas**: Telegram Bot API (activo), WhatsApp (planificado)
- **Modelo**: DeepSeek (económico + potente)
- **Memory**: PostgreSQL Chat Memory (RLS por usuario)
- **Anti-flood**: Redis Queue (20s debouncing)
- **MCP Server**: JSON-RPC 2.0 con 4 tools operativas
  - `listarServicios` - Lista servicios activos
  - `verificarDisponibilidad` - Verifica horarios libres
  - `buscarCliente` - Busca clientes existentes
  - `crearCita` - Crea citas validadas

---

## 📝 Comandos Esenciales

```bash
# Desarrollo
npm run dev                      # Levantar stack completo
docker logs -f back              # Ver logs backend
docker logs -f n8n-main          # Ver logs n8n
docker logs -f mcp-server        # Ver logs MCP Server

# Tests
docker exec back npm test                                   # Suite completa (495 tests)
docker exec back npm test -- __tests__/endpoints/chatbots.test.js  # Módulo específico

# Base de Datos
docker exec postgres_db psql -U admin -d postgres -c "SELECT id, nombre, plataforma, estado FROM chatbot_config;"

# MCP Server
curl http://localhost:3100/health              # Health check
curl http://localhost:3100/mcp/tools           # Listar tools disponibles

# n8n UI
# http://localhost:5678
# Credenciales en .env (N8N_OWNER_EMAIL / N8N_OWNER_PASSWORD)
```

---

## 🏗 Arquitectura del Sistema

### Backend (97 archivos)

**Módulos de Negocio (13):**
1. `auth` - Autenticación JWT + password recovery
2. `usuarios` - Gestión usuarios + RBAC
3. `organizaciones` - Multi-tenancy
4. `tipos-profesional` - Tipos dinámicos (33 sistema + custom)
5. `tipos-bloqueo` - Tipos bloqueo dinámicos
6. `profesionales` - Prestadores servicios
7. `servicios` - Catálogo servicios
8. `clientes` - Base clientes (búsqueda fuzzy)
9. `horarios-profesionales` - Disponibilidad semanal
10. `citas` - Agendamiento (base, operacional, recordatorios)
11. `bloqueos-horarios` - Bloqueos temporales
12. `planes` - Planes y suscripciones
13. **`chatbots`** ⭐ **Nuevo** - Chatbots IA multi-plataforma (Telegram, WhatsApp)

**Estructura:**
- **Controllers**: 16 archivos
- **Models**: 17 archivos (RLS 100%)
- **Routes**: 14 archivos
- **Schemas**: 12 archivos Joi
- **Services**: 11 archivos (n8n, validators, etc.)
- **Middleware**: 6 archivos (34 funciones)
- **Tests**: 23 archivos (495 tests)

**Helpers Esenciales:**
- `RLSContextManager` (v2.0) ⭐ **Usar siempre** - Gestión automática RLS
- `helpers.js` - 8 clases (Response, Validation, Date, CodeGenerator, etc.)

### Frontend (45 componentes, 12 hooks)

**Componentes:** Organizados en 11 módulos
- auth, citas, clientes, profesionales, servicios, bloqueos
- dashboard, common, forms, ui
- **chatbots** ⭐ **Nuevo** - Step 7 onboarding Telegram

**Hooks Personalizados (12):**
- `useAuth`, `useCitas`, `useClientes`, `useBloqueos`
- `useProfesionales`, `useServicios`, `useHorarios`
- `useEstadisticas`, `useTiposProfesional`, `useTiposBloqueo`
- **`useChatbots`** ⭐ **Nuevo** - CRUD chatbots (7 hooks)
- `useToast`

**API Endpoints (14 módulos):**
- `authApi`, `usuariosApi`, `organizacionesApi`
- `tiposProfesionalApi`, `tiposBloqueoApi`
- `profesionalesApi`, `serviciosApi`, `horariosApi`
- `clientesApi`, `citasApi`, `bloqueosApi`
- `planesApi`
- **`chatbotsApi`** ⭐ **Nuevo** - Configuración chatbots

### Base de Datos (19 Tablas)

```
Core (3):           organizaciones, usuarios, planes_subscripcion
Catálogos (2):      tipos_profesional, tipos_bloqueo
Negocio (5):        profesionales, servicios, clientes,
                    servicios_profesionales, horarios_profesionales
Operaciones (2):    citas, bloqueos_horarios
Chatbots (2):       chatbot_config, chatbot_credentials ⭐ NUEVO
Subscripciones (3): subscripciones, historial_subscripciones,
                    metricas_uso_organizacion
Sistema (2):        eventos_sistema, eventos_sistema_archivo
```

**ENUMs (10 tipos):**
- `rol_usuario` (6): super_admin, admin, propietario, empleado, cliente, **bot** ⭐
- `industria_tipo` (11): barberia, salon_belleza, estetica, spa, etc.
- `plan_tipo` (5): trial, basico, profesional, empresarial, custom
- `estado_subscripcion` (5): activa, suspendida, cancelada, trial, morosa
- `estado_cita` (6): pendiente, confirmada, en_curso, completada, cancelada, no_asistio
- `estado_franja` (4): disponible, reservado_temporal, ocupado, bloqueado
- **`plataforma_chatbot` (7)** ⭐: telegram, whatsapp, instagram, facebook_messenger, slack, discord, otro
- **`estado_chatbot` (5)** ⭐: configurando, activo, error, pausado, desactivado

---

## 🤖 Sistema de Chatbots IA

### Arquitectura

```
Usuario Telegram → n8n Workflow (15 nodos)
                         ↓
    ┌──────────────────┴──────────────────┐
    ↓                                      ↓
PostgreSQL Memory              AI Agent (DeepSeek)
(RLS por usuario)                         ↓
                                   MCP Server (JSON-RPC 2.0)
    ↓                                      ↓
Redis Anti-flood                   Backend API
(20s debouncing)                   (RLS multi-tenant)
                                           ↓
                                  PostgreSQL Database
                                  (Crear Citas, Listar Servicios)
```

### Componentes Clave

**Backend:**
- `chatbot.controller.js` - Orquestación E2E (8 endpoints con rollback)
- `chatbot-config.model.js` - Model con RLS (13 métodos)
- `n8nService.js` - API workflows (11 métodos)
- `n8nCredentialService.js` - CRUD credentials por plataforma
- `n8nMcpCredentialsService.js` - Credentials MCP (1 por org)
- `n8nGlobalCredentialsService.js` - Credentials globales (DeepSeek, PostgreSQL, Redis)
- `telegramValidator.js` - Validación Telegram Bot API

**MCP Server:**
- `mcp-server/index.js` - Servidor JSON-RPC 2.0 (puerto 3100)
- `mcp-server/tools/` - 4 tools implementados
  - `listarServicios.js` - Lista servicios activos
  - `verificarDisponibilidad.js` - Verifica horarios libres
  - `buscarCliente.js` - Busca clientes existentes
  - `crearCita.js` - Crea citas validadas
- `mcp-server/utils/apiClient.js` - Cliente HTTP con JWT

**Template n8n:**
- `flows/plantilla/plantilla.json` - 15 nodos configurados
  - Telegram Trigger → Edit Fields → Redis Queue
  - Wait 20s → Redis Get → If (nuevos msgs?)
  - AI Agent + DeepSeek + PostgreSQL Memory + **1 MCP Client**
  - Send Message

**Frontend:**
- `Step7_WhatsAppIntegration.jsx` - Form onboarding Telegram
- `useChatbots.js` - 7 hooks React Query

**Features Operativas:**
- ✅ Creación automática 100% sin intervención manual
- ✅ Webhooks funcionando automáticamente (fix bug n8n #14646)
- ✅ Credentials dinámicas (Telegram + globales + MCP)
- ✅ System prompt personalizado por organización (647 chars)
- ✅ Rollback automático en errores
- ✅ Validación con Telegram Bot API
- ✅ Anti-flood con Redis (20s debouncing)
- ✅ Chat Memory persistente (PostgreSQL con RLS)
- ✅ 4 MCP Tools operativas para agendamiento
- ✅ Multi-tenant seguro (JWT con `organizacion_id`)
- ✅ IDs únicos regenerados por workflow (evita conflictos)

**Ver más:** `PLAN_IMPLEMENTACION_CHATBOTS.md` + `ANEXO_CODIGO_CHATBOTS.md`

### Fix Crítico: Webhooks Automáticos ⭐

**Problema:** n8n bug [#14646](https://github.com/n8n-io/n8n/issues/14646) - webhooks no se registran al crear workflows vía API.

**Solución Implementada (chatbot.controller.js:913-944):**
```javascript
plantilla.nodes.forEach(node => {
    // Regenerar IDs únicos para cada workflow (evita conflictos)
    const oldId = node.id;
    node.id = crypto.randomUUID();

    // Fix basado en PR #15486 (oficial, pendiente merge)
    if (node.type === 'n8n-nodes-base.telegramTrigger') {
        node.webhookId = node.id;        // webhookId = node.id
        node.parameters.path = node.id;  // path = node.id
    }
});
```

**Resultado:** Cada bot tiene IDs únicos y webhooks funcionan automáticamente. ✅

---

## 🔒 Seguridad Multi-Tenant (RLS)

### Stack de Middleware Obligatorio

```javascript
router.post('/endpoint',
    auth.authenticateToken,       // 1. Validación JWT
    tenant.setTenantContext,      // 2. RLS Context ⚠️ CRÍTICO
    rateLimiting.apiRateLimit,    // 3. Rate limiting
    validation.validate(schema),  // 4. Validación Joi
    asyncHandler(Controller.fn)   // 5. Business logic
);
```

### Patrón RLS en Models (RLSContextManager v2.0)

```javascript
// Query simple
const data = await RLSContextManager.query(orgId, async (db) => {
    return await db.query('SELECT * FROM clientes WHERE id = $1', [id]);
});

// Transacción
await RLSContextManager.transaction(orgId, async (db) => {
    await db.query('INSERT INTO clientes ...');
    await db.query('INSERT INTO citas ...');
});

// Bypass (JOINs multi-tabla)
const data = await RLSContextManager.withBypass(async (db) => {
    return await db.query('SELECT * FROM org o LEFT JOIN sub s ...');
});
```

### RBAC (Jerarquía de Roles)

| Recurso | super_admin | admin/propietario | empleado | cliente | bot |
|---------|-------------|-------------------|----------|---------|-----|
| Organizaciones | ALL | SU ORG | READ | - | - |
| Usuarios | ALL | CRUD (su org) | - | - | - |
| Profesionales | ALL | ALL | READ | - | READ |
| Servicios | ALL | ALL | READ | - | READ |
| Clientes | ALL | ALL | ALL | READ (propio) | READ |
| Citas | ALL | ALL | ALL | READ (propias) | CRUD |
| Chatbots | ALL | ALL | - | - | - |

---

## 🎯 Características Clave

### 1. Tipos Dinámicos con Filtrado Automático

**Sistema híbrido:**
- **Tipos Sistema**: 33 tipos profesionales + 5 tipos bloqueo (no editables)
- **Tipos Custom**: Cada organización crea los suyos
- **Filtrado Inteligente**: Por industria automática

```javascript
// Hook con filtrado automático por industria de la org
const { data: tipos } = useTiposProfesional({ activo: true });
// Barbería → Solo muestra: Barbero, Estilista Masculino, Otro (3 de 33)
```

### 2. Auto-generación de Códigos (Triggers)

```javascript
// ✅ CORRECTO - NO enviar codigo_cita (auto-generado por trigger)
const cita = await CitaModel.crear({
    cliente_id: 1,
    profesional_id: 2,
    fecha_cita: '2025-10-21'
});
// ✅ Resultado: cita.codigo_cita = "ORG001-20251021-001"
```

### 3. Búsqueda Fuzzy Multi-criterio

**Clientes:** Trigram similarity + normalización telefónica
- Índices GIN para full-text search
- Función `normalizar_telefono()` quita espacios/guiones
- Búsqueda por similitud en nombre (threshold 0.3)

### 4. Chatbots IA Multi-Plataforma ⭐ NUEVO

**Workflow Completo:**
1. Usuario completa onboarding → Configura bot Telegram
2. Backend valida token con Telegram API
3. Sistema crea credential en n8n
4. Sistema genera workflow desde template (15 nodos)
5. Workflow se activa automáticamente
6. Chatbot queda operativo con IA conversacional

**Constraint:** 1 chatbot por plataforma por organización

---

## ⚡ Reglas Críticas de Desarrollo

### Backend

#### 1. Controllers confían en RLS (no filtrar manualmente)
```javascript
// ✅ CORRECTO - RLS filtra automáticamente por organizacion_id
const query = `SELECT * FROM profesionales WHERE activo = true`;

// ❌ INCORRECTO - Redundante
const query = `SELECT * FROM profesionales WHERE organizacion_id = $1 AND activo = true`;
```

#### 2. NO enviar campos auto-generados
- `codigo_cita`, `codigo_bloqueo` → Generados por triggers
- `created_at`, `updated_at` → Automáticos
- `organizacion_id` → Inyectado por tenant middleware

#### 3. Usar asyncHandler para async/await
```javascript
// ✅ CORRECTO
router.get('/:id', asyncHandler(Controller.obtener));

// ❌ INCORRECTO - Sin error handling
router.get('/:id', async (req, res) => { ... });
```

### Frontend

#### 1. Sanitización de campos opcionales
```javascript
// ✅ Backend Joi rechaza "" - Sanitizar a undefined
const sanitizedData = {
  ...data,
  email: data.email?.trim() || undefined,
  telefono: data.telefono?.trim() || undefined,
};
```

#### 2. Invalidación de cache React Query
```javascript
// ✅ Invalidar después de mutations
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['clientes'] });
  queryClient.invalidateQueries({ queryKey: ['citas'] });
}
```

#### 3. Hooks sobre constantes hard-coded
```javascript
// ✅ CORRECTO - Hook dinámico
const { data: tipos } = useTiposProfesional({ activo: true });

// ❌ DEPRECATED - Constante estática
import { TIPOS_PROFESIONAL } from '@/lib/constants';
```

---

## 📋 Checklist Nuevos Módulos

### Backend
- [ ] Routes: Stack middleware correcto (auth → tenant → rateLimit → validation)
- [ ] Controller: `asyncHandler` wrapper + `ResponseHelper`
- [ ] Model: `RLSContextManager.query()` (o `.withBypass()` para JOINs)
- [ ] Schema: Joi modular con validaciones específicas
- [ ] Tests: Unit + Integration + Multi-tenant (min 10 tests)

### Frontend
- [ ] Página: React Query (loading/error/success states)
- [ ] Componentes: Pequeños, reutilizables, tipado props
- [ ] Forms: React Hook Form + Zod + sanitización
- [ ] Hook: Custom hook con React Query
- [ ] API: Endpoints en `services/api/endpoints.js`

---

## 🔧 Troubleshooting Común

### "Organización no encontrada" en queries
```javascript
// ✅ JOINs multi-tabla requieren bypass RLS
const data = await RLSContextManager.withBypass(async (db) => {
    return await db.query(`
        SELECT o.*, s.plan_id, s.estado
        FROM organizaciones o
        LEFT JOIN subscripciones s ON o.id = s.organizacion_id
        WHERE o.id = $1
    `, [orgId]);
});
```

### Backend 400 "field is not allowed to be empty"
```javascript
// ✅ Joi no acepta "" - Sanitizar a undefined
const payload = {
  nombre: data.nombre,
  email: data.email?.trim() || undefined,  // "" → undefined
  telefono: data.telefono?.trim() || undefined,
};
```

### n8n rechaza workflow creation (Additional Properties)
```javascript
// ✅ Eliminar campos auto-generados antes de POST
delete plantilla.id;
delete plantilla.versionId;
delete plantilla.meta;
delete plantilla.pinData;
delete plantilla.tags;
delete plantilla.active;
```

---

## 📚 Archivos Clave

### Backend Core
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| RLS Manager | `backend/app/utils/rlsContextManager.js` | ⭐ v2.0 - Usar siempre |
| Helpers | `backend/app/utils/helpers.js` | 8 clases helper |
| Middleware Index | `backend/app/middleware/index.js` | Exports centralizados |
| DB Test Helper | `backend/app/__tests__/helpers/db-helper.js` | Utils testing |

### Chatbots
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| Chatbot Controller | `backend/app/controllers/chatbot.controller.js` | Orquestación E2E (8 endpoints) |
| Chatbot Model | `backend/app/database/chatbot-config.model.js` | Model con RLS (13 métodos) |
| n8n Service | `backend/app/services/n8nService.js` | API workflows (11 métodos) |
| MCP Credentials | `backend/app/services/n8nMcpCredentialsService.js` | Credentials MCP (1 por org) |
| Global Credentials | `backend/app/services/n8nGlobalCredentialsService.js` | DeepSeek, PostgreSQL, Redis |
| Workflow Template | `backend/app/flows/plantilla/plantilla.json` | 15 nodos configurados |

### MCP Server
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| MCP Server | `backend/mcp-server/index.js` | Servidor JSON-RPC 2.0 (puerto 3100) |
| Tool: Listar Servicios | `backend/mcp-server/tools/listarServicios.js` | Lista servicios activos |
| Tool: Verificar Disp. | `backend/mcp-server/tools/verificarDisponibilidad.js` | Verifica horarios libres |
| Tool: Buscar Cliente | `backend/mcp-server/tools/buscarCliente.js` | Busca clientes existentes |
| Tool: Crear Cita | `backend/mcp-server/tools/crearCita.js` | Crea citas validadas |
| API Client | `backend/mcp-server/utils/apiClient.js` | Cliente HTTP con JWT |

### Frontend
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| API Client | `frontend/src/services/api/client.js` | Axios + auto-refresh JWT |
| Endpoints | `frontend/src/services/api/endpoints.js` | 14 módulos API |
| Validations | `frontend/src/lib/validations.js` | Schemas Zod |
| Auth Store | `frontend/src/store/authStore.js` | Zustand state |

### Base de Datos
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| ENUMs | `sql/schema/01-types-and-enums.sql` | 10 ENUMs |
| Functions | `sql/schema/02-functions.sql` | 38 funciones PL/pgSQL |
| Indexes | `sql/schema/07-indexes.sql` | 114 índices |
| RLS Policies | `sql/schema/08-rls-policies.sql` | 24 políticas |
| Triggers | `sql/schema/09-triggers.sql` | 29 triggers |

---

## 📈 Métricas Consolidadas

### Backend
- **Archivos**: 97 total (16 controllers, 17 models, 14 routes, 12 schemas)
- **Tests**: 495 tests (100% passing, ~40s ejecución)
- **Middleware**: 34 funciones
- **Services**: 11 archivos (n8n, validators, etc.)

### MCP Server
- **Archivos**: 10 total (1 servidor, 4 tools, 5 utils/config)
- **Tools**: 4 operativas (listarServicios, verificarDisponibilidad, buscarCliente, crearCita)
- **Protocolo**: JSON-RPC 2.0 oficial
- **Autenticación**: JWT multi-tenant con RLS

### Frontend
- **Archivos**: 103 total (45 componentes, 22 páginas, 12 hooks)
- **API**: 14 módulos endpoints
- **Stores**: 2 Zustand
- **Utils**: 9 archivos

### Base de Datos
- **Tablas**: 19
- **ENUMs**: 10 tipos
- **Funciones**: 38 PL/pgSQL
- **Triggers**: 29 automáticos
- **Índices**: 114 optimizados
- **RLS Policies**: 24
- **Archivos SQL**: 15

---

## 📖 Documentación Adicional

- **`PLAN_IMPLEMENTACION_CHATBOTS.md`** - Documentación completa sistema de chatbots (v9.0)
- **`ANEXO_CODIGO_CHATBOTS.md`** - Referencia técnica detallada del código
- **Tests**: `backend/app/__tests__/endpoints/` (23 archivos, 495 tests)

---

**Versión**: 8.0
**Última actualización**: 24 Octubre 2025
**Estado**: ✅ Production Ready | 495/495 tests passing (100%)
**Chatbots**: ✅ Operativo - Telegram con MCP Server (4 tools) + Webhooks automáticos
