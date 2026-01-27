# Plan: Validación Integral del Sistema

**Última Actualización:** 26 Enero 2026
**Estado:** ✅ Validación Core Completa

---

## Resumen Ejecutivo

| Módulo | Estado | Próxima Acción |
|--------|--------|----------------|
| **RBAC (Roles y Permisos)** | ✅ Validado | Tests automatizados pendientes |
| **Suscripciones** | ✅ Validado E2E | - |
| **UX Planes y Checkout** | ✅ Implementado | - |
| **Checkout Trials** | ✅ Validado E2E | - |
| **Seguridad** | ✅ Implementado | Documentado abajo |
| **Jobs Automáticos** | ✅ Implementado | Validar ejecución en producción |
| **Website Builder** | 🔄 En Progreso | Ver Fase 1 abajo |
| **Dogfooding Planes** | 🔍 Pendiente | **Validar arquitectura multi-tenant** |

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

### Cobros Recurrentes (MercadoPago Preapproval)

**MercadoPago cobra automáticamente** cada período usando Preapproval API:

```
Checkout → Usuario acepta → MP guarda tarjeta → MP cobra cada mes → Webhook notifica
```

| Paso | Responsable |
|------|-------------|
| Crear suscripción (checkout) | Tu sistema |
| Cobrar mensualmente | **MercadoPago (automático)** |
| Notificar cobro (`authorized_payment`) | MercadoPago (webhook) |
| Actualizar estado suscripción | Tu sistema |

**Nota:** Esto aplica tanto para Nexo Team como para clientes que conecten sus propias credenciales de MercadoPago.

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

## PARTE 3: UX de Pantalla `/planes` - ✅ Implementado

### Decisiones Tomadas (25 Ene 2026)

| Pregunta | Decisión |
|----------|----------|
| **¿Cuándo aparece `/planes`?** | Siempre accesible + redirect si bloqueado |
| **¿Acceso desde landing?** | ✅ Sí, enlace "Planes" en navegación |
| **¿Mostrar precios en landing?** | ✅ Sí, precios transparentes |
| **¿Cambio de plan desde dentro?** | Upgrade self-service, downgrade vía soporte |

### Componentes Implementados

| Componente | Archivo | Función |
|------------|---------|---------|
| `ContactarSoporteModal` | `suscripciones-negocio/` | Modal para downgrades → contactar soporte |
| `AlertaBloqueado` | `suscripciones-negocio/` | Banner contextual según estado bloqueado |
| `HistorialPagosCard` | `suscripciones-negocio/` | Últimos pagos en `/mi-plan` |

### Flujos Validados

| Flujo | Estado |
|-------|--------|
| Landing → "Planes" → `/planes` | ✅ |
| Usuario bloqueado → redirect `/planes?estado=vencida` | ✅ |
| Banner contextual según estado | ✅ |
| Upgrade → Checkout MercadoPago | ✅ |
| Downgrade → Modal "Contactar Soporte" | ✅ |
| Historial pagos en `/mi-plan` | ✅ |
| FAQ expandido con acordeón | ✅ |

### Sistema Dinámico de Períodos

La UI detecta automáticamente qué períodos tienen precios configurados:

| Campo BD | Visible si |
|----------|------------|
| `precio_mensual` | Siempre (NOT NULL) |
| `precio_trimestral` | Si != NULL |
| `precio_anual` | Si != NULL |

**Estado actual Nexo Team:**
- Solo Mensual y Anual configurados
- Selector solo muestra esos dos botones

### Checkout Modal - Flujos Implementados (26 Ene 2026)

El `CheckoutModal` maneja 3 escenarios distintos según el estado del usuario y el plan:

#### Flujo 1: Usuario NO Autenticado

```
/planes → Click "Seleccionar Plan"
    ↓
CheckoutModal detecta !isAuthenticated
    ↓
UI: "Crea tu cuenta para continuar"
    ↓
Click "Crear cuenta" → localStorage.setItem('nexo_plan_seleccionado', {...})
    ↓
Redirect a /registro
    ↓
Registro → Activar cuenta → Onboarding
    ↓
Onboarding detecta plan en localStorage (si < 1 hora)
    ↓
Crea organización + inicia trial automáticamente
    ↓
localStorage.removeItem() → Redirect a /home
```

| Paso | Estado |
|------|--------|
| Modal muestra "Crear cuenta para continuar" | ✅ |
| Botones "Crear cuenta gratis" y "Ya tengo cuenta" | ✅ |
| localStorage guarda `{plan_id, plan_nombre, periodo, timestamp}` | ✅ |
| Redirect a `/registro` (no `/auth/registro`) | ✅ |
| Onboarding lee localStorage e inicia trial | ✅ |

#### Flujo 2: Trial (plan.dias_trial > 0)

```
Usuario autenticado → /planes → Click "Comenzar prueba gratis"
    ↓
CheckoutModal detecta plan.dias_trial > 0
    ↓
UI: Sin campo cupón, "Gratis por X días"
    ↓
Click "Comenzar X días gratis"
    ↓
POST /checkout/iniciar-trial (sin MercadoPago)
    ↓
Backend crea suscripción estado='trial', gateway=null
    ↓
Redirect a /home
```

| Paso | Estado |
|------|--------|
| Modal título "Comenzar Prueba Gratuita" | ✅ |
| Campo cupón OCULTO | ✅ |
| Muestra "Gratis por X días" + precio post-trial | ✅ |
| Botón "Comenzar X días gratis" | ✅ |
| Nota "Sin tarjeta requerida" | ✅ |
| Backend crea suscripción sin gateway | ✅ |

#### Flujo 3: Pago Normal (sin trial)

```
Usuario autenticado → /planes → Click "Seleccionar Plan"
    ↓
CheckoutModal muestra checkout completo
    ↓
Campo cupón visible, resumen de precios
    ↓
Click "Pagar $X"
    ↓
POST /checkout/iniciar → MercadoPago init_point
    ↓
Redirect a MercadoPago → Webhook → suscripción 'activa'
```

| Paso | Estado |
|------|--------|
| Modal título "Confirmar Suscripción" | ✅ |
| Campo cupón visible y funcional | ✅ |
| Resumen: subtotal, descuento, total | ✅ |
| Botón "Pagar $X" | ✅ |
| Redirect a MercadoPago | ✅ |

### Archivos Modificados (26 Ene 2026)

| Archivo | Cambios |
|---------|---------|
| `CheckoutModal.jsx` | Detección auth, UI condicional (3 flujos), mutation trial |
| `suscripciones-negocio.api.js` | Método `iniciarTrial()` |
| `checkout.js` (routes) | Ruta POST `/iniciar-trial` |
| `checkout.schemas.js` | Schema `iniciarTrial` |
| `checkout.controller.js` | Método `iniciarTrial()` |
| `OnboardingPage.jsx` | Lee plan de localStorage, inicia trial automático |

### Validación de Suscripción Existente

El endpoint `/iniciar-trial` valida que el cliente no tenga suscripción activa antes de crear una nueva:

```javascript
// Busca TODAS las suscripciones activas del cliente (bypass RLS para cross-vendor)
const suscripcionesActivas = await SuscripcionesModel.buscarTodasActivasPorClienteBypass(clienteId);
if (suscripcionesActivas.length > 0) {
  throw new AppError(`Ya tienes una suscripción activa con el plan ${existente.nombre}`, 400);
}
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

## PARTE 5: Jobs Automáticos - ✅ Implementado

### Modelo de Cobros Recurrentes

#### MercadoPago Preapproval (Modelo Actual)

Con **Preapproval API**, MercadoPago cobra automáticamente cada período:

```
1. Checkout → Crea Preapproval en MercadoPago
2. Usuario acepta → MP guarda su tarjeta
3. Cada mes → MP cobra automáticamente
4. MP envía webhook "authorized_payment"
5. Tu sistema actualiza estado de suscripción
```

**Importante:** Tanto Nexo Team como los clientes que conecten sus propias credenciales de MercadoPago usan este modelo. **No se requiere job de cobros** porque MercadoPago lo hace automáticamente.

#### Gateways con Tokenización (Futuro - Stripe)

Para gateways que requieren cobros manuales con tarjeta tokenizada:

```
1. Usuario guarda tarjeta → Se tokeniza y almacena
2. Job diario → Busca suscripciones con fecha_proximo_cobro = hoy
3. Job cobra → Usa token para crear cargo via API
4. Actualiza estado según resultado
```

El job `procesar-cobros.job.js` está preparado para este escenario.

### Cronograma de Ejecución

| Hora | Job | Uso Actual | Descripción |
|------|-----|------------|-------------|
| 06:00 | `procesar-cobros.job.js` | 🔜 Futuro (Stripe) | Cobros con tarjeta tokenizada |
| 07:00 | `verificar-trials.job.js` | ✅ Activo | Trials expirados → vencida/activa |
| 08:00 | `procesar-dunning.job.js` | ✅ Activo | Secuencia dunning + transiciones |
| */5min | `polling-suscripciones.job.js` | ✅ Activo | Fallback webhooks MercadoPago |

### Funcionalidad de Cada Job

#### `verificar-trials.job.js` ✅ Activo
- Detecta trials con `fecha_fin_periodo < NOW()`
- Si tiene método de pago → transición a `activa`
- Si no tiene método de pago → transición a `vencida`

#### `procesar-dunning.job.js` ✅ Activo
- Ejecuta secuencia de dunning definida en `DUNNING_SEQUENCE`
- Envía emails de recordatorio en días configurados
- Transición automática: `grace_period` → `suspendida` → `cancelada`

#### `polling-suscripciones.job.js` ✅ Activo
- Fallback por si webhooks de MercadoPago fallan
- Consulta estado real de suscripciones via API
- Sincroniza estados discrepantes

#### `procesar-cobros.job.js` 🔜 Futuro
- **No se usa con MercadoPago** (Preapproval cobra automático)
- Preparado para Stripe u otros gateways con tokenización
- Busca suscripciones con `auto_cobro = TRUE` y `fecha_proximo_cobro = hoy`

### Archivos Clave

| Archivo | Ruta |
|---------|------|
| Jobs Index | `backend/app/modules/suscripciones-negocio/jobs/index.js` |
| Servicio Cobros | `backend/app/modules/suscripciones-negocio/services/cobro.service.js` |
| Servicio Notificaciones | `backend/app/modules/suscripciones-negocio/services/notificaciones.service.js` |
| Constantes Dunning | `backend/app/config/constants.js` (DUNNING_SEQUENCE) |
| Servicio Dunning | `backend/app/modules/suscripciones-negocio/services/dunning.service.js` |

---

## PARTE 6: Tests Pendientes

### Prioridad Alta

- [ ] Token manipulado → verificar rechazo
- [ ] Rate limit auth → bloqueo después de 10 intentos
- [ ] Webhook duplicado → idempotencia funciona
- [ ] Webhook sin firma → rechazado 400

### Prioridad Media

- [ ] SQL injection en parámetros
- [ ] IP spoofing con `X-Forwarded-For`

### Jobs Automáticos

- [ ] Ejecutar `verificar-trials.job.js` manualmente para validar transiciones
- [ ] Ejecutar `procesar-dunning.job.js` y verificar emails enviados
- [ ] Verificar que `polling-suscripciones.job.js` sincroniza estados correctamente
- [ ] Probar secuencia completa: trial → vencida → grace_period → suspendida
- [ ] Validar que MercadoPago envía webhook `authorized_payment` en cobro mensual

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
| **Alta** | Validar arquitectura de pagos multi-tenant (PARTE 8) |
| **Alta** | Formulario de planes con múltiples precios |
| **Media** | Prorrateo en cambios de plan |
| **Baja** | 2FA/MFA |

### Recientemente Completados ✅

- ~~UX de `/planes`~~ → Implementado 25 Ene 2026
- ~~Checkout Trials sin tarjeta~~ → Implementado 26 Ene 2026
- ~~Flujo usuario no autenticado → registro → trial automático~~ → 26 Ene 2026
- ~~Dunning emails (recordatorios de pago)~~ → `procesar-dunning.job.js`
- ~~Job automático: trial expirado → vencida~~ → `verificar-trials.job.js`

---

## PARTE 7: Website Builder - 🔄 En Progreso

### Objetivo

Transformar el módulo Website en competidor de Wix/Squarespace con ventaja única: integración nativa con CRM, Citas y Facturación.

### Fase 1: Funcionalidades Críticas

| Feature | Estado | Notas |
|---------|--------|-------|
| **Drag & Drop Paleta→Canvas** | ✅ Completado | Fix aplicado 25 Ene 2026 |
| AI Site Generator | ❌ Pendiente | Modal multi-paso + endpoint IA |
| Preview/Staging | ❌ Pendiente | URL temporal antes de publicar |
| Versionado/Rollback | ❌ Pendiente | UI falta, SQL existe |

### Fix Drag & Drop (25 Ene 2026)

**Problema:** Bloques se insertaban en posición incorrecta porque se usaba el índice del array frontend como `orden`, pero los valores de orden en la DB podían tener gaps.

**Solución:** Usar el valor `bloque.orden` real de la DB en lugar del índice del array.

**Archivo modificado:**
- `frontend/src/pages/website/WebsiteEditorPage.jsx` - `handleDropFromPalette()`

**Cambio clave:**
```javascript
// ANTES (incorrecto)
const targetIndex = bloques.findIndex((b) => b.id === targetId);
indice = position === 'before' ? targetIndex : targetIndex + 1;

// DESPUÉS (correcto)
const targetOrden = targetBloque.orden ?? bloques.indexOf(targetBloque);
ordenInsercion = position === 'before' ? targetOrden : targetOrden + 1;
```

**Verificado:** Drag & drop desde paleta inserta bloques exactamente donde el usuario los suelta.

### Fase 2: Funcionalidades Avanzadas (Pendientes)

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| Widget de Citas | Alta | Calendario disponibilidad real - **Diferenciador único** |
| Subdominio nexo.site | Alta | URLs profesionales automáticas |
| Integraciones (GA4, WA) | Media | Scripts externos inyectados |
| Dominio Personalizado | Media | SSL automático con Let's Encrypt |

### Fase 3: E-Commerce y Chat (Futuro)

- Carrito + checkout integrado con facturación
- Chat en vivo con WebSocket
- Multi-idioma con DeepL

### Archivos Clave del Módulo

| Archivo | Propósito |
|---------|-----------|
| `WebsiteEditorPage.jsx` | Página principal del editor WYSIWYG |
| `DndEditorProvider.jsx` | Contexto DnD para drag & drop |
| `EditorCanvas.jsx` | Canvas donde se renderizan bloques |
| `BlockPalette.jsx` | Paleta de bloques arrastrables |
| `bloques.model.js` | CRUD de bloques con shift de orden |

---

## PARTE 8: Dogfooding y Arquitectura Multi-Tenant de Pagos - 🔍 PRÓXIMO PASO

### Contexto

Nexo es un SaaS multi-tenant donde:
1. **Nexo Team (org_id=1)** vende suscripciones a otras organizaciones
2. **Las organizaciones clientes** pueden a su vez vender suscripciones a SUS clientes

### Preguntas Pendientes de Validar

#### A) Dogfooding - ¿Nexo usa su propio sistema?

| Pregunta | Estado | Acción |
|----------|--------|--------|
| ¿Nexo Team tiene planes configurados en `planes_suscripcion_org`? | ✅ Sí | Plan Pro, Plan Trial |
| ¿La página `/planes` muestra planes de Nexo Team? | ✅ Sí | Validado |
| ¿El checkout usa credenciales de Nexo en MercadoPago? | ❓ Verificar | Ver configuración |

#### B) Configuración de Planes por Organización

| Pregunta | Estado | Acción |
|----------|--------|--------|
| ¿Cada org puede crear sus propios planes? | ❓ Verificar | Revisar modelo y UI |
| ¿El formulario `PlanFormDrawer` permite todos los períodos? | ⚠️ Limitado | Solo un precio/ciclo |
| ¿La tabla `planes_suscripcion_org` tiene RLS correcto? | ❓ Verificar | Solo ver planes de tu org |

#### C) Credenciales de Pago Multi-Tenant

| Pregunta | Estado | Acción |
|----------|--------|--------|
| ¿Dónde se configuran las credenciales de MercadoPago por org? | ❓ Verificar | ¿Tabla `conectores_pago`? |
| ¿Cada org puede conectar su propia cuenta de MP? | ❓ Verificar | OAuth o credenciales |
| ¿Los pagos van a la cuenta correcta según la org? | ❓ **CRÍTICO** | Validar flujo de checkout |

#### D) Flujo de Checkout - ¿A quién le pagan?

```
Usuario → Selecciona Plan → Checkout → ¿MercadoPago de quién?
                                        │
                                        ├── Si plan de Nexo Team → MP de Nexo
                                        └── Si plan de Org Cliente → MP del Cliente
```

| Pregunta | Estado | Acción |
|----------|--------|--------|
| ¿El checkout detecta de qué org es el plan? | ❓ Verificar | Revisar `checkout.controller.js` |
| ¿Usa las credenciales correctas según el plan? | ❓ **CRÍTICO** | ¿Hardcodeado o dinámico? |
| ¿La org cliente recibe el pago en su cuenta? | ❓ Verificar | Probar con org de prueba |

### Validaciones a Realizar

1. **Revisar tabla de conectores de pago**
   ```sql
   SELECT * FROM conectores_pago_org WHERE tipo = 'mercadopago';
   ```

2. **Verificar cómo el checkout obtiene credenciales**
   - Archivo: `backend/app/modules/suscripciones-negocio/controllers/checkout.controller.js`
   - ¿Lee credenciales de la org del plan o de env vars?

3. **Verificar flujo completo**
   - Crear plan en org de prueba
   - Hacer checkout como cliente
   - Verificar que el pago va a la cuenta correcta

4. **Revisar formulario de planes**
   - ¿Permite configurar precio_mensual, precio_trimestral, precio_anual?
   - Si no, ¿se necesita actualizar el `PlanFormDrawer`?

### Archivos a Revisar

| Archivo | Qué buscar |
|---------|------------|
| `conectores.model.js` | Cómo se guardan credenciales MP |
| `checkout.controller.js` | Cómo selecciona credenciales según org |
| `mercadopago.service.js` | Si usa credenciales dinámicas o hardcodeadas |
| `PlanFormDrawer.jsx` | Si permite configurar múltiples precios |

### Resultado Esperado

Al completar esta validación:
- [ ] Documentar arquitectura de pagos multi-tenant
- [ ] Confirmar que cada org puede tener sus propias credenciales MP
- [ ] Confirmar que los pagos van a la cuenta correcta
- [ ] Actualizar formulario de planes si es necesario
- [ ] Documentar proceso para que un cliente configure sus pagos
