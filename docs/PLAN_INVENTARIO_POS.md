# 🛒 PLAN COMPLETO - GESTIÓN DE INVENTARIO Y PUNTO DE VENTA (POS)

**Fecha Creación:** 18 Noviembre 2025
**Última Actualización:** 20 Noviembre 2025
**Estado:** ✅ Fase 0 Completada (Base de Datos)
**Prioridad:** 🟡 MEDIA
**Tiempo Estimado Restante:** 7.5 semanas (Fases 1-5: Backend + Frontend)
**Próxima Fase:** Fase 1 - Backend Core (2.5 semanas)

---

## 📊 ÍNDICE

1. [Contexto y Justificación](#contexto-y-justificación)
2. [Análisis de Requerimientos](#análisis-de-requerimientos)
3. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
4. [Backend API](#backend-api)
5. [Frontend](#frontend)
6. [Integración con Terminales Físicas](#integración-con-terminales-físicas)
7. [Casos de Uso Principales](#casos-de-uso-principales)
8. [Roadmap de Implementación](#roadmap-de-implementación)
9. [Métricas de Éxito](#métricas-de-éxito)

---

## 🎯 CONTEXTO Y JUSTIFICACIÓN

### Problema a Resolver

**Salones de belleza, spas y consultorios venden productos (30-40% de sus ingresos):**
- ❌ Sin control de stock → Pérdidas por robo/vencimiento
- ❌ Compras sin planificación → Capital inmovilizado
- ❌ Sin trazabilidad de ventas por empleado
- ❌ Cobros manuales → Errores en caja
- ❌ Necesitan software adicional → Costos extras

### Valor Agregado

**Integración total con el sistema existente:**
- ✅ Venta de productos durante citas (auto-registro)
- ✅ Comisiones automáticas por venta de productos
- ✅ Stock en tiempo real en todas las vistas
- ✅ Alertas automáticas de reposición
- ✅ Terminal física integrada (Clip, Mercado Pago Point)
- ✅ Reportes unificados (servicios + productos)
- ✅ Multi-tenant seguro con RLS

### Competencia

**AgendaPro tiene:**
- ✅ Gestión de inventario básica
- ✅ Control de stock y alertas
- ⚠️ TPV solo en planes premium ($149 USD/mes)
- ❌ No tiene comisiones automáticas por productos

**Nuestra ventaja:**
- ✅ Comisiones automáticas por productos (extensión del sistema existente)
- ✅ Integración nativa con citas
- ✅ TPV incluido desde plan profesional ($34 USD)
- ✅ Arquitectura superior (particionamiento, RLS, triggers)

---

## 📋 ANÁLISIS DE REQUERIMIENTOS

### Módulo 1: Gestión de Inventario

#### Funcionalidades Core

**Productos:**
- CRUD productos (nombre, SKU, categoría, precio, stock)
- Múltiples variantes (color, talle, presentación)
- Códigos de barras (EAN13, Code128)
- Imágenes de producto (integración con MinIO futuro)
- Proveedores y costos de adquisición
- Stock mínimo y máximo por producto
- Alertas automáticas de reposición
- Control de vencimientos (productos perecederos)

**Movimientos de Inventario:**
- Entradas (compras a proveedor, devoluciones)
- Salidas (ventas, mermas, uso en servicios, robos)
- Ajustes de inventario (conteo físico)
- Trazabilidad completa (quién, cuándo, por qué)
- Estados: pendiente, confirmado, cancelado

**Categorías:**
- Jerárquicas (Categoría → Subcategoría)
- Ejemplo: "Cabello → Shampoo → Anticaída"
- Custom por organización

**Proveedores:**
- Gestión de proveedores (nombre, contacto, términos)
- Historial de compras
- Tiempos de entrega estimados

#### Funcionalidades Avanzadas

- **Inventario multi-ubicación:** Sucursales, almacenes, vitrinas
- **Lotes y series:** Trazabilidad individual de productos
- **Promociones:** 2x1, descuentos por cantidad, combos
- **Reservas:** Productos reservados para citas futuras
- **Kardex:** Historial completo de movimientos por producto

### Módulo 2: Punto de Venta (POS)

#### Funcionalidades Core

**Venta Rápida:**
- Búsqueda de productos (nombre, SKU, código de barras)
- Escáner de código de barras (USB/Bluetooth)
- Carrito de compras con múltiples productos
- Descuentos por producto o total
- Métodos de pago: efectivo, tarjeta, transferencia, mixto
- Asociar venta a cita existente (opcional)
- Asociar venta a cliente (opcional)
- Generación automática de ticket de venta

**Cobro Integrado:**
- Terminal física (Clip, Mercado Pago Point, SumUp)
- Mercado Pago QR dinámico
- Link de pago por WhatsApp/email
- Registro manual de pago en efectivo

**Tickets y Recibos:**
- Generación automática de PDF
- Envío por email/WhatsApp
- Impresión térmica (opcional)
- Código QR para validación

#### Funcionalidades Avanzadas

- **Preventa/Apartado:** Cliente reserva y paga después
- **Devoluciones:** Registro de devoluciones con ajuste automático de stock
- **Notas de crédito:** Para aplicar en futuras compras
- **Descuentos por membresía:** Clientes frecuentes obtienen descuentos
- **Caja chica:** Control de gastos menores
- **Corte de caja:** Cierre diario con conciliación

### Módulo 3: Integraciones

**Con Citas:**
- Agregar productos a cita en curso
- Auto-descuento de stock al completar cita
- Comisión automática por productos vendidos en cita

**Con Comisiones:**
- Extender tabla `comisiones_profesionales` para incluir productos
- Configuración de comisiones por producto/categoría
- Dashboard unificado (servicios + productos)

**Con Pagos:**
- Integración con Mercado Pago existente
- Terminal física mediante Mercado Pago Point API
- Clip API para terminales Clip
- Webhook de confirmación de pago

**Con Reportes:**
- Productos más vendidos
- Margen de ganancia por producto
- Rotación de inventario (días promedio)
- Valor total de inventario
- Análisis ABC (Pareto)

---

## 🗄️ ARQUITECTURA DE BASE DE DATOS

### Diagrama Relacional

```
organizaciones
    ↓
categorias_productos ← productos → proveedores
    ↓                      ↓
variantes_producto    movimientos_inventario
                           ↓
                      ventas_pos
                           ↓
                      ventas_pos_items
                           ↓
                      pagos (tabla existente)
                           ↓
                      comisiones_profesionales (tabla existente)
```

### Tablas Principales (8 nuevas)

#### 1. **categorias_productos**

```sql
CREATE TABLE categorias_productos (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 🏷️ INFORMACIÓN
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_padre_id INTEGER REFERENCES categorias_productos(id) ON DELETE SET NULL,

    -- 🎨 METADATA
    icono VARCHAR(50), -- emoji o nombre de icono
    color VARCHAR(7), -- hex color
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, nombre),
    CHECK (categoria_padre_id != id) -- No puede ser su propio padre
);

CREATE INDEX idx_categorias_productos_org ON categorias_productos(organizacion_id);
CREATE INDEX idx_categorias_productos_padre ON categorias_productos(categoria_padre_id);
```

**Datos iniciales (11 categorías base):**
- Cabello (Shampoo, Acondicionador, Tratamientos, Tintes)
- Rostro (Cremas, Mascarillas, Sueros, Limpiadores)
- Cuerpo (Exfoliantes, Hidratantes, Protectores solares)
- Manos y Pies (Cremas, Esmaltes, Removedores)
- Maquillaje (Bases, Labiales, Sombras, Máscaras)
- Herramientas (Tijeras, Peines, Secadores, Planchas)
- Equipamiento (Sillas, Camillas, Lámparas)
- Desechables (Guantes, Toallas, Capas)
- Higiene (Desinfectantes, Jabones, Sanitizantes)
- Suplementos (Vitaminas, Proteínas)
- Otros

#### 2. **proveedores**

```sql
CREATE TABLE proveedores (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 🏢 INFORMACIÓN
    nombre VARCHAR(200) NOT NULL,
    razon_social VARCHAR(200),
    rfc_tax_id VARCHAR(50),

    -- 📞 CONTACTO
    telefono VARCHAR(20),
    email VARCHAR(100),
    sitio_web VARCHAR(200),

    -- 📍 DIRECCIÓN
    direccion TEXT,
    ciudad VARCHAR(100),
    estado VARCHAR(100),
    codigo_postal VARCHAR(10),
    pais VARCHAR(50) DEFAULT 'México',

    -- 💼 TÉRMINOS COMERCIALES
    terminos_pago VARCHAR(100), -- "30 días", "Contado", "15-30-45"
    dias_entrega_estimado INTEGER DEFAULT 7,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,

    -- 📝 METADATA
    notas TEXT,
    activo BOOLEAN DEFAULT true,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, nombre)
);

CREATE INDEX idx_proveedores_org ON proveedores(organizacion_id);
CREATE INDEX idx_proveedores_activo ON proveedores(organizacion_id, activo);
```

#### 3. **productos**

```sql
CREATE TABLE productos (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 🏷️ INFORMACIÓN BÁSICA
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    sku VARCHAR(50), -- Stock Keeping Unit
    codigo_barras VARCHAR(50), -- EAN13, Code128, etc.

    -- 📦 CATEGORIZACIÓN
    categoria_id INTEGER REFERENCES categorias_productos(id) ON DELETE SET NULL,
    proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,

    -- 💰 PRECIOS
    precio_compra DECIMAL(10, 2) DEFAULT 0,
    precio_venta DECIMAL(10, 2) NOT NULL,
    precio_mayoreo DECIMAL(10, 2), -- Precio para ventas > cantidad_mayoreo
    cantidad_mayoreo INTEGER, -- Mínimo para aplicar precio mayoreo

    -- 📊 INVENTARIO
    stock_actual INTEGER DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo INTEGER DEFAULT 5,
    stock_maximo INTEGER DEFAULT 100,
    unidad_medida VARCHAR(20) DEFAULT 'unidad', -- unidad, litro, kilo, caja

    -- 🔔 ALERTAS
    alerta_stock_minimo BOOLEAN DEFAULT true,
    alerta_dias_antes_vencimiento INTEGER DEFAULT 30,

    -- 📅 CADUCIDAD
    es_perecedero BOOLEAN DEFAULT false,
    dias_vida_util INTEGER, -- Días desde compra hasta vencimiento

    -- 🎨 PRESENTACIÓN
    imagen_url VARCHAR(500), -- MinIO futuro
    color VARCHAR(50),
    talla VARCHAR(20),

    -- 📝 METADATA
    permite_venta BOOLEAN DEFAULT true,
    permite_uso_servicio BOOLEAN DEFAULT true, -- Se puede usar en citas
    requiere_receta BOOLEAN DEFAULT false,
    notas TEXT,
    activo BOOLEAN DEFAULT true,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, sku),
    UNIQUE(organizacion_id, codigo_barras),
    CHECK (precio_venta > 0),
    CHECK (precio_compra >= 0),
    CHECK (precio_mayoreo IS NULL OR precio_mayoreo < precio_venta)
);

CREATE INDEX idx_productos_org ON productos(organizacion_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX idx_productos_activo ON productos(organizacion_id, activo);
CREATE INDEX idx_productos_sku ON productos(organizacion_id, sku);
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_productos_stock_bajo ON productos(organizacion_id)
    WHERE stock_actual <= stock_minimo AND activo = true;

-- Full-text search
CREATE INDEX idx_productos_nombre_fts ON productos
    USING gin(to_tsvector('spanish', nombre));
```

#### 4. **variantes_producto** (Opcional - Fase 2)

```sql
CREATE TABLE variantes_producto (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    nombre VARCHAR(100) NOT NULL, -- "Azul 500ml", "Rojo M"
    sku_variante VARCHAR(50),
    codigo_barras_variante VARCHAR(50),

    precio_diferencial DECIMAL(10, 2) DEFAULT 0, -- Diferencia con precio base
    stock_actual INTEGER DEFAULT 0,

    -- Atributos
    color VARCHAR(50),
    talla VARCHAR(20),
    peso_volumen VARCHAR(50),

    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variantes_producto ON variantes_producto(producto_id);
```

#### 5. **movimientos_inventario**

```sql
CREATE TABLE movimientos_inventario (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📦 PRODUCTO
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    -- 📊 MOVIMIENTO
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN (
        'entrada_compra',      -- Compra a proveedor
        'entrada_devolucion',  -- Devolución de cliente
        'entrada_ajuste',      -- Ajuste manual positivo
        'salida_venta',        -- Venta POS
        'salida_uso_servicio', -- Usado en cita
        'salida_merma',        -- Vencido, dañado, roto
        'salida_robo',         -- Robo
        'salida_devolucion',   -- Devolución a proveedor
        'salida_ajuste'        -- Ajuste manual negativo
    )),
    cantidad INTEGER NOT NULL CHECK (cantidad != 0),
    stock_antes INTEGER NOT NULL,
    stock_despues INTEGER NOT NULL,

    -- 💰 VALOR
    costo_unitario DECIMAL(10, 2), -- Costo al momento del movimiento
    valor_total DECIMAL(10, 2), -- cantidad * costo_unitario

    -- 🔗 RELACIONES
    proveedor_id INTEGER REFERENCES proveedores(id),
    venta_pos_id INTEGER, -- FK a ventas_pos (definida abajo)
    cita_id INTEGER, -- FK a citas (tabla particionada - sin FK formal)
    usuario_id INTEGER REFERENCES usuarios(id),

    -- 📝 METADATA
    referencia VARCHAR(100), -- Número de factura, orden de compra
    motivo TEXT,
    fecha_vencimiento DATE, -- Para productos perecederos
    lote VARCHAR(50),

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CHECK (
        (tipo_movimiento LIKE 'entrada%' AND cantidad > 0) OR
        (tipo_movimiento LIKE 'salida%' AND cantidad < 0)
    ),
    CHECK (stock_despues = stock_antes + cantidad)
);

CREATE INDEX idx_movimientos_org ON movimientos_inventario(organizacion_id);
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_tipo ON movimientos_inventario(tipo_movimiento);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(creado_en DESC);
CREATE INDEX idx_movimientos_venta ON movimientos_inventario(venta_pos_id);
CREATE INDEX idx_movimientos_cita ON movimientos_inventario(cita_id);
```

**⚠️ NOTA CRÍTICA - Particionamiento:**
```sql
-- ✅ PARTICIONAMIENTO ACTIVADO: La tabla movimientos_inventario DEBE ser particionada
-- Patrón: sql/citas/02-particionamiento.sql (similar a tabla citas)
-- Motivo: Crecimiento exponencial (14,600 mov/año/org × 100 orgs = 1.46M filas/año)

-- Modificar definición de tabla:
CREATE TABLE movimientos_inventario (
    -- ... columnas existentes
    creado_en TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (creado_en);

-- Crear particiones mensuales (se agregarán en archivo separado)
CREATE TABLE movimientos_inventario_2025_11 PARTITION OF movimientos_inventario
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Job pg_cron para creación automática de particiones
SELECT cron.schedule(
    'crear-particiones-movimientos',
    '0 0 1 * *', -- 1ro de cada mes a medianoche
    $$SELECT crear_particion_movimientos_mes_siguiente()$$
);
```

#### 6. **ventas_pos**

```sql
CREATE TABLE ventas_pos (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📝 INFORMACIÓN DE VENTA
    folio VARCHAR(50) NOT NULL, -- Auto-generado: POS-2025-0001
    tipo_venta VARCHAR(20) DEFAULT 'directa' CHECK (tipo_venta IN (
        'directa',      -- Venta directa en mostrador
        'cita',         -- Asociada a cita
        'apartado',     -- Cliente aparta productos
        'cotizacion'    -- Cotización (no afecta inventario aún)
    )),

    -- 🔗 RELACIONES
    cliente_id INTEGER REFERENCES clientes(id),
    cita_id INTEGER, -- FK a citas (tabla particionada - sin FK formal)
    profesional_id INTEGER REFERENCES profesionales(id), -- Quien atendió/vendió
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id), -- Quien registró la venta

    -- 💰 TOTALES
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
    descuento_monto DECIMAL(10, 2) DEFAULT 0,
    impuestos DECIMAL(10, 2) DEFAULT 0, -- IVA u otros
    total DECIMAL(10, 2) NOT NULL,

    -- 💳 PAGO
    metodo_pago VARCHAR(30) CHECK (metodo_pago IN (
        'efectivo',
        'tarjeta',
        'transferencia',
        'qr',
        'terminal',
        'mixto'
    )),
    estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN (
        'pendiente',
        'pagado',
        'parcial',
        'cancelado'
    )),
    monto_pagado DECIMAL(10, 2) DEFAULT 0,
    monto_pendiente DECIMAL(10, 2),

    -- 🔗 INTEGRACIÓN CON PAGOS
    pago_id INTEGER REFERENCES pagos(id), -- Tabla existente

    -- 📝 METADATA
    notas TEXT,
    ticket_url VARCHAR(500), -- URL del PDF del ticket
    estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN (
        'cotizacion',
        'apartado',
        'completada',
        'cancelada',
        'devolucion_parcial',
        'devolucion_total'
    )),

    -- 📅 TIMESTAMPS
    fecha_venta TIMESTAMPTZ DEFAULT NOW(),
    fecha_apartado DATE, -- Si tipo_venta = apartado
    fecha_vencimiento_apartado DATE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, folio),
    CHECK (total >= 0),
    CHECK (monto_pagado <= total),
    CHECK (monto_pendiente = total - monto_pagado)
);

CREATE INDEX idx_ventas_pos_org ON ventas_pos(organizacion_id);
CREATE INDEX idx_ventas_pos_fecha ON ventas_pos(fecha_venta DESC);
CREATE INDEX idx_ventas_pos_cliente ON ventas_pos(cliente_id);
CREATE INDEX idx_ventas_pos_profesional ON ventas_pos(profesional_id);
CREATE INDEX idx_ventas_pos_estado ON ventas_pos(estado);
CREATE INDEX idx_ventas_pos_folio ON ventas_pos(organizacion_id, folio);

-- Trigger auto-generar folio
CREATE OR REPLACE FUNCTION generar_folio_venta()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_folio VARCHAR(50);
    contador INTEGER;
BEGIN
    -- Obtener el último número de folio del año actual
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(folio FROM 'POS-\d{4}-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO contador
    FROM ventas_pos
    WHERE organizacion_id = NEW.organizacion_id
    AND fecha_venta >= DATE_TRUNC('year', NOW());

    -- Generar folio: POS-2025-0001
    nuevo_folio := 'POS-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(contador::TEXT, 4, '0');

    NEW.folio := nuevo_folio;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_folio_venta
    BEFORE INSERT ON ventas_pos
    FOR EACH ROW
    WHEN (NEW.folio IS NULL)
    EXECUTE FUNCTION generar_folio_venta();
```

#### 7. **ventas_pos_items**

```sql
CREATE TABLE ventas_pos_items (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    venta_pos_id INTEGER NOT NULL REFERENCES ventas_pos(id) ON DELETE CASCADE,

    -- 📦 PRODUCTO
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    nombre_producto VARCHAR(200) NOT NULL, -- Snapshot del nombre
    sku VARCHAR(50), -- Snapshot del SKU

    -- 📊 CANTIDAD Y PRECIOS
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
    descuento_monto DECIMAL(10, 2) DEFAULT 0,
    precio_final DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL, -- cantidad * precio_final

    -- 💼 COMISIONES
    aplica_comision BOOLEAN DEFAULT true,

    -- 📝 METADATA
    notas TEXT,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CHECK (precio_final = precio_unitario - descuento_monto),
    CHECK (subtotal = cantidad * precio_final)
);

CREATE INDEX idx_ventas_pos_items_venta ON ventas_pos_items(venta_pos_id);
CREATE INDEX idx_ventas_pos_items_producto ON ventas_pos_items(producto_id);
```

#### 8. **alertas_inventario** (Sistema automático)

```sql
CREATE TABLE alertas_inventario (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    tipo_alerta VARCHAR(30) CHECK (tipo_alerta IN (
        'stock_minimo',
        'stock_agotado',
        'proximo_vencimiento',
        'vencido',
        'sin_movimiento'
    )),

    mensaje TEXT NOT NULL,
    nivel VARCHAR(20) CHECK (nivel IN ('info', 'warning', 'critical')),

    leida BOOLEAN DEFAULT false,
    leida_por INTEGER REFERENCES usuarios(id),
    leida_en TIMESTAMPTZ,

    creado_en TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(producto_id, tipo_alerta, creado_en::DATE)
);

CREATE INDEX idx_alertas_org ON alertas_inventario(organizacion_id);
CREATE INDEX idx_alertas_producto ON alertas_inventario(producto_id);
CREATE INDEX idx_alertas_no_leidas ON alertas_inventario(organizacion_id, leida)
    WHERE leida = false;
```

### Triggers Automáticos

#### 1. **Actualizar stock tras venta POS**

```sql
CREATE OR REPLACE FUNCTION actualizar_stock_venta_pos()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_stock_actual INTEGER;
BEGIN
    -- ⚠️ CRÍTICO: Bypass RLS para operaciones de sistema (patrón calcular_comision_cita)
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Solo procesar si la venta está completada
    IF NEW.estado = 'completada' AND (OLD.estado IS NULL OR OLD.estado != 'completada') THEN

        -- ✅ Anti-duplicados: Validar que no existan movimientos previos
        IF EXISTS (
            SELECT 1 FROM movimientos_inventario
            WHERE venta_pos_id = NEW.id AND tipo_movimiento = 'salida_venta'
        ) THEN
            PERFORM set_config('app.bypass_rls', 'false', true);
            RETURN NEW;
        END IF;

        -- Por cada item de la venta
        FOR item IN SELECT * FROM ventas_pos_items WHERE venta_pos_id = NEW.id
        LOOP
            -- ✅ Lock optimista: Evitar race conditions
            SELECT stock_actual INTO v_stock_actual
            FROM productos
            WHERE id = item.producto_id
            FOR UPDATE;

            -- Validar stock suficiente
            IF v_stock_actual < item.cantidad THEN
                RAISE EXCEPTION 'Stock insuficiente para producto ID %: disponible %, requerido %',
                    item.producto_id, v_stock_actual, item.cantidad;
            END IF;

            -- Actualizar stock del producto
            UPDATE productos
            SET stock_actual = stock_actual - item.cantidad,
                actualizado_en = NOW()
            WHERE id = item.producto_id;

            -- Registrar movimiento de inventario
            INSERT INTO movimientos_inventario (
                organizacion_id,
                producto_id,
                tipo_movimiento,
                cantidad,
                stock_antes,
                stock_despues,
                costo_unitario,
                valor_total,
                venta_pos_id,
                usuario_id,
                creado_en
            )
            SELECT
                NEW.organizacion_id,
                item.producto_id,
                'salida_venta',
                -item.cantidad, -- Negativo porque es salida
                v_stock_actual, -- Stock antes (con lock)
                v_stock_actual - item.cantidad, -- Stock después
                p.precio_compra,
                p.precio_compra * item.cantidad,
                NEW.id,
                NEW.usuario_id,
                NOW()
            FROM productos p
            WHERE p.id = item.producto_id;
        END LOOP;

    END IF;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Limpiar bypass en caso de error
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_actualizar_stock_venta
    AFTER INSERT OR UPDATE OF estado ON ventas_pos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_venta_pos();
```

#### 2. **Generar alertas automáticas**

```sql
CREATE OR REPLACE FUNCTION verificar_alertas_inventario()
RETURNS TRIGGER AS $$
DECLARE
    producto RECORD;
BEGIN
    -- ⚠️ CRÍTICO: Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Obtener información del producto
    SELECT * INTO producto FROM productos WHERE id = NEW.producto_id;

    -- Alerta: Stock mínimo
    IF producto.stock_actual <= producto.stock_minimo AND producto.alerta_stock_minimo THEN
        INSERT INTO alertas_inventario (
            organizacion_id, producto_id, tipo_alerta, mensaje, nivel
        ) VALUES (
            producto.organizacion_id,
            producto.id,
            'stock_minimo',
            'El producto "' || producto.nombre || '" tiene stock bajo (' || producto.stock_actual || ' unidades)',
            'warning'
        )
        ON CONFLICT (producto_id, tipo_alerta, (creado_en::DATE)) DO NOTHING;
    END IF;

    -- Alerta: Stock agotado
    IF producto.stock_actual = 0 THEN
        INSERT INTO alertas_inventario (
            organizacion_id, producto_id, tipo_alerta, mensaje, nivel
        ) VALUES (
            producto.organizacion_id,
            producto.id,
            'stock_agotado',
            'El producto "' || producto.nombre || '" está AGOTADO',
            'critical'
        )
        ON CONFLICT (producto_id, tipo_alerta, (creado_en::DATE)) DO NOTHING;
    END IF;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_verificar_alertas
    AFTER INSERT ON movimientos_inventario
    FOR EACH ROW
    EXECUTE FUNCTION verificar_alertas_inventario();
```

#### 3. **Calcular totales de venta automáticamente**

```sql
CREATE OR REPLACE FUNCTION calcular_totales_venta_pos()
RETURNS TRIGGER AS $$
DECLARE
    suma_subtotales DECIMAL(10, 2);
    v_venta_pos_id INTEGER;
BEGIN
    -- ⚠️ CRÍTICO: Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Determinar ID de venta (funciona con INSERT, UPDATE y DELETE)
    v_venta_pos_id := COALESCE(NEW.venta_pos_id, OLD.venta_pos_id);

    -- Calcular suma de subtotales de items
    SELECT COALESCE(SUM(subtotal), 0)
    INTO suma_subtotales
    FROM ventas_pos_items
    WHERE venta_pos_id = v_venta_pos_id;

    -- Actualizar totales de la venta
    UPDATE ventas_pos
    SET subtotal = suma_subtotales,
        total = suma_subtotales - COALESCE(descuento_monto, 0) + COALESCE(impuestos, 0),
        monto_pendiente = (suma_subtotales - COALESCE(descuento_monto, 0) + COALESCE(impuestos, 0)) - COALESCE(monto_pagado, 0),
        actualizado_en = NOW()
    WHERE id = v_venta_pos_id;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_calcular_totales_venta
    AFTER INSERT OR UPDATE OR DELETE ON ventas_pos_items
    FOR EACH ROW
    EXECUTE FUNCTION calcular_totales_venta_pos();
```

### Row Level Security (RLS)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE categorias_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_pos_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_inventario ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias_productos
CREATE POLICY categorias_productos_select_policy ON categorias_productos
    FOR SELECT USING (organizacion_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY categorias_productos_insert_policy ON categorias_productos
    FOR INSERT WITH CHECK (organizacion_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY categorias_productos_update_policy ON categorias_productos
    FOR UPDATE USING (organizacion_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY categorias_productos_delete_policy ON categorias_productos
    FOR DELETE USING (organizacion_id::text = current_setting('app.current_tenant_id', true));

-- Repetir para todas las tablas con organizacion_id
-- (proveedores, productos, movimientos_inventario, ventas_pos, alertas_inventario)

-- Política especial para ventas_pos_items (JOIN con ventas_pos)
CREATE POLICY ventas_pos_items_select_policy ON ventas_pos_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ventas_pos
            WHERE ventas_pos.id = ventas_pos_items.venta_pos_id
            AND ventas_pos.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
    );
```

### Funciones PL/pgSQL Útiles

#### 1. **Calcular valor total del inventario**

```sql
CREATE OR REPLACE FUNCTION calcular_valor_inventario(org_id INTEGER)
RETURNS TABLE (
    total_productos BIGINT,
    total_unidades BIGINT,
    valor_compra DECIMAL(10, 2),
    valor_venta DECIMAL(10, 2),
    margen_potencial DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_productos,
        SUM(stock_actual)::BIGINT AS total_unidades,
        SUM(stock_actual * precio_compra) AS valor_compra,
        SUM(stock_actual * precio_venta) AS valor_venta,
        SUM(stock_actual * (precio_venta - precio_compra)) AS margen_potencial
    FROM productos
    WHERE organizacion_id = org_id
    AND activo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. **Análisis ABC de productos**

```sql
CREATE OR REPLACE FUNCTION analisis_abc_productos(
    org_id INTEGER,
    fecha_desde DATE,
    fecha_hasta DATE
)
RETURNS TABLE (
    producto_id INTEGER,
    nombre_producto VARCHAR,
    total_vendido BIGINT,
    ingresos_generados DECIMAL(10, 2),
    porcentaje_ingresos DECIMAL(5, 2),
    clasificacion VARCHAR(1)
) AS $$
BEGIN
    RETURN QUERY
    WITH ventas_producto AS (
        SELECT
            vpi.producto_id,
            p.nombre,
            SUM(vpi.cantidad) AS total_vendido,
            SUM(vpi.subtotal) AS ingresos
        FROM ventas_pos_items vpi
        JOIN productos p ON p.id = vpi.producto_id
        JOIN ventas_pos vp ON vp.id = vpi.venta_pos_id
        WHERE vp.organizacion_id = org_id
        AND vp.fecha_venta BETWEEN fecha_desde AND fecha_hasta
        AND vp.estado = 'completada'
        GROUP BY vpi.producto_id, p.nombre
    ),
    total_ingresos AS (
        SELECT SUM(ingresos) AS total FROM ventas_producto
    ),
    porcentajes AS (
        SELECT
            vp.*,
            (vp.ingresos / ti.total * 100) AS porcentaje,
            SUM(vp.ingresos / ti.total * 100) OVER (ORDER BY vp.ingresos DESC) AS porcentaje_acumulado
        FROM ventas_producto vp, total_ingresos ti
    )
    SELECT
        producto_id,
        nombre,
        total_vendido,
        ingresos,
        porcentaje,
        CASE
            WHEN porcentaje_acumulado <= 80 THEN 'A'
            WHEN porcentaje_acumulado <= 95 THEN 'B'
            ELSE 'C'
        END AS clasificacion
    FROM porcentajes
    ORDER BY ingresos DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔌 BACKEND API

### Estructura de Archivos

```
backend/app/
├── templates/scheduling-saas/
│   ├── controllers/
│   │   ├── inventario/
│   │   │   ├── index.js (proxy exports)
│   │   │   ├── productos.controller.js
│   │   │   ├── categorias.controller.js
│   │   │   ├── proveedores.controller.js
│   │   │   ├── movimientos.controller.js
│   │   │   └── reportes.controller.js
│   │   └── pos/
│   │       ├── index.js (proxy exports)
│   │       ├── ventas.controller.js
│   │       └── tickets.controller.js
│   ├── models/
│   │   ├── inventario/
│   │   │   ├── productos.model.js
│   │   │   ├── categorias.model.js
│   │   │   ├── proveedores.model.js
│   │   │   ├── movimientos.model.js
│   │   │   ├── alertas.model.js
│   │   │   └── index.js
│   │   └── pos/
│   │       ├── ventas.model.js
│   │       ├── tickets.model.js
│   │       └── index.js
│   ├── schemas/
│   │   ├── inventario.schemas.js
│   │   └── pos.schemas.js
│   ├── routes/
│   │   ├── inventario.js
│   │   └── pos.js
│   └── utils/
│       └── barcode.util.js (nuevo - validación de códigos de barras)
├── config/
│   └── planLimits.js (nuevo - límites por plan)
├── services/
│   └── emailService.js (extender existente con alertas de stock)
└── utils/
    └── dbRetry.util.js (nuevo - retry logic para deadlocks)
```

**⚠️ IMPORTANTE - Estructura Corregida:**
- ✅ Usa `models/` NO `database/` (consistente con arquitectura existente)
- ✅ Ubicación completa: `backend/app/templates/scheduling-saas/`
- ✅ Sigue patrón de módulos `citas/`, `comisiones/`, `marketplace/`
- ✅ Cada subcarpeta de models tiene `index.js` para exports

---

### ⚠️ Middleware Stack OBLIGATORIO

**Todas las rutas deben seguir este orden:**

```javascript
// EJEMPLO: Ruta para crear producto
router.post('/productos',
    auth.authenticateToken,           // 1. Autenticación JWT
    tenant.setTenantContext,          // 2. Contexto RLS multi-tenant
    subscription.validateLimits('productos'), // 3. ✅ VALIDAR LÍMITES DEL PLAN
    rateLimiting.apiRateLimit,        // 4. Rate limiting
    validation.validate(inventarioSchemas.crearProducto), // 5. Validación Joi
    asyncHandler(InventarioController.crearProducto)      // 6. Controller
);

// EJEMPLO: Ruta bulk create (validar antes de crear)
router.post('/productos/bulk',
    auth.authenticateToken,
    tenant.setTenantContext,
    subscription.validateBulkLimits('productos', 50), // ✅ Max 50 items
    rateLimiting.apiRateLimit,
    validation.validate(inventarioSchemas.bulkCrearProductos),
    asyncHandler(InventarioController.bulkCrear)
);

// EJEMPLO: Ruta de consulta (SIN validación de límites)
router.get('/productos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(inventarioSchemas.listarProductos),
    asyncHandler(InventarioController.listar)
);
```

**🔴 CRÍTICO:** El middleware `subscription` es **OBLIGATORIO** en:
- `POST /productos` (crear)
- `POST /productos/bulk` (crear múltiples)
- `POST /categorias` (crear)
- `POST /proveedores` (crear)
- `POST /ventas` (crear venta POS)

**Referencias:**
- `backend/app/config/planLimits.js` - Configuración de límites por plan
- `backend/app/middleware/subscription.js` - Middleware existente (extender)

---

### Endpoints - Inventario (22 endpoints)

#### **Productos** (8 endpoints)

```javascript
// CRUD básico
POST   /api/v1/inventario/productos                    // Crear producto
POST   /api/v1/inventario/productos/bulk               // Crear múltiples (1-50)
GET    /api/v1/inventario/productos                    // Listar con filtros
GET    /api/v1/inventario/productos/:id                // Detalle
PUT    /api/v1/inventario/productos/:id                // Actualizar
PATCH  /api/v1/inventario/productos/:id/stock          // Ajustar stock manual
DELETE /api/v1/inventario/productos/:id                // Eliminar (soft delete)

// Búsqueda avanzada
GET    /api/v1/inventario/productos/buscar             // Full-text search + código de barras
```

**Query params comunes:**
- `categoria_id`: Filtrar por categoría
- `proveedor_id`: Filtrar por proveedor
- `stock_bajo`: Solo productos con stock <= stock_minimo
- `activo`: true/false
- `q`: Búsqueda full-text (nombre, SKU, código barras)
- `orden`: nombre|precio|stock|categoria (default: nombre)
- `pagina`, `limite`: Paginación

#### **Categorías** (5 endpoints)

```javascript
POST   /api/v1/inventario/categorias                   // Crear categoría
GET    /api/v1/inventario/categorias                   // Listar (jerarquía árbol)
GET    /api/v1/inventario/categorias/:id               // Detalle
PUT    /api/v1/inventario/categorias/:id               // Actualizar
DELETE /api/v1/inventario/categorias/:id               // Eliminar
```

#### **Proveedores** (5 endpoints)

```javascript
POST   /api/v1/inventario/proveedores                  // Crear proveedor
GET    /api/v1/inventario/proveedores                  // Listar
GET    /api/v1/inventario/proveedores/:id              // Detalle
PUT    /api/v1/inventario/proveedores/:id              // Actualizar
DELETE /api/v1/inventario/proveedores/:id              // Eliminar
```

#### **Movimientos** (3 endpoints)

```javascript
POST   /api/v1/inventario/movimientos                  // Registrar movimiento
GET    /api/v1/inventario/movimientos                  // Listar con filtros
GET    /api/v1/inventario/movimientos/kardex/:producto_id  // Kardex de producto
```

**Query params movimientos:**
- `producto_id`: Filtrar por producto
- `tipo_movimiento`: entrada_compra|salida_venta|etc
- `fecha_desde`, `fecha_hasta`: Rango de fechas
- `proveedor_id`: Solo compras de X proveedor

#### **Reportes y Analytics** (4 endpoints)

```javascript
GET    /api/v1/inventario/reportes/valor-inventario    // Valor total de inventario
GET    /api/v1/inventario/reportes/analisis-abc        // Clasificación ABC
GET    /api/v1/inventario/reportes/rotacion            // Días promedio de rotación
GET    /api/v1/inventario/reportes/alertas             // Alertas pendientes
```

#### **Alertas** (2 endpoints)

```javascript
GET    /api/v1/inventario/alertas                      // Listar alertas no leídas
PATCH  /api/v1/inventario/alertas/:id/marcar-leida    // Marcar como leída
```

### Endpoints - POS (11 endpoints) ⚠️ MVP sin terminales físicas

#### **Ventas** (9 endpoints)

```javascript
// CRUD ventas
POST   /api/v1/pos/ventas                              // Crear venta POS
POST   /api/v1/pos/ventas/:id/items                    // Agregar items a venta
GET    /api/v1/pos/ventas                              // Listar ventas
GET    /api/v1/pos/ventas/:id                          // Detalle de venta
PUT    /api/v1/pos/ventas/:id                          // Actualizar venta
DELETE /api/v1/pos/ventas/:id                          // Cancelar venta

// Operaciones especiales
POST   /api/v1/pos/ventas/:id/pagar                    // Registrar pago
POST   /api/v1/pos/ventas/:id/devolucion               // Procesar devolución
GET    /api/v1/pos/ventas/:id/ticket                   // Generar ticket PDF
```

**Query params ventas:**
- `cliente_id`: Filtrar por cliente
- `profesional_id`: Filtrar por profesional
- `estado`: completada|cancelada|apartado
- `fecha_desde`, `fecha_hasta`: Rango
- `metodo_pago`: efectivo|tarjeta|etc

#### **Reportes POS** (2 endpoints)

```javascript
GET    /api/v1/pos/reportes/ventas-diarias             // Reporte de ventas del día
POST   /api/v1/pos/reportes/corte-caja                 // Corte de caja
```

### Dependencias a Instalar

**Backend (`backend/app/`):**
```bash
cd backend/app
npm install jsbarcode --save
```

**Nota:** Se utilizará `jsbarcode` para validación y generación de códigos de barras (EAN13, Code128).

---

### Schemas de Validación (Joi)

#### inventario.schemas.js

```javascript
const Joi = require('joi');
const jsbarcode = require('jsbarcode'); // ⚠️ Instalado en backend/app

const inventarioSchemas = {
    // ========== PRODUCTOS ==========
    crearProducto: {
        body: Joi.object({
            nombre: Joi.string().max(200).required(),
            descripcion: Joi.string().max(1000).optional().allow(null, ''),
            sku: Joi.string().max(50).optional(),
            codigo_barras: Joi.string().max(50).optional().custom((value, helpers) => {
                // Validar formato EAN13/Code128 usando jsbarcode
                if (value) {
                    try {
                        // Validación simple de longitud y formato
                        if (!/^[0-9]{8,13}$/.test(value)) {
                            return helpers.error('any.custom', {
                                message: 'Código de barras inválido (formato EAN8/EAN13 esperado)'
                            });
                        }
                    } catch (error) {
                        return helpers.error('any.custom', {
                            message: 'Código de barras inválido'
                        });
                    }
                }
                return value;
            }),
            categoria_id: Joi.number().integer().positive().optional(),
            proveedor_id: Joi.number().integer().positive().optional(),
            precio_compra: Joi.number().min(0).optional().default(0),
            precio_venta: Joi.number().min(0.01).required(),
            precio_mayoreo: Joi.number().min(0).optional(),
            cantidad_mayoreo: Joi.number().integer().min(1).optional(),
            stock_actual: Joi.number().integer().min(0).optional().default(0),
            stock_minimo: Joi.number().integer().min(0).optional().default(5),
            stock_maximo: Joi.number().integer().min(1).optional().default(100),
            unidad_medida: Joi.string().max(20).optional().default('unidad'),
            alerta_stock_minimo: Joi.boolean().optional().default(true),
            es_perecedero: Joi.boolean().optional().default(false),
            dias_vida_util: Joi.number().integer().min(1).optional(),
            permite_venta: Joi.boolean().optional().default(true),
            permite_uso_servicio: Joi.boolean().optional().default(true),
            notas: Joi.string().max(500).optional().allow(null, '')
        }).custom((value, helpers) => {
            // Validaciones custom
            if (value.precio_mayoreo && !value.cantidad_mayoreo) {
                return helpers.error('any.custom', {
                    message: 'Si especificas precio_mayoreo, debes especificar cantidad_mayoreo'
                });
            }
            if (value.precio_mayoreo >= value.precio_venta) {
                return helpers.error('any.custom', {
                    message: 'El precio_mayoreo debe ser menor que precio_venta'
                });
            }
            if (value.stock_minimo > value.stock_maximo) {
                return helpers.error('any.custom', {
                    message: 'stock_minimo no puede ser mayor que stock_maximo'
                });
            }
            return value;
        })
    },

    // ========== MOVIMIENTOS ==========
    registrarMovimiento: {
        body: Joi.object({
            producto_id: Joi.number().integer().positive().required(),
            tipo_movimiento: Joi.string().valid(
                'entrada_compra', 'entrada_devolucion', 'entrada_ajuste',
                'salida_venta', 'salida_uso_servicio', 'salida_merma',
                'salida_robo', 'salida_devolucion', 'salida_ajuste'
            ).required(),
            cantidad: Joi.number().integer().required().custom((value, helpers) => {
                const tipo = helpers.state.ancestors[0].tipo_movimiento;
                if (tipo.startsWith('entrada') && value <= 0) {
                    return helpers.error('any.custom', {
                        message: 'Las entradas deben tener cantidad positiva'
                    });
                }
                if (tipo.startsWith('salida') && value >= 0) {
                    return helpers.error('any.custom', {
                        message: 'Las salidas deben tener cantidad negativa'
                    });
                }
                return value;
            }),
            costo_unitario: Joi.number().min(0).optional(),
            proveedor_id: Joi.number().integer().positive().optional(),
            referencia: Joi.string().max(100).optional(),
            motivo: Joi.string().max(500).optional().allow(null, ''),
            fecha_vencimiento: Joi.date().iso().optional(),
            lote: Joi.string().max(50).optional()
        })
    },

    // ========== CATEGORÍAS ==========
    crearCategoria: {
        body: Joi.object({
            nombre: Joi.string().max(100).required(),
            descripcion: Joi.string().max(500).optional().allow(null, ''),
            categoria_padre_id: Joi.number().integer().positive().optional(),
            icono: Joi.string().max(50).optional(),
            color: Joi.string().regex(/^#[0-9A-F]{6}$/i).optional(),
            orden: Joi.number().integer().min(0).optional().default(0)
        })
    }
};

module.exports = inventarioSchemas;
```

#### pos.schemas.js

```javascript
const Joi = require('joi');

const posSchemas = {
    crearVenta: {
        body: Joi.object({
            tipo_venta: Joi.string().valid('directa', 'cita', 'apartado', 'cotizacion')
                .optional().default('directa'),
            cliente_id: Joi.number().integer().positive().optional(),
            cita_id: Joi.number().integer().positive().optional(),
            profesional_id: Joi.number().integer().positive().optional(),
            items: Joi.array().min(1).items(
                Joi.object({
                    producto_id: Joi.number().integer().positive().required(),
                    cantidad: Joi.number().integer().min(1).required(),
                    precio_unitario: Joi.number().min(0).optional(), // Si no se envía, usa el del producto
                    descuento_monto: Joi.number().min(0).optional().default(0),
                    descuento_porcentaje: Joi.number().min(0).max(100).optional().default(0)
                })
            ).required(),
            descuento_monto: Joi.number().min(0).optional().default(0),
            descuento_porcentaje: Joi.number().min(0).max(100).optional().default(0),
            metodo_pago: Joi.string().valid(
                'efectivo', 'tarjeta', 'transferencia', 'qr', 'terminal', 'mixto'
            ).required(),
            monto_pagado: Joi.number().min(0).optional(),
            notas: Joi.string().max(500).optional().allow(null, '')
        })
    },

    procesarPagoTerminal: {
        body: Joi.object({
            venta_id: Joi.number().integer().positive().required(),
            tipo_terminal: Joi.string().valid('mercadopago', 'clip').required(),
            monto: Joi.number().min(0.01).required(),
            terminal_id: Joi.string().optional() // ID del dispositivo terminal
        })
    }
};

module.exports = posSchemas;
```

### Servicios de Terminales

#### mercadoPagoTerminal.service.js

```javascript
/**
 * Servicio para integración con Mercado Pago Point (Terminal Física)
 * Docs: https://www.mercadopago.com.mx/developers/es/docs/mp-point
 */

const axios = require('axios');

class MercadoPagoTerminalService {
    constructor() {
        this.baseURL = 'https://api.mercadopago.com';
        this.accessToken = process.env.MP_ACCESS_TOKEN;
    }

    /**
     * Crear orden de pago en terminal física
     */
    async crearOrdenTerminal({ amount, description, external_reference, terminal_id }) {
        try {
            const response = await axios.post(
                `${this.baseURL}/point/integration-api/devices/${terminal_id}/payment-intents`,
                {
                    amount,
                    description,
                    external_reference,
                    payment: {
                        installments: 1,
                        type: 'credit_card' // o 'debit_card'
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                payment_intent_id: response.data.id,
                status: response.data.state
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Consultar estado de pago
     */
    async consultarEstadoPago(payment_intent_id) {
        try {
            const response = await axios.get(
                `${this.baseURL}/point/integration-api/payment-intents/${payment_intent_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            return {
                success: true,
                status: response.data.state,
                payment: response.data.payment
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Generar QR dinámico para cobro
     */
    async generarQR({ amount, description, external_reference }) {
        try {
            const response = await axios.post(
                `${this.baseURL}/checkout/preferences`,
                {
                    items: [{
                        title: description,
                        quantity: 1,
                        unit_price: amount,
                        currency_id: 'MXN'
                    }],
                    external_reference,
                    notification_url: `${process.env.BACKEND_URL}/api/v1/webhooks/mercadopago`
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                qr_code: response.data.qr_code,
                qr_code_base64: response.data.qr_code_base64,
                init_point: response.data.init_point
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

module.exports = new MercadoPagoTerminalService();
```

### Dependencias Adicionales Requeridas

**Agregar a `package.json`:**
```json
{
  "dependencies": {
    "barcode-validator": "^2.0.0",  // Validación EAN13/Code128
    "pdfkit": "^0.15.0",            // Generación de tickets PDF
    "qrcode": "^1.5.4"              // QR en tickets de venta
  }
}
```

### Servicio de Emails - Alertas de Stock

**Extender servicio existente:** `services/emailService.js`

```javascript
/**
 * Enviar alerta de stock bajo a administradores
 * Se ejecuta automáticamente por trigger verificar_alertas_inventario()
 */
async enviarAlertaStockBajo(organizacion, productos) {
    const htmlTemplate = `
        <h2>⚠️ Alerta: Productos con Stock Bajo</h2>
        <p>La organización <strong>${organizacion.nombre}</strong> tiene ${productos.length} producto(s) con stock bajo:</p>
        <ul>
            ${productos.map(p => `
                <li>
                    <strong>${p.nombre}</strong> (SKU: ${p.sku || 'N/A'})
                    <br>Stock actual: ${p.stock_actual} / Mínimo: ${p.stock_minimo}
                </li>
            `).join('')}
        </ul>
        <p>Por favor, revisar y realizar pedidos de reposición.</p>
    `;

    await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: organizacion.email_admin,
        subject: `⚠️ Alerta: ${productos.length} producto(s) con stock bajo`,
        html: htmlTemplate
    });
}

/**
 * Enviar alerta de stock agotado (crítica)
 */
async enviarAlertaStockAgotado(organizacion, productos) {
    // Similar pero con nivel crítico
    // ...
}
```

**Integración con trigger:**
```javascript
// En routes/api/v1/inventario.js - Endpoint para envío manual de alertas
router.post('/alertas/enviar-email',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    async (req, res) => {
        const organizacion = await OrganizacionModel.obtenerPorId(req.tenant.organizacionId);
        const productosStockBajo = await ProductosModel.listarStockBajo(req.tenant.organizacionId);

        await emailService.enviarAlertaStockBajo(organizacion, productosStockBajo);

        res.json({ success: true, message: 'Alerta enviada' });
    }
);
```

---

## 🎨 FRONTEND

### Estructura de Archivos

```
frontend/src/
├── pages/
│   ├── inventario/
│   │   ├── ProductosPage.jsx
│   │   ├── CategoriasPage.jsx
│   │   ├── ProveedoresPage.jsx
│   │   ├── MovimientosPage.jsx
│   │   └── ReportesInventarioPage.jsx
│   └── pos/
│       ├── VentaPOSPage.jsx (pantalla principal)
│       ├── HistorialVentasPage.jsx
│       └── ReportesCajaPage.jsx
├── components/
│   ├── inventario/
│   │   ├── ProductoFormModal.jsx
│   │   ├── ProductosTable.jsx
│   │   ├── BuscarProducto.jsx (con código de barras)
│   │   ├── AlertasInventario.jsx
│   │   ├── CategoriaTreeSelect.jsx
│   │   ├── MovimientoFormModal.jsx
│   │   └── GraficaRotacion.jsx (Chart.js)
│   ├── pos/
│   │   ├── CarritoVenta.jsx
│   │   ├── BuscadorProductosPOS.jsx
│   │   ├── MetodoPagoModal.jsx
│   │   ├── TerminalPagoModal.jsx
│   │   ├── TicketVenta.jsx (PDF preview)
│   │   └── CorteCAjaModal.jsx
│   └── dashboard/
│       └── InventarioWidget.jsx (para Dashboard principal)
├── hooks/
│   ├── useInventario.js (15 hooks)
│   └── usePOS.js (12 hooks)
└── services/api/
    └── endpoints.js (agregar inventarioApi y posApi)
```

### Páginas Principales

#### 1. **VentaPOSPage.jsx** - Pantalla Principal POS

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]  PUNTO DE VENTA            [Usuario] [Fecha/Hora]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────┐  ┌─────────────────────┐  │
│  │  BÚSQUEDA DE PRODUCTOS      │  │   CARRITO           │  │
│  │  ┌───────────────────────┐  │  │                     │  │
│  │  │ [🔍] Buscar o escanear│  │  │  Cliente: [Buscar]  │  │
│  │  └───────────────────────┘  │  │  Profesional: [...]  │  │
│  │                             │  │                     │  │
│  │  ┌─────────────────────┐   │  │  ┌───────────────┐  │  │
│  │  │ 📦 Producto 1       │   │  │  │ Item 1  $100  │  │  │
│  │  │ $50 - Stock: 10     │   │  │  │ Item 2  $200  │  │  │
│  │  │ [+ Agregar]         │   │  │  │             ─  │  │  │
│  │  └─────────────────────┘   │  │  │ Subtotal: $300│  │  │
│  │                             │  │  │ Descuento: $0 │  │  │
│  │  [Más productos...]         │  │  │ TOTAL:  $300  │  │  │
│  │                             │  │  └───────────────┘  │  │
│  │  [Escanear código barras]   │  │                     │  │
│  │                             │  │  [🗑️ Vaciar]         │  │
│  │                             │  │  [💳 COBRAR]        │  │
│  └─────────────────────────────┘  └─────────────────────┘  │
│                                                              │
│  [⬅️ Ventas Hoy]  [📊 Reportes]  [⚙️ Configuración]         │
└──────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Búsqueda en tiempo real (nombre, SKU, código de barras)
- Escaneo con lector USB/Bluetooth
- Agregar productos al carrito con cantidad
- Editar cantidad/precio/descuento por item
- Asociar a cliente (opcional)
- Asociar a cita (opcional)
- Múltiples métodos de pago
- Generar ticket PDF
- Enviar ticket por WhatsApp/email

#### 2. **ProductosPage.jsx** - Gestión de Productos

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  📦 PRODUCTOS                          [+ Nuevo Producto]    │
├──────────────────────────────────────────────────────────────┤
│  Filtros: [Categoría ▼] [Proveedor ▼] [Stock Bajo ☐]       │
│  Buscar: [🔍 Nombre, SKU, código...]         [Exportar CSV] │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Imagen  │ Nombre       │ SKU    │ Stock │ Precio │ ... │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  [📷]   │ Shampoo X   │ SH001  │ 25/50 │ $150  │ ✏️🗑️│ │
│  │  [📷]   │ Tinte Rojo  │ TI002  │ 3/20⚠️│ $350  │ ✏️🗑️│ │
│  │  ...                                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Mostrando 1-20 de 156      [◀️ 1 2 3 ... 8 ▶️]             │
└──────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- CRUD completo de productos
- Bulk import desde CSV/Excel
- Filtros avanzados
- Indicadores visuales de stock bajo
- Búsqueda full-text
- Exportación a CSV

#### 3. **ReportesInventarioPage.jsx**

**Tabs:**
- **Valor de Inventario:** Total en stock, por categoría, por proveedor
- **Análisis ABC:** Clasificación de productos por ventas
- **Rotación:** Productos de rápida/lenta rotación
- **Alertas:** Stock bajo, vencimientos próximos
- **Kardex:** Historial completo de movimientos

### Componentes Clave

#### CarritoVenta.jsx

```jsx
import React, { useState } from 'react';

export default function CarritoVenta({ items, onUpdateItem, onRemoveItem, onClear }) {
    const [descuentoGlobal, setDescuentoGlobal] = useState(0);

    const subtotal = items.reduce((sum, item) => sum + (item.precio_final * item.cantidad), 0);
    const total = subtotal - descuentoGlobal;

    return (
        <div className="carrito-container">
            <h3>Carrito de Venta</h3>

            {/* Lista de items */}
            <div className="items-list">
                {items.map(item => (
                    <div key={item.producto_id} className="cart-item">
                        <div className="item-info">
                            <span className="nombre">{item.nombre}</span>
                            <span className="sku">{item.sku}</span>
                        </div>
                        <div className="item-controls">
                            <input
                                type="number"
                                min="1"
                                max={item.stock_disponible}
                                value={item.cantidad}
                                onChange={(e) => onUpdateItem(item.producto_id, 'cantidad', e.target.value)}
                            />
                            <span className="precio">${item.precio_final * item.cantidad}</span>
                            <button onClick={() => onRemoveItem(item.producto_id)}>🗑️</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Totales */}
            <div className="totales">
                <div className="subtotal">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="descuento">
                    <span>Descuento:</span>
                    <input
                        type="number"
                        min="0"
                        max={subtotal}
                        value={descuentoGlobal}
                        onChange={(e) => setDescuentoGlobal(parseFloat(e.target.value))}
                    />
                </div>
                <div className="total">
                    <span>TOTAL:</span>
                    <span className="total-amount">${total.toFixed(2)}</span>
                </div>
            </div>

            {/* Acciones */}
            <div className="actions">
                <button className="btn-secondary" onClick={onClear}>
                    🗑️ Vaciar Carrito
                </button>
                <button className="btn-primary" disabled={items.length === 0}>
                    💳 COBRAR
                </button>
            </div>
        </div>
    );
}
```

#### BuscadorProductosPOS.jsx (con código de barras)

```jsx
import React, { useState, useEffect } from 'react';
import { useBuscarProductos } from '../../hooks/useInventario';

export default function BuscadorProductosPOS({ onSelectProducto }) {
    const [query, setQuery] = useState('');
    const [listenBarcode, setListenBarcode] = useState(true);
    const [barcodeBuffer, setBarcodeBuffer] = useState('');

    const { data: productos, isLoading } = useBuscarProductos({ q: query });

    // Escuchar escaneo de código de barras
    useEffect(() => {
        if (!listenBarcode) return;

        let timeoutId;

        const handleKeyPress = (e) => {
            // Acumular caracteres del escáner
            setBarcodeBuffer(prev => prev + e.key);

            // Reset buffer después de 100ms (fin de escaneo)
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if (barcodeBuffer.length > 8) {
                    // Buscar producto por código de barras
                    buscarPorCodigoBarras(barcodeBuffer);
                }
                setBarcodeBuffer('');
            }, 100);
        };

        window.addEventListener('keypress', handleKeyPress);
        return () => {
            window.removeEventListener('keypress', handleKeyPress);
            clearTimeout(timeoutId);
        };
    }, [listenBarcode, barcodeBuffer]);

    const buscarPorCodigoBarras = async (codigo) => {
        // Buscar producto
        const producto = await inventarioApi.buscarPorCodigoBarras(codigo);
        if (producto) {
            onSelectProducto(producto);
            setQuery('');
        }
    };

    return (
        <div className="buscador-productos">
            <input
                type="text"
                placeholder="🔍 Buscar producto o escanear código..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setListenBarcode(false)}
                onBlur={() => setListenBarcode(true)}
            />

            {isLoading && <div className="loading">Buscando...</div>}

            <div className="resultados">
                {productos?.map(producto => (
                    <div
                        key={producto.id}
                        className="producto-card"
                        onClick={() => onSelectProducto(producto)}
                    >
                        <div className="producto-info">
                            <h4>{producto.nombre}</h4>
                            <span className="sku">{producto.sku}</span>
                        </div>
                        <div className="producto-meta">
                            <span className="precio">${producto.precio_venta}</span>
                            <span className={`stock ${producto.stock_actual <= producto.stock_minimo ? 'bajo' : ''}`}>
                                Stock: {producto.stock_actual}
                            </span>
                        </div>
                        <button className="btn-agregar">+ Agregar</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### Hooks Personalizados

#### useInventario.js

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '../services/api/endpoints';

// ========== PRODUCTOS ==========

export function useProductos(filtros = {}) {
    return useQuery({
        queryKey: ['productos', filtros],
        queryFn: async () => {
            // ✅ IMPORTANTE: Sanitizar parámetros (patrón de useComisiones.js)
            const sanitizedParams = Object.entries(filtros).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await inventarioApi.listarProductos(sanitizedParams);
            return response.data?.data || []; // ✅ Extracción segura
        },
        staleTime: 5 * 60 * 1000, // 5 minutos (aumentado de 30s)
        enabled: true
    });
}

export function useProducto(id) {
    return useQuery({
        queryKey: ['producto', id],
        queryFn: () => inventarioApi.obtenerProducto(id),
        enabled: !!id
    });
}

export function useCrearProducto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: inventarioApi.crearProducto,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productos'] });
        }
    });
}

export function useActualizarProducto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => inventarioApi.actualizarProducto(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['productos'] });
            queryClient.invalidateQueries({ queryKey: ['producto', id] });
        }
    });
}

// ========== MOVIMIENTOS ==========

export function useMovimientos(filtros = {}) {
    return useQuery({
        queryKey: ['movimientos', filtros],
        queryFn: () => inventarioApi.listarMovimientos(filtros),
        staleTime: 60000
    });
}

export function useRegistrarMovimiento() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: inventarioApi.registrarMovimiento,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            queryClient.invalidateQueries({ queryKey: ['producto', variables.producto_id] });
            queryClient.invalidateQueries({ queryKey: ['productos'] });
        }
    });
}

// ========== ALERTAS ==========

export function useAlertas() {
    return useQuery({
        queryKey: ['alertas-inventario'],
        queryFn: inventarioApi.obtenerAlertas,
        refetchInterval: 60000 // Refetch cada minuto
    });
}

// ========== REPORTES ==========

export function useValorInventario() {
    return useQuery({
        queryKey: ['valor-inventario'],
        queryFn: inventarioApi.reportes.valorInventario,
        staleTime: 300000 // 5 minutos
    });
}

export function useAnalisisABC(fechas) {
    return useQuery({
        queryKey: ['analisis-abc', fechas],
        queryFn: () => inventarioApi.reportes.analisisABC(fechas),
        enabled: !!(fechas.fecha_desde && fechas.fecha_hasta)
    });
}
```

#### usePOS.js

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '../services/api/endpoints';

// ========== VENTAS ==========

export function useVentas(filtros = {}) {
    return useQuery({
        queryKey: ['ventas-pos', filtros],
        queryFn: () => posApi.listarVentas(filtros),
        staleTime: 30000
    });
}

export function useCrearVenta() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: posApi.crearVenta,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ventas-pos'] });
            queryClient.invalidateQueries({ queryKey: ['productos'] }); // Actualiza stock
        }
    });
}

export function useProcesarPagoTerminal() {
    return useMutation({
        mutationFn: posApi.procesarPagoTerminal
    });
}

export function useGenerarTicket(ventaId) {
    return useQuery({
        queryKey: ['ticket', ventaId],
        queryFn: () => posApi.generarTicket(ventaId),
        enabled: !!ventaId,
        staleTime: Infinity
    });
}
```

---

## 🔌 INTEGRACIÓN CON TERMINALES FÍSICAS ⏳ POST-MVP

**⚠️ NOTA IMPORTANTE:** Esta funcionalidad fue movida a **Fase 6** (Post-MVP).

**Documento completo:** `docs/PLAN_POS_TERMINALES_FISICAS.md`

**Resumen:**
- 💳 **Terminales soportadas:** Mercado Pago Point + Clip
- ⚡ **Valor:** Cobros instantáneos con confirmación automática
- 🔜 **Prioridad:** Media (evaluar demanda post-lanzamiento MVP)
- ⏱️ **Tiempo estimado:** 1-2 semanas adicionales

**MVP incluye:**
- ✅ Métodos de pago manuales (efectivo, tarjeta, transferencia, mixto)
- ✅ QR dinámico Mercado Pago (sin terminal física)
- ✅ Registro manual de pagos

---

## 📱 CASOS DE USO PRINCIPALES

### Caso 1: Venta Rápida de Productos

**Actor:** Recepcionista
**Escenario:** Cliente compra productos sin cita

**Flujo:**
1. Recepcionista abre POS
2. Escanea códigos de barras de productos
3. Sistema agrega automáticamente al carrito
4. Ajusta cantidad si es necesario
5. Asocia a cliente (busca por teléfono)
6. Selecciona método de pago: Efectivo / Tarjeta manual / Transferencia / QR MP
7. Registra pago en el sistema
8. Sistema descuenta stock automáticamente (trigger)
9. Sistema genera comisión para vendedor (si aplica)
10. Genera ticket PDF y envía por WhatsApp al cliente

**Resultado:**
- ✅ Venta registrada
- ✅ Stock actualizado en tiempo real
- ✅ Comisión generada para vendedor
- ✅ Cliente recibe ticket digital

### Caso 2: Venta de Productos Durante Cita

**Actor:** Profesional (estilista)
**Escenario:** Durante una cita, cliente compra shampoo

**Flujo:**
1. Profesional está en vista de cita en curso
2. Click en "Agregar Productos"
3. Busca "Shampoo Anticaída"
4. Agrega al carrito de la cita
5. Al finalizar cita, cobra servicio + productos juntos
6. Sistema genera:
   - Comisión por servicios
   - Comisión por productos
   - Descuenta stock
   - Ticket unificado

**Resultado:**
- ✅ Venta integrada con cita
- ✅ Comisiones automáticas (servicios + productos)
- ✅ Un solo ticket para todo

### Caso 3: Alerta de Stock Bajo

**Actor:** Admin
**Escenario:** Producto se está agotando

**Flujo:**
1. Sistema detecta stock <= stock_minimo
2. Trigger genera alerta automática
3. Admin recibe notificación en Dashboard
4. Click en alerta → Modal con detalles
5. "Crear Orden de Compra"
6. Selecciona proveedor, cantidad
7. Sistema registra movimiento tipo "entrada_compra"
8. Stock se actualiza al recibir productos

**Resultado:**
- ✅ Nunca se queda sin stock crítico
- ✅ Reposición planificada
- ✅ Trazabilidad de compras

### Caso 4: Análisis ABC de Productos

**Actor:** Gerente
**Escenario:** Revisión mensual de inventario

**Flujo:**
1. Gerente abre Reportes → Análisis ABC
2. Selecciona rango de fechas (último mes)
3. Sistema calcula:
   - Productos clase A: 20% que generan 80% ingresos
   - Productos clase B: 30% que generan 15% ingresos
   - Productos clase C: 50% que generan 5% ingresos
4. Dashboard muestra:
   - Productos top vendedores
   - Productos de lenta rotación
   - Recomendaciones de compra/eliminación

**Resultado:**
- ✅ Decisiones basadas en datos
- ✅ Optimiza capital en inventario
- ✅ Elimina productos de baja rotación

---

## 🧪 ESTRATEGIA DE TESTING

### Cobertura Objetivo

**Mínimo aceptable:** 85% de cobertura de código

**Distribución:**
- Models: 90%+ (lógica crítica de negocio)
- Controllers: 85%+
- Services: 90%+
- Triggers y funciones SQL: 100% (testing manual + scripts)
- Middleware: 95%+

---

### Tests Unitarios - Backend

#### 1. Models (Estimado: 180 tests)

**`models/inventario/productos.model.js` (50 tests):**
- ✅ CRUD básico con RLS
- ✅ Validación de códigos de barras (EAN13, Code128)
- ✅ Ajuste de stock manual
- ✅ Búsqueda full-text (nombre, SKU, código)
- ✅ Filtros: categoría, proveedor, stock bajo
- ✅ Paginación y ordenamiento

**`models/inventario/movimientos.model.js` (40 tests):**
- ✅ Registro de entradas/salidas
- ✅ Validación: cantidad positiva (entradas) / negativa (salidas)
- ✅ Cálculo automático de `stock_antes` y `stock_despues`
- ✅ Kardex por producto
- ✅ Consultas por fecha y tipo de movimiento

**`models/pos/ventas.model.js` (70 tests):**
- ✅ Creación de venta + items (transacción completa)
- ✅ Locks optimistas (`FOR UPDATE`) en productos
- ✅ **Deadlock simulation:** Crear 10 ventas simultáneas con mismos productos
- ✅ Retry logic (3 intentos con backoff exponencial)
- ✅ Validación de stock insuficiente
- ✅ Generación automática de folio (POS-2025-0001)
- ✅ Cálculo de totales (subtotal, descuentos, total)
- ✅ Pago parcial vs pago completo
- ✅ Cancelación de venta (revertir stock)

**`models/inventario/alertas.model.js` (20 tests):**
- ✅ Listar alertas no leídas
- ✅ Marcar como leída
- ✅ Filtros por tipo y nivel

---

#### 2. Controllers (Estimado: 130 tests)

**`controllers/inventario/*.controller.js` (80 tests):**
- ✅ Productos: CRUD + bulk create + búsqueda
- ✅ Categorías: CRUD + jerarquía
- ✅ Proveedores: CRUD
- ✅ Movimientos: Registro + kardex
- ✅ Reportes: Valor inventario, Análisis ABC, Rotación

**`controllers/pos/*.controller.js` (50 tests):**
- ✅ Ventas: CRUD + agregar items + pagar + devolver
- ✅ Tickets: Generar PDF
- ✅ Reportes: Ventas diarias, Corte de caja

---

#### 3. Services (Estimado: 20 tests)

**`services/emailService.js` (10 tests - nuevos):**
- ✅ Envío de alerta de stock bajo (mock SMTP)
- ✅ Envío de alerta de stock agotado
- ✅ Template HTML correcto
- ✅ Manejo de errores de SMTP

**`utils/barcode.util.js` (10 tests):**
- ✅ Validación EAN13 (checksum correcto)
- ✅ Validación Code128
- ✅ Auto-detección de tipo
- ✅ Rechazo de códigos inválidos

---

### Tests de Integración - Backend

#### 1. Endpoints (Estimado: 130 tests)

**`__tests__/endpoints/inventario.test.js` (80 tests):**
```javascript
describe('POST /api/v1/inventario/productos', () => {
    it('debe crear producto con límites del plan', async () => {
        // Verificar que middleware subscription valida límites
    });

    it('debe rechazar si excede límite del plan', async () => {
        // Crear 100 productos (límite plan básico)
        // Intento 101 debe fallar con 403
    });

    it('debe validar código de barras EAN13', async () => {
        // Código inválido debe fallar
    });

    // ... 77 tests más
});
```

**`__tests__/endpoints/pos.test.js` (50 tests):**
```javascript
describe('POST /api/v1/pos/ventas', () => {
    it('debe crear venta y descontar stock automáticamente', async () => {
        // 1. Crear venta estado=pendiente
        // 2. Actualizar a estado=completada
        // 3. Verificar stock descontado
        // 4. Verificar movimiento_inventario registrado
    });

    it('debe rechazar venta si stock insuficiente', async () => {
        // Stock: 5 unidades
        // Intentar vender 10 → debe fallar
    });

    it('debe generar comisión si aplica', async () => {
        // Venta completada con productos
        // Verificar comisión en tabla comisiones_profesionales
    });

    // ... 47 tests más
});
```

---

#### 2. Triggers y Funciones SQL (Estimado: 40 tests)

**Scripts SQL de testing:**
```sql
-- sql/tests/test_trigger_actualizar_stock.sql
BEGIN;
    -- Crear producto con stock 10
    -- Crear venta con 3 unidades
    -- Verificar stock = 7
    -- Verificar movimiento_inventario registrado
    -- Rollback
END;

-- sql/tests/test_trigger_alertas.sql
BEGIN;
    -- Crear producto con stock_minimo=5, stock_actual=5
    -- Crear venta que baja a stock=3
    -- Verificar alerta_inventario generada
    -- Rollback
END;

-- sql/tests/test_particionamiento.sql
BEGIN;
    -- Insertar 1000 movimientos en diferentes meses
    -- Verificar que se crean particiones automáticas
    -- Query performance < 50ms
    -- Rollback
END;
```

---

#### 3. Deadlocks y Concurrencia (Estimado: 10 tests)

**`__tests__/concurrency/deadlocks.test.js`:**
```javascript
describe('Ventas concurrentes', () => {
    it('debe manejar 100 ventas simultáneas sin deadlocks', async () => {
        const productos = [1, 2, 3]; // IDs de productos

        // Crear 100 ventas simultáneas con mismos productos
        const promesas = Array.from({ length: 100 }, (_, i) =>
            crearVenta({
                items: [
                    { producto_id: productos[i % 3], cantidad: 1 }
                ]
            })
        );

        const resultados = await Promise.allSettled(promesas);

        // Verificar que al menos 95% se completaron (5% puede tener retry)
        const exitosas = resultados.filter(r => r.status === 'fulfilled').length;
        expect(exitosas).toBeGreaterThanOrEqual(95);
    });
});
```

---

### Tests E2E - Frontend

#### 1. Flujo Completo POS (Estimado: 10 tests)

**`frontend/src/__tests__/e2e/pos.test.jsx`:**
```javascript
describe('Flujo completo de venta POS', () => {
    it('debe crear venta, generar ticket y enviar WhatsApp', async () => {
        // 1. Login
        // 2. Navegar a POS
        // 3. Buscar producto por código de barras
        // 4. Agregar al carrito
        // 5. Seleccionar cliente
        // 6. Seleccionar método pago: efectivo
        // 7. Confirmar venta
        // 8. Verificar ticket PDF generado
        // 9. Verificar stock actualizado en UI
        // 10. Verificar comisión generada
    });

    it('debe escanear código de barras con lector USB', async () => {
        // Simular eventos keydown de lector
        // Verificar producto agregado
    });
});
```

---

### Herramientas y Configuración

**Backend:**
- **Framework:** Jest + Supertest
- **Coverage:** Istanbul (nyc)
- **Mocks:** Sinon para servicios externos (email, MP API)
- **CI/CD:** GitHub Actions (ejecutar tests en cada PR)

**Frontend:**
- **Framework:** Vitest + React Testing Library
- **E2E:** Playwright
- **Coverage:** Vitest coverage

**Base de Datos:**
- **Testing:** Scripts SQL manuales + rollback
- **Fixtures:** Seeds de datos de prueba
- **Cleanup:** Truncate tables entre tests

---

### Métricas de Testing

**Objetivos:**
- ⏱️ Suite completa < 5 minutos
- 📊 Cobertura ≥ 85%
- ✅ 0 tests flakey (intermitentes)
- 🚀 Tests ejecutados en cada commit (CI)

**KPIs:**
- Tests unitarios backend: 330 tests
- Tests integración backend: 130 tests
- Tests triggers SQL: 40 tests
- Tests E2E frontend: 10 tests
- **Total: ~510 tests**

---

## 🗺️ ROADMAP DE IMPLEMENTACIÓN

### Fase 0: Base de Datos ✅ COMPLETADA (20 Nov 2025)

**Archivos SQL creados:**
- [x] sql/inventario/01-tablas.sql (284 líneas) - 4 tablas
- [x] sql/inventario/02-indices.sql (241 líneas) - 20 índices
- [x] sql/inventario/03-rls-policies.sql (231 líneas) - 16 políticas RLS
- [x] sql/inventario/04-funciones.sql (260 líneas) - 7 funciones PL/pgSQL
- [x] sql/inventario/05-triggers.sql (178 líneas) - 3 triggers
- [x] sql/inventario/06-particionamiento.sql (331 líneas) - Particionamiento completo
- [x] sql/pos/01-tablas.sql (158 líneas) - 3 tablas
- [x] sql/pos/02-indices.sql (157 líneas) - 14 índices
- [x] sql/pos/03-rls-policies.sql (153 líneas) - 12 políticas RLS
- [x] sql/pos/04-funciones.sql (267 líneas) - 6 funciones PL/pgSQL
- [x] sql/pos/05-triggers.sql (74 líneas) - 4 triggers (solo triggers, funciones separadas)
- [x] sql/core/schema/UPDATE_planes_subscripcion_inventario_pos.sql - Actualización de límites

**Integración:**
- [x] Agregado a init-data.sh (líneas 208-236) - ⚠️ **IMPORTANTE:** Este es el script maestro que ejecuta TODOS los módulos SQL. No crear scripts adicionales de instalación.

**Backend Config:**
- [x] backend/app/config/planLimits.js - Límites definidos para productos, categorías, proveedores, ventas_pos_mes

### Fase 1: Backend Core (2.5 semanas) - PENDIENTE

**Semana 1:**
- [ ] Backend: Models inventario (5 archivos + index.js)
- [ ] Backend: Models POS con locks optimistas + retry logic (2 archivos + index.js)
- [ ] Backend: Schemas Joi con validación códigos de barras (2 archivos)
- [ ] Backend: Routes (2 archivos)

**Semana 2:**
- [ ] **✅ CRÍTICO:** Agregar middleware `subscription.validateLimits()` en todas las rutas POST
- [ ] Tests de base de datos
- [ ] Tests unitarios models
- [ ] **✅ Extender emailService con alertas de stock** (+1 día)

### Fase 2: Backend API y Lógica de Negocio (2 semanas)

**Semana 3:**
- [ ] Controllers inventario (5 archivos)
- [ ] Endpoints productos (8)
- [ ] Endpoints categorías (5)
- [ ] Endpoints proveedores (5)
- [ ] Endpoints movimientos (3)
- [ ] Endpoints reportes inventario (4)
- [ ] Tests de integración endpoints

**Semana 4:**
- [ ] Controllers POS (2 archivos: ventas, tickets)
- [ ] Endpoints ventas (9)
- [ ] Endpoints reportes POS (2)
- [ ] Tests de integración POS
- [ ] **✅ Validación exhaustiva:** Todos los endpoints POST tienen middleware `subscription`
- [ ] Tests de límites por plan (verificar rechazo al exceder)

### Fase 3: Frontend Inventario (1.5 semanas)

**Semana 5:**
- [ ] Hooks useInventario (15 hooks)
- [ ] ProductosPage.jsx
- [ ] ProductoFormModal.jsx
- [ ] CategoriasPage.jsx
- [ ] ProveedoresPage.jsx

**Semana 6 (primera mitad):**
- [ ] MovimientosPage.jsx
- [ ] ReportesInventarioPage.jsx
- [ ] AlertasInventario.jsx
- [ ] GraficaRotacion.jsx (Chart.js)
- [ ] InventarioWidget.jsx (Dashboard)

### Fase 4: Frontend POS (1.5 semanas)

**Semana 6 (segunda mitad):**
- [ ] Hooks usePOS con sanitización (10 hooks)
- [ ] VentaPOSPage.jsx (pantalla principal)
- [ ] CarritoVenta.jsx
- [ ] BuscadorProductosPOS.jsx con código de barras

**Semana 7:**
- [ ] MetodoPagoModal.jsx (efectivo, tarjeta, transferencia, mixto)
- [ ] TicketVenta.jsx (PDF con pdfkit + qrcode)
- [ ] HistorialVentasPage.jsx
- [ ] ReportesCajaPage.jsx
- [ ] CorteCAjaModal.jsx
- [ ] **✅ Integración lector código de barras USB/Bluetooth** (+1 día)

### Fase 5: Integraciones y Testing (1 semana)

**Semana 7.5:**
- [ ] Integrar con módulo comisiones (extender tabla + trigger)
- [ ] Integrar con citas (agregar productos a citas)
- [ ] Testing E2E flujo completo de venta
- [ ] Testing de alertas de stock por email
- [ ] Optimización de queries particionadas
- [ ] Documentación CLAUDE.md
- [ ] Documentación API endpoints (Swagger/OpenAPI)

### Fase 6: Features Avanzados (Opcional - Futuro)

**Post-MVP - Terminales Físicas (1-2 semanas):**
- [ ] Servicio Mercado Pago Terminal (mercadoPagoTerminal.service.js)
- [ ] Servicio Clip Terminal (clipTerminal.service.js)
- [ ] Tabla `terminales_pos` para registro de dispositivos
- [ ] Endpoints `/api/v1/pos/terminal/*` (4 endpoints)
- [ ] TerminalPagoModal.jsx en frontend
- [ ] Testing Mercado Pago Point en sandbox
- [ ] Testing Clip Terminal (si disponible)
- [ ] Documentación integración terminales

**Post-MVP - Otras Features:**
- [ ] Variantes de producto
- [ ] Inventario multi-ubicación
- [ ] Lotes y series
- [ ] Promociones y descuentos automáticos
- [ ] Reservas de productos
- [ ] Impresión térmica de tickets
- [ ] Código de barras custom generación
- [ ] QR dinámico Mercado Pago (sin terminal física)

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs Técnicos

**Performance:**
- [ ] Búsqueda de productos < 200ms
- [ ] Registro de venta < 500ms
- [ ] Descuento de stock en tiempo real (trigger)
- [ ] Soporte para 10,000+ productos por organización
- [ ] Soporte para 100+ ventas simultáneas

**Confiabilidad:**
- [ ] Triggers ejecutan 100% de las veces
- [ ] Stock nunca negativo (CHECK constraint)
- [ ] Transacciones ACID (rollback completo en error)
- [ ] RLS bloquea acceso cross-tenant
- [ ] Alertas automáticas 24/7

### KPIs de Negocio

**Adopción:**
- [ ] 30% de clientes activan inventario en primer mes
- [ ] 50% de ventas de servicios incluyen productos
- [ ] Promedio 5 ventas POS/día por organización
- [ ] 80% de productos con stock actualizado

**Valor:**
- [ ] 20% aumento en ingresos promedio por cita
- [ ] 15% reducción en mermas por stock controlado
- [ ] 95% de alertas de stock atendidas en < 24h
- [ ] 100% de terminales físicas conectadas sin errores

### Comparativa con Competencia

| Característica | Tu Plataforma | AgendaPro |
|----------------|---------------|-----------|
| **Gestión de Inventario** | ✅ Incluido desde plan profesional ($34 USD) | ✅ Plan Premium ($149 USD) |
| **POS Integrado** | ✅ Incluido desde MVP | ⚠️ Solo planes premium |
| **Comisiones por Productos** | ✅ Automáticas | ❌ No tiene |
| **Código de Barras** | ✅ Soporte nativo | ✅ |
| **Terminal Física** | 🔜 Post-MVP (MP Point + Clip) | ✅ Solo MP |
| **Alertas Automáticas** | ✅ Triggers automáticos | ✅ |
| **Análisis ABC** | ✅ Con función PL/pgSQL | ⚠️ Básico |
| **Multi-ubicación** | 🔜 Fase 6 | ✅ |

**Ventaja competitiva:**
- ✅ Precio 77% más barato ($34 vs $149 USD) para mismas funcionalidades
- ✅ Comisiones automáticas por productos (único en el mercado)
- ✅ Integración nativa con citas
- ✅ Arquitectura superior (triggers, particionamiento, RLS)

---

## 🎯 CONCLUSIÓN Y PRÓXIMOS PASOS

### Resumen Ejecutivo

Este plan implementa **Gestión de Inventario y Punto de Venta (MVP)** en **7.5 semanas**, con arquitectura robusta y features competitivos.

**Alcance MVP:**
- ✅ Gestión completa de inventario (productos, categorías, proveedores, movimientos)
- ✅ Punto de venta con métodos de pago tradicionales (efectivo, tarjeta, transferencia)
- ✅ Integración con comisiones automáticas
- ✅ Integración con citas (agregar productos)
- ✅ Reportes y analytics
- ✅ Alertas automáticas de stock
- ⏳ **Terminales físicas (MP Point/Clip):** Post-MVP (+1-2 semanas)

**Beneficios principales:**
1. **Incremento de ingresos:** Salones generan 30-40% más con venta de productos
2. **Control total:** Stock en tiempo real, alertas automáticas, cero pérdidas
3. **Eficiencia:** Comisiones automáticas, integración con citas, un solo sistema
4. **Ventaja competitiva:** Funcionalidades premium a precio de plan profesional

---

## 📝 REGISTRO DE CAMBIOS

### v1.3 - Fase 0 Completada (20 Noviembre 2025)

**Estado:** ✅ Base de datos completa e integrada

**Archivos SQL creados (11 archivos):**
1. ✅ `sql/inventario/01-tablas.sql` (284 líneas) - 4 tablas
2. ✅ `sql/inventario/02-indices.sql` (241 líneas) - 20 índices
3. ✅ `sql/inventario/03-rls-policies.sql` (231 líneas) - 16 políticas RLS
4. ✅ `sql/inventario/04-funciones.sql` (260 líneas) - 7 funciones PL/pgSQL
5. ✅ `sql/inventario/05-triggers.sql` (178 líneas) - 3 triggers con bypass RLS
6. ✅ `sql/inventario/06-particionamiento.sql` (331 líneas) - Particionamiento mensual
7. ✅ `sql/pos/01-tablas.sql` (158 líneas) - 3 tablas
8. ✅ `sql/pos/02-indices.sql` (157 líneas) - 14 índices
9. ✅ `sql/pos/03-rls-policies.sql` (153 líneas) - 12 políticas RLS
10. ✅ `sql/pos/04-funciones.sql` (267 líneas) - 6 funciones PL/pgSQL (**NUEVO:** separado de triggers)
11. ✅ `sql/pos/05-triggers.sql` (74 líneas) - 4 triggers (limpiado, solo triggers)

**Actualización de sistema:**
- ✅ `sql/core/schema/UPDATE_planes_subscripcion_inventario_pos.sql` - Límites de inventario/POS en BD
- ✅ `backend/app/config/planLimits.js` - Límites sincronizados (productos, categorías, proveedores, ventas_pos_mes)

**Integración con init-data.sh:**
- ✅ Agregados módulos inventario y POS (líneas 208-236)
- ✅ Sistema actualizado de 13 → 15 módulos SQL independientes
- ⚠️ **IMPORTANTE:** `init-data.sh` es el script maestro que ejecuta TODOS los módulos. Ver CLAUDE.md para contexto.

**Correcciones arquitectónicas:**
- ✅ Separación de funciones y triggers en POS (patrón del proyecto)
- ✅ Particionamiento de `movimientos_inventario` (patrón de `citas`)
- ✅ Triggers con `SECURITY DEFINER` y bypass RLS (patrón de `comisiones`)
- ✅ Funciones con manejo de excepciones y cleanup de RLS

**Próximo paso:** Fase 1 - Backend Core (2.5 semanas)

---

### v1.2 - Ajuste de Alcance MVP (20 Noviembre 2025)

**Decisión estratégica:** Mover integración de terminales físicas a Post-MVP

**Cambios aplicados:**

1. **⏰ Tiempo reducido de 9.5 → 7.5 semanas**
   - Eliminadas 2 semanas de desarrollo e integración de terminales
   - Roadmap optimizado sin dependencias de hardware externo

2. **📦 Terminales físicas → Fase 6 (Post-MVP)**
   - Movido: Servicios mercadoPagoTerminal.service.js y clipTerminal.service.js
   - Movido: Endpoints `/api/v1/pos/terminal/*` (4 endpoints)
   - Movido: TerminalPagoModal.jsx frontend
   - Movido: Testing en sandbox de MP Point y Clip
   - **Razón:** Evaluar primero adopción del módulo antes de invertir en hardware

3. **🔧 Dependencias actualizadas**
   - Especificado: `npm install jsbarcode` en `backend/app/`
   - Validación de códigos de barras usando regex simple (EAN8/EAN13)

4. **📊 Endpoints POS reducidos de 14 → 11**
   - Mantenidos: 9 endpoints ventas + 2 reportes
   - Eliminados temporalmente: 4 endpoints de terminales

5. **✅ Alcance MVP clarificado**
   - ✅ Gestión completa de inventario
   - ✅ POS con métodos tradicionales (efectivo, tarjeta, transferencia, mixto)
   - ✅ Integración con comisiones y citas
   - ✅ Reportes y alertas automáticas
   - ⏳ Terminales físicas: A evaluar post-lanzamiento

---

### v1.1 - Post Análisis Arquitectónico (18 Noviembre 2025)

**Cambios aplicados tras validación con código real del proyecto:**

### ✅ CORRECCIONES CRÍTICAS APLICADAS

1. **Triggers SQL - Bypass RLS y Locks Optimistas**
   - ✅ Agregado `PERFORM set_config('app.bypass_rls', 'true', true)` en los 3 triggers
   - ✅ Agregado `SECURITY DEFINER` en todas las funciones trigger
   - ✅ Implementado `SELECT ... FOR UPDATE` para locks optimistas
   - ✅ Validación anti-duplicados en triggers
   - ✅ Bloques `EXCEPTION` para cleanup garantizado
   - **Patrón seguido:** `calcular_comision_cita()` del módulo comisiones existente

2. **Particionamiento Activado**
   - ✅ Descomentado particionamiento de `movimientos_inventario`
   - ✅ Agregada justificación técnica (1.46M filas/año proyectadas)
   - ✅ Patrón seguido: `sql/citas/02-particionamiento.sql`
   - ✅ Job pg_cron para creación automática de particiones

3. **RLS Policies - Variable Correcta**
   - ✅ Corregido de `current_tenant` a `current_tenant_id`
   - ✅ Agregado casting `::text` (patrón existente)
   - **Validado contra:** Todas las RLS policies del proyecto

4. **Dependencias NPM Agregadas**
   - ✅ `barcode-validator: ^2.0.0` - Validación EAN13/Code128
   - ✅ `pdfkit: ^0.15.0` - Generación tickets PDF
   - ✅ `qrcode: ^1.5.4` - QR en tickets

5. **Servicio de Emails Extendido**
   - ✅ Método `enviarAlertaStockBajo()` agregado a servicio existente
   - ✅ Método `enviarAlertaStockAgotado()` para nivel crítico
   - ✅ Endpoint `/alertas/enviar-email` para envío manual

6. **Schemas Joi - Validación Código de Barras**
   - ✅ Custom validator con `barcode-validator`
   - ✅ Soporte EAN13/Code128
   - **Patrón seguido:** Validación custom de `comisiones.schemas.js`

7. **Hooks Frontend - Sanitización**
   - ✅ Patrón de sanitización de `useComisiones.js` aplicado
   - ✅ Extracción segura `response.data?.data || []`
   - ✅ `staleTime` aumentado de 30s a 5min

8. **Endpoint Adicional - Registro de Terminales**
   - ✅ `POST /api/v1/pos/terminal/registrar`
   - ✅ Schema Joi para validación

### ⚠️ ESTIMACIÓN DE TIEMPOS AJUSTADA

| Fase | Original | Ajustado | Incremento |
|------|----------|----------|------------|
| Fase 1 | 2 sem | 2.5 sem | +0.5 sem |
| Fase 2 | 2 sem | 2 sem | - |
| Fase 3 | 1.5 sem | 1.5 sem | - |
| Fase 4 | 1.5 sem | 2 sem | +0.5 sem |
| Fase 5 | 1 sem | 1.5 sem | +0.5 sem |
| **TOTAL** | **8 sem** | **9.5 sem** | **+18%** |

**Justificación del incremento:**
- Particionamiento de `movimientos_inventario` (+2 días)
- Locks optimistas en actualización de stock (+1 día)
- Integración librería código de barras (+1 día)
- Testing escáner USB/Bluetooth (+2 días)
- Testing terminales Mercado Pago + Clip (+3 días)

### Próxima Acción

**Aprobar este plan y:**
1. Priorizar en roadmap para Q1 2026
2. Reservar recursos de desarrollo (1 fullstack dev)
3. Investigar integraciones de terminales (Clip, MP Point)
4. Validar con 3-5 clientes beta (salones con venta de productos)

---

**Documento creado por:** Claude (Arquitecto de Software IA)
**Fecha:** 18 Noviembre 2025
**Versión:** 1.1 ✅ **ACTUALIZADO POST ANÁLISIS ARQUITECTÓNICO**
**Estado:** ✅ Validado con Código Real - Listo para Implementación

**Referencias:**
- CLAUDE.md (v21.0)
- ANALISIS_COMPETITIVO_AGENDAPRO.md
- PLAN_FRONTEND_MARKETPLACE.md
- Módulos existentes validados: comisiones/, marketplace/, citas/
- Análisis de congruencia: 95/100 ✅

**Validaciones Aplicadas:**
- ✅ Patrones de 26 controllers existentes
- ✅ Schemas Joi de 18 módulos
- ✅ Triggers de comisiones y citas particionadas
- ✅ RLS policies de 37 tablas
- ✅ Hooks de 15 módulos frontend
- ✅ Middleware stack de 7 middlewares
