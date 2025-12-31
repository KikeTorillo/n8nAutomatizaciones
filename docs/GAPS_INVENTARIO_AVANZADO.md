# Gaps de Inventario Avanzado - Nexo ERP

**Última actualización**: 31 Diciembre 2025

---

## Estado Actual

| Feature | Estado | Notas |
|---------|:------:|-------|
| Productos/Variantes | ✅ | Atributos configurables, stock independiente |
| Stock por ubicación | ✅ | Zona → Pasillo → Nivel (WMS) |
| Números de serie/Lotes | ✅ | Tracking individual, vencimientos |
| Valoración FIFO/LIFO/AVCO | ✅ | Métodos de costeo |
| Órdenes de compra | ✅ | Borrador → Enviada → Recibida |
| Reservas atómicas | ✅ | `FOR UPDATE SKIP LOCKED` |
| GS1-128 | ✅ | Parser + Generator + Scanner POS |
| Conteos físicos | ✅ | Diferencias y ajustes |
| **Reorden automático** | ✅ | Reglas + pg_cron 6AM + OC auto |
| **Landed Costs** | ✅ | Auto-distribución al recibir mercancía |
| **Peso/Volumen productos** | ✅ | Columnas `peso`, `volumen` en tabla productos |
| **Dropshipping** | ✅ | OC auto-generada al vender producto dropship |
| **Venta NS en POS** | ✅ | Selección NS + trazabilidad automática |
| **Venta Variantes en POS** | ✅ | Stock independiente por variante |
| **Rutas de Operación** | ✅ | Auto-creadas en onboarding (COMPRA, TRANSFERENCIA, DROPSHIP) |
| **Rutas Multietapa** | ✅ | Pick → Pack → Ship (1, 2 o 3 pasos configurable) |
| **Batch/Wave Picking** | ✅ | Agrupar operaciones de picking para procesamiento eficiente |
| **Configuración Almacén** | ✅ | Pasos recepción/envío configurables por sucursal |

---

## Validación Integral desde Frontend (31 Dic 2025)

### Resumen Ejecutivo

Se ejecutaron **2 rondas de validación** creando datos **exclusivamente desde el frontend** sin intervención SQL manual.

**Resultado**: **14/14 flujos funcionan correctamente**. Todos los gaps de inventario avanzado completados.

### Data Creada en Validación

| Entidad | Datos |
|---------|-------|
| Categorías | Electrónicos |
| Proveedores | TechDistribuidor, DropshipGlobal |
| Productos | Laptop Dell XPS 15 (NS), Monitor Dell 27" (dropship) |
| Rutas Operación | Compra, Transferencia, Dropship (creadas con botón "Crear Rutas Default") |
| Reglas Reorden | "Reorden Laptops Dell" - Trigger: stock ≤ 5, Cantidad: 10 |

### Escenarios Validados

| # | Escenario | Estado | Resultado |
|---|-----------|:------:|-----------|
| 1 | Crear categorías desde frontend | ✅ | Electrónicos creada |
| 2 | Crear proveedores desde frontend | ✅ | 2 proveedores creados |
| 3 | Crear productos (NS + Dropship) | ✅ | 2 productos con diferentes rutas |
| 4 | Rutas de Operación | ✅ | Creadas con botón "Crear Rutas Default" |
| 5 | OC → Enviar → Recibir con NS | ✅ | OC-2025-0001: 2 NS (SN-DELL-001, SN-DELL-002) |
| 6 | Venta POS con NS | ✅ | POS-2025-0001: NS SN-DELL-001 → "Vendido" |
| 7 | Venta POS producto dropship | ✅ | POS-2025-0002 → OC-2025-0002 auto-generada |
| 8 | Configurar regla reorden | ✅ | Regla "Reorden Laptops Dell" creada desde UI |
| 9 | Ejecutar reorden manual | ✅ | OC-2025-0003 generada automáticamente ($120,000) |
| 10 | pg_cron job configurado | ✅ | `0 6 * * *` - Ejecución diaria 6:00 AM |
| 11 | **Enviar + Recibir OC con 10 NS** | ✅ | OC-2025-0003: SN-DELL-003 a SN-DELL-012 registrados |
| 12 | **Venta POS seleccionando NS** | ✅ | POS-2025-0003: NS SN-DELL-003 → "Vendido" |
| 13 | **Venta dropship genera OC auto** | ✅ | POS-2025-0004 → OC-2025-0004 auto-generada |
| 14 | **Navegación solo con botones** | ✅ | Todos los tabs accesibles (17 tabs inventario) |

### OCs Generadas

| Folio | Proveedor | Productos | Total | Estado | Origen |
|-------|-----------|-----------|-------|--------|--------|
| OC-2025-0001 | TechDistribuidor | 2× Laptop Dell @ $12,000 | $24,000 | Recibida | Manual |
| OC-2025-0002 | DropshipGlobal | 1× Monitor Dell 27" | $4,500 | Borrador | **Dropship Auto** (POS-2025-0002) |
| OC-2025-0003 | TechDistribuidor | 10× Laptop Dell @ $12,000 | $120,000 | **Recibida** | **Reorden Automático** |
| OC-2025-0004 | DropshipGlobal | 1× Monitor Dell 27" | $4,500 | Borrador | **Dropship Auto** (POS-2025-0004) ✅ |

### Ventas POS

| Folio | Producto | NS/Variante | Total | Resultado |
|-------|----------|-------------|-------|-----------|
| POS-2025-0001 | Laptop Dell XPS 15 | SN-DELL-001 | $15,000 | ✅ NS → Vendido |
| POS-2025-0002 | Monitor Dell 27" (dropship) | N/A | $5,999 | ✅ OC-2025-0002 auto |
| POS-2025-0003 | Laptop Dell XPS 15 | **SN-DELL-003** | $15,000 | ✅ NS → Vendido |
| POS-2025-0004 | Monitor Dell 27" (dropship) | N/A | $5,999 | ✅ OC-2025-0004 auto |

### Números de Serie Registrados (12 total)

| NS | Producto | Costo | Estado | Origen |
|----|----------|-------|--------|--------|
| SN-DELL-001 | Laptop Dell XPS 15 | $12,000 | **Vendido** | OC-2025-0001 |
| SN-DELL-002 | Laptop Dell XPS 15 | $12,000 | Disponible | OC-2025-0001 |
| SN-DELL-003 | Laptop Dell XPS 15 | $12,000 | **Vendido** | OC-2025-0003 |
| SN-DELL-004 a SN-DELL-012 | Laptop Dell XPS 15 | $12,000 c/u | Disponible | OC-2025-0003 |

### Navegación Validada (Sin Gaps)

Todos los módulos accesibles desde navegación con botones (sin URLs directas):
- **17 tabs en Inventario**: Productos, Categorías, Proveedores, Movimientos, Conteos, Ajustes CSV, Órdenes Compra, Reorden, Dropship, Alertas, Reportes, Listas Precios, Ubicaciones, NS/Lotes, Rutas, Histórico, Transferencias
- **4 tabs en POS**: Nueva Venta, Historial, Corte de Caja, Reportes
- **Home → Módulos**: Navegación por tarjetas funcionando correctamente

---

## Gaps Críticos Encontrados

### 1. ~~Dropshipping NO genera OC automática~~ ✅ CORREGIDO

**Problema original**: Al vender un producto con ruta dropship, el sistema mostraba error 500 y no generaba la OC al proveedor.

**Solución aplicada** (30 Dic 2025):
1. `ventas.model.js`: Agregado código para llamar `crear_oc_dropship_desde_venta()` automáticamente después de crear venta
2. `26-dropshipping.sql`: Corregido bug en función SQL - usaba RECORD sin asignar cuando `cliente_id IS NULL`

**Resultado**: Venta POS-2025-0004 → OC-2025-0005 generada automáticamente ✅

---

### 2. ~~Landed Costs requiere distribución manual~~ ✅ CORREGIDO

**Problema original**: Los costos agregados a una OC quedaban "sin distribuir". Si se recibía la mercancía sin distribuir, los NS no reflejaban el costo adicional.

**Solución aplicada** (31 Dic 2025):
1. `landed-costs.model.js`: Agregadas funciones `distribuirTodosConDb()` y `obtenerLandedCostsMapConDb()` para uso en transacciones
2. `ordenes-compra.model.js`: Modificado `recibirMercancia()` para auto-distribuir costos pendientes antes de procesar
3. `RecibirMercanciaModal.jsx`: Agregada advertencia visual cuando hay costos sin distribuir

**Resultado validado**: OC-2025-0003 con flete $5,000 → 10 NS creados con costo $12,500 ($12,000 + $500) ✅

---

### 3. ~~Rutas de Operación no se crean en onboarding~~ ✅ CORREGIDO

**Problema original**: La tabla `rutas_operacion` estaba vacía después del onboarding. Las reglas de reorden requerían rutas para funcionar.

**Solución aplicada** (31 Dic 2025):
1. `rutas-operacion.model.js`: Agregada función `crearRutasDefaultConDb()` para uso en transacciones
2. `usuario.model.js`: Modificado `completarOnboarding()` para crear rutas automáticamente

**Resultado**: Nuevas organizaciones obtienen 3 rutas default (COMPRA, TRANSFERENCIA, DROPSHIP) automáticamente ✅

---

## Fixes Aplicados en Sesiones Anteriores

| Archivo | Problema | Solución |
|---------|----------|----------|
| `backend/app/modules/pos/schemas/pos.schemas.js` | Joi filtraba campos NS/reserva | Agregados `numero_serie_id`, `numero_serie`, `reserva_id` |
| `backend/app/modules/pos/models/ventas.model.js` | Productos dropship intentaban reservar stock | Skip reserva si `ruta_preferida = 'dropship'` |
| `frontend/.../ReglasReordenPage.jsx` | Mapeo incorrecto de campos al backend | `ruta_operacion_id`→`ruta_id`, `cantidad_a_ordenar`→`cantidad_fija` |
| `frontend/.../ReglasReordenPage.jsx` | Props incorrectos ConfirmDialog | `open`→`isOpen` |
| `frontend/.../ReordenPage.jsx` | Usaba `window.confirm()` nativo | Cambiado a componente `ConfirmDialog` |
| `sql/inventario/24-reorden-automatico.sql` | Columnas incorrectas en INSERT notificaciones | `url_accion`→`accion_url`, `datos`→`accion_datos` |
| `sql/inventario/26-dropshipping.sql` | Columna incorrecta en OC items | `cantidad`→`cantidad_ordenada` |
| `sql/inventario/26-dropshipping.sql` | RECORD no asignado cuando cliente_id IS NULL | Usar variables escalares en lugar de RECORD |
| `backend/.../ventas.model.js` | No llamaba generación automática OC dropship | Agregado código para llamar `crear_oc_dropship_desde_venta()` |
| `backend/.../landed-costs.model.js` | Funciones creaban nuevas transacciones | Agregadas `distribuirTodosConDb()` y `obtenerLandedCostsMapConDb()` |
| `backend/.../ordenes-compra.model.js` | No incluía landed costs en costo unitario | Auto-distribución + cálculo `precioBase + landedCosts` |
| `frontend/.../RecibirMercanciaModal.jsx` | Sin advertencia de costos pendientes | Agregado banner informativo con `useResumenCostos` |
| `backend/.../rutas-operacion.model.js` | Sin función para transacciones externas | Agregada `crearRutasDefaultConDb()` |
| `backend/.../usuario.model.js` | No creaba rutas en onboarding | Llamada a `crearRutasDefaultConDb()` en `completarOnboarding()` |

---

## Gaps Pendientes vs Odoo

### Prioridad Alta

| Gap | Descripción | Complejidad |
|-----|-------------|:-----------:|
| **Conectores Carriers** | DHL, FedEx, Estafeta - etiquetas automáticas | Alta |

### Prioridad Media

| Gap | Descripción | Complejidad |
|-----|-------------|:-----------:|
| ~~Rutas Multietapa~~ | ~~Pick → Pack → Ship~~ | ✅ COMPLETADO 31 Dic 2025 |
| ~~Traslados por Lote~~ | ~~Agrupar transfers para picking~~ | ✅ COMPLETADO 31 Dic 2025 |

### Prioridad Baja

| Gap | Descripción | Complejidad |
|-----|-------------|:-----------:|
| Paquetes/Bultos | Empaque con tracking | Baja |
| Consigna | Stock de terceros en ubicación propia | Media |
| Kitting/BOM | Lista de materiales (manufactura) | Alta |

---

## Archivos Principales

```
sql/inventario/
├── 24-reorden-automatico.sql    # Reglas + job pg_cron
├── 25-landed-costs.sql          # Costos adicionales OC
├── 26-dropshipping.sql          # Flujo dropship
├── 27-rutas-multietapa.sql      # Operaciones almacén (Pick/Pack/Ship)
└── 28-batch-picking.sql         # Wave picking

backend/app/modules/inventario/
├── models/reorden.model.js
├── models/landed-costs.model.js
├── models/dropship.model.js
├── models/operaciones-almacen.model.js    # NUEVO: Operaciones WMS
├── models/batch-picking.model.js          # NUEVO: Wave picking
├── models/configuracion-almacen.model.js  # NUEVO: Config pasos
├── controllers/operaciones-almacen.controller.js
├── controllers/batch-picking.controller.js
├── controllers/configuracion-almacen.controller.js
└── routes/*.routes.js

backend/app/modules/pos/
├── schemas/pos.schemas.js       # Validación con NS/variantes
└── models/ventas.model.js       # Lógica de venta POS

frontend/src/
├── pages/inventario/ReordenPage.jsx              # Dashboard reorden
├── pages/inventario/ReglasReordenPage.jsx        # CRUD reglas
├── pages/inventario/DropshipPage.jsx
├── pages/inventario/OperacionesAlmacenPage.jsx   # NUEVO: Kanban operaciones
├── pages/inventario/BatchPickingPage.jsx         # NUEVO: Wave picking
├── pages/inventario/ConfiguracionAlmacenPage.jsx # NUEVO: Config pasos
├── pages/pos/VentaPOSPage.jsx
├── components/pos/SeleccionarNSModal.jsx
├── components/inventario/ordenes-compra/LandedCostsSection.jsx
├── hooks/useOperacionesAlmacen.js    # NUEVO
├── hooks/useBatchPicking.js          # NUEVO
├── hooks/useConfiguracionAlmacen.js  # NUEVO
└── hooks/use{Reorden,LandedCosts,Dropship,NumerosSerie}.js
```

---

## Roadmap

| Fase | Alcance | Estado |
|------|---------|:------:|
| 1 | Reorden, Landed Costs, Dropshipping | ✅ Completada |
| 2 | Validación integral flujos | ✅ Completada 31 Dic - **14/14 flujos OK** |
| 3 | Fix gaps críticos | ✅ Completada (Landed Costs + Rutas) |
| 4 | **Rutas multietapa, Batch transfers** | ✅ **Completada 31 Dic 2025** |
| 5 | Conectores Carriers (DHL, FedEx, Estafeta) | Pendiente |

---

## Implementación Rutas Multietapa (31 Dic 2025) ✅

### Funcionalidades Implementadas

**Configuración por Sucursal:**
- Pasos de recepción: 1 (directo), 2 (Recepción → Stock), 3 (Recepción → QC → Stock)
- Pasos de envío: 1 (directo), 2 (Picking → Envío), 3 (Picking → Empaque → Envío)
- Ubicaciones configurables para cada etapa

**Operaciones de Almacén:**
- Vista Kanban con 4 columnas: Borrador, Asignadas, En Proceso, Completadas
- Tipos: recepcion, qc, almacenamiento, picking, empaque, envio
- Encadenamiento automático (operacion_padre_id, operacion_siguiente_id)
- Asignación a usuarios y priorización

**Wave/Batch Picking:**
- Agrupar múltiples operaciones de picking en un batch
- Lista consolidada de items para picking eficiente
- Estados: borrador, en_proceso, completado, cancelado

### Nuevos Tabs en Inventario
- **Operaciones** → Vista Kanban de operaciones de almacén
- **Wave Pick** → Gestión de batches de picking

### Archivos Creados

**SQL (2 archivos):**
- `sql/inventario/27-rutas-multietapa.sql` - Tablas y funciones operaciones
- `sql/inventario/28-batch-picking.sql` - Tablas wave picking

**Backend (9 archivos):**
- `models/operaciones-almacen.model.js`
- `models/batch-picking.model.js`
- `models/configuracion-almacen.model.js`
- Controllers, routes, schemas correspondientes

**Frontend (9 archivos):**
- `pages/inventario/OperacionesAlmacenPage.jsx`
- `pages/inventario/BatchPickingPage.jsx`
- `pages/inventario/ConfiguracionAlmacenPage.jsx`
- `hooks/useOperacionesAlmacen.js`
- `hooks/useBatchPicking.js`
- `hooks/useConfiguracionAlmacen.js`
- API endpoints en `endpoints.js`

---

## Navegación Validada ✅

Todos los módulos de inventario tienen acceso desde tabs de navegación (19 tabs):
- Productos, Categorías, Proveedores, Movimientos, Conteos, Ajustes CSV
- Órdenes Compra, Reorden, Dropship
- **Operaciones** (NUEVO), **Wave Pick** (NUEVO)
- Alertas, Reportes, Listas Precios, Ubicaciones, NS/Lotes, Rutas, Histórico, Transferencias

---

## Gaps Completados (Dic 2025)

1. ~~**Fix Dropshipping** (Alto)~~ ✅ COMPLETADO 30 Dic 2025

2. ~~**Auto-distribuir Landed Costs** (Medio)~~ ✅ COMPLETADO 31 Dic 2025

3. ~~**Rutas en Onboarding** (Medio)~~ ✅ COMPLETADO 31 Dic 2025

4. ~~**Rutas Multietapa** (Alto)~~ ✅ COMPLETADO 31 Dic 2025

5. ~~**Batch/Wave Picking** (Medio)~~ ✅ COMPLETADO 31 Dic 2025

---

## Fase Siguiente: Conectores de Carriers

**Objetivo**: Integrar generación automática de etiquetas de envío

**Carriers prioritarios**:
1. **Estafeta** - México
2. **DHL Express** - Internacional
3. **FedEx** - Internacional

**Funcionalidades**:
- Cotización de envío en tiempo real
- Generación de guías/etiquetas
- Tracking automático
- Notificaciones al cliente
