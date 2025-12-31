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
| Reorden automático | ✅ | Reglas + pg_cron 6AM + OC auto |
| Landed Costs | ✅ | Auto-distribución al recibir mercancía |
| Dropshipping | ✅ | OC auto-generada al vender producto dropship (fix 31 Dic) |
| Venta NS/Variantes en POS | ✅ | Selección NS + trazabilidad automática |
| Rutas de Operación | ✅ | Auto-creadas en onboarding |
| Rutas Multietapa | ✅ | Pick → Pack → Ship (1, 2 o 3 pasos) |
| Batch/Wave Picking | ✅ | Agrupar operaciones de picking |
| Paquetes/Bultos | ✅ | Empaque con tracking de peso/dimensiones |
| **Consigna** | ✅ | **Stock de terceros en ubicación propia** |

---

## Próxima Sesión: Prueba Integral desde Cero

**Objetivo**: Validar que al levantar el sistema desde cero (`npm run clean:data`), todos los flujos funcionen correctamente desde el frontend.

**IMPORTANTE**: Toda la data debe crearse desde el frontend (no via API/SQL) para validar la experiencia completa del usuario.

### Preparación
```bash
npm run clean:data   # Reset completo de BD
docker compose up -d # Levantar stack limpio
```

### Flujo de creación de data (TODO desde frontend)
1. Onboarding: crear organización y usuario admin
2. Crear proveedor (TechParts México)
3. Crear producto con NS requerido (Laptop Dell XPS 15)
4. Crear producto dropship (Monitor Samsung)
5. Crear OC → Enviar → Recibir (generar NS)
6. Configurar regla de reorden
7. Crear acuerdo consigna → Activar → Agregar producto → Recibir mercancía
8. Venta POS con NS
9. Venta POS dropship (validar OC auto)
10. Venta POS consigna (validar movimiento)
11. Generar liquidación consigna

**Checklist de validación** (31 Dic 2025 - Probado ✅):
- [x] Levantar stack limpio con `npm run clean:data`
- [x] Crear organización mediante onboarding
- [x] Validar que rutas de operación se creen automáticamente (3 rutas)
- [x] Crear proveedor y producto con requiere NS
- [x] Crear OC → Enviar → Recibir con NS (5 NS generados)
- [x] Venta POS seleccionando NS (NS marcado como Vendido)
- [x] Configurar regla reorden y ejecutar (OC auto-generada)
- [x] Probar producto dropship (OC auto-generada desde POS)
- [x] **Crear acuerdo consigna con proveedor** (UI implementada ✅)
- [x] **Activar acuerdo de consigna** (probado desde frontend ✅)
- [x] Recibir mercancía en consigna (10 unidades recibidas, $250,000 en stock ✅)
- [ ] Vender producto en consigna (backend listo)
- [ ] Generar liquidación (UI lista)
- [x] Configurar rutas multietapa (3 pasos recepción + 3 pasos envío)
- [ ] Validar generación de operaciones

---

## Gaps Pendientes vs Odoo

### Prioridad Alta

| Gap | Descripción | Complejidad |
|-----|-------------|:-----------:|
| **Conectores Carriers** | DHL, FedEx, Estafeta - etiquetas automáticas | Alta |

### Prioridad Media

| Gap | Descripción | Complejidad |
|-----|-------------|:-----------:|
| Kitting/BOM | Lista de materiales (manufactura) | Alta |

---

## Archivos por Módulo

### Consigna (31 Dic 2025) ✅ UI Completa
```
sql/inventario/30-consigna.sql
backend/.../models/consigna.model.js
backend/.../controllers/consigna.controller.js
frontend/src/hooks/useConsigna.js
frontend/src/services/api/endpoints.js (consignaApi)
frontend/src/pages/inventario/ConsignaPage.jsx
frontend/src/components/inventario/consigna/
├── index.js
├── AcuerdoFormDrawer.jsx
├── AcuerdoDetalleModal.jsx
├── RecibirMercanciaDrawer.jsx
├── DevolverMercanciaDrawer.jsx
├── LiquidacionFormModal.jsx
└── LiquidacionDetalleModal.jsx
```

### Rutas Multietapa / Batch Picking
```
sql/inventario/27-rutas-multietapa.sql
sql/inventario/28-batch-picking.sql
backend/.../models/operaciones-almacen.model.js
backend/.../models/batch-picking.model.js
frontend/src/pages/inventario/OperacionesAlmacenPage.jsx
frontend/src/pages/inventario/BatchPickingPage.jsx
```

### Paquetes/Bultos
```
sql/inventario/29-paquetes-envio.sql
backend/.../models/paquetes.model.js
backend/.../controllers/paquetes.controller.js
frontend/src/components/inventario/paquetes/*
frontend/src/hooks/usePaquetes.js
```

### Reorden / Landed Costs / Dropship
```
sql/inventario/24-reorden-automatico.sql
sql/inventario/25-landed-costs.sql
sql/inventario/26-dropshipping.sql
backend/.../models/{reorden,landed-costs,dropship}.model.js
```

---

## Navegación Inventario (20 tabs)

Productos, Categorías, Proveedores, Movimientos, Conteos, Ajustes CSV, Órdenes Compra, Reorden, Dropship, **Consigna**, Operaciones, Wave Pick, Alertas, Reportes, Listas Precios, Ubicaciones, NS/Lotes, Rutas, Histórico, Transferencias

---

## Roadmap

| Fase | Alcance | Estado |
|------|---------|:------:|
| 1 | Reorden, Landed Costs, Dropshipping | ✅ |
| 2 | Rutas multietapa, Batch Picking, Paquetes | ✅ |
| 3 | **Consigna** | ✅ |
| 4 | **Validación integral desde cero** | Próxima sesión |
| 5 | Conectores Carriers (DHL, FedEx, Estafeta) | Pendiente |

---

## Fixes Recientes (31 Dic 2025)

### Dropship Auto-OC desde POS
**Problema**: El trigger SQL marcaba la venta como dropship pero no llamaba la función de generación de OC.

**Solución**: Modificar `ventas.controller.js` para invocar `DropshipModel.crearOCDesdeVenta()` después de crear la venta.

**Archivo modificado**: `backend/app/modules/pos/controllers/ventas.controller.js:57-88`

**Flujo corregido**:
1. Usuario vende producto con `ruta_preferida = 'dropship'`
2. Trigger marca `ventas_pos.es_dropship = true`
3. Controller detecta `venta.es_dropship` y llama `DropshipModel.crearOCDesdeVenta()`
4. Se genera OC automática vinculada a la venta (estado: borrador)

### Consigna Model - Nombres de tablas y columnas
**Problema**: El modelo `consigna.model.js` usaba nombres incorrectos:
- Tabla `producto_variantes` (incorrecto) → `variantes_producto` (correcto)
- Columna `pv.nombre` (incorrecto) → `pv.nombre_variante` (correcto)

**Solución**: Corregir las 3 ocurrencias de cada error en el modelo.

**Archivo modificado**: `backend/app/modules/inventario/models/consigna.model.js`

### Consigna UI - Límite de productos
**Problema**: El componente pedía `limit: 500` pero el backend valida máximo 100.

**Solución**: Cambiar `useProductos({ limit: 500 })` a `useProductos({ limit: 100 })`.

**Archivo modificado**: `frontend/src/components/inventario/consigna/AcuerdoDetalleModal.jsx`

---

## Fase Siguiente: Conectores de Carriers

**Carriers prioritarios**:
1. **Estafeta** - México
2. **DHL Express** - Internacional
3. **FedEx** - Internacional

**Funcionalidades**:
- Cotización de envío en tiempo real
- Generación de guías/etiquetas
- Tracking automático
- Notificaciones al cliente
