# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 27 Diciembre 2025

---

## Estado del Proyecto

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1-5 | Core (Workflows, Módulos, Permisos, Multi-Moneda) | ✅ |
| 5.1-5.3 | Usuarios, Profesionales, Config POS | ✅ |
| INV-1 a INV-5 | Inventario (Reservas, OC, WMS, FIFO/AVCO, NS/Lotes) | ✅ |
| INV-6 | Stock Proyectado (estilo Odoo) | ✅ |
| POS | Punto de Venta completo | ✅ |
| 6-10 | Webhooks, i18n, Reportes Multi-Sucursal, Centros Costo, API Pública | ⬜ |

---

## Validación E2E

### Inventario ✅

| Submódulo | Estado |
|-----------|--------|
| Categorías, Proveedores, Productos | ✅ |
| Órdenes Compra + Recepción | ✅ |
| Números de Serie/Lotes | ✅ |
| Alertas + Stock Proyectado | ✅ |
| Ubicaciones, Valoración | ⏳ Pendiente |

### POS ✅

Búsqueda, Carrito, Multi-moneda, Venta NS, Historial, Corte Caja, Reportes

### Pendientes Validación

| Módulo | Prioridad |
|--------|-----------|
| Sucursales (transferencias) | Media |
| Aprobaciones (workflows OC) | Media |
| Clientes + historial | Baja |
| Agendamiento | Baja |

---

## Gaps Pendientes

### Alta Prioridad
- **2FA/MFA** - Autenticación robusta
- **Permisos CRUD granular** - crear/leer/editar/eliminar por recurso

### Media Prioridad
- **Auditoría de cambios** - Historial de modificaciones
- **Contratos laborales** (hr.contract) - RRHH

### Baja Prioridad
- App móvil/Barcode scanner
- API Keys por usuario

---

## Bugs Corregidos (Dic 2025)

| Bug | Fix |
|-----|-----|
| Doble descuento stock ventas | Trigger único, `confirmar_reserva_stock` no descuenta |
| POS vacío (historial/corte/reportes) | `sucursalId` en queries |
| Checkbox NS no persiste | Campos en INSERT productos |
| Recepción sin nombre producto | Alias en query |
| Botón Generar OC roto | `ordenesCompraApi` en hook |
| OCs duplicadas desde alertas | Stock proyectado (`sql/inventario/16-stock-proyectado.sql`) |

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Módulos backend | 20 |
| Permisos catálogo | 86 |
| Políticas RLS | 124+ |
| Tablas BD | 130+ |

---

## Notas Técnicas

```
RLS: RLSContextManager.query(orgId, cb) | withBypass() solo JOINs multi-tabla
Permisos: catalogo → rol → usuario_sucursal (overrides)
BD: docker exec postgres_db psql -U admin -d postgres
Stock Proyectado: stock_actual + OC_pendientes - reservas_activas
```
