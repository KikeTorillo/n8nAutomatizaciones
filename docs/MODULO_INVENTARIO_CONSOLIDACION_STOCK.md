# Módulo Inventario - Consolidación de Stock

**Estado**: ✅ Validado E2E | **Última revisión**: 30 Enero 2026

---

## Diagrama de Tablas SQL - Cálculo de Stock

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITECTURA DE STOCK                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────┐                                                   │
│   │ ubicaciones_almacen │ ◄── Jerarquía: zona → pasillo → estante → bin    │
│   ├─────────────────────┤                                                   │
│   │ id                  │                                                   │
│   │ sucursal_id         │                                                   │
│   │ codigo              │ "BIN-E2E-01"                                      │
│   │ tipo                │ zona|pasillo|estante|bin                          │
│   │ capacidad_maxima    │ 500                                               │
│   │ capacidad_ocupada   │ 30 ◄── Actualizado por trigger                   │
│   └─────────┬───────────┘                                                   │
│             │ 1:N                                                           │
│             ▼                                                               │
│   ┌─────────────────────┐                                                   │
│   │  stock_ubicaciones  │ ◄── FUENTE DE VERDAD                             │
│   ├─────────────────────┤                                                   │
│   │ id                  │                                                   │
│   │ ubicacion_id ───────┼──► FK a ubicaciones_almacen                      │
│   │ producto_id ────────┼──► FK a productos                                │
│   │ cantidad            │ 30                                                │
│   │ lote                │ NULL | "LOTE-001"                                 │
│   └─────────┬───────────┘                                                   │
│             │                                                               │
│             │ trigger: trg_sincronizar_stock                                │
│             │ trigger: trg_sincronizar_capacidad                            │
│             ▼                                                               │
│   ┌─────────────────────┐                                                   │
│   │     productos       │ ◄── Stock agregado                               │
│   ├─────────────────────┤                                                   │
│   │ id                  │                                                   │
│   │ sku                 │ "E2E-001"                                         │
│   │ stock_actual        │ 100 ◄── SUM(stock_ubicaciones.cantidad)          │
│   │ stock_minimo        │ 5                                                 │
│   │ stock_maximo        │ 100                                               │
│   └─────────────────────┘                                                   │
│                                                                              │
│   ┌─────────────────────┐                                                   │
│   │movimientos_inventario│ ◄── Kardex (particionado por mes)               │
│   ├─────────────────────┤                                                   │
│   │ producto_id         │                                                   │
│   │ tipo_movimiento     │ entrada_*|salida_*|transferencia_*               │
│   │ cantidad            │ +100 / -50                                        │
│   │ stock_antes         │                                                   │
│   │ stock_despues       │ = stock_antes + cantidad                         │
│   │ ubicacion_origen_id │                                                   │
│   │ ubicacion_destino_id│                                                   │
│   └─────────────────────┘                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

FÓRMULA DE STOCK:
  productos.stock_actual = SUM(stock_ubicaciones.cantidad)
                           WHERE producto_id = ? GROUP BY sucursal_id

TRIGGERS ACTIVOS:
  1. trg_sincronizar_stock     → Actualiza productos.stock_actual
  2. trg_sincronizar_capacidad → Actualiza ubicaciones_almacen.capacidad_ocupada
```

---

## Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE DATOS - INVENTARIO                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                          FRONTEND (React)                             │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ProductosPage ──► useProductos() ──► GET /productos                 │   │
│  │       │                                                               │   │
│  │       ├─► Crear ──► POST /productos ──────────────────────┐          │   │
│  │       ├─► Editar ─► PUT /productos/:id                    │          │   │
│  │       └─► Ajustar ► POST /stock/ajustar ──────────────────┤          │   │
│  │                                                            │          │   │
│  │  UbicacionesPage ──► useUbicaciones()                      │          │   │
│  │       │                                                    │          │   │
│  │       ├─► Crear ──► POST /ubicaciones                      │          │   │
│  │       └─► Mover ──► POST /stock/mover ────────────────────┤          │   │
│  │                                                            │          │   │
│  │  MovimientosPage ──► useMovimientos() ──► GET /movimientos │          │   │
│  │                                                            │          │   │
│  └────────────────────────────────────────┬───────────────────┘          │   │
│                                           │                              │   │
├───────────────────────────────────────────┼──────────────────────────────┤   │
│                                           ▼                              │   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        BACKEND (Express + Node.js)                    │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  productos.routes.js                                                  │   │
│  │       │                                                               │   │
│  │       ├─► productos.controller.js                                     │   │
│  │       │        │                                                      │   │
│  │       │        └─► productos.model.js ──► RLSContextManager.query()  │   │
│  │       │                                                               │   │
│  │       └─► stock.controller.js                                         │   │
│  │                │                                                      │   │
│  │                └─► stock.model.js                                     │   │
│  │                         │                                             │   │
│  │                         └─► registrar_movimiento_con_ubicacion()     │   │
│  │                         └─► mover_stock_ubicacion()                  │   │
│  │                                                                       │   │
│  └────────────────────────────────────────┬──────────────────────────────┘   │
│                                           │                              │   │
├───────────────────────────────────────────┼──────────────────────────────┤   │
│                                           ▼                              │   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         DATABASE (PostgreSQL)                         │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ┌─────────────────┐    INSERT/UPDATE    ┌─────────────────┐         │   │
│  │  │stock_ubicaciones│ ◄─────────────────► │    TRIGGERS     │         │   │
│  │  └────────┬────────┘                     └────────┬────────┘         │   │
│  │           │                                       │                   │   │
│  │           │ trg_sincronizar_stock                 │                   │   │
│  │           ▼                                       ▼                   │   │
│  │  ┌─────────────────┐                     ┌─────────────────┐         │   │
│  │  │    productos    │                     │ubicaciones_almacen│        │   │
│  │  │  stock_actual   │◄────────────────────│capacidad_ocupada │        │   │
│  │  └─────────────────┘                     └─────────────────┘         │   │
│  │           │                                       │                   │   │
│  │           └───────────────────┬───────────────────┘                   │   │
│  │                               │                                       │   │
│  │                               ▼                                       │   │
│  │                     ┌─────────────────────┐                           │   │
│  │                     │movimientos_inventario│ ◄── Kardex              │   │
│  │                     │   (particionada)    │                           │   │
│  │                     └─────────────────────┘                           │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │                       pg_cron JOBS                               │ │   │
│  │  ├─────────────────────────────────────────────────────────────────┤ │   │
│  │  │ • validar_sincronizacion_stock  (04:00 AM) → Detecta diferencias│ │   │
│  │  │ • expirar_reservas_pendientes   (*/5 min)  → Libera reservas    │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Operaciones y Tipos de Movimiento

| Operación | Tipo Movimiento | Afecta stock_ubicaciones |
|-----------|-----------------|--------------------------|
| Venta POS | `salida_venta` | Descuenta de ubicación usuario |
| Recepción OC | `entrada_compra` | Incrementa en ubicación seleccionada |
| Ajuste manual | `entrada/salida_ajuste` | Según tipo |
| Mover stock | N/A (interno) | Transfiere entre ubicaciones |
| Devolución cliente | `entrada_devolucion` | Incrementa en ubicación |

---

## Funciones SQL Clave

| Función | Ubicación | Propósito |
|---------|-----------|-----------|
| `registrar_movimiento_con_ubicacion()` | 33-consolidacion-stock.sql | Registra movimiento + actualiza stock |
| `mover_stock_ubicacion()` | 13-ubicaciones-almacen.sql | Transfiere entre ubicaciones |
| `obtener_ubicacion_usuario()` | 33-consolidacion-stock.sql | Resuelve ubicación del usuario |
| `validar_sincronizacion_stock()` | 34-job-validacion-stock.sql | Detecta discrepancias |

---

## Diagnóstico SQL

```sql
-- Verificar sincronización (debe retornar 0 filas)
SELECT * FROM validar_sincronizacion_stock();

-- Stock por ubicación de un producto
SELECT ua.codigo, su.cantidad
FROM stock_ubicaciones su
JOIN ubicaciones_almacen ua ON ua.id = su.ubicacion_id
WHERE su.producto_id = ?;

-- Kardex de producto
SELECT tipo_movimiento, cantidad, stock_posterior, referencia
FROM movimientos_inventario WHERE producto_id = ? ORDER BY creado_en;

-- Capacidad de ubicaciones
SELECT codigo, capacidad_ocupada, capacidad_maxima
FROM ubicaciones_almacen WHERE sucursal_id = ?;
```

---

## Jobs pg_cron

| Job | Horario | Estado |
|-----|---------|--------|
| `validar-sincronizacion-stock` | 04:00 AM | ✅ Activo |
| `expirar-reservas-stock` | */5 min | ✅ Activo |

---

## Validación E2E (30 Enero 2026)

| Prueba | Estado | Resultado |
|--------|--------|-----------|
| Login y navegación | ✅ Pass | Acceso correcto |
| CRUD Categorías | ✅ Pass | "Electrónicos E2E" creada |
| CRUD Productos | ✅ Pass | "Producto E2E Test" creado y editado |
| Crear ubicaciones WMS | ✅ Pass | ZONA-E2E, BIN-E2E-01, BIN-E2E-02 |
| Mover stock (50 → BIN-01) | ✅ Pass | capacidad_ocupada = 50 |
| Mover stock (20 → BIN-02) | ✅ Pass | BIN-01: 30, BIN-02: 20 |
| Trigger sincronización | ✅ Pass | Sin errores de constraint |
| Kardex | ✅ Pass | Movimiento inicial visible |

---

## Archivos del Módulo

### SQL
- `sql/inventario/01-tablas.sql` - Tablas base
- `sql/inventario/13-ubicaciones-almacen.sql` - WMS + stock_ubicaciones
- `sql/inventario/33-consolidacion-stock.sql` - Función central + triggers
- `sql/inventario/34-job-validacion-stock.sql` - Job validación
- `sql/inventario/35-job-expirar-reservas.sql` - Job reservas

### Backend
- `backend/app/modules/inventario/controllers/productos.controller.js`
- `backend/app/modules/inventario/models/productos.model.js`
- `backend/app/modules/inventario/models/stock.model.js`

### Frontend
- `frontend/src/pages/inventario/ProductosPage.jsx`
- `frontend/src/pages/inventario/UbicacionesAlmacenPage.jsx`
- `frontend/src/pages/inventario/MovimientosPage.jsx`
- `frontend/src/components/inventario/ubicaciones/MoverStockDrawer.jsx`

---

## Próximo Paso: Validación E2E Completa de Flujos Integrados

**Prioridad**: Alta
**Objetivo**: Validar todos los flujos que afectan inventario desde diferentes módulos

### Checklist de Validación

| # | Módulo | Flujo | Validar |
|---|--------|-------|---------|
| 1 | **POS** | Venta directa | Stock descuenta de ubicación usuario |
| 2 | **POS** | Venta con apartado | Reserva se crea, stock no descuenta hasta completar |
| 3 | **POS** | Devolución | Stock regresa a ubicación correcta |
| 4 | **POS** | Cancelación | Stock se restaura |
| 5 | **OC** | Crear orden de compra | No afecta stock |
| 6 | **OC** | Recepción parcial | Stock incrementa en ubicación seleccionada |
| 7 | **OC** | Recepción completa | Stock total correcto, OC cerrada |
| 8 | **OC** | Devolución a proveedor | Stock descuenta |
| 9 | **Transferencias** | Entre sucursales | Salida en origen, entrada en destino |
| 10 | **Transferencias** | Recepción de transferencia | Stock incrementa en sucursal destino |
| 11 | **Conteos** | Conteo cíclico completo | Ajustes aplicados correctamente |
| 12 | **Reservas** | Expiración automática | Job libera reservas vencidas |
| 13 | **Servicios** | Uso de producto en cita | Stock descuenta como `salida_uso_servicio` |
| 14 | **Combos/Kits** | Venta de combo | Descuenta componentes individuales |

### Escenarios Críticos

```
1. POS → Venta → stock_ubicaciones ↓ → productos.stock_actual ↓
2. OC  → Recepción → stock_ubicaciones ↑ → productos.stock_actual ↑
3. Transferencia → Origen ↓ + Destino ↑ → stock_actual sin cambio global
4. Apartado → Reserva activa → Expiración (5min) → Reserva liberada
```

---

## Pendientes Menores

| Prioridad | Item |
|-----------|------|
| Media | POS mostrar stock de ubicación del usuario |
| Baja | Reportes de ocupación por zona |

---

**Actualizado**: 30 Enero 2026 - Post validación E2E
