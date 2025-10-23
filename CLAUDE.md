# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 21 Octubre 2025

| Componente | Estado | Métricas Actuales |
|------------|--------|-------------------|
| **Backend API** | ✅ Operativo | 89 archivos, 12 módulos, 34 funciones middleware |
| **Frontend React** | ✅ Operativo | 41 componentes, 22 páginas, 11 hooks |
| **Base de Datos** | ✅ Operativo | 17 tablas, 22 RLS policies, 106 índices, 27 triggers |
| **Tests Backend** | ✅ **477 tests (100%)** | 22 archivos, ~37s ejecución |
| **Sistema IA** | ✅ Operativo | n8n + Evolution API + Redis Queue |
| **Docker** | ✅ Running | 7 contenedores activos |

---

## 🛠 Stack Técnico

### Frontend
- **Framework**: React 19.1.1 + Vite 7.1.7
- **Routing**: React Router DOM 7.9.4
- **State**: Zustand 5.0.8 + TanStack React Query 5.90.2
- **Forms**: React Hook Form 7.64.0 + Zod 4.1.12
- **HTTP**: Axios 1.12.2 (auto-refresh JWT)
- **UI**: Tailwind CSS 3.4.18 + Lucide Icons

### Backend
- **Runtime**: Node.js + Express.js
- **Auth**: JWT (7d access + 30d refresh)
- **Validación**: Joi schemas modulares
- **Testing**: Jest + Supertest
- **Logs**: Winston (JSON structured)

### Base de Datos
- **PostgreSQL 17 Alpine**
- **Multi-Tenant**: Row Level Security (22 políticas)
- **Índices**: 106 optimizados (GIN, trigram, covering)
- **Triggers**: 27 automáticos
- **Funciones**: 36 PL/pgSQL

### IA Conversacional
- **Orquestación**: n8n workflows
- **WhatsApp**: Evolution API
- **Cache**: Redis Queue

---

## 📝 Comandos Esenciales

```bash
# Backend Tests
docker exec back npm test                    # Suite completa
docker exec back npm test -- __tests__/endpoints/auth.test.js  # Test específico

# Docker
npm run start                               # docker compose up -d
npm run stop                                # docker compose down
docker logs -f back                         # Ver logs backend
docker logs -f postgres_db                  # Ver logs DB

# Base de Datos
docker exec postgres_db psql -U admin -d postgres              # Consola PostgreSQL
docker exec postgres_db psql -U admin -d postgres -c "\dt"     # Listar tablas

# Frontend
cd frontend
npm run dev                                 # http://localhost:3001
npm run build                               # Build producción
npm run lint:fix                            # ESLint auto-fix
```

---

## 🏗 Arquitectura del Sistema

### Backend (89 archivos)

**Módulos de Negocio (12):**
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

**Estructura de Archivos:**
- **Controllers**: 15 archivos (`/backend/app/controllers/`)
- **Models**: 16 archivos (`/backend/app/database/`) - ⚠️ `/models/` está vacío (deprecated)
- **Routes**: 13 archivos (`/backend/app/routes/api/v1/`)
- **Schemas**: 11 archivos Joi (`/backend/app/schemas/`)
- **Middleware**: 6 archivos, 34 funciones (`/backend/app/middleware/`)
- **Utils**: 5 archivos, 12 clases (`/backend/app/utils/`)
- **Tests**: 22 archivos (`/backend/app/__tests__/`)

**Middlewares Críticos (34 funciones):**
- `asyncHandler` (1) - Error handling wrapper
- `auth` (8) - JWT + roles + blacklist
- `tenant` (7) - RLS context + multi-tenant
- `validation` (9) - Joi validation + sanitization
- `rateLimiting` (10) - Rate limits (IP/usuario/org/plan)

**Helpers Esenciales:**
- `RLSContextManager` (v2.0) ⭐ **Usar siempre** - Gestión automática RLS
- `RLSHelper` (v1.0) - Legacy, evitar en nuevo código
- `helpers.js` - 8 clases (Response, Validation, Date, CodeGenerator, etc.)

### Frontend (95 archivos)

**Componentes (41):** Organizados en 10 módulos
```
auth (2)          - ProtectedRoute, PasswordStrengthIndicator
citas (10)        - Calendarios, Forms, Modales
clientes (4)      - Card, Form, List, WalkInModal
profesionales (5) - List, Form, Stats, Horarios, Servicios
servicios (3)     - List, Form, Profesionales asignados
bloqueos (6)      - Calendar, Forms, Filters, Detail
dashboard (3)     - CitasDelDia, LimitProgressBar, StatCard
common (2)        - LoadingSpinner, ToastContainer
forms (1)         - FormField wrapper
ui (5)            - Button, Input, Modal, Select, Toast
```

**Hooks Personalizados (11):**
- `useAuth` - Login/logout
- `useCitas` - CRUD + estados + recordatorios
- `useClientes` - CRUD + búsquedas
- `useBloqueos` - CRUD + filtros avanzados
- `useProfesionales` - CRUD profesionales
- `useServicios` - CRUD + asignaciones
- `useHorarios` - CRUD + configuración
- `useEstadisticas` ⭐ **Nuevo** - Stats dashboard (reemplaza useDashboard)
- `useTiposProfesional` - Tipos dinámicos con filtrado por industria
- `useTiposBloqueo` - Tipos bloqueo
- `useToast` - Notificaciones

**Páginas (22):**
- Auth (3): Login, ForgotPassword, ResetPassword
- Dashboard (1)
- Clientes (3): List, Form, Detail
- Profesionales (1), Servicios (1), Citas (1), Bloqueos (1)
- Onboarding (11): Flow + 10 steps
- Landing (1)

**API Endpoints (13 módulos):**
- `authApi`, `usuariosApi`, `organizacionesApi`
- `tiposProfesionalApi`, `tiposBloqueoApi`
- `profesionalesApi`, `serviciosApi`, `horariosApi`
- `clientesApi`, `citasApi`, `bloqueosApi`
- `planesApi`, `whatsappApi`

**Stores Zustand (2):**
- `authStore` - User, tokens, roles (`/frontend/src/store/`)
- `onboardingStore` - Flujo onboarding

**Utilidades (9 archivos):**
- `lib/constants.js` - Roles, estados, industrias
- `lib/validations.js` - Schemas Zod
- `lib/utils.js` - Utilidades generales
- `utils/dateHelpers.js` - 20+ funciones fechas
- `utils/citaValidators.js` - Validadores citas
- `utils/bloqueoHelpers.js` - Helpers bloqueos
- `utils/bloqueoValidators.js` - Validadores bloqueos
- `utils/formatters.js` - Formateo (dinero, teléfono, etc.)
- `utils/arrayDiff.js` - Diferencias arrays

### Base de Datos (17 Tablas)

```
Core (3):           organizaciones, usuarios, planes_subscripcion
Catálogos (2):      tipos_profesional, tipos_bloqueo
Negocio (5):        profesionales, servicios, clientes, servicios_profesionales, horarios_profesionales
Operaciones (2):    citas, bloqueos_horarios
Subscripciones (3): subscripciones, historial_subscripciones, metricas_uso_organizacion
Sistema (2):        eventos_sistema, eventos_sistema_archivo
```

**ENUMs (8 tipos, 35+ valores):**
- `rol_usuario` (5): super_admin, admin, propietario, empleado, cliente
- `industria_tipo` (11): barberia, salon_belleza, estetica, spa, etc.
- `plan_tipo` (5): trial, basico, profesional, empresarial, custom
- `estado_subscripcion` (5): activa, suspendida, cancelada, trial, morosa
- `estado_cita` (6): pendiente, confirmada, en_curso, completada, cancelada, no_asistio
- `estado_franja` (4): disponible, reservado_temporal, ocupado, bloqueado
- `tipo_profesional` (33+): barbero, estilista, doctor_general, veterinario, etc.

**Seguridad:**
- 22 Políticas RLS (multi-tenant + bypass super_admin)
- 27 Triggers (auto-generación, timestamps, validaciones)
- 106 Índices optimizados (GIN full-text, trigram fuzzy)
- 36 Funciones PL/pgSQL

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
// Query simple (lectura/escritura)
const data = await RLSContextManager.query(orgId, async (db) => {
    return await db.query('SELECT * FROM clientes WHERE id = $1', [id]);
});

// Transacción (múltiples operaciones atómicas)
await RLSContextManager.transaction(orgId, async (db) => {
    await db.query('INSERT INTO clientes ...');
    await db.query('INSERT INTO citas ...');
});

// Bypass (JOINs multi-tabla sin filtro org)
const data = await RLSContextManager.withBypass(async (db) => {
    return await db.query('SELECT * FROM org o LEFT JOIN sub s ...');
});
```

### RBAC (Jerarquía de Roles)

| Recurso | super_admin | admin/propietario | empleado | cliente |
|---------|-------------|-------------------|----------|---------|
| Organizaciones | ALL | SU ORG | READ | - |
| Usuarios | ALL | CRUD (su org) | - | - |
| Profesionales | ALL | ALL | READ | - |
| Servicios | ALL | ALL | READ | - |
| Clientes | ALL | ALL | ALL | READ (propio) |
| Citas | ALL | ALL | ALL | READ (propias) |

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

---

## ⚡ Reglas Críticas de Desarrollo

### Backend

#### 1. Controllers confían en RLS (no filtrar manualmente)
```javascript
// ✅ CORRECTO - RLS filtra automáticamente por organizacion_id
const query = `SELECT * FROM profesionales WHERE activo = true`;

// ❌ INCORRECTO - Redundante y error-prone
const query = `SELECT * FROM profesionales WHERE organizacion_id = $1 AND activo = true`;
```

#### 2. NO enviar campos auto-generados
- `codigo_cita`, `codigo_bloqueo` → Generados por triggers
- `created_at`, `updated_at` → Automáticos
- `organizacion_id` → Inyectado por tenant middleware

#### 3. Wrapping de controllers en rutas
```javascript
// ✅ CORRECTO - Wrap con arrow function si usa `this`
router.get('/:id', auth.authenticateToken, tenant.setTenantContext,
    (req, res, next) => Controller.obtener(req, res, next)
);

// ✅ ALTERNATIVA - asyncHandler wrapper
router.get('/:id', auth.authenticateToken, tenant.setTenantContext,
    asyncHandler(Controller.obtener.bind(Controller))
);
```

### Frontend

#### 1. Sanitización de campos opcionales
```javascript
// ✅ Backend Joi rechaza "" - Sanitizar a undefined
const sanitizedData = {
  ...data,
  email: data.email?.trim() || undefined,
  telefono: data.telefono?.trim() || undefined,
  notas: data.notas?.trim() || undefined,
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
// ✅ CORRECTO - Hook dinámico con filtrado automático
const { data: tipos } = useTiposProfesional({ activo: true });

// ❌ DEPRECATED - Constante estática (6 tipos vs 33+ dinámicos)
import { TIPOS_PROFESIONAL } from '@/lib/constants';
```

---

## 📋 Checklist Nuevos Módulos

### Backend
- [ ] Routes: Stack middleware correcto (auth → tenant → rateLimit → validation)
- [ ] Controller: `asyncHandler` wrapper + `ResponseHelper`
- [ ] Model: `RLSContextManager.query()` o `.withBypass()` (JOINs)
- [ ] Schema: Joi modular con validaciones específicas
- [ ] Tests: Unit + Integration + Multi-tenant

### Frontend
- [ ] Página: React Query (loading/error/success states)
- [ ] Componentes: Pequeños, reutilizables, tipado props
- [ ] Forms: React Hook Form + Zod + sanitización
- [ ] Hook: Custom hook con React Query
- [ ] API: Endpoints en `services/api/endpoints.js`

---

## 🔧 Troubleshooting Común

### Tests Backend
```bash
# ✅ Suite completa (limpieza automática de BD)
docker exec back npm test

# ⚙️ Test específico
docker exec back npm test -- __tests__/endpoints/auth.test.js

# 📊 Resultado esperado: 477/477 tests passing (~37s)
```

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

---

## 📚 Archivos Clave

### Backend
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| RLS Manager | `backend/app/utils/rlsContextManager.js` | ⭐ v2.0 - Usar siempre |
| Helpers | `backend/app/utils/helpers.js` | 8 clases helper |
| Middleware Index | `backend/app/middleware/index.js` | Exports centralizados |
| DB Test Helper | `backend/app/__tests__/helpers/db-helper.js` | Utils testing |

### Frontend
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| API Client | `frontend/src/services/api/client.js` | Axios + auto-refresh JWT |
| Endpoints | `frontend/src/services/api/endpoints.js` | 13 módulos API |
| Validations | `frontend/src/lib/validations.js` | Schemas Zod |
| Date Helpers | `frontend/src/utils/dateHelpers.js` | 20+ funciones fechas |
| Auth Store | `frontend/src/store/authStore.js` | Zustand state |

### Base de Datos
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| ENUMs | `sql/schema/01-types-and-enums.sql` | 8 ENUMs (35+ valores) |
| Functions | `sql/schema/02-functions.sql` | 36 funciones PL/pgSQL |
| Indexes | `sql/schema/07-indexes.sql` | 106 índices |
| RLS Policies | `sql/schema/08-rls-policies.sql` | 22 políticas |
| Triggers | `sql/schema/09-triggers.sql` | 27 triggers |

---

## 📈 Métricas Consolidadas

### Backend (89 archivos)
- Controllers: 15 | Models: 16 | Routes: 13 | Schemas: 11
- Middleware: 6 archivos (34 funciones) | Utils: 5 archivos (12 clases)
- Tests: 22 archivos (477 tests, 100% passing)

### Frontend (95 archivos)
- Componentes: 41 (10 módulos) | Páginas: 22 | Hooks: 11
- API Endpoints: 13 módulos | Stores: 2 | Utils: 9

### Base de Datos
- Tablas: 17 | ENUMs: 8 | Funciones: 36 | Triggers: 27
- Índices: 106 | RLS Policies: 22 | Archivos SQL: 15

---

**Versión**: 6.0
**Última actualización**: 21 Octubre 2025
**Estado**: ✅ Production Ready | 477/477 tests passing (100%)
