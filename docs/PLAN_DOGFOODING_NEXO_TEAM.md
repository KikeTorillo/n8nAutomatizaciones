# Plan: Dogfooding Interno - Nexo Team

**Última Actualización:** 24 Enero 2026
**Estado:** ✅ Sistema de Suscripciones Completo - Falta validación de cancelación y comparativa Odoo

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

## Cuentas de Prueba Actuales

### Sistema Nexo

| Rol | Email | Password | Organización |
|-----|-------|----------|--------------|
| SuperAdmin | arellanestorillo@yahoo.com | Enrique23 | Nexo Team (org 1) |
| Cliente Test | arellanestorillo@gmail.com | Enrique23 | Test Org (org 2) - Plan Pro activo |

### Test Users MercadoPago México

| Rol | User ID | Password | Uso |
|-----|---------|----------|-----|
| Vendedor | TESTUSER8490440797252778890 | `GBpO6sgCkn` | Credenciales en Nexo Team |
| Comprador 1 | TESTUSER2716725750605322996 | `UCgyF4L44D` | Usado por org 2 |
| Comprador 2 | **PENDIENTE CREAR** | - | Para nueva org de prueba |

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
- Eventos: `payments`, `subscription_preapproval`, `subscription_authorized_payment`

---

## Estado Actual Validado ✅

### Flujos Completados

| Flujo | Estado | Fecha | Notas |
|-------|--------|-------|-------|
| Checkout → MercadoPago | ✅ | 24 Ene | Preapproval creado correctamente |
| Webhooks (payment + subscription) | ✅ | 24 Ene | HMAC validado, estados actualizados |
| Webhook subscription_authorized_payment | ✅ | 24 Ene | Fix: maneja status `processed` |
| Upgrade Trial → Pro | ✅ | 24 Ene | Pago exitoso, org actualizada |
| Downgrade Pro → Trial | ✅ | 24 Ene | Cambio inmediato sin pago |
| Prevención duplicados | ✅ | 24 Ene | Índice único + Error 409 |
| Cambio de plan bidireccional | ✅ | 24 Ene | Fix aplicado en `cambiarPlan()` |
| **Sistema Grace Period** | ✅ | 24 Ene | Middleware + Banner + Jobs pg_cron |
| **Restricción por Suscripción** | ✅ | 24 Ene | Solo lectura en grace_period, bloqueo en suspendida |

### Sistema de Restricción de Acceso (Implementado)

| Estado Suscripción | Nivel de Acceso | Comportamiento |
|--------------------|-----------------|----------------|
| `trial`, `activa`, `pendiente_pago` | Completo | Todas las operaciones |
| `grace_period`, `vencida` | Limitado | Solo lectura (GET), banner naranja |
| `suspendida`, `cancelada`, `trial_expirado` | Bloqueado | Redirect a /planes |

**Bypasses:**
- Nexo Team (org_id=1): Siempre acceso completo
- SuperAdmin (nivel_jerarquia >= 100): Siempre acceso completo
- Rutas exentas: `/login`, `/planes`, `/checkout`, `/mi-plan`, `/setup`

### Jobs pg_cron (Automáticos)

| Job | Horario | Función |
|-----|---------|---------|
| `suscripciones-grace-period` | 01:00 diario | Mover a grace_period después de 7 días sin pago |
| `suscripciones-suspender` | 02:00 diario | Suspender suscripciones con grace_period vencido |
| `suscripciones-trials-expirados` | 03:00 diario | Procesar trials expirados |

---

## Planes Activos

| Plan | Precio | Módulos |
|------|--------|---------|
| Trial | $0 (14 días) | agendamiento, inventario, pos |
| Pro | $249/mes | Todos los módulos |

---

## PRÓXIMOS PASOS

### Fase 1: Validación de Cancelación (PENDIENTE)

**Objetivo:** Probar flujo completo de cancelación de suscripción

#### Pruebas a Realizar

| # | Escenario | Pasos | Resultado Esperado |
|---|-----------|-------|-------------------|
| 1 | Cancelar desde MiPlan | Usuario cancela su suscripción | Estado → `cancelada`, acceso bloqueado |
| 2 | Cancelar desde Admin | SuperAdmin cancela suscripción de cliente | Estado → `cancelada`, webhooks actualizados |
| 3 | Cancelación con razón | Verificar que se guarde el motivo | Datos en BD para análisis de churn |
| 4 | Reactivar suscripción cancelada | Intentar reactivar después de cancelar | Debe crear nueva suscripción o reactivar existente |
| 5 | Cancelación en MercadoPago | Cancelar preapproval directamente en MP | Webhook debe actualizar estado en Nexo |

#### Criterios de Aceptación

- [ ] Usuario puede cancelar desde `/mi-plan`
- [ ] Se muestra modal de confirmación con razón obligatoria
- [ ] Estado cambia a `cancelada` en BD
- [ ] Webhook de MP sincroniza cancelación
- [ ] Usuario pierde acceso al siguiente intento de navegación
- [ ] Métricas de churn se actualizan

---

### Fase 2: Crear Segunda Organización de Prueba (PENDIENTE)

**Objetivo:** Validar flujo completo con usuario nuevo

#### Pasos

1. **Crear Test User Comprador 2 en MercadoPago**
   - Ir a: https://www.mercadopago.com.mx/developers/panel/app/{app_id}/test-users
   - Crear nuevo usuario de prueba
   - Documentar credenciales aquí

2. **Registrar nueva organización en Nexo**
   - URL: `https://<tunnel>/registro`
   - Email: `testorg2@example.com`
   - Verificar auto-vinculación como cliente de Nexo Team

3. **Completar checkout con Plan Pro**
   - Usar credenciales del Test User Comprador 2
   - Verificar webhook de activación

4. **Validar acceso y restricciones**
   - Probar todos los módulos
   - Verificar banner de suscripción

#### Datos de Segunda Organización (A COMPLETAR)

| Campo | Valor |
|-------|-------|
| Email | PENDIENTE |
| Password | PENDIENTE |
| Org ID | PENDIENTE |
| Test User MP | PENDIENTE |

---

### Fase 3: Comparativa Detallada con Odoo (INVESTIGACIÓN)

**Objetivo:** Auditar nuestro módulo de suscripciones vs Odoo Subscriptions para identificar gaps

#### Matriz de Comparación

| Feature | Odoo v18 | Nexo Actual | Gap | Prioridad |
|---------|----------|-------------|-----|-----------|
| **Gestión de Planes** |
| Crear/editar planes | ✅ | ✅ | - | - |
| Planes con features/límites | ✅ | ✅ | - | - |
| Pricing por periodo (mensual/anual) | ✅ | ✅ | - | - |
| Tiers/niveles de plan | ✅ | ✅ | - | - |
| **Ciclo de Vida** |
| Trial automático | ✅ | ✅ | - | - |
| Auto-renewal | ✅ | ✅ MP Preapproval | - | - |
| Grace period configurable | ✅ 1-30 días | ✅ 7 días fijo | Hacer configurable | Baja |
| Automatic closing | ✅ Configurable | ✅ Jobs pg_cron | - | - |
| **Pagos** |
| Múltiples gateways | ✅ | ⚠️ Solo MP | Agregar Stripe | Media |
| Dunning emails | ✅ Automáticos | ❌ | Implementar | **Alta** |
| Reintentos automáticos | ✅ | ✅ MP lo maneja | - | - |
| Prorrateo en cambios | ✅ | ❌ | Implementar | Media |
| **Self-Service** |
| Portal de cliente | ✅ | ✅ MiPlanPage | - | - |
| Cambiar plan | ✅ | ✅ CambiarPlanDrawer | - | - |
| Cancelar con razón | ✅ Obligatoria | ⚠️ Sin razón | Agregar | **Alta** |
| Ver historial pagos | ✅ | ⚠️ Solo admin | Agregar a MiPlan | Media |
| Descargar facturas | ✅ PDF | ❌ | Implementar | Media |
| **Analytics** |
| MRR/ARR | ✅ | ✅ | - | - |
| Churn rate | ✅ | ✅ | - | - |
| LTV | ✅ | ✅ | - | - |
| Cohort analysis | ✅ | ❌ | Implementar | Baja |
| Razones de cancelación | ✅ Dashboard | ❌ | Implementar | Media |
| Conversion rate trial→paid | ✅ | ❌ | Implementar | Media |
| **Comunicación** |
| Email bienvenida | ✅ | ❌ | Implementar | Media |
| Email renovación próxima | ✅ | ❌ | Implementar | Media |
| Email pago fallido | ✅ Secuencia | ❌ | Implementar | **Alta** |
| Email cancelación | ✅ | ❌ | Implementar | Media |
| **Integraciones** |
| Contabilidad | ✅ Nativo | ❌ | Implementar | Baja |
| CRM | ✅ Nativo | ✅ Clientes vinculados | - | - |
| Inventario (módulos) | ✅ | ✅ modulos_activos | - | - |

#### Gaps Críticos Identificados (Prioridad Alta)

1. **Dunning emails** - Secuencia de recordatorios de pago
2. **Razón de cancelación** - Obligatoria para análisis de churn
3. **Emails transaccionales** - Pago fallido, renovación próxima

#### Investigación Adicional Requerida

- [ ] Revisar UI/UX de Odoo Subscriptions en demo
- [ ] Documentar flujo de dunning en Odoo
- [ ] Analizar reportes de churn en Odoo
- [ ] Comparar con Chargebee/Recurly como referencia adicional

---

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `strategies/PlatformBillingStrategy.js` | Lógica Nexo → Orgs |
| `checkout.controller.js` | Flujo checkout + preapproval |
| `webhooks.controller.js` | Procesa webhooks MP |
| `suscripciones.model.js` | Estados, transiciones, bypass RLS |
| `mercadopago.service.js` | Cliente MP multi-tenant |
| `suscripcionActiva.js` | Middleware restricción acceso |
| `SubscriptionGuard.jsx` | Guard frontend + banner |
| `07-jobs-grace-period.sql` | Jobs pg_cron automáticos |

---

## Bugs Corregidos (24 Ene 2026)

| Bug | Causa | Solución |
|-----|-------|----------|
| Webhook `subscription_authorized_payment` no procesaba | Status `processed` no manejado (solo `approved`) | Agregar condición `status === 'processed'` |
| Pago quedaba `pendiente` aunque suscripción `activa` | Búsqueda usaba org vendedor, no global | Pasar `null` a `buscarPorGatewayId()` |
| Precio mostraba $0.00/mes en frontend | Campo `precio` vs `precio_actual` | Agregar alias SQL |

---

## Métricas Implementadas

| Métrica | Endpoint | Estado |
|---------|----------|--------|
| MRR | `/metricas/dashboard` | ✅ |
| Suscriptores Activos | `/metricas/dashboard` | ✅ |
| Churn Rate | `/metricas/dashboard` | ✅ |
| LTV Promedio | `/metricas/dashboard` | ✅ |
| Distribución por Estado | `/metricas/distribucion-estado` | ✅ |
| Top Planes | `/metricas/top-planes` | ✅ |
| Evolución MRR | `/metricas/evolucion-mrr` | ✅ |
| Evolución Churn | `/metricas/evolucion-churn` | ✅ |

---

## Referencias

- [Odoo Subscriptions Features](https://www.odoo.com/app/subscriptions-features)
- [Odoo Subscriptions Demo](https://demo.odoo.com/)
- [Stripe: How subscriptions work](https://docs.stripe.com/billing/subscriptions/overview)
- [Stripe: Handle failed payments](https://benfoster.io/blog/stripe-failed-payments-how-to/)
- [Chargebee: Dunning Management](https://www.chargebee.com/docs/2.0/dunning.html)
