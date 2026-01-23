# Plan: Dogfooding Interno - Nexo Team

**Fecha:** 22 Enero 2026
**Estado:** Fases 0-8 completadas, pendiente validación integral

---

## Concepto

Nexo Team (org_id=1) gestiona las organizaciones de la plataforma como clientes usando el módulo **suscripciones-negocio**.

```
Nexo Team (org_id=1)
├── Clientes CRM = Organizaciones de la plataforma
├── Suscripciones = Contratos con cada org
└── SuperAdmin Dashboard = Métricas SaaS (MRR, Churn, etc.)
```

---

## Próximos Pasos

### 1. Validación Integral: Sistema de Roles

**Objetivo:** Auditar diseño BD → Backend → Frontend

| Tarea | Estado |
|-------|--------|
| Revisar estructura tabla `roles` y `permisos_rol` | [ ] |
| Validar `RolHelper.js` y middleware `permisos.js` | [ ] |
| **CREAR:** Página `/configuracion/roles` | [ ] |
| **CREAR:** CRUD roles personalizados | [ ] |
| **CREAR:** UI asignación permisos a roles | [ ] |

### 2. Validación Integral: Suscripciones + Checkout

**Objetivo:** Validar flujo completo con MercadoPago

| Paso | Validación | Estado |
|------|------------|--------|
| 1 | Página `/planes` muestra Trial y Pro | [ ] |
| 2 | CheckoutModal funciona | [ ] |
| 3 | Redirect a MercadoPago sandbox | [ ] |
| 4 | Callback `/payment/callback` procesa resultado | [ ] |
| 5 | Webhook activa suscripción | [ ] |
| 6 | Org vinculada actualiza `plan_actual` y `modulos_activos` | [ ] |

---

## Planes (Solo 2)

| Plan | Precio | Límites |
|------|--------|---------|
| **Trial** | $0 (14 días) | 50 citas, 2 profesionales, 10 servicios |
| **Pro** | $249/usuario/mes | Ilimitado |

**SQL:** `sql/suscripciones-negocio/03-datos-nexo-team.sql` (v2.0.0)

---

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `backend/app/config/constants.js` | `NEXO_TEAM_ORG_ID`, `FEATURE_TO_MODULO` |
| `backend/app/services/dogfoodingService.js` | Vinculación org → cliente |
| `sql/suscripciones-negocio/02-funciones-metricas.sql` | Funciones métricas SaaS |

---

**Última Actualización:** 22 Enero 2026
