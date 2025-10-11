# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (WhatsApp).

---

## 📊 Estado Actual del Proyecto

**Actualizado**: 10 Octubre 2025

| Componente | Estado | Métricas |
|------------|--------|----------|
| **Backend API** | ✅ **100%** | 9 módulos, RLS activo |
| **Frontend React** | ✅ **100%** | Onboarding E2E validado |
| **Base de Datos** | ✅ **100%** | 17 tablas, 17 RLS policies, 152 índices |
| **Suite Tests Backend** | ✅ **481/482 (99.8%)** | 25 suites, ~41s ejecución |
| **Tests SQL** | ✅ **5/5 (100%)** | Setup, RLS, Performance |
| **Sistema IA** | ✅ **Operativo** | n8n + Evolution API (WhatsApp) |
| **Docker** | ✅ **Running** | 7 contenedores |

---

## 🛠 Stack Técnico

### Frontend
- **Framework**: React 19.1.1 + Vite 7.1.7
- **Routing**: React Router DOM 7.9.4
- **State Management**: Zustand 5.0.8 (client) + TanStack React Query 5.90.2 (server)
- **Forms**: React Hook Form 7.64.0 + Zod 4.1.12 (validación)
- **HTTP Client**: Axios 1.12.2 (con interceptores JWT)
- **UI**: Tailwind CSS 3.4.18 + Lucide Icons + Framer Motion 12.23.22
- **Code Quality**: ESLint 9.37.0 + Prettier 3.6.2

### Backend
- **Runtime**: Node.js + Express.js
- **Auth**: JWT (7d access + 30d refresh tokens)
- **Validación**: Joi schemas modulares
- **Testing**: Jest + Supertest
- **Logs**: Winston (JSON structured)

### Base de Datos
- **PostgreSQL 17 Alpine**
- **Multi-Tenant**: Row Level Security (RLS) con anti SQL-injection
- **Performance**: 152 índices (covering, GIN, GIST)
- **Auto-generación**: Códigos únicos `ORG001-20251009-001`

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

# ❌ NO USAR: docker exec back npx jest ...
# Razón: No establece NODE_ENV=test correctamente
```

### Tests SQL

```bash
./sql/tests/run-all-tests.sh    # 5/5 tests
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

# Ver tablas y políticas RLS
docker exec postgres_db psql -U admin -d postgres -c "\dt"
docker exec postgres_db psql -U admin -d postgres -c "\d organizaciones"
```

### Frontend

```bash
cd frontend

# Desarrollo (http://localhost:3001)
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint        # Verificar
npm run lint:fix    # Auto-fix

# Formateo
npm run format       # Aplicar Prettier
npm run format:check # Solo verificar
```

---

## 🏗 Arquitectura del Sistema

### Módulos Backend

| Módulo | Patrón RLS | Tests |
|--------|------------|-------|
| **Auth** | RLSHelper | 19/19 ✅ |
| **Usuarios** | RLSHelper | 24/24 ✅ |
| **Organizaciones** | RLSHelper (con bypass) | 31/31 ✅ |
| **Profesionales** | RLS Directo | 26/26 ✅ |
| **Servicios** | RLS Directo | 28/28 ✅ |
| **Clientes** | RLS Directo | 22/22 ✅ |
| **Horarios** | RLS Directo | 24/24 ✅ |
| **Citas** | RLS Directo | 42/42 ✅ |
| **Bloqueos** | RLS Directo | 8/8 ✅ |

**Patrones Implementados**:
- ✅ 100% controllers usan `asyncHandler` (manejo automático de errores)
- ✅ 100% endpoints usan schemas Joi modulares
- ✅ 100% responses usan `ResponseHelper` (formato consistente)
- ✅ Módulos de entidades usan RLS directo (más simple)
- ✅ Módulos con lógica compleja usan `RLSHelper` con bypass

### Base de Datos PostgreSQL

**17 Tablas Organizadas**:
```
Core:           organizaciones, usuarios, planes_subscripcion
Catálogo:       plantillas_servicios, profesionales
Negocio:        servicios, clientes, horarios_profesionales, horarios_disponibilidad
Operaciones:    citas, bloqueos_horarios, servicios_profesionales
Subscripciones: subscripciones, historial_subscripciones, metricas_uso_organizacion
Sistema:        eventos_sistema, eventos_sistema_archivo
```

**Seguridad**:
- 17 Políticas RLS (multi-tenant + anti SQL-injection REGEX `^[0-9]+$`)
- 27 Triggers (auto-generación, capacidad, timestamps)
- 40 Funciones PL/pgSQL

### Arquitectura Frontend

**Estructura de Carpetas**:
```
src/
├── app/              # Configuración de app y router
├── components/       # Componentes reutilizables
│   ├── auth/         # Formularios de login/registro
│   ├── clientes/     # Componentes de gestión de clientes
│   ├── dashboard/    # Widgets del dashboard
│   ├── forms/        # Form components (FormField, etc)
│   └── ui/           # UI primitives (Button, Input, Modal, etc)
├── hooks/            # Custom React hooks
├── lib/              # Utilidades y validaciones
├── pages/            # Páginas/Vistas principales
│   ├── auth/         # Login
│   ├── clientes/     # Gestión de clientes
│   ├── dashboard/    # Dashboard principal
│   ├── landing/      # Landing page pública
│   └── onboarding/   # Wizard de onboarding (6 pasos)
├── services/         # Servicios externos
│   └── api/          # Cliente Axios + endpoints
├── store/            # Estado global Zustand
└── styles/           # Estilos globales
```

**Patrones Implementados**:
- ✅ Atomic Design en componentes UI
- ✅ Custom hooks para lógica reutilizable
- ✅ React Query para cache y sincronización con backend
- ✅ Zustand con persistencia en localStorage
- ✅ Axios interceptor para refresh automático de tokens
- ✅ Validación con Zod schemas (consistente con backend Joi)

---

## 🔒 Seguridad Multi-Tenant

### Row Level Security (RLS)

**Patrón Middleware** (OBLIGATORIO en rutas protegidas):

```javascript
router.post('/endpoint',
    auth.authenticateToken,      // 1. JWT
    tenant.setTenantContext,     // 2. RLS ⚠️ CRÍTICO
    rateLimiting.apiRateLimit,   // 3. Rate limit
    validation.validate(schema), // 4. Validación
    Controller.metodo            // 5. Controller
);
```

**Configuración RLS en Models**:

```javascript
// Patrón 1: RLS Directo (entidades simples)
const db = await getDb();
try {
    await db.query('SELECT set_config($1, $2, false)',
        ['app.current_tenant_id', organizacion_id.toString()]);

    const result = await db.query(query, values);
    return result.rows[0];
} finally {
    db.release();
}

// Patrón 2: RLSHelper con Bypass (queries multi-tabla o admin)
const db = await getDb();
try {
    return await RLSHelper.withBypass(db, async (db) => {
        const result = await db.query(query, values);
        return result.rows[0];
    });
} finally {
    db.release();
}
```

**⚠️ CRÍTICO**: Queries con JOINs de múltiples tablas (ej: `verificarLimites`, `obtenerMetricas`) DEBEN usar `RLSHelper.withBypass()` para evitar errores 404.

### RBAC (Control de Acceso por Roles)

| Recurso | super_admin | propietario/admin | usuario | solo_lectura |
|---------|-------------|-------------------|---------|--------------|
| Organizaciones | ALL (todas) | ALL (su org) | READ (su org) | READ |
| Usuarios | ALL | CREATE/READ/UPDATE | - | - |
| Profesionales | ALL | ALL | READ | READ |
| Servicios | ALL | ALL | READ | READ |
| Clientes | ALL | ALL | ALL | READ |
| Citas | ALL | ALL | ALL | READ |

---

## 🧪 Testing

### Estado de Tests

**Backend**: 481/482 tests pasando (99.8%)
- Endpoints: 216 tests
- Integration: 64 tests
- RBAC: 33 tests
- E2E: 120 tests (incluye onboarding completo)
- Otros: 48 tests

**Frontend**: E2E validado manualmente
- Onboarding flow (6 pasos) ✅ Completado exitosamente
- Dashboard con datos reales ✅ Funcionando
- Integración API completa ✅ Validada

**SQL**: 5/5 tests pasando (100%)

### Helpers de Testing

```javascript
const {
    createTestOrganizacion,
    createTestUsuario,       // Genera token JWT automático
    createTestProfesional,
    createTestServicio,      // Asocia con profesionales automáticamente
    createTestCita,          // NO enviar codigo_cita (auto-generado)
    cleanAllTables
} = require('../helpers/db-helper');

beforeAll(async () => {
    client = await global.testPool.connect();
    await cleanAllTables(client);

    testOrg = await createTestOrganizacion(client);
    testUsuario = await createTestUsuario(client, testOrg.id, { rol: 'admin' });
});
```

---

## ⚡ Reglas Críticas de Desarrollo

### 1. Controllers Confían en RLS

```javascript
// ✅ CORRECTO (RLS filtra automáticamente)
const query = `SELECT * FROM profesionales WHERE activo = true`;

// ❌ INCORRECTO (redundante)
const query = `SELECT * FROM profesionales WHERE organizacion_id = $1 AND activo = true`;
```

### 2. Códigos Auto-generados

```javascript
// ✅ CORRECTO
const cita = await CitaModel.crear({
    cliente_id: 1,
    profesional_id: 2,
    servicio_id: 3,
    fecha_cita: '2025-10-10'
    // NO enviar codigo_cita
});
// cita.codigo_cita = "ORG001-20251010-001" (auto-generado por trigger)
```

### 3. Wrapping de Métodos en Rutas

**⚠️ IMPORTANTE**: Métodos del controller que usan `this` deben envolverse en arrow functions:

```javascript
// ✅ CORRECTO
router.get('/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    validation.validate(organizacionSchemas.obtenerEstadisticas),
    (req, res, next) => OrganizacionController.obtenerEstadisticas(req, res, next)
);

// ❌ INCORRECTO (puede causar problemas de binding)
router.get('/:id/estadisticas',
    ...
    OrganizacionController.obtenerEstadisticas  // Sin wrap
);
```

### 4. Queries Multi-tabla Usan Bypass RLS

```javascript
// ✅ CORRECTO - Para queries con múltiples JOINs
static async verificarLimites(organizacionId) {
    const db = await getDb();
    try {
        return await RLSHelper.withBypass(db, async (db) => {
            const query = `
                SELECT ...
                FROM organizaciones o
                LEFT JOIN subscripciones sub ON ...
                LEFT JOIN planes_subscripcion ps ON ...
                LEFT JOIN citas c ON ...
                WHERE o.id = $1
            `;
            const result = await db.query(query, [organizacionId]);
            return result.rows[0];
        });
    } finally {
        db.release();
    }
}
```

### 5. Nombres de Columnas BD

```javascript
// ✅ CORRECTO (nombres exactos de BD)
SELECT nombre_comercial FROM organizaciones;
SELECT nombre_completo, especialidades FROM profesionales;
UPDATE citas SET estado = 'en_curso';

// ❌ INCORRECTO
SELECT nombre FROM organizaciones;              // No existe
SELECT especialidad FROM profesionales;         // No existe (es plural)
UPDATE citas SET estado = 'en_proceso';        // ENUM inválido
```

### 6. Header X-Organization-Id (Super Admin)

```bash
# ✅ RECOMENDADO (super_admin)
curl -H "Authorization: Bearer TOKEN" \
     -H "X-Organization-Id: 123" \
     GET /api/v1/citas

# 🟡 DEPRECATED (mantener por compatibilidad)
curl -H "Authorization: Bearer TOKEN" \
     GET /api/v1/citas?organizacion_id=123
```

---

## ⚡ Reglas Críticas Frontend

### 1. Sanitización de Campos Opcionales

**⚠️ CRÍTICO**: Backend Joi rechaza strings vacíos (`""`) en campos opcionales. Convertir a `undefined` antes de enviar.

```javascript
// ✅ CORRECTO - Sanitizar antes de mutation
const createMutation = useMutation({
  mutationFn: async (data) => {
    const sanitizedData = {
      ...data,
      email: data.email?.trim() || undefined,
      telefono: data.telefono?.trim() || undefined,
      descripcion: data.descripcion?.trim() || undefined,
    };
    return api.crear(sanitizedData);
  }
});

// ❌ INCORRECTO - Enviar strings vacíos
const data = { email: "", telefono: "" };  // Backend retorna 400
```

### 2. Axios Interceptor y Token Refresh

```javascript
// El interceptor en client.js maneja automáticamente:
// - Agregar Bearer token a todas las requests
// - Auto-refresh cuando token expira (401)
// - Logout si refresh falla

// ✅ NO necesitas manejar tokens manualmente en componentes
const response = await api.crear(data); // Token se agrega automáticamente

// ❌ NO hagas esto
axios.post(url, data, {
  headers: { Authorization: `Bearer ${token}` }  // Redundante
});
```

### 3. React Query + Zustand

```javascript
// ✅ CORRECTO - Datos del servidor en React Query
const { data: profesionales } = useQuery({
  queryKey: ['profesionales'],
  queryFn: profesionalesApi.listar,
});

// ✅ CORRECTO - Estado UI local en Zustand
const { user, setAuth, logout } = useAuthStore();

// ❌ INCORRECTO - Mezclar responsabilidades
const [profesionales, setProfesionales] = useState([]); // Usar React Query
```

### 4. Validación con Zod

```javascript
// ✅ Schemas Zod deben coincidir con validaciones backend Joi

// Frontend (Zod)
const schema = z.object({
  email: z.string().email().optional().or(z.literal('')),  // Permite ""
  telefono: z.string().optional().or(z.literal('')),       // Sanitizar después
});

// Backend (Joi)
email: Joi.string().email().allow(null),  // NO permite ""
```

### 5. Invalidación de Cache

```javascript
// ✅ Invalidar cache después de mutations para refrescar datos
const createMutation = useMutation({
  mutationFn: api.crear,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['profesionales'] });
  }
});

// Step4_Professionals.jsx:63 - Ejemplo real
```

---

## 📋 Checklist para Nuevos Módulos

### Backend

**Routes** (`routes/api/v1/[modulo].js`):
- [ ] Middleware en orden: auth → tenant → rateLimit → validation → controller
- [ ] Métodos del controller envueltos en arrow functions si usan `this`

**Controller** (`controllers/[modulo].controller.js`):
- [ ] Todos los métodos usan `asyncHandler`
- [ ] Sin try/catch manual (asyncHandler lo maneja)
- [ ] Usa `ResponseHelper` para respuestas

**Model** (`database/[modulo].model.js`):
- [ ] RLS directo para queries simples de una tabla
- [ ] `RLSHelper.withBypass()` para queries multi-tabla o admin
- [ ] `db.release()` en bloque finally

**Schemas** (`schemas/[modulo].schemas.js`):
- [ ] Reutiliza `commonSchemas` cuando sea posible
- [ ] Validación condicional para `organizacion_id` según rol

**Tests** (`__tests__/endpoints/[modulo].test.js`):
- [ ] Usa helpers de `db-helper`
- [ ] Limpieza en beforeAll/afterAll
- [ ] Cobertura: happy path + edge cases

### Frontend

**Página/Vista** (`pages/[modulo]/[Componente].jsx`):
- [ ] Usa React Query para datos del servidor
- [ ] Usa Zustand solo para estado UI local
- [ ] Manejo de estados: loading, error, success

**Componentes** (`components/[categoria]/[Componente].jsx`):
- [ ] Props tipadas con PropTypes o comentarios JSDoc
- [ ] Componentes pequeños y reutilizables
- [ ] Separación de lógica en custom hooks cuando sea necesario

**Formularios**:
- [ ] React Hook Form + Zod para validación
- [ ] Sanitización de campos opcionales antes de mutation
- [ ] Mensajes de error claros y en español

**API Integration** (`services/api/endpoints.js`):
- [ ] Métodos exportados desde endpoints centralizados
- [ ] NO crear instancias axios nuevas (usar apiClient)
- [ ] Invalidar cache de React Query después de mutations

---

## 🔧 Troubleshooting

### Error: Tests con timeout

**Solución**: Usar SIEMPRE `npm test`
```bash
docker exec back npm test  # ✅ Correcto
docker exec back npx jest  # ❌ Incorrecto (no configura NODE_ENV)
```

### Error: "Organización no encontrada" en queries multi-tabla

**Causa**: Query con JOINs no usa bypass RLS

**Solución**: Usar `RLSHelper.withBypass()` en el método del model

```javascript
static async obtenerEstadisticas(organizacionId) {
    const db = await getDb();
    try {
        // ✅ Agregar bypass para queries con JOINs
        return await RLSHelper.withBypass(db, async (db) => {
            const query = `SELECT ... FROM organizaciones o LEFT JOIN ...`;
            const result = await db.query(query, [organizacionId]);
            return result.rows[0];
        });
    } finally {
        db.release();
    }
}
```

### Error: Backend 400 "field is not allowed to be empty"

**Causa**: Frontend envía `""` (string vacío) en campos opcionales, backend Joi los rechaza

**Solución**: Sanitizar campos opcionales convirtiendo `""` a `undefined`

```javascript
// ✅ En mutation function
const sanitizedData = {
  ...data,
  email: data.email?.trim() || undefined,
  telefono: data.telefono?.trim() || undefined,
};
```

**Archivos corregidos**: `Step3_AccountSetup.jsx:46`, `Step4_Professionals.jsx:49`, `Step5_Services.jsx:65`

### Error: React Query no actualiza datos después de mutation

**Causa**: Falta invalidar el cache después de crear/actualizar/eliminar

**Solución**: Usar `invalidateQueries` en `onSuccess`

```javascript
const createMutation = useMutation({
  mutationFn: api.crear,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['recursos'] });
  }
});
```

---

## 📚 Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `/CLAUDE.md` | Esta guía del proyecto |
| **Backend** | |
| `/backend/app/config/auth.js` | Configuración JWT (7d access, 30d refresh) |
| `/backend/app/schemas/*.schemas.js` | Validaciones Joi modulares |
| `/backend/app/utils/rlsHelper.js` | Helper RLS multi-tenant |
| `/backend/app/__tests__/helpers/db-helper.js` | Helpers de testing |
| `/backend/app/__tests__/README.md` | Plan de testing backend |
| **Frontend** | |
| `/frontend/src/services/api/client.js` | Axios con interceptor JWT |
| `/frontend/src/services/api/endpoints.js` | Endpoints API centralizados |
| `/frontend/src/store/authStore.js` | Zustand store de autenticación |
| `/frontend/src/lib/validations.js` | Schemas Zod de validación |
| `/frontend/src/pages/onboarding/` | Wizard de 6 pasos |
| **Base de Datos** | |
| `/sql/README.md` | Documentación de BD (RLS, triggers, funciones) |
| `/sql/schema/*.sql` | Schema completo de BD |

---

## 🚀 Mejoras Recientes (Oct 2025)

**Frontend (10 Oct 2025)**:
- ✅ **Flujo Onboarding E2E validado** (6 pasos funcionando completamente)
- ✅ **Fix**: Sanitización de campos opcionales en Steps 3, 4 y 5 (3 bugs corregidos)
- ✅ **Fix**: Removido campo inexistente `rfc_nif` en Step3_AccountSetup
- ✅ Dashboard con datos reales del backend funcionando
- ✅ Integración completa con API: profesionales, servicios, clientes, citas

**Backend**:
- ✅ Migración completa a `asyncHandler` en todos los controllers
- ✅ Schemas Joi modulares en todos los endpoints
- ✅ Separación arquitectónica Auth/Usuarios
- ✅ Fix: RLSHelper.withBypass en queries multi-tabla (organizaciones)
- ✅ Wrapping de métodos controller en rutas

**Base de Datos**:
- ✅ Auto-generación de `codigo_cita` con triggers
- ✅ 152 índices optimizados (covering, GIN, GIST)
- ✅ Políticas RLS anti SQL-injection (REGEX `^[0-9]+$`)

---

**Versión**: 2.1
**Última actualización**: 10 Octubre 2025
**Estado**: ✅ Production Ready | Backend 481/482 (99.8%) | Frontend E2E validado
**Mantenido por**: Equipo de Desarrollo
