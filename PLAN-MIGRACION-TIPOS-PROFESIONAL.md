# Plan de Migración: tipo_profesional (ENUM → Tabla de Catálogo)

**Versión**: 1.0
**Fecha**: 21 Octubre 2025
**Basado en**: Migración exitosa de tipo_bloqueo
**Estrategia**: ⚡ **Reinicio desde cero** (sin migración de datos)

---

## ⚡ Estrategia de Migración

**⚠️ IMPORTANTE**: Este proyecto usa un enfoque de "reinicio desde cero":

1. **No hay backups**: La base de datos se reconstruye completamente desde scripts SQL
2. **No hay migración de datos**: Se modifican los archivos SQL existentes en `sql/schema/`
3. **Proceso**:
   ```bash
   npm run stop                              # Detener contenedores
   docker volume rm n8nautomatizaciones_postgres_data  # Eliminar BD
   npm run start                             # Levantar desde cero
   ```
4. **Ventaja**: Cambios limpios sin necesidad de scripts de migración complejos
5. **Requisito**: Todos los cambios deben estar en los archivos SQL base

### Archivos SQL a Modificar:

| Archivo | Propósito | Cambios |
|---------|-----------|---------|
| `04-catalog-tables.sql` | Tablas de catálogo | Agregar `tipos_profesional` + seed de 33 tipos |
| `05-business-tables.sql` | Tablas de negocio | Cambiar `tipo_profesional` ENUM a `tipo_profesional_id` FK |
| `01-types-and-enums.sql` | ENUMs del sistema | (Opcional) Comentar ENUM `tipo_profesional` |

---

## 🎯 Objetivo

Migrar `tipo_profesional` de ENUM estático a tabla de catálogo dinámica con:
- ✅ Tipos de sistema predefinidos (no modificables)
- ✅ Tipos personalizados por organización
- ✅ Compatibilidad con `tipo_industria` de la organización
- ✅ UI amigable (select en lugar de input manual)
- ✅ Sin pérdida de datos existentes

---

## 📊 Estado Actual

### ENUM actual: `tipo_profesional`

**33 valores actuales**:
```sql
-- Barbería
'barbero', 'estilista_masculino'

-- Salón de belleza
'estilista', 'colorista', 'manicurista', 'peinados_eventos'

-- Estética y cosmetología
'esteticista', 'cosmetologo', 'depilacion_laser'

-- Spa y terapias
'masajista', 'terapeuta_spa', 'aromaterapeuta', 'reflexologo'

-- Podología
'podologo', 'asistente_podologia'

-- Consultorio médico
'doctor_general', 'enfermero', 'recepcionista_medica'

-- Academia
'instructor', 'profesor', 'tutor'

-- Taller técnico
'tecnico_auto', 'tecnico_electronico', 'mecanico', 'soldador'

-- Centro fitness
'entrenador_personal', 'instructor_yoga', 'instructor_pilates', 'nutricionista'

-- Veterinaria
'veterinario', 'asistente_veterinario', 'groomer'

-- Genérico
'otro'
```

### Industrias (ENUM `industria_tipo`):
```sql
'academia', 'barberia', 'centro_fitness', 'consultorio_medico',
'estetica', 'otro', 'podologia', 'salon_belleza', 'spa',
'taller_tecnico', 'veterinaria'
```

### Tabla actual:
```sql
-- profesionales
tipo_profesional tipo_profesional NOT NULL
```

### Problema actual detectado:
❌ **Durante testing**: Al crear profesional con `tipo_profesional="doctor_general"` en organización con `tipo_industria="barberia"` → Error no user-friendly
❌ **UX malo**: No es un select, usuario debe adivinar qué valores son válidos
❌ **Sin validación de compatibilidad**: No hay validación automática de tipo_profesional vs tipo_industria

---

## 🏗 Estructura Nueva Tabla

**⚠️ IMPORTANTE**: No crear archivos nuevos. Modificar archivos SQL existentes en `sql/schema/`.

El sistema se reinicia desde cero ejecutando todos los scripts SQL en orden.

### Archivos a Modificar:

1. **`04-catalog-tables.sql`**: Agregar tabla `tipos_profesional` + seed (33 tipos)
2. **`05-business-tables.sql`**: Cambiar `tipo_profesional` ENUM a `tipo_profesional_id` FK
3. **`01-types-and-enums.sql`**: Eventualmente eliminar ENUM `tipo_profesional`

---

### SQL Schema (agregar a `04-catalog-tables.sql`):

```sql
-- ====================================================================
-- 🎨 TABLA TIPOS_PROFESIONAL - CATÁLOGO DINÁMICO DE TIPOS DE PROFESIONAL
-- ====================================================================
-- Reemplaza el ENUM tipo_profesional por un sistema flexible con índice
-- incremental que permite tipos del sistema + tipos personalizados.
--
-- 🎯 CASOS DE USO:
-- • Tipos globales del sistema (organizacion_id IS NULL)
-- • Tipos personalizados por organización (organizacion_id NOT NULL)
-- • Validación de compatibilidad con industrias
-- • Soft delete para preservar históricos
--
-- 🔄 RELACIÓN: Usado por profesionales.tipo_profesional_id
-- ====================================================================

CREATE TABLE tipos_profesional (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Clasificación
    categoria VARCHAR(50),  -- barberia, salon_belleza, spa, medico, fitness, etc.
    industrias_compatibles TEXT[], -- Array de industrias compatibles

    -- Características
    requiere_licencia BOOLEAN DEFAULT false,
    nivel_experiencia_minimo INTEGER DEFAULT 0, -- años

    -- Sistema y personalización
    es_sistema BOOLEAN DEFAULT false,
    icono VARCHAR(50),
    color VARCHAR(7), -- HEX color para UI

    -- Configuración
    metadata JSONB DEFAULT '{}',

    -- Control
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT tipos_profesional_codigo_unico UNIQUE (codigo, organizacion_id),
    CONSTRAINT tipos_profesional_codigo_valido CHECK (codigo ~ '^[a-z_]+$'),
    CONSTRAINT tipos_profesional_categoria_valida CHECK (
        categoria IN (
            'barberia', 'salon_belleza', 'estetica', 'spa',
            'podologia', 'medico', 'academia', 'taller_tecnico',
            'fitness', 'veterinaria', 'otro'
        )
    )
);

-- Índices
CREATE INDEX idx_tipos_profesional_organizacion ON tipos_profesional(organizacion_id) WHERE activo = true;
CREATE INDEX idx_tipos_profesional_sistema ON tipos_profesional(es_sistema) WHERE es_sistema = true;
CREATE INDEX idx_tipos_profesional_categoria ON tipos_profesional(categoria, activo) WHERE activo = true;
CREATE INDEX idx_tipos_profesional_industrias ON tipos_profesional USING GIN (industrias_compatibles);

-- Trigger para actualizar timestamp
CREATE TRIGGER trigger_actualizar_tipos_profesional
    BEFORE UPDATE ON tipos_profesional
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Comentarios
COMMENT ON TABLE tipos_profesional IS 'Catálogo de tipos de profesional (sistema + personalizados por organización)';
COMMENT ON COLUMN tipos_profesional.organizacion_id IS 'NULL = tipo de sistema, NOT NULL = tipo personalizado';
COMMENT ON COLUMN tipos_profesional.es_sistema IS 'true = no modificable, false = personalizado por org';
COMMENT ON COLUMN tipos_profesional.industrias_compatibles IS 'Array de industrias donde este tipo es aplicable';
```

---

## 📦 Datos Iniciales (Seed)

**Agregar al final de `04-catalog-tables.sql`** (después de triggers):

```sql
-- ====================================================================
-- 📊 INSERTAR TIPOS DEL SISTEMA (33 tipos base)
-- ====================================================================

-- Tipos de sistema (organizacion_id = NULL)
INSERT INTO tipos_profesional (
    organizacion_id, codigo, nombre, descripcion, categoria,
    industrias_compatibles, requiere_licencia, es_sistema, icono, color
) VALUES
-- BARBERÍA
(NULL, 'barbero', 'Barbero', 'Especialista en cortes y arreglo de cabello masculino', 'barberia',
 ARRAY['barberia'], false, true, 'Scissors', '#8B4513'),
(NULL, 'estilista_masculino', 'Estilista Masculino', 'Estilista especializado en cortes y estilos masculinos', 'barberia',
 ARRAY['barberia', 'salon_belleza'], false, true, 'Scissors', '#A0522D'),

-- SALÓN DE BELLEZA
(NULL, 'estilista', 'Estilista', 'Profesional en cortes, peinados y tratamientos capilares', 'salon_belleza',
 ARRAY['salon_belleza'], false, true, 'Scissors', '#FF69B4'),
(NULL, 'colorista', 'Colorista', 'Especialista en coloración y tratamientos de color', 'salon_belleza',
 ARRAY['salon_belleza'], false, true, 'Palette', '#9370DB'),
(NULL, 'manicurista', 'Manicurista', 'Especialista en cuidado de manos y uñas', 'salon_belleza',
 ARRAY['salon_belleza', 'estetica'], false, true, 'Hand', '#FF1493'),
(NULL, 'peinados_eventos', 'Peinados para Eventos', 'Especialista en peinados para bodas y eventos', 'salon_belleza',
 ARRAY['salon_belleza'], false, true, 'Crown', '#DA70D6'),

-- ESTÉTICA Y COSMETOLOGÍA
(NULL, 'esteticista', 'Esteticista', 'Profesional en tratamientos faciales y corporales', 'estetica',
 ARRAY['estetica', 'spa'], false, true, 'Sparkles', '#FFB6C1'),
(NULL, 'cosmetologo', 'Cosmetólogo', 'Especialista en cosmetología y tratamientos de piel', 'estetica',
 ARRAY['estetica'], true, true, 'Beaker', '#FF69B4'),
(NULL, 'depilacion_laser', 'Depilación Láser', 'Técnico en depilación láser', 'estetica',
 ARRAY['estetica'], true, true, 'Zap', '#FF1493'),

-- SPA Y TERAPIAS
(NULL, 'masajista', 'Masajista', 'Terapeuta de masajes y relajación', 'spa',
 ARRAY['spa', 'estetica'], false, true, 'Hand', '#87CEEB'),
(NULL, 'terapeuta_spa', 'Terapeuta de Spa', 'Profesional en tratamientos de spa', 'spa',
 ARRAY['spa'], false, true, 'Flower', '#B0E0E6'),
(NULL, 'aromaterapeuta', 'Aromaterapeuta', 'Especialista en terapias con aceites esenciales', 'spa',
 ARRAY['spa'], false, true, 'Leaf', '#98FB98'),
(NULL, 'reflexologo', 'Reflexólogo', 'Terapeuta de reflexología', 'spa',
 ARRAY['spa'], false, true, 'Footprints', '#90EE90'),

-- PODOLOGÍA
(NULL, 'podologo', 'Podólogo', 'Especialista en cuidado de pies', 'podologia',
 ARRAY['podologia'], true, true, 'Footprints', '#4682B4'),
(NULL, 'asistente_podologia', 'Asistente de Podología', 'Asistente en tratamientos podológicos', 'podologia',
 ARRAY['podologia'], false, true, 'Users', '#5F9EA0'),

-- CONSULTORIO MÉDICO
(NULL, 'doctor_general', 'Doctor General', 'Médico general', 'medico',
 ARRAY['consultorio_medico'], true, true, 'Stethoscope', '#DC143C'),
(NULL, 'enfermero', 'Enfermero', 'Profesional de enfermería', 'medico',
 ARRAY['consultorio_medico'], true, true, 'HeartPulse', '#FF6347'),
(NULL, 'recepcionista_medica', 'Recepcionista Médica', 'Recepcionista en consultorios médicos', 'medico',
 ARRAY['consultorio_medico'], false, true, 'Users', '#FFA07A'),

-- ACADEMIA
(NULL, 'instructor', 'Instructor', 'Instructor de cursos', 'academia',
 ARRAY['academia'], false, true, 'GraduationCap', '#4169E1'),
(NULL, 'profesor', 'Profesor', 'Profesor de materias', 'academia',
 ARRAY['academia'], false, true, 'Book', '#1E90FF'),
(NULL, 'tutor', 'Tutor', 'Tutor personalizado', 'academia',
 ARRAY['academia'], false, true, 'Users', '#87CEEB'),

-- TALLER TÉCNICO
(NULL, 'tecnico_auto', 'Técnico Automotriz', 'Mecánico de vehículos', 'taller_tecnico',
 ARRAY['taller_tecnico'], false, true, 'Wrench', '#696969'),
(NULL, 'tecnico_electronico', 'Técnico Electrónico', 'Técnico en electrónica', 'taller_tecnico',
 ARRAY['taller_tecnico'], false, true, 'Cpu', '#808080'),
(NULL, 'mecanico', 'Mecánico', 'Mecánico general', 'taller_tecnico',
 ARRAY['taller_tecnico'], false, true, 'Settings', '#A9A9A9'),
(NULL, 'soldador', 'Soldador', 'Técnico en soldadura', 'taller_tecnico',
 ARRAY['taller_tecnico'], false, true, 'Flame', '#C0C0C0'),

-- CENTRO FITNESS
(NULL, 'entrenador_personal', 'Entrenador Personal', 'Entrenador deportivo personalizado', 'fitness',
 ARRAY['centro_fitness'], false, true, 'Dumbbell', '#FF8C00'),
(NULL, 'instructor_yoga', 'Instructor de Yoga', 'Instructor de yoga y meditación', 'fitness',
 ARRAY['centro_fitness'], false, true, 'User', '#32CD32'),
(NULL, 'instructor_pilates', 'Instructor de Pilates', 'Instructor de pilates', 'fitness',
 ARRAY['centro_fitness'], false, true, 'Activity', '#00CED1'),
(NULL, 'nutricionista', 'Nutricionista', 'Especialista en nutrición', 'fitness',
 ARRAY['centro_fitness', 'consultorio_medico'], true, true, 'Apple', '#228B22'),

-- VETERINARIA
(NULL, 'veterinario', 'Veterinario', 'Médico veterinario', 'veterinaria',
 ARRAY['veterinaria'], true, true, 'Heart', '#8B0000'),
(NULL, 'asistente_veterinario', 'Asistente Veterinario', 'Asistente en medicina veterinaria', 'veterinaria',
 ARRAY['veterinaria'], false, true, 'Users', '#DC143C'),
(NULL, 'groomer', 'Groomer', 'Estilista canino', 'veterinaria',
 ARRAY['veterinaria'], false, true, 'Scissors', '#FF1493'),

-- GENÉRICO
(NULL, 'otro', 'Otro', 'Tipo de profesional genérico', 'otro',
 ARRAY['otro', 'academia', 'barberia', 'centro_fitness', 'consultorio_medico', 'estetica', 'podologia', 'salon_belleza', 'spa', 'taller_tecnico', 'veterinaria'],
 false, true, 'User', '#808080')
ON CONFLICT (codigo, organizacion_id) DO NOTHING;
```

---

## 🔄 Pasos de Migración

**⚠️ ESTRATEGIA**: El sistema se reinicia desde cero. No hay migración de datos existentes.

Los scripts SQL se ejecutan en orden al levantar los contenedores:
```bash
npm run start  # docker compose up -d
```

### PASO 1: Modificar `04-catalog-tables.sql`

Agregar al final del archivo:
- Tabla `tipos_profesional` (estructura completa)
- Constraints e índices
- RLS policies
- Triggers de protección
- **Seed de 33 tipos del sistema** (INSERT)

### PASO 2: Modificar `05-business-tables.sql`

**En la tabla `profesionales`** (línea ~50):
```sql
-- ANTES:
tipo_profesional tipo_profesional NOT NULL,

-- DESPUÉS:
tipo_profesional_id INTEGER NOT NULL REFERENCES tipos_profesional(id),
```

**En la tabla `servicios`** (línea ~232):
```sql
-- ANTES:
tipos_profesional_autorizados tipo_profesional[] DEFAULT NULL,

-- DESPUÉS:
tipos_profesional_autorizados INTEGER[] DEFAULT NULL,  -- IDs de tipos_profesional
```

### PASO 3: (Opcional) Modificar `01-types-and-enums.sql`

Comentar o eliminar el ENUM `tipo_profesional`:
```sql
-- CREATE TYPE tipo_profesional AS ENUM (
--     'barbero', 'estilista', ...
-- );
```

**Nota**: Se puede dejar el ENUM por compatibilidad temporal. Eventualmente se eliminará cuando todo el código use la FK.

### PASO 4: Reiniciar el sistema

```bash
# Detener contenedores
npm run stop

# Eliminar volúmenes (borra la BD)
docker volume rm n8nautomatizaciones_postgres_data

# Levantar desde cero
npm run start

# Verificar que se crearon los tipos
docker exec postgres_db psql -U admin -d postgres -c "SELECT COUNT(*) FROM tipos_profesional WHERE es_sistema = true;"
# Expected: 33
```

---

## 💻 Actualización de Código Backend

### 1. Crear TiposProfesionalController

```javascript
// backend/app/controllers/TiposProfesionalController.js

const TiposProfesionalModel = require('../database/tipos-profesional.model');
const { ResponseHelper } = require('../utils/helpers');
const { asyncHandler } = require('../middleware');

class TiposProfesionalController {

    /**
     * GET /api/v1/tipos-profesional
     * Listar tipos de profesional (sistema + personalizados)
     */
    static listar = asyncHandler(async (req, res) => {
        const filtros = {
            organizacion_id: req.tenant.organizacionId,
            solo_sistema: req.query.solo_sistema === 'true',
            solo_personalizados: req.query.solo_personalizados === 'true',
            tipo_industria: req.query.tipo_industria || null, // Filtrar por industria compatible
            activo: req.query.activo !== 'false'
        };

        const resultado = await TiposProfesionalModel.listar(filtros);
        return ResponseHelper.success(res, resultado);
    });

    /**
     * GET /api/v1/tipos-profesional/:id
     * Obtener un tipo por ID
     */
    static obtener = asyncHandler(async (req, res) => {
        const tipo = await TiposProfesionalModel.obtenerPorId(
            req.params.id,
            req.tenant.organizacionId
        );
        return ResponseHelper.success(res, tipo);
    });

    /**
     * POST /api/v1/tipos-profesional
     * Crear tipo personalizado (solo para la organización)
     */
    static crear = asyncHandler(async (req, res) => {
        const datosTipo = {
            organizacion_id: req.tenant.organizacionId,
            ...req.body
        };

        const tipoCreado = await TiposProfesionalModel.crear(datosTipo);
        return ResponseHelper.success(res, tipoCreado, 'Tipo de profesional creado exitosamente', 201);
    });

    /**
     * PUT /api/v1/tipos-profesional/:id
     * Actualizar tipo personalizado (NO permite modificar tipos de sistema)
     */
    static actualizar = asyncHandler(async (req, res) => {
        const tipoActualizado = await TiposProfesionalModel.actualizar(
            req.params.id,
            req.tenant.organizacionId,
            req.body
        );
        return ResponseHelper.success(res, tipoActualizado);
    });

    /**
     * DELETE /api/v1/tipos-profesional/:id
     * Eliminar tipo personalizado (NO permite eliminar tipos de sistema)
     */
    static eliminar = asyncHandler(async (req, res) => {
        await TiposProfesionalModel.eliminar(
            req.params.id,
            req.tenant.organizacionId
        );
        return ResponseHelper.success(res, null, 'Tipo de profesional eliminado exitosamente');
    });
}

module.exports = TiposProfesionalController;
```

### 2. Crear TiposProfesionalModel

```javascript
// backend/app/database/tipos-profesional.model.js

const db = require('../config/database');
const { RLSContextManager } = require('../utils/rlsContextManager');
const logger = require('../config/logger');

class TiposProfesionalModel {

    /**
     * Listar tipos de profesional
     */
    static async listar(filtros = {}) {
        return await RLSContextManager.withBypass(async (dbClient) => {
            let whereClause = 'WHERE tp.activo = $1';
            const queryParams = [filtros.activo !== false];
            let paramCounter = 2;

            // Filtro: solo sistema
            if (filtros.solo_sistema) {
                whereClause += ` AND tp.organizacion_id IS NULL`;
            }
            // Filtro: solo personalizados de la org
            else if (filtros.solo_personalizados && filtros.organizacion_id) {
                whereClause += ` AND tp.organizacion_id = $${paramCounter}`;
                queryParams.push(filtros.organizacion_id);
                paramCounter++;
            }
            // Default: sistema + personalizados de la org
            else if (filtros.organizacion_id) {
                whereClause += ` AND (tp.organizacion_id IS NULL OR tp.organizacion_id = $${paramCounter})`;
                queryParams.push(filtros.organizacion_id);
                paramCounter++;
            }

            // Filtro: por tipo de industria compatible
            if (filtros.tipo_industria) {
                whereClause += ` AND $${paramCounter} = ANY(tp.industrias_compatibles)`;
                queryParams.push(filtros.tipo_industria);
                paramCounter++;
            }

            const query = `
                SELECT
                    tp.id,
                    tp.organizacion_id,
                    tp.codigo,
                    tp.nombre,
                    tp.descripcion,
                    tp.categoria,
                    tp.industrias_compatibles,
                    tp.requiere_licencia,
                    tp.nivel_experiencia_minimo,
                    tp.es_sistema,
                    tp.icono,
                    tp.color,
                    tp.activo,
                    tp.creado_en,
                    tp.actualizado_en,
                    -- Contador de profesionales usando este tipo
                    (SELECT COUNT(*) FROM profesionales p
                     WHERE p.tipo_profesional_id = tp.id
                       AND p.activo = true
                    ) as profesionales_count
                FROM tipos_profesional tp
                ${whereClause}
                ORDER BY
                    tp.es_sistema DESC,  -- Sistema primero
                    tp.categoria,
                    tp.nombre
            `;

            const result = await dbClient.query(query, queryParams);

            return {
                tipos: result.rows,
                total: result.rows.length,
                filtros_aplicados: {
                    organizacion_id: filtros.organizacion_id,
                    solo_sistema: filtros.solo_sistema || false,
                    solo_personalizados: filtros.solo_personalizados || false,
                    tipo_industria: filtros.tipo_industria,
                    activo: filtros.activo
                }
            };
        });
    }

    /**
     * Obtener tipo por ID
     */
    static async obtenerPorId(id, organizacionId) {
        return await RLSContextManager.withBypass(async (dbClient) => {
            const query = `
                SELECT
                    tp.id,
                    tp.organizacion_id,
                    tp.codigo,
                    tp.nombre,
                    tp.descripcion,
                    tp.categoria,
                    tp.industrias_compatibles,
                    tp.requiere_licencia,
                    tp.nivel_experiencia_minimo,
                    tp.es_sistema,
                    tp.icono,
                    tp.color,
                    tp.metadata,
                    tp.activo,
                    tp.creado_en,
                    tp.actualizado_en
                FROM tipos_profesional tp
                WHERE tp.id = $1
                  AND (tp.organizacion_id IS NULL OR tp.organizacion_id = $2)
            `;

            const result = await dbClient.query(query, [id, organizacionId]);

            if (result.rows.length === 0) {
                throw new Error('Tipo de profesional no encontrado');
            }

            return result.rows[0];
        });
    }

    /**
     * Crear tipo personalizado
     */
    static async crear(datosTipo) {
        return await RLSContextManager.transaction(datosTipo.organizacion_id, async (dbClient) => {

            // Validar que no existe un tipo con el mismo código en la org
            const existente = await dbClient.query(`
                SELECT id FROM tipos_profesional
                WHERE codigo = $1
                  AND (organizacion_id = $2 OR organizacion_id IS NULL)
            `, [datosTipo.codigo, datosTipo.organizacion_id]);

            if (existente.rows.length > 0) {
                throw new Error('Ya existe un tipo de profesional con este código');
            }

            const query = `
                INSERT INTO tipos_profesional (
                    organizacion_id, codigo, nombre, descripcion,
                    categoria, industrias_compatibles, requiere_licencia,
                    nivel_experiencia_minimo, icono, color, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const result = await dbClient.query(query, [
                datosTipo.organizacion_id,
                datosTipo.codigo,
                datosTipo.nombre,
                datosTipo.descripcion || null,
                datosTipo.categoria || 'otro',
                datosTipo.industrias_compatibles || [],
                datosTipo.requiere_licencia || false,
                datosTipo.nivel_experiencia_minimo || 0,
                datosTipo.icono || 'User',
                datosTipo.color || '#808080',
                datosTipo.metadata || {}
            ]);

            logger.info('[TiposProfesionalModel.crear] Tipo personalizado creado', {
                id: result.rows[0].id,
                codigo: result.rows[0].codigo,
                organizacion_id: datosTipo.organizacion_id
            });

            return result.rows[0];
        });
    }

    /**
     * Actualizar tipo personalizado (NO permite modificar tipos de sistema)
     */
    static async actualizar(id, organizacionId, datosActualizacion) {
        return await RLSContextManager.transaction(organizacionId, async (dbClient) => {

            // Verificar que existe y es personalizado (no sistema)
            const tipoExistente = await dbClient.query(`
                SELECT id, es_sistema, organizacion_id
                FROM tipos_profesional
                WHERE id = $1 AND organizacion_id = $2
            `, [id, organizacionId]);

            if (tipoExistente.rows.length === 0) {
                throw new Error('Tipo de profesional no encontrado o no tienes permiso para modificarlo');
            }

            if (tipoExistente.rows[0].es_sistema) {
                throw new Error('No se pueden modificar tipos de sistema');
            }

            const camposPermitidos = [
                'nombre', 'descripcion', 'categoria', 'industrias_compatibles',
                'requiere_licencia', 'nivel_experiencia_minimo', 'icono',
                'color', 'metadata', 'activo'
            ];

            const camposActualizar = [];
            const valoresActualizar = [id, organizacionId];
            let paramCounter = 3;

            for (const campo of camposPermitidos) {
                if (datosActualizacion.hasOwnProperty(campo)) {
                    camposActualizar.push(`${campo} = $${paramCounter}`);
                    valoresActualizar.push(datosActualizacion[campo]);
                    paramCounter++;
                }
            }

            if (camposActualizar.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            const query = `
                UPDATE tipos_profesional
                SET ${camposActualizar.join(', ')}, actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
                RETURNING *
            `;

            const result = await dbClient.query(query, valoresActualizar);

            logger.info('[TiposProfesionalModel.actualizar] Tipo actualizado', {
                id,
                organizacion_id: organizacionId
            });

            return result.rows[0];
        });
    }

    /**
     * Eliminar tipo personalizado (soft delete)
     */
    static async eliminar(id, organizacionId) {
        return await RLSContextManager.transaction(organizacionId, async (dbClient) => {

            // Verificar que existe y es personalizado
            const tipoExistente = await dbClient.query(`
                SELECT id, es_sistema, codigo
                FROM tipos_profesional
                WHERE id = $1 AND organizacion_id = $2
            `, [id, organizacionId]);

            if (tipoExistente.rows.length === 0) {
                throw new Error('Tipo de profesional no encontrado');
            }

            if (tipoExistente.rows[0].es_sistema) {
                throw new Error('No se pueden eliminar tipos de sistema');
            }

            // Verificar si hay profesionales usando este tipo
            const profesionalesUsando = await dbClient.query(`
                SELECT COUNT(*) as count
                FROM profesionales
                WHERE tipo_profesional_id = $1 AND activo = true
            `, [id]);

            if (parseInt(profesionalesUsando.rows[0].count) > 0) {
                throw new Error('No se puede eliminar el tipo porque hay profesionales activos usándolo');
            }

            // Soft delete
            await dbClient.query(`
                UPDATE tipos_profesional
                SET activo = false, actualizado_en = NOW()
                WHERE id = $1 AND organizacion_id = $2
            `, [id, organizacionId]);

            logger.info('[TiposProfesionalModel.eliminar] Tipo eliminado (soft delete)', {
                id,
                codigo: tipoExistente.rows[0].codigo,
                organizacion_id: organizacionId
            });

            return { success: true };
        });
    }
}

module.exports = TiposProfesionalModel;
```

### 3. Crear schemas de validación

```javascript
// backend/app/schemas/tipos-profesional.schemas.js

const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

const categorias = [
    'barberia', 'salon_belleza', 'estetica', 'spa',
    'podologia', 'medico', 'academia', 'taller_tecnico',
    'fitness', 'veterinaria', 'otro'
];

const industrias = [
    'academia', 'barberia', 'centro_fitness', 'consultorio_medico',
    'estetica', 'otro', 'podologia', 'salon_belleza', 'spa',
    'taller_tecnico', 'veterinaria'
];

const listar = {
    query: Joi.object({
        solo_sistema: Joi.boolean().optional(),
        solo_personalizados: Joi.boolean().optional(),
        tipo_industria: Joi.string().valid(...industrias).optional(),
        activo: Joi.boolean().optional()
    })
};

const obtener = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

const crear = {
    body: Joi.object({
        codigo: Joi.string()
            .pattern(/^[a-z_]+$/)
            .min(3)
            .max(50)
            .required()
            .messages({
                'string.pattern.base': 'El código solo puede contener letras minúsculas y guiones bajos'
            }),
        nombre: Joi.string()
            .min(3)
            .max(100)
            .required(),
        descripcion: Joi.string()
            .max(500)
            .optional()
            .allow(null),
        categoria: Joi.string()
            .valid(...categorias)
            .required(),
        industrias_compatibles: Joi.array()
            .items(Joi.string().valid(...industrias))
            .min(1)
            .required(),
        requiere_licencia: Joi.boolean()
            .optional()
            .default(false),
        nivel_experiencia_minimo: Joi.number()
            .integer()
            .min(0)
            .max(50)
            .optional()
            .default(0),
        icono: Joi.string()
            .max(50)
            .optional()
            .default('User'),
        color: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional()
            .default('#808080')
            .messages({
                'string.pattern.base': 'El color debe ser hexadecimal válido (ej: #808080)'
            }),
        metadata: Joi.object()
            .optional()
            .default({})
    })
};

const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre: Joi.string().min(3).max(100).optional(),
        descripcion: Joi.string().max(500).optional().allow(null),
        categoria: Joi.string().valid(...categorias).optional(),
        industrias_compatibles: Joi.array().items(Joi.string().valid(...industrias)).min(1).optional(),
        requiere_licencia: Joi.boolean().optional(),
        nivel_experiencia_minimo: Joi.number().integer().min(0).max(50).optional(),
        icono: Joi.string().max(50).optional(),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
        metadata: Joi.object().optional(),
        activo: Joi.boolean().optional()
    }).min(1)
};

const eliminar = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

module.exports = {
    listar,
    obtener,
    crear,
    actualizar,
    eliminar
};
```

### 4. Crear rutas

```javascript
// backend/app/routes/api/v1/tipos-profesional.js

const express = require('express');
const router = express.Router();
const TiposProfesionalController = require('../../../controllers/TiposProfesionalController');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const tiposProfesionalSchemas = require('../../../schemas/tipos-profesional.schemas');

// GET /api/v1/tipos-profesional - Listar tipos
router.get(
    '/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(tiposProfesionalSchemas.listar),
    TiposProfesionalController.listar
);

// GET /api/v1/tipos-profesional/:id - Obtener tipo por ID
router.get(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(tiposProfesionalSchemas.obtener),
    TiposProfesionalController.obtener
);

// POST /api/v1/tipos-profesional - Crear tipo personalizado
router.post(
    '/',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['propietario', 'admin', 'super_admin']), // Solo admin+
    rateLimiting.apiRateLimit,
    validation.validate(tiposProfesionalSchemas.crear),
    TiposProfesionalController.crear
);

// PUT /api/v1/tipos-profesional/:id - Actualizar tipo personalizado
router.put(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['propietario', 'admin', 'super_admin']),
    rateLimiting.apiRateLimit,
    validation.validate(tiposProfesionalSchemas.actualizar),
    TiposProfesionalController.actualizar
);

// DELETE /api/v1/tipos-profesional/:id - Eliminar tipo personalizado
router.delete(
    '/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['propietario', 'admin', 'super_admin']),
    rateLimiting.apiRateLimit,
    validation.validate(tiposProfesionalSchemas.eliminar),
    TiposProfesionalController.eliminar
);

module.exports = router;
```

### 5. Agregar rutas al index

```javascript
// backend/app/routes/api/v1/index.js

// ... otras rutas
const tiposProfesionalRoutes = require('./tipos-profesional');

// ... en el router
router.use('/tipos-profesional', tiposProfesionalRoutes);
```

### 6. Actualizar profesional.model.js

Cambiar todas las referencias de `tipo_profesional` ENUM a `tipo_profesional_id` FK:

```javascript
// En las queries SELECT
SELECT
    p.id,
    p.tipo_profesional_id,
    tp.codigo as tipo_profesional_codigo,
    tp.nombre as tipo_profesional_nombre,
    // ... otros campos
FROM profesionales p
LEFT JOIN tipos_profesional tp ON p.tipo_profesional_id = tp.id
```

### 7. Actualizar profesional.schemas.js

```javascript
// Cambiar de:
tipo_profesional: Joi.string().valid(...TIPOS_PROFESIONAL).required()

// A:
tipo_profesional_id: Joi.number().integer().positive().required()
```

### 8. Actualizar profesional.controller.js

Agregar validación de compatibilidad de tipo_profesional_id con industria:

```javascript
// En el método crear/actualizar
static crear = asyncHandler(async (req, res) => {
    // Validar compatibilidad tipo_profesional vs industria de la organización
    const orgInfo = await db.query(`
        SELECT tipo_industria FROM organizaciones WHERE id = $1
    `, [req.tenant.organizacionId]);

    const tipoInfo = await db.query(`
        SELECT industrias_compatibles FROM tipos_profesional WHERE id = $1
    `, [req.body.tipo_profesional_id]);

    if (tipoInfo.rows.length === 0) {
        throw new Error('Tipo de profesional inválido');
    }

    const tipoIndustria = orgInfo.rows[0].tipo_industria;
    const industriasCompatibles = tipoInfo.rows[0].industrias_compatibles;

    if (!industriasCompatibles.includes(tipoIndustria)) {
        throw new Error(`Tipo de profesional "${req.body.tipo_profesional_id}" no es compatible con la industria "${tipoIndustria}"`);
    }

    // ... resto del código
});
```

---

## 🎨 Actualización de Código Frontend

### 1. Crear hook useTiposProfesional

```javascript
// frontend/src/hooks/useTiposProfesional.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tiposProfesionalApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/useToast';

// Query Keys
export const tiposProfesionalKeys = {
  all: ['tipos-profesional'],
  lists: () => [...tiposProfesionalKeys.all, 'list'],
  list: (filters) => [...tiposProfesionalKeys.lists(), { filters }],
  details: () => [...tiposProfesionalKeys.all, 'detail'],
  detail: (id) => [...tiposProfesionalKeys.details(), id],
};

/**
 * Hook para listar tipos de profesional
 */
export const useTiposProfesional = (filtros = {}) => {
  return useQuery({
    queryKey: tiposProfesionalKeys.list(filtros),
    queryFn: async () => {
      const response = await tiposProfesionalApi.listar(filtros);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para obtener un tipo de profesional por ID
 */
export const useTipoProfesional = (id, options = {}) => {
  return useQuery({
    queryKey: tiposProfesionalKeys.detail(id),
    queryFn: async () => {
      const response = await tiposProfesionalApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook para crear un tipo de profesional personalizado
 */
export const useCrearTipoProfesional = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await tiposProfesionalApi.crear(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tiposProfesionalKeys.lists() });
      success('Tipo de profesional creado exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al crear tipo de profesional');
    },
  });
};

/**
 * Hook para actualizar un tipo de profesional
 */
export const useActualizarTipoProfesional = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await tiposProfesionalApi.actualizar(id, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tiposProfesionalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tiposProfesionalKeys.detail(variables.id) });
      success('Tipo de profesional actualizado exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al actualizar tipo de profesional');
    },
  });
};

/**
 * Hook para eliminar un tipo de profesional
 */
export const useEliminarTipoProfesional = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await tiposProfesionalApi.eliminar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tiposProfesionalKeys.lists() });
      success('Tipo de profesional eliminado exitosamente');
    },
    onError: (err) => {
      error(err.response?.data?.mensaje || 'Error al eliminar tipo de profesional');
    },
  });
};
```

### 2. Actualizar endpoints.js

```javascript
// frontend/src/services/api/endpoints.js

// Agregar endpoint de tipos de profesional
export const tiposProfesionalApi = {
  listar: (filtros = {}) => client.get('/tipos-profesional', { params: filtros }),
  obtener: (id) => client.get(`/tipos-profesional/${id}`),
  crear: (data) => client.post('/tipos-profesional', data),
  actualizar: (id, data) => client.put(`/tipos-profesional/${id}`, data),
  eliminar: (id) => client.delete(`/tipos-profesional/${id}`),
};
```

### 3. Actualizar ProfesionalFormModal

```jsx
// frontend/src/components/profesionales/ProfesionalFormModal.jsx

import { useTiposProfesional } from '@/hooks/useTiposProfesional';

function ProfesionalFormModal({ isOpen, onClose, profesional, modo = 'crear' }) {
  // ... código existente

  // Cargar tipos de profesional compatibles con la industria de la org
  const { data: tiposData, isLoading: isLoadingTipos } = useTiposProfesional({
    tipo_industria: organizacionInfo?.tipo_industria, // Filtrar por industria
  });

  // Opciones de tipos de profesional
  const opcionesTipos = useMemo(() => {
    if (!tiposData?.tipos) return [];

    return tiposData.tipos.map(tipo => ({
      value: tipo.id,
      label: tipo.nombre,
      categoria: tipo.categoria,
      requiere_licencia: tipo.requiere_licencia,
      es_sistema: tipo.es_sistema,
    }));
  }, [tiposData]);

  return (
    <Modal>
      {/* ... */}

      {/* Campo Tipo de Profesional */}
      <Controller
        name="tipo_profesional_id"
        control={control}
        render={({ field: { value, onChange, ...field }, fieldState: { error } }) => (
          <div>
            <label htmlFor="tipo_profesional_id" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de profesional <span className="text-red-500">*</span>
            </label>
            <Select
              {...field}
              id="tipo_profesional_id"
              value={value?.toString() || ''}
              onChange={(e) => {
                const val = e.target.value;
                onChange(val ? parseInt(val) : null);
              }}
              options={opcionesTipos}
              disabled={isLoadingTipos}
              error={error?.message}
            />
            {isLoadingTipos && (
              <p className="text-xs text-gray-500 mt-1">Cargando tipos de profesional...</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600">{error.message}</p>
            )}
          </div>
        )}
      />

      {/* ... resto del formulario */}
    </Modal>
  );
}
```

---

## ✅ Testing

### 1. Tests de backend

```javascript
// backend/app/__tests__/endpoints/tipos-profesional.test.js

describe('Tipos de Profesional Endpoints', () => {

    it('GET /api/v1/tipos-profesional - Debe listar tipos de sistema', async () => {
        const response = await request(app)
            .get('/api/v1/tipos-profesional')
            .query({ solo_sistema: true })
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.data.tipos).toHaveLength(33);
        expect(response.body.data.tipos[0]).toHaveProperty('es_sistema', true);
    });

    it('GET /api/v1/tipos-profesional - Debe filtrar por industria', async () => {
        const response = await request(app)
            .get('/api/v1/tipos-profesional')
            .query({ tipo_industria: 'barberia' })
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        const tipos = response.body.data.tipos;
        tipos.forEach(tipo => {
            expect(tipo.industrias_compatibles).toContain('barberia');
        });
    });

    it('POST /api/v1/tipos-profesional - Debe crear tipo personalizado', async () => {
        const nuevoTipo = {
            codigo: 'especialista_test',
            nombre: 'Especialista Test',
            descripcion: 'Tipo de prueba',
            categoria: 'otro',
            industrias_compatibles: ['barberia'],
            requiere_licencia: false
        };

        const response = await request(app)
            .post('/api/v1/tipos-profesional')
            .send(nuevoTipo)
            .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(201);
        expect(response.body.data.codigo).toBe('especialista_test');
        expect(response.body.data.es_sistema).toBe(false);
    });

    it('PUT /api/v1/tipos-profesional/:id - NO debe modificar tipo de sistema', async () => {
        // Obtener un tipo de sistema
        const tipos = await request(app)
            .get('/api/v1/tipos-profesional')
            .query({ solo_sistema: true })
            .set('Authorization', `Bearer ${token}`);

        const tipoSistema = tipos.body.data.tipos[0];

        const response = await request(app)
            .put(`/api/v1/tipos-profesional/${tipoSistema.id}`)
            .send({ nombre: 'Nuevo nombre' })
            .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(response.status).toBe(400);
        expect(response.body.mensaje).toContain('tipos de sistema');
    });
});
```

### 2. Actualizar tests de profesionales

```javascript
// backend/app/__tests__/endpoints/profesionales.test.js

it('POST /api/v1/profesionales - Debe validar compatibilidad tipo_profesional vs industria', async () => {
    // Org con industria "barberia"
    // Intentar crear profesional con tipo "doctor_general" (incompatible)

    const response = await request(app)
        .post('/api/v1/profesionales')
        .send({
            nombre_completo: 'Test',
            tipo_profesional_id: tipoDocto rGeneralId, // ID de doctor_general
            // ... otros campos
        })
        .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.mensaje).toContain('no es compatible');
});
```

---

## 🔄 PASO FINAL: Eliminar ENUM tipo_profesional

**⚠️ Solo después de verificar que todo funciona correctamente**

```sql
-- 1. Eliminar columna antigua
ALTER TABLE profesionales DROP COLUMN tipo_profesional;

-- 2. Eliminar ENUM
DROP TYPE tipo_profesional;
```

---

## 📝 Checklist de Migración

### SQL (Base de Datos)
- [ ] Modificar `04-catalog-tables.sql`: Agregar tabla `tipos_profesional` completa
- [ ] Modificar `04-catalog-tables.sql`: Agregar seed de 33 tipos del sistema
- [ ] Modificar `05-business-tables.sql`: Cambiar `tipo_profesional` a `tipo_profesional_id` en tabla profesionales
- [ ] Modificar `05-business-tables.sql`: Cambiar `tipos_profesional_autorizados` a INTEGER[] en tabla servicios
- [ ] (Opcional) Modificar `01-types-and-enums.sql`: Comentar ENUM tipo_profesional
- [ ] Reiniciar sistema desde cero (npm run stop → eliminar volumen → npm run start)
- [ ] Verificar tabla creada: `SELECT COUNT(*) FROM tipos_profesional WHERE es_sistema = true;` → 33

### Backend (API)
- [ ] Crear `backend/app/controllers/TiposProfesionalController.js`
- [ ] Crear `backend/app/database/tipos-profesional.model.js`
- [ ] Crear `backend/app/schemas/tipos-profesional.schemas.js`
- [ ] Crear `backend/app/routes/api/v1/tipos-profesional.js`
- [ ] Modificar `backend/app/routes/api/v1/index.js`: Registrar rutas tipos-profesional
- [ ] Modificar `backend/app/database/profesional.model.js`: JOIN con tipos_profesional
- [ ] Modificar `backend/app/schemas/profesional.schemas.js`: tipo_profesional_id en lugar de tipo_profesional
- [ ] Modificar `backend/app/controllers/profesional.controller.js`: Validación de compatibilidad con industria
- [ ] (Opcional) Eliminar `backend/app/constants/profesionales.constants.js`: array TIPOS_PROFESIONAL obsoleto
- [ ] Tests: `backend/app/__tests__/endpoints/tipos-profesional.test.js`
- [ ] Actualizar tests existentes de profesionales para usar tipo_profesional_id

### Frontend (UI)
- [ ] Crear `frontend/src/hooks/useTiposProfesional.js`
- [ ] Modificar `frontend/src/services/api/endpoints.js`: Agregar tiposProfesionalApi
- [ ] Modificar `frontend/src/components/profesionales/ProfesionalFormModal.jsx`: Select dinámico con tipos
- [ ] Filtrar tipos por industria de la organización
- [ ] (Opcional) Crear UI para gestionar tipos personalizados (solo admin)
- [ ] Validación frontend de campos requeridos

### Testing Final
- [ ] Verificar endpoint GET /api/v1/tipos-profesional → retorna 33 tipos del sistema
- [ ] Verificar filtro por industria funciona correctamente
- [ ] Verificar creación de profesional con tipo_profesional_id
- [ ] Verificar validación de compatibilidad tipo vs industria
- [ ] Verificar select en frontend muestra solo tipos compatibles
- [ ] Verificar no se puede crear profesional con tipo incompatible

### Limpieza Final
- [ ] Eliminar este archivo: `PLAN-MIGRACION-TIPOS-PROFESIONAL.md`

---

## 🎉 Beneficios Post-Migración

1. ✅ **UX mejorada**: Select en lugar de input manual
2. ✅ **Validación automática**: Tipos compatibles con industria de la org
3. ✅ **Personalización**: Organizaciones pueden crear sus propios tipos
4. ✅ **Escalabilidad**: Fácil agregar nuevos tipos sin modificar código
5. ✅ **Consistencia**: Mismo patrón usado en `tipos_bloqueo` (ya probado)
6. ✅ **Mejor DX**: Código más limpio y mantenible

---

**Notas**:
- Seguir el mismo patrón exitoso de tipo_bloqueo
- Validar compatibilidad tipo_profesional vs industria en backend
- Permitir tipos personalizados solo para admin+
- No permitir modificar/eliminar tipos de sistema
- Verificar que no haya profesionales activos antes de eliminar tipo personalizado
