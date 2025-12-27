# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 27 Diciembre 2025

---

## Estado del Proyecto

| Fase | Estado |
|------|--------|
| Core (Workflows, Módulos, Permisos, Multi-Moneda) | ✅ |
| Usuarios, Profesionales, Config POS | ✅ |
| Inventario (Reservas, OC, WMS, FIFO/AVCO, NS/Lotes, Stock Proyectado) | ✅ |
| POS (Búsqueda, Carrito, Multi-moneda, Venta NS, Historial, Corte, Reportes) | ✅ |
| Webhooks, i18n, Reportes Multi-Sucursal, Centros Costo, API Pública | ⬜ |

---

## Pendientes Validación

| Módulo | Prioridad |
|--------|-----------|
| Sucursales (transferencias) | Media |
| Aprobaciones (workflows OC) | Media |
| Clientes + historial | Baja |
| Agendamiento | Baja |

---

## Gaps Pendientes

| Gap | Prioridad |
|-----|-----------|
| 2FA/MFA | Alta |
| Permisos CRUD granular | Alta |
| Auditoría de cambios | Media |
| Contratos laborales (hr.contract) | Media |
| App móvil/Barcode scanner | Baja |
| API Keys por usuario | Baja |

---

## Próxima Sesión - Inventario Avanzado

Gaps para igualar Odoo Inventory (~30% restante):

| Feature | Descripción | Prioridad |
|---------|-------------|-----------|
| Fechas vencimiento | Campo `fecha_vencimiento` en lotes, alertas FEFO | Alta |
| Reabastecimiento automático | Reglas min/max por producto, generación OC automática | Alta |
| Trazabilidad completa | Historial upstream/downstream de NS/Lotes | Media |
| Rutas de operación | Configurar flujos (compra, transferencia, dropship) | Media |
| Estrategias remoción | FEFO (First Expired First Out) para perecederos | Media |
| Barcode scanner | Integración móvil para picking/recepción | Baja |

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
