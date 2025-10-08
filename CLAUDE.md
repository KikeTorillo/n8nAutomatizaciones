# CLAUDE.md

**IMPORTANTE**: Toda la comunicaciÛn debe ser en espaÒol.

## <Ø VisiÛn del Proyecto

**Plataforma SaaS Multi-Tenant** para automatizaciÛn de agendamiento empresarial con **IA Conversacional** (WhatsApp).

---

## =  Estado Actual del Proyecto

**Actualizado**: 08 Octubre 2025

| Componente | Estado | MÈtricas |
|------------|--------|----------|
| **Backend API** |  **100%** | 2,040 LoC controllers, RLS activo |
| **Base de Datos** |  **100%** | 17 tablas, 17 RLS policies, 40 funciones |
| **Suite Tests** |  **464/464 (100%)** | 21 test suites, ~53s ejecuciÛn |
| **Tests SQL** |  **5/5 (100%)** | Setup, RLS, Performance |
| **Sistema IA** |  **Operativo** | n8n + Evolution API (WhatsApp) |
| **Docker** |  **Running** | 7 contenedores (back, postgres, n8n, redis) |

---

## =‡ Stack TÈcnico

### Backend
- **Runtime**: Node.js + Express.js
- **Auth**: JWT con refresh tokens
- **ValidaciÛn**: Joi schemas modulares
- **Testing**: Jest + Supertest
- **Logs**: Winston (JSON structured)

### Base de Datos
- **PostgreSQL 17 Alpine**
- **Multi-Tenant**: Row Level Security (RLS)
- **Performance**: 152 Ìndices (covering, GIN, GIST)
- **Auto-generaciÛn**: CÛdigos ˙nicos `ORG001-20251008-001`

### IA Conversacional
- **OrquestaciÛn**: n8n (stable) + Redis Queue
- **WhatsApp**: Evolution API
- **NLP**: Claude/GPT vÌa n8n workflows

---

## =› Comandos Esenciales

### Tests Backend

```bash
# Suite completa (SIEMPRE usar "npm test")
docker exec back npm test                                    # 464 tests 

# Test especÌfico
docker exec back npm test -- __tests__/endpoints/auth.test.js

# Con watch mode
docker exec back npm test -- --watch

# L NO USAR: docker exec back npx jest ...
# RazÛn: No establece NODE_ENV=test correctamente
```

### Tests SQL

```bash
# Suite completa de base de datos
./sql/tests/run-all-tests.sh                                # 5/5 tests 

# Resultado esperado:  Tests pasados: 5/5
```

### Docker

```bash
# Iniciar servicios
npm run start            # docker compose up -d

# Detener servicios
npm run stop             # docker compose down

# Reiniciar
npm run restart

# Ver logs
docker logs -f back
docker logs -f postgres_db
docker logs -f n8n-main

# Estado de contenedores
docker ps | grep -E "(back|postgres|n8n)"
```

### Base de Datos

```bash
# Consola PostgreSQL
docker exec postgres_db psql -U admin -d postgres

# Ver tablas
docker exec postgres_db psql -U admin -d postgres -c "\dt"

# Ver polÌticas RLS de una tabla
docker exec postgres_db psql -U admin -d postgres -c "\d clientes"

# Ejecutar query
docker exec postgres_db psql -U admin -d postgres -c "SELECT * FROM organizaciones LIMIT 5;"
```

---

## <◊ Arquitectura del Sistema

### MÛdulos Backend

| MÛdulo | Routes | Controller | Model | Schemas | Total LoC | PatrÛn RLS |
|--------|--------|------------|-------|---------|-----------|------------|
| **Auth** | 42 | 230 | 1,072* | 355 | 1,699 | RLSHelper |
| **Usuarios** | 73 | 144 | 1,072* | 162 | 1,451 | RLSHelper |
| **Organizaciones** | 107 | 261 | 718 | 291 | 1,377 | RLSHelper |
| **Profesionales** | 101 | 168 | 489 | 310 | 1,068 | RLS Directo |
| **Servicios** | 123 | 199 | 574 | 204 | 1,100 | RLS Directo |
| **Clientes** | 91 | 158 | 525 | 305 | 1,079 | RLS Directo |
| **Horarios** | 92 | 148 | 754 | 168 | 1,162 | RLS Directo |
| **Citas** | 213 | 529 | 1,916  | 450 | 3,108 | RLS Directo |
| **Bloqueos** | 16 | 74 | 366 | 190 | 646 | RLS Directo |

*Comparten `usuario.model.js`
 Incluye: base, operacional, ai, recordatorios, helpers

**Total**: ~12,690 lÌneas de cÛdigo backend

**Patrones Implementados**:
-  100% controllers usan `asyncHandler` (manejo autom·tico de errores)
-  100% endpoints usan schemas Joi modulares
-  100% responses usan `ResponseHelper` (formato consistente)
-  MÛdulos de entidades usan RLS directo (m·s simple)
-  MÛdulos con lÛgica compleja usan `RLSHelper` (Auth, Usuarios, Organizaciones)

### Middleware

| Middleware | LoC | FunciÛn |
|------------|-----|---------|
| `asyncHandler.js` | 96 | Manejo autom·tico de errores async |
| `auth.js` | 352 | JWT authentication + refresh tokens |
| `tenant.js` | 407 | ConfiguraciÛn RLS multi-tenant |
| `rateLimiting.js` | 529 | Rate limiting por IP + endpoint |
| `validation.js` | 393 | ValidaciÛn Joi con contexto de usuario |

### Helpers/Utils

| Helper | LoC | FunciÛn |
|--------|-----|---------|
| `helpers.js` | 520 | ResponseHelper, OrganizacionHelper |
| `rlsHelper.js` | 151 | Contextos RLS reutilizables |
| `passwordHelper.js` | 108 | Hash y validaciÛn de contraseÒas |
| `horarioHelpers.js` | 266 | LÛgica de horarios y slots |
| `logger.js` | 273 | Winston structured logging |

### Base de Datos PostgreSQL

**17 Tablas Principales**:
```
Core (3):           organizaciones, usuarios, planes_subscripcion
Cat·logo (2):       plantillas_servicios, profesionales
Negocio (4):        servicios, clientes, horarios_profesionales, horarios_disponibilidad
Operaciones (3):    citas, bloqueos_horarios, servicios_profesionales
Subscripciones (3): subscripciones, historial_subscripciones, metricas_uso_organizacion
Sistema (2):        eventos_sistema, eventos_sistema_archivo
```

**Seguridad y Performance**:
- **17 PolÌticas RLS** (multi-tenant + anti SQL-injection con REGEX `^[0-9]+$`)
- **27 Triggers** (auto-generaciÛn de cÛdigos, capacidad, timestamps)
- **40 Funciones PL/pgSQL** (validaciones, generaciÛn autom·tica)
- **152 Õndices** (covering, GIN full-text, GIST temporal)

**ENUMs de Dominio (7)**:
```sql
rol_usuario:         super_admin, propietario, administrador, usuario, solo_lectura
estado_cita:         pendiente, confirmada, en_curso, completada, cancelada, no_asistio
industria_tipo:      barberia, salon_belleza, estetica, spa, consultorio_medico, etc.
tipo_profesional:    barbero, estilista, esteticista, masajista, doctor_general, etc.
plan_type:           trial, basico, profesional, empresarial, personalizado
estado_horario:      disponible, reservado, bloqueado
estado_subscripcion: activa, cancelada, suspendida, expirada
```

### Sistema IA Conversacional

**Arquitectura**:
```
WhatsApp (Usuario)
    ì
Evolution API
    ì
n8n Workflow (Claude/GPT)
    ì
Backend API (/api/v1/citas/automatica)
    ì
PostgreSQL (RLS multi-tenant)
```

**Endpoints IA** (sin auth - validaciÛn por organizacion_id):
- `POST /api/v1/citas/automatica` - Crear cita vÌa WhatsApp
- `GET /api/v1/citas/buscar-por-telefono` - Buscar citas de cliente
- `PUT /api/v1/citas/automatica/:codigo` - Modificar cita
- `DELETE /api/v1/citas/automatica/:codigo` - Cancelar cita

**Servicios Docker**:
- `n8n-main` (puerto 5678) - Interfaz web y workflows
- `n8n-worker` - Procesamiento asÌncrono
- `n8n-redis` - Queue de jobs

---

## = Seguridad Multi-Tenant

### Row Level Security (RLS)

**PatrÛn Middleware** (OBLIGATORIO en todas las rutas protegidas):

```javascript
router.post('/endpoint',
    auth.authenticateToken,      // 1. JWT
    tenant.setTenantContext,     // 2. RLS † CRÕTICO
    rateLimiting.apiRateLimit,   // 3. Rate limit
    validation.validate(schema), // 4. ValidaciÛn
    Controller.metodo            // 5. Controller
);
```

**ConfiguraciÛn RLS en Model**:

```javascript
// PatrÛn 1: RLS Directo (mÛdulos de entidades)
const db = await getDb();
try {
    await db.query('SELECT set_config($1, $2, false)',
        ['app.current_tenant_id', organizacion_id.toString()]);

    const query = `INSERT INTO profesionales (...) VALUES (...) RETURNING *`;
    const result = await db.query(query, values);
    return result.rows[0];
} finally {
    db.release();
}

// PatrÛn 2: RLSHelper (mÛdulos con lÛgica compleja)
const RLSHelper = require('../utils/rlsHelper');

// Bypass RLS (solo super_admin)
return await RLSHelper.withBypass(db, async (db) => {
    return await db.query('SELECT * FROM usuarios');
});

// Contexto de login (sin tenant)
return await RLSHelper.withRole(db, 'login_context', async (db) => {
    return await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
});

// Self-access (usuario accediendo sus propios datos)
return await RLSHelper.withSelfAccess(db, userId, async (db) => {
    return await db.query('UPDATE usuarios SET nombre = $1 WHERE id = $2', [nombre, userId]);
});
```

**PolÌticas RLS Activas**:
-  Anti SQL-injection (REGEX `^[0-9]+$` valida tenant_id)
-  Aislamiento total de datos por organizaciÛn
-  System bypass para super_admin
-  Login context (sin tenant para autenticaciÛn)

### RBAC (Control de Acceso por Roles)

**Matriz de Permisos**:

| Recurso | super_admin | propietario | administrador | usuario | solo_lectura |
|---------|-------------|-------------|---------------|---------|--------------|
| Organizaciones | READ/WRITE (todas) | READ/WRITE (su org) | READ (su org) | - | - |
| Usuarios | ALL | CREATE/READ/UPDATE | READ | - | - |
| Profesionales | ALL | ALL | CREATE/READ/UPDATE | READ | READ |
| Servicios | ALL | ALL | CREATE/READ/UPDATE | READ | READ |
| Clientes | ALL | ALL | ALL | ALL | READ |
| Citas | ALL | ALL | ALL | ALL | READ |
| Horarios | ALL | ALL | ALL | READ | READ |

**Tests RBAC**: 33/33 pasando (100%)

---

## >Í Testing

### Estado de Tests

**Backend (Jest + Supertest)**: 464/464 tests pasando (100%)

| Suite | Tests | DescripciÛn |
|-------|-------|-------------|
| **Endpoints** | 216 | Tests de API REST (auth, usuarios, org, prof, serv, citas, etc.) |
| **Integration** | 64 | RLS, auto-generaciÛn, triggers, CRUD |
| **Middleware** | 15 | Auth JWT, Tenant Context |
| **RBAC** | 33 | Control de acceso granular |
| **Business Logic** | 9 | MÈtricas organizaciones |
| **Concurrency** | 7 | PrevenciÛn double-booking |
| **E2E** | 120 | Flujos completos de negocio |

**SQL (PostgreSQL)**: 5/5 tests pasando (100%)

1.  ConfiguraciÛn inicial (setup, funciones, triggers)
2.  Onboarding (crear org, usuarios, servicios)
3.  Agendamiento (auto-generaciÛn de cÛdigos)
4.  Seguridad RLS (anti SQL-injection)
5.  Performance (<100ms queries)

### Ejecutar Tests

```bash
# Backend completo (~53s)
docker exec back npm test

# Suite especÌfica
docker exec back npm test -- __tests__/endpoints/auth.test.js

# SQL completo (~3s)
./sql/tests/run-all-tests.sh
```

### Helpers de Testing

**Archivo**: `backend/app/__tests__/helpers/db-helper.js`

```javascript
const {
    createTestOrganizacion,    // Crea org con RLS bypass
    createTestUsuario,          // Genera token JWT autom·tico
    createTestProfesional,
    createTestServicio,         // Asocia con profesionales autom·ticamente
    createTestCita,             // NO enviar codigo_cita (auto-generado)
    cleanAllTables              // Limpia en orden correcto (evita FK violations)
} = require('../helpers/db-helper');

// Setup tÌpico
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

## =· Reglas CrÌticas de Desarrollo

### 1. Arquitectura Multi-Tenant

**Controllers confÌan en RLS** - NO usar `WHERE organizacion_id` manual:

```javascript
//  CORRECTO (RLS filtra autom·ticamente)
const query = `SELECT * FROM profesionales WHERE activo = true`;

// L INCORRECTO (redundante, RLS ya filtra)
const query = `SELECT * FROM profesionales WHERE organizacion_id = $1 AND activo = true`;
```

**Backend NO envÌa `codigo_cita`** - Auto-generado por trigger:

```javascript
//  CORRECTO
const cita = await CitaModel.crear({
    cliente_id: 1,
    profesional_id: 2,
    servicio_id: 3,
    fecha_cita: '2025-10-10',
    // NO enviar codigo_cita
});
// cita.codigo_cita = "ORG001-20251010-001" (auto-generado)

// L INCORRECTO
const cita = await CitaModel.crear({
    codigo_cita: 'manual',  // L Error: trigger sobreescribe
    cliente_id: 1,
    ...
});
```

### 2. PatrÛn organizacion_id (Header Enterprise)

**MigraciÛn**: 2025-10-06 - Header `X-Organization-Id` como est·ndar

**SUPER_ADMIN** (Prioridad descendente):
1. **Header X-Organization-Id** ( RECOMENDADO)
2. Query param `organizacion_id` († DEPRECATED)
3. Body `organizacion_id` († DEPRECATED)

**USUARIOS REGULARES**:
- Siempre usa `req.tenant.organizacionId` del JWT
- Schemas **prohÌben** pasar `organizacion_id` (validaciÛn condicional)

```bash
#  RECOMENDADO (super_admin)
curl -H "Authorization: Bearer TOKEN" \
     -H "X-Organization-Id: 123" \
     GET /api/v1/citas

# † DEPRECATED (mantener por compatibilidad)
curl -H "Authorization: Bearer TOKEN" \
     GET /api/v1/citas?organizacion_id=123
```

### 3. Schemas de BD vs CÛdigo (Consistencia)

**CRÕTICO**: Nombres de columnas deben coincidir:

```javascript
//  CORRECTO (nombres exactos de BD)
SELECT nombre_comercial FROM organizaciones;
SELECT nombre_completo, especialidades FROM profesionales;
UPDATE horarios_disponibilidad SET estado = 'disponible';
UPDATE citas SET estado = 'en_curso';

// L INCORRECTO
SELECT nombre FROM organizaciones;              // L No existe
SELECT nombre, especialidad FROM profesionales;  // L No existe
UPDATE horarios SET disponible = true;          // L columna incorrecta
UPDATE citas SET estado = 'en_proceso';         // L ENUM inv·lido
```

### 4. Validaciones con Joi Schemas

**Schemas Modulares** (ubicaciÛn: `backend/app/schemas/`):

```javascript
// schemas/servicio.schemas.js
const crear = {
    body: Joi.object({
        nombre: Joi.string().trim().min(1).max(100).required(),
        precio: commonSchemas.price.required(),
        // organizacion_id con validaciÛn condicional
        organizacion_id: Joi.when('$userRole', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: Joi.forbidden()
        })
    })
};

// routes/servicios.js
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    validation.validate(servicioSchemas.crear),  // ê Schema modular
    ServicioController.crear
);
```

**Middleware pasa contexto autom·ticamente**:
```javascript
// middleware/validation.js
const context = {
    userRole: req.user?.rol,
    userId: req.user?.id,
    organizacionId: req.user?.organizacion_id
};
```

---

## =Ä Checklist para Nuevos MÛdulos

Al crear/refactorizar un mÛdulo:

**Routes** (`routes/api/v1/[modulo].js`):
- [ ] 1 lÌnea por endpoint (sin comentarios JSDoc redundantes)
- [ ] Middleware en orden: auth í tenant í rateLimit í validation í controller
- [ ] AgrupaciÛn lÛgica (p˙blicas vs privadas)

**Controller** (`controllers/[modulo].controller.js`):
- [ ] Todos los mÈtodos usan `asyncHandler`
- [ ] Sin try/catch manual (asyncHandler lo maneja)
- [ ] Usa `ResponseHelper` para respuestas
- [ ] Sin logs de Èxito (solo errores crÌticos)

**Model** (`database/[modulo].model.js`):
- [ ] Usa RLS apropiado seg˙n complejidad:
  - RLS directo para entidades (Profesionales, Servicios, Citas)
  - RLSHelper para lÛgica compleja (Auth, Usuarios)
- [ ] `db.release()` en bloque finally

**Schemas** (`schemas/[modulo].schemas.js`):
- [ ] Constantes de validaciÛn centralizadas
- [ ] Reutiliza `commonSchemas` cuando sea posible
- [ ] ValidaciÛn condicional para `organizacion_id`

**Tests** (`__tests__/endpoints/[modulo].test.js`):
- [ ] Usa helpers de `db-helper`
- [ ] Limpieza en beforeAll/afterAll
- [ ] Cobertura: happy path + edge cases
- [ ] 100% de tests pasando

---

## =' Troubleshooting

### Error: Tests con timeout o "NODE_ENV debe ser test"

**SÌntomas**:
```
Error: Command timed out after 1m 0s
L NODE_ENV debe ser "test" para ejecutar tests
```

** SOLUCI”N - Usar SIEMPRE `npm test`**:
```bash
docker exec back npm test                                    # 
docker exec back npm test -- __tests__/endpoints/auth.test.js  # 

# L NO USAR: docker exec back npx jest ...
```

**Por quÈ**: El script `npm test` establece `NODE_ENV=test` y configura el pool correctamente.

### Error: "column does not exist"

```javascript
// L INCORRECTO
SELECT nombre FROM organizaciones               // Error: column "nombre" does not exist
SELECT p.nombre, p.especialidad FROM profesionales  // Error: column "especialidad" does not exist

//  CORRECTO
SELECT nombre_comercial FROM organizaciones
SELECT p.nombre_completo, p.especialidades FROM profesionales
```

### Error: "El profesional no est· autorizado para realizar este servicio"

**Causa**: Falta asociaciÛn en `servicios_profesionales`

**SoluciÛn**: Usar helper que asocia autom·ticamente
```javascript
testServicio = await createTestServicio(client, testOrg.id, {
    nombre: 'Test',
    precio: 100.00
}, [profesionalId]);  // ê Array de profesionales autorizados
```

---

## =⁄ Archivos Clave

| Archivo | DescripciÛn |
|---------|-------------|
| `/CLAUDE.md` | Esta guÌa del proyecto |
| `/sql/README.md` | DocumentaciÛn de base de datos (RLS, triggers, funciones) |
| `/backend/app/__tests__/README.md` | Plan de testing completo |
| `/backend/TESTING_PLAN.md` | Estrategia de testing detallada |
| `/PROMPT_AGENTE_N8N.md` | ConfiguraciÛn de agente IA para n8n |
| `/sql/schema/*.sql` | Schema de BD (17 polÌticas RLS, 27 triggers, 40 funciones) |
| `/backend/app/schemas/*.schemas.js` | Validaciones Joi reutilizables |
| `/backend/app/middleware/asyncHandler.js` | Manejo autom·tico de errores |
| `/backend/app/utils/rlsHelper.js` | Helper RLS multi-tenant |
| `/backend/app/__tests__/helpers/db-helper.js` | Helpers de testing |

---

## =» Roadmap y Mejoras Recientes

### Optimizaciones Completadas (Oct 2025)

**MÛdulos Optimizados**:
-  Auth: MigraciÛn a asyncHandler, RLSHelper, schemas Joi (-187 LoC)
-  Usuarios: SeparaciÛn arquitectÛnica de Auth (-124 LoC)
-  Organizaciones: ValidaciÛn de consistencia con BD (-14 LoC)
-  Profesionales: MigraciÛn a asyncHandler, RLS directo (-387 LoC, -26.9%)
-  Servicios: MigraciÛn a schemas Joi (-370 LoC)
-  Citas: OptimizaciÛn integral (-465 LoC, -14.6%)

**Mejoras de Base de Datos** (Oct 2025):
-  Auto-generaciÛn de `codigo_cita` con trigger (formato: `ORG001-20251008-001`)
-  Seguridad RLS anti SQL-injection (REGEX `^[0-9]+$`)
-  152 Ìndices optimizados (covering, GIN, GIST)
-  5/5 tests SQL pasando

### PrÛximos Pasos

1. **MÛdulo Clientes**: Aplicar patrÛn asyncHandler + RLS directo
2. **MÛdulo Horarios**: Optimizar controller (148 LoC actualmente)
3. **Consolidar helpers**: Unificar helpers comunes entre mÛdulos
4. **DocumentaciÛn API**: Generar OpenAPI/Swagger autom·tico

---

**VersiÛn**: 1.0
**⁄ltima actualizaciÛn**: 08 Octubre 2025
**Estado**:  Production Ready | 464/464 tests pasando
**Mantenido por**: Equipo de Desarrollo
