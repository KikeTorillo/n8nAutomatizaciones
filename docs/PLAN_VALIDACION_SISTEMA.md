# Plan: Validación Integral del Sistema

**Última Actualización:** 25 Enero 2026
**Estado:** 🔄 En Progreso

---

## Resumen Ejecutivo

| Módulo | Estado | Próxima Acción |
|--------|--------|----------------|
| **RBAC (Roles y Permisos)** | ✅ Validado E2E | Pruebas con rol personalizado |
| **Suscripciones** | 🔄 Parcial | **Próxima sesión** |

---

## PARTE 1: Sistema RBAC - Validado

### Pruebas E2E Completadas (25 Ene 2026)

| Prueba | Resultado |
|--------|-----------|
| Rutas sensibles protegidas (`/configuracion`, `/profesionales`) | ✅ Redirigen a `/home` para empleado |
| Componente `ConPermiso` oculta botones | ✅ "Nueva Cita" oculto para empleado |
| Queries condicionadas por rol | ✅ Sin errores toast para empleado |
| Admin ve todos los módulos y botones | ✅ |

### Fixes Implementados

| Fix | Descripción |
|-----|-------------|
| Rutas `ADMIN_ONLY` | `configuracion.routes.jsx`, `personas.routes.jsx` |
| `ConPermiso` component | Wrapper para elementos UI según permisos |
| Hooks con `enabled` | `useAppNotifications`, `useMetricasSucursales`, `useEstadoSuscripcion` |
| `usePermiso` fallback | Obtiene `sucursalId` del store si no está en user |

### Archivos Clave RBAC

| Archivo | Propósito |
|---------|-----------|
| `RolHelper.js` | Verificaciones jerárquicas backend |
| `useAccesoModulo.js` | Hooks `usePermiso`, `useAccesoModulo` |
| `ConPermiso.jsx` | Componente UI para permisos granulares |
| `ProtectedRoute.jsx` | Guard de rutas por rol |

### Pendiente: Pruebas Avanzadas

- [ ] Crear rol personalizado "Recepcionista" (nivel 30)
- [ ] Asignar permisos específicos al rol
- [ ] Crear usuario con rol personalizado
- [ ] Validar restricciones de acceso E2E
- [ ] Probar protección jerárquica

---

## PARTE 2: Suscripciones - Próxima Sesión

### Arquitectura

```
Nexo Team (org_id=1) ─── VENDOR (PlatformBillingStrategy)
    └── Organizaciones ←── Clientes CRM (auto-vinculadas)
            └── Suscripciones → Al activarse actualiza org.plan_actual
```

### Validado Previamente

| Flujo | Estado |
|-------|--------|
| Checkout Plan Pro (MercadoPago) | ✅ |
| Webhook subscription_preapproval | ✅ |
| Cancelación con motivo | ✅ |
| Grace Period (banner) | ✅ |
| Suspensión (redirect a /planes) | ✅ |

### Pendiente Validar

| Prioridad | Feature |
|-----------|---------|
| Alta | UX de /planes (landing vs sesión) |
| Alta | Middleware suscripción en TODAS las rutas |
| Media | Dunning emails (recordatorios pago) |
| Media | Prorrateo en cambios de plan |

---

## Cuentas de Prueba

### Nexo

| Rol | Email | Password | Org |
|-----|-------|----------|-----|
| SuperAdmin | arellanestorillo@yahoo.com | Enrique23 | Nexo Team (1) |
| Admin | arellanestorillo@gmail.com | Enrique23 | Nexo Test (2) |
| Empleado | (pendiente crear) | - | Nexo Test (2) |

### MercadoPago México (Sandbox)

| Rol | User ID |
|-----|---------|
| Vendedor | TESTUSER8490440797252778890 |
| Comprador | TESTUSER2716725750605322996 |

**Tarjeta Test:** `5031 7557 3453 0604` | CVV: 123 | Venc: 11/25

---

## Bugs Corregidos (25 Ene 2026)

| Bug | Solución |
|-----|----------|
| Rutas sensibles con `ALL_AUTHENTICATED` | Cambiado a `ADMIN_ONLY` |
| Botones visibles sin permiso | Componente `ConPermiso` |
| Toast errors para empleado en Home | Hooks con `enabled: esAdmin` |
| `usePermiso` sin sucursalId | Fallback a `sucursalStore` |
| Rate limit bloqueaba login | `docker exec redis redis-cli FLUSHALL` |

---

## Próxima Sesión

**Objetivo:** Validación completa del módulo de Suscripciones

1. Revisar UX de `/planes` para usuarios no autenticados
2. Validar middleware de suscripción en rutas críticas
3. Probar flujo completo: trial → checkout → activación
4. Verificar comportamiento en estados: `grace_period`, `suspendida`
