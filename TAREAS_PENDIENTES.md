# 📋 Tareas Pendientes

**Última Actualización:** 26 Octubre 2025
**Estado Sistema:** ✅ Production Ready
**Validación Técnica:** ✅ Plan validado por análisis de arquitectura

---

## 📑 ÍNDICE

1. [🔴 ALTA PRIORIDAD - Múltiples Servicios por Cita](#-alta-prioridad---múltiples-servicios-por-cita)
   - [1.1 Contexto y Justificación](#11-contexto-y-justificación)
   - [1.2 Arquitectura Propuesta](#12-arquitectura-propuesta)
   - [1.3 Plan de Implementación](#13-plan-de-implementación)
     - [Fase 1: Base de Datos (1 día)](#fase-1---base-de-datos-1-día)
     - [Fase 2: Backend (1.5-2 días)](#fase-2---backend-15-2-días)
     - [Fase 3: Frontend (1 día)](#fase-3---frontend-1-día)
     - [Fase 4: Testing (0.5 días)](#fase-4---testing-05-días)
     - [Fase 5: Migración y Rollout (0.5 días)](#fase-5---migración-y-rollout-05-días)
   - [1.4 Resumen Ejecutivo](#14-resumen-ejecutivo)
2. [🟡 FEATURES OPCIONALES](#-features-opcionales)
3. [📊 APÉNDICES](#-apéndices)

---

## 🔴 ALTA PRIORIDAD - Múltiples Servicios por Cita

**Tiempo Estimado:** 3-5 días
**Complejidad:** Media-Alta
**Prioridad:** Alta (60-70% de industrias lo necesitan)

---

### 1.1 Contexto y Justificación

#### Problema Actual

El sistema solo permite **1 servicio por cita** (relación 1:1). Esto limita casos de uso reales donde los clientes necesitan agendar múltiples servicios en una sola cita.

**Limitación en código actual:**
```sql
-- sql/schema/06-operations-tables.sql:37
servicio_id INTEGER NOT NULL REFERENCES servicios(id)  -- ⚠️ SINGULAR
precio_servicio DECIMAL(10,2) NOT NULL                 -- ⚠️ Solo 1 precio
```

**Archivos afectados por limitación:**
- `backend/app/database/citas/cita.base.model.js:22,98` - Usa `servicio_id` singular
- `backend/app/schemas/cita.schemas.js:17,86,148,290` - Valida `servicio_id` singular
- `frontend/src/components/citas/CitaFormModal.jsx:24` - Schema Zod con `servicio_id`
- `backend/mcp-server/tools/crearCita.js:39` - Tool MCP con `servicio_id`

#### Casos de Uso Críticos

| Industria | Ejemplo | Servicios | Duración | Frecuencia |
|-----------|---------|-----------|----------|------------|
| **Barbería** | Corte + Barba + Tinte | 3 | 90 min | 90% de citas |
| **Salón Belleza** | Corte + Color + Tratamiento | 3 | 180 min | 90% de citas |
| **Spa** | Masaje + Facial + Manicure | 3 | 150 min | 70% de citas |
| **Estética** | Depilación + Limpieza + Hidratación | 3 | 120 min | 80% de citas |
| **Podología** | Corte + Tratamiento + Limpieza | 3 | 90 min | 50% de citas |
| **Veterinaria** | Consulta + Vacuna + Baño | 3 | 60 min | 50% de citas |

**Impacto:** 11/11 industrias soportadas se benefician de esta feature.

---

### 1.2 Arquitectura Propuesta

**Decisión:** Tabla intermedia `citas_servicios` (many-to-many)

#### Diagrama de Relaciones

```
ANTES (1:1):
citas
├── servicio_id → servicios(id)
├── precio_servicio
└── precio_final

DESPUÉS (M:N):
citas                  citas_servicios              servicios
├── precio_total       ├── cita_id                  ├── id
├── duracion_total     ├── servicio_id → servicios  ├── nombre
                       ├── precio_aplicado          ├── precio
                       ├── duracion_minutos         └── duracion
                       ├── orden_ejecucion
                       └── descuento
```

#### Ventajas de esta Arquitectura

✅ **Escalable:** N servicios sin límite
✅ **Flexible:** Campos específicos (orden, descuentos, notas) por servicio
✅ **Queries simples:** JOINs estándar de SQL
✅ **Reportes fáciles:** Analytics por servicio
✅ **Integridad:** FK constraints garantizadas

#### Desventajas y Mitigaciones

⚠️ **Migración compleja** → Mitigación: Script con validaciones + rollback plan
⚠️ **Refactorización significativa** → Mitigación: Tests exhaustivos (65+ nuevos)
⚠️ **15+ archivos a modificar** → Mitigación: Plan detallado por fases

---

### 1.3 Plan de Implementación

---

## FASE 1 - Base de Datos (1 día)

**Archivos Afectados:** 5 archivos SQL

---

### 1.1 Crear Tabla Intermedia `citas_servicios`

**Archivo:** `sql/schema/06-operations-tables.sql`

**Ubicación:** Agregar después de la tabla `citas` (línea ~140)

```sql
-- ====================================================================
-- TABLA: citas_servicios (many-to-many)
-- ====================================================================
CREATE TABLE citas_servicios (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,

    -- Orden de ejecución (1=primero, 2=segundo, etc.)
    orden_ejecucion INTEGER NOT NULL DEFAULT 1,

    -- Snapshot del precio en momento de creación
    precio_aplicado DECIMAL(10,2) NOT NULL CHECK (precio_aplicado >= 0),

    -- Duración en minutos
    duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos > 0),

    -- Descuento individual (0-100%)
    descuento DECIMAL(5,2) DEFAULT 0 CHECK (descuento >= 0 AND descuento <= 100),

    -- Notas específicas para este servicio
    notas TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(cita_id, servicio_id),
    CHECK (orden_ejecucion > 0)
);

COMMENT ON TABLE citas_servicios IS 'Relación many-to-many: múltiples servicios por cita';
```

**Campos clave:**
- `orden_ejecucion`: Define secuencia (ej: "Primero corte, luego barba")
- `precio_aplicado`: Snapshot para históricos (si precio del servicio cambia después)
- `descuento`: Descuento individual por servicio (opcional)

---

### 1.2 Modificar Tabla `citas`

**Archivo:** `sql/schema/06-operations-tables.sql`

**Cambios:**

1. **ELIMINAR** columnas obsoletas:
   ```sql
   -- ❌ ELIMINAR
   servicio_id INTEGER NOT NULL REFERENCES servicios(id)
   precio_servicio DECIMAL(10,2) NOT NULL
   ```

2. **AGREGAR** columnas nuevas:
   ```sql
   -- ✅ AGREGAR (después de línea ~52)
   precio_total DECIMAL(10,2) NOT NULL CHECK (precio_total >= 0),
   duracion_total_minutos INTEGER NOT NULL CHECK (duracion_total_minutos > 0),
   ```

3. **RENOMBRAR** columna:
   ```sql
   -- ⚠️ RENOMBRAR
   precio_final → precio_con_descuento
   ```

**Resultado final:**
```sql
CREATE TABLE citas (
    -- ... campos existentes ...

    -- ❌ COLUMNAS ELIMINADAS:
    -- servicio_id INTEGER NOT NULL,
    -- precio_servicio DECIMAL(10,2) NOT NULL,

    -- ✅ COLUMNAS NUEVAS:
    precio_total DECIMAL(10,2) NOT NULL,           -- Suma de todos los servicios
    duracion_total_minutos INTEGER NOT NULL,        -- Suma de duraciones
    precio_con_descuento DECIMAL(10,2),            -- Renombrado de precio_final

    -- ... resto de campos ...
);
```

---

### 1.3 Crear Índices

**Archivo:** `sql/schema/07-indexes.sql`

```sql
-- ====================================================================
-- ÍNDICES: citas_servicios
-- ====================================================================

-- Query más común: Obtener servicios de una cita
CREATE INDEX idx_citas_servicios_cita_id ON citas_servicios(cita_id);

-- Reportes: Qué citas incluyen un servicio específico
CREATE INDEX idx_citas_servicios_servicio_id ON citas_servicios(servicio_id);

-- Covering index para JOIN optimizado
CREATE INDEX idx_citas_servicios_covering
ON citas_servicios(cita_id, servicio_id, orden_ejecucion, precio_aplicado, duracion_minutos);

-- Ordenamiento de servicios
CREATE INDEX idx_citas_servicios_orden ON citas_servicios(cita_id, orden_ejecucion);

-- ====================================================================
-- ÍNDICE ELIMINADO: citas
-- ====================================================================
-- ❌ ELIMINAR (ya no existe servicio_id en citas)
-- DROP INDEX IF EXISTS idx_citas_servicio;

-- ====================================================================
-- ÍNDICE ADICIONAL: Performance para dashboards
-- ====================================================================
-- ⭐ NUEVO: Índice parcial para citas recientes (query 3-5x más rápida)
CREATE INDEX idx_citas_recientes_org
ON citas(organizacion_id, fecha_cita DESC)
WHERE fecha_cita >= CURRENT_DATE - INTERVAL '90 days';
```

**Performance esperado:**
- Obtener cita con servicios: < 5ms (vs ~50ms sin índices)
- Listar citas recientes: < 20ms (vs ~100ms sin índice parcial)

---

### 1.4 Crear RLS Policies

**Archivo:** `sql/schema/08-rls-policies.sql`

```sql
-- ====================================================================
-- RLS: citas_servicios
-- ====================================================================

ALTER TABLE citas_servicios ENABLE ROW LEVEL SECURITY;

-- Policy: Solo ver servicios de citas de SU organización
CREATE POLICY citas_servicios_select_policy ON citas_servicios
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM citas c
            WHERE c.id = citas_servicios.cita_id
              AND c.organizacion_id = current_setting('app.current_organization_id', TRUE)::INTEGER
        )
    );

-- Policy: Solo insertar servicios en citas de SU organización
CREATE POLICY citas_servicios_insert_policy ON citas_servicios
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM citas c
            WHERE c.id = citas_servicios.cita_id
              AND c.organizacion_id = current_setting('app.current_organization_id', TRUE)::INTEGER
        )
    );

-- Policy: Solo actualizar servicios de citas de SU organización
CREATE POLICY citas_servicios_update_policy ON citas_servicios
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM citas c
            WHERE c.id = citas_servicios.cita_id
              AND c.organizacion_id = current_setting('app.current_organization_id', TRUE)::INTEGER
        )
    );

-- Policy: Solo eliminar servicios de citas de SU organización
CREATE POLICY citas_servicios_delete_policy ON citas_servicios
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM citas c
            WHERE c.id = citas_servicios.cita_id
              AND c.organizacion_id = current_setting('app.current_organization_id', TRUE)::INTEGER
        )
    );
```

---

### 1.5 Crear Trigger

**Archivo:** `sql/schema/09-triggers.sql`

```sql
-- ====================================================================
-- TRIGGER: citas_servicios - updated_at
-- ====================================================================
CREATE TRIGGER trigger_citas_servicios_updated_at
    BEFORE UPDATE ON citas_servicios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

### 1.6 Script de Migración de Datos

**Archivo NUEVO:** `sql/migrations/001-migrar-a-multiples-servicios.sql`

**⚠️ CRÍTICO:** Este script migra todas las citas existentes a la nueva estructura.

```sql
-- ====================================================================
-- MIGRACIÓN: Citas existentes → Arquitectura múltiples servicios
-- ====================================================================
-- ⚠️ IMPORTANTE:
-- - Ejecutar SOLO UNA VEZ
-- - Hacer BACKUP antes de ejecutar
-- - Validar en desarrollo primero
-- ====================================================================

BEGIN;

-- Paso 1: Verificar tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'citas_servicios') THEN
        RAISE EXCEPTION 'Tabla citas_servicios no existe. Crear primero.';
    END IF;
END $$;

-- Paso 2: Migrar datos (cada cita existente → 1 registro en citas_servicios)
INSERT INTO citas_servicios (
    cita_id,
    servicio_id,
    orden_ejecucion,
    precio_aplicado,
    duracion_minutos,
    descuento,
    created_at,
    updated_at
)
SELECT
    c.id AS cita_id,
    c.servicio_id,
    1 AS orden_ejecucion,
    c.precio_servicio AS precio_aplicado,
    s.duracion_minutos,
    0 AS descuento,
    c.created_at,
    c.updated_at
FROM citas c
JOIN servicios s ON c.servicio_id = s.id
WHERE NOT EXISTS (
    SELECT 1 FROM citas_servicios cs WHERE cs.cita_id = c.id
);

-- Paso 3: Agregar nuevas columnas a citas (temporalmente nullable)
ALTER TABLE citas ADD COLUMN IF NOT EXISTS precio_total DECIMAL(10,2);
ALTER TABLE citas ADD COLUMN IF NOT EXISTS duracion_total_minutos INTEGER;

-- Paso 4: Calcular totales
UPDATE citas c
SET
    precio_total = COALESCE(c.precio_servicio, 0),
    duracion_total_minutos = (
        SELECT COALESCE(s.duracion_minutos, 30)
        FROM servicios s WHERE s.id = c.servicio_id
    )
WHERE c.precio_total IS NULL;

-- Paso 5: Hacer columnas NOT NULL
ALTER TABLE citas ALTER COLUMN precio_total SET NOT NULL;
ALTER TABLE citas ALTER COLUMN duracion_total_minutos SET NOT NULL;

-- Paso 6: Renombrar precio_final → precio_con_descuento
ALTER TABLE citas RENAME COLUMN precio_final TO precio_con_descuento;

-- Paso 7: Validar migración
DO $$
DECLARE
    citas_sin_servicios INTEGER;
BEGIN
    SELECT COUNT(*) INTO citas_sin_servicios
    FROM citas c
    LEFT JOIN citas_servicios cs ON c.id = cs.cita_id
    WHERE cs.id IS NULL;

    IF citas_sin_servicios > 0 THEN
        RAISE EXCEPTION 'ERROR: % citas sin servicios asociados', citas_sin_servicios;
    END IF;

    RAISE NOTICE '✅ Migración exitosa';
END $$;

-- ⚠️ Paso 8: Eliminar columnas obsoletas (DESCOMENTAR después de validar)
-- ALTER TABLE citas DROP COLUMN IF EXISTS servicio_id CASCADE;
-- ALTER TABLE citas DROP COLUMN IF EXISTS precio_servicio;

COMMIT;

-- ====================================================================
-- VALIDACIONES POST-MIGRACIÓN
-- ====================================================================

-- Verificar integridad de datos
SELECT
    c.id,
    c.codigo_cita,
    COUNT(cs.id) AS servicios_count,
    SUM(cs.precio_aplicado) AS suma_servicios,
    c.precio_total
FROM citas c
LEFT JOIN citas_servicios cs ON c.id = cs.cita_id
GROUP BY c.id
HAVING COUNT(cs.id) = 0  -- ❌ No debería haber citas sin servicios
   OR SUM(cs.precio_aplicado) != c.precio_total;  -- ❌ Inconsistencias
```

---

### ✅ Checklist Fase 1

**Base de Datos:**
- [ ] Crear tabla `citas_servicios` con constraints
- [ ] Modificar tabla `citas` (agregar precio_total, duracion_total_minutos)
- [ ] Crear 4 índices para `citas_servicios`
- [ ] Crear índice parcial `idx_citas_recientes_org`
- [ ] Eliminar índice obsoleto `idx_citas_servicio`
- [ ] Crear 4 RLS policies para `citas_servicios`
- [ ] Crear trigger `updated_at`

**Migración:**
- [ ] **BACKUP completo de BD** ⚠️ CRÍTICO
- [ ] Ejecutar migración en desarrollo
- [ ] Validar integridad (queries de validación)
- [ ] Ejecutar migración en producción
- [ ] Verificar zero data loss

---

## FASE 2 - Backend (1.5-2 días)

**Archivos Afectados:** 7 archivos

---

### 2.1 Crear Modelo `CitaServicioModel`

**Archivo NUEVO:** `backend/app/database/citas/cita-servicio.model.js`

**Métodos principales:**

```javascript
class CitaServicioModel {
  // 1. Crear múltiples servicios (bulk insert)
  static async crearMultiples(citaId, serviciosData, organizacionId) { ... }

  // 2. Obtener servicios de una cita (con JOIN a servicios)
  static async obtenerPorCita(citaId, organizacionId) { ... }

  // 3. Actualizar servicios (delete + insert)
  static async actualizarPorCita(citaId, serviciosData, organizacionId) { ... }

  // 4. Eliminar todos los servicios de una cita
  static async eliminarPorCita(citaId, organizacionId) { ... }

  // 5. Calcular totales (precio + duración)
  static calcularTotales(serviciosData) {
    const precio_total = serviciosData.reduce((sum, s) => {
      const precioConDescuento = s.precio * (1 - (s.descuento || 0) / 100);
      return sum + precioConDescuento;
    }, 0);

    const duracion_total_minutos = serviciosData.reduce(
      (sum, s) => sum + (s.duracion || 0), 0
    );

    return { precio_total, duracion_total_minutos };
  }
}
```

**Patrón de uso:**
```javascript
// Crear servicios para cita
await CitaServicioModel.crearMultiples(citaId, [
  { servicio_id: 1, orden: 1, precio: 15, duracion: 30, descuento: 0 },
  { servicio_id: 2, orden: 2, precio: 10, duracion: 15, descuento: 10 }
], organizacionId);

// Obtener servicios de cita
const servicios = await CitaServicioModel.obtenerPorCita(citaId, organizacionId);
// Retorna: [{ servicio_id, servicio_nombre, precio_aplicado, duracion_minutos, orden_ejecucion }]

// Calcular totales
const totales = CitaServicioModel.calcularTotales(serviciosData);
// Retorna: { precio_total: 24, duracion_total_minutos: 45 }
```

**Ubicación:** Agregar a exports en `backend/app/database/citas/index.js`

---

### 2.2 Modificar `CitaBaseModel.crearEstandar()`

**Archivo:** `backend/app/database/citas/cita.base.model.js`

**Cambios principales:**

**ANTES (líneas 19-98):**
```javascript
// Validar 1 servicio
await CitaHelpersModel.validarEntidadesRelacionadas(
    citaData.servicio_id,  // ❌ Singular
    ...
);

const servicio = await CitaHelpersModel.obtenerServicioCompleto(
    citaData.servicio_id,  // ❌ Singular
    ...
);
```

**DESPUÉS:**
```javascript
// ✅ Validar array de servicios
if (!Array.isArray(citaData.servicios_ids) || citaData.servicios_ids.length === 0) {
    throw new Error('Debe seleccionar al menos un servicio');
}

// ✅ Obtener detalles de TODOS los servicios
const serviciosCompletos = await Promise.all(
    citaData.servicios_ids.map(servicioId =>
        CitaHelpersModel.obtenerServicioCompleto(servicioId, organizacionId, db)
    )
);

// ✅ Preparar datos para tabla intermedia
const serviciosData = serviciosCompletos.map((servicio, index) => ({
    servicio_id: servicio.id,
    orden: index + 1,
    precio: servicio.precio_mensual,
    duracion: servicio.duracion_minutos,
    descuento: 0
}));

// ✅ Calcular totales
const { precio_total, duracion_total_minutos } =
    CitaServicioModel.calcularTotales(serviciosData);

// ✅ Crear cita (sin servicio_id)
const query = `
    INSERT INTO citas (
        organizacion_id, cliente_id, profesional_id,
        fecha_cita, hora_inicio, hora_fin,
        precio_total, duracion_total_minutos, precio_con_descuento,
        estado, notas_cliente
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
`;

const citaCreada = (await db.query(query, values)).rows[0];

// ✅ Crear registros en citas_servicios
await CitaServicioModel.crearMultiples(citaCreada.id, serviciosData, organizacionId);

// ✅ Retornar con servicios
citaCreada.servicios = await CitaServicioModel.obtenerPorCita(citaCreada.id, organizacionId);
return citaCreada;
```

**⚠️ IMPORTANTE:** Agregar validación de duración total:
```javascript
// Validar que duración total no exceda 8 horas
if (duracion_total_minutos > 480) {
    throw new Error('La duración total no puede exceder 8 horas (480 minutos)');
}

// ✅ Validar que cita termina dentro del horario del profesional
const horaFinCalculada = sumarMinutos(citaData.hora_inicio, duracion_total_minutos);
const validacion = await CitaHelpersModel.validarHorarioPermitido(
    citaData.profesional_id,
    fechaCitaNormalizada,
    citaData.hora_inicio,
    horaFinCalculada,  // ✅ Usar hora_fin con duración real
    citaData.organizacion_id,
    db
);
```

---

### 2.3 Modificar `CitaBaseModel.obtenerPorId()`

**Archivo:** `backend/app/database/citas/cita.base.model.js`

**Cambios:**

```javascript
// ❌ ELIMINAR JOIN con servicios
const query = `
    SELECT
        c.*,
        cli.nombre AS cliente_nombre,
        prof.nombre AS profesional_nombre
        -- ❌ ELIMINAR: serv.nombre AS servicio_nombre
    FROM citas c
    JOIN clientes cli ON c.cliente_id = cli.id
    JOIN profesionales prof ON c.profesional_id = prof.id
    -- ❌ ELIMINAR: JOIN servicios serv ON c.servicio_id = serv.id
    WHERE c.id = $1
`;

const cita = result.rows[0];

// ✅ AGREGAR servicios desde tabla intermedia
cita.servicios = await CitaServicioModel.obtenerPorCita(cita.id, organizacionId);

return cita;
```

---

### 2.4 Modificar `CitaBaseModel.actualizar()`

**Archivo:** `backend/app/database/citas/cita.base.model.js`

**Agregar lógica para actualizar servicios:**

```javascript
static async actualizar(id, cambios, organizacionId) {
    return await RLSContextManager.transaction(organizacionId, async (db) => {

        // ✅ NUEVO: Si se modifican servicios, recalcular totales
        if (cambios.servicios_ids && Array.isArray(cambios.servicios_ids)) {
            const serviciosCompletos = await Promise.all(
                cambios.servicios_ids.map(servicioId =>
                    CitaHelpersModel.obtenerServicioCompleto(servicioId, organizacionId, db)
                )
            );

            const serviciosData = serviciosCompletos.map((servicio, index) => ({
                servicio_id: servicio.id,
                orden: index + 1,
                precio: servicio.precio_mensual,
                duracion: servicio.duracion_minutos,
                descuento: 0
            }));

            const { precio_total, duracion_total_minutos } =
                CitaServicioModel.calcularTotales(serviciosData);

            // Actualizar servicios en tabla intermedia
            await CitaServicioModel.actualizarPorCita(id, serviciosData, organizacionId);

            // Agregar totales a cambios
            cambios.precio_total = precio_total;
            cambios.duracion_total_minutos = duracion_total_minutos;
            cambios.precio_con_descuento = precio_total;

            delete cambios.servicios_ids;  // No existe en tabla citas
        }

        // ... resto del UPDATE ...

        // ✅ Retornar con servicios
        citaActualizada.servicios = await CitaServicioModel.obtenerPorCita(id, organizacionId);
        return citaActualizada;
    });
}
```

---

### 2.5 Modificar Schemas de Validación

**Archivo:** `backend/app/schemas/cita.schemas.js`

**⚠️ IMPORTANTE:** Archivo se llama `cita.schemas.js` (con 's'), no `cita.schema.js`

**Cambios en 4 schemas:**

#### Schema 1: `crear` (línea 17)

**ANTES:**
```javascript
servicio_id: commonSchemas.id,  // ❌ Singular
```

**DESPUÉS:**
```javascript
servicios_ids: Joi.array()
    .items(commonSchemas.id)
    .min(1)
    .max(10)
    .required()
    .messages({
        'array.min': 'Debe seleccionar al menos un servicio',
        'array.max': 'No puede seleccionar más de 10 servicios'
    }),
```

#### Schema 2: `actualizar` (línea 86)

**ANTES:**
```javascript
servicio_id: commonSchemas.id.optional(),  // ❌ Singular
```

**DESPUÉS:**
```javascript
servicios_ids: Joi.array()
    .items(commonSchemas.id)
    .min(1)
    .max(10)
    .optional(),
```

#### Schema 3: `crearWalkIn` (línea 290)

**⚠️ CRÍTICO:** Este schema NO está mencionado en el plan original pero también usa `servicio_id`

**ANTES:**
```javascript
servicio_id: commonSchemas.id.required(),  // ❌ Singular
```

**DESPUÉS:**
```javascript
servicios_ids: Joi.array()
    .items(commonSchemas.id)
    .min(1)
    .max(10)
    .required(),
```

#### Schema 4: `listar` (línea 148)

**RECOMENDACIÓN:** Mantener ambos para retrocompatibilidad

**ANTES:**
```javascript
servicio_id: commonSchemas.id.optional(),  // Filtro singular
```

**DESPUÉS:**
```javascript
// ⚠️ DEPRECATED pero mantener para retrocompatibilidad
servicio_id: commonSchemas.id.optional()
    .messages({ 'any.deprecated': 'Usar servicios_ids en su lugar' }),

// ✅ NUEVO: Filtrar citas que incluyan TODOS estos servicios
servicios_ids: Joi.array()
    .items(commonSchemas.id)
    .optional(),
```

---

### 2.6 Modificar Controllers

**Archivo:** `backend/app/controllers/citas/cita.base.controller.js`

**Cambios menores:**

```javascript
// Método obtener() ya incluye servicios (desde el modelo)
static async obtener(req, res) {
    const cita = await CitaBaseModel.obtenerPorId(id, organizacionId);
    // ✅ cita.servicios ya está incluido
    return ResponseHelper.success(res, cita, 'Cita obtenida exitosamente');
}

// Método listar() necesita agregar servicios
static async listar(req, res) {
    const citas = await CitaOperacionalModel.listar(filtros, organizacionId);

    // ✅ Agregar servicios a cada cita
    const citasConServicios = await Promise.all(
        citas.map(async (cita) => {
            cita.servicios = await CitaServicioModel.obtenerPorCita(cita.id, organizacionId);
            return cita;
        })
    );

    return ResponseHelper.success(res, citasConServicios, 'Citas listadas');
}
```

---

### 2.7 Actualizar MCP Tool `crearCita`

**Archivo:** `backend/mcp-server/tools/crearCita.js`

**Cambios en inputSchema (línea 39):**

**ANTES:**
```javascript
servicio_id: {
    type: 'number',
    description: 'ID del servicio a realizar',
},
```

**DESPUÉS:**
```javascript
servicios_ids: {
    type: 'array',
    items: { type: 'number' },
    description: 'Array de IDs de servicios a agendar (mínimo 1, máximo 10)',
    minItems: 1,
    maxItems: 10
},
```

**Cambios en handler (línea ~150):**

**ANTES:**
```javascript
const payload = {
    servicio_id: parseInt(args.servicio_id),  // ❌ Singular
    ...
};
```

**DESPUÉS:**
```javascript
const payload = {
    servicios_ids: Array.isArray(args.servicios_ids)
        ? args.servicios_ids.map(id => parseInt(id))
        : [parseInt(args.servicio_id)],  // Retrocompatibilidad
    ...
};
```

---

### ✅ Checklist Fase 2

**Modelos:**
- [ ] Crear `CitaServicioModel` con 5 métodos
- [ ] Modificar `CitaBaseModel.crearEstandar()` para array
- [ ] Modificar `CitaBaseModel.obtenerPorId()` para incluir servicios
- [ ] Modificar `CitaBaseModel.actualizar()` para recalcular
- [ ] Agregar validación duración total < 8h
- [ ] Agregar validación hora_fin con duración real

**Schemas:**
- [ ] Actualizar `crear.body`: servicio_id → servicios_ids
- [ ] Actualizar `actualizar.body`: agregar servicios_ids
- [ ] Actualizar `crearWalkIn.body`: servicio_id → servicios_ids ⚠️
- [ ] Actualizar `listar.query`: agregar servicios_ids (mantener servicio_id)

**Controllers:**
- [ ] Modificar `obtener()` (ya incluye servicios desde modelo)
- [ ] Modificar `listar()` para agregar servicios a cada cita

**MCP Server:**
- [ ] Actualizar inputSchema de `crearCita`
- [ ] Actualizar handler para array de servicios

**Tests:**
- [ ] Probar endpoints en Postman/Insomnia
- [ ] Ejecutar suite de tests (debe pasar 100%)

---

## FASE 3 - Frontend (1 día)

**Archivos Afectados:** 4 archivos

---

### 3.1 Modificar Schema Zod en CitaFormModal

**Archivo:** `frontend/src/components/citas/CitaFormModal.jsx` (línea 24)

**NOTA:** Los schemas de validación de citas están DENTRO del componente, no en `validations.js`

**ANTES:**
```javascript
servicio_id: z.string().min(1, 'Debes seleccionar un servicio'),  // ❌ String singular
```

**DESPUÉS:**
```javascript
servicios_ids: z.array(z.string())
    .min(1, 'Debes seleccionar al menos un servicio')
    .max(10, 'No puedes seleccionar más de 10 servicios')
    .refine((servicios) => {
        // ✅ Validar duración total < 8 horas
        const duracionTotal = servicios.reduce((sum, id) => {
            const servicio = servicios.find(s => s.id === id);
            return sum + (servicio?.duracion_minutos || 0);
        }, 0);
        return duracionTotal <= 480;
    }, {
        message: 'La duración total no puede exceder 8 horas (480 minutos)',
        path: ['servicios_ids']
    }),
```

---

### 3.2 Crear Componente MultiSelect de Servicios

**Archivo:** `frontend/src/components/citas/CitaFormModal.jsx`

**Reemplazar Select singular por componente MultiSelect:**

```jsx
// ✅ Estado para servicios seleccionados
const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);

// ✅ Calcular totales en tiempo real
const totalesCalculados = useMemo(() => {
    if (!servicios || serviciosSeleccionados.length === 0) {
        return { precio: 0, duracion: 0 };
    }

    const serviciosCompletos = serviciosSeleccionados
        .map(id => servicios.find(s => s.id.toString() === id))
        .filter(Boolean);

    const precio = serviciosCompletos.reduce((sum, s) => sum + s.precio_mensual, 0);
    const duracion = serviciosCompletos.reduce((sum, s) => sum + s.duracion_minutos, 0);

    return { precio, duracion };
}, [serviciosSeleccionados, servicios]);

// ✅ Toggle de selección
const handleServicioToggle = (servicioId) => {
    setServiciosSeleccionados(prev => {
        if (prev.includes(servicioId)) {
            return prev.filter(id => id !== servicioId);
        } else {
            if (prev.length >= 10) {
                toast.warning('No puedes seleccionar más de 10 servicios');
                return prev;
            }
            return [...prev, servicioId];
        }
    });
};

// ✅ UI MultiSelect (checkboxes)
<div className="space-y-2">
    <label className="block text-sm font-medium">Servicios *</label>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3">
        {servicios?.map(servicio => (
            <div
                key={servicio.id}
                onClick={() => handleServicioToggle(servicio.id.toString())}
                className={`
                    flex items-center justify-between p-3 rounded border-2 cursor-pointer
                    ${serviciosSeleccionados.includes(servicio.id.toString())
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'}
                `}
            >
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={serviciosSeleccionados.includes(servicio.id.toString())}
                        readOnly
                    />
                    <div>
                        <p className="text-sm font-medium">{servicio.nombre}</p>
                        <p className="text-xs text-gray-500">{servicio.duracion_minutos} min</p>
                    </div>
                </div>
                <span className="text-sm font-semibold">${servicio.precio_mensual}</span>
            </div>
        ))}
    </div>

    {/* ✅ Resumen de totales */}
    {serviciosSeleccionados.length > 0 && (
        <div className="bg-gray-50 rounded p-4">
            <h4 className="text-sm font-semibold mb-2">Resumen</h4>

            <div className="space-y-1 mb-2">
                {serviciosSeleccionados.map(id => {
                    const servicio = servicios.find(s => s.id.toString() === id);
                    return (
                        <div key={id} className="flex justify-between text-sm">
                            <span>{servicio.nombre}</span>
                            <span className="font-medium">${servicio.precio_mensual}</span>
                        </div>
                    );
                })}
            </div>

            <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-primary-600">
                    ${totalesCalculados.precio.toFixed(2)}
                </span>
            </div>

            <p className="text-xs text-gray-600 mt-1">
                Duración estimada: {totalesCalculados.duracion} minutos
            </p>
        </div>
    )}
</div>
```

---

### 3.3 Actualizar CitasList para Múltiples Servicios

**Archivo:** `frontend/src/components/citas/CitasList.jsx`

**ANTES:**
```jsx
<td>
    <span>{cita.servicio_nombre}</span>
</td>
```

**DESPUÉS:**
```jsx
<td>
    {cita.servicios && cita.servicios.length > 0 ? (
        <div className="space-y-1">
            {cita.servicios.map((servicio, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                    <span>{servicio.servicio_nombre}</span>
                    <span className="text-gray-500 text-xs">
                        (${servicio.precio_aplicado} · {servicio.duracion_minutos}min)
                    </span>
                </div>
            ))}

            {cita.servicios.length > 1 && (
                <div className="text-xs text-primary-600 font-medium pt-1 border-t">
                    Total: ${cita.precio_total} · {cita.duracion_total_minutos}min
                </div>
            )}
        </div>
    ) : (
        <span className="text-gray-400">Sin servicios</span>
    )}
</td>
```

---

### 3.4 Modificar Hook useCitas

**Archivo:** `frontend/src/hooks/useCitas.js`

**Agregar transformación de datos para compatibilidad:**

```javascript
export function useCitas(filtros = {}) {
    return useQuery({
        queryKey: ['citas', filtros],
        queryFn: async () => {
            const response = await citasApi.listar(filtros);

            // ✅ Transformar para asegurar array de servicios
            const citas = response.data.data.map(cita => ({
                ...cita,
                servicios: Array.isArray(cita.servicios) ? cita.servicios : [],
                // ⚠️ Mantener compatibilidad con código viejo (opcional)
                servicio_nombre: cita.servicios?.[0]?.servicio_nombre || 'Sin servicio',
            }));

            return citas;
        },
        staleTime: 30 * 1000,
    });
}
```

---

### ✅ Checklist Fase 3

**Schema Zod:**
- [ ] Actualizar en CitaFormModal: servicio_id → servicios_ids (array)
- [ ] Agregar validación duración total < 8h

**Componentes:**
- [ ] Crear MultiSelect de servicios con checkboxes
- [ ] Agregar cálculo en tiempo real de precio y duración
- [ ] Mostrar resumen de servicios seleccionados
- [ ] Actualizar CitasList para mostrar array de servicios
- [ ] Actualizar CitaDetailModal para mostrar servicios

**Hooks:**
- [ ] Modificar useCitas para transformar datos

**Testing:**
- [ ] Probar flujo crear cita con 1 servicio
- [ ] Probar flujo crear cita con 3 servicios
- [ ] Probar flujo editar servicios de cita existente
- [ ] Validar UX en mobile y desktop

---

## FASE 4 - Testing (0.5 días)

**Tests Nuevos Estimados:** 65-80 tests

---

### 4.1 Tests Unitarios - CitaServicioModel

**Archivo NUEVO:** `backend/app/__tests__/models/cita-servicio.test.js`

**Tests principales (15 tests):**

1. `crearMultiples()` - Debe insertar N servicios correctamente
2. `crearMultiples()` - Debe validar organizacion_id (RLS)
3. `obtenerPorCita()` - Debe retornar servicios ordenados por orden_ejecucion
4. `obtenerPorCita()` - Debe incluir datos del servicio (JOIN)
5. `actualizarPorCita()` - Debe eliminar servicios viejos e insertar nuevos
6. `eliminarPorCita()` - Debe eliminar todos los servicios
7. `calcularTotales()` - Debe calcular precio sin descuentos
8. `calcularTotales()` - Debe aplicar descuentos individuales correctamente
9. `calcularTotales()` - Debe sumar duraciones correctamente
10. Validar UNIQUE constraint (cita_id, servicio_id)
11. Validar CHECK constraint (orden_ejecucion > 0)
12. Validar CHECK constraint (descuento 0-100%)
13. Validar CASCADE delete (eliminar cita → eliminar servicios)
14. Validar RESTRICT delete (no eliminar servicio si está en citas)
15. Performance: Bulk insert de 10 servicios < 100ms

---

### 4.2 Tests de Integración - Endpoints

**Archivo:** `backend/app/__tests__/endpoints/citas.test.js`

**Tests nuevos (20 tests):**

**POST /api/v1/citas:**
1. Crear cita con 1 servicio (compatibilidad legacy)
2. Crear cita con 3 servicios
3. Crear cita con 10 servicios (límite máximo)
4. Rechazar cita sin servicios (array vacío)
5. Rechazar cita con más de 10 servicios
6. Validar cálculo automático de precio_total
7. Validar cálculo automático de duracion_total_minutos
8. Validar orden_ejecucion autoincremental

**GET /api/v1/citas/:id:**
9. Retornar cita con array de servicios
10. Incluir datos completos de cada servicio (nombre, precio, duración)
11. Servicios ordenados por orden_ejecucion

**PATCH /api/v1/citas/:id:**
12. Actualizar servicios (agregar 2 servicios más)
13. Actualizar servicios (remover 1 servicio)
14. Actualizar servicios (reemplazar todos)
15. Recalcular precio_total y duracion_total_minutos

**GET /api/v1/citas (listado):**
16. Listar citas con servicios incluidos
17. Filtrar por servicio_id (DEPRECATED pero funcional)
18. Filtrar por servicios_ids (nuevo)

**POST /api/v1/citas/walk-in:**
19. Crear walk-in con múltiples servicios
20. Validar que walk-in también soporte servicios_ids

---

### 4.3 Tests E2E - Frontend

**Tests principales (10 tests):**

1. Usuario puede seleccionar múltiples servicios con checkboxes
2. Ver total y duración calculados en tiempo real
3. Validar que no se puedan seleccionar más de 10 servicios
4. Validar mensaje de error si duración total > 8h
5. Crear cita con 3 servicios exitosamente
6. Ver servicios en lista de citas
7. Editar cita y cambiar servicios
8. Ver detalles de cita con múltiples servicios
9. Validar que precios individuales se muestren correctamente
10. Validar responsive (mobile y desktop)

---

### 4.4 Tests de Performance

**Tests críticos (5 tests):**

1. Query `obtenerPorCita()` con JOIN < 10ms
2. Bulk insert de 10 servicios < 100ms
3. Listar 100 citas con servicios < 500ms
4. Migración de 10,000 citas < 2 minutos
5. Índice covering acelera query en 3-5x

---

### ✅ Checklist Fase 4

- [ ] 15 tests unitarios CitaServicioModel
- [ ] 20 tests integración endpoints
- [ ] 10 tests E2E frontend
- [ ] 5 tests de performance
- [ ] Ejecutar suite completa (debe pasar 100%)
- [ ] Coverage mínimo 80% en archivos nuevos
- [ ] Probar en Postman/Insomnia

**Comando de tests:**
```bash
docker exec back npm test
docker exec back npm test -- __tests__/models/cita-servicio.test.js
docker exec back npm test -- __tests__/endpoints/citas.test.js
```

---

## FASE 5 - Migración y Rollout (0.5 días)

**Downtime Estimado:** 30 minutos

---

### 5.1 Checklist Pre-Migración

**⚠️ CRÍTICO:**

- [ ] **BACKUP completo de BD:**
  ```bash
  docker exec postgres_db pg_dumpall -U admin > backup_pre_multiples_servicios_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Validar en desarrollo:**
  - [ ] Ejecutar migración en BD desarrollo
  - [ ] Validar queries funcionan
  - [ ] Probar flujo completo (crear/editar/listar/eliminar)
  - [ ] Verificar RLS funciona

- [ ] **Preparar rollback plan** (ver sección 5.3)

- [ ] **Notificar stakeholders:** Downtime de 30 min

---

### 5.2 Procedimiento de Migración en Producción

#### Paso 1: Modo Mantenimiento (5 min)

```bash
# Detener backend para evitar escrituras
docker compose stop backend mcp-server

# Frontend mostrará error de conexión (ok)
```

#### Paso 2: Backup Final (5 min)

```bash
docker exec postgres_db pg_dumpall -U admin > backup_final_$(date +%Y%m%d_%H%M%S).sql

# Verificar backup
ls -lh backup_final_*.sql
```

#### Paso 3: Ejecutar Migración (10 min)

```bash
# Copiar script al contenedor
docker cp sql/migrations/001-migrar-a-multiples-servicios.sql postgres_db:/tmp/

# Ejecutar migración
docker exec -it postgres_db psql -U admin -d postgres -f /tmp/001-migrar-a-multiples-servicios.sql

# Ver output (debe decir "✅ Migración exitosa")
```

#### Paso 4: Validar Migración (5 min)

```bash
# Conectar a BD
docker exec -it postgres_db psql -U admin -d postgres

-- Verificar tabla existe
\d citas_servicios

-- Verificar datos migrados
SELECT COUNT(*) FROM citas_servicios;
SELECT COUNT(*) FROM citas;

-- Verificar NO hay citas sin servicios
SELECT COUNT(*) FROM citas c
LEFT JOIN citas_servicios cs ON c.id = cs.cita_id
WHERE cs.id IS NULL;
-- Debe retornar 0

-- Verificar integridad de precios
SELECT COUNT(*) FROM citas c
JOIN (
    SELECT cita_id, SUM(precio_aplicado) AS suma
    FROM citas_servicios
    GROUP BY cita_id
) cs ON c.id = cs.cita_id
WHERE ABS(c.precio_total - cs.suma) > 0.01;
-- Debe retornar 0

\q
```

#### Paso 5: Desplegar Código Nuevo (5 min)

```bash
# Reconstruir con código actualizado
docker compose up -d --build backend mcp-server

# Verificar logs
docker compose logs -f backend

# Debe decir "Server listening on port 3000"
```

#### Paso 6: Smoke Tests (5 min)

```bash
# Test 1: Health check
curl http://localhost:3000/api/health

# Test 2: Crear cita con múltiples servicios
curl -X POST http://localhost:3000/api/v1/citas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": 1,
    "profesional_id": 1,
    "servicios_ids": [1, 2],
    "fecha_cita": "2025-11-01",
    "hora_inicio": "10:00",
    "hora_fin": "11:00"
  }'

# Test 3: Obtener cita
curl http://localhost:3000/api/v1/citas/1 \
  -H "Authorization: Bearer $TOKEN"

# Verificar que response incluye "servicios": [...]
```

#### Paso 7: Salir de Mantenimiento

```bash
# ✅ Si todo OK → Sistema ya está operativo
# Frontend reconectará automáticamente
```

---

### 5.3 Plan de Rollback

**Si algo falla durante migración:**

#### Opción 1: Rollback Completo (15 min)

```bash
# 1. Detener servicios
docker compose stop backend mcp-server

# 2. Restaurar backup
cat backup_final_[TIMESTAMP].sql | docker exec -i postgres_db psql -U admin

# 3. Revertir código
git checkout [COMMIT_ANTERIOR]
docker compose up -d --build backend mcp-server

# 4. Validar
curl http://localhost:3000/api/health
```

#### Opción 2: Rollback Solo Código (5 min)

```bash
# Si migración BD fue exitosa pero código tiene bugs
git checkout [COMMIT_ANTERIOR]
docker compose up -d --build backend mcp-server
```

---

### 5.4 Monitoreo Post-Despliegue

**Métricas a monitorear (primeras 24h):**

1. **Performance de Queries:**
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   WHERE query LIKE '%citas_servicios%'
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Integridad de Datos (diario durante 1 semana):**
   ```sql
   -- Citas sin servicios (debe ser 0)
   SELECT COUNT(*) FROM citas c
   LEFT JOIN citas_servicios cs ON c.id = cs.cita_id
   WHERE cs.id IS NULL;

   -- Precios inconsistentes (debe ser 0)
   SELECT COUNT(*) FROM citas c
   JOIN (
       SELECT cita_id, SUM(precio_aplicado) AS suma
       FROM citas_servicios GROUP BY cita_id
   ) cs ON c.id = cs.cita_id
   WHERE ABS(c.precio_total - cs.suma) > 0.01;
   ```

3. **Logs de Errores:**
   ```bash
   docker compose logs backend | grep -i "error\|servicio"
   ```

---

### ✅ Checklist Fase 5

- [ ] Backup completo pre-migración
- [ ] Migración en desarrollo exitosa
- [ ] Rollback plan documentado y probado
- [ ] Stakeholders notificados
- [ ] Modo mantenimiento activado
- [ ] Backup final en producción
- [ ] Migración SQL ejecutada
- [ ] Validaciones post-migración OK
- [ ] Código nuevo desplegado
- [ ] Smoke tests pasados
- [ ] Monitoreo activado (24h)
- [ ] Documentación actualizada (CLAUDE.md)

---

## 1.4 Resumen Ejecutivo

### Tiempo Total Estimado

**3-5 días** (24-40 horas de trabajo)

| Fase | Tiempo | Complejidad | Archivos |
|------|--------|-------------|----------|
| Fase 1: Base de Datos | 1 día | Media | 5 SQL |
| Fase 2: Backend | 1.5-2 días | Alta | 7 JS |
| Fase 3: Frontend | 1 día | Media | 4 JSX |
| Fase 4: Testing | 0.5 día | Baja | 3 test |
| Fase 5: Migración | 0.5 día | Media | 1 script |

---

### Archivos a Modificar

**Total:** 17 archivos (3 nuevos, 14 modificados)

**Base de Datos (5 archivos):**
- `sql/schema/06-operations-tables.sql` - Crear tabla + modificar citas
- `sql/schema/07-indexes.sql` - 5 índices nuevos
- `sql/schema/08-rls-policies.sql` - 4 policies
- `sql/schema/09-triggers.sql` - 1 trigger
- `sql/migrations/001-migrar-a-multiples-servicios.sql` - **NUEVO**

**Backend (7 archivos):**
- `backend/app/database/citas/cita-servicio.model.js` - **NUEVO**
- `backend/app/database/citas/cita.base.model.js` - Modificar 3 métodos
- `backend/app/schemas/cita.schemas.js` - Modificar 4 schemas
- `backend/app/controllers/citas/cita.base.controller.js` - Modificar 2 métodos
- `backend/app/__tests__/endpoints/citas.test.js` - Agregar 20 tests
- `backend/app/__tests__/models/cita-servicio.test.js` - **NUEVO** (15 tests)
- `backend/mcp-server/tools/crearCita.js` - Modificar inputSchema

**Frontend (4 archivos):**
- `frontend/src/components/citas/CitaFormModal.jsx` - Refactorizar form
- `frontend/src/components/citas/CitasList.jsx` - Modificar display
- `frontend/src/hooks/useCitas.js` - Transformación datos
- `frontend/src/components/citas/CitaDetailModal.jsx` - Mostrar múltiples

**Tests nuevos estimados:** 65-80 tests

---

### Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pérdida de datos en migración | Baja | Crítico | Backups + validación en dev + rollback |
| Queries lentas con JOINs | Media | Alto | Índices covering + monitoreo |
| Bugs en cálculo de totales | Media | Medio | Tests exhaustivos + validación BD |
| UX confusa múltiples servicios | Media | Medio | Diseño claro + feedback usuarios |
| Incompatibilidad chatbot | Baja | Alto | Actualizar MCP tool + tests E2E |

---

### Criterios de Éxito

**Funcionales:**
- ✅ Sistema permite crear citas con 1-10 servicios
- ✅ Precios y duraciones se calculan automáticamente
- ✅ UI muestra claramente todos los servicios
- ✅ Chatbot puede crear citas con múltiples servicios
- ✅ Reportes funcionan correctamente

**No Funcionales:**
- ✅ Performance: Queries < 100ms (P95)
- ✅ Tests: 100% passing (mínimo 65 nuevos)
- ✅ Coverage: > 80% en código nuevo
- ✅ Zero data loss en migración
- ✅ Downtime < 30 minutos

**Negocio:**
- ✅ 60-70% de industrias pueden usar la feature
- ✅ Reduce fricción en onboarding
- ✅ Aumenta satisfacción (NPS +10 puntos)

---

### Recomendaciones Adicionales Post-MVP

**Versión 1.1 (+1 semana):**
- Drag-and-drop para reordenar servicios en UI
- Descuento global + individual (dos niveles)
- Validación avanzada duración total
- Sugerencias inteligentes de combos

**Versión 1.2 (+2 semanas):**
- Reportes especializados por paquetes
- Analytics de servicios más combinados
- Templates de paquetes predefinidos
- Cache Redis para servicios

---

## 🟡 FEATURES OPCIONALES

### Calendario Disponibilidad Frontend

**Estado:** Pendiente de decisión según necesidad de negocio
**Valor:** Medio
**Tiempo:** 3-4 horas

**Componentes:**
- Hook `useDisponibilidad` (~80 líneas)
- Endpoint API (~20 líneas)
- Componente `CalendarioDisponibilidad` (~120 líneas)
- Integración en `CitasPage`

**Backend ya disponible:** Endpoint `/api/v1/disponibilidad` ✅

**Criterios de decisión:**

**Implementar SI:**
- ✅ Hay demo/presentación próxima
- ✅ Admins solicitan explícitamente
- ✅ Hay 4+ horas disponibles

**NO implementar SI:**
- ❌ Prioridad es MVP rápido
- ❌ Vista lista actual es suficiente
- ❌ Hay features más críticas

---

### Optimizaciones de Performance

**Implementar SOLO si métricas lo justifican:**

1. **Cache Redis para Disponibilidad (2h)**
   - Cuándo: Tráfico > 100 consultas/min
   - Beneficio: 80-90% reducción tiempo respuesta

2. **Paginación de Response (1h)**
   - Cuándo: Consultas retornan > 100 slots
   - Beneficio: Menor payload, render más rápido

---

## 📊 APÉNDICES

### A. KPIs Post-Implementación

**Semana 1 (Crítico):**
- ✅ Zero data loss en migración (100%)
- ✅ Tests pasando: 610+/610+
- ✅ Performance: P95 < 100ms
- ✅ Zero errores 500

**Semana 2-4 (Adopción):**
- 📊 % citas con múltiples servicios (meta: >15%)
- 📊 Tiempo creación cita (meta: <30s)
- 📊 Errores usuario (meta: <5%)
- 📊 NPS (meta: +10 puntos)

**Mes 2+ (Optimización):**
- 📊 Reducción llamadas soporte (meta: -30%)
- 📊 Aumento ticket promedio (meta: +20%)
- 📊 Performance reportes (meta: <500ms)

---

### B. Próximos Pasos

1. **Semana 1:** Monitoreo intensivo + hotfixes
2. **Semana 2-4:** Feedback usuarios + iteraciones UX
3. **Mes 2:** Features adicionales (descuentos, drag-and-drop)
4. **Mes 3:** Analytics y reportes especializados

---

### C. Actualizaciones CLAUDE.md

**Actualizar después de implementación:**

```markdown
## 🛠 Stack Técnico

### Base de Datos
- **Tablas:** 20 (agregada: citas_servicios)
- **Índices:** 119 (agregados: 5)
- **RLS Policies:** 28 (agregadas: 4)

### Backend
- **Models:** 18 archivos (agregado: CitaServicioModel)

### MCP Server
- **Tools:** 5 operativas (actualizada: crearCita con servicios_ids)
```

---

**Versión:** 3.0 (Optimizada)
**Última actualización:** 26 Octubre 2025
**Estado:** 🔴 Pendiente de implementación
**Reducción vs v2.0:** 37% menos líneas (2,529 → 1,600)
