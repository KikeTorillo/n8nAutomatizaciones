# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 29 Octubre 2025

| Componente | Estado | Métricas |
|------------|--------|----------|
| **Backend API** | ✅ Operativo | 13 módulos, 97 archivos, 545 tests (100%) |
| **Frontend React** | ✅ Operativo | 45 componentes, 22 páginas, 12 hooks |
| **Base de Datos** | ✅ Operativo | 20 tablas, 24 RLS policies, 165 índices |
| **Sistema IA** | ✅ Operativo | n8n + Telegram + DeepSeek + MCP Server |
| **MCP Server** | ✅ Operativo | 5 tools, JSON-RPC 2.0, JWT multi-tenant |
| **Deployment** | ✅ Listo | Scripts bash con paridad dev↔prod |

---

## 🛠 Stack Técnico

### Frontend
- React 19.1.1 + Vite 7.1.7
- Zustand 5.0.8 + TanStack React Query 5.90.2
- React Hook Form 7.64.0 + Zod 4.1.12
- Axios 1.12.2 (auto-refresh JWT)
- Tailwind CSS 3.4.18

### Backend
- Node.js + Express.js
- JWT (7d access + 30d refresh)
- Joi schemas modulares
- Jest + Supertest (545 tests, 100%)
- Winston (JSON logs)

### Base de Datos
- PostgreSQL 17 Alpine
- Row Level Security (24 políticas)
- 165 índices optimizados
- 30 triggers automáticos
- 38 funciones PL/pgSQL

### IA Conversacional
- n8n workflows (15 nodos)
- Telegram Bot API
- DeepSeek (modelo IA)
- PostgreSQL Chat Memory (RLS)
- Redis Anti-flood (20s debouncing)
- MCP Server (5 tools: listar servicios, verificar disponibilidad, buscar cliente, crear cita, reagendar cita)

---

## 📝 Comandos por Ambiente

### Desarrollo (npm)

```bash
# Levantar stack completo
npm run dev

# Ver logs
npm run logs
npm run logs:backend
npm run logs:frontend

# Tests
npm run test:backend        # 545 tests
npm run test:backend:watch  # Modo watch

# Utilidades
npm run status              # Ver estado
npm run clean               # Limpiar contenedores
npm run backup:db           # Backup PostgreSQL
npm run db:connect          # Conectar a PostgreSQL
```

### Prod-Local (bash script - testing de producción)

```bash
# Deployment completo
bash deploy.local.sh deploy

# Operaciones
bash deploy.local.sh logs     # Ver logs
bash deploy.local.sh status   # Ver estado
bash deploy.local.sh health   # Health check
bash deploy.local.sh restart  # Reiniciar
bash deploy.local.sh rebuild  # Rebuild sin cache
bash deploy.local.sh backup   # Backup BD
bash deploy.local.sh clean    # Limpiar todo
```

### VPS (bash script - producción real)

```bash
# Deployment completo
bash deploy.sh deploy

# Operaciones
bash deploy.sh logs     # Ver logs
bash deploy.sh status   # Ver estado
bash deploy.sh health   # Health check
bash deploy.sh restart  # Reiniciar
bash deploy.sh update   # Git pull + rebuild + restart
bash deploy.sh backup   # Backup BD
```

---

## 🏗 Arquitectura del Sistema

### Backend (13 Módulos de Negocio)

1. **auth** - JWT + password recovery
2. **usuarios** - Gestión usuarios + RBAC
3. **organizaciones** - Multi-tenancy
4. **tipos-profesional** - Tipos dinámicos (33 sistema + custom)
5. **tipos-bloqueo** - Tipos bloqueo dinámicos
6. **profesionales** - Prestadores servicios
7. **servicios** - Catálogo servicios
8. **clientes** - Base clientes (búsqueda fuzzy)
9. **horarios-profesionales** - Disponibilidad semanal
10. **citas** - Agendamiento (múltiples servicios por cita)
11. **bloqueos-horarios** - Bloqueos temporales
12. **planes** - Planes y suscripciones
13. **chatbots** - Chatbots IA multi-plataforma

**Helpers Esenciales:**
- `RLSContextManager` (v2.0) - Gestión automática RLS (USAR SIEMPRE)
- `helpers.js` - 8 clases helper

### Frontend (45 componentes, 12 hooks)

**Hooks Personalizados:**
- `useAuth`, `useCitas`, `useClientes`, `useBloqueos`
- `useProfesionales`, `useServicios`, `useHorarios`
- `useEstadisticas`, `useTiposProfesional`, `useTiposBloqueo`
- `useChatbots` - CRUD chatbots
- `useToast`

### Base de Datos (20 Tablas)

```
Core:           organizaciones, usuarios, planes_subscripcion
Catálogos:      tipos_profesional, tipos_bloqueo
Negocio:        profesionales, servicios, clientes,
                servicios_profesionales, horarios_profesionales
Operaciones:    citas, citas_servicios, bloqueos_horarios
Chatbots:       chatbot_config, chatbot_credentials
Subscripciones: subscripciones, historial_subscripciones,
                metricas_uso_organizacion
Sistema:        eventos_sistema, eventos_sistema_archivo
```

**ENUMs principales:**
- `rol_usuario`: super_admin, admin, propietario, empleado, cliente, bot
- `plataforma_chatbot`: telegram, whatsapp, instagram, facebook_messenger, slack, discord, otro
- `estado_chatbot`: configurando, activo, error, pausado, desactivado
- `estado_cita`: pendiente, confirmada, en_curso, completada, cancelada, no_asistio

---

## 🤖 Sistema de Chatbots IA

### Flujo

```
Usuario Telegram → n8n Workflow (15 nodos)
    ↓
┌────────────────────┬──────────────────┐
│                    │                  │
PostgreSQL Memory    AI Agent (DeepSeek)
(RLS por usuario)    │
│                    MCP Server (5 tools)
Redis Anti-flood     │
(20s debouncing)     Backend API (RLS)
                     │
                     PostgreSQL Database
```

### MCP Server Tools

1. **listarServicios** - Lista servicios activos
2. **verificarDisponibilidad** - Verifica horarios libres (múltiples servicios)
3. **buscarCliente** - Busca clientes existentes
4. **crearCita** - Crea citas validadas (múltiples servicios)
5. **reagendarCita** - Reagenda citas existentes

### Features Operativas

- ✅ Creación automática 100% sin intervención manual
- ✅ Webhooks funcionando automáticamente (fix bug n8n #14646)
- ✅ Credentials dinámicas (Telegram + globales + MCP)
- ✅ System prompt personalizado por organización
- ✅ Rollback automático en errores
- ✅ Validación con Telegram Bot API
- ✅ Anti-flood con Redis (20s debouncing)
- ✅ Chat Memory persistente (PostgreSQL con RLS)
- ✅ Multi-tenant seguro (JWT con `organizacion_id`)
- ✅ Soporte para múltiples servicios por cita

### Fix Crítico: Webhooks Automáticos

n8n bug #14646 - webhooks no se registran al crear workflows vía API.

**Solución implementada:**
```javascript
plantilla.nodes.forEach(node => {
    node.id = crypto.randomUUID();  // IDs únicos
    if (node.type === 'n8n-nodes-base.telegramTrigger') {
        node.webhookId = node.id;
        node.parameters.path = node.id;
    }
});
```

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

### Patrón RLS en Models

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

### RBAC

| Recurso | super_admin | admin/propietario | empleado | cliente | bot |
|---------|-------------|-------------------|----------|---------|-----|
| Organizaciones | ALL | SU ORG | READ | - | - |
| Usuarios | ALL | CRUD (su org) | - | - | - |
| Profesionales | ALL | ALL | READ | - | READ |
| Servicios | ALL | ALL | READ | - | READ |
| Clientes | ALL | ALL | ALL | READ | READ |
| Citas | ALL | ALL | ALL | READ | CRUD |
| Chatbots | ALL | ALL | - | - | - |

---

## 🎯 Características Clave

### 1. Tipos Dinámicos con Filtrado Automático

**Sistema híbrido:**
- Tipos Sistema: 33 tipos profesionales + 5 tipos bloqueo (no editables)
- Tipos Custom: Cada organización crea los suyos
- Filtrado automático por industria

```javascript
const { data: tipos } = useTiposProfesional({ activo: true });
// Barbería → Solo muestra: Barbero, Estilista Masculino, Otro (3 de 33)
```

### 2. Auto-generación de Códigos

```javascript
// NO enviar codigo_cita (auto-generado por trigger)
const cita = await CitaModel.crear({
    cliente_id: 1,
    profesional_id: 2,
    fecha_cita: '2025-10-21'
});
// Resultado: cita.codigo_cita = "ORG001-20251021-001"
```

### 3. Búsqueda Fuzzy

Clientes: Trigram similarity + normalización telefónica
- Índices GIN para full-text search
- Función `normalizar_telefono()` quita espacios/guiones
- Búsqueda por similitud en nombre (threshold 0.3)

### 4. Múltiples Servicios por Cita

- Tabla `citas_servicios` (relación M:N con snapshot pricing)
- Backend soporta 1-10 servicios por cita
- Frontend con selector múltiple de servicios
- MCP tools soportan múltiples servicios

---

## ⚡ Reglas Críticas de Desarrollo

### Backend

#### 1. Controllers confían en RLS (no filtrar manualmente)
```javascript
// ✅ CORRECTO - RLS filtra automáticamente
const query = `SELECT * FROM profesionales WHERE activo = true`;

// ❌ INCORRECTO - Redundante
const query = `SELECT * FROM profesionales WHERE organizacion_id = $1 AND activo = true`;
```

#### 2. NO enviar campos auto-generados
- `codigo_cita`, `codigo_bloqueo` → Triggers
- `created_at`, `updated_at` → Automáticos
- `organizacion_id` → Tenant middleware

#### 3. Usar asyncHandler para async/await
```javascript
// ✅ CORRECTO
router.get('/:id', asyncHandler(Controller.obtener));

// ❌ INCORRECTO
router.get('/:id', async (req, res) => { ... });
```

### Frontend

#### 1. Sanitización de campos opcionales
```javascript
// Backend Joi rechaza "" - Sanitizar a undefined
const sanitizedData = {
  ...data,
  email: data.email?.trim() || undefined,
};
```

#### 2. Invalidación de cache React Query
```javascript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['clientes'] });
}
```

#### 3. Hooks sobre constantes
```javascript
// ✅ CORRECTO - Hook dinámico
const { data: tipos } = useTiposProfesional({ activo: true });

// ❌ DEPRECATED
import { TIPOS_PROFESIONAL } from '@/lib/constants';
```

---

## 📋 Checklist Nuevos Módulos

### Backend
- [ ] Routes: Stack middleware correcto (auth → tenant → rateLimit → validation)
- [ ] Controller: `asyncHandler` wrapper + `ResponseHelper`
- [ ] Model: `RLSContextManager.query()`
- [ ] Schema: Joi modular
- [ ] Tests: Min 10 tests (unit + integration + multi-tenant)

### Frontend
- [ ] Página: React Query (loading/error/success states)
- [ ] Componentes: Pequeños, reutilizables
- [ ] Forms: React Hook Form + Zod + sanitización
- [ ] Hook: Custom hook con React Query
- [ ] API: Endpoints en `services/api/endpoints.js`

---

## 🔧 Troubleshooting Común

### "Organización no encontrada" en queries
```javascript
// JOINs multi-tabla requieren bypass RLS
const data = await RLSContextManager.withBypass(async (db) => {
    return await db.query(`
        SELECT o.*, s.plan_id
        FROM organizaciones o
        LEFT JOIN subscripciones s ON o.id = s.organizacion_id
        WHERE o.id = $1
    `, [orgId]);
});
```

### Backend 400 "field is not allowed to be empty"
```javascript
// Joi no acepta "" - Sanitizar a undefined
const payload = {
  nombre: data.nombre,
  email: data.email?.trim() || undefined,
};
```

---

## 📚 Archivos Clave

### Backend Core
| Archivo | Descripción |
|---------|-------------|
| `backend/app/utils/rlsContextManager.js` | RLS Manager v2.0 - **USAR SIEMPRE** |
| `backend/app/utils/helpers.js` | 8 clases helper |
| `backend/app/middleware/index.js` | Exports centralizados |
| `backend/app/app.js` | Configuración Express |

### Chatbots
| Archivo | Descripción |
|---------|-------------|
| `backend/app/controllers/chatbot.controller.js` | 8 endpoints con rollback |
| `backend/app/database/chatbot-config.model.js` | Model con RLS |
| `backend/app/services/n8nService.js` | API workflows |
| `backend/app/flows/plantilla/plantilla.json` | Template 15 nodos |

### MCP Server
| Archivo | Descripción |
|---------|-------------|
| `backend/mcp-server/index.js` | Servidor JSON-RPC 2.0 |
| `backend/mcp-server/tools/*.js` | 5 tools implementados |

### Frontend
| Archivo | Descripción |
|---------|-------------|
| `frontend/src/services/api/client.js` | Axios + auto-refresh JWT |
| `frontend/src/services/api/endpoints.js` | 14 módulos API |
| `frontend/src/store/authStore.js` | Zustand state |

### Base de Datos
| Archivo | Descripción |
|---------|-------------|
| `sql/schema/01-types-and-enums.sql` | 10 ENUMs |
| `sql/schema/02-functions.sql` | 38 funciones PL/pgSQL |
| `sql/schema/07-indexes.sql` | 165 índices |
| `sql/schema/08-rls-policies.sql` | 24 políticas |
| `sql/schema/09-triggers.sql` | 30 triggers |

### Deployment
| Archivo | Descripción |
|---------|-------------|
| `deploy.local.sh` | Script testing prod-local |
| `deploy.sh` | Script deployment VPS |
| `VPS_DEPLOYMENT.md` | Guía deployment VPS |
| `nginx.vps.conf` | Config nginx VPS |

---

## 📈 Métricas

- **Backend**: 97 archivos, 545 tests (100%)
- **MCP Server**: 10 archivos, 5 tools
- **Frontend**: 103 archivos, 45 componentes, 12 hooks
- **Base de Datos**: 20 tablas, 165 índices, 24 RLS policies, 30 triggers
- **Tests**: 545 tests passing (100%)

---

**Versión**: 9.0
**Última actualización**: 29 Octubre 2025
**Estado**: ✅ Production Ready
