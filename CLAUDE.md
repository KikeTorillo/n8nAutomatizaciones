# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 16 Octubre 2025

| Componente | Estado | Métricas Reales |
|------------|--------|-----------------|
| **Backend API** | ✅ Operativo | 10 módulos, 83 archivos, 6 middlewares |
| **Frontend React** | ✅ Operativo | 40 componentes, 20 páginas, 9 hooks |
| **Base de Datos** | ✅ Operativo | 15 tablas, 20 RLS policies, 99 índices, 23 triggers |
| **Tests Backend** | ✅ **475/475 (100%)** | 22 suites, ~47s |
| **Sistema IA** | ✅ Operativo | n8n + Evolution API |
| **Docker** | ✅ Running | 7 contenedores |

---

## 🛠 Stack Técnico

### Frontend
- **Framework**: React 19.1.1 + Vite 7.1.7
- **Routing**: React Router DOM 7.9.4
- **State**: Zustand 5.0.8 + TanStack React Query 5.90.2
- **Forms**: React Hook Form 7.64.0 + Zod 4.1.12
- **HTTP**: Axios 1.12.2 (interceptores JWT)
- **UI**: Tailwind CSS 3.4.18 + Lucide Icons + Framer Motion 12.23.22

### Backend
- **Runtime**: Node.js + Express.js
- **Auth**: JWT (7d access + 30d refresh)
- **Validación**: Joi schemas modulares
- **Testing**: Jest + Supertest
- **Logs**: Winston (JSON structured)

### Base de Datos
- **PostgreSQL 17 Alpine**
- **Multi-Tenant**: Row Level Security (RLS)
- **Índices**: 99 (covering, GIN, trigram, UNIQUE parciales)
- **Triggers**: 23 (auto-generación, timestamps, validaciones)
- **Funciones**: 32 funciones PL/pgSQL

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

### Módulos Backend (10)

**Controllers/Models/Routes/Schemas:**
- `auth` - Autenticación y tokens JWT
- `usuarios` - Gestión de usuarios
- `organizaciones` - Multi-tenancy
- `profesionales` - Prestadores de servicios
- `servicios` - Catálogo de servicios
- `clientes` - Base de clientes
- `horarios-profesionales` - Disponibilidad
- `citas` - Operaciones de agendamiento (modular: base, operacional, recordatorios)
- `bloqueos-horarios` - Bloqueos de disponibilidad
- `planes` - Planes y suscripciones

**Middlewares (6 middlewares):**
- asyncHandler, auth (8 funciones), tenant (7 funciones)
- validation (8 funciones), rateLimiting (9 funciones)

**Helpers Críticos:**
- RLSContextManager (v2.0): Gestión automática de RLS con transacciones
- RLSHelper: Control manual fino de RLS
- ResponseHelper, ValidationHelper, DateHelper, CodeGenerator

**Patrones Implementados:**
- ✅ 100% controllers usan `asyncHandler`
- ✅ 100% endpoints usan schemas Joi modulares
- ✅ RLS directo en entidades simples
- ✅ `RLSContextManager` o `RLSHelper.withBypass()` en queries multi-tabla

### Base de Datos (15 Tablas)

```
Core:           organizaciones, usuarios, planes_subscripcion
Negocio:        profesionales, servicios, clientes, horarios_profesionales
Operaciones:    citas, bloqueos_horarios, servicios_profesionales
Subscripciones: subscripciones, historial_subscripciones, metricas_uso_organizacion
Sistema:        eventos_sistema, eventos_sistema_archivo
```

**Seguridad:**
- 20 Políticas RLS (multi-tenant + anti SQL-injection REGEX `^[0-9]+$`)
- 23 Triggers (auto-generación códigos `ORG001-20251013-001`)
- 99 Índices optimizados (GIN full-text, trigram fuzzy search, covering)

### Arquitectura Frontend

**Componentes por Módulo (40 componentes):**
```
components/
├── auth/             # 1: ProtectedRoute
├── bloqueos/         # 6: Calendar, List, Form, Filters, Detail
├── citas/            # 10: Calendar (Día/Mensual), List, Form, Confirmar, Completar, NoShow
├── clientes/         # 5: Card, Form, List, WalkIn
├── common/           # 2: LoadingSpinner, ToastContainer
├── dashboard/        # 4: CitasDelDia, LimitProgressBar, StatCard
├── forms/            # 1: FormField (React Hook Form wrapper)
├── profesionales/    # 5: List, Form, Stats, Horarios, Servicios
├── servicios/        # 3: List, Form, Profesionales
└── ui/               # 6: Button, Input, Modal, Select, Toast
```

**Hooks Personalizados (9 hooks):**
- useAuth, useBloqueos, useCitas, useClientes, useDashboard
- useHorarios, useProfesionales, useServicios, useToast

**Páginas (20 páginas):**
- auth/Login, bloqueos/BloqueosPage, citas/CitasPage
- clientes/ (3 páginas: List, Form, Detail)
- dashboard/Dashboard, landing/LandingPage
- onboarding/ (9 pasos + flow), profesionales/ProfesionalesPage
- servicios/ServiciosPage

**Utilidades:**
- lib/: constants, utils, validations (Zod schemas)
- utils/: bloqueoHelpers, bloqueoValidators, citaValidators
- utils/: dateHelpers, formatters, arrayDiff

**Patrones:**
- ✅ React Query para datos del servidor
- ✅ Zustand para estado UI local
- ✅ Axios interceptor para auto-refresh JWT
- ✅ Zod schemas consistentes con Joi backend
- ✅ Atomic Design implícito (ui → forms → components → pages)

---

## 🔒 Seguridad Multi-Tenant

### Row Level Security (RLS)

**Middleware obligatorio:**
```javascript
router.post('/endpoint',
    auth.authenticateToken,      // 1. JWT
    tenant.setTenantContext,     // 2. RLS ⚠️ CRÍTICO
    rateLimiting.apiRateLimit,   // 3. Rate limit
    validation.validate(schema), // 4. Joi validation
    Controller.metodo            // 5. Business logic
);
```

**Patrón RLS en Models:**
```javascript
// Patrón recomendado: RLSContextManager (v2.0)
const cliente = await RLSContextManager.query(orgId, async (db) => {
    const result = await db.query('SELECT * FROM clientes WHERE id = $1', [id]);
    return result.rows[0];
});

// Transacciones con RLS
await RLSContextManager.transaction(orgId, async (db) => {
    await db.query('INSERT INTO clientes ...');
    await db.query('INSERT INTO citas ...');
});

// Bypass RLS (queries multi-tabla)
const data = await RLSContextManager.withBypass(async (db) => {
    const query = 'SELECT * FROM org o LEFT JOIN sub s ON o.id = s.org_id';
    return await db.query(query);
});
```

**⚠️ CRÍTICO**:
- Usar `RLSContextManager` en nuevos desarrollos (gestión automática)
- Queries con JOINs DEBEN usar `withBypass()`

### RBAC (Roles)

| Recurso | super_admin | propietario/admin | empleado | solo_lectura |
|---------|-------------|-------------------|----------|--------------|
| Organizaciones | ALL (todas) | ALL (su org) | READ | READ |
| Usuarios | ALL | CREATE/UPDATE | - | - |
| Profesionales | ALL | ALL | READ | READ |
| Servicios | ALL | ALL | READ | READ |
| Clientes | ALL | ALL | ALL | READ |
| Citas | ALL | ALL | ALL | READ |

---

## ⚡ Reglas Críticas

### Backend

**1. Controllers confían en RLS**
```javascript
// ✅ CORRECTO (RLS filtra automáticamente)
const query = `SELECT * FROM profesionales WHERE activo = true`;

// ❌ INCORRECTO (redundante)
const query = `SELECT * FROM profesionales WHERE organizacion_id = $1 AND activo = true`;
```

**2. Códigos auto-generados**
```javascript
// ✅ CORRECTO - NO enviar codigo_cita
const cita = await CitaModel.crear({
    cliente_id: 1,
    profesional_id: 2,
    fecha_cita: '2025-10-13'
});
// cita.codigo_cita = "ORG001-20251013-001" (auto-generado por trigger)
```

**3. Wrapping de métodos en rutas**
```javascript
// ✅ CORRECTO - Wrap con arrow function si usa `this`
router.get('/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    (req, res, next) => Controller.obtenerEstadisticas(req, res, next)
);
```

### Frontend

**1. Sanitización de campos opcionales**
```javascript
// ✅ CORRECTO - Backend Joi rechaza ""
const createMutation = useMutation({
  mutationFn: async (data) => {
    const sanitizedData = {
      ...data,
      email: data.email?.trim() || undefined,
      telefono: data.telefono?.trim() || undefined,
    };
    return api.crear(sanitizedData);
  }
});
```

**2. Invalidación de cache**
```javascript
// ✅ CORRECTO - Refrescar datos después de mutation
const createMutation = useMutation({
  mutationFn: api.crear,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['recursos'] });
  }
});
```

**3. Validación con Zod**
```javascript
// ✅ CORRECTO - Usar schemas Zod consistentes
import { citaFormSchema } from '@/lib/validations';

const form = useForm({
  resolver: zodResolver(citaFormSchema),
  defaultValues: {...}
});
```

**4. Helpers de utilidades**
```javascript
// ✅ Usar helpers específicos de módulo
import { validarSolapamientoBloqueos } from '@/utils/bloqueoHelpers';
import { formatearFecha, calcularDuracionMinutos } from '@/utils/dateHelpers';
import { validarTransicionEstado } from '@/utils/citaValidators';
```

---

## 📋 Checklist Nuevos Módulos

### Backend
- [ ] **Routes**: Middleware correcto (auth → tenant → rateLimit → validation)
- [ ] **Controller**: Usa `asyncHandler` y `ResponseHelper`
- [ ] **Model**: RLS directo o `RLSHelper.withBypass()` según caso
- [ ] **Schema**: Joi modular con `commonSchemas`
- [ ] **Tests**: Happy path + edge cases con `db-helper`

### Frontend
- [ ] **Página**: React Query + estados (loading, error, success)
- [ ] **Componentes**: Pequeños, reutilizables, props tipadas
- [ ] **Forms**: React Hook Form + Zod + sanitización
- [ ] **API**: Métodos en `endpoints.js` + invalidación cache

---

## 🔧 Troubleshooting

### Error: Tests con timeout
```bash
# ✅ Usar npm test (configura NODE_ENV=test)
docker exec back npm test

# ❌ NO usar npx jest directamente
```

### Error: "Organización no encontrada" en queries multi-tabla
```javascript
// ✅ Solución: Usar RLSHelper.withBypass()
return await RLSHelper.withBypass(db, async (db) => {
    const query = `SELECT ... FROM org o LEFT JOIN sub s ON ...`;
    return await db.query(query, [id]);
});
```

### Error: Backend 400 "field is not allowed to be empty"
```javascript
// ✅ Solución: Sanitizar "" a undefined antes de enviar
const sanitized = {
  ...data,
  email: data.email?.trim() || undefined
};
```

---

## 📚 Archivos Clave

### Backend
| Ruta | Descripción |
|------|-------------|
| `/backend/app/utils/rlsContextManager.js` | RLS Manager v2.0 (recomendado) |
| `/backend/app/utils/rlsHelper.js` | RLS Helper v1.0 (legacy) |
| `/backend/app/utils/helpers.js` | 8 helper classes (Response, Validation, Date, etc.) |
| `/backend/app/middleware/` | 6 middlewares (auth, tenant, validation, etc.) |
| `/backend/app/__tests__/helpers/db-helper.js` | Helpers de testing |
| `/backend/RLS-HELPERS-GUIDE.md` | Guía completa RLS (10,857 líneas) |

### Frontend
| Ruta | Descripción |
|------|-------------|
| `/frontend/src/services/api/client.js` | Axios + interceptor JWT auto-refresh |
| `/frontend/src/lib/validations.js` | Schemas Zod (onboarding, login, cliente) |
| `/frontend/src/utils/citaValidators.js` | Validaciones de citas (550 líneas) |
| `/frontend/src/utils/bloqueoValidators.js` | Validaciones de bloqueos (234 líneas) |
| `/frontend/src/utils/dateHelpers.js` | Helpers de fechas (529 líneas) |
| `/frontend/src/pages/onboarding/OnboardingFlow.jsx` | Flujo de 9 pasos |

### Base de Datos
| Ruta | Descripción |
|------|-------------|
| `/sql/schema/` | 14 archivos SQL (tablas, índices, triggers, RLS) |
| `/sql/schema/02-functions.sql` | 32 funciones PL/pgSQL |
| `/sql/schema/07-indexes.sql` | 99 índices optimizados |
| `/sql/schema/08-rls-policies.sql` | 20 políticas RLS |

---

---

## 📈 Métricas del Proyecto

### Backend
- **Archivos**: 83 archivos funcionales
- **Controllers**: 13 archivos (10 módulos + 3 sub-controllers de citas)
- **Models**: 14 archivos (10 módulos + 4 sub-models de citas)
- **Middlewares**: 6 middlewares con 32 funciones totales
- **Tests**: 475 tests en 22 suites (100% pass)

### Frontend
- **Componentes**: 40 componentes organizados en 10 módulos
- **Páginas**: 20 páginas (auth, dashboard, CRUD de 6 módulos, onboarding 9 pasos)
- **Hooks**: 9 hooks personalizados con React Query
- **Utilidades**: 6 archivos (1,750 líneas de helpers y validadores)

### Base de Datos
- **Tablas**: 15 tablas principales
- **ENUMs**: 9 tipos enumerados
- **RLS Policies**: 20 políticas activas en 13 tablas
- **Triggers**: 23 triggers (validación + auto-generación + métricas)
- **Funciones**: 32 funciones PL/pgSQL
- **Índices**: 99 índices (GIN full-text, trigram, covering, UNIQUE parciales)

---

**Versión**: 4.0
**Última actualización**: 16 Octubre 2025
**Estado**: ✅ Production Ready | 475/475 tests (100%)
