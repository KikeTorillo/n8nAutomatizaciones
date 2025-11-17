# 💵 MÓDULO COMISIONES

**Versión:** 1.0.0
**Fecha:** 17 Noviembre 2025
**Estado:** ✅ Operativo

---

## 📋 Descripción

Sistema completo de comisiones automáticas para profesionales. Calcula y registra comisiones al completar citas, con configuración flexible por profesional o servicio, auditoría completa y dashboard integrado.

---

## 🏗️ Arquitectura

### Componentes Principales

```
sql/comisiones/
├── 01-tablas.sql        → 3 tablas (configuración, comisiones, historial)
├── 02-indices.sql       → 10 índices especializados (GIN JSONB, covering, parciales)
├── 03-rls-policies.sql  → 4 políticas RLS multi-tenant
├── 04-funciones.sql     → 3 funciones PL/pgSQL (cálculo automático, auditoría)
├── 05-triggers.sql      → 5 triggers (1 en citas, 4 en comisiones)
└── README.md           → Este archivo
```

### Orden de Ejecución

```bash
# Llamado desde init-data.sh
01-tablas.sql → 02-indices.sql → 03-rls-policies.sql → 04-funciones.sql → 05-triggers.sql
```

---

## 📊 Tablas

### 1. **configuracion_comisiones**

**Descripción:** Esquemas de comisión por profesional y/o servicio con prioridad específica > global.

**Columnas principales:**
- `id` (SERIAL) - PK
- `organizacion_id` (INTEGER) - FK organizaciones
- `profesional_id` (INTEGER) - FK profesionales
- `servicio_id` (INTEGER) - FK servicios, NULL = global
- `tipo_comision` (VARCHAR 20) - porcentaje | monto_fijo
- `valor_comision` (NUMERIC 10,2) - 0-100 (%) o monto fijo
- `activo` (BOOLEAN) - Soft disable
- Timestamps: `creado_en`, `actualizado_en`

**Prioridad de configuración:**
1. **Específica:** `servicio_id = X` → Solo ese servicio
2. **Global:** `servicio_id IS NULL` → Todos los servicios del profesional (fallback)

**Constraints:**
- UNIQUE (`organizacion_id`, `profesional_id`, `servicio_id`)
- CHECK: `tipo_comision = 'porcentaje' → valor_comision <= 100`

**Ejemplo:**
```sql
-- Configuración global: 15% para todos los servicios del profesional
INSERT INTO configuracion_comisiones (organizacion_id, profesional_id, tipo_comision, valor_comision)
VALUES (1, 5, 'porcentaje', 15.00);

-- Configuración específica: $50 fijos solo para servicio ID=10
INSERT INTO configuracion_comisiones (organizacion_id, profesional_id, servicio_id, tipo_comision, valor_comision)
VALUES (1, 5, 10, 'monto_fijo', 50.00);
```

---

### 2. **comisiones_profesionales**

**Descripción:** Registro histórico de comisiones generadas automáticamente por trigger al completar citas.

**Columnas principales:**
- `id` (SERIAL) - PK
- `organizacion_id` (INTEGER) - FK organizaciones
- `profesional_id` (INTEGER) - FK profesionales
- **FK Compuesta a tabla particionada:**
  - `cita_id` (INTEGER) - Requerido para FK
  - `fecha_cita` (DATE) - Requerido para partition key de citas
  - FOREIGN KEY (`cita_id`, `fecha_cita`) REFERENCES `citas(id, fecha_cita)`
- **Cálculo de comisión:**
  - `monto_base` (NUMERIC 10,2) - Precio total de la cita
  - `tipo_comision` (VARCHAR 20) - porcentaje | monto_fijo | mixto
  - `valor_comision` (NUMERIC 10,2) - Valor aplicado (0 si mixto)
  - `monto_comision` (NUMERIC 10,2) - **Monto final a pagar**
- **Detalle JSONB:**
  - `detalle_servicios` (JSONB) - Breakdown por servicio
- **Estado de pago:**
  - `estado_pago` (VARCHAR 20) - pendiente | pagada | cancelada
  - `fecha_pago` (DATE)
  - `metodo_pago` (VARCHAR 50)
  - `referencia_pago` (VARCHAR 100)
  - `pagado_por` (INTEGER) - FK usuarios

**Características críticas:**
- ✅ **Creación 100% automática**: Trigger en `citas` al completar (estado → completada)
- ✅ **Anti-duplicados**: Validación EXISTS antes de insertar
- ✅ **FK compuesta**: Requiere `fecha_cita` para referenciar tabla particionada
- ✅ **JSONB no requiere parse**: PostgreSQL retorna objetos ya parseados

**Estructura JSONB `detalle_servicios`:**
```json
[
  {
    "servicio_id": 1,
    "nombre": "Corte de cabello",
    "precio": 150.00,
    "tipo_comision": "porcentaje",
    "valor_comision": 15.00,
    "comision_calculada": 22.50
  },
  {
    "servicio_id": 2,
    "nombre": "Barba",
    "precio": 80.00,
    "tipo_comision": "monto_fijo",
    "valor_comision": 20.00,
    "comision_calculada": 20.00
  }
]
```

**Tipo de comisión final:**
- **porcentaje**: Todos los servicios usan % del precio
- **monto_fijo**: Todos los servicios usan cantidad fija
- **mixto**: Combina porcentaje y monto fijo (múltiples servicios con diferentes tipos)

**Ejemplo real (validado en sistema):**
```sql
-- Configuración: 15% global del profesional
-- Cita completada: $150 (1 servicio)
-- Resultado automático:
{
  monto_base: 150.00,
  tipo_comision: "porcentaje",
  valor_comision: 15.00,
  monto_comision: 22.50,  -- 150 * 0.15
  estado_pago: "pendiente"
}
```

---

### 3. **historial_configuracion_comisiones**

**Descripción:** Auditoría de cambios en configuración de comisiones (INSERT/UPDATE/DELETE).

**Columnas principales:**
- `id` (SERIAL) - PK
- `organizacion_id` (INTEGER) - FK organizaciones
- `configuracion_id` (INTEGER) - FK configuracion_comisiones (NULL si DELETE)
- `profesional_id` (INTEGER) - Duplicado para consultas rápidas
- `servicio_id` (INTEGER) - Duplicado
- **Valores anteriores:**
  - `tipo_comision_anterior`
  - `valor_comision_anterior`
  - `activo_anterior`
- **Valores nuevos:**
  - `tipo_comision_nuevo`
  - `valor_comision_nuevo`
  - `activo_nuevo`
- **Metadata:**
  - `accion` (VARCHAR 20) - INSERT | UPDATE | DELETE
  - `modificado_por` (INTEGER) - FK usuarios (desde current_setting)
  - `modificado_en` (TIMESTAMPTZ)
  - `razon` (TEXT) - Opcional

**Características:**
- ✅ **Registro automático**: Triggers AFTER INSERT/UPDATE, BEFORE DELETE
- ✅ **Bypass RLS**: Inserción de sistema con `set_config('app.bypass_rls', 'true')`
- ✅ **Usuario rastreado**: Obtiene user_id desde `current_setting('app.user_id')`

---

## 📑 Índices (10 índices especializados)

### Tabla `configuracion_comisiones` (4 índices)

| Índice | Tipo | Columnas | Propósito | Performance |
|--------|------|----------|-----------|-------------|
| **idx_config_comisiones_org** | B-tree | `organizacion_id` | RLS multi-tenant | 🚀 Crítico |
| **idx_config_comisiones_prof** | B-tree | `profesional_id` | Trigger + dashboard | 🚀 Crítico |
| **idx_config_comisiones_serv** | B-tree (partial) | `servicio_id` WHERE NOT NULL | Configuración específica | ⚡ Alto |
| **idx_config_comisiones_activo** | B-tree (partial) | `activo` WHERE TRUE | Filtrado configs activas | ⚡ Alto |

### Tabla `comisiones_profesionales` (6 índices)

| Índice | Tipo | Columnas | Propósito | Performance |
|--------|------|----------|-----------|-------------|
| **idx_comisiones_org** | B-tree | `organizacion_id` | RLS multi-tenant | 🚀 Crítico |
| **idx_comisiones_prof** | B-tree | `profesional_id` | Dashboard profesional | 🚀 Crítico |
| **idx_comisiones_cita** | B-tree | `cita_id` | Anti-duplicados (trigger) | 🚀 Crítico |
| **idx_comisiones_estado** | B-tree | `estado_pago` | Filtros dashboard | ⚡ Alto |
| **idx_comisiones_detalle_servicios** | GIN | `detalle_servicios` | Búsquedas analíticas JSONB | 🔍 Analytics |
| **idx_comisiones_fecha_estado_covering** | B-tree (covering) | `creado_en`, `estado_pago` INCLUDE (`profesional_id`, `monto_comision`, `tipo_comision`) | Reportes (index-only scan) | 📊 Reportes |

**Nota:** Todos los índices aprovechan RLS y partition pruning implícitamente.

---

## 🔒 Row Level Security (RLS)

### Políticas Implementadas (4)

#### 1. **configuracion_comisiones_tenant_isolation**
```sql
FOR ALL TO saas_app
USING (organizacion_id = current_tenant_id)
```
**Propósito:** Aislamiento multi-tenant estricto para configuración.

#### 2. **comisiones_profesionales_tenant_isolation**
```sql
FOR ALL TO saas_app
USING (organizacion_id = current_tenant_id)
```
**Propósito:** Aislamiento multi-tenant para comisiones.
- Admin/propietario: Ve todas las comisiones de su organización
- Empleado: Ve solo sus comisiones (filtrado adicional en backend)

#### 3. **historial_config_comisiones_tenant_isolation**
```sql
FOR SELECT TO saas_app
USING (organizacion_id = current_tenant_id)
```
**Propósito:** SELECT en historial solo para la misma organización.

#### 4. **historial_config_comisiones_trigger_insert**
```sql
FOR INSERT TO saas_app
WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR organizacion_id = current_tenant_id
)
```
**Propósito:** Permite INSERT desde triggers de auditoría con bypass RLS.

---

## ⚙️ Funciones PL/pgSQL (3)

### 1. **obtener_configuracion_comision()**

**Tipo:** STABLE FUNCTION
**Parámetros:**
- `p_profesional_id` (INTEGER)
- `p_servicio_id` (INTEGER)
- `p_organizacion_id` (INTEGER)

**Returns:** TABLE (tipo_comision, valor_comision)

**Algoritmo:**
1. Busca configuración **específica** (servicio_id = p_servicio_id)
2. Si no encuentra, busca configuración **global** (servicio_id IS NULL)
3. Retorna NULL si no hay configuración

**Usado por:** `calcular_comision_cita()` (trigger crítico)

**Performance:** O(log n) con índices `idx_config_comisiones_prof` y `idx_config_comisiones_serv`

---

### 2. **calcular_comision_cita()**

**Tipo:** TRIGGER FUNCTION
**Ejecución:** AFTER UPDATE OF `estado` ON `citas`
**Condición:** `NEW.estado = 'completada' AND OLD.estado != 'completada'`

**Algoritmo:**
1. Activa bypass RLS: `set_config('app.bypass_rls', 'true')`
2. Valida que profesional existe
3. **Anti-duplicados:** EXISTS en `comisiones_profesionales` WHERE `cita_id`
4. Obtiene servicios desde `citas_servicios`
5. Para cada servicio:
   - Llama `obtener_configuracion_comision()` (específica > global)
   - Calcula comisión según tipo (porcentaje o monto_fijo)
   - Agrega al `detalle_servicios` JSONB
6. Determina `tipo_comision` final:
   - 'porcentaje' si todos usan %
   - 'monto_fijo' si todos usan monto fijo
   - 'mixto' si combina ambos
7. Inserta en `comisiones_profesionales` con estado 'pendiente'

**Características críticas:**
- ✅ Bypass RLS para operación de sistema
- ✅ Anti-duplicados con validación EXISTS
- ✅ Performance: O(n) donde n = cantidad de servicios
- ✅ Índices usados: `idx_config_comisiones_prof`, `idx_config_comisiones_serv`, `idx_comisiones_cita`

---

### 3. **auditoria_configuracion_comisiones()**

**Tipo:** TRIGGER FUNCTION
**Eventos:**
- AFTER INSERT OR UPDATE
- BEFORE DELETE

**Operaciones:**
- **INSERT:** Registra valores nuevos
- **UPDATE:** Registra valores anteriores y nuevos
- **DELETE:** Registra valores anteriores (BEFORE para capturar antes de CASCADE)

**Características:**
- ✅ Bypass RLS: `set_config('app.bypass_rls', 'true')`
- ✅ Usuario rastreado: `current_setting('app.user_id')`
- ✅ Timing BEFORE DELETE: Evita pérdida de datos por CASCADE

---

## ⚡ Triggers (5)

### Tabla `citas` (1 trigger)

| Trigger | Función | Timing | Evento | Condición | Propósito |
|---------|---------|--------|--------|-----------|-----------|
| **trigger_calcular_comision_cita** | `calcular_comision_cita()` | AFTER | UPDATE OF `estado` | `NEW.estado = 'completada' AND OLD.estado != 'completada'` | Cálculo automático de comisión |

### Tabla `configuracion_comisiones` (3 triggers)

| Trigger | Función | Timing | Evento | Propósito |
|---------|---------|--------|--------|-----------|
| **trigger_auditoria_configuracion_comisiones_after** | `auditoria_configuracion_comisiones()` | AFTER | INSERT OR UPDATE | Auditoría INSERT/UPDATE |
| **trigger_auditoria_configuracion_comisiones_before** | `auditoria_configuracion_comisiones()` | BEFORE | DELETE | Auditoría DELETE (antes de CASCADE) |
| **trigger_actualizar_timestamp_configuracion_comisiones** | `actualizar_timestamp()` | BEFORE | UPDATE | Actualizar `actualizado_en` |

### Tabla `comisiones_profesionales` (1 trigger)

| Trigger | Función | Timing | Evento | Propósito |
|---------|---------|--------|--------|-----------|
| **trigger_actualizar_timestamp_comisiones_profesionales** | `actualizar_timestamp()` | BEFORE | UPDATE | Actualizar `actualizado_en` |

**Nota:** `actualizar_timestamp()` es función global del módulo núcleo, reutilizada aquí.

---

## 🔄 Integración con Otros Módulos

### Dependencias (FK)

```
configuracion_comisiones
├── organizaciones (organizacion_id)
├── profesionales (profesional_id)
├── servicios (servicio_id) → NULL permitido (configuración global)
└── usuarios (creado_por)

comisiones_profesionales
├── organizaciones (organizacion_id)
├── profesionales (profesional_id)
├── citas (cita_id, fecha_cita) → FK compuesta a tabla particionada
└── usuarios (pagado_por)

historial_configuracion_comisiones
├── organizaciones (organizacion_id)
├── configuracion_comisiones (configuracion_id) → NULL si DELETE
└── usuarios (modificado_por)
```

### Módulos que usan comisiones

- **Módulo Citas:**
  - Trigger `calcular_comision_cita()` se dispara al completar cita
  - FK compuesta `(cita_id, fecha_cita)` requiere ambas columnas

- **Backend API:**
  - 12 endpoints REST (dashboard, configuración, pagos, reportes)
  - Filtrado adicional por rol (empleado solo ve sus comisiones)

- **Frontend React:**
  - 3 páginas: Dashboard, Configuración, Reportes
  - Chart.js para gráficas (Bar graph con datos diarios)
  - Exportación CSV/JSON

---

## 🎯 Casos de Uso

### 1. Configurar Comisión Global

**Escenario:** 15% de comisión para todos los servicios del profesional.

```sql
-- Backend: POST /api/v1/comisiones/configuracion
INSERT INTO configuracion_comisiones (
    organizacion_id,
    profesional_id,
    servicio_id,  -- NULL = global
    tipo_comision,
    valor_comision,
    activo
) VALUES (
    1,  -- organizacion_id (RLS lo valida)
    5,  -- profesional_id
    NULL,  -- ⚠️ NULL = configuración global
    'porcentaje',
    15.00,
    true
);
```

---

### 2. Configurar Comisión Específica

**Escenario:** $50 fijos solo para corte VIP (servicio ID=10), sobrescribe global.

```sql
-- Backend: POST /api/v1/comisiones/configuracion
INSERT INTO configuracion_comisiones (
    organizacion_id,
    profesional_id,
    servicio_id,  -- Específico
    tipo_comision,
    valor_comision
) VALUES (
    1,
    5,
    10,  -- ⚠️ Específico para servicio ID=10
    'monto_fijo',
    50.00
);

-- Prioridad: Específica (servicio_id=10) > Global (servicio_id=NULL)
```

---

### 3. Completar Cita → Cálculo Automático

**Escenario:** Cita con 2 servicios (corte $150 + barba $80) se completa.

```sql
-- Backend: PATCH /api/v1/citas/:id/completar
-- Internamente ejecuta:
UPDATE citas SET estado = 'completada' WHERE id = 123;

-- ⚡ Trigger automático:
-- 1. Obtiene servicios de cita ID=123
-- 2. Busca config profesional (global 15%)
-- 3. Calcula comisiones:
--    - Corte: $150 * 0.15 = $22.50
--    - Barba: $80 * 0.15 = $12.00
-- 4. Inserta comisión:

INSERT INTO comisiones_profesionales (
    organizacion_id,
    profesional_id,
    cita_id,
    fecha_cita,
    monto_base,
    tipo_comision,
    valor_comision,
    monto_comision,
    detalle_servicios,
    estado_pago
) VALUES (
    1,
    5,
    123,
    '2025-11-17',
    230.00,  -- $150 + $80
    'porcentaje',
    15.00,
    34.50,  -- $22.50 + $12.00
    '[{...}, {...}]',  -- Detalle JSONB
    'pendiente'
);
```

---

### 4. Marcar Comisión como Pagada

**Escenario:** Admin paga comisión y registra el pago.

```sql
-- Backend: PATCH /api/v1/comisiones/:id/pagar
UPDATE comisiones_profesionales
SET
    estado_pago = 'pagada',
    fecha_pago = '2025-11-20',
    metodo_pago = 'transferencia',
    referencia_pago = 'TRF-2025-001',
    pagado_por = 2  -- user_id del admin
WHERE id = 10;

-- ⚡ Trigger automático: actualiza 'actualizado_en'
```

---

### 5. Reportes con JSONB

**Escenario:** Obtener comisiones generadas por un servicio específico.

```sql
-- Backend: GET /api/v1/comisiones/reporte?servicio_id=10

-- Query optimizada con índice GIN:
SELECT
    id,
    profesional_id,
    monto_comision,
    detalle_servicios
FROM comisiones_profesionales
WHERE organizacion_id = 1  -- RLS
  AND detalle_servicios @> '[{"servicio_id": 10}]'::jsonb  -- ⚡ GIN index
  AND estado_pago = 'pendiente';

-- Plan: Bitmap Heap Scan → Bitmap Index Scan on idx_comisiones_detalle_servicios
```

---

## 🧪 Testing

### Validaciones de Integridad

```sql
-- 1. Configuración global auto-aplica a todos los servicios
INSERT INTO configuracion_comisiones (..., servicio_id, ...) VALUES (..., NULL, ...);
-- Resultado: Se aplica a TODOS los servicios del profesional

-- 2. Configuración específica sobrescribe global
-- Global: 15% para todos
-- Específica: $50 para servicio ID=10
-- Resultado: Servicio ID=10 usa $50, resto usa 15%

-- 3. Comisión se crea solo al completar (anti-duplicados)
UPDATE citas SET estado = 'completada' WHERE id = 123;
-- Primera vez: Crea comisión
UPDATE citas SET estado = 'completada' WHERE id = 123;
-- Segunda vez: NO crea (EXISTS valida)

-- 4. FK compuesta a tabla particionada
INSERT INTO comisiones_profesionales (cita_id, fecha_cita, ...)
VALUES (123, '2025-11-17', ...);  -- ✅ Requiere ambas columnas
```

### Performance Testing

```sql
-- 1. Index-only scan en covering index
EXPLAIN ANALYZE
SELECT profesional_id, monto_comision, tipo_comision
FROM comisiones_profesionales
WHERE creado_en BETWEEN '2025-11-01' AND '2025-11-30'
  AND estado_pago = 'pendiente';
-- Plan: Index Only Scan using idx_comisiones_fecha_estado_covering

-- 2. GIN index en JSONB
EXPLAIN ANALYZE
SELECT * FROM comisiones_profesionales
WHERE detalle_servicios @> '[{"servicio_id": 10}]'::jsonb;
-- Plan: Bitmap Index Scan on idx_comisiones_detalle_servicios

-- 3. Anti-duplicados con índice
EXPLAIN ANALYZE
SELECT 1 FROM comisiones_profesionales WHERE cita_id = 123;
-- Plan: Index Only Scan using idx_comisiones_cita
```

---

## 📝 Notas de Migración

### Cambios desde Arquitectura Legacy

**Antes (schema/):**
- ✅ Funciones en `02-functions.sql` (líneas 738-1031)
- ✅ Tablas en `06-operations-tables.sql` (líneas 449-575)
- ✅ Índices en `07-indexes.sql` (líneas 778-953)
- ✅ RLS en `08-rls-policies.sql` (líneas 586-674)
- ✅ Triggers en `09-triggers.sql` (líneas 224-288)

**Después (comisiones/):**
- ✅ Módulo independiente y autocontenido
- ✅ 5 archivos especializados
- ✅ Código legacy comentado con markers

### Archivos Legacy Afectados

```
sql/schema/02-functions.sql        → 3 funciones comentadas (líneas 738-1031)
sql/schema/06-operations-tables.sql → 3 tablas comentadas (líneas 449-575)
sql/schema/07-indexes.sql          → 10 índices comentados (líneas 778-953)
sql/schema/08-rls-policies.sql     → 4 políticas comentadas (líneas 586-674)
sql/schema/09-triggers.sql         → 5 triggers comentados (líneas 224-288)
```

**Markers de migración:**
```sql
-- ⚠️  MIGRADO A comisiones/01-tablas.sql
-- ⚠️  MIGRADO A comisiones/02-indices.sql
-- ⚠️  MIGRADO A comisiones/03-rls-policies.sql
-- ⚠️  MIGRADO A comisiones/04-funciones.sql
-- ⚠️  MIGRADO A comisiones/05-triggers.sql
```

### Validación Post-Migración

```bash
# 1. Inicializar base de datos
bash init-data.sh

# 2. Verificar logs de carga
# ✅ "💵 MÓDULO: Comisiones (nueva estructura modular)"
# ✅ "📋 Tablas comisiones (3 tablas)..."
# ✅ "📊 Índices especializados (10 índices)..."

# 3. Contar objetos
psql -U admin -d postgres -c "
SELECT COUNT(*) FROM pg_indexes
WHERE tablename IN ('configuracion_comisiones', 'comisiones_profesionales', 'historial_configuracion_comisiones');
"
-- Resultado esperado: 10 índices

psql -U admin -d postgres -c "
SELECT COUNT(*) FROM pg_policies
WHERE tablename IN ('configuracion_comisiones', 'comisiones_profesionales', 'historial_configuracion_comisiones');
"
-- Resultado esperado: 4 políticas

# 4. Validar trigger en tabla citas
psql -U admin -d postgres -c "
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'citas'::regclass
  AND tgname = 'trigger_calcular_comision_cita';
"
-- Resultado esperado: 1 trigger
```

---

## 🚀 Backend y Frontend

### Endpoints Backend (12)

```javascript
// Dashboard (3)
GET  /api/v1/comisiones/dashboard              // Métricas + gráficas
GET  /api/v1/comisiones/estadisticas           // Stats básicas
GET  /api/v1/comisiones/grafica/por-dia        // Datos Chart.js

// Configuración (4)
POST   /api/v1/comisiones/configuracion        // Crear/actualizar
GET    /api/v1/comisiones/configuracion        // Listar
DELETE /api/v1/comisiones/configuracion/:id    // Eliminar
GET    /api/v1/comisiones/configuracion/historial // Auditoría

// Consultas y Pagos (4)
GET   /api/v1/comisiones/profesional/:id       // Por profesional
GET   /api/v1/comisiones/periodo               // Por fechas (reportes)
PATCH /api/v1/comisiones/:id/pagar             // Marcar como pagada
GET   /api/v1/comisiones/:id                   // Detalle individual

// Reportes (1)
GET /api/v1/comisiones/reporte                 // Generar reporte
```

### Rutas Frontend (3)

```javascript
/comisiones                   // Dashboard con Chart.js (Bar graph)
/comisiones/configuracion     // CRUD configuración por profesional/servicio
/comisiones/reportes          // Filtros + exportación CSV/JSON + detalle JSONB
```

**Acceso:** Rol `admin` o `propietario`

### Características Frontend

- ✅ Dashboard con Chart.js (gráfica de barras diaria)
- ✅ Configuración con modal CRUD (TanStack Query)
- ✅ Reportes con filtros avanzados y exportación
- ✅ **NO usar `JSON.parse()`**: JSONB ya viene parseado
- ✅ Validación Zod + sanitización de parámetros
- ✅ 11 hooks TanStack Query con cache inteligente

---

## 💡 Mejores Prácticas

### 1. Configuración

✅ **Crear global primero:**
```sql
-- Paso 1: Configuración global (fallback)
INSERT INTO configuracion_comisiones (profesional_id, servicio_id, tipo_comision, valor_comision)
VALUES (5, NULL, 'porcentaje', 15.00);

-- Paso 2: Configuraciones específicas (opcional, sobrescriben global)
INSERT INTO configuracion_comisiones (profesional_id, servicio_id, tipo_comision, valor_comision)
VALUES (5, 10, 'monto_fijo', 50.00);
```

### 2. Consulta JSONB

✅ **Frontend NO parsea:**
```javascript
// ❌ INCORRECTO
const detalle = JSON.parse(comision.detalle_servicios);

// ✅ CORRECTO
const detalle = comision.detalle_servicios;  // Ya es objeto
```

### 3. Reportes Eficientes

✅ **Usar covering index:**
```sql
-- Query optimizada (index-only scan)
SELECT profesional_id, monto_comision, tipo_comision
FROM comisiones_profesionales
WHERE creado_en BETWEEN ? AND ?
  AND estado_pago = 'pendiente';
```

### 4. Auditoría

✅ **Rastrear cambios:**
```sql
-- Ver historial de cambios de un profesional
SELECT
    accion,
    tipo_comision_anterior,
    tipo_comision_nuevo,
    modificado_por,
    modificado_en
FROM historial_configuracion_comisiones
WHERE profesional_id = 5
ORDER BY modificado_en DESC;
```

---

## 🔧 Troubleshooting

### "Comisión no se generó al completar cita"

**Causa posible:**
1. No existe configuración de comisión (ni específica ni global)
2. Configuración está inactiva (`activo = FALSE`)
3. Ya existe comisión para esa cita (anti-duplicados)

**Solución:**
```sql
-- Verificar configuración
SELECT * FROM configuracion_comisiones
WHERE profesional_id = ?
  AND activo = TRUE;

-- Verificar si ya existe comisión
SELECT * FROM comisiones_profesionales WHERE cita_id = ?;
```

### "FK violation al insertar comisión"

**Causa:** FK compuesta requiere ambas columnas (`cita_id` + `fecha_cita`)

**Solución:**
```sql
-- ❌ INCORRECTO
INSERT INTO comisiones_profesionales (cita_id, ...)
VALUES (123, ...);

-- ✅ CORRECTO
INSERT INTO comisiones_profesionales (cita_id, fecha_cita, ...)
VALUES (123, '2025-11-17', ...);
```

### "JSON parse error en frontend"

**Causa:** Intentar parsear JSONB que ya es objeto

**Solución:**
```javascript
// ❌ INCORRECTO
const detalle = JSON.parse(comision.detalle_servicios);

// ✅ CORRECTO
const detalle = comision.detalle_servicios;
```

---

## 📚 Referencias

- [PostgreSQL JSONB](https://www.postgresql.org/docs/17/datatype-json.html)
- [GIN Indexes](https://www.postgresql.org/docs/17/gin.html)
- [Covering Indexes](https://www.postgresql.org/docs/17/indexes-index-only-scans.html)
- [Trigger Functions](https://www.postgresql.org/docs/17/plpgsql-trigger.html)

---

**Autor:** Sistema de Migración Modular
**Última actualización:** 17 Noviembre 2025
**Validado:** 2 citas completadas con comisiones generadas automáticamente
**Licencia:** Propietaria - SaaS Agendamiento
