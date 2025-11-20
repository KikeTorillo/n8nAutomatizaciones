# 🔧 Plan de Refactor: Backend para SaaS Starter Kit

**Última actualización:** 20 Noviembre 2025 - 00:15 CST
**Estado:** ✅ Nivel 8.1 COMPLETADO | 🔄 Nivel 9 - Access Control Layer (SIGUIENTE)

---

## 🎯 Objetivo

Crear un **CORE 100% reutilizable** que soporte múltiples modelos de negocio (suscripciones, pago único, créditos, freemium).

---

## 📊 Progreso Global

| Nivel | Descripción | Estado |
|-------|-------------|--------|
| 1-7 | Utils, Constants, Schemas, Routes, Controllers, Models | ✅ Completado (71 archivos migrados) |
| 8.1 | Nomenclatura `database/` → `models/` | ✅ Completado (15 archivos) |
| 8.2 | Módulos legacy | ⏸️ **Pospuesto** (ver Nivel 9) |
| **9** | **Access Control Layer** | ⏳ **0/4 componentes** |

**Sistema:** ✅ Backend healthy | ⚠️ Tests: 534/600 (pospuestos) | 🐳 8 contenedores up

---

## 🗂 Estructura Objetivo

```
backend/app/
├── [CORE - Agnóstico de negocio]
│   ├── middleware/
│   │   ├── access-control.js         ✅ NUEVO - Strategy pattern
│   │   ├── auth.js
│   │   └── tenant.js
│   │
│   ├── models/
│   │   ├── planes.model.js           🔄 REFACTOR - JSONB config
│   │   ├── access-rules.model.js     ✅ NUEVO - Abstracción
│   │   └── organizacion.model.js     🔄 REFACTOR - Sin setup
│   │
│   └── services/
│       └── payment-gateway.service.js ✅ NUEVO - Agnóstico MP
│
└── [TEMPLATES - Lógica de negocio]
    ├── scheduling-saas/
    │   ├── config/
    │   │   └── access-rules.config.js  ✅ NUEVO - Strategy impl
    │   ├── middleware/
    │   │   └── subscription.js         ⬅️ MOVIDO desde CORE
    │   ├── models/
    │   │   ├── subscripcion.model.js   ⬅️ MOVIDO desde CORE
    │   │   └── setup-progress.model.js ✅ NUEVO - Setup checklist
    │   └── services/
    │       └── n8nMcp.service.js       ⬅️ MOVIDO desde CORE
    │
    └── invitaciones-digitales/          🆕 FUTURO PROYECTO
        ├── config/
        │   └── access-rules.config.js  ✅ Modelo: pago único
        ├── models/
        │   └── paquetes.model.js       ✅ Créditos/límites
        └── schemas/
            └── invitacion.schemas.js
```

---

## 🎯 Nivel 9 - Access Control Layer (SIGUIENTE)

### Problema Identificado

**Acoplamiento crítico:** El sistema actual asume **suscripciones recurrentes** en el CORE.

```javascript
// ❌ CORE actual (middleware/subscription.js):
if (subscription.estado === 'trial')...      // Específico de SaaS recurrente
if (subscription.estado === 'morosa')...     // No aplica a pago único
const tiposValidos = ['profesionales', 'servicios', 'citas_mes']; // Hardcoded
```

**Impacto:** Imposible reutilizar CORE para:
- Invitaciones digitales (pago único)
- E-commerce (freemium)
- Analytics (pay-per-use)

### Solución: Strategy Pattern

Crear capa de abstracción que permita a cada template definir su modelo de negocio.

| # | Componente | Descripción | Effort |
|---|------------|-------------|--------|
| 1 | `access-control.js` (CORE) | Middleware genérico con dependency injection | 4-5h |
| 2 | `planes.model.js` (CORE) | Refactor tabla con config JSONB flexible | 3-4h |
| 3 | `access-rules.config.js` (Template) | Strategy impl para suscripciones | 2-3h |
| 4 | Schema BD refactor | Tabla `planes` genérica (desde cero) | 2-3h |

**Total estimado:** 11-15 horas desarrollo

---

## 📝 Diseño del Access Control Layer

### 1. Middleware CORE: `access-control.js`

```javascript
class AccessControlMiddleware {
  // Factory que acepta estrategia del template
  static checkAccess(accessStrategy) {
    return async (req, res, next) => {
      const hasAccess = await accessStrategy.verifyAccess(organizacionId);

      if (!hasAccess.granted) {
        return ResponseHelper.error(res, hasAccess.message, 403, {
          codigo_error: hasAccess.errorCode,
          accion_requerida: hasAccess.action
        });
      }

      req.access = hasAccess.data;
      next();
    };
  }

  // Factory para límites de recursos
  static checkResourceLimit(resourceType, limitStrategy) {
    return async (req, res, next) => {
      const canCreate = await limitStrategy.checkLimit(
        organizacionId,
        resourceType,
        quantity
      );

      if (!canCreate.allowed) {
        return ResponseHelper.error(res, canCreate.message, 403, {
          limite: canCreate.limit,
          uso_actual: canCreate.currentUsage
        });
      }

      next();
    };
  }
}
```

### 2. Template Strategy: `access-rules.config.js`

```javascript
// Agendamiento SaaS (suscripciones recurrentes)
class SubscriptionAccessStrategy {
  async verifyAccess(orgId) {
    const sub = await SubscripcionModel.obtenerActivo(orgId);

    if (!sub) return { granted: false, message: '...', errorCode: 'NO_SUBSCRIPTION' };
    if (sub.estado === 'trial' && trialExpirado) return { granted: false, ... };

    return { granted: true, data: { plan: sub.codigo_plan } };
  }
}

// Invitaciones (pago único)
class PackageAccessStrategy {
  async verifyAccess(orgId) {
    const pkg = await PaqueteModel.obtenerActivo(orgId);

    if (!pkg) return { granted: false, message: 'Sin paquete activo', ... };

    return { granted: true, data: { creditos: pkg.creditos_restantes } };
  }
}
```

### 3. Schema BD Genérico (Desde Cero)

```sql
CREATE TABLE planes (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  nombre VARCHAR(100),
  modelo_negocio VARCHAR(20), -- 'subscription', 'one_time', 'credits'
  configuracion JSONB,        -- Límites y precios flexibles
  activo BOOLEAN DEFAULT true
);

-- Ejemplo config para agendamiento:
{
  "limites": { "profesionales": 10, "servicios": 50, "citas_mes": 500 },
  "precio_mensual": 99.00,
  "trial_dias": 14
}

-- Ejemplo config para invitaciones:
{
  "limites": { "invitaciones": 100, "diseños": 10, "almacenamiento_mb": 500 },
  "precio_unico": 49.00,
  "creditos_incluidos": 100
}
```

---

## 🎯 Plan de Ejecución - Nivel 9

### Fase 1: CORE genérico (Días 1-3)
```
Día 1:   📦 Crear access-control.js con Strategy pattern
Día 2:   📦 Crear access-rules.model.js para helpers
Día 3:   🗄️ Diseñar schema BD planes genérico (sin migrar)
```

### Fase 2: Template agendamiento (Días 4-5)
```
Día 4:   ⬅️ Mover subscription.js/model a templates/
Día 5:   📝 Crear access-rules.config.js con strategies
```

### Fase 3: Refactor organizacion.model.js (Día 6)
```
Día 6:   🔧 Extraer obtenerProgresoSetup() → templates/
```

### Fase 4: Validación (Días 7-8)
```
Día 7:   🧪 Adaptar routes a nuevo middleware
Día 8:   ✅ Pruebas manuales + documentación
```

---

## ✅ Criterios de Éxito - Nivel 9

**CORE 100% agnóstico:**
- ✅ Middleware `access-control.js` funciona con Strategy pattern
- ✅ Tabla `planes` con JSONB soporta múltiples modelos de negocio
- ✅ Sin referencias hardcodeadas a: `profesionales`, `servicios`, `citas_mes`
- ✅ Middleware sin lógica de trial/morosa/suspendida

**TEMPLATE portable:**
- ✅ `subscription.js` movido completamente a template
- ✅ `access-rules.config.js` implementa estrategias propias
- ✅ Puede crear template `invitaciones-digitales` sin tocar CORE

**Validación práctica:**
- ✅ Route de agendamiento usa nuevo middleware
- ✅ Backend healthy post-refactor
- ✅ CORE puede reutilizarse para invitaciones

---

## 📋 Checklist Nivel 9

**CORE:**
- [ ] `middleware/access-control.js` creado
- [ ] `models/access-rules.model.js` creado (helpers)
- [ ] `models/planes.model.js` refactorizado (JSONB)
- [ ] Schema BD `planes` genérico diseñado

**Template Agendamiento:**
- [ ] `middleware/subscription.js` movido desde CORE
- [ ] `models/subscripcion.model.js` movido desde CORE
- [ ] `config/access-rules.config.js` creado
- [ ] `models/setup-progress.model.js` creado
- [ ] `services/n8nMcp.service.js` movido desde CORE

**Validación:**
- [ ] Routes adaptadas al nuevo middleware
- [ ] Backend healthy
- [ ] Documentación del patrón
- [ ] Commit: `refactor(nivel-9): Access Control Layer agnóstico`

---

## 🚀 Notas Importantes

**⚠️ Proyecto desde cero:**
- NO requiere migraciones de BD
- Schema BD se creará desde cero con estructura genérica
- Datos de prueba pueden regenerarse

**⚠️ Tests pospuestos:**
- 66 tests fallando se resolverán después
- Prioridad: Desacoplar CORE primero
- Tests se actualizarán al final del refactor

**📝 Próximo proyecto:**
- Template `invitaciones-digitales` será primer caso de uso
- Validará que CORE es 100% reutilizable
- Modelo: Pago único + créditos (sin suscripciones)
