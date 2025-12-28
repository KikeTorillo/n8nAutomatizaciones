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
| API Keys por usuario | Baja |

---

## Inventario Avanzado - Implementado 27 Dic 2025

| Feature | Estado | Endpoints |
|---------|--------|-----------|
| Fechas vencimiento | ✅ | `GET /numeros-serie/alertas-vencimiento` |
| Reabastecimiento automático | ✅ | `POST /ordenes-compra/auto-generar` (usa stock_proyectado) |
| FEFO (First Expired First Out) | ✅ | `GET /numeros-serie/fefo/:productoId` |
| Lead time proveedor | ✅ | Campo `lead_time_dias` en productos |
| Trazabilidad completa | ✅ | `GET /numeros-serie/:id/trazabilidad`, `GET /numeros-serie/:id/timeline` |
| Rutas de operación | ✅ | CRUD rutas, reglas, transferencias |

### Endpoints Trazabilidad

| Endpoint | Descripción |
|----------|-------------|
| `GET /numeros-serie/:id/trazabilidad` | Origen (upstream) → estado actual → destino (downstream) |
| `GET /numeros-serie/:id/timeline` | Timeline cronológico con iconos y colores |
| `GET /numeros-serie/buscar-trazabilidad?q=` | Búsqueda de NS con trazabilidad resumida |

### Endpoints Rutas de Operación

| Endpoint | Descripción |
|----------|-------------|
| `POST /rutas-operacion` | Crear ruta (compra, transferencia, dropship, fabricacion) |
| `GET /rutas-operacion` | Listar rutas (?tipo=, ?activo=) |
| `GET /rutas-operacion/:id` | Obtener detalle de ruta |
| `PUT /rutas-operacion/:id` | Actualizar ruta |
| `DELETE /rutas-operacion/:id` | Eliminar ruta |
| `POST /rutas-operacion/init` | Crear rutas default |
| `POST /productos/:id/rutas` | Asignar ruta a producto |
| `GET /productos/:id/rutas` | Obtener rutas de producto |
| `DELETE /productos/:id/rutas/:rutaId` | Quitar ruta de producto |
| `GET /productos/:id/mejor-ruta` | Determinar mejor ruta (?sucursal_id=) |
| `POST /reglas-reabastecimiento` | Crear regla automatización |
| `GET /reglas-reabastecimiento` | Listar reglas |
| `POST /transferencias` | Crear solicitud transferencia |
| `GET /transferencias` | Listar solicitudes |
| `POST /transferencias/:id/aprobar` | Aprobar solicitud |
| `POST /transferencias/:id/rechazar` | Rechazar solicitud |
| `POST /transferencias/:id/enviar` | Marcar en tránsito |
| `POST /transferencias/:id/recibir` | Completar transferencia |
| `POST /ordenes-compra/reabastecimiento-rutas` | Generar OCs/transferencias con rutas |

### Barcode Scanner - Implementado y Validado 27 Dic 2025

| Componente | Descripción |
|------------|-------------|
| `useBarcodeScanner.js` | Hook reutilizable con soporte EAN-13, QR, Code-128 |
| `BarcodeScanner.jsx` | Componente UI con cámara, beep, guía visual |
| Recepción OC | Escanear productos y números de serie |
| Productos | Búsqueda rápida por código de barras |

**Validación**: Prueba completa OC-2025-0001 con 3 NS registrados exitosamente.

**Bug Fix**: Corregido error "Cannot stop scanner" verificando estado con `getState()` antes de `stop()`.

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Módulos backend | 20 |
| Permisos catálogo | 86 |
| Políticas RLS | 140+ |
| Tablas BD | 135+ |

---

## Notas Técnicas

```
RLS: RLSContextManager.query(orgId, cb) | withBypass() solo JOINs multi-tabla
Permisos: catalogo → rol → usuario_sucursal (overrides)
BD: docker exec postgres_db psql -U admin -d postgres
Stock Proyectado: stock_actual + OC_pendientes - reservas_activas
```
