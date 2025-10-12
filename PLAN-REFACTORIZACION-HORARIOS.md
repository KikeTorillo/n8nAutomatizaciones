# 🔧 PLAN DE REFACTORIZACIÓN: Sistema de Horarios y Citas

**Fecha creación:** 11 Octubre 2025
**Estado:** Planificación completada - Pendiente implementación
**Versión:** 1.0

---

## 📋 TABLA DE CONTENIDOS

1. [Contexto y Análisis](#contexto-y-análisis)
2. [Hallazgos Críticos](#hallazgos-críticos)
3. [Decisiones Arquitectónicas](#decisiones-arquitectónicas)
4. [Plan de Implementación](#plan-de-implementación)
5. [Checklist de Ejecución](#checklist-de-ejecución)
6. [Validación Post-Implementación](#validación-post-implementación)

---

## 🎯 CONTEXTO Y ANÁLISIS

### Estado Actual del Sistema

**Tests:** 481/482 pasando (99.8%)
**Arquitectura:** Multi-tenant SaaS con RLS
**Stack:** PostgreSQL 17 + Node.js/Express + React

### Problema Identificado

El sistema tiene **DOS tablas de horarios** con funcionalidades que se solapan y generan confusión:

1. **`horarios_profesionales`** ✅ - Plantillas semanales (ACTIVA)
2. **`horarios_disponibilidad`** ❌ - Slots pre-generados (CÓDIGO MUERTO)

### Flujos Validados

- ✅ Agendamiento manual estándar
- ✅ Walk-in con auto-asignación de profesional
- ✅ Walk-in con selección manual de profesional
- ✅ Reprogramación de citas
- ✅ Cambio de profesional
- ✅ Multi-franja horaria (9-13h, 15-19h con break almuerzo)

---

## 🔍 HALLAZGOS CRÍTICOS

### 1. Tabla `horarios_disponibilidad` NO se está usando

**Código implementado pero NUNCA ejecutado:**

```javascript
// ❌ NUNCA SE LLAMA
HorarioService.generarHorariosProfesional()  // 252 líneas
HorarioModel.consultarDisponibilidad()       // 177 líneas
HorarioModel.reservarTemporalmente()         // 85 líneas
CitaHelpersModel.buscarHorarioCompatible()   // 88 líneas
```

**Flujo REAL que funciona:**

```javascript
// ✅ ESTO ES LO QUE SE USA
CitaHelpersModel.validarHorarioPermitido()
    ↓
Valida contra:
    • horarios_profesionales (plantillas semanales)
    • bloqueos_horarios (vacaciones, feriados)
    • citas existentes (conflictos)
    ↓
Crea cita directamente
```

### 2. Diferencia entre las Tablas

#### `horarios_profesionales` (MANTENER)

**Propósito:** Plantilla semanal reutilizable del horario de trabajo
**Registros:** ~10 por profesional
**Ejemplo:**
```sql
-- "Todos los lunes 9-13h y 14-18h"
INSERT INTO horarios_profesionales VALUES
(1, 15, 1, '09:00', '13:00', 'regular', true),  -- Lunes mañana
(2, 15, 1, '13:00', '14:00', 'almuerzo', false), -- Lunes almuerzo
(3, 15, 1, '14:00', '18:00', 'regular', true);  -- Lunes tarde
```

**Uso actual:** `validarHorarioPermitido()` la consulta en TODAS las validaciones de citas

#### `horarios_disponibilidad` (ELIMINAR)

**Propósito teórico:** Pre-generar slots específicos por fecha
**Registros:** ~1000+ por profesional por mes (crece infinito)
**Ejemplo:**
```sql
-- "Slot específico 15-Oct-2025 09:00-09:30"
INSERT INTO horarios_disponibilidad VALUES
(1, 15, '2025-10-15', '09:00', '09:30', 'disponible', 30);
-- ... 40+ registros por día por profesional
```

**Uso actual:** NINGUNO - Código nunca se ejecuta

### 3. Bugs Identificados

#### Bug #1: Walk-In Queue Management

**Ubicación:** `backend/app/database/citas/cita.operacional.model.js:415`

**Problema:**
```javascript
// ❌ INCORRECTO - Solo busca 'en_curso'
const citaActual = await db.query(`
    WHERE c.estado = 'en_curso'  // Ignora citas 'confirmada' en cola
`);
```

**Impacto:**
- Walk-in #1: ✅ Success (va a `en_curso`)
- Walk-in #2: ✅ Success (va a `confirmada` en cola)
- Walk-in #3: ❌ ERROR 409 (sistema piensa que profesional está libre)

**Fix:**
```javascript
// ✅ CORRECTO - Busca ambos estados
WHERE c.estado IN ('en_curso', 'confirmada')
  AND c.hora_fin_real IS NULL
ORDER BY
    CASE WHEN c.estado = 'en_curso' THEN 1 ELSE 2 END,
    COALESCE(c.hora_fin, c.hora_inicio) DESC
```

#### Bug #2: Limitación Midnight-Crossing

**Ubicación:** Múltiples archivos con `CHECK (hora_inicio < hora_fin)`

**Problema:** Sistema rechaza citas que cruzan medianoche (ej: 23:30-01:30)

**Impacto:** Servicios 24/7 (veterinarias emergencia, hospitales) no funcionan

**Solución:** Ver [Fase 4: Soporte Citas Multi-Día](#fase-4-soporte-citas-multi-día-247)

### 4. Problema: Profesional sin Horarios

**Situación actual:** Se puede crear profesional sin configurar horarios

**Problema:** ¿Cómo puede un cliente agendar con un profesional sin horarios?

**Decisión:** Ver [Fase 3: Validación Profesional sin Horarios](#fase-3-validación-profesional-sin-horarios)

---

## ✅ DECISIONES ARQUITECTÓNICAS

### Decisión #1: ELIMINAR `horarios_disponibilidad`

**Justificación:**
- ✅ Sistema funciona perfectamente sin ella (481/482 tests pasan)
- ✅ Frontend no la usa
- ✅ Elimina ~1,500 líneas de código muerto
- ✅ Simplifica arquitectura (una sola fuente de verdad)
- ✅ Evita desincronización entre tablas

**Alternativa descartada:** Integrar completamente `horarios_disponibilidad`
- ❌ Requiere 3-5 días de desarrollo
- ❌ Mayor complejidad arquitectónica
- ❌ Feature "carrito temporal" no es prioritario
- ❌ Frontend no configuraba horarios en creación de profesional

### Decisión #2: Profesionales DEBEN tener horarios

**Opciones evaluadas:**

**Opción A:** Profesional inactivo hasta configurar horarios
- Crear con `activo = false`
- Activar automáticamente al guardar primer horario
- **Desventaja:** Estado intermedio, step adicional en frontend

**Opción B:** Crear profesional + horarios en transacción ⭐ **SELECCIONADA**
- Formulario con datos profesional + configuración horarios
- Backend crea AMBOS en transacción atómica
- **Ventaja:** Garantía atómica, no hay estados inconsistentes

**Opción C:** Validación dinámica en agendamiento
- Permitir crear sin horarios, error al intentar agendar
- **Desventaja:** Mala UX, profesionales "activos" que no lo están

### Decisión #3: Soportar Citas Multi-Día (24/7)

**Requerimiento:** Servicios 24/7 que cruzan medianoche

**Solución seleccionada:** Permitir `hora_fin < hora_inicio` (cruza medianoche)

**Ejemplo:**
```javascript
// Veterinaria de emergencia
fecha_cita: '2025-10-15',
hora_inicio: '23:30',
hora_fin: '01:30'  // Siguiente día
// Interpretación: termina 2025-10-16 01:30
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### FASE 1: Eliminar `horarios_disponibilidad` de SQL Schemas

**Prioridad:** Alta
**Complejidad:** Media
**Tiempo estimado:** 2-3 horas

#### Archivos SQL a ELIMINAR completo:

```bash
❌ sql/schema/14-trigger-capacidad-ocupada.sql (165 líneas)
   # Trigger sync_capacidad_ocupada_horario() solo para horarios_disponibilidad
```

#### Archivos SQL a MODIFICAR:

##### 1.1 `sql/schema/06-operations-tables.sql`

**Cambios:**

```diff
ELIMINAR líneas 18-150:
- -- ====================================================================
- -- ⏰ TABLA HORARIOS_DISPONIBILIDAD - SISTEMA INTELIGENTE...
- -- ====================================================================
- CREATE TABLE horarios_disponibilidad (
-     id SERIAL PRIMARY KEY,
-     organizacion_id INTEGER NOT NULL,
-     ...
- );

ELIMINAR de tabla citas (línea 174):
- horario_id INTEGER REFERENCES horarios_disponibilidad(id) ON DELETE SET NULL,

ELIMINAR líneas 279-288:
- ALTER TABLE horarios_disponibilidad
-     ADD CONSTRAINT fk_horarios_cita
-     FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE SET NULL;

ACTUALIZAR comentarios (líneas 8-10):
- -- • horarios_disponibilidad: Sistema inteligente...
- -- • citas: Sistema completo...
+ -- • citas: Sistema completo de gestión de citas

ELIMINAR línea 15:
- -- ⚠️ NOTA: horarios_disponibilidad se crea PRIMERO...
```

##### 1.2 `sql/schema/07-indexes.sql`

**Eliminar 9 índices completos:**

```sql
-- Buscar y eliminar estos CREATE INDEX:
DROP INDEX IF EXISTS idx_horarios_organizacion_fecha;
DROP INDEX IF EXISTS idx_horarios_profesional_agenda;
DROP INDEX IF EXISTS idx_horarios_disponibles_tiempo_real;
DROP INDEX IF EXISTS idx_horarios_reservas_expiradas;
DROP INDEX IF EXISTS idx_horarios_citas_link;
DROP INDEX IF EXISTS idx_horarios_servicio_especifico;
DROP INDEX IF EXISTS idx_horarios_recurrentes;
DROP INDEX IF EXISTS idx_horarios_pricing;
DROP INDEX IF EXISTS idx_horarios_search;

-- Eliminar comentarios asociados (línea 376):
- -- Uso: JOIN con horarios_disponibilidad, trigger sync_capacidad_ocupada
```

##### 1.3 `sql/schema/08-rls-policies.sql`

**Eliminar sección completa:**

```sql
-- Buscar y eliminar:
ALTER TABLE horarios_disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_disponibilidad FORCE ROW LEVEL SECURITY;

CREATE POLICY horarios_tenant_isolation ON horarios_disponibilidad
    FOR ALL TO saas_app
    USING (...);

CREATE POLICY horarios_system_bypass ON horarios_disponibilidad
    FOR ALL TO saas_app
    USING (...);

COMMENT ON POLICY horarios_tenant_isolation ON horarios_disponibilidad IS '...';

-- Actualizar comentario línea 17:
- -- • horarios_disponibilidad: Aislamiento por organización...
```

##### 1.4 `sql/schema/09-triggers.sql`

**Eliminar 3 triggers completos:**

```sql
-- Buscar y eliminar:
CREATE TRIGGER trigger_actualizar_timestamp_horarios
    BEFORE UPDATE ON horarios_disponibilidad
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_generico();

CREATE TRIGGER trigger_validar_coherencia_horario
    BEFORE INSERT OR UPDATE ON horarios_disponibilidad
    FOR EACH ROW EXECUTE FUNCTION validar_coherencia_horario_disponibilidad();

CREATE TRIGGER trigger_validar_reserva_futura_insert
    BEFORE INSERT ON horarios_disponibilidad
    FOR EACH ROW EXECUTE FUNCTION validar_reserva_futura();

-- Eliminar comentarios asociados
COMMENT ON TRIGGER trigger_actualizar_timestamp_horarios ON horarios_disponibilidad IS '...';
COMMENT ON TRIGGER trigger_validar_coherencia_horario ON horarios_disponibilidad IS '...';
COMMENT ON TRIGGER trigger_validar_reserva_futura_insert ON horarios_disponibilidad IS '...';
```

##### 1.5 `sql/schema/02-functions.sql`

**Eliminar función completa:**

```sql
-- Buscar y eliminar función limpiar_reservas_expiradas()
DROP FUNCTION IF EXISTS limpiar_reservas_expiradas();

-- Ubicación aproximada línea 633-680
CREATE OR REPLACE FUNCTION limpiar_reservas_expiradas()
RETURNS TABLE(...) AS $$
BEGIN
    UPDATE horarios_disponibilidad
    SET estado = 'disponible', ...
    WHERE reservado_hasta < NOW() ...;
    ...
END;
$$ LANGUAGE plpgsql;
```

##### 1.6 `sql/schema/16-mejoras-auditoria-2025-10.sql`

**Eliminar sección 1.5:**

```diff
ELIMINAR líneas ~79-85:
- -- 1.5 horarios_disponibilidad.organizacion_id
- ALTER TABLE horarios_disponibilidad
-     DROP CONSTRAINT IF EXISTS horarios_disponibilidad_organizacion_id_fkey CASCADE;
- ALTER TABLE horarios_disponibilidad
-     ADD CONSTRAINT horarios_disponibilidad_organizacion_id_fkey
-     FOREIGN KEY (organizacion_id) REFERENCES organizaciones(id) ON DELETE CASCADE;

ELIMINAR línea ~212:
- COMMENT ON POLICY horarios_tenant_isolation ON horarios_disponibilidad IS '...';
```

##### 1.7 `sql/README.md`

**Actualizar documentación:**

```diff
ACTUALIZAR conteo de tablas:
- Total de tablas: 17
+ Total de tablas: 16

ELIMINAR referencias:
- horarios_disponibilidad en lista de tablas operacionales
- Diagramas o ejemplos que la mencionen

ACTUALIZAR sección "Tablas Operacionales":
- horarios_disponibilidad, citas
+ citas
```

#### Tests SQL a LIMPIAR:

**Archivos con referencias (17 total):**

```bash
sql/tests/01-validacion-setup.sql           (2 referencias)
sql/tests/02-test-onboarding.sql            (2 referencias)
sql/tests/03-test-agendamiento.sql          (9 referencias)
sql/tests/04-test-seguridad-multitenant.sql (3 referencias)
sql/tests/05-test-performance.sql           (1 referencia)
```

**Estrategia:** Buscar todas las menciones de `horarios_disponibilidad` y:
- Si es SELECT/INSERT de prueba → Eliminar test completo
- Si es comentario/validación → Actualizar o eliminar
- Si es conteo de tablas → Actualizar número

---

### FASE 2: Eliminar Código Backend

**Prioridad:** Alta
**Complejidad:** Baja
**Tiempo estimado:** 1-2 horas

#### Archivos Backend a ELIMINAR completo:

```bash
❌ backend/app/database/horario.model.js (694 líneas)
❌ backend/app/services/horario.service.js (252 líneas)
❌ backend/app/controllers/horario.controller.js (149 líneas)
❌ backend/app/routes/api/v1/horarios.js
❌ backend/app/schemas/horario.schemas.js
❌ backend/app/utils/horarioHelpers.js (verificar si solo se usa aquí)
```

#### Archivos Backend a MODIFICAR:

##### 2.1 `backend/app/database/citas/cita.helpers.model.js`

**Eliminar método completo:**

```javascript
// ELIMINAR líneas 66-154
static async buscarHorarioCompatible(criterios, db) {
    // ... 88 líneas de código
    // Busca en horarios_disponibilidad
    // NUNCA se llama desde ningún lugar
}
```

##### 2.2 `backend/app/database/citas/index.js`

**Eliminar exportación:**

```javascript
// ELIMINAR
static async buscarHorarioCompatible(criterios, db) {
    return CitaHelpersModel.buscarHorarioCompatible(criterios, db);
}
```

##### 2.3 `backend/app/__tests__/helpers/db-helper.js`

**Verificar y eliminar si existe:**

```javascript
// Si existe, ELIMINAR
async function createTestHorarioDisponibilidad(client, profesionalId, datos = {}) {
    // ...
}
```

#### Tests Backend a ELIMINAR:

```bash
❌ backend/app/__tests__/endpoints/horarios.test.js
❌ backend/app/__tests__/concurrency/horarios-concurrency.test.js
❌ backend/app/__tests__/rbac/permissions.test.js (sección horarios si existe)
```

#### Actualizar Rutas Principales:

##### 2.4 `backend/app/routes/index.js` o archivo principal de rutas

**Eliminar importación y uso:**

```javascript
// ELIMINAR
const horariosRoutes = require('./api/v1/horarios');
app.use('/api/v1/horarios', horariosRoutes);
```

---

### FASE 3: Validación Profesional sin Horarios

**Prioridad:** Media
**Complejidad:** Media
**Tiempo estimado:** 3-4 horas (backend + schemas)

**Enfoque seleccionado:** Opción B - Crear profesional + horarios en transacción

#### 3.1 Schemas de Validación

**Crear:** `backend/app/schemas/horarioProfesional.schemas.js`

```javascript
const Joi = require('joi');
const { commonSchemas } = require('./common.schemas');

const horarioSemanalSchema = Joi.object({
    dia_semana: Joi.number().integer().min(0).max(6).required()
        .messages({
            'number.base': 'Día de semana debe ser un número',
            'number.min': 'Día de semana debe ser entre 0 (domingo) y 6 (sábado)',
            'number.max': 'Día de semana debe ser entre 0 (domingo) y 6 (sábado)',
            'any.required': 'Día de semana es obligatorio'
        }),
    hora_inicio: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
        .messages({
            'string.pattern.base': 'Hora inicio debe tener formato HH:MM (ej: 09:00)',
            'any.required': 'Hora inicio es obligatoria'
        }),
    hora_fin: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
        .messages({
            'string.pattern.base': 'Hora fin debe tener formato HH:MM (ej: 18:00)',
            'any.required': 'Hora fin es obligatoria'
        }),
    tipo_horario: Joi.string().valid('regular', 'break', 'almuerzo', 'premium').default('regular'),
    permite_citas: Joi.boolean().default(true),
    duracion_slot_minutos: Joi.number().integer().min(15).max(240).default(30),
    nombre_horario: Joi.string().max(50).optional(),
    activo: Joi.boolean().default(true)
});

const crearProfesionalConHorariosSchema = Joi.object({
    // Datos profesional
    nombre_completo: Joi.string().min(3).max(150).required(),
    email: Joi.string().email().allow(null).optional(),
    telefono: Joi.string().pattern(/^[+]?[0-9\s\-\(\)]{7,20}$/).allow(null).optional(),
    tipo_profesional: Joi.string().required(),
    especialidades: Joi.array().items(Joi.string()).default([]),
    color_calendario: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#3498db'),
    biografia: Joi.string().max(500).allow(null).optional(),

    // Horarios (OBLIGATORIO - al menos 1 día activo)
    horarios_semanales: Joi.array()
        .items(horarioSemanalSchema)
        .min(1)
        .required()
        .custom((value, helpers) => {
            // Validar que al menos 1 horario esté activo
            const activos = value.filter(h => h.activo !== false);
            if (activos.length === 0) {
                return helpers.error('any.invalid', {
                    message: 'Debe configurar al menos un día laboral activo'
                });
            }

            // Validar hora_fin > hora_inicio para cada horario
            for (const horario of value) {
                if (horario.hora_fin <= horario.hora_inicio) {
                    return helpers.error('any.invalid', {
                        message: `Horario inválido: hora fin debe ser mayor a hora inicio`
                    });
                }
            }

            return value;
        })
        .messages({
            'array.min': 'Debe configurar al menos un horario laboral',
            'any.required': 'La configuración de horarios es obligatoria'
        }),

    // Contexto organizacional
    organizacion_id: commonSchemas.organizacionId
});

module.exports = {
    horarioSemanalSchema,
    crearProfesionalConHorariosSchema
};
```

#### 3.2 Modelo de Horarios Profesionales

**Crear:** `backend/app/database/horarioProfesional.model.js`

```javascript
const { getDb } = require('../config/database');
const logger = require('../utils/logger');

class HorarioProfesionalModel {
    /**
     * Crear horario profesional
     */
    static async crear(datos, db) {
        const {
            profesional_id,
            organizacion_id,
            dia_semana,
            hora_inicio,
            hora_fin,
            tipo_horario = 'regular',
            permite_citas = true,
            duracion_slot_minutos = 30,
            nombre_horario = null,
            activo = true
        } = datos;

        const query = `
            INSERT INTO horarios_profesionales (
                profesional_id, organizacion_id, dia_semana,
                hora_inicio, hora_fin, tipo_horario, permite_citas,
                duracion_slot_minutos, nombre_horario, activo,
                creado_en, actualizado_en
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            RETURNING *
        `;

        const values = [
            profesional_id, organizacion_id, dia_semana,
            hora_inicio, hora_fin, tipo_horario, permite_citas,
            duracion_slot_minutos, nombre_horario, activo
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Obtener horarios de un profesional
     */
    static async obtenerPorProfesional(profesionalId, organizacionId) {
        const db = await getDb();
        try {
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            const query = `
                SELECT * FROM horarios_profesionales
                WHERE profesional_id = $1 AND activo = true
                ORDER BY dia_semana, hora_inicio
            `;

            const result = await db.query(query, [profesionalId]);
            return result.rows;
        } finally {
            db.release();
        }
    }
}

module.exports = HorarioProfesionalModel;
```

#### 3.3 Actualizar Modelo de Profesionales

**Modificar:** `backend/app/database/profesionales.model.js`

```javascript
// AGREGAR al método crear()
static async crear(datos, auditoria = {}, db = null) {
    const shouldCloseConnection = !db;
    if (!db) db = await getDb();

    try {
        await db.query('SELECT set_config($1, $2, false)',
            ['app.current_tenant_id', datos.organizacion_id.toString()]);

        // Si recibe horarios_semanales, NO inicia transacción aquí
        // La transacción se maneja en el controller

        const query = `
            INSERT INTO profesionales (
                organizacion_id, nombre_completo, email, telefono,
                tipo_profesional, especialidades, color_calendario,
                biografia, activo, creado_en
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            RETURNING *
        `;

        const values = [
            datos.organizacion_id,
            datos.nombre_completo,
            datos.email || null,
            datos.telefono || null,
            datos.tipo_profesional,
            datos.especialidades || [],
            datos.color_calendario || '#3498db',
            datos.biografia || null,
            true  // Activo por defecto (tiene horarios garantizados)
        ];

        const result = await db.query(query, values);
        const profesional = result.rows[0];

        logger.info('[ProfesionalModel.crear] Profesional creado', {
            profesional_id: profesional.id,
            organizacion_id: profesional.organizacion_id,
            nombre: profesional.nombre_completo
        });

        return profesional;
    } finally {
        if (shouldCloseConnection) {
            db.release();
        }
    }
}
```

#### 3.4 Actualizar Controller de Profesionales

**Modificar:** `backend/app/controllers/profesional.controller.js`

```javascript
const HorarioProfesionalModel = require('../database/horarioProfesional.model');

class ProfesionalController {
    static crear = asyncHandler(async (req, res) => {
        const { horarios_semanales, ...datosProfesional } = req.body;

        // Validar que vienen horarios
        if (!horarios_semanales || horarios_semanales.length === 0) {
            throw new Error('Debe configurar al menos un horario laboral para el profesional');
        }

        const organizacionId = req.tenant.organizacionId;
        datosProfesional.organizacion_id = organizacionId;

        const auditoria = {
            usuario_id: req.user.id,
            ip_origen: req.ip,
            user_agent: req.get('User-Agent')
        };

        // Transacción: Crear profesional + horarios
        const db = await getDb();
        try {
            await db.query('BEGIN');
            await db.query('SELECT set_config($1, $2, false)',
                ['app.current_tenant_id', organizacionId.toString()]);

            // 1. Crear profesional
            const profesional = await ProfesionalModel.crear(
                datosProfesional,
                auditoria,
                db
            );

            // 2. Crear horarios
            const horariosCreados = [];
            for (const horario of horarios_semanales) {
                // Solo crear horarios activos
                if (horario.activo !== false) {
                    const horarioCreado = await HorarioProfesionalModel.crear({
                        profesional_id: profesional.id,
                        organizacion_id: organizacionId,
                        ...horario
                    }, db);
                    horariosCreados.push(horarioCreado);
                }
            }

            await db.query('COMMIT');

            // Respuesta combinada
            const respuesta = {
                ...profesional,
                horarios_configurados: horariosCreados.length,
                horarios: horariosCreados
            };

            return ResponseHelper.success(
                res,
                respuesta,
                'Profesional creado exitosamente con sus horarios',
                201
            );

        } catch (error) {
            await db.query('ROLLBACK');
            logger.error('[ProfesionalController.crear] Error en transacción', {
                error: error.message,
                organizacion_id: organizacionId
            });
            throw error;
        } finally {
            db.release();
        }
    });
}
```

#### 3.5 Actualizar Schema de Profesionales

**Modificar:** `backend/app/schemas/profesional.schemas.js`

```javascript
const { crearProfesionalConHorariosSchema } = require('./horarioProfesional.schemas');

const profesionalSchemas = {
    // Importar y exponer el schema combinado
    crear: crearProfesionalConHorariosSchema,

    // Schemas existentes...
    actualizar: ...,
    obtener: ...,
};

module.exports = profesionalSchemas;
```

---

### FASE 4: Soporte Citas Multi-Día (24/7)

**Prioridad:** Media-Baja
**Complejidad:** Alta
**Tiempo estimado:** 4-6 horas

**Requerimiento:** Permitir servicios 24/7 que cruzan medianoche

#### 4.1 Modificar Constraints SQL

**Actualizar múltiples archivos:**

##### `sql/schema/06-operations-tables.sql`

```diff
-- Tabla citas (línea ~237)
- CONSTRAINT valid_horario
-     CHECK (hora_inicio < hora_fin),
+ CONSTRAINT valid_horario
+     CHECK (
+         -- Horario normal mismo día
+         hora_inicio < hora_fin
+         OR
+         -- Horario que cruza medianoche (servicios 24/7)
+         (hora_fin < hora_inicio AND hora_fin < '12:00'::time)
+     ),
+ CONSTRAINT valid_duracion_maxima
+     CHECK (
+         -- Duración máxima 12 horas para prevenir errores
+         CASE
+             WHEN hora_inicio < hora_fin THEN
+                 hora_fin - hora_inicio <= INTERVAL '12 hours'
+             ELSE
+                 (INTERVAL '24 hours' - (hora_inicio - hora_fin)) <= INTERVAL '12 hours'
+         END
+     ),
```

##### `sql/schema/11-horarios-profesionales.sql`

```diff
-- Tabla horarios_profesionales (línea ~102)
- CONSTRAINT valid_horario_base
-     CHECK (hora_inicio < hora_fin),
+ CONSTRAINT valid_horario_base
+     CHECK (
+         hora_inicio < hora_fin
+         OR
+         (hora_fin < hora_inicio AND hora_fin < '12:00'::time)
+     ),
```

#### 4.2 Actualizar Validación Backend

**Modificar:** `backend/app/database/citas/cita.helpers.model.js`

```javascript
// Actualizar método validarNoMidnightCrossing() (línea ~327)
static async validarNoMidnightCrossing(horaInicio, horaFin, opciones = {}) {
    const { permitirCruceMedianoche = false } = opciones;

    // Si se permite explícitamente, validar solo duración máxima
    if (permitirCruceMedianoche) {
        const duracionMinutos = this.calcularDuracionMinutos(horaInicio, horaFin);
        const DURACION_MAXIMA_MINUTOS = 12 * 60; // 12 horas

        if (duracionMinutos > DURACION_MAXIMA_MINUTOS) {
            throw new Error('Duración máxima permitida es 12 horas');
        }

        logger.info('[validarNoMidnightCrossing] Cita multi-día permitida', {
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            duracion_minutos: duracionMinutos
        });

        return true;
    }

    // Validación estándar (comportamiento actual)
    if (horaFin <= horaInicio) {
        throw new Error('Horario inválido: La cita no puede cruzar medianoche. Use permitirCruceMedianoche si es un servicio 24/7');
    }

    return true;
}

// Agregar helper para calcular duración con cruce de medianoche
static calcularDuracionMinutos(horaInicio, horaFin) {
    const [hi_h, hi_m] = horaInicio.split(':').map(Number);
    const [hf_h, hf_m] = horaFin.split(':').map(Number);

    const inicioMinutos = hi_h * 60 + hi_m;
    const finMinutos = hf_h * 60 + hf_m;

    if (finMinutos >= inicioMinutos) {
        // Mismo día
        return finMinutos - inicioMinutos;
    } else {
        // Cruza medianoche
        return (24 * 60 - inicioMinutos) + finMinutos;
    }
}
```

#### 4.3 Actualizar validarHorarioPermitido()

**Modificar:** `backend/app/database/citas/cita.helpers.model.js`

```javascript
// En validarHorarioPermitido() (línea ~378)
static async validarHorarioPermitido(profesionalId, fecha, horaInicio, horaFin, organizacionId, db, citaIdExcluir = null, opciones = {}) {
    const {
        esWalkIn = false,
        permitirFueraHorario = false,
        permitirCruceMedianoche = false  // NUEVA OPCIÓN
    } = opciones;

    // Validar formato y cruce de medianoche
    await this.validarNoMidnightCrossing(horaInicio, horaFin, {
        permitirCruceMedianoche
    });

    // ... resto de validaciones con lógica ajustada para multi-día

    // Al validar contra horarios_profesionales:
    const dentroDeFranja = horarios.rows.some(h => {
        if (permitirCruceMedianoche && horaFin < horaInicio) {
            // Lógica especial para citas que cruzan medianoche
            // Validar que el inicio cae en horario laboral
            return horaInicio >= h.hora_inicio && horaInicio < h.hora_fin;
        } else {
            // Lógica normal
            return horaInicio >= h.hora_inicio && horaFin <= h.hora_fin;
        }
    });

    // ... resto del método
}
```

#### 4.4 Actualizar Frontend (Nota para futuro)

**Componente a crear:** Checkbox "Servicio 24/7" en formulario de creación de citas

```jsx
// Ejemplo conceptual (NO implementar en este plan)
<Checkbox
    name="cruza_medianoche"
    label="Este servicio cruza medianoche (24/7)"
    onChange={(e) => {
        if (e.target.checked) {
            // Permitir hora_fin < hora_inicio
            setValidations({ ...validations, permitirCruceMedianoche: true });
        }
    }}
/>
```

---

### FASE 5: Corregir Bug Walk-In Queue

**Prioridad:** Alta
**Complejidad:** Baja
**Tiempo estimado:** 30 minutos

**Ubicación:** `backend/app/database/citas/cita.operacional.model.js:415`

#### 5.1 Fix del Query

```diff
// Línea ~410-425
const citaActual = await db.query(`
    SELECT
        c.id, c.estado, c.hora_inicio, c.hora_fin, c.hora_fin_real,
        cl.nombre AS cliente_nombre
    FROM citas c
    INNER JOIN clientes cl ON c.cliente_id = cl.id
-   WHERE c.estado = 'en_curso'
+   WHERE c.estado IN ('en_curso', 'confirmada')
      AND c.profesional_id = $1
      AND c.organizacion_id = $2
      AND c.fecha_cita = $3
      AND c.hora_fin_real IS NULL
+   ORDER BY
+       CASE WHEN c.estado = 'en_curso' THEN 1 ELSE 2 END,
+       COALESCE(c.hora_fin, c.hora_inicio) DESC
    LIMIT 1
`, [profesionalId, organizacionId, fechaHoy]);
```

#### 5.2 Tests a Actualizar

**Actualizar:** `backend/app/__tests__/e2e/agendamiento-manual-flow.test.js`

```javascript
// Test walk-in múltiples en cola
describe('Walk-in con cola de espera', () => {
    it('Debe gestionar 3 walk-ins correctamente', async () => {
        // Walk-in #1: va a 'en_curso'
        const walkin1 = await CitaModel.crearWalkIn({...});
        expect(walkin1.estado).toBe('en_curso');

        // Walk-in #2: va a 'confirmada' (cola)
        const walkin2 = await CitaModel.crearWalkIn({...});
        expect(walkin2.estado).toBe('confirmada');

        // Walk-in #3: va a 'confirmada' (cola) ✅ Ya no falla con 409
        const walkin3 = await CitaModel.crearWalkIn({...});
        expect(walkin3.estado).toBe('confirmada');

        // Validar orden de cola
        const cola = await CitaModel.obtenerColaProfesional(...);
        expect(cola).toHaveLength(2);
        expect(cola[0].id).toBe(walkin2.id);
        expect(cola[1].id).toBe(walkin3.id);
    });
});
```

---

## ✅ CHECKLIST DE EJECUCIÓN

### Pre-requisitos

- [ ] Backup completo de base de datos
- [ ] Backup de carpeta `backend/`
- [ ] Git commit de estado actual
- [ ] Tests pasando: Ejecutar `npm test` → Confirmar 481/482

### Fase 1: SQL Schemas (2-3 horas)

- [ ] Eliminar archivo completo: `sql/schema/14-trigger-capacidad-ocupada.sql`
- [ ] Modificar `sql/schema/06-operations-tables.sql`
  - [ ] Eliminar tabla `horarios_disponibilidad` (líneas 18-150)
  - [ ] Eliminar columna `horario_id` de tabla `citas`
  - [ ] Eliminar ALTER TABLE con FK circular
  - [ ] Actualizar comentarios
- [ ] Modificar `sql/schema/07-indexes.sql`
  - [ ] Eliminar 9 índices de horarios_disponibilidad
  - [ ] Limpiar comentarios
- [ ] Modificar `sql/schema/08-rls-policies.sql`
  - [ ] Eliminar 2 políticas RLS
  - [ ] Eliminar ALTER TABLE statements
  - [ ] Actualizar comentarios
- [ ] Modificar `sql/schema/09-triggers.sql`
  - [ ] Eliminar 3 triggers
  - [ ] Eliminar comentarios de triggers
- [ ] Modificar `sql/schema/02-functions.sql`
  - [ ] Eliminar función `limpiar_reservas_expiradas()`
- [ ] Modificar `sql/schema/16-mejoras-auditoria-2025-10.sql`
  - [ ] Eliminar sección 1.5
  - [ ] Eliminar comentario de política
- [ ] Actualizar `sql/README.md`
  - [ ] Cambiar conteo de tablas: 17 → 16
  - [ ] Eliminar referencias a horarios_disponibilidad
- [ ] Limpiar tests SQL (5 archivos)
  - [ ] `01-validacion-setup.sql`
  - [ ] `02-test-onboarding.sql`
  - [ ] `03-test-agendamiento.sql`
  - [ ] `04-test-seguridad-multitenant.sql`
  - [ ] `05-test-performance.sql`

### Fase 2: Backend (1-2 horas)

- [ ] Eliminar archivos completos:
  - [ ] `backend/app/database/horario.model.js`
  - [ ] `backend/app/services/horario.service.js`
  - [ ] `backend/app/controllers/horario.controller.js`
  - [ ] `backend/app/routes/api/v1/horarios.js`
  - [ ] `backend/app/schemas/horario.schemas.js`
  - [ ] `backend/app/utils/horarioHelpers.js` (si aplica)
- [ ] Modificar `backend/app/database/citas/cita.helpers.model.js`
  - [ ] Eliminar método `buscarHorarioCompatible()` (líneas 66-154)
- [ ] Modificar `backend/app/database/citas/index.js`
  - [ ] Eliminar exportación de `buscarHorarioCompatible()`
- [ ] Modificar `backend/app/__tests__/helpers/db-helper.js`
  - [ ] Eliminar helpers relacionados si existen
- [ ] Eliminar tests:
  - [ ] `backend/app/__tests__/endpoints/horarios.test.js`
  - [ ] `backend/app/__tests__/concurrency/horarios-concurrency.test.js`
- [ ] Modificar `backend/app/routes/index.js`
  - [ ] Eliminar importación y uso de rutas horarios

### Fase 3: Validación Profesional (3-4 horas)

- [ ] Crear `backend/app/schemas/horarioProfesional.schemas.js`
  - [ ] Schema `horarioSemanalSchema`
  - [ ] Schema `crearProfesionalConHorariosSchema`
- [ ] Crear `backend/app/database/horarioProfesional.model.js`
  - [ ] Método `crear()`
  - [ ] Método `obtenerPorProfesional()`
- [ ] Modificar `backend/app/database/profesionales.model.js`
  - [ ] Actualizar método `crear()` para soportar transacciones
- [ ] Modificar `backend/app/controllers/profesional.controller.js`
  - [ ] Actualizar método `crear()` con transacción
  - [ ] Crear profesional + horarios atómicamente
- [ ] Modificar `backend/app/schemas/profesional.schemas.js`
  - [ ] Importar y usar `crearProfesionalConHorariosSchema`

### Fase 4: Citas Multi-Día (4-6 horas) - OPCIONAL

- [ ] Modificar constraints SQL
  - [ ] `sql/schema/06-operations-tables.sql` tabla `citas`
  - [ ] `sql/schema/11-horarios-profesionales.sql`
- [ ] Modificar `backend/app/database/citas/cita.helpers.model.js`
  - [ ] Actualizar `validarNoMidnightCrossing()`
  - [ ] Agregar `calcularDuracionMinutos()`
  - [ ] Actualizar `validarHorarioPermitido()` con lógica multi-día
- [ ] Crear tests para citas multi-día
  - [ ] Test: Cita 23:30-01:30 exitosa
  - [ ] Test: Rechazo si duración > 12 horas
  - [ ] Test: Validación contra horarios profesionales

### Fase 5: Fix Walk-In Bug (30 min)

- [ ] Modificar `backend/app/database/citas/cita.operacional.model.js:415`
  - [ ] Actualizar query para buscar `IN ('en_curso', 'confirmada')`
  - [ ] Agregar ORDER BY con prioridad
- [ ] Actualizar tests walk-in
  - [ ] Test: 3 walk-ins en cola funcionan correctamente

### Post-Implementación

- [ ] Recrear base de datos desde cero
  - [ ] `docker-compose down -v`
  - [ ] Eliminar volúmenes Docker
  - [ ] `docker-compose up -d`
  - [ ] Validar que levanta sin errores
- [ ] Ejecutar tests completos
  - [ ] `docker exec back npm test`
  - [ ] Objetivo: 482/482 o mejor
- [ ] Ejecutar tests SQL
  - [ ] `./sql/tests/run-all-tests.sh`
  - [ ] Objetivo: 5/5 pasando
- [ ] Validación manual
  - [ ] Crear profesional con horarios via API
  - [ ] Crear cita estándar
  - [ ] Crear walk-in múltiples
  - [ ] Validar error profesional sin horarios

---

## 🔍 VALIDACIÓN POST-IMPLEMENTACIÓN

### Tests Automatizados

```bash
# 1. Tests Backend
docker exec back npm test
# Objetivo: 482/482 o superior (corregimos 1 bug)

# 2. Tests SQL
cd sql/tests
./run-all-tests.sh
# Objetivo: 5/5 pasando

# 3. Validar no hay referencias huérfanas
grep -r "horarios_disponibilidad" backend/ sql/
# Resultado esperado: Sin coincidencias
```

### Tests Manuales via Bruno/Postman

#### Test 1: Crear Profesional sin Horarios (Debe FALLAR)

```http
POST /api/v1/profesionales
{
    "nombre_completo": "Juan Pérez",
    "tipo_profesional": "barbero"
    // Sin horarios_semanales
}

Resultado esperado: 400 Bad Request
{
    "error": "La configuración de horarios es obligatoria"
}
```

#### Test 2: Crear Profesional con Horarios (Debe FUNCIONAR)

```http
POST /api/v1/profesionales
{
    "nombre_completo": "Juan Pérez",
    "tipo_profesional": "barbero",
    "email": "juan@example.com",
    "horarios_semanales": [
        {
            "dia_semana": 1,
            "hora_inicio": "09:00",
            "hora_fin": "18:00",
            "tipo_horario": "regular",
            "activo": true
        },
        {
            "dia_semana": 2,
            "hora_inicio": "09:00",
            "hora_fin": "18:00",
            "tipo_horario": "regular",
            "activo": true
        }
    ]
}

Resultado esperado: 201 Created
{
    "id": 1,
    "nombre_completo": "Juan Pérez",
    "activo": true,
    "horarios_configurados": 2,
    "horarios": [...]
}
```

#### Test 3: Crear Cita Estándar

```http
POST /api/v1/citas
{
    "cliente_id": 1,
    "profesional_id": 1,
    "servicio_id": 1,
    "fecha_cita": "2025-10-20",
    "hora_inicio": "10:00",
    "hora_fin": "11:00"
}

Resultado esperado: 201 Created
```

#### Test 4: Walk-In Múltiples (3 en cola)

```http
# Walk-in #1
POST /api/v1/citas/walk-in
{
    "profesional_id": 1,
    "servicio_id": 1,
    "cliente_nuevo": {
        "nombre": "Cliente 1",
        "telefono": "555-0001"
    }
}
# Esperado: estado = "en_curso"

# Walk-in #2
POST /api/v1/citas/walk-in
{
    "profesional_id": 1,
    "servicio_id": 1,
    "cliente_nuevo": {
        "nombre": "Cliente 2",
        "telefono": "555-0002"
    }
}
# Esperado: estado = "confirmada" (en cola)

# Walk-in #3
POST /api/v1/citas/walk-in
{
    "profesional_id": 1,
    "servicio_id": 1,
    "cliente_nuevo": {
        "nombre": "Cliente 3",
        "telefono": "555-0003"
    }
}
# Esperado: estado = "confirmada" (en cola)
# ✅ Ya NO debe dar ERROR 409
```

#### Test 5: Cita Multi-Día (Si implementaste Fase 4)

```http
POST /api/v1/citas
{
    "cliente_id": 1,
    "profesional_id": 1,
    "servicio_id": 1,
    "fecha_cita": "2025-10-20",
    "hora_inicio": "23:30",
    "hora_fin": "01:30",
    "permitir_cruce_medianoche": true
}

Resultado esperado: 201 Created
```

### Validaciones de Base de Datos

```sql
-- 1. Verificar que tabla horarios_disponibilidad NO existe
\dt horarios_disponibilidad
-- Resultado esperado: "Did not find any relation named..."

-- 2. Verificar que horarios_profesionales existe
\dt horarios_profesionales
-- Resultado esperado: Tabla existe

-- 3. Verificar que NO hay columna horario_id en citas
\d citas
-- Resultado esperado: NO debe aparecer "horario_id"

-- 4. Contar tablas totales
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Resultado esperado: 16 (no 17)

-- 5. Verificar profesional tiene horarios
SELECT p.nombre_completo, COUNT(hp.id) as horarios_count
FROM profesionales p
LEFT JOIN horarios_profesionales hp ON p.id = hp.profesional_id
GROUP BY p.id, p.nombre_completo;
-- Resultado esperado: Todos los profesionales tienen horarios_count > 0
```

---

## 📊 MÉTRICAS DE ÉXITO

### Código Eliminado

- ✅ **~1,500 líneas** de código backend eliminadas
- ✅ **1 tabla SQL completa** eliminada
- ✅ **9 índices** eliminados
- ✅ **3 triggers** eliminados
- ✅ **2 políticas RLS** eliminadas
- ✅ **1 función PL/pgSQL** eliminada

### Arquitectura Simplificada

- ✅ De **2 tablas de horarios** → **1 tabla única**
- ✅ De **2 fuentes de verdad** → **1 fuente de verdad**
- ✅ **0 código muerto** (eliminado todo)

### Funcionalidad Mejorada

- ✅ Profesionales **SIEMPRE tienen horarios** (garantizado)
- ✅ Walk-in **cola funciona correctamente** (bug corregido)
- ✅ Soporte **citas multi-día 24/7** (si se implementa Fase 4)

### Tests

- ✅ Backend: **482/482** (meta, +1 por bug corregido)
- ✅ SQL: **5/5** pasando
- ✅ **0 tests fallando** por eliminación de horarios_disponibilidad

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo #1: Pérdida de datos en producción

**Mitigación:**
- ✅ Backup completo antes de empezar
- ✅ Este es un sistema nuevo sin producción activa
- ✅ Recreación desde cero de BD (no migración)

### Riesgo #2: Tests dejan de funcionar

**Mitigación:**
- ✅ Ejecutar tests después de cada fase
- ✅ Git commit entre fases para rollback fácil
- ✅ Validación manual post-implementación

### Riesgo #3: Frontend rompe por cambios en API

**Mitigación:**
- ✅ Frontend actual NO usa `horarios_disponibilidad`
- ✅ Único cambio: Crear profesional ahora requiere `horarios_semanales`
- ✅ Error claro si falta: "La configuración de horarios es obligatoria"

### Riesgo #4: Queries lentos sin índices de horarios_disponibilidad

**Mitigación:**
- ✅ Sistema actual NO usa esos índices (tabla huérfana)
- ✅ `validarHorarioPermitido()` usa índices de `horarios_profesionales`
- ✅ Performance actual se mantiene

---

## 📚 REFERENCIAS

### Archivos Clave

```
SQL:
- sql/schema/06-operations-tables.sql (tabla citas)
- sql/schema/11-horarios-profesionales.sql (plantillas semanales)
- sql/schema/14-trigger-capacidad-ocupada.sql (ELIMINAR)

Backend:
- backend/app/database/citas/cita.helpers.model.js (validaciones)
- backend/app/database/citas/cita.operacional.model.js (walk-in)
- backend/app/database/profesionales.model.js (CRUD profesionales)
- backend/app/controllers/profesional.controller.js (API)

Tests:
- backend/app/__tests__/e2e/agendamiento-manual-flow.test.js
- backend/app/__tests__/endpoints/citas.test.js
```

### Comandos Útiles

```bash
# Buscar referencias a horarios_disponibilidad
grep -r "horarios_disponibilidad" backend/ sql/

# Recrear base de datos desde cero
docker-compose down -v
docker-compose up -d

# Ejecutar tests backend
docker exec back npm test

# Ejecutar tests SQL
cd sql/tests && ./run-all-tests.sh

# Ver logs de base de datos
docker logs -f postgres_db

# Conectar a PostgreSQL
docker exec postgres_db psql -U admin -d postgres
```

---

## ✅ PRÓXIMOS PASOS

### Sesión de Implementación

1. **Revisar este documento completo**
2. **Hacer backup de todo**
3. **Crear branch Git:** `git checkout -b refactor/eliminar-horarios-disponibilidad`
4. **Ejecutar Fase 1 completa** (SQL schemas)
5. **Commit:** `git commit -m "Fase 1: Eliminar horarios_disponibilidad de SQL schemas"`
6. **Recrear BD y validar**
7. **Ejecutar Fase 2 completa** (Backend)
8. **Commit:** `git commit -m "Fase 2: Eliminar código backend horarios_disponibilidad"`
9. **Ejecutar tests:** `npm test`
10. **Continuar con Fases 3, 4, 5**
11. **Validación completa**
12. **Merge a main**

### Después de Implementación

- [ ] Actualizar `CLAUDE.md` con nueva arquitectura
- [ ] Actualizar documentación de API
- [ ] Actualizar `sql/README.md` con cambios
- [ ] Crear PR con descripción detallada

---

**FIN DEL PLAN DE REFACTORIZACIÓN**

**Autor:** Sistema de Análisis
**Fecha:** 11 Octubre 2025
**Versión:** 1.0
**Estado:** ✅ Listo para implementación
