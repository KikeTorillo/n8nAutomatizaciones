# Plan: Comisiones Unificadas (Citas + POS)

**Fecha**: 30 Noviembre 2025
**Estado**: Planificación
**Autor**: Claude + Kike

---

## Resumen Ejecutivo

Extender el módulo de comisiones existente para soportar tanto **servicios (citas)** como **productos (ventas POS)**, permitiendo que los profesionales ganen comisiones por ambas actividades.

---

## Estado Actual

### Lo que YA existe

| Componente | Estado | Notas |
|------------|--------|-------|
| `configuracion_comisiones` | ✅ | Solo soporta `servicio_id` |
| `comisiones_profesionales` | ✅ | Solo soporta `cita_id` |
| Trigger citas | ✅ | `trigger_calcular_comision_cita` |
| `ventas_pos.profesional_id` | ✅ | Ya tiene el vendedor |
| `ventas_pos_items.aplica_comision` | ✅ | Campo preparado pero sin usar |

### Lo que FALTA

| Componente | Estado | Descripción |
|------------|--------|-------------|
| Config para productos | ❌ | `producto_id`, `categoria_id` en configuración |
| Trigger ventas | ❌ | Calcular comisión al completar venta |
| Campo `origen` | ❌ | Distinguir cita vs venta en comisiones |
| Backend endpoints | ❌ | CRUD para config de productos |
| Frontend UI | ❌ | Tabs Servicios/Productos en configuración |

---

## Arquitectura Propuesta

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMISIONES UNIFICADAS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   CITAS                              VENTAS POS                     │
│   ─────                              ──────────                     │
│   UPDATE estado='completada'         INSERT con estado='completada' │
│          │                                  │                       │
│          ▼                                  ▼                       │
│   trigger_calcular_comision_cita    trigger_calcular_comision_venta │
│          │                                  │                       │
│          ▼                                  ▼                       │
│   ┌─────────────────────────────────────────────────────────┐       │
│   │              configuracion_comisiones                    │       │
│   │  ┌──────────────────┬──────────────────────────────┐    │       │
│   │  │   SERVICIOS      │         PRODUCTOS            │    │       │
│   │  │  servicio_id     │  producto_id                 │    │       │
│   │  │  (NULL=global)   │  categoria_producto_id       │    │       │
│   │  │                  │  (NULL=global)               │    │       │
│   │  └──────────────────┴──────────────────────────────┘    │       │
│   └─────────────────────────────────────────────────────────┘       │
│                              │                                       │
│                              ▼                                       │
│   ┌─────────────────────────────────────────────────────────┐       │
│   │              comisiones_profesionales                    │       │
│   │  origen: 'cita' | 'venta'                               │       │
│   │  cita_id (nullable) ──► detalle_servicios               │       │
│   │  venta_id (nullable) ──► detalle_productos              │       │
│   └─────────────────────────────────────────────────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Prioridad de Configuración (Cascada)

**Para Servicios:**
```
1. servicio_id = X (específico)
2. servicio_id = NULL, aplica_a IN ('servicio', 'ambos') (global)
3. Sin comisión
```

**Para Productos:**
```
1. producto_id = X (específico)
2. categoria_producto_id = X (por categoría)
3. producto_id = NULL, categoria_producto_id = NULL, aplica_a IN ('producto', 'ambos') (global)
4. Sin comisión
```

---

## Cambios en Base de Datos

### 1. Modificar `configuracion_comisiones`

**Archivo**: `sql/comisiones/01-tablas.sql`

```sql
CREATE TABLE configuracion_comisiones (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- 🎯 SCOPE DE APLICACIÓN (servicios o productos)
    aplica_a VARCHAR(20) DEFAULT 'servicio' CHECK (aplica_a IN ('servicio', 'producto', 'ambos')),

    -- 📋 PARA SERVICIOS
    servicio_id INTEGER REFERENCES servicios(id) ON DELETE CASCADE,

    -- 📦 PARA PRODUCTOS (NUEVO)
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    categoria_producto_id INTEGER REFERENCES categorias_productos(id) ON DELETE CASCADE,

    -- ⚙️ CONFIGURACIÓN DE COMISIÓN
    tipo_comision VARCHAR(20) NOT NULL CHECK (tipo_comision IN ('porcentaje', 'monto_fijo')),
    valor_comision DECIMAL(10, 2) NOT NULL CHECK (valor_comision >= 0),
    activo BOOLEAN DEFAULT true,

    -- 📝 METADATA
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    -- ✅ CONSTRAINTS
    -- Unique por profesional + scope específico
    UNIQUE(organizacion_id, profesional_id, servicio_id, producto_id, categoria_producto_id),

    -- Porcentaje máximo 100%
    CHECK (
        (tipo_comision = 'porcentaje' AND valor_comision <= 100) OR
        (tipo_comision = 'monto_fijo')
    ),

    -- Mutual exclusivity: servicio XOR producto XOR categoría XOR global
    CHECK (
        (servicio_id IS NOT NULL AND producto_id IS NULL AND categoria_producto_id IS NULL AND aplica_a = 'servicio') OR
        (servicio_id IS NULL AND producto_id IS NOT NULL AND categoria_producto_id IS NULL AND aplica_a = 'producto') OR
        (servicio_id IS NULL AND producto_id IS NULL AND categoria_producto_id IS NOT NULL AND aplica_a = 'producto') OR
        (servicio_id IS NULL AND producto_id IS NULL AND categoria_producto_id IS NULL) -- global
    )
);

-- Comentarios
COMMENT ON COLUMN configuracion_comisiones.aplica_a IS
'servicio: Aplica a servicios/citas
producto: Aplica a productos/ventas POS
ambos: Configuración global que aplica a todo';

COMMENT ON COLUMN configuracion_comisiones.producto_id IS
'ID de producto específico. NULL = aplica a todos los productos (ver categoria_producto_id)';

COMMENT ON COLUMN configuracion_comisiones.categoria_producto_id IS
'ID de categoría de productos. Si especificado, aplica a todos los productos de esa categoría.
Prioridad: producto_id > categoria_producto_id > global';
```

### 2. Modificar `comisiones_profesionales`

**Archivo**: `sql/comisiones/01-tablas.sql`

```sql
CREATE TABLE comisiones_profesionales (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- 🔀 ORIGEN DE LA COMISIÓN (NUEVO)
    origen VARCHAR(20) NOT NULL DEFAULT 'cita' CHECK (origen IN ('cita', 'venta')),

    -- 🔗 FK A CITA (tabla particionada) - AHORA NULLABLE
    cita_id INTEGER,
    fecha_cita DATE,
    FOREIGN KEY (cita_id, fecha_cita) REFERENCES citas(id, fecha_cita) ON DELETE CASCADE,

    -- 🔗 FK A VENTA POS (NUEVO)
    venta_id INTEGER REFERENCES ventas_pos(id) ON DELETE CASCADE,

    -- 💰 CÁLCULO DE COMISIÓN
    monto_base DECIMAL(10, 2) NOT NULL CHECK (monto_base >= 0),
    tipo_comision VARCHAR(20) NOT NULL CHECK (tipo_comision IN ('porcentaje', 'monto_fijo', 'mixto')),
    valor_comision DECIMAL(10, 2) NOT NULL,
    monto_comision DECIMAL(10, 2) NOT NULL CHECK (monto_comision >= 0),

    -- 📋 DETALLE (JSONB)
    detalle_servicios JSONB, -- Para origen='cita'
    detalle_productos JSONB, -- Para origen='venta' (NUEVO)

    -- 💳 ESTADO DE PAGO
    estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagada', 'cancelada')),
    fecha_pago DATE,
    metodo_pago VARCHAR(50),
    referencia_pago VARCHAR(100),
    notas_pago TEXT,
    pagado_por INTEGER REFERENCES usuarios(id),

    -- ⏰ TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    -- Debe tener cita_id O venta_id según origen
    CHECK (
        (origen = 'cita' AND cita_id IS NOT NULL AND fecha_cita IS NOT NULL AND venta_id IS NULL) OR
        (origen = 'venta' AND venta_id IS NOT NULL AND cita_id IS NULL)
    ),
    -- Fecha pago solo si pagada
    CHECK (
        (estado_pago = 'pagada' AND fecha_pago IS NOT NULL) OR
        (estado_pago != 'pagada' AND fecha_pago IS NULL)
    ),
    -- Detalle según origen
    CHECK (
        (origen = 'cita' AND detalle_servicios IS NOT NULL) OR
        (origen = 'venta' AND detalle_productos IS NOT NULL)
    )
);

-- Comentarios
COMMENT ON COLUMN comisiones_profesionales.origen IS
'cita: Comisión generada por servicio completado
venta: Comisión generada por venta de productos en POS';

COMMENT ON COLUMN comisiones_profesionales.venta_id IS
'ID de venta POS asociada (solo si origen = venta)';

COMMENT ON COLUMN comisiones_profesionales.detalle_productos IS
'JSON con breakdown por producto (solo si origen = venta):
[{
  producto_id: INTEGER,
  nombre: STRING,
  cantidad: INTEGER,
  subtotal: DECIMAL,
  tipo_comision: STRING,
  valor_comision: DECIMAL,
  comision_calculada: DECIMAL
}]';
```

### 3. Nuevos Índices

**Archivo**: `sql/comisiones/02-indices.sql`

```sql
-- Índices para configuración de productos
CREATE INDEX idx_config_comisiones_producto
ON configuracion_comisiones(producto_id)
WHERE producto_id IS NOT NULL;

CREATE INDEX idx_config_comisiones_categoria
ON configuracion_comisiones(categoria_producto_id)
WHERE categoria_producto_id IS NOT NULL;

CREATE INDEX idx_config_comisiones_aplica
ON configuracion_comisiones(organizacion_id, profesional_id, aplica_a, activo)
WHERE activo = true;

-- Índices para comisiones por origen
CREATE INDEX idx_comisiones_origen
ON comisiones_profesionales(organizacion_id, origen, estado_pago);

CREATE INDEX idx_comisiones_venta
ON comisiones_profesionales(venta_id)
WHERE venta_id IS NOT NULL;

-- Índice GIN para detalle_productos
CREATE INDEX idx_comisiones_detalle_productos
ON comisiones_profesionales USING GIN (detalle_productos)
WHERE detalle_productos IS NOT NULL;
```

### 4. Nueva Función: Obtener Configuración para Producto

**Archivo**: `sql/comisiones/04-funciones.sql`

```sql
-- ============================================================================
-- FUNCIÓN: obtener_configuracion_comision_producto
-- Busca la configuración de comisión para un producto con prioridad cascada
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_configuracion_comision_producto(
    p_profesional_id INTEGER,
    p_producto_id INTEGER,
    p_categoria_producto_id INTEGER,
    p_organizacion_id INTEGER
)
RETURNS TABLE (
    tipo_comision VARCHAR(20),
    valor_comision DECIMAL(10,2)
) AS $$
BEGIN
    -- 1. Buscar configuración específica del producto
    RETURN QUERY
    SELECT cc.tipo_comision, cc.valor_comision
    FROM configuracion_comisiones cc
    WHERE cc.organizacion_id = p_organizacion_id
      AND cc.profesional_id = p_profesional_id
      AND cc.producto_id = p_producto_id
      AND cc.activo = true
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;

    -- 2. Buscar configuración por categoría de producto
    RETURN QUERY
    SELECT cc.tipo_comision, cc.valor_comision
    FROM configuracion_comisiones cc
    WHERE cc.organizacion_id = p_organizacion_id
      AND cc.profesional_id = p_profesional_id
      AND cc.categoria_producto_id = p_categoria_producto_id
      AND cc.activo = true
    LIMIT 1;

    IF FOUND THEN RETURN; END IF;

    -- 3. Buscar configuración global de productos
    RETURN QUERY
    SELECT cc.tipo_comision, cc.valor_comision
    FROM configuracion_comisiones cc
    WHERE cc.organizacion_id = p_organizacion_id
      AND cc.profesional_id = p_profesional_id
      AND cc.producto_id IS NULL
      AND cc.categoria_producto_id IS NULL
      AND cc.aplica_a IN ('producto', 'ambos')
      AND cc.activo = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 5. Nuevo Trigger: Calcular Comisión de Venta

**Archivo**: `sql/comisiones/05-triggers.sql`

```sql
-- ============================================================================
-- FUNCIÓN TRIGGER: calcular_comision_venta
-- Se ejecuta al insertar una venta POS completada
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_comision_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_profesional_id INTEGER;
    v_item RECORD;
    v_config RECORD;
    v_comision_item DECIMAL(10,2);
    v_total_comision DECIMAL(10,2) := 0;
    v_monto_base DECIMAL(10,2) := 0;
    v_detalle_productos JSONB := '[]'::JSONB;
    v_tipos_usados TEXT[] := ARRAY[]::TEXT[];
    v_tipo_final VARCHAR(20);
BEGIN
    -- Solo procesar ventas completadas
    IF NEW.estado != 'completada' THEN
        RETURN NEW;
    END IF;

    -- Obtener profesional (vendedor)
    v_profesional_id := NEW.profesional_id;

    -- Si no hay profesional asignado, no hay comisión
    IF v_profesional_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Anti-duplicados: Verificar si ya existe comisión para esta venta
    IF EXISTS (
        SELECT 1 FROM comisiones_profesionales
        WHERE venta_id = NEW.id AND origen = 'venta'
    ) THEN
        RETURN NEW;
    END IF;

    -- Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Iterar sobre los items de la venta
    FOR v_item IN
        SELECT
            vpi.producto_id,
            vpi.nombre_producto,
            vpi.cantidad,
            vpi.subtotal,
            vpi.aplica_comision,
            p.categoria_id
        FROM ventas_pos_items vpi
        JOIN productos p ON vpi.producto_id = p.id
        WHERE vpi.venta_pos_id = NEW.id
          AND vpi.aplica_comision = true  -- Solo items que aplican comisión
    LOOP
        -- Acumular monto base
        v_monto_base := v_monto_base + v_item.subtotal;

        -- Buscar configuración de comisión (cascada: producto > categoría > global)
        SELECT tipo_comision, valor_comision INTO v_config
        FROM obtener_configuracion_comision_producto(
            v_profesional_id,
            v_item.producto_id,
            v_item.categoria_id,
            NEW.organizacion_id
        );

        -- Si hay configuración, calcular comisión
        IF v_config.tipo_comision IS NOT NULL THEN
            -- Calcular comisión según tipo
            IF v_config.tipo_comision = 'porcentaje' THEN
                v_comision_item := v_item.subtotal * (v_config.valor_comision / 100);
            ELSE -- monto_fijo
                v_comision_item := v_config.valor_comision * v_item.cantidad;
            END IF;

            v_total_comision := v_total_comision + v_comision_item;

            -- Registrar tipo usado
            IF NOT v_config.tipo_comision = ANY(v_tipos_usados) THEN
                v_tipos_usados := array_append(v_tipos_usados, v_config.tipo_comision);
            END IF;

            -- Agregar al detalle
            v_detalle_productos := v_detalle_productos || jsonb_build_object(
                'producto_id', v_item.producto_id,
                'nombre', v_item.nombre_producto,
                'cantidad', v_item.cantidad,
                'subtotal', v_item.subtotal,
                'tipo_comision', v_config.tipo_comision,
                'valor_comision', v_config.valor_comision,
                'comision_calculada', v_comision_item
            );
        END IF;
    END LOOP;

    -- Solo insertar si hay comisión > 0
    IF v_total_comision > 0 THEN
        -- Determinar tipo final
        IF array_length(v_tipos_usados, 1) = 1 THEN
            v_tipo_final := v_tipos_usados[1];
        ELSE
            v_tipo_final := 'mixto';
        END IF;

        -- Insertar comisión
        INSERT INTO comisiones_profesionales (
            organizacion_id,
            profesional_id,
            origen,
            venta_id,
            monto_base,
            tipo_comision,
            valor_comision,
            monto_comision,
            detalle_productos,
            estado_pago
        ) VALUES (
            NEW.organizacion_id,
            v_profesional_id,
            'venta',
            NEW.id,
            v_monto_base,
            v_tipo_final,
            CASE WHEN v_tipo_final = 'mixto' THEN 0 ELSE v_config.valor_comision END,
            v_total_comision,
            v_detalle_productos,
            'pendiente'
        );
    END IF;

    -- Restaurar RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: trigger_calcular_comision_venta
-- ============================================================================
CREATE TRIGGER trigger_calcular_comision_venta
AFTER INSERT ON ventas_pos
FOR EACH ROW
WHEN (NEW.estado = 'completada' AND NEW.profesional_id IS NOT NULL)
EXECUTE FUNCTION calcular_comision_venta();

-- También calcular si se actualiza a completada
CREATE TRIGGER trigger_calcular_comision_venta_update
AFTER UPDATE OF estado ON ventas_pos
FOR EACH ROW
WHEN (NEW.estado = 'completada' AND OLD.estado != 'completada' AND NEW.profesional_id IS NOT NULL)
EXECUTE FUNCTION calcular_comision_venta();
```

---

## Cambios en Backend

### 1. Modelo: `configuracion.model.js`

**Archivo**: `backend/app/modules/comisiones/models/configuracion.model.js`

**Nuevos métodos:**
```javascript
// Crear configuración para producto
async crearConfiguracionProducto({ profesional_id, producto_id, categoria_producto_id, ... })

// Listar con filtro por aplica_a
async listar({ aplica_a, producto_id, categoria_producto_id, ... })

// Obtener configuraciones por categoría
async listarPorCategoria(categoria_producto_id)
```

### 2. Modelo: `comisiones.model.js`

**Archivo**: `backend/app/modules/comisiones/models/comisiones.model.js`

**Modificar métodos existentes:**
```javascript
// Agregar filtro por origen
async listarPorProfesional(profesional_id, { origen = 'todos', ... })

// Agregar filtro por origen
async consultarPorPeriodo({ origen, ... })

// Dashboard con origen
async obtenerEstadisticas({ origen })
```

### 3. Controller

**Archivo**: `backend/app/modules/comisiones/controllers/configuracion.controller.js`

**Nuevos endpoints:**
```javascript
// POST /api/v1/comisiones/configuracion/producto
crearConfiguracionProducto()

// GET /api/v1/comisiones/configuracion?aplica_a=producto
listarConfiguraciones() // modificar para soportar filtro
```

### 4. Schema Joi

**Archivo**: `backend/app/modules/comisiones/schemas/comisiones.schemas.js`

```javascript
// Agregar campos nuevos
const crearConfiguracionSchema = Joi.object({
  profesional_id: Joi.number().required(),
  aplica_a: Joi.string().valid('servicio', 'producto', 'ambos').default('servicio'),
  servicio_id: Joi.number().allow(null),
  producto_id: Joi.number().allow(null),
  categoria_producto_id: Joi.number().allow(null),
  tipo_comision: Joi.string().valid('porcentaje', 'monto_fijo').required(),
  valor_comision: Joi.number().min(0).required(),
  // ...
}).custom((value, helpers) => {
  // Validar mutual exclusivity
  const hasServicio = value.servicio_id != null;
  const hasProducto = value.producto_id != null;
  const hasCategoria = value.categoria_producto_id != null;

  if (hasServicio && (hasProducto || hasCategoria)) {
    return helpers.error('No se puede especificar servicio y producto/categoría');
  }
  return value;
});

// Filtro para listar
const listarConfiguracionesSchema = Joi.object({
  profesional_id: Joi.number(),
  aplica_a: Joi.string().valid('servicio', 'producto', 'ambos', 'todos'),
  activo: Joi.boolean(),
  // ...
});

// Filtro para comisiones
const consultarComisionesSchema = Joi.object({
  origen: Joi.string().valid('cita', 'venta', 'todos').default('todos'),
  // ...
});
```

---

## Cambios en Frontend

### 1. Hook: `useComisiones.js`

**Archivo**: `frontend/src/hooks/useComisiones.js`

```javascript
// Nuevos hooks
export function useConfiguracionesProducto(params) {
  return useConfiguracionesComision({ ...params, aplica_a: 'producto' });
}

// Modificar hooks existentes para soportar origen
export function useComisionesPorPeriodo({ origen = 'todos', ...params }) {
  // ...
}
```

### 2. Página de Configuración

**Archivo**: `frontend/src/pages/comisiones/ConfiguracionComisionesPage.jsx`

**Cambios:**
- Agregar tabs: "Servicios" | "Productos"
- Tab Servicios: comportamiento actual
- Tab Productos: selector de producto o categoría

```jsx
// Estructura de tabs
<Tabs defaultValue="servicios">
  <TabsList>
    <TabsTrigger value="servicios">Servicios</TabsTrigger>
    <TabsTrigger value="productos">Productos</TabsTrigger>
  </TabsList>
  <TabsContent value="servicios">
    <ConfiguracionServiciosTable />
  </TabsContent>
  <TabsContent value="productos">
    <ConfiguracionProductosTable />
  </TabsContent>
</Tabs>
```

### 3. Modal de Configuración

**Archivo**: `frontend/src/components/comisiones/ConfigComisionModal.jsx`

**Cambios:**
- Selector dinámico: Servicio o Producto según tab activo
- Campo adicional: Categoría (si es producto)
- Validación según tipo

### 4. Dashboard de Comisiones

**Archivo**: `frontend/src/components/comisiones/ComisionesDashboard.jsx`

**Cambios:**
- Filtro por origen: Todos | Citas | Ventas
- Gráficas separadas o combinadas según filtro
- Totales por origen

### 5. Reportes

**Archivo**: `frontend/src/pages/comisiones/ReportesComisionesPage.jsx`

**Cambios:**
- Columna "Origen" en tabla
- Filtro por origen
- Exportación con origen

---

## Archivos a Modificar

### SQL (Modificar existentes)

| Archivo | Cambios |
|---------|---------|
| `sql/comisiones/01-tablas.sql` | Agregar campos a ambas tablas |
| `sql/comisiones/02-indices.sql` | Agregar índices para productos |
| `sql/comisiones/04-funciones.sql` | Agregar función cascada productos |
| `sql/comisiones/05-triggers.sql` | Agregar trigger para ventas |

### Backend

| Archivo | Cambios |
|---------|---------|
| `models/configuracion.model.js` | Métodos para productos |
| `models/comisiones.model.js` | Filtro por origen |
| `models/reportes.model.js` | Filtro por origen |
| `controllers/configuracion.controller.js` | Endpoints productos |
| `schemas/comisiones.schemas.js` | Validación nuevos campos |

### Frontend

| Archivo | Cambios |
|---------|---------|
| `hooks/useComisiones.js` | Hooks para productos |
| `pages/comisiones/ConfiguracionComisionesPage.jsx` | Tabs servicios/productos |
| `components/comisiones/ConfigComisionModal.jsx` | Selector producto/categoría |
| `components/comisiones/ComisionesDashboard.jsx` | Filtro origen |
| `components/comisiones/ConfiguracionServiciosTable.jsx` | Renombrar/extraer |
| `components/comisiones/ConfiguracionProductosTable.jsx` | Nuevo componente |

---

## Orden de Implementación

### Fase 1: Base de Datos
1. Modificar `01-tablas.sql` con nuevos campos
2. Agregar índices en `02-indices.sql`
3. Agregar función cascada en `04-funciones.sql`
4. Agregar triggers en `05-triggers.sql`
5. Probar con `npm run dev:fresh`

### Fase 2: Backend
1. Actualizar schemas Joi
2. Modificar modelos
3. Agregar/modificar endpoints
4. Probar con Postman/curl

### Fase 3: Frontend
1. Actualizar hooks
2. Crear componentes para productos
3. Agregar tabs en configuración
4. Agregar filtros en dashboard/reportes
5. Probar flujo completo

---

## Casos de Prueba

### Configuración
- [ ] Crear config global para profesional (servicios)
- [ ] Crear config global para profesional (productos)
- [ ] Crear config específica por servicio
- [ ] Crear config específica por producto
- [ ] Crear config por categoría de productos
- [ ] Validar mutual exclusivity (no servicio + producto)
- [ ] Prioridad cascada servicios
- [ ] Prioridad cascada productos

### Cálculo Automático
- [ ] Completar cita → genera comisión origen='cita'
- [ ] Completar venta → genera comisión origen='venta'
- [ ] Venta sin profesional → no genera comisión
- [ ] Item con aplica_comision=false → no cuenta
- [ ] Tipo mixto cuando hay % y monto fijo

### Dashboard/Reportes
- [ ] Filtrar por origen: citas
- [ ] Filtrar por origen: ventas
- [ ] Filtrar por origen: todos
- [ ] Totales correctos por origen
- [ ] Exportar con columna origen

---

## Notas Adicionales

1. **Retrocompatibilidad**: Los triggers existentes de citas NO se modifican, solo se agregan campos nullable
2. **Performance**: Los índices parciales optimizan búsquedas por tipo
3. **RLS**: Las políticas existentes siguen funcionando (filtran por organizacion_id)
4. **Auditoría**: El historial seguirá registrando cambios en configuración

---

**Próximos pasos**: Confirmar plan y proceder con Fase 1 (SQL)
