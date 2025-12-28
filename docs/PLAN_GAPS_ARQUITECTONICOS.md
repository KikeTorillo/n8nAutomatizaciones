# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 28 Diciembre 2025

---

## Estado General

| Fase | Estado |
|------|--------|
| Core (Auth, Usuarios, Orgs, Permisos, Multi-Moneda) | ✅ |
| Inventario (WMS, FIFO/AVCO, NS/Lotes, Rutas, Transferencias) | ✅ |
| POS (Venta, Carrito, Corte, Reportes) | ✅ |
| Sucursales (CRUD, Dashboard, Transferencias) | ✅ |
| Webhooks, i18n, API Pública | ⬜ |

---

## Gaps Pendientes

| Gap | Prioridad | Notas |
|-----|-----------|-------|
| 2FA/MFA | Alta | TOTP, SMS o email como segundo factor |
| Permisos CRUD granular | Alta | Separar crear/leer/actualizar/eliminar por recurso |
| Auditoría de cambios | Media | Historial de modificaciones por registro |
| Contratos laborales | Media | Módulo HR básico (hr.contract) |
| API Keys por usuario | Baja | Tokens programáticos con scopes |

---

## Pendientes Validación UI

| Módulo | Estado |
|--------|--------|
| Aprobaciones (workflows OC) | Pendiente probar flujo completo |
| Clientes (historial compras) | Pendiente |
| Agendamiento (citas) | Pendiente |

---

## Referencia Técnica

```
RLS: RLSContextManager.query(orgId, cb) | withBypass() solo JOINs
Permisos: catalogo → rol → usuario_sucursal (overrides)
Stock Proyectado: stock_actual + OC_pendientes - reservas_activas
```

| Métrica | Valor |
|---------|-------|
| Módulos backend | 20 |
| Permisos catálogo | 86 |
| Políticas RLS | 140+ |
| Tablas BD | 135+ |
