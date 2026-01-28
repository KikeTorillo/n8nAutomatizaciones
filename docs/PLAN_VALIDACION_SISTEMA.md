# Plan: Validación Integral del Sistema

**Última Actualización:** 28 Enero 2026

---

## Estado General

| Módulo | Estado |
|--------|--------|
| RBAC (Roles y Permisos) | ✅ Validado |
| Suscripciones y Checkout | ✅ Validado E2E |
| Jobs Automáticos | ✅ Implementado |
| Seguridad | ✅ Implementado |
| Website Builder | 🔄 En Progreso |
| Multi-Tenant Pagos | 🔍 Pendiente |

---

## Suscripciones - Flujo Completo

### Arquitectura
```
Nexo Team (org_id=1) → Vende planes a organizaciones
    └── Organizaciones → Clientes CRM (auto-vinculadas)
            └── Suscripciones → org.plan_actual
```

### Estados y Acceso

| Estado | Acceso | UX |
|--------|--------|-----|
| `trial`, `activa` | ✅ Completo | Normal |
| `pendiente_pago` | ✅ Completo | Banner amarillo |
| `grace_period` | ⚠️ Solo GET | Banner rojo |
| `pausada`, `suspendida`, `cancelada` | ❌ Bloqueado | Redirect `/planes` |

### Bypasses
- `organizacion_id === 1` (Nexo Team)
- `nivel_jerarquia >= 100` (SuperAdmin)
- Rutas exentas: `/auth/*`, `/planes/*`, `/health`

### Checkout - 3 Flujos

1. **No autenticado** → Guarda plan en localStorage → Registro → Onboarding inicia trial
2. **Trial** → POST `/checkout/iniciar-trial` → Suscripción sin gateway
3. **Pago** → POST `/checkout/iniciar` → Redirect MercadoPago → Webhook activa

### Cobros Recurrentes
MercadoPago Preapproval cobra automáticamente cada período. No se requiere job de cobros.

---

## Jobs Automáticos

| Job | Horario | Función |
|-----|---------|---------|
| `verificar-trials.job.js` | 07:00 | Trials expirados → vencida/activa |
| `procesar-dunning.job.js` | 08:00 | Secuencia dunning + transiciones |
| `polling-suscripciones.job.js` | */5min | Fallback webhooks MercadoPago |
| `procesar-cobros.job.js` | 06:00 | 🔜 Futuro (Stripe) |

---

## Seguridad

| Componente | Configuración |
|------------|---------------|
| Rate Limit IP | 100 req / 15 min |
| Rate Limit Auth | 10 req / 15 min |
| Rate Limit Usuario | 1000 req / 15 min |
| JWT | Blacklist Redis, timing-safe |
| Webhooks | Idempotencia con `webhooks_procesados` |

---

## Website Builder

### Completado
- ✅ Drag & Drop Paleta → Canvas

### Pendiente Fase 1
- AI Site Generator
- Preview/Staging
- Versionado/Rollback

### Pendiente Fase 2
- Widget de Citas (diferenciador)
- Subdominio nexo.site
- Dominio personalizado + SSL

---

## Pendiente: Multi-Tenant de Pagos

### Validar
1. ¿Cada org puede conectar su propia cuenta MercadoPago?
2. ¿El checkout usa credenciales de la org del plan?
3. ¿Los pagos van a la cuenta correcta?

### Archivos a revisar
- `conectores.model.js`
- `checkout.controller.js`
- `mercadopago.service.js`

---

## Tests Pendientes

### Seguridad
- [ ] Token manipulado → rechazo
- [ ] Rate limit auth → bloqueo
- [ ] Webhook duplicado → idempotencia
- [ ] Webhook sin firma → rechazado

### Jobs
- [ ] Secuencia trial → vencida → grace_period → suspendida
- [ ] Webhook `authorized_payment` en cobro mensual

---

## Gaps por Prioridad

| Prioridad | Feature |
|-----------|---------|
| Alta | Validar arquitectura pagos multi-tenant |
| Alta | Formulario planes con múltiples precios |
| Media | Prorrateo en cambios de plan |
| Baja | 2FA/MFA |
