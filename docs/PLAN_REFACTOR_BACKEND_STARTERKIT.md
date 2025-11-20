# 🔧 Plan de Refactor: Backend para SaaS Starter Kit

**Última actualización:** 19 Noviembre 2025 - 23:30 CST
**Estado:** ✅ Nivel 8.1 COMPLETADO | ⏳ Nivel 8.2 en progreso (3 módulos pendientes)

---

## 🎯 Objetivo

Separar código **CORE** (reutilizable) de código **TEMPLATE** (específico de agendamiento).

---

## 📊 Progreso Global

| Nivel | Descripción | Estado |
|-------|-------------|--------|
| 1-7 | Utils, Constants, Schemas, Routes, Controllers, Models | ✅ Completado (71 archivos migrados) |
| 8.1 | Nomenclatura `database/` → `models/` | ✅ Completado (15 archivos) |
| 8.2 | Módulos ambiguos | ⏳ **0/3 pendientes** |

**Sistema:** ✅ Backend healthy | ⚠️ Tests: 534/600 passing (89%) - 66 failing | 🐳 8 contenedores up

---

## 🗂 Estructura Actual

```
backend/app/
├── [CORE] 6 middleware, 3 utils, 9 services, 4 schemas, 8 controllers, 5 models
│   ⚠️ 3 módulos con lógica de agendamiento (ver Nivel 8.2)
│
└── [TEMPLATE] 71 archivos migrados ✅
    1 util, 1 constant, 12 schemas, 12 routes, 12 controllers, 10 models
    ✅ chatbot.controller.js (1,292 líneas - migrado)
```

---

## 🚨 ACCIÓN INMEDIATA: Resolver Tests Fallando

**Problema:** 66 tests fallando (11% del total) post-migración

```bash
# Ejecutar con detalle
docker exec back npm test -- --verbose --detectOpenHandles

# Filtrar errores comunes
docker exec back npm test 2>&1 | grep -E "Cannot find module|FAIL"
```

**Causa probable:** Imports no actualizados tras migración `database/` → `models/`

**Prioridad:** 🔴 **CRÍTICA** - Bloquea validación del refactor

---

## ⏳ Nivel 8.2 - Módulos Ambiguos (3 Pendientes)

| # | Módulo | Problema | Solución | Effort |
|---|--------|----------|----------|--------|
| 1 | `middleware/subscription.js` | Límites hardcodeados: `profesionales`, `servicios`, `citas_mes` | Crear `config/planLimits.config.js` con mapping configurable | 3-4h |
| 2 | `models/organizacion.model.js` | `obtenerProgresoSetup()` consulta tablas de template | Extraer a `templates/.../models/setup-progress.model.js` + Strategy pattern | 2-3h |
| 3 | `services/n8nMcpCredentialsService.js` | System prompt específico de agendamiento | Mover a `templates/.../services/` | 30min |

**Total estimado:** 6-8 horas desarrollo + 2-4 horas testing

---

## 📝 Referencia Rápida

### Rutas Relativas Críticas

| Desde | A CORE utils/middleware | Niveles |
|-------|------------------------|---------|
| `templates/.../schemas/` | `../../../utils/` | 3 |
| `templates/.../controllers/` | `../../../utils/` | 3 |
| `templates/.../models/` | `../../../../utils/` | **4** |
| `templates/.../models/subcarpeta/` | `../../../../utils/` | **4** |

⚠️ **ERROR COMÚN:** Usar `../../` en models causa "Cannot find module"

### Imports dentro de Template

```javascript
// ✅ CORRECTO - Rutas relativas dentro de templates/scheduling-saas/
const CitaValidacionUtil = require('../../utils/cita-validacion.util');
```

### Validación Post-Cambio

```bash
docker restart back && sleep 30
curl -s http://localhost:3000/health | jq -r '.status'  # Debe retornar "healthy"
docker exec back npm test  # Verificar tests
```

---

## 🎯 Plan de Ejecución

### Fase 1: Estabilización (Semana 1)
```
Día 1-2: 🔴 Resolver 66 tests fallando (CRÍTICO)
Día 3-4: 🟠 Refactor subscription.js → config/planLimits.config.js
Día 5:   🟠 Extraer obtenerProgresoSetup() → setup-progress.model.js
```

### Fase 2: Finalización (Semana 2)
```
Día 6:   🟡 Mover n8nMcpCredentialsService.js a templates/
Día 7-8: ✅ Regression testing completo (600 tests al 100%)
Día 9:   📝 Documentar guía de uso del starter kit
Día 10:  🚀 Release v1.0 Backend Starter Kit
```

---

## ✅ Criterios de Éxito Final

**CORE 100% desacoplado:**
- ✅ Solo tablas universales: `organizaciones`, `usuarios`, `planes`, `subscripciones`
- ✅ Sin referencias a: `profesionales`, `servicios`, `citas`, `clientes`
- ✅ Middleware sin lógica de negocio específica

**TEMPLATE 100% portable:**
- ✅ 71 archivos autocontenidos en `templates/scheduling-saas/`
- ✅ Copiable a nuevo proyecto sin modificar CORE
- ✅ 600 tests pasando (100%)

---

## 📋 Checklist Final

- [ ] 600 tests pasando (actualmente 534/600)
- [ ] 0 módulos ambiguos en CORE (actualmente 3)
- [ ] Backend healthy post-refactor
- [ ] Documentación starter kit completada
- [ ] Git tags: `v1.0-core` y `v1.0-template-scheduling`
