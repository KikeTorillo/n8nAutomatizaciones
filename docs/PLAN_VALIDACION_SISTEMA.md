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
| **Jobs Automáticos** | ✅ Implementado | Validar ejecución en producción |
| **Website Builder** | 🔄 En Progreso | Ver Fase 1 abajo |

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
| **Alta** | Definir UX de `/planes` (landing vs app) |
| **Media** | Prorrateo en cambios de plan |
| **Baja** | 2FA/MFA |

### Recientemente Completados ✅

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
