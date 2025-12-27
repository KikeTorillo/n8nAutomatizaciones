# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 27 Diciembre 2025

---

## Estado del Proyecto

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1-5 | Core (Workflows, Módulos, Permisos, Multi-Moneda) | ✅ |
| 5.1-5.3 | Usuarios, Profesionales, Config POS | ✅ |
| INV-1 a INV-5 | Inventario (Reservas, OC, WMS, FIFO/AVCO, NS/Lotes) | ✅ |
| POS | Punto de Venta completo | ✅ |
| 6-10 | Webhooks, i18n, Reportes Multi-Sucursal, Centros Costo, API Pública | ⬜ |

---

## Validación E2E - 27 Dic 2025

### Inventario

| Submódulo | Estado |
|-----------|--------|
| Categorías | ✅ |
| Proveedores | ✅ |
| Productos | ✅ |
| Órdenes Compra | ✅ |
| Recepción Mercancía | ✅ |
| Números de Serie | ✅ |
| Alertas | ⏳ |
| Ubicaciones | ⏳ |
| Valoración | ⏳ |

### POS

| Submódulo | Estado |
|-----------|--------|
| Búsqueda productos | ✅ |
| Carrito + Multi-moneda | ✅ |
| Venta con NS | ✅ |
| Historial | ✅ |
| Corte de Caja | ✅ |
| Reportes | ✅ |

### Pendientes

| Módulo | Prioridad |
|--------|-----------|
| Sucursales (transferencias) | Media |
| Aprobaciones (workflows OC) | Media |
| Clientes + historial | Baja |
| Agendamiento | Baja |

---

## Bugs Corregidos (Dic 2025)

| Bug | Fix |
|-----|-----|
| Doble descuento stock en ventas | `confirmar_reserva_stock` ya no descuenta; solo el trigger |
| Historial/Corte/Reportes POS vacíos | Agregado `sucursalId` en queries y rutas |
| Checkbox NS no se guarda | Campos agregados al INSERT de productos |
| Recepción sin campos NS | Alias `producto_nombre`, `producto_sku` en query |

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
Permisos: catalogo → rol → usuario_sucursal (overrides) + usarSucursalDeQuery en rutas GET
BD: docker exec postgres_db psql -U admin -d postgres
```
