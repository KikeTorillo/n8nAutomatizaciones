# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 28 Diciembre 2025

---

## Estado General

| Fase | Estado |
|------|--------|
| Core (Auth, Usuarios, Orgs, Permisos, Multi-Moneda) | ✅ |
| Inventario (WMS, FIFO/AVCO, NS/Lotes, Variantes, Reservas) | ✅ |
| POS (Venta, Carrito, NS/Lotes, Variantes, Reservas Atómicas) | ✅ |
| Agendamiento (Citas, Bloqueos, Recordatorios) | ✅ |
| Sucursales (CRUD, Dashboard, Transferencias) | ✅ |
| Órdenes Compra (Flujo Borrador→Enviada→Recibida) | ✅ |
| Webhooks, i18n, API Pública | ⬜ |

---

## Gaps Pendientes

| Gap | Prioridad | Notas |
|-----|-----------|-------|
| 2FA/MFA | Alta | TOTP, SMS o email como segundo factor |
| Integraciones Carriers | Alta | UPS, FedEx, DHL para envíos |
| Inventory at Date | Media | Snapshot histórico del inventario |
| Auditoría de cambios | Media | Historial visual de modificaciones |
| Landed Costs | Media | Costos adicionales en OC |
| Contratos laborales | Media | Módulo HR básico |
| GS1 Barcodes | Baja | Parser códigos GS1-128 |
| API Keys por usuario | Baja | Tokens programáticos con scopes |

---

## Implementaciones Completadas (Dic 2025)

### Variantes de Producto ✅

Sistema de atributos para gestionar variantes (color, talla, material).

**Archivos:**
- `sql/inventario/20-variantes-producto.sql`
- `backend/app/modules/inventario/models/atributos.model.js`
- `backend/app/modules/inventario/models/variantes.model.js`
- `frontend/src/components/inventario/variantes/*.jsx`

### Sistema de Reservas Atómicas ✅

Reservas de stock superiores a Odoo con soporte completo para productos y variantes.

**Arquitectura:**
- **SSOT**: `stock_disponible` siempre calculado, nunca almacenado
- **Concurrencia**: `FOR UPDATE SKIP LOCKED` (no bloquea otras transacciones)
- **Rollback automático**: Fallo en cualquier reserva revierte todas
- **Expiración**: pg_cron libera reservas expiradas cada 5 minutos

**Archivos:**
- `sql/inventario/12-reservas-stock.sql` - Tabla, funciones, MV, pg_cron
- `backend/app/modules/inventario/models/reservas.model.js`
- `backend/app/modules/pos/models/ventas.model.js` (integración POS)

**Flujo probado:**
1. Producto con variantes creado (Camiseta Básica)
2. Stock agregado a variantes (Blanco/M = 10, Blanco/S = 5)
3. Venta POS con reserva atómica
4. Stock decrementado correctamente (10 → 9)

---

## Comparación Nexo vs Odoo

### Ventajas de Nexo

| Ventaja | Detalle |
|---------|---------|
| **Multi-tenant RLS** | 140+ políticas, aislamiento real BD |
| **Reservas SKIP LOCKED** | Superior a NOWAIT de Odoo |
| **Estados NS/Lotes** | 6 estados vs ninguno en Odoo |
| **WMS control ambiental** | Temperatura, humedad por ubicación |
| **Workflow aprobaciones** | Motor configurable por montos |
| **Multi-moneda nativa** | 7 divisas con conversión automática |
| **IA conversacional** | Diferenciador único |

### Gaps vs Odoo

| Gap | Prioridad | Esfuerzo |
|-----|-----------|----------|
| Integraciones carriers | Alta | Alto |
| Inventory at Date | Media | Bajo |
| Chatter/historial | Media | Medio |
| Manufacturing/BOM | Baja | Alto |
| Batch/Wave picking | Baja | Medio |

---

## Plan de Implementación

### 1. Integraciones Carriers (Alta)

**Fase 1: Arquitectura Base**
- [ ] Tablas: `carriers`, `carriers_credenciales`, `envios`, `tarifas_envio`
- [ ] Service base `CarrierAdapter` con interfaz común

**Fase 2: Adaptadores**
- [ ] UPSAdapter, FedExAdapter, DHLAdapter, EnviaComAdapter

**Fase 3: API**
- [ ] POST `/api/v1/envios/cotizar`
- [ ] POST `/api/v1/envios/crear`
- [ ] GET `/api/v1/envios/:id/tracking`

**Fase 4: Frontend**
- [ ] Configuración carriers (credenciales)
- [ ] Componente `CotizadorEnvio`
- [ ] Vista tracking, impresión etiquetas

### 2. Inventory at Date (Media)

- [ ] Tabla `inventario_snapshots` + `snapshot_lineas`
- [ ] Job pg_cron diario para snapshot automático
- [ ] GET `/api/v1/inventario/at-date?fecha=YYYY-MM-DD`
- [ ] Comparación inventario actual vs fecha anterior

### 3. Auditoría de Cambios (Media)

- [ ] Tabla `historial_cambios` (tabla, registro_id, cambios_json)
- [ ] Triggers AFTER en tablas principales
- [ ] GET `/api/v1/historial/:tabla/:id`
- [ ] Componente `HistorialCambios` (timeline)

### 4. Landed Costs (Media)

- [ ] Tabla `costos_adicionales`, `oc_costos_adicionales`
- [ ] Distribución por peso/valor/cantidad
- [ ] Recálculo de valoración FIFO/AVCO

---

## Cronograma

| Trimestre | Gap | Entregable |
|-----------|-----|------------|
| **Q1 2026** | Inventory at Date | Snapshots + consulta histórica |
| **Q1 2026** | 2FA/MFA | TOTP como segundo factor |
| **Q2 2026** | Chatter/Historial | Timeline en productos, OC, clientes |
| **Q2 2026** | Carriers (Fase 1) | UPS + FedEx cotización |
| **Q3 2026** | Carriers (Fase 2) | DHL + tracking completo |
| **Q3 2026** | Landed Costs | Distribución costos en OC |
| **Q4 2026** | GS1 Barcodes | Parser + generación |

---

## Referencia Técnica

```
RLS: RLSContextManager.query(orgId, cb) | withBypass() solo JOINs
Permisos: catalogo → rol → usuario_sucursal (overrides)
Reservas: FOR UPDATE SKIP LOCKED + expiración automática
Stock: stock_disponible = stock_actual - reservas_activas (SSOT)
Particionamiento: movimientos_inventario por mes (pg_cron)
```

| Métrica | Valor |
|---------|-------|
| Módulos backend | 20 |
| Permisos catálogo | 86 |
| Políticas RLS | 140+ |
| Tablas BD | 135+ |
| Monedas configuradas | 7 |

---

## Próximos Pasos

1. **2FA/MFA** - Gap de alta prioridad para seguridad
2. **Integraciones carriers** - UPS/FedEx/DHL para competitividad
3. **Inventory at Date** - Snapshots históricos para auditoría
4. **Auditoría de cambios** - Historial visual de modificaciones
