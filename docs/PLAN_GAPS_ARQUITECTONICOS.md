# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 24 Diciembre 2025 - Fase 5: ✅ Completada (bug descuentos + selector UI validado)

---

## Estado del Proyecto

| Fase | Nombre | Estado | Notas |
|------|--------|--------|-------|
| 1 | Workflows de Aprobación | ✅ Completado | ~4,200 líneas, E2E validado |
| 2 | Gestión de Módulos | ✅ Completado | 11 módulos con dependencias |
| 3 | Permisos Normalizados | ✅ Completado | 72 permisos, 5 roles |
| 4 | Multi-Moneda | ✅ Completado | Precios, conversión POS, jerarquía sucursal→org |
| 5 | Listas de Precios | ✅ Completado | Modelo Odoo, bug corregido, UI validada |
| 6 | Webhooks Salientes | ⬜ Pendiente | - |
| 7 | Internacionalización | ⬜ Pendiente | BD preparada |
| 8 | Reportes Multi-Sucursal | ⬜ Pendiente | - |
| 9 | Centros de Costo | ⬜ Pendiente | - |
| 10 | API Pública | ⬜ Futuro | Baja prioridad |

---

## Fases Completadas (Referencia)

### Fase 1: Workflows de Aprobación
Sistema de aprobaciones para órdenes de compra basado en límites por rol.
- Condición: `total > limite_aprobacion` del usuario
- Flujos validados E2E: aprobación → enviada, rechazo → borrador
- Bandeja de aprobaciones con historial filtrable
- `workflowAdapter.js` para desacoplar integración
- 6 tablas SQL: `workflow_definiciones`, `workflow_pasos`, `workflow_transiciones`, `workflow_instancias`, `workflow_historial`, `workflow_delegaciones`

### Fase 2: Gestión de Módulos
Activar/desactivar módulos por organización con validación de dependencias.
- 11 módulos: core, agendamiento, inventario, pos, marketplace, comisiones, chatbots, eventos-digitales, website, contabilidad, workflows
- Dependencias: pos→inventario, marketplace→agendamiento, chatbots→agendamiento, workflows→inventario
- Cache Redis + Memory fallback (TTL 5 min)
- Middleware: `requireModule()`, `requireAnyModule()`, `requireAllModules()`

### Fase 3: Permisos Normalizados
Catálogo de permisos con asignación por rol y overrides por usuario/sucursal.
- 72 permisos en catálogo (70 booleanos + 2 numéricos)
- 5 roles: super_admin, admin, propietario, empleado, bot
- Permisos numéricos: `pos.max_descuento`, `inventario.limite_aprobacion`
- Función SQL: `tiene_permiso(usuario_id, sucursal_id, codigo_permiso)`
- Tablas: `permisos_catalogo`, `permisos_rol`, `permisos_usuario_sucursal`

### Fase 4: Multi-Moneda
Soporte completo para múltiples monedas con conversión en tiempo real.
- Catálogo: MXN, COP, USD activas (+4 en catálogo)
- Precios multi-moneda en productos/servicios (UI colapsable)
- Conversión en POS: equivalente USD debajo del total
- Tasas de cambio manuales (automáticas opcional futuro)
- `useCurrency.js` hook para formateo dinámico
- Tablas: `monedas`, `tasas_cambio`, `precios_producto_moneda`, `precios_servicio_moneda`

**Arquitectura de Moneda (modelo Odoo - Dic 2025):**
```
┌─────────────────────────────────────────────┐
│ ORGANIZACIÓN                                │
│ moneda = MXN (moneda base para reportes)    │
├─────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐      │
│  │ Sucursal MX  │    │ Sucursal USA │      │
│  │ moneda: NULL │    │ moneda: USD  │      │
│  │ (hereda MXN) │    │ (override)   │      │
│  └──────────────┘    └──────────────┘      │
│       ↓                    ↓                │
│   Empleados            Empleados            │
│   ven MXN              ven USD              │
└─────────────────────────────────────────────┘
```

- `organizaciones.moneda`: moneda base del negocio (facturación, reportes)
- `sucursales.moneda`: override para sucursales en otros países (NULL = heredar)
- Query login: `COALESCE(sucursal.moneda, organizacion.moneda)`
- **NO hay** `usuarios.moneda` - la moneda se hereda de la jerarquía

---

## Fase 5: Listas de Precios y Gestión de Monedas (✅ COMPLETADA)

> **Objetivo**: Sistema de precios estilo Odoo con listas de precios,
> gestión de monedas desde frontend y tasas de cambio configurables.
>
> **Completada**: 24 Diciembre 2025 - Validación E2E en POS

### Estado Actual (24 Dic 2025)

| Componente | Estado | Notas |
|------------|--------|-------|
| Backend listas_precios | ✅ Completado | CRUD, items, clientes |
| Backend monedas | ✅ Completado | Tasas, activación |
| Frontend ListasPreciosPage | ✅ Completado | CRUD listas, items, asignar clientes |
| Frontend MonedasPage | ✅ Completado | Gestión tasas cambio |
| Frontend ClienteForm | ✅ Completado | Campo lista_precios_id |
| POS integración | ✅ Completado | Usa obtener_precio_producto() |
| Navegación | ✅ Completado | Tab "Listas Precios" en Inventario |
| Eliminación precio_mayoreo | ✅ Completado | Migrado a listas_precios_items |

### Comportamiento Detectado - Descuentos Acumulativos

**Problema**: Los descuentos se acumulan en vez de reemplazarse.

```
Ejemplo con Cliente VIP (lista con 15% global):
├── Shampoo sin item específico → $150 × 0.85 = $127.50 ✓
└── Shampoo CON item 25% → $150 × 0.85 × 0.75 = $95.63 (¿esperado?)
```

| Comportamiento | Cálculo | Resultado |
|----------------|---------|-----------|
| Actual (acumulativo) | $150 × 0.85 × 0.75 | $95.63 |
| Alternativo (reemplazo) | $150 × 0.75 | $112.50 |

### ✅ Investigación Modelo Odoo (Completada)

**Fuentes consultadas**:
- [Odoo 17.0 Pricelists Documentation](https://www.odoo.com/documentation/17.0/applications/sales/sales/products_prices/prices/pricing.html)
- [Odoo 18.0 Pricelists Documentation](https://www.odoo.com/documentation/18.0/applications/sales/sales/products_prices/prices/pricing.html)
- [The Almost Complete Guide to Pricelist Behavior](https://www.odoo.com/forum/help-1/the-almost-complete-guide-to-pricelist-behavior-185877)
- [Odoo 17.0 POS Pricelists](https://www.odoo.com/documentation/17.0/applications/sales/point_of_sale/pricing/pricelists.html)

#### Hallazgos Clave

**1. Tipos de Cálculo en Odoo (3 modos)**:

| Modo | Descripción | Campos |
|------|-------------|--------|
| **Fixed Price** | Precio fijo específico | `precio_fijo` |
| **Discount** | % descuento sobre precio base (visible al cliente) | `descuento_pct` |
| **Formula** | Basado en: Precio Venta, Costo, u Otra Lista + redondeo + margen | `base`, `descuento`, `extra_fee`, `redondeo` |

**2. Comportamiento de Prioridad (LAS REGLAS NO SE ACUMULAN)**:

```
┌─────────────────────────────────────────────────────────────┐
│ REGLA CRÍTICA: Las reglas de precio NO se acumulan.         │
│ El sistema selecciona UNA sola regla ganadora.              │
│                                                              │
│ Prioridad (de mayor a menor):                               │
│ 1. Producto específico > Categoría > Todos los productos    │
│ 2. Si igual especificidad → Gana el precio más alto         │
└─────────────────────────────────────────────────────────────┘
```

Cita de documentación Odoo:
> "If there are multiple pricelist items on a single pricelist for a given product
> and more than one could be applied to an order, the one with the greatest
> specificity will be used. If the specificity level of two pricelist items
> is identical, the one with the highest price will be used."

**3. Apply To (A qué aplica el item)**:
- `Producto específico` - Solo ese producto
- `Categoría de producto` - Todos los productos de esa categoría
- `Todos los productos` - Aplica globalmente

**4. Condiciones adicionales**:
- `cantidad_minima` - Desde qué cantidad aplica
- `fecha_inicio/fecha_fin` - Período de vigencia

#### ✅ BUG Corregido - Descuentos (24 Dic 2025)

**Problema anterior**: Los descuentos se acumulaban incorrectamente.
```sql
-- ANTES (incorrecto): acumulaba descuento_global + descuento_item
precio = precio_base × (1 - descuento_global/100) × (1 - descuento_item/100)
```

**Solución implementada** (modelo Odoo):
```sql
-- AHORA (correcto): item específico REEMPLAZA descuento_global
-- SI existe item específico para el producto:
precio = aplicar_regla_item(item)  -- IGNORA descuento_global

-- SI NO existe item específico:
precio = precio_base × (1 - descuento_global/100)
```

**Archivo modificado**: `sql/precios/02-funciones.sql`
- Eliminado bloque que acumulaba descuento_global sobre items
- Agregado comentario documentando el modelo Odoo
- Ref: Odoo 17.0 Pricelists Documentation

### ✅ COMPLETADO: UI para Precio Fijo (24 Dic 2025)

**Archivo**: `frontend/src/pages/precios/ListasPreciosPage.jsx` - ListaItemsView

**Validación Visual E2E**:
- Selector "Tipo de Precio" con opciones: "Descuento %" | "Precio Fijo"
- Campo dinámico que cambia según selección ("Descuento %" → "Precio ($)")
- Guardado en BD correcto (precio_fijo o descuento_pct)
- Visualización en tabla: muestra tanto porcentajes (-25%) como precios fijos ($180.00)

### ✅ COMPLETADO: Prioridad por Especificidad (24 Dic 2025)

**Implementación**: Selector "Aplicar a" con 3 niveles de especificidad

**UI Agregada**:
- Selector "Aplicar a": Producto específico | Categoría de productos | Todos los productos
- Buscador de categorías cuando se selecciona "Categoría"
- Mensaje informativo para regla global

**Validación E2E de Prioridad** (modelo Odoo):
```
Jerarquía: Producto > Categoría > Global

| Producto        | Regla Disponible      | Resultado           |
|-----------------|----------------------|---------------------|
| Shampoo         | Producto (-25%)      | $112.50 (producto)  |
| Gel Fijador     | Categoría (-10%)     | $72.00 (categoría)  |
| Toalla          | Global (-5%)         | $23.75 (global)     |
```

**SQL** (`sql/precios/02-funciones.sql` líneas 149-158):
```sql
ORDER BY
    CASE WHEN lpi.producto_id IS NOT NULL THEN 1
         WHEN lpi.categoria_id IS NOT NULL THEN 2
         ELSE 3 END,
    lpi.prioridad DESC,
    lpi.cantidad_minima DESC
LIMIT 1;
```

### ✅ VALIDACIÓN E2E EN POS (24 Dic 2025)

**Test**: Cliente VIP (María García López) con 4 reglas en lista VIP:
- Shampoo: -25% (producto específico)
- Acondicionador: $180 fijo (producto específico)
- Cuidado Capilar: -10% (categoría)
- Todos: -5% (global)

**Resultado en Carrito POS**:
| Producto | Precio Base | Regla Aplicada | Precio Final |
|----------|-------------|----------------|--------------|
| Shampoo Premium 500ml | $150.00 | Producto (-25%) | **$112.50** |
| Gel Fijador | $80.00 | Categoría (-10%) | **$72.00** |
| Toalla Desechable | $25.00 | Global (-5%) | **$23.75** |
| **TOTAL** | | | **$208.25** (≈$11.90 USD) |

✅ La jerarquía **Producto > Categoría > Global** funciona correctamente en ventas.

### Gaps Identificados (Comparación con Odoo)

| Característica | Odoo | Nexo Actual | Estado |
|----------------|------|-------------|--------|
| CRUD de monedas | ✅ | ✅ Frontend | ✅ Completado |
| Tasas de cambio editables | ✅ | ✅ Frontend | ✅ Completado |
| Tasas automáticas (API) | ✅ Banxico/ECB | ❌ | ⬜ Futuro |
| Listas de precios | ✅ Múltiples | ✅ CRUD completo | ✅ Completado |
| Precios por cantidad (N niveles) | ✅ | ✅ cantidad_minima | ✅ Completado |
| Asignar lista a cliente | ✅ | ✅ Form + UI listas | ✅ Completado |
| POS usa precio de lista | ✅ | ✅ obtener_precio_producto() | ✅ Completado |
| Items con precio fijo | ✅ 3 modos | ✅ BD + UI selector | ✅ Completado |
| Lógica descuento (acumular vs reemplazar) | Reemplaza | ✅ Reemplaza (corregido 24 Dic) | ✅ Completado |
| Prioridad por especificidad | ✅ prod > cat > all | ✅ SQL + UI "Aplicar a" (24 Dic) | ✅ Completado |
| Items por categoría | ✅ | ✅ UI buscador categorías (24 Dic) | ✅ Completado |
| Reglas globales | ✅ | ✅ UI "Todos los productos" (24 Dic) | ✅ Completado |
| Modo Fórmula (base+margin+redondeo) | ✅ | ❌ | ⬜ Futuro (baja prioridad) |

### 5A: Gestión de Monedas (Frontend)

**Página**: `/configuracion/monedas`

**Funcionalidades**:
- Listar monedas del catálogo (activas/inactivas)
- Activar/desactivar monedas por organización
- CRUD de tasas de cambio manuales
- Historial de tasas por fecha

**API Endpoints**:
```
GET    /api/v1/monedas                    # Listar monedas
PATCH  /api/v1/monedas/:codigo            # Activar/desactivar
GET    /api/v1/monedas/tasas              # Listar tasas actuales
POST   /api/v1/monedas/tasas              # Crear tasa de cambio
PUT    /api/v1/monedas/tasas/:id          # Actualizar tasa
GET    /api/v1/monedas/tasas/historial    # Historial de tasas
```

### 5B: Listas de Precios (Pricelists)

**Concepto**: Una lista de precios es un conjunto de reglas que define precios especiales
para productos/servicios según cliente, cantidad o moneda.

**Tablas SQL** (agregar en `sql/precios/`):

```sql
-- =====================================================================
-- TABLA: listas_precios
-- Listas de precios configurables por organización (estilo Odoo)
-- =====================================================================
CREATE TABLE listas_precios (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    codigo VARCHAR(20) NOT NULL,              -- 'MENUDEO', 'MAYOREO', 'VIP'
    nombre VARCHAR(100) NOT NULL,             -- 'Lista Menudeo', 'Lista Mayoreo'
    descripcion TEXT,

    -- Configuración
    moneda VARCHAR(3) NOT NULL DEFAULT 'MXN' REFERENCES monedas(codigo),
    es_default BOOLEAN DEFAULT FALSE,         -- Lista por defecto para nuevos clientes

    -- Descuento global (opcional)
    descuento_global_pct DECIMAL(5,2) DEFAULT 0,  -- % descuento base para toda la lista

    -- Estado
    activo BOOLEAN DEFAULT TRUE,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(organizacion_id, codigo),
    CHECK (descuento_global_pct >= 0 AND descuento_global_pct <= 100)
);

COMMENT ON TABLE listas_precios IS 'Listas de precios configurables (Menudeo, Mayoreo, VIP, etc.)';

-- Solo una lista default por organización
CREATE UNIQUE INDEX idx_lista_precios_default_unica
ON listas_precios(organizacion_id)
WHERE es_default = TRUE;

-- =====================================================================
-- TABLA: listas_precios_items
-- Reglas de precio por producto/cantidad dentro de una lista
-- =====================================================================
CREATE TABLE listas_precios_items (
    id SERIAL PRIMARY KEY,
    lista_precio_id INTEGER NOT NULL REFERENCES listas_precios(id) ON DELETE CASCADE,

    -- Puede aplicar a producto específico o categoría
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES categorias_productos(id) ON DELETE CASCADE,
    -- Si ambos son NULL, aplica a todos los productos

    -- Regla de cantidad
    cantidad_minima INTEGER DEFAULT 1,        -- Desde qué cantidad aplica
    cantidad_maxima INTEGER,                  -- Hasta qué cantidad (NULL = sin límite)

    -- Precio (una de las dos opciones)
    precio_fijo DECIMAL(10,2),                -- Precio fijo para esta regla
    descuento_pct DECIMAL(5,2),               -- O porcentaje de descuento sobre precio base

    -- Prioridad (mayor número = mayor prioridad)
    prioridad INTEGER DEFAULT 0,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CHECK (precio_fijo IS NOT NULL OR descuento_pct IS NOT NULL),
    CHECK (precio_fijo IS NULL OR precio_fijo >= 0),
    CHECK (descuento_pct IS NULL OR (descuento_pct >= 0 AND descuento_pct <= 100)),
    CHECK (cantidad_minima >= 1),
    CHECK (cantidad_maxima IS NULL OR cantidad_maxima >= cantidad_minima),
    CHECK (producto_id IS NOT NULL OR categoria_id IS NOT NULL OR
           (producto_id IS NULL AND categoria_id IS NULL))
);

COMMENT ON TABLE listas_precios_items IS 'Reglas de precio por producto/cantidad dentro de una lista';
COMMENT ON COLUMN listas_precios_items.cantidad_minima IS 'Cantidad mínima para aplicar esta regla (ej: 10 para mayoreo)';
COMMENT ON COLUMN listas_precios_items.prioridad IS 'Mayor prioridad gana cuando hay múltiples reglas aplicables';

-- Índices para búsqueda eficiente de precios
CREATE INDEX idx_listas_items_producto ON listas_precios_items(lista_precio_id, producto_id);
CREATE INDEX idx_listas_items_categoria ON listas_precios_items(lista_precio_id, categoria_id);
CREATE INDEX idx_listas_items_cantidad ON listas_precios_items(lista_precio_id, cantidad_minima);
```

**Modificar tabla `clientes`** (agregar campo):
```sql
-- En sql/clientes/01-tablas.sql agregar:
lista_precios_id INTEGER REFERENCES listas_precios(id) ON DELETE SET NULL,
```

### 5C: Función SQL para Resolver Precio

```sql
-- =====================================================================
-- FUNCIÓN: obtener_precio_producto
-- Resuelve el precio final de un producto según cliente, cantidad y moneda
-- =====================================================================
CREATE OR REPLACE FUNCTION obtener_precio_producto(
    p_producto_id INTEGER,
    p_cliente_id INTEGER DEFAULT NULL,
    p_cantidad INTEGER DEFAULT 1,
    p_moneda VARCHAR(3) DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    precio DECIMAL(10,2),
    moneda VARCHAR(3),
    fuente VARCHAR(50),           -- 'lista_cliente', 'lista_default', 'producto_moneda', 'producto_base'
    descuento_aplicado DECIMAL(5,2)
) AS $$
DECLARE
    v_lista_id INTEGER;
    v_org_id INTEGER;
    v_moneda_efectiva VARCHAR(3);
    v_precio_base DECIMAL(10,2);
    v_precio_encontrado DECIMAL(10,2);
    v_descuento DECIMAL(5,2) := 0;
    v_fuente VARCHAR(50);
BEGIN
    -- Obtener organización y moneda del producto
    SELECT p.organizacion_id, p.precio_venta,
           COALESCE(p_moneda, s.moneda, o.moneda)
    INTO v_org_id, v_precio_base, v_moneda_efectiva
    FROM productos p
    JOIN organizaciones o ON o.id = p.organizacion_id
    LEFT JOIN sucursales s ON s.id = p_sucursal_id
    WHERE p.id = p_producto_id;

    -- 1. Buscar lista de precios del cliente
    IF p_cliente_id IS NOT NULL THEN
        SELECT c.lista_precios_id INTO v_lista_id
        FROM clientes c WHERE c.id = p_cliente_id;
    END IF;

    -- 2. Si no hay lista de cliente, usar lista default
    IF v_lista_id IS NULL THEN
        SELECT id INTO v_lista_id
        FROM listas_precios
        WHERE organizacion_id = v_org_id
          AND es_default = TRUE
          AND activo = TRUE
          AND moneda = v_moneda_efectiva;
    END IF;

    -- 3. Buscar regla en la lista de precios
    IF v_lista_id IS NOT NULL THEN
        SELECT
            COALESCE(lpi.precio_fijo, v_precio_base * (1 - lpi.descuento_pct/100)),
            COALESCE(lpi.descuento_pct, 0),
            CASE WHEN p_cliente_id IS NOT NULL THEN 'lista_cliente' ELSE 'lista_default' END
        INTO v_precio_encontrado, v_descuento, v_fuente
        FROM listas_precios_items lpi
        WHERE lpi.lista_precio_id = v_lista_id
          AND (lpi.producto_id = p_producto_id OR lpi.producto_id IS NULL)
          AND lpi.cantidad_minima <= p_cantidad
          AND (lpi.cantidad_maxima IS NULL OR lpi.cantidad_maxima >= p_cantidad)
        ORDER BY
            CASE WHEN lpi.producto_id IS NOT NULL THEN 1 ELSE 2 END,
            lpi.prioridad DESC,
            lpi.cantidad_minima DESC
        LIMIT 1;
    END IF;

    -- 4. Si no hay regla, buscar en precios_producto_moneda
    IF v_precio_encontrado IS NULL AND v_moneda_efectiva != 'MXN' THEN
        SELECT ppm.precio_venta INTO v_precio_encontrado
        FROM precios_producto_moneda ppm
        WHERE ppm.producto_id = p_producto_id
          AND ppm.moneda = v_moneda_efectiva
          AND ppm.activo = TRUE;

        IF v_precio_encontrado IS NOT NULL THEN
            v_fuente := 'producto_moneda';
        END IF;
    END IF;

    -- 5. Fallback: precio base del producto
    IF v_precio_encontrado IS NULL THEN
        v_precio_encontrado := v_precio_base;
        v_fuente := 'producto_base';
    END IF;

    RETURN QUERY SELECT v_precio_encontrado, v_moneda_efectiva, v_fuente, v_descuento;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_precio_producto IS 'Resuelve precio final según cliente, cantidad, moneda y listas de precios';
```

### 5D: POS Inteligente

**Modificaciones en POS**:
1. Al agregar producto, llamar `obtener_precio_producto()`
2. Pasar `cliente_id` si hay cliente asociado
3. Pasar `cantidad` para aplicar reglas de mayoreo
4. Mostrar fuente del precio (etiqueta: "Precio Mayoreo", "Precio VIP", etc.)

**Flujo en POS**:
```
Usuario busca producto
    ↓
POS llama: obtener_precio_producto(producto_id, cliente_id, cantidad, moneda_sucursal)
    ↓
Sistema evalúa:
  1. ¿Cliente tiene lista asignada? → Buscar regla
  2. ¿Hay lista default? → Buscar regla
  3. ¿Hay precio en moneda de sucursal? → Usar ese
  4. Fallback → Precio base del producto
    ↓
Retorna: { precio: 220, moneda: 'MXN', fuente: 'lista_cliente', descuento: 12% }
    ↓
POS muestra: "$220.00 (Mayoreo -12%)" + "≈ $12.57 USD"
```

### Entregables Fase 5

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| SQL Tablas | `sql/precios/01-tablas.sql` | listas_precios, listas_precios_items |
| SQL Funciones | `sql/precios/02-funciones.sql` | obtener_precio_producto |
| SQL RLS | `sql/precios/03-rls-policies.sql` | Políticas multi-tenant |
| SQL Índices | `sql/precios/04-indices.sql` | Índices de rendimiento |
| Backend Model | `backend/.../precios.model.js` | CRUD listas de precios |
| Backend Controller | `backend/.../precios.controller.js` | API endpoints |
| Frontend Page | `frontend/.../ListasPreciosPage.jsx` | Gestión de listas |
| Frontend Page | `frontend/.../MonedasPage.jsx` | Gestión de monedas/tasas |
| Frontend Hook | `frontend/.../useListasPrecios.js` | Hook para POS |
| POS Integration | Modificar `CarritoVenta.jsx` | Usar función precio |

### Ejemplo de Uso

**Configuración típica de una organización**:
```
Listas de Precios:
├── MENUDEO (default, MXN)
│   └── Sin reglas especiales (usa precio base)
│
├── MAYOREO (MXN)
│   ├── Cantidad >= 10: -10% descuento
│   ├── Cantidad >= 50: -15% descuento
│   └── Cantidad >= 100: -20% descuento
│
└── VIP (MXN)
    └── Descuento global: 5%

Clientes:
├── Cliente A → Lista: MENUDEO (default)
├── Cliente B → Lista: MAYOREO
└── Cliente C → Lista: VIP
```

---

## Fases Futuras (Alto Nivel)

### Fase 6: Webhooks Salientes
Notificar sistemas externos cuando ocurren eventos (cita.creada, venta.completada, etc.).

### Fase 7: Internacionalización (i18n)
Soporte multi-idioma con i18next. BD ya tiene campos `idioma`, `zona_horaria` en organizaciones y usuarios.

### Fase 8: Reportes Multi-Sucursal
Vistas materializadas para comparar métricas entre sucursales con pg_cron.

### Fase 9: Centros de Costo
Asignar gastos/ingresos a centros de costo para análisis de rentabilidad.

### Fase 10: API Pública Documentada
OpenAPI/Swagger + API Keys para integraciones externas. Baja prioridad.

### Futuro: Tasas de Cambio Automáticas
Integración con APIs de tasas de cambio:
- **Banxico**: Tasa oficial para MXN (gratuito)
- **ECB**: Banco Central Europeo para EUR (gratuito)
- **Fixer.io**: Multi-moneda (requiere API key)
- **Open Exchange Rates**: Alternativa (freemium)

---

## Notas Técnicas

- **RLS**: Usar `RLSContextManager.query()`. Solo `withBypass()` para JOINs multi-tabla o super_admin.
- **HMR**: No funciona en Docker. Reiniciar contenedor + Ctrl+Shift+R.
- **Multi-Tenant**: 122 políticas RLS, 4 tablas particionadas.

### Adapters de Servicios
Patrón para desacoplar módulos sin dependencias directas (lazy loading):

| Adapter | Uso |
|---------|-----|
| `clienteAdapter` | Crear/buscar clientes desde agendamiento público |
| `workflowAdapter` | Evaluar aprobaciones desde órdenes de compra |
| `organizacionAdapter` | Acceso a datos de organización desde chatbots |
| `profesionalAdapter` | Buscar profesionales desde marketplace/POS |
| `notificacionAdapter` | Enviar notificaciones desde cualquier módulo |
| `chatbotConfigAdapter` | Config de chatbots desde notificaciones/recordatorios |

### Estadísticas del Proyecto
- 19 módulos backend
- 59+ páginas frontend
- 130+ componentes UI
- 35+ hooks React
- 122 políticas RLS
