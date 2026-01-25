# Plan: Validación Integral del Sistema

**Última Actualización:** 25 Enero 2026
**Estado:** 🔄 En Progreso

---

## Resumen Ejecutivo

| Módulo | Estado | Próxima Acción |
|--------|--------|----------------|
| **RBAC (Roles y Permisos)** | ✅ Validado E2E | Pruebas con rol personalizado |
| **Suscripciones** | 🔄 Parcial | **Próxima sesión** |
| **Seguridad (Rate Limiting, Auth)** | ✅ Implementado | Documentado abajo |
| **Suite de Tests** | 📋 Planificados | Se crearán cuando funcionalidad esté estable |

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

## PARTE 3: Seguridad Implementada (Referencia)

> Esta sección documenta las protecciones de seguridad **ya implementadas** en el código.

### 3.1 Rate Limiting

**Archivo:** `backend/app/middleware/rateLimiting.js`

| Tipo | Límite | Ventana | Key Format | Uso |
|------|--------|---------|------------|-----|
| **IP General** | 100 req | 15 min | `rate_limit:ip:{ip}` | Todas las rutas API |
| **Autenticación** | 10 req | 15 min | `rate_limit:auth:{ip}` | Login, registro |
| **Usuario Autenticado** | 1000 req | 15 min | `rate_limit:user:{userId}` | Rutas con sesión |
| **Organización** | 1000 req | 1 hora | `rate_limit:org:{orgId}` | Por tenant |
| **Operaciones Pesadas** | 20 req | 1 hora | `rate_limit:heavy:{userId}` | Reportes, exports |
| **API Pública** | 60 req | 1 min | `rate_limit:api:{key}` | Webhooks |

**Características:**
- Redis (DB 2) para persistencia
- Transacciones atómicas MULTI/EXEC
- Headers estándar: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Fallback en memoria si Redis falla
- IP sanitization contra bypass por inyección

### 3.2 Autenticación JWT

**Archivo:** `backend/app/middleware/auth.js`

| Protección | Implementación |
|------------|----------------|
| **Timing-safe comparisons** | `crypto.timingSafeEqual()` para comparar emails/roles |
| **Token Blacklist** | Redis (DB 3) con TTL automático |
| **Fail-closed** | Si no puede verificar blacklist → 503 |
| **Invalidación por cambio de permisos** | `isUserTokenInvalidated()` verifica `iat` vs timestamp |
| **Validación de sucursal** | Verifica acceso a sucursal del token en DB |
| **RLS cleanup garantizado** | Si falla cleanup → destruye conexión del pool |

**Códigos de error JWT:**
- `TOKEN_EXPIRED` - Token expirado
- `TOKEN_INVALID` - JWT malformado
- `TOKEN_BLACKLISTED` - Invalidado por logout
- `SESSION_INVALIDATED` - Permisos cambiados
- `SUCURSAL_ACCESS_REVOKED` - Acceso a sucursal revocado

### 3.3 HTTP Security Headers

**Archivo:** `backend/app/app.js` (Helmet config)

| Header | Configuración | Propósito |
|--------|---------------|-----------|
| **Content-Security-Policy** | `defaultSrc: 'self'` | Previene XSS |
| **Strict-Transport-Security** | `maxAge: 31536000` (prod) | Fuerza HTTPS |
| **X-Frame-Options** | `DENY` | Previene clickjacking |
| **X-Content-Type-Options** | `noSniff` | Previene MIME sniffing |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Controla referer |
| **X-XSS-Protection** | Enabled | Legacy XSS filter |
| **X-Powered-By** | Hidden | Oculta tecnología |

### 3.4 Webhooks - Idempotencia

**Archivo:** `backend/app/modules/suscripciones-negocio/models/webhooks-procesados.model.js`

| Mecanismo | Descripción |
|-----------|-------------|
| **Tabla `webhooks_procesados`** | Registra cada webhook por `gateway + request_id` |
| **ON CONFLICT DO NOTHING** | Maneja race conditions sin error |
| **Verificación previa** | `yaFueProcesado()` antes de procesar |
| **Campos tracked** | gateway, request_id, event_type, data_id, resultado, ip_origen |
| **Limpieza automática** | `limpiarAntiguos(30)` elimina registros > 30 días |

**Flujo de idempotencia:**
```
1. Recibe webhook con x-request-id
2. Verifica: yaFueProcesado('mercadopago', requestId)?
3. Si ya existe → Retorna 200 (idempotente)
4. Si no existe → Procesa + Registra con resultado
```

---

## PARTE 4: Suite de Tests (Planificación)

> 📋 **Decisión:** Tests eliminados temporalmente. Se crearán cuando la funcionalidad esté estable para evitar retrabajo.

### Tests a Implementar

| Categoría | Archivo | Cobertura |
|-----------|---------|-----------|
| **RBAC** | `__tests__/rbac/permissions.test.js` | Matriz permisos por rol |
| **Security** | `__tests__/security/timing-attack-security.test.js` | Timing attacks |
| **Auth Middleware** | `__tests__/middleware/auth.test.js` | JWT, blacklist |
| **Tenant Middleware** | `__tests__/middleware/tenant.test.js` | Multi-tenant context |
| **RLS** | `__tests__/integration/rls-multi-tenant.test.js` | Aislamiento tenant |
| **Endpoints Auth** | `__tests__/endpoints/auth.test.js` | Login, registro |
| **Endpoints Citas** | `__tests__/endpoints/citas.test.js` | CRUD citas |
| **Endpoints Clientes** | `__tests__/endpoints/clientes.test.js` | CRUD clientes |
| **Endpoints Profesionales** | `__tests__/endpoints/profesionales.test.js` | CRUD profesionales |
| **Endpoints Servicios** | `__tests__/endpoints/servicios.test.js` | CRUD servicios |
| **Endpoints Organizaciones** | `__tests__/endpoints/organizaciones.test.js` | CRUD orgs |
| **Token Blacklist** | `__tests__/services/tokenBlacklistService.test.js` | Redis blacklist |
| **ModuleRegistry** | `__tests__/unit/core/ModuleRegistry.test.js` | Auto-discovery |
| **Onboarding** | `__tests__/integration/onboarding-flow.test.js` | Flujo completo |
| **Walk-in Timezone** | `__tests__/integration/walk-in-timezone.test.js` | Zonas horarias |

### Comandos de Tests (cuando se restauren)

```bash
# Todos los tests
cd backend/app && npm test

# Por categoría
npm test -- --testPathPattern=rbac
npm test -- --testPathPattern=security
npm test -- --testPathPattern=middleware
npm test -- --testPathPattern=integration
npm test -- --testPathPattern=endpoints

# Test específico
npm test -- __tests__/rbac/permissions.test.js
```

---

## PARTE 5: Matriz de Estados de Suscripción

### Diagrama de Transiciones

```
                    ┌──────────────────────────────────────┐
                    │                                      │
                    ▼                                      │
┌─────────┐    ┌─────────┐    ┌────────────────┐    ┌─────────────┐
│  trial  │───►│ activa  │───►│ pendiente_pago │───►│ grace_period│
└─────────┘    └─────────┘    └────────────────┘    └─────────────┘
    │              │                                      │
    │              │                                      │
    ▼              ▼                                      ▼
┌─────────┐    ┌──────────┐                         ┌───────────┐
│ vencida │    │cancelada │◄────────────────────────│ suspendida│
└─────────┘    └──────────┘                         └───────────┘
                    ▲                                      │
                    │                                      │
                    └──────────────────────────────────────┘
```

### Transiciones Válidas

| Estado Origen | Estados Destino |
|---------------|-----------------|
| `trial` | `activa`, `vencida` |
| `activa` | `pendiente_pago`, `cancelada`, `grace_period` |
| `pendiente_pago` | `activa`, `grace_period` |
| `grace_period` | `activa`, `suspendida` |
| `suspendida` | `activa`, `cancelada` |
| `vencida` | (terminal) |
| `cancelada` | (terminal) |

### Acceso por Estado

| Estado | Métodos HTTP | UX en Frontend |
|--------|--------------|----------------|
| `trial` | ✅ Todos | Normal + badge "Trial" |
| `activa` | ✅ Todos | Normal |
| `pendiente_pago` | ✅ Todos | Banner amarillo "Pago pendiente" |
| `grace_period` | ⚠️ Solo GET | Banner rojo urgente |
| `vencida` | ❌ Ninguno | Redirect a `/planes` |
| `suspendida` | ❌ Ninguno | Redirect a `/planes` |
| `cancelada` | ❌ Ninguno | Redirect a `/planes` |

### Bypasses del Middleware de Suscripción

| Condición | Descripción |
|-----------|-------------|
| `organizacion_id === 1` | Nexo Team (vendor) |
| `nivel_jerarquia >= 100` | SuperAdmin |
| Rutas `/auth/*`, `/planes/*`, `/health` | Rutas exentas |

---

## PARTE 6: Pruebas Pendientes (Checklist)

### RBAC - Escenarios Negativos

- [ ] **Escalación de privilegios**: Empleado intenta cambiar su propio `rol_id`
- [ ] **Modificar usuario de nivel superior**: Admin (90) intenta modificar SuperAdmin (100)
- [ ] **Cross-tenant**: Usuario de Org A intenta acceder datos de Org B
- [ ] **Bypass RLS via SQL injection**: Intentar inyectar SQL en parámetros
- [ ] **Token con rol desactualizado**: Cambiar rol en DB, verificar token rechazado

### Seguridad - Escenarios Negativos

- [ ] **Token manipulado**: Modificar payload JWT, verificar rechazo
- [ ] **Token expirado**: Usar token después de expiración
- [ ] **Token blacklisted**: Usar token después de logout
- [ ] **Rate limit auth**: Verificar bloqueo después de 10 intentos de login
- [ ] **Rate limit headers**: Verificar `X-RateLimit-*` en responses
- [ ] **IP spoofing**: Intentar bypass con `X-Forwarded-For` malicioso

### Webhooks - Escenarios Negativos

- [ ] **Webhook duplicado**: Enviar mismo `x-request-id` dos veces, verificar idempotencia
- [ ] **Webhook sin signature**: Enviar sin HMAC, debe rechazar 400
- [ ] **Webhook de otra organización**: Intentar afectar suscripción ajena
- [ ] **Payload malformado**: Enviar JSON inválido

### Suscripciones - Escenarios Negativos

- [ ] **Acceso en `grace_period`**: Intentar POST/PUT/DELETE, debe rechazar
- [ ] **Acceso en `suspendida`**: Cualquier request debe redirigir a /planes
- [ ] **Bypass de middleware**: Verificar que TODAS las rutas pasan por verificación
- [ ] **Trial expirado**: Verificar transición automática a `vencida`

---

## Cuentas de Prueba

### Nexo

| Rol | Email | Password | Org | Nivel |
|-----|-------|----------|-----|-------|
| SuperAdmin | arellanestorillo@yahoo.com | Enrique23 | Nexo Team (1) | 100 |
| Admin | arellanestorillo@gmail.com | Enrique23 | Nexo Test (2) | 90 |
| Empleado | **PENDIENTE CREAR** | - | Nexo Test (2) | 10 |

> **Nota:** Crear usuario empleado para validar restricciones RBAC completas en frontend y backend.

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
5. Ejecutar checklist de pruebas negativas (PARTE 6)
