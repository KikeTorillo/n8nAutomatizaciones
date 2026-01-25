# Plan: Validación Integral del Sistema

**Última Actualización:** 25 Enero 2026
**Estado:** 🔄 En Progreso

---

## Objetivo

Validar dos subsistemas críticos de Nexo:

1. **Módulo de Suscripciones** - Dogfooding interno (Nexo como vendor)
2. **Sistema de Roles y Permisos** - RBAC dinámico con jerarquías

---

## PARTE 1: Suscripciones (Dogfooding)

### Arquitectura

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

### Pruebas E2E Completadas (25 Ene 2026)

| Flujo | Resultado | Notas |
|-------|-----------|-------|
| Checkout Plan Pro | ✅ | Operación MP 143417969768 |
| Webhook subscription_preapproval | ✅ | Activa suscripción + actualiza org |
| Cancelación con motivo | ✅ | Drawer funciona, motivo guardado en BD |
| Grace Period (banner) | ✅ | "Acceso limitado - X días para renovar" |
| Suspensión (redirect) | ✅ | Redirige automáticamente a /planes |

### Sistema de Restricción por Estado

| Estado | Acceso | Comportamiento |
|--------|--------|----------------|
| `trial`, `activa`, `pendiente_pago` | Completo | Todas las operaciones |
| `grace_period`, `vencida` | Limitado | Solo GET, banner naranja |
| `suspendida`, `cancelada` | Bloqueado | Redirect a /planes |

**Bypasses:** org_id=1, nivel_jerarquia>=100, rutas exentas

### Pendientes Suscripciones

| Prioridad | Feature | Estado |
|-----------|---------|--------|
| Alta | UX de /planes (landing vs sesión) | Pendiente |
| Alta | Middleware suscripción en TODAS las rutas | Pendiente |
| Media | Dunning emails (recordatorios pago) | Pendiente |
| Media | Prorrateo en cambios de plan | Pendiente |
| Baja | Grace period configurable | Pendiente |

---

## PARTE 2: Sistema de Roles y Permisos

### Arquitectura de Jerarquías

```
┌─────────┬────────────────────┬───────────────────────────────────────┐
│ Nivel   │ Rol Default        │ Capacidades                           │
├─────────┼────────────────────┼───────────────────────────────────────┤
│ 100     │ super_admin        │ Acceso TOTAL, bypass RLS, cross-org   │
│ 90      │ admin              │ Gestión completa de la organización   │
│ 80      │ propietario        │ Operaciones completas del negocio     │
│ 50-79   │ (personalizado)    │ Gerentes, supervisores                │
│ 10      │ empleado           │ Operaciones básicas                   │
│ 5       │ cliente            │ Autoservicio (ver sus datos)          │
│ 1       │ bot                │ Automatizaciones con permisos mínimos │
└─────────┴────────────────────┴───────────────────────────────────────┘
```

### Reglas del Sistema

1. **Protección jerárquica:** Solo puedes gestionar usuarios con nivel inferior al tuyo
2. **Bypass de permisos:** Solo `super_admin` (nivel 100) tiene `bypass_permisos = TRUE`
3. **Permisos automáticos:** Al crear un rol, se asignan permisos default según nivel
4. **Roles por organización:** Cada org tiene sus propios roles (excepto `super_admin`, `bot`)

### Estado Actual (25 Ene 2026)

| Componente | Estado | Notas |
|------------|--------|-------|
| Tabla `roles` | ✅ | Migración completada, ENUM eliminado |
| `RolHelper.js` | ✅ | Funciones de verificación jerárquica |
| API `/api/v1/roles` | ✅ | CRUD completo + permisos |
| API `/api/v1/roles/:id/permisos` | ✅ | GET y PUT funcionando |
| Frontend `RolesPage` | ✅ | CRUD de roles, copiar permisos |
| Frontend `PermisosPage` | ✅ | Migrado a roles dinámicos |
| Navegación a Roles | ✅ | Agregado en hub de Configuración |

### Roles Actuales en BD

**Nexo Team (org 1):**
| ID | Código | Nivel | Usuarios |
|----|--------|-------|----------|
| 4 | admin | 90 | 0 |
| 5 | propietario | 80 | 1 |
| 20 | gerente_ventas | 50 | 0 |
| 6 | empleado | 10 | 0 |
| 7 | cliente | 5 | 0 |

**Nexo Test (org 2):**
| ID | Código | Nivel | Usuarios |
|----|--------|-------|----------|
| 12 | admin | 90 | 0 |
| 13 | propietario | 80 | 1 |
| 14 | empleado | 10 | 0 |
| 15 | cliente | 5 | 0 |

---

## PLAN DE PRUEBAS: Roles y Permisos

### Objetivo
Validar el flujo completo de creación de usuario profesional con rol personalizado y verificar que los permisos funcionan correctamente.

### Pre-requisitos
- [x] Sistema de roles dinámicos implementado
- [x] PermisosPage migrado a roles dinámicos
- [x] APIs de roles y permisos funcionando
- [ ] Usuario de prueba creado

### Caso de Prueba 1: Crear Rol Personalizado

**Pasos:**
1. Ir a `/configuracion/roles`
2. Crear rol "Recepcionista" con:
   - Código: `recepcionista`
   - Nivel: 30
   - Color: Verde (#22C55E)
   - Icono: `user-check`
3. Verificar que aparece en la lista
4. Verificar en BD:
   ```sql
   SELECT * FROM roles WHERE codigo = 'recepcionista' AND organizacion_id = 2;
   ```

**Resultado esperado:** Rol creado con permisos default de nivel 30

### Caso de Prueba 2: Configurar Permisos del Rol

**Pasos:**
1. Ir a `/configuracion/permisos`
2. Seleccionar rol "Recepcionista"
3. Habilitar permisos específicos:
   - ✅ acceso.agendamiento
   - ✅ acceso.clientes
   - ✅ citas.ver
   - ✅ citas.crear
   - ✅ clientes.ver
   - ❌ clientes.crear (solo ver)
   - ❌ acceso.inventario
   - ❌ acceso.configuracion
4. Verificar en BD:
   ```sql
   SELECT pc.codigo, pr.valor
   FROM permisos_rol pr
   JOIN permisos_catalogo pc ON pc.id = pr.permiso_id
   WHERE pr.rol_id = (SELECT id FROM roles WHERE codigo = 'recepcionista' AND organizacion_id = 2);
   ```

**Resultado esperado:** Permisos guardados correctamente

### Caso de Prueba 3: Crear Profesional con Rol

**Pasos:**
1. Ir a `/profesionales`
2. Crear nuevo profesional:
   - Nombre: "María García"
   - Email: test_recepcionista@nexo.test
   - Rol: Recepcionista
   - Departamento: Recepción
3. Verificar que se crea el usuario con rol_id correcto
4. Verificar en BD:
   ```sql
   SELECT u.email, u.nombre, r.codigo as rol, r.nivel_jerarquia
   FROM usuarios u
   JOIN roles r ON r.id = u.rol_id
   WHERE u.email = 'test_recepcionista@nexo.test';
   ```

**Resultado esperado:** Usuario creado con rol `recepcionista`

### Caso de Prueba 4: Validar Restricciones de Acceso

**Pasos:**
1. Cerrar sesión
2. Iniciar sesión como `test_recepcionista@nexo.test`
3. Verificar acceso:
   - ✅ Puede ver `/agendamiento`
   - ✅ Puede ver `/clientes`
   - ✅ Puede crear citas
   - ❌ NO puede crear clientes (solo ver)
   - ❌ NO puede acceder a `/inventario`
   - ❌ NO puede acceder a `/configuracion`
4. Intentar operaciones prohibidas vía API directa

**Resultado esperado:** Middleware de permisos bloquea acceso no autorizado

### Caso de Prueba 5: Editar Permisos y Verificar Cambio

**Pasos:**
1. Iniciar sesión como propietario
2. Ir a `/configuracion/permisos`
3. Seleccionar "Recepcionista"
4. Habilitar `clientes.crear`
5. Iniciar sesión como recepcionista
6. Verificar que ahora SÍ puede crear clientes

**Resultado esperado:** Cambios de permisos se aplican inmediatamente

### Caso de Prueba 6: Protección Jerárquica

**Pasos:**
1. Iniciar sesión como recepcionista (nivel 30)
2. Intentar acceder a `/configuracion/roles`
3. Intentar acceder a `/configuracion/permisos`
4. Intentar editar un usuario con nivel mayor

**Resultado esperado:**
- NO puede acceder a configuración de roles/permisos
- NO puede editar usuarios de nivel superior

---

## Cuentas de Prueba

### Nexo
| Rol | Email | Password | Org |
|-----|-------|----------|-----|
| SuperAdmin | arellanestorillo@yahoo.com | Enrique23 | Nexo Team (1) |
| Propietario | arellanestorillo@gmail.com | Enrique23 | Nexo Test (2) |
| Recepcionista | (por crear) | (por crear) | Nexo Test (2) |

### MercadoPago México (Sandbox)
| Rol | User ID | Password |
|-----|---------|----------|
| Vendedor | TESTUSER8490440797252778890 | `GBpO6sgCkn` |
| Comprador | TESTUSER2716725750605322996 | `UCgyF4L44D` |

**Tarjeta Test:** 5031 7557 3453 0604 | CVV: 123 (aprobado) / 111 (rechazado) | Venc: 11/25

---

## Bugs Corregidos

### 25 Enero 2026

| Bug | Causa | Solución |
|-----|-------|----------|
| PermisosPage mostraba roles hardcodeados | Lista estática en el código | Migrado a `useRoles()` dinámico |
| Grace period redirigía a /planes | `buscarActivaPorOrganizacion()` no incluía `grace_period` | Agregar a lista de estados válidos |
| Error 403 en /clientes/estadisticas | `auth.requireRole` usaba `organizacion_admin` | Cambiar por `propietario` |
| Roles link no aparecía en Configuración | Faltaba entrada en `secciones` | Agregado con icono `UserCog` |

---

## Archivos Clave

### Suscripciones
| Archivo | Propósito |
|---------|-----------|
| `suscripcionActiva.js` | Middleware restricción acceso |
| `SubscriptionGuard.jsx` | Guard frontend + banner |
| `suscripciones.model.js` | Estados, búsquedas |

### Roles y Permisos
| Archivo | Propósito |
|---------|-----------|
| `RolHelper.js` | Verificaciones jerárquicas |
| `roles.controller.js` | CRUD roles + permisos |
| `RolesPage.jsx` | UI gestión de roles |
| `PermisosPage.jsx` | UI permisos por rol |
| `16-tabla-roles.sql` | Schema y triggers |

---

## Checklist Final

### Suscripciones
- [x] Checkout E2E
- [x] Webhooks MercadoPago
- [x] Grace period
- [x] Cancelación con motivo
- [ ] UX /planes para landing
- [ ] Dunning emails

### Roles y Permisos
- [x] Tabla roles dinámica
- [x] API CRUD roles
- [x] API permisos por rol
- [x] Frontend RolesPage
- [x] Frontend PermisosPage dinámico
- [ ] Crear rol personalizado (prueba)
- [ ] Crear usuario con rol (prueba)
- [ ] Validar restricciones de acceso (prueba)
- [ ] Protección jerárquica (prueba)

---

## Referencias

- [Odoo Subscriptions](https://www.odoo.com/app/subscriptions-features)
- [MercadoPago Test Users](https://www.mercadopago.com.mx/developers/panel/app)
- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)
