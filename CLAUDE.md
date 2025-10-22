# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 21 Octubre 2025

| Componente | Estado | Métricas Reales |
|------------|--------|-----------------|
| **Backend API** | ✅ Operativo | 12 módulos, 72 archivos, 33 funciones middleware |
| **Frontend React** | ✅ Operativo | 45 componentes, 22 páginas, 11 hooks |
| **Base de Datos** | ✅ Operativo | 17 tablas, 22 RLS policies, 106 índices, 27 triggers |
| **Tests Backend** | ✅ **546 casos (100%)** | 22 archivos, 157 suites, ~47s |
| **Sistema IA** | ✅ Operativo | n8n + Evolution API |
| **Docker** | ✅ Running | 7 contenedores |

---

## 🛠 Stack Técnico

### Frontend
- **Framework**: React 19.1.1 + Vite 7.1.7
- **Routing**: React Router DOM 7.9.4
- **State**: Zustand 5.0.8 (UI) + TanStack React Query 5.90.2 (server)
- **Forms**: React Hook Form 7.64.0 + Zod 4.1.12
- **HTTP**: Axios 1.12.2 (interceptores JWT auto-refresh)
- **UI**: Tailwind CSS 3.4.18 + Lucide Icons + Framer Motion 12.23.22

### Backend
- **Runtime**: Node.js + Express.js
- **Auth**: JWT (7d access + 30d refresh)
- **Validación**: Joi schemas modulares
- **Testing**: Jest + Supertest (546 casos)
- **Logs**: Winston (JSON structured)

### Base de Datos
- **PostgreSQL 17 Alpine**
- **Multi-Tenant**: Row Level Security (RLS) - 22 políticas
- **Índices**: 106 (covering, GIN, trigram, UNIQUE parciales)
- **Triggers**: 27 (auto-generación, timestamps, validaciones)
- **Funciones**: 36 funciones PL/pgSQL

### IA Conversacional
- **Orquestación**: n8n + Redis Queue
- **WhatsApp**: Evolution API
- **NLP**: Claude/GPT vía n8n workflows

---

## 📝 Comandos Esenciales

### Tests Backend
```bash
# Suite completa (SIEMPRE usar "npm test")
docker exec back npm test

# Test específico
docker exec back npm test -- __tests__/endpoints/auth.test.js
```

### Docker
```bash
npm run start     # docker compose up -d
npm run stop      # docker compose down
npm run restart   # Reiniciar servicios

docker logs -f back
docker logs -f postgres_db
```

### Base de Datos
```bash
# Consola PostgreSQL
docker exec postgres_db psql -U admin -d postgres

# Ver tablas
docker exec postgres_db psql -U admin -d postgres -c "\dt"
```

### Frontend
```bash
cd frontend

npm run dev          # Desarrollo (http://localhost:3001)
npm run build        # Build producción
npm run lint:fix     # Auto-fix ESLint
npm run format       # Aplicar Prettier
```

---

## 🏗 Arquitectura del Sistema

### Módulos Backend (12)

**Controllers/Models/Routes/Schemas:**
1. `auth` - Autenticación JWT + password recovery
2. `usuarios` - Gestión de usuarios + RBAC
3. `organizaciones` - Multi-tenancy
4. `tipos-profesional` - Tipos dinámicos (33 sistema + personalizados) con filtrado por industria
5. `tipos-bloqueo` - Tipos de bloqueo dinámicos
6. `profesionales` - Prestadores de servicios
7. `servicios` - Catálogo de servicios
8. `clientes` - Base de clientes con búsqueda fuzzy
9. `horarios-profesionales` - Disponibilidad semanal
10. `citas` - Agendamiento modular (base, operacional, recordatorios, helpers)
11. `bloqueos-horarios` - Gestión de bloqueos temporales
12. `planes` - Planes y suscripciones

**Middlewares (6 archivos, 33 funciones):**
- `asyncHandler` (1) - Error handling wrapper
- `auth` (8) - JWT + roles + blacklist
- `tenant` (7) - RLS context + multi-tenant
- `validation` (8) - Joi validation + sanitization
- `rateLimiting` (9) - Rate limits por IP/usuario/org/plan

**Helpers Críticos:**
- `RLSContextManager` (v2.0) - Gestión automática RLS con transacciones
- `RLSHelper` (v1.0 legacy) - Control manual RLS
- `helpers.js` - 8 clases (Response, Validation, Date, CodeGenerator, Sanitize, Pagination, Error, Organizacion)

### Base de Datos (17 Tablas)

```
Core (3):           organizaciones, usuarios, planes_subscripcion
Catálogos (2):      tipos_profesional, tipos_bloqueo
Negocio (4):        profesionales, servicios, clientes, servicios_profesionales
Operaciones (2):    citas, horarios_profesionales, bloqueos_horarios
Subscripciones (3): subscripciones, historial_subscripciones, metricas_uso_organizacion
Sistema (2):        eventos_sistema, eventos_sistema_archivo
```

**Seguridad:**
- 22 Políticas RLS (multi-tenant + bypass para super_admin/funciones)
- 27 Triggers (auto-generación códigos, timestamps, validaciones, protección tipos sistema)
- 106 Índices (GIN full-text, trigram fuzzy search, covering, parciales)
- 36 Funciones PL/pgSQL (validaciones, mantenimiento, auditoría)
- 8 ENUMs (171 valores: roles, industrias, estados, tipos)

### Frontend (45 componentes, 22 páginas, 11 hooks)

**Componentes por Módulo:**
```
auth (2)           - ProtectedRoute, PasswordStrengthIndicator
citas (10)         - Calendar (Día/Mensual), Forms, Modales acciones
clientes (4)       - Card, Form, List, WalkInModal
profesionales (5)  - List, Form, Stats, Horarios, Servicios
servicios (3)      - List, Form, Profesionales asignados
bloqueos (6)       - Calendar, Forms, Filters, Detail, List
dashboard (4)      - CitasDelDia, LimitProgressBar, StatCard
common (2)         - LoadingSpinner, ToastContainer
forms (1)          - FormField (React Hook Form wrapper)
ui (6)             - Button, Input, Modal, Select, Toast
```

**Hooks Personalizados (11):**
- `useAuth` - Login/logout
- `useCitas` - CRUD + estados + recordatorios (19 funciones)
- `useClientes` - CRUD + búsquedas (9 funciones)
- `useBloqueos` - CRUD + filtros avanzados (11 funciones)
- `useProfesionales` - CRUD (6 funciones)
- `useServicios` - CRUD + asignaciones (9 funciones)
- `useHorarios` - CRUD + configuración (7 funciones)
- `useDashboard` - Stats + datos (6 funciones) ⚠️ Tiene duplicados
- `useTiposProfesional` - CRUD tipos dinámicos con filtrado automático por industria
- `useTiposBloqueo` - CRUD tipos de bloqueo
- `useToast` - Notificaciones

**Páginas (22):**
- Auth (3): Login, ForgotPassword, ResetPassword
- Dashboard (1)
- Clientes (3): List, Form, Detail
- Profesionales (1), Servicios (1), Citas (1), Bloqueos (1)
- Onboarding (10): Flow + 9 pasos
- Landing (1)

**Servicios API (82 métodos en 12 módulos):**
- authApi, usuariosApi, organizacionesApi
- tiposProfesionalApi, tiposBloqueoApi
- profesionalesApi, serviciosApi, horariosApi
- clientesApi, citasApi, bloqueosApi
- planesApi, whatsappApi

**Stores Zustand (2):**
- `authStore` - User, tokens, roles
- `onboardingStore` - Flujo multi-paso

**Utilidades (9 archivos, 2,301 líneas):**
- `lib/constants.js` - Roles, estados, industrias (⚠️ TIPOS_PROFESIONAL deprecated)
- `lib/validations.js` - Schemas Zod (379 líneas)
- `lib/utils.js` - Utilidades generales
- `utils/dateHelpers.js` - 20+ funciones fechas (528 líneas)
- `utils/citaValidators.js` - Validadores citas (549 líneas)
- `utils/bloqueoHelpers.js` - Validadores bloqueos (390 líneas)
- `utils/bloqueoValidators.js` - Schemas Zod bloqueos (226 líneas)
- `utils/formatters.js` - Formateo dinero, números, teléfono
- `utils/arrayDiff.js` - Diferencias de arrays

---

## 🔒 Seguridad Multi-Tenant

### Row Level Security (RLS)

**Middleware obligatorio en rutas:**
```javascript
router.post('/endpoint',
    auth.authenticateToken,      // 1. JWT
    tenant.setTenantContext,     // 2. RLS ⚠️ CRÍTICO
    rateLimiting.apiRateLimit,   // 3. Rate limit
    validation.validate(schema), // 4. Joi validation
    Controller.metodo            // 5. Business logic
);
```

**Patrón RLS en Models (usar RLSContextManager v2.0):**
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

### RBAC (Roles)

| Recurso | super_admin | admin/propietario | empleado | cliente |
|---------|-------------|-------------------|----------|---------|
| Organizaciones | ALL | SU ORG | READ | - |
| Usuarios | ALL | CREATE/UPDATE | - | - |
| Profesionales | ALL | ALL | READ | - |
| Servicios | ALL | ALL | READ | - |
| Clientes | ALL | ALL | ALL | READ (propio) |
| Citas | ALL | ALL | ALL | READ (propias) |

---

## 🎯 Características Clave

### 1. Tipos Dinámicos (Profesionales + Bloqueos)

**Sistema híbrido:**
- Tipos del Sistema: 33 profesionales + 5 bloqueos (no editables)
- Tipos Personalizados: Cada org crea los suyos
- Filtrado Automático: Por industria (frontend) y búsquedas

**Filtrado por Industria:**
```javascript
// Hook con filtrado automático
const { data: tipos } = useTiposProfesional({ activo: true });
// Automáticamente filtra por tipo_industria de la org actual
```

**Resultado:** Barbería → muestra solo: Barbero, Estilista Masculino, Otro (3 de 33)

### 2. Auto-generación de Códigos

**Códigos únicos automáticos (trigger):**
```javascript
// ✅ CORRECTO - NO enviar codigo_cita
const cita = await CitaModel.crear({
    cliente_id: 1,
    profesional_id: 2,
    fecha_cita: '2025-10-13'
});
// cita.codigo_cita = "ORG001-20251013-001" (auto-generado)
```

### 3. Búsqueda Fuzzy (Clientes)

**Trigram + normalización de teléfonos:**
- Índices GIN para búsqueda full-text
- Función `normalizar_telefono()` para búsquedas flexibles
- Búsqueda por similitud en nombre con trigram

---

## ⚡ Reglas Críticas

### Backend

**1. Controllers confían en RLS**
```javascript
// ✅ CORRECTO - RLS filtra automáticamente
const query = `SELECT * FROM profesionales WHERE activo = true`;

// ❌ INCORRECTO - redundante
const query = `SELECT * FROM profesionales WHERE organizacion_id = $1 AND activo = true`;
```

**2. NO enviar códigos auto-generados** (codigo_cita, codigo_bloqueo, etc.)

**3. Wrapping en rutas**
```javascript
// ✅ CORRECTO - Wrap con arrow function si usa `this`
router.get('/:id/stats', auth.authenticateToken, tenant.setTenantContext,
    (req, res, next) => Controller.obtenerEstadisticas(req, res, next)
);
```

### Frontend

**1. Sanitización de campos opcionales**
```javascript
// ✅ Backend Joi rechaza "" - Sanitizar a undefined
const sanitizedData = {
  ...data,
  email: data.email?.trim() || undefined,
  telefono: data.telefono?.trim() || undefined,
};
```

**2. Invalidación de cache React Query**
```javascript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['recursos'] });
}
```

**3. Usar hooks específicos**
```javascript
// ✅ CORRECTO - Hook con filtrado automático
const { data: tipos } = useTiposProfesional({ activo: true });

// ❌ DEPRECATED - No usar constante
import { TIPOS_PROFESIONAL } from '@/lib/constants'; // DEPRECATED
```

---

## 📋 Checklist Nuevos Módulos

### Backend
- [ ] **Routes**: Middleware correcto (auth → tenant → rateLimit → validation)
- [ ] **Controller**: Usa `asyncHandler` + `ResponseHelper`
- [ ] **Model**: `RLSContextManager` (queries) o `.withBypass()` (JOINs)
- [ ] **Schema**: Joi modular con validaciones específicas
- [ ] **Tests**: Happy path + edge cases + multi-tenant

### Frontend
- [ ] **Página**: React Query + estados (loading, error, success)
- [ ] **Componentes**: Pequeños, reutilizables, props claras
- [ ] **Forms**: React Hook Form + Zod + sanitización
- [ ] **Hook**: Custom hook con React Query
- [ ] **API**: Endpoints en `services/api/endpoints.js`

---

## 🔧 Troubleshooting

### Tests con timeout
```bash
# ✅ Usar npm test (configura NODE_ENV=test)
docker exec back npm test
```

### "Organización no encontrada" en queries multi-tabla
```javascript
// ✅ Usar withBypass() para JOINs
return await RLSContextManager.withBypass(async (db) => {
    return await db.query('SELECT ... FROM org o LEFT JOIN sub s ...');
});
```

### Backend 400 "field is not allowed to be empty"
```javascript
// ✅ Sanitizar "" a undefined antes de enviar
email: data.email?.trim() || undefined
```

---

## 🐛 Problemas Conocidos

### Frontend

**1. Duplicados en useDashboard.js** ⚠️ CRÍTICO
- `useCitasDelDia()` - Duplicado de useCitas.js (diferentes queryKeys)
- `useProfesionales()` - Duplicado de useProfesionales.js
- `useClientes()` - Duplicado de useClientes.js
- **Acción**: Eliminar de useDashboard.js, importar de hooks originales

**2. TIPOS_PROFESIONAL deprecated en constants.js**
- Array hard-coded (6 tipos) vs 33+ tipos dinámicos
- **Acción**: Usar hook `useTiposProfesional()` o `useTiposSistema()`

### Backend

**1. Inconsistencia de nomenclatura**
- `TiposProfesionalController.js` (PascalCase)
- vs `auth.controller.js` (kebab-case)
- **Acción**: Renombrar a `tipos-profesional.controller.js`

**2. TiposBloqueoModel duplicado**
- `/backend/app/models/TiposBloqueoModel.js` (216 líneas)
- vs `/backend/app/database/tipos-bloqueo.model.js`
- **Acción**: Mover a `/database/` y actualizar import en controller

---

## 📚 Archivos Clave

### Backend
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| RLS Manager | `backend/app/utils/rlsContextManager.js` | v2.0 - Recomendado |
| Helpers | `backend/app/utils/helpers.js` | 8 clases helper |
| Middleware Index | `backend/app/middleware/index.js` | Orquestador central |
| DB Helper Test | `backend/app/__tests__/helpers/db-helper.js` | Utilidades testing |

### Frontend
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| API Client | `frontend/src/services/api/client.js` | Axios + auto-refresh JWT |
| Validations | `frontend/src/lib/validations.js` | Schemas Zod |
| Date Helpers | `frontend/src/utils/dateHelpers.js` | 20+ funciones fechas |
| Auth Store | `frontend/src/stores/authStore.js` | Zustand auth state |

### Base de Datos
| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| Functions | `sql/schema/02-functions.sql` | 36 funciones PL/pgSQL |
| Indexes | `sql/schema/07-indexes.sql` | 106 índices optimizados |
| RLS Policies | `sql/schema/08-rls-policies.sql` | 22 políticas RLS |
| Triggers | `sql/schema/09-triggers.sql` | 27 triggers |

---

## 📈 Métricas Consolidadas

### Backend
- **Archivos funcionales**: 72 (sin tests/logs)
- **Controllers**: 15 (12 módulos + 3 sub-citas)
- **Models**: 15 (13 modelos + 2 indexes)
- **Routes**: 13 archivos
- **Schemas**: 11 archivos (2,736 líneas)
- **Middlewares**: 6 archivos, 33 funciones
- **Utils**: 5 archivos (1,371 líneas)
- **Tests**: 22 archivos, 546 casos, 157 suites

### Frontend
- **Componentes**: 45 en 10 módulos
- **Páginas**: 22 (auth 3, onboarding 10, CRUD 8, landing 1)
- **Hooks**: 11 hooks, 83 funciones totales
- **API Endpoints**: 82 métodos en 12 módulos
- **Stores**: 2 (auth, onboarding)
- **Utilidades**: 9 archivos (2,301 líneas)

### Base de Datos
- **Tablas**: 17
- **ENUMs**: 8 (171 valores)
- **Funciones**: 36 PL/pgSQL
- **Triggers**: 27
- **Índices**: 106
- **RLS Policies**: 22
- **Archivos SQL**: 15

---

**Versión**: 5.0
**Última actualización**: 21 Octubre 2025
**Estado**: ✅ Production Ready | 546/546 tests (100%)
