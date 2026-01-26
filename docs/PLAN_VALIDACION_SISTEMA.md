# Plan: Validación Integral del Sistema

**Última Actualización:** 25 Enero 2026
**Estado:** ✅ Validación Core Completa

---

## Resumen Ejecutivo

| Módulo | Estado | Próxima Acción |
|--------|--------|----------------|
| **RBAC (Roles y Permisos)** | ✅ Validado | Tests automatizados pendientes |
| **Suscripciones** | ✅ Validado E2E | Definir UX de `/planes` |
| **Seguridad** | ✅ Implementado | Documentado abajo |

---

## PARTE 1: Sistema RBAC - ✅ Validado

### Pruebas E2E Completadas

| Prueba | Resultado |
|--------|-----------|
| Empleado (nivel 10) → `/configuracion` | ✅ Redirect a `/dashboard` |
| Admin ve todos los módulos | ✅ 18+ apps visibles |
| Crear rol nivel > 89 | ✅ Bloqueado - validación frontend |
| SuperAdmin de otra org no visible | ✅ RLS funciona |

### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `RolHelper.js` | Verificaciones jerárquicas backend |
| `useAccesoModulo.js` | Hooks `usePermiso`, `useAccesoModulo` |
| `ProtectedRoute.jsx` | Guard de rutas por rol |

---

## PARTE 2: Suscripciones - ✅ Validado E2E

### Arquitectura

```
Nexo Team (org_id=1) ─── VENDOR
    └── Organizaciones ←── Clientes CRM (auto-vinculadas)
            └── Suscripciones → org.plan_actual
```

### Flujos Validados (25 Ene 2026)

| Flujo | Estado |
|-------|--------|
| Checkout Plan Pro (MercadoPago Sandbox) | ✅ |
| Webhook procesa y activa suscripción | ✅ |
| SuperAdmin pausa suscripción | ✅ |
| Org cliente bloqueada (redirect `/planes`) | ✅ |
| SuperAdmin reactiva suscripción | ✅ |
| Org cliente acceso restaurado | ✅ |
| Trigger anti-duplicados (1 suscripción activa) | ✅ |

### Estados y Acceso

| Estado | Acceso | UX |
|--------|--------|-----|
| `trial`, `activa` | ✅ Completo | Normal |
| `pendiente_pago` | ✅ Completo | Banner amarillo |
| `grace_period` | ⚠️ Solo GET | Banner rojo |
| `pausada`, `suspendida`, `cancelada` | ❌ Bloqueado | Redirect `/planes` |

### Bypasses del Middleware

- `organizacion_id === 1` (Nexo Team)
- `nivel_jerarquia >= 100` (SuperAdmin)
- Rutas exentas: `/auth/*`, `/planes/*`, `/health`

---

## PARTE 3: Pendiente - UX de Pantalla `/planes`

### Decisiones Requeridas

| Pregunta | Opciones | Decisión |
|----------|----------|----------|
| **¿Cuándo aparece `/planes`?** | A) Solo cuando suscripción bloqueada<br>B) Siempre accesible desde menú<br>C) Solo desde landing (público) | **Pendiente** |
| **¿Acceso desde landing?** | A) Sí, público sin login<br>B) Solo para usuarios autenticados<br>C) Ambos (público + autenticado) | **Pendiente** |
| **¿Mostrar precios en landing?** | A) Sí, transparente<br>B) No, "Contactar ventas"<br>C) Precios base + "desde $X" | **Pendiente** |
| **¿Cambio de plan desde dentro?** | A) Self-service completo<br>B) Solo upgrade (downgrade via soporte)<br>C) Todo via soporte | **Pendiente** |

### Escenarios a Considerar

1. **Usuario nuevo visita landing** → ¿Ve planes y precios?
2. **Usuario en trial** → ¿Cómo accede a upgrade?
3. **Usuario activo quiere cambiar plan** → ¿Dónde lo hace?
4. **Usuario con suscripción bloqueada** → ¿Qué ve en `/planes`?

### Implementación Sugerida

```
Landing Page (público)
├── /precios → Planes con CTA "Comenzar gratis"
└── /registro → Crea cuenta + trial automático

App (autenticado)
├── /mi-plan → Estado actual + botón "Cambiar plan"
├── /planes → Checkout (solo si puede cambiar)
└── Redirect forzado → Si estado bloqueado
```

---

## PARTE 4: Seguridad Implementada

### Rate Limiting (`rateLimiting.js`)

| Tipo | Límite | Ventana |
|------|--------|---------|
| IP General | 100 req | 15 min |
| Autenticación | 10 req | 15 min |
| Usuario | 1000 req | 15 min |
| Operaciones Pesadas | 20 req | 1 hora |

### Autenticación JWT (`auth.js`)

- Timing-safe comparisons
- Token Blacklist en Redis
- Invalidación por cambio de permisos
- RLS cleanup garantizado

### Webhooks - Idempotencia

- Tabla `webhooks_procesados` con `ON CONFLICT DO NOTHING`
- Verificación `yaFueProcesado()` antes de procesar

---

## PARTE 5: Tests Pendientes

### Prioridad Alta

- [ ] Token manipulado → verificar rechazo
- [ ] Rate limit auth → bloqueo después de 10 intentos
- [ ] Webhook duplicado → idempotencia funciona
- [ ] Webhook sin firma → rechazado 400

### Prioridad Media

- [ ] SQL injection en parámetros
- [ ] IP spoofing con `X-Forwarded-For`
- [ ] Trial expirado → transición automática a `vencida`

---

## Cuentas de Prueba

| Rol | Email | Password | Org | Nivel |
|-----|-------|----------|-----|-------|
| SuperAdmin | arellanestorillo@yahoo.com | Enrique23 | Nexo Team (1) | 100 |
| Admin | arellanestorillo@gmail.com | Enrique23 | Nexo Test (2) | 90 |

### MercadoPago Sandbox

**Tarjeta:** `5031 7557 3453 0604` | CVV: 123 | Venc: 11/25

---

## Gaps Pendientes

| Prioridad | Feature |
|-----------|---------|
| **Alta** | Definir UX de `/planes` (landing vs app) |
| **Alta** | Dunning emails (recordatorios de pago) |
| **Media** | Prorrateo en cambios de plan |
| **Media** | Job automático: trial expirado → vencida |
