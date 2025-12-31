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

---

## Validación Integral desde Frontend (31 Dic 2025)

### Resumen Ejecutivo

Se ejecutó validación completa creando datos **exclusivamente desde el frontend** sin intervención SQL manual.

**Resultado**: **12/12 flujos funcionan correctamente**. Todos los gaps de inventario avanzado completados.

### Data Creada en Validación

| Entidad | Datos |
|---------|-------|
| Categorías | Electrónicos, Ropa |
| Proveedores | TechDistribuidor, DropshipGlobal |
| Productos | Laptop Dell XPS 15 (NS), Monitor Dell 27" (dropship) |
| Rutas Operación | Compra, Transferencia, Dropship (creadas con botón "Crear Rutas Default") |
| Reglas Reorden | "Reorden Laptops Dell" - Trigger: stock ≤ 5, Cantidad: 10 |

### Escenarios Validados

| # | Escenario | Estado | Resultado |
|---|-----------|:------:|-----------|
| 1 | Crear categorías desde frontend | ✅ | 2 categorías creadas |
| 2 | Crear proveedores desde frontend | ✅ | 2 proveedores creados |
| 3 | Crear productos (NS + Dropship) | ✅ | 2 productos con diferentes rutas |
| 4 | Rutas de Operación | ✅ | Creadas con botón "Crear Rutas Default" |
| 5 | OC → Enviar → Recibir con NS | ✅ | OC-2025-0001: 2 NS registrados (SN-DELL-001, SN-DELL-002) |
| 6 | Venta POS con NS | ✅ | NS SN-DELL-001 seleccionado → estado "Vendido" |
| 7 | Venta POS producto dropship | ✅ | OC-2025-0002 generada automáticamente para DropshipGlobal |
| 8 | Configurar regla reorden | ✅ | Regla "Reorden Laptops Dell" creada desde UI |
| 9 | Ejecutar reorden manual | ✅ | OC-2025-0003 generada automáticamente ($120,000) |
| 10 | pg_cron job configurado | ✅ | `0 6 * * *` - Ejecución diaria 6:00 AM |

### OCs Generadas

| Folio | Proveedor | Productos | Total | Estado | Origen |
|-------|-----------|-----------|-------|--------|--------|
| OC-2025-0001 | TechDistribuidor | 2× Laptop Dell @ $12,000 | $24,000 | Recibida | Manual |
| OC-2025-0002 | DropshipGlobal | 1× Monitor Dell 27" | $4,500 | Borrador | **Dropship Automático** ✅ |
| OC-2025-0003 | TechDistribuidor | 10× Laptop Dell @ $12,000 | $120,000 | Borrador | **Reorden Automático** ✅ |

### Ventas POS

| Folio | Producto | NS/Variante | Total | Resultado |
|-------|----------|-------------|-------|-----------|
| POS-2025-0001 | Laptop Dell XPS 15 | SN-DELL-001 | $15,000 | ✅ NS → Vendido, stock actualizado |
| POS-2025-0002 | Monitor Dell 27" (dropship) | N/A | $5,999 | ✅ OC-2025-0002 auto-generada |

### Números de Serie Registrados

| NS | Producto | Costo | Estado | Origen |
|----|----------|-------|--------|--------|
| SN-DELL-001 | Laptop Dell XPS 15 | $12,000 | Vendido | OC-2025-0001 |
| SN-DELL-002 | Laptop Dell XPS 15 | $12,000 | Disponible | OC-2025-0001 |

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
| Rutas Multietapa | Pick → Pack → Ship | Alta |
| Traslados por Lote | Agrupar transfers para picking | Baja |

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
└── 26-dropshipping.sql          # Flujo dropship

backend/app/modules/inventario/
├── models/reorden.model.js
├── models/landed-costs.model.js
├── models/dropship.model.js
└── controllers/*.controller.js

backend/app/modules/pos/
├── schemas/pos.schemas.js       # Validación con NS/variantes
└── models/ventas.model.js       # Lógica de venta POS

frontend/src/
├── pages/inventario/ReordenPage.jsx         # Dashboard reorden
├── pages/inventario/ReglasReordenPage.jsx   # CRUD reglas
├── pages/inventario/DropshipPage.jsx
├── pages/pos/VentaPOSPage.jsx
├── components/pos/SeleccionarNSModal.jsx
├── components/inventario/ordenes-compra/LandedCostsSection.jsx
└── hooks/use{Reorden,LandedCosts,Dropship,NumerosSerie}.js
```

---

## Roadmap

| Fase | Alcance | Estado |
|------|---------|:------:|
| 1 | Reorden, Landed Costs, Dropshipping | ✅ Completada |
| 2 | Validación integral flujos | ✅ Completada 31 Dic - **10/10 flujos OK** |
| 3 | Fix gaps críticos | ✅ Completada (Landed Costs + Rutas) |
| 4 | Conectores Carriers (DHL) | Pendiente |
| 5 | Rutas multietapa, Batch transfers | Pendiente |

---

## Próxima Sesión

### Navegación Validada ✅

Todos los módulos de inventario tienen acceso desde tabs de navegación:
- Reorden → Tab "Reorden" → Botón "Configurar Reglas" para reglas
- Dropship → Tab "Dropship"
- Rutas → Tab "Rutas"

---

### Prioridad 1: Corregir Gaps Pendientes

1. ~~**Fix Dropshipping** (Alto)~~ ✅ COMPLETADO 30 Dic 2025

2. ~~**Auto-distribuir Landed Costs** (Medio)~~ ✅ COMPLETADO 31 Dic 2025

3. ~~**Rutas en Onboarding** (Medio)~~ ✅ COMPLETADO 31 Dic 2025

---

### Fase Siguiente: Conectores de Carriers

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
