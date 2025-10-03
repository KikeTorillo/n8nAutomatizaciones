# CLAUDE.md

Guía de desarrollo para Claude Code en este repositorio.

## Preferencia de Idioma

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización inteligente de agendamiento empresarial mediante **IA Conversacional**.

### Objetivo Principal
Automatizar el agendamiento de citas para PyMEs a través de múltiples canales:
- 🤖 **IA Conversacional**: WhatsApp/Telegram/SMS (canal principal) ✅ OPERATIVO
- 💻 **Frontend Web/Mobile**: Interfaces para usuarios finales 🔄 PLANIFICADO
- 📱 **Dashboard Admin**: Gestión empresarial completa ✅ BACKEND LISTO

### Características Core
- ✅ **Multi-tenant** con Row Level Security (RLS)
- ✅ **Multi-industria**: 10 sectores con 59 plantillas de servicios
- ✅ **Escalable**: Arquitectura preparada para 1000+ organizaciones
- ✅ **Canal IA**: Workflow de barbería validado y operativo

---

## 🏗️ Arquitectura del Sistema

### Stack Técnico Validado

```
┌─────────────────────────────────────────────────────────────┐
│ CAPA DE PRESENTACIÓN                                        │
├─────────────────────────────────────────────────────────────┤
│ • Evolution API (WhatsApp)    → Puerto 8000                 │
│ • n8n Workflows (IA Agent)    → Puerto 5678                 │
│ • Backend API REST            → Puerto 3000                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ CAPA DE NEGOCIO                                             │
├─────────────────────────────────────────────────────────────┤
│ • Node.js + Express                                         │
│ • 8 Controllers (auth, organizacion, profesional, cliente, │
│   servicio, horario, citas, usuario)                        │
│ • JWT Auth + Redis Rate Limiting                            │
│ • Winston Logging + Graceful Shutdown                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ CAPA DE DATOS                                               │
├─────────────────────────────────────────────────────────────┤
│ • PostgreSQL 17 + RLS Multi-Tenant                          │
│ • 16 Tablas Operativas                                      │
│ • 4 Bases de Datos Especializadas                           │
│ • Redis para Cache y Rate Limiting                          │
└─────────────────────────────────────────────────────────────┘
```

### 🐳 Servicios Docker (6 Contenedores Activos)

| Servicio | Puerto | Estado | Descripción |
|----------|--------|--------|-------------|
| **postgres_db** | 5432 | ✅ Healthy | PostgreSQL 17 Alpine |
| **n8n-redis** | 6379 | ✅ Healthy | Redis 7 para n8n y rate limiting |
| **n8n-main** | 5678 | ✅ Running | Editor y API de workflows |
| **n8n-worker** | - | ✅ Running | Procesador de workflows (queue mode) |
| **evolution_api** | 8000 | ✅ Running | Gateway WhatsApp Business |
| **pgadmin** | 8001 | ✅ Running | Admin de base de datos |
| **backend** | 3000 | ✅ Running | API Node.js SaaS |

---

## 🚀 Backend Node.js - API Enterprise

**Ubicación**: `./backend/app/`

### Estructura Validada

```
backend/app/
├── config/             # Configuración de pools DB especializados
├── controllers/        # 8 controllers modularizados
│   ├── auth.controller.js
│   ├── organizacion.controller.js
│   ├── profesional.controller.js
│   ├── cliente.controller.js
│   ├── servicio.controller.js
│   ├── horario.controller.js
│   ├── usuario.controller.js
│   └── citas/          # Controller modularizado
│       ├── cita.ai.controller.js
│       ├── cita.base.controller.js
│       ├── cita.operacional.controller.js
│       └── cita.recordatorios.controller.js
├── database/           # 8 modelos + modelos de citas modularizados
│   ├── cliente.model.js
│   ├── horario.model.js
│   ├── organizacion.model.js
│   ├── plantilla-servicio.model.js
│   ├── profesional.model.js
│   ├── servicio.model.js
│   ├── usuario.model.js
│   └── citas/          # Modelos modularizados
│       ├── cita.ai.model.js
│       ├── cita.base.model.js
│       ├── cita.helpers.model.js
│       └── cita.operacional.model.js
├── middleware/         # 4 middlewares especializados
│   ├── auth.js         # JWT + verificación roles
│   ├── tenant.js       # Multi-tenant context
│   ├── rateLimiting.js # Redis rate limiting
│   └── validation.js   # Validaciones Joi
├── routes/api/v1/      # 11 rutas RESTful
│   ├── auth.js
│   ├── organizaciones.js
│   ├── profesionales.js
│   ├── clientes.js
│   ├── servicios.js
│   ├── horarios.js
│   ├── citas.js
│   ├── usuarios.js
│   ├── password.js
│   ├── email.js
│   └── index.js
├── schemas/            # Validaciones Joi por recurso
├── services/           # Lógica de negocio compartida
├── utils/              # Helpers y utilidades
└── app.js              # Entry point
```

### Capacidades Validadas

- ✅ **11 APIs REST** completamente funcionales
- ✅ **JWT Auth** + Refresh tokens
- ✅ **Redis Rate Limiting** por IP/usuario/organización
- ✅ **RLS Multi-Tenant** en todas las operaciones
- ✅ **Winston Logging** estructurado
- ✅ **Graceful Shutdown** + Health checks
- ✅ **Validación triple capa**: Joi → Controller → Modelo

---

## 🗄️ Base de Datos PostgreSQL

### Bases de Datos Especializadas (4)

| Base de Datos | Descripción | Usuario |
|---------------|-------------|---------|
| **postgres** | Aplicación SaaS principal | saas_app |
| **n8n_db** | Workflows y automatizaciones | n8n_app |
| **evolution_db** | WhatsApp API | evolution_app |
| **chat_memories_db** | Conversaciones IA | integration_user |

### Tablas Operativas (16)

**Core:**
- `usuarios` - Autenticación y roles
- `organizaciones` - Datos de clientes SaaS

**Negocio:**
- `profesionales` - Prestadores de servicios
- `clientes` - Clientes finales
- `servicios` - Catálogo de servicios
- `servicios_profesionales` - Relación M2M
- `plantillas_servicios` - 59 plantillas para 10 industrias

**Operaciones:**
- `citas` - Reservas y agendamientos
- `horarios_disponibilidad` - Slots de tiempo
- `horarios_profesionales` - Configuración de horarios
- `bloqueos_horarios` - Excepciones y bloqueos

**Sistema:**
- `planes_subscripcion` - Planes SaaS
- `subscripciones` - Suscripciones activas
- `historial_subscripciones` - Historial de cambios
- `metricas_uso_organizacion` - Métricas de uso
- `eventos_sistema` - Auditoría y logs

### Schema Modular SQL

**Ubicación**: `./sql/`

```
sql/
├── setup/                          # Inicialización
│   ├── 01-init-databases.sql      # 4 bases de datos
│   ├── 02-create-users.sql        # 5 usuarios especializados
│   └── 03-grant-permissions.sql   # Permisos por usuario
├── schema/                         # Schema modular (14 archivos)
│   ├── 01-types-and-enums.sql     # Tipos y enums
│   ├── 02-functions.sql           # 14 funciones PL/pgSQL principales
│   ├── 03-core-tables.sql         # usuarios, organizaciones
│   ├── 04-catalog-tables.sql      # plantillas_servicios
│   ├── 05-business-tables.sql     # servicios, profesionales, clientes
│   ├── 06-operations-tables.sql   # citas
│   ├── 07-indexes.sql             # 49 índices optimizados
│   ├── 08-rls-policies.sql        # 26 políticas RLS
│   ├── 09-triggers.sql            # 56 triggers automáticos
│   ├── 10-subscriptions-table.sql # Sistema de planes
│   ├── 11-horarios-profesionales.sql
│   ├── 12-eventos-sistema.sql
│   └── 13-bloqueos-horarios.sql
├── data/
│   └── plantillas-servicios.sql   # 59 plantillas cargadas ✅
└── maintenance/                    # Scripts de mantenimiento

**Setup Automatizado**: `init-data.sh` ejecuta todo secuencialmente
```

### Industrias Soportadas (10)

1. `barberia` (15 servicios)
2. `salon_belleza` (12 servicios)
3. `estetica` (8 servicios)
4. `spa` (10 servicios)
5. `podologia` (5 servicios)
6. `consultorio_medico` (4 servicios)
7. `academia` (3 servicios)
8. `taller_tecnico` (1 servicio)
9. `centro_fitness` (1 servicio)
10. `veterinaria` (0 servicios cargados)

**Total**: 59 plantillas de servicios validadas ✅

---

## 🤖 Workflows n8n + Evolution API

**Ubicación**: `./flows/Barberia/`

### Caso de Uso Validado: Barbería

- ✅ `Barberia.json` - Workflow completo (26KB)
- ✅ `promtAgenteBarberia.md` - Prompt especializado IA
- ✅ CSVs de configuración (horarios, citas, configuración)
- ✅ Integración WhatsApp funcionando
- ✅ Agente IA procesando lenguaje natural

**Estado**: Sistema operativo validado en producción

---

## 📝 Comandos de Desarrollo

### 🐳 Docker (Infraestructura)

```bash
# Servicios principales
npm run start         # Iniciar todos los servicios
npm run stop          # Detener todos los servicios
npm run restart       # Reiniciar servicios
npm run dev           # Construir e iniciar servicios
npm run dev:fresh     # Inicio limpio con reconstrucción

# Monitoreo
npm run status        # Verificar estado de servicios
npm run logs          # Ver logs de todos los servicios
npm run logs:n8n      # Logs n8n específicos
npm run logs:evolution # Logs Evolution API
npm run logs:postgres # Logs PostgreSQL

# Limpieza
npm run clean         # Remover contenedores
npm run clean:data    # Remover volúmenes de datos
npm run fresh:clean   # Limpieza completa + reconstruir
```

### 🚀 Backend Node.js

```bash
# Trabajar desde backend/app/
cd backend/app

# Desarrollo
npm install         # Instalar dependencias
npm run dev         # Desarrollo con nodemon
npm start           # Producción
npm test            # Tests con Jest

# Logs backend: backend/app/logs/
# Archivos: app.log, error.log, exceptions.log, rejections.log
```

### 🗄️ Base de Datos

```bash
# PostgreSQL
npm run backup:db   # Backup base de datos
npm run db:connect  # CLI PostgreSQL

# Redis
docker exec n8n-redis redis-cli KEYS "rate_limit:*"
docker exec n8n-redis redis-cli MONITOR

# Ver tablas
docker exec postgres_db psql -U admin -d postgres -c "\dt"

# Ver organizaciones
docker exec postgres_db psql -U admin -d postgres -c \
  "SELECT id, nombre_comercial, tipo_industria FROM organizaciones;"
```

---

## 🛡️ Arquitectura Multi-Tenant

### Patrón de Seguridad RLS

**Principio**: Determinación centralizada + Configuración por transacción

#### 1. Middleware Centralizado (Determinación de `organizacion_id`)

```javascript
// Ubicación: backend/app/middleware/tenant.js
const setTenantContext = async (req, res, next) => {
    let tenantId;

    if (req.user.rol === 'super_admin') {
        // Super admin: buscar en body (POST) o query (GET/PUT/DELETE)
        if (req.method === 'POST' && req.body.organizacion_id) {
            tenantId = parseInt(req.body.organizacion_id);
        } else if (['GET', 'PUT', 'DELETE'].includes(req.method)) {
            tenantId = parseInt(req.query.organizacion_id);
        }
    } else {
        // Usuario regular: usar su organizacion_id
        tenantId = req.user.organizacion_id;
    }

    req.tenant = { organizacionId: tenantId };
    next();
};
```

#### 2. Rutas (Middleware en acción)

```javascript
// Ubicación: backend/app/routes/api/v1/horarios.js
router.post('/',
    auth.authenticateToken,        // 1. Verificar JWT
    tenant.setTenantContext,       // 2. Determinar organizacion_id
    rateLimiting.apiRateLimit,     // 3. Rate limiting
    validate(schemas),             // 4. Validaciones Joi
    HorarioController.crear        // 5. Controller
);
```

#### 3. Controllers (Simplificados)

```javascript
// Ubicación: backend/app/controllers/horario.controller.js
static async crear(req, res) {
    // req.tenant.organizacionId YA existe (del middleware)
    const datos = {
        organizacion_id: req.tenant.organizacionId,
        ...req.body
    };

    const resultado = await HorarioModel.crear(datos, auditoria);
    ResponseHelper.success(res, resultado, 'Creado', 201);
}
```

#### 4. Modelos (Configuración RLS por Transacción)

```javascript
// Ubicación: backend/app/database/horario.model.js
static async crear(datosHorario, auditoria = {}) {
    const db = await getDb();

    try {
        await db.query('BEGIN');

        // 🔒 CRÍTICO: Configurar RLS para esta transacción
        await db.query('SELECT set_config($1, $2, false)',
            ['app.current_tenant_id', datosHorario.organizacion_id.toString()]);

        // Operaciones con aislamiento multi-tenant garantizado
        const result = await db.query('INSERT INTO...', [...]);

        await db.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await db.query('ROLLBACK');
        throw error;
    } finally {
        db.release();
    }
}
```

### Reglas de Oro

1. **Middleware `tenant.setTenantContext`** → Determina `organizacion_id` (centralizado)
2. **Controllers** → Usan `req.tenant.organizacionId` directamente
3. **Modelos** → Configuran RLS dentro de cada transacción (seguridad DB)
4. **Validación triple capa** → Joi + Controller + Modelo (intencional)

---

## 🚨 Middlewares Disponibles

**Ubicación**: `backend/app/middleware/index.js`

### Autenticación

```javascript
auth.authenticateToken       // Verificar JWT token
auth.requireRole            // Requiere rol específico
auth.requireAdmin           // Solo administradores
auth.requireOwnerOrAdmin    // Propietario o admin
auth.optionalAuth           // Autenticación opcional
auth.verifyTenantAccess     // Verificar acceso a tenant
auth.refreshToken           // Refrescar token JWT
```

### Multi-Tenancy

```javascript
tenant.setTenantContext     // Configurar contexto de organización ⭐
tenant.validateTenantParams // Validar parámetros de tenant
tenant.injectTenantId       // Inyectar tenant ID
tenant.verifyTenantActive   // Verificar tenant activo
tenant.requirePlan          // Requiere plan específico
tenant.releaseTenantConnection // Liberar conexión tenant
```

### Rate Limiting

```javascript
rateLimiting.ipRateLimit                // Por IP (100 req/15min)
rateLimiting.userRateLimit              // Por usuario (200 req/15min)
rateLimiting.organizationRateLimit      // Por organización (1000 req/hora)
rateLimiting.authRateLimit              // Endpoints auth (10 req/15min)
rateLimiting.apiRateLimit               // APIs generales (60 req/min) ⭐
rateLimiting.heavyOperationRateLimit    // Operaciones pesadas (5 req/hora)
rateLimiting.planBasedRateLimit         // Dinámico por plan
```

### Validación

```javascript
validation.validate         // Validación general
validation.validateBody     // Validar body de request
validation.validateParams   // Validar parámetros URL
validation.validateQuery    // Validar query parameters
```

### Patrón Recomendado

```javascript
// Endpoints autenticados con tenant
router.post('/endpoint',
    auth.authenticateToken,      // 1. Verificar JWT
    tenant.setTenantContext,     // 2. Configurar contexto multi-tenant
    rateLimiting.apiRateLimit,   // 3. Rate limiting
    [validaciones],              // 4. Validaciones Joi
    handleValidation,            // 5. Procesar errores de validación
    Controller.metodo            // 6. Controller final
);
```

---

## ⚠️ Problemas Comunes

### Error: "Route.post() requires a callback function but got a [object Object]"

**Causa**: Middleware usado incorrectamente

```javascript
// ❌ INCORRECTO
router.post('/ruta', tenant, rateLimiting.standardRateLimit, controller);

// ✅ CORRECTO
router.post('/ruta', tenant.setTenantContext, rateLimiting.apiRateLimit, controller);
```

**Solución**:
1. Verificar que todos los middlewares usen métodos específicos (`.setTenantContext`, `.apiRateLimit`)
2. Verificar imports correctos en `middleware/index.js`
3. Restart container: `docker restart back`

### Debugging de Rutas

```bash
# Probar import de rutas específicas
docker exec back node -e "
try {
  require('./routes/api/v1/archivo.js');
  console.log('✅ Rutas cargadas exitosamente');
} catch(e) {
  console.error('❌ Error:', e.message);
}"
```

---

## 📊 Estado Actual del Proyecto

**Fecha de Validación**: Septiembre 2025

### ✅ Completamente Operativo

- **Infraestructura Docker**: 6 servicios activos y estables
- **Base de Datos**: 16 tablas + RLS + 59 plantillas cargadas
- **Backend API**: 11 endpoints REST funcionales
- **Canal IA**: WhatsApp + n8n + Evolution API operativo
- **Caso de Uso**: Barbería validada en producción

### 🔄 Próximos Hitos

#### Milestone 1: Frontend Foundation (Alta Prioridad)
- Dashboard administrativo (React/Vue)
- Portal de agendamiento para clientes
- SDK cliente para APIs backend

#### Milestone 2: IA Enhancement (Media Prioridad)
- Memoria conversacional en Redis
- Soporte multi-idioma (ES, EN)
- Integración con calendarios externos

#### Milestone 3: Mobile Apps (Baja Prioridad)
- App para clientes finales
- App para profesionales
- App administrativa

---

## 📚 Documentación Técnica

- **Backend**: `backend/README.md` - Guía desarrollo backend
- **Schema DB**: `sql/README.md` - Documentación arquitectura DB completa
- **Workflows**: `PROMPT_AGENTE_N8N.md` - Guía para crear agentes expertos
- **Barbería**: `flows/Barberia/promtAgenteBarberia.md` - Prompt IA especializado

---

## 🎯 Principios de Desarrollo

1. **API-First**: Diseñar endpoints para múltiples consumidores (IA, Frontend, Mobile)
2. **Security by Default**: RLS multi-tenant en todas las operaciones
3. **Separation of Concerns**: Ruta → Controller → Modelo (cada capa su función)
4. **Fail Safe**: Triple validación + transacciones + rollback automático
5. **Observable**: Logging estructurado + métricas + auditoría

---

## 🔧 TAREAS PENDIENTES - REORGANIZACIÓN BASE DE DATOS

**Última Auditoría**: 02 Octubre 2025
**Estado**: 🟡 PENDIENTE DE REORGANIZACIÓN
**Prioridad**: 🔴 ALTA (Aplicar antes de producción)

### Contexto

Se realizó una auditoría completa de la carpeta `sql/` (19 archivos, 6,761 líneas). El sistema está en **muy buen estado (8.3/10)** pero requiere reorganización para:

1. Eliminar carpeta `maintenance/` integrando correcciones en el schema original
2. Convertir `ALTER TABLE` en modificaciones directas en `CREATE TABLE`
3. Optimizar el orden de ejecución eliminando dependencias innecesarias
4. Agregar mejoras críticas de seguridad y performance

### 📋 Plan de Reorganización

#### Fase 1: Modificaciones en Setup (CRÍTICO - P0)

**Archivo**: `sql/setup/02-create-users.sql`

```sql
-- AGREGAR después de cada CREATE ROLE:

-- Connection Limits (CRÍTICO-01)
ALTER ROLE saas_app CONNECTION LIMIT 100;
ALTER ROLE n8n_app CONNECTION LIMIT 50;
ALTER ROLE evolution_app CONNECTION LIMIT 30;
ALTER ROLE readonly_user CONNECTION LIMIT 20;
ALTER ROLE integration_user CONNECTION LIMIT 10;

-- Timeouts de Transacciones (CRÍTICO-02)
ALTER ROLE saas_app SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE n8n_app SET idle_in_transaction_session_timeout = '120s';
ALTER ROLE evolution_app SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE readonly_user SET idle_in_transaction_session_timeout = '120s';
ALTER ROLE integration_user SET idle_in_transaction_session_timeout = '90s';

-- Logging de Queries Lentas (WARN-01)
ALTER ROLE saas_app SET log_min_duration_statement = '1000';
ALTER ROLE readonly_user SET log_min_duration_statement = '5000';
```

#### Fase 2: Foreign Keys en Tablas Core (CRÍTICO - P0)

**Archivo**: `sql/schema/03-core-tables.sql`

```sql
-- MODIFICAR tabla usuarios (líneas 7-56):
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER REFERENCES organizaciones(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,  -- ✅ AGREGAR FK

    -- Campos...

    profesional_id INTEGER REFERENCES profesionales(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,  -- ✅ AGREGAR FK

    -- Resto de la tabla...
);

-- NOTA: Esto crea dependencia circular usuarios ← organizaciones
-- SOLUCIÓN: Mover tabla organizaciones ANTES de usuarios en 03-core-tables.sql
```

**Nuevo Orden en `03-core-tables.sql`:**

1. CREATE TABLE organizaciones (líneas 58-110)
2. CREATE TABLE usuarios (líneas 7-56, modificado con FKs)

#### Fase 3: Mejorar Funciones PL/pgSQL (CRÍTICO - P0)

**Archivo**: `sql/schema/02-functions.sql`

**Modificaciones:**

1. **Función `registrar_intento_login()` (línea 49-135)**
   - Agregar TRY/CATCH al INSERT en eventos_sistema
   - Eliminar hardcodeo de `organizacion_id = 1` (línea 190)

```sql
-- REEMPLAZAR líneas 105-127:
BEGIN
    INSERT INTO eventos_sistema (...) VALUES (...);
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error logging evento: %', SQLERRM;
END;
```

2. **Función `validar_coherencia_cita()` (línea 417-438)**
   - Agregar validación de existencia de registros
   - Ver contenido completo en `sql/maintenance/02-correcciones-auditoria-recomendaciones.sql` líneas 142-208

3. **Función `validar_coherencia_horario()` (línea 464-499)**
   - Agregar validación de existencia de registros
   - Ver contenido completo en `sql/maintenance/02-correcciones-auditoria-recomendaciones.sql` líneas 216-286

#### Fase 4: Índices Mejorados (IMPORTANTE - P1)

**Archivo**: `sql/schema/07-indexes.sql`

```sql
-- AGREGAR al final del archivo:

-- Índice para organizaciones activas
CREATE INDEX IF NOT EXISTS idx_usuarios_organizacion_activos
ON usuarios(organizacion_id)
WHERE activo = true AND organizacion_id IS NOT NULL;

-- Índice para auditoría por usuario
CREATE INDEX IF NOT EXISTS idx_eventos_usuario_org_fecha
ON eventos_sistema(usuario_id, organizacion_id, creado_en DESC)
WHERE usuario_id IS NOT NULL;

-- Mejorar índice de recordatorios (REEMPLAZAR idx_citas_recordatorios)
DROP INDEX IF EXISTS idx_citas_recordatorios;

CREATE INDEX idx_citas_recordatorios_pendientes
ON citas (fecha_recordatorio, fecha_cita, organizacion_id, cliente_id)
WHERE recordatorio_enviado = FALSE AND estado = 'confirmada';

-- Índice covering para búsqueda de citas por rango
CREATE INDEX IF NOT EXISTS idx_citas_rango_fechas
ON citas (organizacion_id, fecha_cita, estado)
INCLUDE (cliente_id, profesional_id, servicio_id, hora_inicio, hora_fin);

-- Índice covering para profesionales disponibles
CREATE INDEX IF NOT EXISTS idx_profesionales_disponibles
ON profesionales (organizacion_id, activo, disponible_online, tipo_profesional)
INCLUDE (nombre_completo, calificacion_promedio, especialidades)
WHERE activo = TRUE AND disponible_online = TRUE;
```

#### Fase 5: Documentar Políticas RLS (IMPORTANTE - P1)

**Archivo**: `sql/schema/08-rls-policies.sql`

Agregar COMMENT ON POLICY para **todas las políticas**. Ver contenido completo en `sql/maintenance/01-auditoria-correcciones.sql` líneas 104-281.

```sql
-- Ejemplo:
COMMENT ON POLICY usuarios_unified_access ON usuarios IS
'Política unificada que maneja 5 casos de acceso:
1. LOGIN_CONTEXT: Permite buscar usuario por email
2. SUPER_ADMIN: Acceso global
3. BYPASS_RLS: Funciones de sistema
4. SELF_ACCESS: Usuario puede ver su propio registro
5. TENANT_ISOLATION: Usuario solo ve su organización';
```

#### Fase 6: Sistema de Subscripciones (IMPORTANTE - P1)

**Archivo**: `sql/schema/10-subscriptions-table.sql`

```sql
-- MODIFICAR plan empresarial (después de crear tabla planes_subscripcion):
UPDATE planes_subscripcion
SET
    limite_profesionales = 100,
    limite_clientes = 50000,
    limite_servicios = 500,
    limite_citas_mes = 10000
WHERE codigo_plan = 'empresarial';

-- AGREGAR plan custom:
INSERT INTO planes_subscripcion (
    codigo_plan, nombre_plan, descripcion,
    precio_mensual, moneda,
    limite_profesionales, limite_clientes, limite_servicios,
    limite_usuarios, limite_citas_mes,
    funciones_habilitadas, orden_display, activo
) VALUES (
    'custom', 'Plan Personalizado',
    'Plan a medida para organizaciones con necesidades específicas',
    0.00, 'MXN',
    NULL, NULL, NULL, NULL, NULL,  -- Ilimitados
    '{"api_access": true, "dedicated_support": true, "sla_guarantee": true}'::jsonb,
    5, false
) ON CONFLICT (codigo_plan) DO NOTHING;
```

#### Fase 7: Funciones de Mantenimiento (MEJORA - P2)

**Nuevo Archivo**: `sql/schema/15-maintenance-functions.sql`

Crear funciones de archivado automático:

```sql
-- Tabla de archivo para eventos antiguos
CREATE TABLE IF NOT EXISTS eventos_sistema_archivo (
    LIKE eventos_sistema INCLUDING ALL
);

-- Función de archivado (ejecutar mensualmente)
CREATE OR REPLACE FUNCTION archivar_eventos_antiguos(
    p_meses_antiguedad INTEGER DEFAULT 12
)
RETURNS TABLE(...) AS $$
-- Ver implementación completa en sql/maintenance/02-correcciones-auditoria-recomendaciones.sql
-- líneas 374-421
$$;

-- Función de archivado de citas (ejecutar trimestralmente)
CREATE OR REPLACE FUNCTION archivar_citas_antiguas(
    p_meses_antiguedad INTEGER DEFAULT 24
)
RETURNS TABLE(...) AS $$
-- Ver implementación en líneas 424-461
$$;
```

### 📝 Checklist de Ejecución

**Antes de Empezar:**
- [ ] Backup completo de la base de datos actual
- [ ] Crear rama git para reorganización (`git checkout -b refactor/sql-reorganization`)
- [ ] Documentar cambios en CHANGELOG.md

**Orden de Modificación:**

1. **Setup (30 min)**
   - [ ] Modificar `02-create-users.sql` (connection limits, timeouts)
   - [ ] Validar permisos en `03-grant-permissions.sql`

2. **Schema - Tablas (1 hora)**
   - [ ] Reorganizar `03-core-tables.sql` (organizaciones antes de usuarios)
   - [ ] Agregar FKs en CREATE TABLE usuarios
   - [ ] Verificar FK en clientes.profesional_preferido_id (`05-business-tables.sql`)

3. **Schema - Funciones (2 horas)**
   - [ ] Mejorar `validar_coherencia_cita()` en `02-functions.sql`
   - [ ] Mejorar `validar_coherencia_horario()` en `02-functions.sql`
   - [ ] Agregar manejo de errores en `registrar_intento_login()`
   - [ ] Eliminar hardcodeo de organizacion_id

4. **Schema - Índices (30 min)**
   - [ ] Agregar índices mejorados en `07-indexes.sql`
   - [ ] Reemplazar idx_citas_recordatorios

5. **Schema - Políticas RLS (1 hora)**
   - [ ] Agregar COMMENT ON POLICY para todas las políticas en `08-rls-policies.sql`
   - [ ] Consolidar políticas duplicadas (servicios, citas, horarios)

6. **Schema - Subscripciones (30 min)**
   - [ ] Modificar límites plan empresarial en `10-subscriptions-table.sql`
   - [ ] Agregar INSERT plan custom

7. **Nuevo Archivo (1 hora)**
   - [ ] Crear `15-maintenance-functions.sql`
   - [ ] Agregar funciones de archivado

8. **Actualizar Script (30 min)**
   - [ ] Modificar `init-data.sh` para incluir nuevo archivo
   - [ ] Eliminar referencias a carpeta `maintenance/`

9. **Eliminar Obsoletos**
   - [ ] Mover `sql/maintenance/` a `sql/.archive/` (no eliminar aún)
   - [ ] Validar que todo funciona sin archivos de maintenance

10. **Validación Final (1 hora)**
    - [ ] Ejecutar `npm run fresh:clean` para reconstruir BD
    - [ ] Verificar que todas las tablas se crean correctamente
    - [ ] Verificar FKs: `SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';`
    - [ ] Verificar índices: `SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';`
    - [ ] Verificar políticas RLS: `SELECT tablename, COUNT(*) FROM pg_policies GROUP BY tablename;`
    - [ ] Ejecutar tests del backend
    - [ ] Verificar logs de PostgreSQL

### 🚨 Hallazgos Críticos de la Auditoría

**Resumen**: 6 Críticos 🔴 | 12 Advertencias ⚠️ | 5 Informativos ℹ️

#### Críticos (APLICAR INMEDIATAMENTE)

| ID | Problema | Archivo | Solución |
|----|----------|---------|----------|
| CRÍTICO-01 | Falta connection limits | `02-create-users.sql` | ALTER ROLE ... CONNECTION LIMIT |
| CRÍTICO-02 | Falta idle_timeout | `02-create-users.sql` | ALTER ROLE ... SET idle_in_transaction_session_timeout |
| CRÍTICO-03 | Funciones sin TRY/CATCH | `02-functions.sql` | Agregar manejo de excepciones |
| CRÍTICO-04 | Hardcodeo organizacion_id=1 | `02-functions.sql:190` | Usar NULL o variable de sistema |
| CRÍTICO-05 | FK faltantes en usuarios | `03-core-tables.sql` | Agregar FKs en CREATE TABLE |
| CRÍTICO-06 | Políticas RLS duplicadas | `08-rls-policies.sql` | Consolidar en política unificada |

#### Advertencias Importantes

| ID | Problema | Impacto | Solución |
|----|----------|---------|----------|
| WARN-01 | log_min_duration_statement | Queries lentas no detectadas | Configurar en roles |
| WARN-10 | Métricas sin triggers | Desincronización | Implementar triggers automáticos |

### 📊 Métricas de Calidad

**Estado Actual**: 8.3/10 (Muy Bueno)
**Estado Esperado Post-Reorganización**: 9.2/10 (Excelente)

| Categoría | Antes | Después |
|-----------|-------|---------|
| Diseño Arquitectónico | 9.0/10 | 9.5/10 |
| Seguridad Multi-Tenant | 7.5/10 | 9.0/10 |
| Integridad Referencial | 7.0/10 | 9.5/10 |
| Performance | 9.5/10 | 9.8/10 |
| Mantenibilidad | 8.0/10 | 9.0/10 |

### 🎯 Resultado Esperado

Después de completar la reorganización:

✅ **Cero archivos de maintenance** (todo integrado en schema)
✅ **Foreign Keys completos** (integridad garantizada por BD)
✅ **Funciones robustas** (con manejo de errores apropiado)
✅ **Índices optimizados** (covering indexes, índices parciales mejorados)
✅ **RLS documentado** (todas las políticas con COMMENT)
✅ **Setup desde cero** (sin necesidad de ALTERs post-instalación)
✅ **Listo para producción** (sin warnings críticos)

### 📚 Referencias

- **Reporte de Auditoría Completo**: Generado el 02-Oct-2025 (ver historial de sesión)
- **Archivos de Mantenimiento Actuales**:
  - `sql/maintenance/01-auditoria-correcciones.sql` (342 líneas)
  - `sql/maintenance/02-correcciones-auditoria-recomendaciones.sql` (650 líneas)
- **Documentación de Arquitectura**: `sql/README.md`

### ⏱️ Tiempo Estimado Total

**Reorganización Completa**: 6-8 horas
**Testing y Validación**: 2-3 horas
**Total**: 1-2 días de trabajo

---

**Sistema SaaS Enterprise Validado y Operativo - Octubre 2025**
