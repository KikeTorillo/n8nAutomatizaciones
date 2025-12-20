# Plan de Desarrollo: Correcciones BD + Custom Fields + Notificaciones

**Fecha:** Diciembre 2025
**Estado:** Fase 2 Completada - Fase 3 Pendiente
**Prioridad:** Alta
**Ultima Auditoria:** 19 Diciembre 2025
**Ultima Actualizacion:** 20 Diciembre 2025

---

## Resumen Ejecutivo

Este plan comprende tres fases de desarrollo:

1. **Fase 1 - Correcciones de Auditoría BD**: Resolver hallazgos de la auditoría de base de datos (FK faltantes, índices, particionamiento).
2. **Fase 2 - Custom Fields**: Permite a cada organización definir campos personalizados sin modificar el esquema.
3. **Fase 3 - Notificaciones Persistentes**: Centro de notificaciones in-app con historial, estados de lectura y acciones.

---

## FASE 1: Correcciones de Auditoría de Base de Datos

**Prioridad:** ALTA (Ejecutar antes de cualquier nueva funcionalidad)
**Estimación:** 2-4 horas

### 1.1 Hallazgos de la Auditoría (19 Dic 2025)

| # | Severidad | Hallazgo | Archivo Afectado |
|---|-----------|----------|------------------|
| 1 | 🔴 ALTA | FK faltante en `profesionales.organizacion_id` | `sql/profesionales/01-tablas.sql:29` |
| 2 | 🟡 MEDIA | `movimientos_inventario` no está particionada | `sql/inventario/01-tablas.sql:194` |
| 3 | 🟡 MEDIA | Falta índice en `eventos_digitales.fecha_evento` | `sql/eventos-digitales/03-indices.sql` |
| 4 | 🟢 BAJA | Índice potencialmente duplicado en citas | `sql/citas/03-indices.sql` |
| 5 | 🟢 BAJA | Validación de colores hex inconsistente | Varios archivos |

### 1.2 Corrección 1: FK en profesionales.organizacion_id

**Archivo:** `sql/profesionales/01-tablas.sql`

```sql
-- ANTES (línea 29):
organizacion_id INTEGER NOT NULL,  -- FK obligatoria a organizaciones

-- DESPUÉS:
organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
```

**Archivo alternativo (si tabla ya existe):** Crear `sql/profesionales/06-foreign-keys.sql`

```sql
-- ====================================================================
-- MÓDULO PROFESIONALES: FOREIGN KEYS DIFERIDAS
-- ====================================================================
-- FK que se agrega después de la creación inicial de tablas
-- Fecha: Diciembre 2025
-- ====================================================================

-- FK: profesionales.organizacion_id → organizaciones.id
ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_organizacion
FOREIGN KEY (organizacion_id) REFERENCES organizaciones(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_profesionales_organizacion ON profesionales IS
'FK multi-tenant obligatoria. CASCADE en DELETE elimina profesionales al eliminar org.';
```

### 1.3 Corrección 2: Particionamiento de movimientos_inventario

**Archivo:** `sql/inventario/06-particionamiento.sql` (actualizar o crear)

```sql
-- ====================================================================
-- MÓDULO INVENTARIO: PARTICIONAMIENTO
-- ====================================================================
-- Convierte movimientos_inventario a tabla particionada por mes
-- Mejora 10x+ en queries históricas
-- Fecha: Diciembre 2025
-- ====================================================================

-- Paso 1: Renombrar tabla original
ALTER TABLE movimientos_inventario RENAME TO movimientos_inventario_old;

-- Paso 2: Crear tabla particionada
CREATE TABLE movimientos_inventario (
    id SERIAL,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN (
        'entrada_compra', 'entrada_devolucion', 'entrada_ajuste',
        'salida_venta', 'salida_uso_servicio', 'salida_merma',
        'salida_robo', 'salida_devolucion', 'salida_ajuste'
    )),

    cantidad INTEGER NOT NULL CHECK (cantidad != 0),
    stock_antes INTEGER NOT NULL,
    stock_despues INTEGER NOT NULL,
    costo_unitario DECIMAL(10, 2),
    valor_total DECIMAL(10, 2),

    proveedor_id INTEGER REFERENCES proveedores(id),
    venta_pos_id INTEGER,
    cita_id INTEGER,
    usuario_id INTEGER REFERENCES usuarios(id),

    referencia VARCHAR(100),
    motivo TEXT,
    fecha_vencimiento DATE,
    lote VARCHAR(50),

    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CHECK ((tipo_movimiento LIKE 'entrada%' AND cantidad > 0) OR
           (tipo_movimiento LIKE 'salida%' AND cantidad < 0)),
    CHECK (stock_despues = stock_antes + cantidad),
    CHECK (stock_despues >= 0),

    -- PK compuesta para particionamiento
    PRIMARY KEY (id, creado_en)
) PARTITION BY RANGE (creado_en);

-- Paso 3: Crear particiones iniciales
CREATE TABLE movimientos_inventario_2025_11 PARTITION OF movimientos_inventario
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE movimientos_inventario_2025_12 PARTITION OF movimientos_inventario
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE movimientos_inventario_2026_01 PARTITION OF movimientos_inventario
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Paso 4: Migrar datos existentes
INSERT INTO movimientos_inventario
SELECT * FROM movimientos_inventario_old;

-- Paso 5: Eliminar tabla vieja (después de verificar migración)
-- DROP TABLE movimientos_inventario_old;

COMMENT ON TABLE movimientos_inventario IS
'Kardex de movimientos de inventario. Particionada por creado_en (mensual).';
```

### 1.4 Corrección 3: Índice para eventos_digitales.fecha_evento

**Archivo:** `sql/eventos-digitales/03-indices.sql` (agregar al final)

```sql
-- ====================================================================
-- ÍNDICE: CONSULTAS POR FECHA DE EVENTO
-- ====================================================================
-- Propósito: Optimizar consultas de eventos por rango de fechas
-- Uso: Dashboard, calendario, listados
-- ====================================================================

CREATE INDEX idx_eventos_digitales_fecha
    ON eventos_digitales (organizacion_id, fecha_evento)
    WHERE eliminado_en IS NULL AND estado != 'cancelado';

CREATE INDEX idx_eventos_digitales_fecha_rango
    ON eventos_digitales (organizacion_id, fecha_evento, estado)
    INCLUDE (nombre, tipo, slug)
    WHERE eliminado_en IS NULL;

COMMENT ON INDEX idx_eventos_digitales_fecha IS
'Índice para consultas de eventos por fecha. Excluye cancelados y eliminados.';

COMMENT ON INDEX idx_eventos_digitales_fecha_rango IS
'Covering index para listados de eventos. Include evita acceso al heap.';
```

### 1.5 Corrección 4: Eliminar Índice Duplicado (Opcional)

**Archivo:** `sql/citas/03-indices.sql`

```sql
-- EVALUAR: idx_citas_org_fecha puede ser redundante
-- idx_citas_organizacion_fecha ya cubre (organizacion_id, fecha_cita, hora_inicio)
--
-- Si se confirma que no hay queries que usen SOLO (organizacion_id, fecha_cita):
-- DROP INDEX idx_citas_org_fecha;
--
-- NOTA: Verificar con EXPLAIN ANALYZE antes de eliminar
```

### 1.6 Corrección 5: Unificar Validación de Colores

**Archivo nuevo:** `sql/core/fundamentos/04-constraints-comunes.sql`

```sql
-- ====================================================================
-- CONSTRAINTS COMUNES: VALIDACIONES REUTILIZABLES
-- ====================================================================
-- Patrón unificado para validaciones que se repiten en múltiples tablas
-- Fecha: Diciembre 2025
-- ====================================================================

-- Función para validar color hexadecimal (case-insensitive)
CREATE OR REPLACE FUNCTION is_valid_hex_color(color VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN color IS NULL OR color ~* '^#[0-9A-F]{6}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_valid_hex_color IS
'Valida que un color esté en formato hexadecimal #RRGGBB (case-insensitive).
Usado en: profesionales.color_calendario, servicios.color_servicio, categorias_productos.color';

-- NOTA: Actualizar los CHECKs existentes en futuras migraciones para usar esta función
-- Ejemplo: CHECK (is_valid_hex_color(color))
```

### 1.7 Plan de Ejecución Fase 1

| Paso | Tarea | Archivo | Verificación |
|------|-------|---------|--------------|
| 1 | Agregar FK profesionales | `profesionales/01-tablas.sql` o nuevo archivo | `\d profesionales` muestra FK |
| 2 | Crear particiones inventario | `inventario/06-particionamiento.sql` | `\d+ movimientos_inventario` |
| 3 | Agregar índices eventos | `eventos-digitales/03-indices.sql` | `\di idx_eventos*` |
| 4 | Evaluar índice duplicado | N/A | EXPLAIN ANALYZE queries |
| 5 | Crear función color | `core/fundamentos/04-constraints-comunes.sql` | `\df is_valid_hex_color` |

### 1.8 Script de Verificación Post-Correcciones

```sql
-- Verificar FK en profesionales
SELECT conname, contype, confrelid::regclass
FROM pg_constraint
WHERE conrelid = 'profesionales'::regclass AND contype = 'f';

-- Verificar particionamiento de movimientos_inventario
SELECT relname, relkind
FROM pg_class
WHERE relname LIKE 'movimientos_inventario%';

-- Verificar índices de eventos_digitales
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'eventos_digitales';

-- Contar registros migrados (si aplica)
SELECT COUNT(*) FROM movimientos_inventario;
```

---

## FASE 2: Sistema de Custom Fields

### 2.1 Problema que Resuelve

Cada organización tiene necesidades únicas de datos:

| Tipo de Negocio | Campos Necesarios en Clientes |
|-----------------|-------------------------------|
| Clínica Dental | Número de seguro, Aseguradora, Alergias, Última radiografía |
| Salón de Belleza | Tipo de cabello, Color actual, Alergia a tintes |
| Gimnasio | Objetivo fitness, Lesiones previas, Fecha última evaluación |
| Veterinaria | Nombre mascota, Especie, Raza, Vacunas |

**Sin custom fields:**
- Agregar columnas para todos = desperdicio y complejidad
- Campo JSONB genérico = sin validación, búsqueda ineficiente, UI manual

### 2.2 Entidades Soportadas

```
custom_fields aplica a:
├── clientes
├── profesionales
├── servicios
├── productos
├── citas
├── eventos_digitales
└── invitados_evento
```

### 2.3 Tipos de Datos Soportados

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `texto` | Campo de texto libre | "Número de seguro" |
| `texto_largo` | Textarea multilínea | "Notas médicas" |
| `numero` | Valor numérico | "Peso (kg)" |
| `fecha` | Selector de fecha | "Última visita" |
| `hora` | Selector de hora | "Hora preferida" |
| `booleano` | Switch on/off | "Alergia a tintes" |
| `select` | Dropdown único | "Tipo de cabello" |
| `multiselect` | Selección múltiple | "Servicios de interés" |
| `email` | Email con validación | "Email secundario" |
| `telefono` | Teléfono con formato | "Teléfono emergencia" |
| `url` | URL con validación | "Perfil Instagram" |
| `archivo` | Upload de archivo | "Foto antes/después" |

### 2.4 Diseño de Base de Datos

#### Tabla: `custom_fields_definiciones`

```sql
CREATE TABLE custom_fields_definiciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    entidad_tipo VARCHAR(50) NOT NULL,  -- 'cliente', 'profesional', 'servicio', etc.
    nombre VARCHAR(100) NOT NULL,        -- "Número de seguro médico"
    nombre_clave VARCHAR(50) NOT NULL,   -- "numero_seguro" (slug para API)
    descripcion TEXT,                    -- Tooltip/ayuda para el usuario

    -- Configuración del campo
    tipo_dato VARCHAR(30) NOT NULL,      -- 'texto', 'numero', 'fecha', 'select', etc.
    opciones JSONB DEFAULT '[]',         -- Para select/multiselect: ["Opción 1", "Opción 2"]
    valor_default JSONB,                 -- Valor por defecto (tipado según tipo_dato)
    placeholder VARCHAR(200),            -- Placeholder del input

    -- Validaciones
    requerido BOOLEAN DEFAULT FALSE,
    longitud_minima INTEGER,             -- Para texto
    longitud_maxima INTEGER,             -- Para texto
    valor_minimo NUMERIC,                -- Para número
    valor_maximo NUMERIC,                -- Para número
    patron_regex VARCHAR(500),           -- Validación personalizada
    mensaje_error VARCHAR(200),          -- Mensaje de error personalizado

    -- UI/UX
    visible_en_formulario BOOLEAN DEFAULT TRUE,
    visible_en_listado BOOLEAN DEFAULT FALSE,
    orden INTEGER DEFAULT 0,
    seccion VARCHAR(100),                -- Agrupar campos: "Datos médicos", "Preferencias"
    ancho_columnas INTEGER DEFAULT 12,   -- Grid: 6 = mitad, 12 = completo

    -- Control
    activo BOOLEAN DEFAULT TRUE,
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_campo_por_entidad UNIQUE (organizacion_id, entidad_tipo, nombre_clave),
    CONSTRAINT valid_entidad_tipo CHECK (entidad_tipo IN (
        'cliente', 'profesional', 'servicio', 'producto',
        'cita', 'evento_digital', 'invitado_evento'
    )),
    CONSTRAINT valid_tipo_dato CHECK (tipo_dato IN (
        'texto', 'texto_largo', 'numero', 'fecha', 'hora',
        'booleano', 'select', 'multiselect', 'email', 'telefono', 'url', 'archivo'
    ))
);
```

#### Tabla: `custom_fields_valores`

```sql
CREATE TABLE custom_fields_valores (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    definicion_id INTEGER NOT NULL REFERENCES custom_fields_definiciones(id) ON DELETE CASCADE,

    -- Referencia a la entidad
    entidad_tipo VARCHAR(50) NOT NULL,   -- Redundante para performance en queries
    entidad_id INTEGER NOT NULL,          -- ID del cliente/profesional/etc.

    -- Valores tipados (solo uno tendrá valor según tipo_dato)
    valor_texto TEXT,
    valor_numero NUMERIC,
    valor_fecha DATE,
    valor_hora TIME,
    valor_booleano BOOLEAN,
    valor_json JSONB,                     -- Para multiselect y tipos complejos

    -- Archivos (si tipo = 'archivo')
    archivo_storage_id INTEGER REFERENCES archivos_storage(id),

    -- Control
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_valor_por_entidad UNIQUE (definicion_id, entidad_id)
);
```

#### Índices

```sql
-- Definiciones
CREATE INDEX idx_cf_definiciones_org_entidad
    ON custom_fields_definiciones(organizacion_id, entidad_tipo, orden)
    WHERE activo = TRUE AND eliminado_en IS NULL;

CREATE INDEX idx_cf_definiciones_busqueda
    ON custom_fields_definiciones(organizacion_id, entidad_tipo, nombre_clave)
    WHERE eliminado_en IS NULL;

-- Valores
CREATE INDEX idx_cf_valores_entidad
    ON custom_fields_valores(entidad_tipo, entidad_id);

CREATE INDEX idx_cf_valores_definicion
    ON custom_fields_valores(definicion_id);

CREATE INDEX idx_cf_valores_org_entidad
    ON custom_fields_valores(organizacion_id, entidad_tipo, entidad_id);

-- Búsqueda en valores de texto
CREATE INDEX idx_cf_valores_texto_gin
    ON custom_fields_valores USING gin(to_tsvector('spanish', valor_texto))
    WHERE valor_texto IS NOT NULL;

-- Búsqueda en valores JSON
CREATE INDEX idx_cf_valores_json_gin
    ON custom_fields_valores USING gin(valor_json)
    WHERE valor_json IS NOT NULL;
```

#### RLS Policies

```sql
ALTER TABLE custom_fields_definiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields_valores ENABLE ROW LEVEL SECURITY;

CREATE POLICY cf_definiciones_tenant ON custom_fields_definiciones
    USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

CREATE POLICY cf_valores_tenant ON custom_fields_valores
    USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);
```

### 2.5 API Endpoints

```
# Definiciones (Admin)
GET    /api/v1/custom-fields/:entidad_tipo          # Listar campos de una entidad
POST   /api/v1/custom-fields                         # Crear campo
PUT    /api/v1/custom-fields/:id                     # Actualizar campo
DELETE /api/v1/custom-fields/:id                     # Eliminar campo (soft delete)
POST   /api/v1/custom-fields/reorder                 # Reordenar campos

# Valores (CRUD de entidades)
GET    /api/v1/clientes/:id/custom-fields            # Obtener valores de un cliente
PUT    /api/v1/clientes/:id/custom-fields            # Guardar valores de un cliente
# (Mismo patrón para otras entidades)
```

### 2.6 Flujo de UI

```
┌─────────────────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN > CAMPOS PERSONALIZADOS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Clientes] [Profesionales] [Servicios] [Productos] [Citas]        │
│  ─────────                                                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  📝 Campos para Clientes                    [+ Nuevo Campo] │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  ≡  Número de seguro    │ Texto      │ Requerido │ ✏️ 🗑️  │   │
│  │  ≡  Aseguradora         │ Select     │ Requerido │ ✏️ 🗑️  │   │
│  │  ≡  Alergias            │ Texto      │           │ ✏️ 🗑️  │   │
│  │  ≡  Última radiografía  │ Fecha      │           │ ✏️ 🗑️  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  💡 Arrastra los campos para reordenar                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENTES > EDITAR CLIENTE                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ── Datos Básicos ──────────────────────────────────────────────   │
│  Nombre: [Juan Pérez________________]                               │
│  Teléfono: [+52 55 1234 5678________]                              │
│  Email: [juan@email.com_____________]                               │
│                                                                     │
│  ── Datos Médicos (Campos Personalizados) ──────────────────────   │
│  Número de seguro*: [ABC-123456_____________]                       │
│  Aseguradora*: [▼ MetLife________________]                          │
│  Alergias: [Penicilina__________________]                           │
│  Última radiografía: [📅 15/11/2025_________]                       │
│                                                                     │
│                                          [Cancelar] [Guardar]       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## FASE 3: Sistema de Notificaciones Persistentes

### 3.1 Problema que Resuelve

| Situación Actual | Con Notificaciones Persistentes |
|------------------|----------------------------------|
| Toast desaparece en 5 segundos | Historial consultable |
| Usuario no ve notificación si no está conectado | Ve al entrar |
| No hay forma de "marcar para después" | Marcar leída/no leída |
| Cada módulo implementa su lógica | Sistema centralizado |

### 3.2 Tipos de Notificaciones

| Categoría | Tipo | Ejemplo |
|-----------|------|---------|
| **Citas** | `cita_nueva` | "Juan Pérez agendó corte para mañana 10:00" |
| | `cita_cancelada` | "María García canceló su cita" |
| | `cita_modificada` | "Se cambió la hora de la cita de Pedro" |
| | `cita_recordatorio` | "Tienes 5 citas en los próximos 30 minutos" |
| **Inventario** | `stock_bajo` | "Shampoo XYZ tiene solo 3 unidades" |
| | `stock_agotado` | "Producto ABC se ha agotado" |
| | `orden_recibida` | "Orden de compra #123 fue recibida" |
| **Pagos** | `pago_recibido` | "Pago de $500 recibido" |
| | `pago_fallido` | "Falló el cobro de suscripción" |
| | `factura_generada` | "Nueva factura disponible" |
| **Reseñas** | `resena_nueva` | "Nueva reseña de 5 estrellas" |
| | `resena_negativa` | "Reseña de 2 estrellas requiere atención" |
| **Sistema** | `mantenimiento` | "Mantenimiento programado para mañana" |
| | `nueva_funcion` | "Nueva función disponible: Reportes ABC" |

### 3.3 Diseño de Base de Datos

#### Tabla: `notificaciones`

```sql
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Contenido
    tipo VARCHAR(50) NOT NULL,           -- 'cita_nueva', 'stock_bajo', etc.
    categoria VARCHAR(30) NOT NULL,      -- 'citas', 'inventario', 'pagos', 'sistema'
    titulo VARCHAR(200) NOT NULL,        -- "Nueva cita agendada"
    mensaje TEXT NOT NULL,               -- "Juan Pérez agendó corte de cabello..."

    -- Presentación
    icono VARCHAR(50),                   -- 'calendar', 'alert-triangle', 'dollar-sign'
    nivel VARCHAR(20) DEFAULT 'info',    -- 'info', 'success', 'warning', 'error'
    imagen_url TEXT,                     -- Avatar o imagen relacionada

    -- Estado
    leida BOOLEAN DEFAULT FALSE,
    leida_en TIMESTAMPTZ,
    archivada BOOLEAN DEFAULT FALSE,
    archivada_en TIMESTAMPTZ,

    -- Acción
    accion_url TEXT,                     -- "/citas/123" - URL al hacer clic
    accion_texto VARCHAR(50),            -- "Ver cita" - Texto del botón
    accion_datos JSONB,                  -- Datos adicionales para la acción

    -- Referencia a entidad origen
    entidad_tipo VARCHAR(50),            -- 'cita', 'cliente', 'producto'
    entidad_id INTEGER,                  -- ID de la entidad relacionada

    -- Control
    expira_en TIMESTAMPTZ,               -- Auto-archivar después de esta fecha
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_nivel CHECK (nivel IN ('info', 'success', 'warning', 'error')),
    CONSTRAINT valid_categoria CHECK (categoria IN (
        'citas', 'inventario', 'pagos', 'clientes', 'profesionales',
        'marketplace', 'sistema', 'eventos'
    ))
);

-- Tabla para preferencias de notificación por usuario
CREATE TABLE notificaciones_preferencias (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    tipo_notificacion VARCHAR(50) NOT NULL,  -- 'cita_nueva', 'stock_bajo', etc.

    -- Canales habilitados
    in_app BOOLEAN DEFAULT TRUE,
    email BOOLEAN DEFAULT FALSE,
    push BOOLEAN DEFAULT FALSE,
    whatsapp BOOLEAN DEFAULT FALSE,

    -- Control
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_preferencia UNIQUE (usuario_id, tipo_notificacion)
);
```

#### Índices

```sql
-- Notificaciones principales
CREATE INDEX idx_notificaciones_usuario_no_leidas
    ON notificaciones(usuario_id, leida, creado_en DESC)
    WHERE leida = FALSE AND archivada = FALSE;

CREATE INDEX idx_notificaciones_usuario_feed
    ON notificaciones(usuario_id, creado_en DESC)
    WHERE archivada = FALSE;

CREATE INDEX idx_notificaciones_tipo
    ON notificaciones(organizacion_id, tipo, creado_en DESC);

CREATE INDEX idx_notificaciones_entidad
    ON notificaciones(entidad_tipo, entidad_id)
    WHERE entidad_id IS NOT NULL;

-- Para limpieza automática
CREATE INDEX idx_notificaciones_expiracion
    ON notificaciones(expira_en)
    WHERE expira_en IS NOT NULL AND archivada = FALSE;

-- Preferencias
CREATE INDEX idx_notif_prefs_usuario
    ON notificaciones_preferencias(usuario_id);
```

#### RLS Policies

```sql
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones_preferencias ENABLE ROW LEVEL SECURITY;

-- Usuario solo ve sus propias notificaciones
CREATE POLICY notificaciones_usuario ON notificaciones
    USING (usuario_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY notif_prefs_usuario ON notificaciones_preferencias
    USING (usuario_id = current_setting('app.current_user_id')::INTEGER);
```

### 3.4 API Endpoints

```
# Notificaciones
GET    /api/v1/notificaciones                        # Listar notificaciones del usuario
GET    /api/v1/notificaciones/count                  # Contador de no leídas
PUT    /api/v1/notificaciones/:id/leer               # Marcar como leída
PUT    /api/v1/notificaciones/leer-todas             # Marcar todas como leídas
PUT    /api/v1/notificaciones/:id/archivar           # Archivar notificación
DELETE /api/v1/notificaciones/:id                    # Eliminar notificación

# Preferencias
GET    /api/v1/notificaciones/preferencias           # Obtener preferencias
PUT    /api/v1/notificaciones/preferencias           # Actualizar preferencias
```

### 3.5 Servicio de Notificaciones (Backend)

```javascript
// services/NotificacionesService.js

class NotificacionesService {

  /**
   * Crear notificación para un usuario
   */
  async crear({
    organizacionId,
    usuarioId,
    tipo,
    categoria,
    titulo,
    mensaje,
    nivel = 'info',
    accionUrl = null,
    entidadTipo = null,
    entidadId = null
  }) {
    // Verificar preferencias del usuario
    const prefiere = await this.verificarPreferencia(usuarioId, tipo);

    if (prefiere.in_app) {
      await this.crearNotificacionInApp(...);
    }

    if (prefiere.email) {
      await this.enviarEmail(...);
    }

    if (prefiere.push) {
      await this.enviarPush(...);
    }
  }

  /**
   * Notificar a múltiples usuarios (ej: todos los admins)
   */
  async notificarRol(organizacionId, rol, notificacion) {
    const usuarios = await this.obtenerUsuariosPorRol(organizacionId, rol);

    await Promise.all(
      usuarios.map(u => this.crear({ ...notificacion, usuarioId: u.id }))
    );
  }

  /**
   * Crear notificación desde evento de cita
   */
  async notificarCitaNueva(cita) {
    // Notificar al profesional
    await this.crear({
      organizacionId: cita.organizacion_id,
      usuarioId: cita.profesional.usuario_id,
      tipo: 'cita_nueva',
      categoria: 'citas',
      titulo: 'Nueva cita agendada',
      mensaje: `${cita.cliente.nombre} agendó ${cita.servicio.nombre} para ${formatDate(cita.fecha)}`,
      nivel: 'info',
      accionUrl: `/citas/${cita.id}`,
      entidadTipo: 'cita',
      entidadId: cita.id
    });
  }
}
```

### 3.6 Flujo de UI

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header                                              🔔 (3) 👤      │
├─────────────────────────────────────────────────────────────────────┤
                                                         │
                                    ┌────────────────────▼───────────┐
                                    │  Notificaciones                │
                                    ├────────────────────────────────┤
                                    │  [Todas] [No leídas] [⚙️]      │
                                    ├────────────────────────────────┤
                                    │  ● 📅 Nueva cita agendada      │
                                    │    Juan Pérez - Corte          │
                                    │    Mañana 10:00 AM             │
                                    │    Hace 5 min         [Ver →]  │
                                    ├────────────────────────────────┤
                                    │  ● ⚠️ Stock bajo               │
                                    │    Shampoo XYZ: 3 unidades     │
                                    │    Hace 1 hora        [Ver →]  │
                                    ├────────────────────────────────┤
                                    │  ○ ⭐ Nueva reseña             │
                                    │    5 estrellas de María        │
                                    │    Ayer              [Ver →]   │
                                    ├────────────────────────────────┤
                                    │        [Ver todas →]           │
                                    └────────────────────────────────┘
```

---

## 4. Plan de Implementación General

### 4.1 Archivos SQL a Crear

```
sql/custom-fields/
├── 01-tablas.sql              # Tablas de definiciones y valores
├── 02-indices.sql             # Índices optimizados
├── 03-rls.sql                 # Políticas RLS
├── 04-funciones.sql           # Funciones helper
└── 05-triggers.sql            # Triggers de validación

sql/notificaciones/
├── 01-tablas.sql              # Tablas de notificaciones y preferencias
├── 02-indices.sql             # Índices optimizados
├── 03-rls.sql                 # Políticas RLS
├── 04-funciones.sql           # Funciones de creación
└── 05-triggers.sql            # Triggers automáticos
```

### 4.2 Módulos Backend a Crear

```
backend/app/modules/
├── custom-fields/
│   ├── custom-fields.routes.js
│   ├── custom-fields.controller.js
│   ├── custom-fields.service.js
│   └── custom-fields.model.js
│
└── notificaciones/
    ├── notificaciones.routes.js
    ├── notificaciones.controller.js
    ├── notificaciones.service.js
    └── notificaciones.model.js
```

### 4.3 Componentes Frontend a Crear

```
frontend/src/
├── components/
│   ├── custom-fields/
│   │   ├── CustomFieldsBuilder.jsx      # Editor de campos (admin)
│   │   ├── CustomFieldsForm.jsx         # Renderizador dinámico
│   │   └── CustomFieldInput.jsx         # Input por tipo
│   │
│   └── notificaciones/
│       ├── NotificacionesBell.jsx       # Campana en header
│       ├── NotificacionesDropdown.jsx   # Dropdown de notificaciones
│       ├── NotificacionItem.jsx         # Item individual
│       └── NotificacionesPage.jsx       # Página completa
│
├── hooks/
│   ├── useCustomFields.js               # Hook para custom fields
│   └── useNotificaciones.js             # Hook para notificaciones
│
└── pages/
    ├── configuracion/CustomFieldsPage.jsx
    └── NotificacionesPage.jsx
```

### 4.4 Orden de Implementación

| Fase | Paso | Tarea | Prioridad |
|------|------|-------|-----------|
| **1** | 1 | Agregar FK profesionales.organizacion_id | 🔴 ALTA |
| **1** | 2 | Agregar índices eventos_digitales | 🟡 MEDIA |
| **1** | 3 | Crear función is_valid_hex_color | 🟢 BAJA |
| **1** | 4 | (Opcional) Particionar movimientos_inventario | 🟡 MEDIA |
| **2** | 5 | Crear tablas SQL custom_fields | - |
| **2** | 6 | Backend: módulo custom-fields | - |
| **2** | 7 | Frontend: CustomFieldsBuilder | - |
| **2** | 8 | Frontend: CustomFieldsForm | - |
| **2** | 9 | Integrar custom fields en formularios existentes | - |
| **3** | 10 | Crear tablas SQL notificaciones | - |
| **3** | 11 | Backend: módulo notificaciones | - |
| **3** | 12 | Frontend: NotificacionesBell | - |
| **3** | 13 | Frontend: NotificacionesPage | - |
| **3** | 14 | Integrar notificaciones en eventos existentes | - |
| **-** | 15 | Testing y ajustes | - |

**Estimación Total:**
- **Fase 1 (Correcciones BD):** 2-4 horas
- **Fase 2 (Custom Fields):** 12-16 horas
- **Fase 3 (Notificaciones):** 10-14 horas
- **Total: 24-34 horas de desarrollo**

---

## 5. Consideraciones Técnicas

### 5.1 Performance

- **Custom Fields**: Los valores se guardan en tabla separada, JOINs optimizados con índices
- **Notificaciones**: Índices parciales para queries de "no leídas", limpieza automática con pg_cron

### 5.2 Escalabilidad

- Ambos sistemas soportan millones de registros con índices GIN
- Notificaciones antiguas se archivan automáticamente (configurable)

### 5.3 Seguridad

- RLS garantiza aislamiento multi-tenant
- Validación de tipos en backend antes de guardar
- Sanitización de valores de texto

### 5.4 Migración

- No se requiere migración de datos existentes
- Los campos personalizados son opcionales (null por defecto)
- Las notificaciones empiezan vacías

---

## 6. Próximos Pasos

### Fase 1 - Correcciones BD ✅ COMPLETADA (20 Dic 2025)
- [x] Agregar FK en profesionales.organizacion_id
- [x] Agregar índices en eventos_digitales.fecha_evento
- [x] Crear función is_valid_hex_color()
- [x] Particionar movimientos_inventario (6 meses iniciales)
- [ ] Ejecutar script de verificación post-correcciones (en deploy)

### Fase 2 - Custom Fields ✅ COMPLETADA (20 Dic 2025)
- [x] Crear estructura SQL custom-fields (5 archivos: tablas, indices, RLS, funciones, triggers)
- [x] Registrar modulo en init-data.sh
- [x] Implementar backend custom-fields (manifest, controller, routes, schemas)
- [x] Implementar frontend hooks (useCustomFields.js + endpoints)
- [x] Implementar frontend CustomFieldsBuilder + CustomFieldsForm
- [ ] Integrar en formularios existentes (pendiente: agregar a ClienteForm, ServicioForm, etc.)
- [ ] Testing

### Fase 3 - Notificaciones
- [ ] Crear estructura SQL notificaciones
- [ ] Implementar backend NotificacionesService
- [ ] Implementar frontend NotificacionesBell + NotificacionesPage
- [ ] Integrar eventos existentes (citas, inventario, etc.)
- [ ] Testing

### General
- [ ] Documentar APIs
- [ ] Deploy a staging
- [ ] Deploy a producción

---

**Autor:** Claude (Arquitecto de Software)
**Revisado por:** Pendiente
**Aprobado por:** Pendiente
