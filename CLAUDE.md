# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional**.

### Stack Técnico

- **Backend**: Node.js + Express + JWT + RLS Multi-Tenant
- **Base de Datos**: PostgreSQL 17 con 26 políticas RLS
- **IA**: n8n Workflows + Evolution API (WhatsApp)
- **Tests**: Jest + Supertest

### Características Core

- ✅ Multi-tenant con Row Level Security (RLS)
- ✅ Auto-generación de códigos únicos: `ORG001-20251004-001`
- ✅ 10 industrias con 59 plantillas de servicios
- ✅ Canal IA WhatsApp operativo

---

## 📝 Comandos Esenciales

```bash
# Tests Backend (IMPORTANTE: Usar SIEMPRE "npm test")
docker exec back npm test                                    # Suite completa ✅
docker exec back npm test -- __tests__/endpoints/auth.test.js  # Test específico ✅

# ❌ NO USAR: docker exec back npx jest ...
# Razón: No establece NODE_ENV=test y causa timeout

# Docker
npm run start            # Iniciar servicios
npm run stop             # Detener servicios
npm run logs:backend     # Ver logs

# Base de Datos
./sql/tests/run-all-tests.sh                                # Tests SQL
docker exec -it postgres_db psql -U admin -d postgres       # Consola SQL
```

---

## 🧪 Suite de Tests Backend

**Estado Actual**: **257/257 pasando (100%)** ✅

### Fase 1: Integración BD (64 tests) ✅

- RLS Multi-Tenant (21) - Aislamiento de datos por organización
- Auto-generación (11) - Códigos únicos de citas
- Triggers (12) - Validaciones automáticas
- Modelos CRUD (20) - Operaciones básicas de BD

### Fase 2: Middleware (15 tests) ✅

- Auth JWT (6) - Autenticación con tokens
- Tenant Context (9) - Configuración RLS multi-tenant

### Fase 3: Endpoints REST (178 tests) ✅

| Endpoint | Tests | Estado |
|----------|-------|--------|
| **Auth** | **19** | ✅ **100%** |
| **Usuarios** | **26** | ✅ **100%** |
| **Organizaciones** | **18** | ✅ **100%** |
| **Profesionales** | **21** | ✅ **100%** |
| **Servicios** | **27** | ✅ **100%** |
| **Citas** | **28** | ✅ **100%** |
| **Horarios** | **22** | ✅ **100%** |
| **Clientes** | **17** | ✅ **100%** |

---

## 🛡️ Reglas Críticas de Desarrollo

### Orden de Middleware en Rutas (OBLIGATORIO)

```javascript
router.post('/endpoint',
    auth.authenticateToken,      // 1. JWT
    tenant.setTenantContext,     // 2. RLS ⚠️ CRÍTICO
    rateLimiting.apiRateLimit,   // 3. Rate limit
    validation.validate(schema), // 4. Validación
    Controller.metodo            // 5. Controller
);
```

### Arquitectura Multi-Tenant

1. **Controllers confían en RLS** - NO usar `WHERE organizacion_id` manual
2. **Modelos configuran RLS** - Usar `set_config('app.current_tenant_id', ...)`
3. **Backend NO envía `codigo_cita`** - Auto-generado por trigger

### Patrón organizacion_id (Header Enterprise + Validación Condicional)

**Migración**: 2025-10-06 - Header `X-Organization-Id` como estándar enterprise

**SUPER_ADMIN** (Prioridad descendente):
1. **Header X-Organization-Id** (✅ RECOMENDADO - estándar enterprise)
2. Query param `organizacion_id` (⚠️ DEPRECATED - mantener por compatibilidad)
3. Body `organizacion_id` (⚠️ DEPRECATED - solo POST/PUT)

**USUARIOS REGULARES**:
- Siempre usa `req.tenant.organizacionId` del JWT
- Schemas **prohíben** pasar `organizacion_id` (validación condicional Joi)

**Uso en Controllers**:
```javascript
// ✅ Todos los roles (middleware configura automáticamente)
const organizacionId = req.tenant.organizacionId;
```

**Uso en Clientes API (Super_admin)**:
```bash
# ✅ RECOMENDADO - Header
curl -H "Authorization: Bearer TOKEN" \
     -H "X-Organization-Id: 123" \
     GET /api/v1/citas

# ⚠️ DEPRECATED - Query param
curl -H "Authorization: Bearer TOKEN" \
     GET /api/v1/citas?organizacion_id=123
```

**Schemas Joi (Validación Condicional)**:
```javascript
// organizacion_id con validación por rol
query: Joi.object({
    organizacion_id: Joi.when('$userRole', {
        is: 'super_admin',
        then: commonSchemas.id.optional(),  // Super_admin puede pasarlo
        otherwise: Joi.forbidden()           // Usuarios normales NO pueden
    })
})
```

**Middleware validation.js** pasa contexto automático:
```javascript
const context = {
    userRole: req.user?.rol,
    userId: req.user?.id,
    organizacionId: req.user?.organizacion_id
};
```

**Ventajas del Header**:
- ✅ Estándar enterprise (AWS, Stripe, Twilio)
- ✅ URLs limpias → mejor caching
- ✅ Fácil filtrado en firewalls/proxies
- ✅ Más seguro (validación condicional previene ataques)

### Schemas de BD vs Código

**CRÍTICO**: Mantener consistencia entre columnas de BD y queries:
- Tabla `organizaciones`: usar `nombre_comercial` (NO `nombre`)
- Tabla `profesionales`: usar `nombre_completo` (NO `nombre`) y `especialidades` (NO `especialidad`)
- Tabla `horarios_disponibilidad`: usar `estado` ENUM (NO `disponible` boolean)
- Estados de cita: `'en_curso'` (NO `'en_proceso'`)

### Testing

**Helpers**: `require('../helpers/db-helper')`

Funciones principales:
- `createTestOrganizacion(client, data)` - Crea org con RLS bypass
- `createTestUsuario(client, orgId, data)` - Genera token JWT automático
- `createTestProfesional(client, orgId, data)`
- `createTestServicio(client, orgId, data, profesionales_ids)` - Asocia automáticamente con profesionales
- `createTestCita(client, orgId, data)` - NO enviar `codigo_cita` (auto-generado)
- `cleanAllTables(client)` - Limpia en orden correcto (evita FK violations)

**Setup básico**:
```javascript
beforeAll(async () => {
  client = await global.testPool.connect();
  await cleanAllTables(client);

  testOrg = await createTestOrganizacion(client);
  testUsuario = await createTestUsuario(client, testOrg.id, { rol: 'propietario' });
  testProfesional = await createTestProfesional(client, testOrg.id);

  testServicio = await createTestServicio(client, testOrg.id, {
    nombre: 'Test',
    precio: 100.00
  }, [testProfesional.id]);
});
```

---

## 🏗️ Patrones de Arquitectura

### Helpers Reutilizables

#### 1. AsyncHandler - Manejo Automático de Errores

**Archivo**: `backend/app/middleware/asyncHandler.js`

Elimina la necesidad de try/catch en cada controller:

```javascript
const { asyncHandler } = require('../middleware');

// ❌ ANTES (con try/catch manual)
static async metodo(req, res) {
    try {
        const result = await Model.operacion(req.body);
        return ResponseHelper.success(res, result);
    } catch (error) {
        logger.error('Error', { error: error.message });
        return ResponseHelper.error(res, error.message, 500);
    }
}

// ✅ AHORA (con asyncHandler)
static metodo = asyncHandler(async (req, res) => {
    const result = await Model.operacion(req.body);
    return ResponseHelper.success(res, result);
});
```

**Características**:
- Mapeo automático de errores a códigos HTTP (401, 403, 404, 409, 423, 500)
- Logging centralizado de errores
- Detecta patrones en mensajes de error

#### 2. RLSHelper - Contexto Multi-Tenant Reutilizable

**Archivo**: `backend/app/utils/rlsHelper.js`

Centraliza la lógica RLS multi-tenant:

```javascript
const RLSHelper = require('../utils/rlsHelper');

// Configurar contexto RLS
await RLSHelper.configurarContexto(db, userId, role, orgId);

// Ejecutar con bypass (super_admin)
await RLSHelper.withBypass(db, async (db) => {
    return await db.query('SELECT * FROM usuarios');
});

// Ejecutar con rol específico
await RLSHelper.withRole(db, 'login_context', async (db) => {
    return await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
});

// Registrar evento de auditoría
await RLSHelper.registrarEvento(db, {
    organizacion_id: orgId,
    evento_tipo: 'usuario_creado',
    entidad_tipo: 'usuario',
    entidad_id: userId,
    descripcion: 'Usuario creado exitosamente',
    metadatos: { email, rol },
    usuario_id: adminId
});
```

**Funciones disponibles**:
- `configurarContexto(db, userId, role, orgId)` - Configurar contexto RLS
- `withContext(db, context, callback)` - Ejecutar con contexto específico
- `withBypass(db, callback)` - Ejecutar con bypass RLS
- `withRole(db, role, callback)` - Ejecutar con rol específico
- `withSelfAccess(db, userId, callback)` - Ejecutar con acceso propio
- `registrarEvento(db, eventoData)` - Registrar evento de auditoría

---

## 🎯 Patrones de Implementación

### Validaciones con Joi Schemas

**Endpoints que usan schemas Joi modulares**:
- ✅ `auth` → `schemas/auth.schemas.js`
- ✅ `usuarios` → `schemas/usuario.schemas.js`
- ✅ `citas` → `schemas/cita.schemas.js`
- ✅ `servicios` → `schemas/servicio.schemas.js`
- ✅ `profesionales` → `schemas/profesional.schemas.js`
- ✅ `organizaciones` → `schemas/organizacion.schemas.js`
- ✅ `horarios` → `schemas/horario.schemas.js`
- ✅ `clientes` → `schemas/cliente.schemas.js`

**Ejemplo de uso**:
```javascript
// schemas/servicio.schemas.js
const crear = {
    body: Joi.object({
        nombre: Joi.string().trim().min(1).max(100).required(),
        precio: commonSchemas.price.required()
    })
};

// routes/servicios.js
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.crear),
    ServicioController.crear
);
```

### RLS: Cuándo usar RLSHelper vs Directo

**🔐 RLSHelper (Módulos con lógica compleja)**

Usar en módulos como **Auth/Usuarios** que requieren múltiples contextos:

```javascript
const RLSHelper = require('../utils/rlsHelper');

// Bypass para operaciones de sistema
static async buscarPorEmail(email) {
    const db = await getDb();
    try {
        return await RLSHelper.withRole(db, 'login_context', async (db) => {
            const query = `SELECT * FROM usuarios WHERE email = $1`;
            const result = await db.query(query, [email]);
            return result.rows[0];
        });
    } finally {
        db.release();
    }
}

// Self-access para operaciones del propio usuario
static async actualizarPerfil(userId, datos) {
    const db = await getDb();
    try {
        return await RLSHelper.withSelfAccess(db, userId, async (db) => {
            const query = `UPDATE usuarios SET nombre = $1 WHERE id = $2`;
            const result = await db.query(query, [datos.nombre, userId]);
            return result.rows[0];
        });
    } finally {
        db.release();
    }
}
```

**Cuándo usar cada contexto de RLSHelper**:
- `withBypass()` - Operaciones de sistema (refresh tokens, validaciones globales)
- `withRole()` - Operaciones con rol específico (login, registro)
- `withSelfAccess()` - Usuario accediendo sus propios datos

**⚡ RLS Directo (Módulos simple multi-tenant)**

Usar en módulos como **Organizaciones/Profesionales/Servicios/Citas/Horarios/Clientes** que solo necesitan tenant context:

```javascript
// ✅ PATRÓN SIMPLE - RLS directo
static async crear(data) {
    const db = await getDb();
    try {
        await db.query('SELECT set_config($1, $2, false)',
            ['app.current_tenant_id', data.organizacion_id.toString()]);

        const query = `INSERT INTO profesionales (...) VALUES (...) RETURNING *`;
        const result = await db.query(query, values);
        return result.rows[0];
    } finally {
        db.release();
    }
}
```

**Ventajas RLS Directo**:
- ✅ Más simple y directo
- ✅ Menos dependencias
- ✅ Mejor para operaciones CRUD estándar
- ✅ Mismo nivel de seguridad

**Regla general**:
- 📋 **RLS Directo**: Módulos de entidades (Profesionales, Servicios, Citas, Horarios, Clientes, Organizaciones)
- 🔐 **RLSHelper**: Módulos con lógica de autenticación/autorización compleja (Auth, Usuarios)

---

## 🚀 Checklist para Nuevos Módulos

Al crear/refactorizar un módulo, verificar:

**Routes** (`routes/api/v1/[modulo].js`):
- [ ] 1 línea por endpoint
- [ ] Middleware en orden correcto: auth → tenant → rateLimit → validation → controller
- [ ] Agrupación lógica (públicas vs privadas)
- [ ] Sin comentarios JSDoc redundantes

**Controller** (`controllers/[modulo].controller.js`):
- [ ] Todos los métodos usan `asyncHandler`
- [ ] Sin try/catch manual
- [ ] Sin logs de éxito (solo errores críticos)
- [ ] Usa `ResponseHelper` para respuestas

**Model** (`database/[modulo].model.js`):
- [ ] Usa RLS apropiado según complejidad:
  - **RLS directo** para módulos de entidades (Profesionales, Servicios)
  - **RLSHelper** para módulos con lógica compleja (Auth)
- [ ] Contexto apropiado según operación
- [ ] `db.release()` en bloque finally
- [ ] Comentarios solo en lógica compleja

**Schemas** (`schemas/[modulo].schemas.js`):
- [ ] Constantes de validación centralizadas
- [ ] Schemas reutilizables (composición)
- [ ] Usa `commonSchemas` cuando sea posible
- [ ] Sin comentarios JSDoc por schema

**Tests** (`__tests__/endpoints/[modulo].test.js`):
- [ ] Usa helpers de `db-helper`
- [ ] Limpieza en beforeAll/afterAll
- [ ] Cobertura: happy path + edge cases
- [ ] 100% de tests pasando

---

## 📚 Archivos Clave

- `sql/README.md` - Documentación de BD
- `sql/schema/*.sql` - 26 políticas RLS, 26 triggers, 34 funciones
- `backend/TESTING_PLAN.md` - Plan de testing completo
- `backend/app/schemas/*.schemas.js` - Validaciones Joi reutilizables
- `backend/app/middleware/asyncHandler.js` - Manejo automático de errores
- `backend/app/utils/rlsHelper.js` - Helper RLS reutilizable
- `backend/app/utils/passwordHelper.js` - Helper de contraseñas (hash, validación)
- `backend/app/__tests__/helpers/db-helper.js` - Helpers de testing
- `PROMPT_AGENTE_N8N.md` - Workflows IA

---

## 🔧 Problemas Comunes Resueltos

### Error: "column does not exist"
```javascript
// ❌ INCORRECTO
SELECT nombre FROM organizaciones
SELECT p.nombre, p.especialidad FROM profesionales
UPDATE horarios SET disponible = true

// ✅ CORRECTO
SELECT nombre_comercial FROM organizaciones
SELECT p.nombre_completo, p.especialidades FROM profesionales
UPDATE horarios SET estado = 'disponible'
```

### Error: "El profesional no está autorizado para realizar este servicio"
**Causa**: Falta asociación en `servicios_profesionales`
**Solución**: Usar `createTestServicio(client, orgId, data, [profesionalId])`

### Error: "column reference 'activo' is ambiguous"
**Causa**: Query de estadísticas tiene JOIN con columnas duplicadas
**Solución**: Usar alias de tabla explícitos `s.activo` en lugar de `activo`
```sql
-- ✅ CORRECTO
SELECT COUNT(*) FILTER (WHERE s.activo = true) as servicios_activos
FROM servicios s
LEFT JOIN servicios_profesionales sp ON s.id = sp.servicio_id
```

### Error: Tests con timeout o "NODE_ENV debe ser test"
**Síntomas**:
```
Error: Command timed out after 1m 0s
❌ NODE_ENV debe ser "test" para ejecutar tests
TypeError: Cannot read properties of undefined (reading 'connect')
```

**❌ NO USAR**:
```bash
docker exec back npx jest __tests__/endpoints/auth.test.js
```

**✅ SOLUCIÓN - Usar SIEMPRE `npm test`**:
```bash
# Suite completa
docker exec back npm test

# Test específico
docker exec back npm test -- __tests__/endpoints/auth.test.js

# Con watch mode (desarrollo)
docker exec back npm test -- --watch __tests__/endpoints/auth.test.js
```

**Por qué funciona**:
- El script `npm test` en `package.json` establece `NODE_ENV=test`
- Incluye `--forceExit` para evitar que Jest se quede colgado
- Configura correctamente el pool de conexiones de prueba

---

## 📊 Estado del Proyecto

**Actualizado**: 05 Octubre 2025

| Componente | Estado | Métricas |
|------------|--------|----------|
| Base de Datos PostgreSQL | ✅ Production Ready | 26 RLS policies, 34 funciones |
| Backend API (REST + RLS) | ✅ Operativo | Multi-tenant activo |
| **Suite de Tests** | ✅ **257/257 (100%)** | 0 skipped, 0 failed |
| **Módulo Auth** | ✅ **100%** | 19 tests, arquitectura RESTful |
| **Módulo Usuarios** | ✅ **100%** | 26 tests, endpoints RESTful |
| **Módulo Organizaciones** | ✅ **100%** | 18 tests |
| **Módulo Profesionales** | ✅ **100%** | 21 tests |
| **Módulo Servicios** | ✅ **100%** | 27 tests |
| **Módulo Citas** | ✅ **100%** | 28 tests |
| **Módulo Horarios** | ✅ **100%** | 22 tests |
| **Módulo Clientes** | ✅ **100%** | 17 tests |
| Canal IA WhatsApp | ✅ Operativo | n8n + Evolution API |

### Arquitectura de Módulos

**Separación de Concerns (RESTful)**:
- `/auth` - Manejo de sesiones (login, logout, refresh, cambio contraseña)
- `/usuarios` - CRUD de usuarios (crear, listar, actualizar, desbloquear, cambiar rol)

**Patrón Establecido**:
- **Módulos de entidades** → RLS directo (Organizaciones, Profesionales, Servicios, Citas, Horarios, Clientes)
- **Módulos con lógica compleja** → RLSHelper (Auth, Usuarios)

### Optimizaciones Completadas (Oct 2025)

**Módulos Optimizados**:
- ✅ Auth: Migración a asyncHandler, RLSHelper, schemas Joi (-187 líneas totales)
- ✅ Usuarios: Eliminación de logs redundantes, simplificación JSDoc (-38 líneas)
- ✅ Organizaciones: Validación de consistencia con BD, simplificación JSDoc (-14 líneas)
- ✅ Profesionales: Migración a asyncHandler, RLS directo (-387 líneas, -26.9%)
- ✅ Servicios: Migración a schemas Joi (-370 líneas)
- ✅ Separación Auth/Usuarios: Arquitectura RESTful (-124 líneas en Auth)
- ✅ **Citas (Completo)**: Optimización integral (-465 líneas, -14.6%)

**Métricas Actuales por Módulo** (líneas de código):

| Módulo | Routes | Controller | Model | Schemas | Total |
|--------|--------|------------|-------|---------|-------|
| Auth | 42 | 223 | 961* | 356 | 1,582 |
| Usuarios | 72 | 143 | 961* | 162 | 1,338 |
| Organizaciones | 103 | 120 | 683 | 262 | 1,168 |
| Profesionales | 98 | 168 | 477 | 310 | 1,053 |
| Servicios | 119 | 199 | 574 | 204 | 1,096 |
| Clientes | 91 | 158 | 652 | 305 | 1,206 |
| Horarios | 152 | 283 | 866 | 211 | 1,512 |
| **Citas** | **232** | **529** | **1,895** | **463** | **3,119** |

*Comparten `usuario.model.js`

**Desglose Módulo Citas** (optimizado):
- Controllers: 529 líneas (base: 111, operacional: 193, ai: 175, recordatorios: 50)
- Models: 1,895 líneas (base: 479, operacional: 562, ai: 421, recordatorios: 112, helpers: 321)
- Reducción total: -465 líneas (-14.6%)

### Detalles de Optimización Módulo Citas

**Patrón aplicado**: Eliminación de comentarios JSDoc redundantes, logs informativos, comentarios obvios

**Controllers optimizados** (-148 líneas):
- `cita.base.controller.js`: CRUD estándar (111 líneas)
- `cita.operacional.controller.js`: Check-in, workflow (193 líneas)
- `cita.ai.controller.js`: Webhooks IA/n8n (175 líneas)
- `cita.recordatorios.controller.js`: Notificaciones (50 líneas)

**Models optimizados** (-317 líneas):
- `cita.base.model.js`: -31 líneas (-6.1%)
- `cita.operacional.model.js`: -70 líneas (-11.1%)
- `cita.ai.model.js`: -85 líneas (-16.8%)
- `cita.recordatorios.model.js`: -24 líneas (-17.6%)
- `cita.helpers.model.js`: -107 líneas (-25.0%)

**Tests**: 28/28 pasando (100%)

### Próximos Pasos

**Candidatos para Mejora**:
1. Módulo Clientes - Aplicar patrón asyncHandler + RLS directo
2. Módulo Horarios - Optimizar controller (283 líneas)
3. Consolidar helpers comunes entre módulos
