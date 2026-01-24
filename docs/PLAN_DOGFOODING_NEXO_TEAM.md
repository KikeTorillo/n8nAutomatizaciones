# Plan: Dogfooding Interno - Nexo Team

**Última Actualización:** 24 Enero 2026
**Estado:** ✅ E2E Completo - Checkout, Webhooks, Upgrade/Downgrade validados

---

## Arquitectura

```
Nexo Team (org_id=1) ─── VENDOR
    │
    ├── Clientes CRM ←── Organizaciones (auto-vinculadas al registrarse)
    │
    └── Suscripciones ←── Contratos con cada org
            │
            └── Al activarse → Actualiza org.plan_actual + modulos_activos
```

**Strategy Pattern:** `PlatformBillingStrategy` (Nexo→Orgs) vs `CustomerBillingStrategy` (Org→Clientes)

---

## Configuración MercadoPago

### Conectores de Pago (Multi-Tenant)

Credenciales encriptadas en `conectores_pago_org`. Configurar desde: **Suscripciones > Conectores de Pago**

### Variables .env

```env
MERCADOPAGO_ENVIRONMENT=sandbox
MERCADOPAGO_TEST_PAYER_EMAIL=test_user_2716725750605322996@testuser.com
CREDENTIAL_ENCRYPTION_KEY=<64_chars_hex>
```

### Webhooks MercadoPago

Configurar en **Test User Vendedor** > Webhooks > **Modo productivo**:
- URL: `https://<tunnel>/api/v1/suscripciones-negocio/webhooks/mercadopago/1`
- Eventos: `payments`, `subscription_preapproval`

### Test Users México

| Rol | User ID | Password |
|-----|---------|----------|
| Vendedor | TESTUSER8490440797252778890 | `GBpO6sgCkn` |
| Comprador | TESTUSER2716725750605322996 | `UCgyF4L44D` |

---

## Estado Actual Validado

| Flujo | Estado | Notas |
|-------|--------|-------|
| Checkout → MercadoPago | ✅ | Preapproval creado correctamente |
| Webhooks (payment + subscription) | ✅ | HMAC validado, estados actualizados |
| Upgrade Trial → Pro | ✅ | Pago exitoso, org actualizada |
| Downgrade Pro → Trial | ✅ | Cambio inmediato sin pago |
| Prevención duplicados | ✅ | Índice único + Error 409 |
| Cambio de plan bidireccional | ✅ | Fix aplicado en `cambiarPlan()` |

---

## Planes Activos

| Plan | Precio | Módulos |
|------|--------|---------|
| Trial | $0 (14 días) | agendamiento, inventario, pos |
| Pro | $249/mes | Todos los módulos |

---

## PRÓXIMO: Restricción de Acceso por Suscripción

### Problema

Actualmente no hay restricción cuando:
- Trial expira (14 días)
- Suscripción no pagada (pendiente_pago > X días)
- Suscripción cancelada/vencida

### Requerimientos

| Caso | Comportamiento Esperado |
|------|------------------------|
| Trial expirado | Mostrar banner "Trial terminado" + bloquear acceso a módulos |
| Pago pendiente >7 días | Mostrar banner "Pago pendiente" + acceso limitado |
| Suscripción cancelada | Solo lectura, sin crear/editar |
| Sin suscripción | Redirect a página de planes |

### Análisis: Mejores Prácticas de la Industria

#### Odoo Subscriptions (v18/v19)

| Feature | Odoo | Nexo Actual | Prioridad |
|---------|------|-------------|-----------|
| Auto-renewals con cargo automático | ✅ | ✅ MP Preapproval | - |
| Customer self-service portal | ✅ | ✅ MiPlanPage | - |
| Customer-initiated closure | ✅ Con razón obligatoria | ⚠️ Sin razón | Media |
| Automatic closing (días sin pago) | ✅ Configurable | ❌ | **Alta** |
| Grace period | ✅ Configurable | ❌ | **Alta** |
| Flexible billing periods | ✅ Semanal/Mensual/Anual | ✅ | - |
| Proration (prorrateo) | ✅ | ❌ | Media |
| Cohort analysis (retención) | ✅ | ❌ | Baja |

**Key insight Odoo:** El cliente puede cerrar su propia suscripción y debe dar una razón - esto reduce tickets de soporte y mejora datos de churn.

#### Stripe Billing Patterns

| Pattern | Descripción | Implementación Nexo |
|---------|-------------|---------------------|
| **Dunning sequence** | Reintentos: día 1, 3, 7. Emails automáticos | MP maneja reintentos, agregar emails |
| **Grace period** | 7-14 días acceso mientras se reintenta | Implementar con `fecha_gracia` |
| **past_due status** | Estado intermedio antes de cancelar | Agregar estado `vencida_gracia` |
| **Pause collection** | Pausar cobros sin cancelar | Ya existe `pausada` |
| **Smart retry** | Reintentar en horarios óptimos | MP lo hace automáticamente |

**Key insight Stripe:** Usar período de gracia (5-14 días) + reintentos antes de bloquear. Un pago fallido hoy puede funcionar mañana por: saldo disponible, tarjeta actualizada, o error de red temporal.

### Implementación Propuesta

#### Fase 1: Middleware de Verificación (Solo Nexo Team)

```javascript
// middleware/suscripcionActiva.js
const verificarSuscripcion = async (req, res, next) => {
    // Solo aplica para organizaciones (no Nexo Team ni SuperAdmin)
    if (req.user.organizacion_id === NEXO_TEAM_ORG_ID) return next();
    if (req.user.nivel_jerarquia >= 100) return next();

    const org = await OrganizacionModel.buscarPorId(req.user.organizacion_id);

    // Verificar estado de suscripción
    const estado = await SuscripcionesModel.verificarEstadoOrg(org.id);

    if (estado.bloqueado) {
        return res.status(402).json({
            error: 'subscription_required',
            message: estado.mensaje,
            redirect: '/planes'
        });
    }

    if (estado.limitado) {
        req.suscripcionLimitada = true;
        req.mensajeSuscripcion = estado.mensaje;
    }

    next();
};
```

#### Fase 2: Estados de Suscripción Expandidos

```sql
-- Agregar columnas para grace period
ALTER TABLE suscripciones_org ADD COLUMN fecha_gracia DATE;
ALTER TABLE suscripciones_org ADD COLUMN intentos_cobro INTEGER DEFAULT 0;
ALTER TABLE suscripciones_org ADD COLUMN ultimo_intento_cobro TIMESTAMP;
```

#### Fase 3: Cron Job de Verificación

```javascript
// Ejecutar diariamente
const verificarSuscripcionesVencidas = async () => {
    // 1. Marcar trials expirados
    await marcarTrialsExpirados();

    // 2. Enviar recordatorios de pago (dunning)
    await enviarRecordatoriosPago();

    // 3. Bloquear después de grace period
    await bloquearSuscripcionesVencidas();
};
```

#### Fase 4: Frontend - Componentes de Restricción

| Componente | Propósito |
|------------|-----------|
| `<SuscripcionBanner />` | Muestra estado (trial expirando, pago pendiente) |
| `<FeatureGate feature="inventario" />` | Wrapper que verifica acceso a módulo |
| `<SubscriptionGuard />` | HOC para rutas que requieren suscripción activa |

### Consideraciones de Dogfooding

**NO romper el dogfooding actual:**
- Nexo Team (org_id=1) SIEMPRE tiene acceso completo
- SuperAdmin SIEMPRE tiene acceso completo
- Las restricciones solo aplican a organizaciones cliente

**Constante centralizada:**
```javascript
// config/constants.js
const NEXO_TEAM_ORG_ID = process.env.NEXO_TEAM_ORG_ID || 1;
const GRACE_PERIOD_DAYS = 7;
const DUNNING_SEQUENCE = [1, 3, 7]; // Días para enviar recordatorios
```

---

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `strategies/PlatformBillingStrategy.js` | Lógica Nexo → Orgs |
| `checkout.controller.js` | Flujo checkout + preapproval |
| `webhooks.controller.js` | Procesa webhooks MP |
| `suscripciones.model.js` | Estados, transiciones, bypass RLS |
| `mercadopago.service.js` | Cliente MP multi-tenant |

---

## Métricas a Implementar

| Métrica | SQL/Query |
|---------|-----------|
| **Conversion Trial→Paid** | Trials que se convierten en activas |
| **Churn Rate** | Suscripciones canceladas / activas |
| **Failed Payment Rate** | Cobros fallidos / intentos |
| **Days to Convert** | Promedio días trial antes de pagar |

---

## Próximos Pasos (Priorizado)

### Fase 1: Restricción de Acceso (Sprint actual)
1. **Middleware `verificarSuscripcion`** - Verificar estado antes de cada request
2. **Estado `vencida`** - Marcar trials expirados vía cron
3. **`<SuscripcionBanner />`** - Mostrar estado en header del frontend
4. **Grace period (7 días)** - Columna `fecha_gracia` + lógica

### Fase 2: Comunicación (Siguiente sprint)
5. **Dunning emails** - Secuencia: día 1, 3, 7 de pago pendiente
6. **Razón de cancelación** - Obligatoria al cancelar (datos para reducir churn)

### Fase 3: Optimización (Backlog)
7. **Proration** - Calcular diferencia al cambiar plan mid-cycle
8. **Métricas churn** - Conversion rate, days to convert, reasons

---

## Referencias

- [Odoo Subscriptions Features](https://www.odoo.com/app/subscriptions-features)
- [Stripe: How subscriptions work](https://docs.stripe.com/billing/subscriptions/overview)
- [Stripe: Pause payment collection](https://docs.stripe.com/billing/subscriptions/pause-payment)
- [Stripe: Handle failed payments](https://benfoster.io/blog/stripe-failed-payments-how-to/)
