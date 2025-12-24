# Fase 5: Listas de Precios y Gestión de Monedas - Nexo ERP (23 Diciembre 2025)

## Objetivo Principal
**Implementar sistema de precios estilo Odoo** - Sistema avanzado de gestión de precios multi-moneda con listas dinámicas.

## Descripción General
Fase dedicada a completar el sistema multi-moneda con un modelo de precios sofisticado inspirado en Odoo, incluyendo listas de precios jerárquicas, reglas de precios por cantidad, y asignación de listas por cliente.

---

## Componentes de la Fase 5

### Componente 5A: Gestión de Monedas (Frontend)

#### Página de Configuración
- **Ruta:** `/configuracion/monedas`
- **Funcionalidad:** CRUD completo para monedas y tasas de cambio
- **Interfaz:** Tabla editable con filtros y búsqueda

#### Endpoints Backend

##### Gestión de Monedas
- `GET /api/v1/monedas` - Listar todas las monedas
- `PATCH /api/v1/monedas/:codigo` - Actualizar moneda específica
- Permisos requeridos: `configuracion.monedas.ver`, `configuracion.monedas.editar`

##### Gestión de Tasas de Cambio
- `GET /api/v1/monedas/tasas` - Listar tasas de cambio históricas
- `POST /api/v1/monedas/tasas` - Crear nueva tasa
- `PUT /api/v1/monedas/tasas/:id` - Actualizar tasa existente
- `DELETE /api/v1/monedas/tasas/:id` - Eliminar tasa
- Permisos requeridos: `configuracion.tasas.ver`, `configuracion.tasas.editar`

---

### Componente 5B: Listas de Precios (Pricelists)

#### Tabla: `listas_precios`
```sql
CREATE TABLE listas_precios (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    moneda VARCHAR(3) REFERENCES monedas(codigo),
    es_default BOOLEAN DEFAULT false,
    descuento_global_pct NUMERIC(5,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organizacion_id, codigo)
);
```

**Campos clave:**
- `codigo`: Identificador único (ej: "MAYOREO", "VIP", "MENUDEO")
- `moneda`: Moneda base de la lista
- `es_default`: Lista por defecto cuando cliente no tiene asignada
- `descuento_global_pct`: Descuento porcentual aplicable a toda la lista

#### Tabla: `listas_precios_items`
```sql
CREATE TABLE listas_precios_items (
    id SERIAL PRIMARY KEY,
    lista_precio_id INTEGER NOT NULL REFERENCES listas_precios(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES categorias_productos(id) ON DELETE CASCADE,
    cantidad_minima INTEGER DEFAULT 1,
    cantidad_maxima INTEGER,
    precio_fijo NUMERIC(12,2),
    descuento_pct NUMERIC(5,2),
    prioridad INTEGER DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (producto_id IS NOT NULL AND categoria_id IS NULL) OR
        (producto_id IS NULL AND categoria_id IS NOT NULL) OR
        (producto_id IS NULL AND categoria_id IS NULL)
    )
);
```

**Reglas de Precio:**
- **Precio fijo:** `precio_fijo` establece precio absoluto
- **Descuento porcentual:** `descuento_pct` aplica descuento sobre precio base
- **Por cantidad:** `cantidad_minima/maxima` define rangos para descuentos
- **Prioridad:** `prioridad` determina qué regla aplicar si múltiples coinciden

#### Integración con Clientes
**Nuevo campo en tabla `clientes`:**
```sql
ALTER TABLE clientes ADD COLUMN lista_precios_id INTEGER REFERENCES listas_precios(id);
```

**Comportamiento:**
- Si `lista_precios_id` es NULL → usa lista por defecto (`es_default = true`)
- Permite asignar listas personalizadas por cliente

---

### Componente 5C: Función SQL `obtener_precio_producto`

#### Propósito
Función PostgreSQL que resuelve el precio final de un producto considerando:
1. Lista de precios del cliente
2. Lista de precios por defecto
3. Precio específico por moneda
4. Precio base del producto

#### Firma de la Función
```sql
CREATE OR REPLACE FUNCTION obtener_precio_producto(
    p_producto_id INTEGER,
    p_cliente_id INTEGER,
    p_moneda_destino VARCHAR(3),
    p_cantidad INTEGER DEFAULT 1
) RETURNS TABLE (
    precio_final NUMERIC(12,2),
    moneda VARCHAR(3),
    fuente_precio VARCHAR(50),
    descuento_aplicado_pct NUMERIC(5,2),
    lista_precio_usada VARCHAR(20)
)
```

#### Lógica de Resolución (Jerarquía)

```
1. Buscar lista del cliente → Si existe, usar esa
2. Si no, buscar lista default (es_default = true)
3. En la lista seleccionada:
   a. Buscar regla por PRODUCTO + CANTIDAD (prioridad más alta)
   b. Si no hay, buscar regla por CATEGORÍA + CANTIDAD
   c. Si no hay, buscar regla por PRODUCTO (sin cantidad)
   d. Si no hay, buscar regla por CATEGORÍA (sin cantidad)
4. Aplicar precio:
   - Si tiene precio_fijo → usar ese precio
   - Si tiene descuento_pct → aplicar a precio base
5. Convertir a moneda destino si es necesario
```

#### Retorno de la Función
- `precio_final`: Precio calculado en moneda destino
- `moneda`: Moneda del precio final
- `fuente_precio`: Descripción de origen ("Mayoreo -12%", "VIP", "Precio Base")
- `descuento_aplicado_pct`: Porcentaje de descuento aplicado
- `lista_precio_usada`: Código de lista aplicada

---

### Componente 5D: POS Inteligente

#### Integración con Punto de Venta
**Al agregar items al carrito:**
```javascript
// Llamada a función PostgreSQL
const precioInfo = await pool.query(
    "SELECT * FROM obtener_precio_producto($1, $2, $3, $4)",
    [productoId, clienteId, monedaPOS, cantidad]
);
```

#### Visualización en UI
**Formato de etiqueta de fuente:**
```
Producto: Laptop Gamer XYZ
Precio: $1,750.00 MXN
Fuente: Mayoreo -12% (Lista VIP)
```

**Posibles etiquetas:**
- `"Precio Base"` - Sin descuentos aplicados
- `"Mayoreo -15%"` - Descuento por cantidad
- `"VIP +5%"` - Incremento por lista premium
- `"Oferta -20%"` - Descuento temporal

#### Conversión Multi-Moneda
**En POS se muestra:**
```
Subtotal: $1,750.00 MXN
           ≈ $100.00 USD (Tasa: 17.50)
```

---

## GAPS CERRADOS vs Odoo

### ✅ Completamente Implementados

#### 1. CRUD de Monedas
- **Odoo:** Interfaz completa para gestionar monedas
- **Nexo ERP:** ✅ Página `/configuracion/monedas` con CRUD

#### 2. Tasas Editables Manualmente
- **Odoo:** Permite edición manual de tasas
- **Nexo ERP:** ✅ CRUD de tasas con historial

#### 3. Listas de Precios
- **Odoo:** Sistema completo de listas
- **Nexo ERP:** ✅ Tablas `listas_precios` e `items`

#### 4. Precios por Cantidad (N niveles)
- **Odoo:** Descuentos escalonados por cantidad
- **Nexo ERP:** ✅ Rangos `cantidad_minima/maxima` con prioridad

#### 5. Asignar Lista a Cliente
- **Odoo:** Asignación individual por cliente
- **Nexo ERP:** ✅ Campo `lista_precios_id` en clientes

#### 6. POS usa Precio de Lista
- **Odoo:** POS obtiene precio de lista asignada
- **Nexo ERP:** ✅ Función `obtener_precio_producto()` en POS

---

## PENDIENTE FUTURO (Fase 6+)

### Tasas Automáticas
**Fuentes de datos planeadas:**
1. **Banxico** - Banco de México (MXN)
2. **ECB** - Banco Central Europeo (EUR)
3. **Fixer.io** - API comercial
4. **Open Exchange Rates** - Alternativa

#### Funcionalidad Planeada:
- **Programación horaria** de actualización
- **Historial completo** de tasas
- **Fallback a última tasa** si API falla
- **Alertas** por tasas inusuales

#### Endpoints Propuestos:
- `POST /api/v1/monedas/tasas/sincronizar` - Sincronización manual
- `GET /api/v1/monedas/tasas/fuentes` - Listar fuentes disponibles
- `PUT /api/v1/monedas/tasas/fuentes/:id` - Configurar fuente

---

## Arquitectura de la Solución

### Diagrama de Flujo
```
Cliente → Lista Asignada → Buscar Reglas → Aplicar Precio → Convertir Moneda
     ↓ (si NULL)          ↓ Por Producto    ↓ Fijo/Descuento ↓ Tasa Actual
Lista Default           ↓ Por Categoría
                     ↓ Por Cantidad
```

### Consideraciones de Performance
1. **Índices críticos:**
   - `listas_precios_items(producto_id, lista_precio_id)`
   - `listas_precios_items(categoria_id, lista_precio_id)`
   - `listas_precios(es_default)` para búsquedas rápidas

2. **Caching:** Implementar caché de precios por:
   - `(producto_id, cliente_id, moneda, cantidad)`
   - TTL: 5 minutos para precios dinámicos

3. **Bulk operations:** Para carritos con múltiples items

---

## Permisos Requeridos

> **Nota:** Formato `modulo.accion` siguiendo el patrón de `permisos_catalogo`

### Gestión de Monedas
- `monedas.ver` - Ver catálogo de monedas
- `monedas.editar` - Activar/desactivar monedas

### Gestión de Tasas de Cambio
- `tasas.ver` - Ver tasas de cambio
- `tasas.crear` - Crear nuevas tasas
- `tasas.editar` - Modificar tasas existentes
- `tasas.eliminar` - Eliminar tasas

### Listas de Precios
- `listas_precios.ver` - Ver listas de precios
- `listas_precios.crear` - Crear nuevas listas
- `listas_precios.editar` - Modificar listas existentes
- `listas_precios.eliminar` - Eliminar listas
- `listas_precios.asignar` - Asignar listas a clientes

---

## Validaciones y Reglas de Negocio

### Validaciones de Monedas
1. **Moneda base:** Organización debe tener moneda base
2. **Tasas bidireccionales:** Si existe USD/MXN, debe poder calcularse MXN/USD
3. **Monedas activas:** Solo monedas activas pueden usarse en transacciones

### Validaciones de Listas de Precios
1. **Una sola default:** Solo una lista puede tener `es_default = true` por organización
2. **Jerarquía de reglas:** Reglas con mayor `prioridad` se aplican primero
3. **Rangos sin solapamiento:** No pueden haber rangos que se solapen para mismo producto/categoría
4. **Moneda consistente:** Todos los items de una lista deben usar misma moneda

### Validaciones de Clientes
1. **Lista existente:** `lista_precios_id` debe referenciar lista activa
2. **Moneda compatible:** Lista debe usar moneda compatible con organización/sucursal

---

## Migraciones SQL Requeridas

### 1. Crear Tablas
```sql
-- Tabla listas_precios
CREATE TABLE listas_precios (...);

-- Tabla listas_precios_items
CREATE TABLE listas_precios_items (...);

-- Función obtener_precio_producto
CREATE OR REPLACE FUNCTION obtener_precio_producto(...);
```

### 2. Modificar Tabla Clientes
```sql
ALTER TABLE clientes ADD COLUMN lista_precios_id INTEGER REFERENCES listas_precios(id);
```

### 3. Crear Índices
```sql
CREATE INDEX idx_listas_precios_default ON listas_precios(organizacion_id, es_default) WHERE es_default = true;
CREATE INDEX idx_listas_items_producto ON listas_precios_items(producto_id, lista_precio_id);
CREATE INDEX idx_listas_items_categoria ON listas_precios_items(categoria_id, lista_precio_id);
```

### 4. Datos Iniciales
```sql
-- Lista por defecto
INSERT INTO listas_precios (codigo, nombre, moneda, es_default) 
VALUES ('DEFAULT', 'Precios Base', 'MXN', true);
```

---

## Consideraciones de UX/UI

### Página de Configuración de Monedas
- **Vista tabla editable** tipo spreadsheet
- **Filtros por:** activo, moneda base, fecha
- **Validación en tiempo real** de códigos ISO

### Configuración de Listas de Precios
- **Editor de reglas visual** con arrastrar y soltar
- **Preview de precios** con datos de prueba
- **Validación de conflictos** entre reglas

### Asignación a Clientes
- **Dropdown inteligente** con búsqueda
- **Preview de precio** para cliente seleccionado
- **Bulk assign** para múltiples clientes

---

## Pruebas Automatizadas Planeadas

### Unit Tests
1. **Función `obtener_precio_producto`**
   - Test jerarquía de reglas
   - Test conversión moneda
   - Test edge cases (cantidades límite)

2. **API Monedas**
   - CRUD operations
   - Validación códigos ISO
   - Historial tasas

3. **API Listas de Precios**
   - Creación/edición listas
   - Reglas por cantidad
   - Asignación a clientes

### Integration Tests
1. **Flujo POS completo**
   - Cliente con lista asignada
   - Productos con reglas por cantidad
   - Conversión multi-moneda

2. **Performance tests**
   - Carga de 1000 productos
   - Múltiples listas concurrentes
   - Cache hit/miss ratios

---

**Fecha de Definición:** 23 Diciembre 2025  
**Estado:** Especificación completa, lista para implementación  
**Dependencias:** Fase 4 Multi-Moneda completada  
**Complejidad:** ALTA - Sistema sofisticado de pricing  
**Prioridad:** ALTA - Core functionality para ventas  
**Estimación:** 3-4 semanas de desarrollo
