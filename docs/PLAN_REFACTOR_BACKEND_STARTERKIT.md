# 🔧 Plan de Refactor: Backend para SaaS Starter Kit

**Última actualización:** 19 Noviembre 2025 - 21:30 CST
**Estado:** ✅ Nivel 7 COMPLETADO (85% del refactor total)

---

## 🎯 Objetivo

Separar código **CORE** (reutilizable) de código **TEMPLATE** (específico de agendamiento) mediante refactor incremental.

---

## 📊 Progreso Global

| Nivel | Archivos | Estado |
|-------|----------|--------|
| 1. Utils | 1/1 | ✅ Completado |
| 2. Constants | 1/1 | ✅ Completado |
| 3. Constants | N/A | ❌ Omitido (no existen) |
| 4. Schemas | 12/12 | ✅ Completado |
| 5. Routes | 12/12 | ✅ Completado |
| 6. Controllers | 12/12 | ✅ Completado |
| 7. Models | 10/10 | ✅ Completado |
| 8. Módulos Ambiguos | 0/5 | ⏳ Pendiente |

**Sistema:** Backend ✅ Healthy | Tests: 561/630 (89.0%) | Docker: 8 contenedores operativos

---

## 🗂 Estructura Actual

```
backend/app/
├── [CORE - Universal]
│   ├── middleware/        # Auth, tenant, validation, rateLimit
│   ├── utils/             # rlsContextManager, helpers, passwordHelper
│   ├── services/          # Mercado Pago, email, n8n
│   ├── schemas/           # auth, organizacion, pagos, usuario (4)
│   ├── controllers/       # auth, usuario, plan, superadmin, webhook, pagos (8)
│   └── database/          # organizacion, usuario, plan, subscripcion, pago (5)
│
└── templates/scheduling-saas/   ✅ Migración completa
    ├── utils/                   # cita-validacion.util.js
    ├── constants/               # profesionales.constants.js
    ├── schemas/                 # 12 schemas
    ├── routes/api/v1/           # 12 routes
    ├── controllers/             # 12 controllers (9 + 3 carpetas modulares)
    └── models/                  # 10 models (7 + 3 carpetas modulares)
```

**CORE permanece (mínimo universal):**
- 6 middleware, 3 utils, 9 services, 4 schemas, 8 controllers, 5 models

**TEMPLATE migrado (100% agendamiento):**
- 1 util, 1 constant, 12 schemas, 12 routes, 12 controllers, 10 models

---

## ⚠️ Nivel 8 - Módulos Ambiguos (Pendientes)

Archivos CORE con lógica específica de agendamiento que requieren refactor:

| Módulo | Problema | Acción Requerida |
|--------|----------|------------------|
| `middleware/subscription.js` | Valida límites hardcodeados: `profesionales`, `servicios`, `citas_mes` | Mover a template o generalizar |
| `organizacion.controller.js` | Método `obtenerProgresoSetup()` consulta tablas de agendamiento | Extraer método a template |
| `chatbot.controller.js` + `n8nMcpCredentialsService.js` | System prompt y MCP tools específicos (`verificarDisponibilidad`, `crearCita`) | Mover a template |
| `organizacion.constants.js` | `SELECT_FIELDS` incluye `configuracion_categoria` | Revisar dependencias |

**Nota:** `marketplace/` ya fue migrado a template en Nivel 6 y 7.

---

## 📝 Patrones de Migración Validados

### Patrón General (Niveles 4-7)

1. **Identificar imports:** `grep -rn "archivo.js" backend/app/`
2. **Mover archivo:** `mv database/archivo.js templates/scheduling-saas/models/`
3. **Actualizar imports externos:** Archivo movido cambia `../../` → `../../../../`
4. **Actualizar imports consumidores:** Routes/controllers cambian `../../../database/` → `../../../templates/.../models/`
5. **Reiniciar y validar:** `docker restart back && sleep 30 && curl http://localhost:3000/health`
6. **Commit individual:** Mensaje descriptivo con número de nivel

### Patrón Específico Models (Nivel 7)

**Models individuales:**
1. Actualizar `database/index.js` **PRIMERO** con nueva ruta template
2. Mover archivo
3. Actualizar imports externos: `../../` → `../../../../`
4. Actualizar controllers: `../../../database/` → `../../models/`

**Carpetas modulares (citas/, comisiones/, marketplace/):**
1. Analizar TODOS los imports: `grep -h "^const.*require" *.js | sort -u`
2. Identificar 5 tipos:
   - Config/database externos
   - Utils CORE (logger, helpers, RLS)
   - **Utils TEMPLATE** (ej: CitaValidacionUtil) - ⚠️ Cambiar ruta relativa
   - Internos carpeta (mantener `./`)
   - Models externos (profesional, servicio)
3. Mover carpeta completa
4. Actualizar todos los imports

---

## ⚠️ Lecciones Críticas

### Conteo de Niveles de Rutas Relativas

| Desde | Hasta | Niveles | Ejemplo |
|-------|-------|---------|---------|
| `routes/api/v1/index.js` | `templates/` | 3 arriba | `../../../templates/` |
| `templates/.../schemas/` | CORE `middleware/` | 3 arriba | `../../../middleware/` |
| `templates/.../controllers/` regulares | CORE utils | 3 arriba | `../../../utils/` |
| `templates/.../controllers/subcarpeta/` | CORE utils | **4 arriba** | `../../../../utils/` |
| `templates/.../models/` regulares | CORE utils | **4 arriba** | `../../../../utils/` |
| `templates/.../models/subcarpeta/` | CORE utils | **4 arriba** | `../../../../utils/` |

**❌ ERROR COMÚN:** Usar `../../` causa "Cannot find module" → crasheo silencioso

### Imports entre Archivos de Template

```javascript
// ❌ ANTES (crashea - ruta absoluta desde CORE):
const CitaValidacionUtil = require('../../templates/scheduling-saas/utils/cita-validacion.util');

// ✅ DESPUÉS (ruta relativa dentro de template):
const CitaValidacionUtil = require('../../utils/cita-validacion.util');
```

**Regla:** Si un archivo en `templates/.../models/` importa otro en `templates/.../utils/`, la ruta es relativa dentro de `templates/scheduling-saas/`, NO desde CORE.

### Validación Obligatoria

1. **Backend container:** `docker ps --filter "name=back" --format "{{.Status}}"` → Must show "healthy"
2. **Health endpoint:** `curl -s http://localhost:3000/health | jq -r '.status'` → Must return "healthy"
3. **Esperar 20-30s** después de `docker restart back` antes de validar

### Checklist Pre-Move (Models)

- [ ] Actualizar `database/index.js` PRIMERO
- [ ] Analizar TODOS los imports (externos + template + internos)
- [ ] Identificar si hay imports de utils template (cambiar ruta)
- [ ] Buscar imports en CORE que referencien el archivo (ej: `superadmin.js`)

---

## 🔧 Comandos Útiles

```bash
# Encontrar imports de un archivo
grep -rn "nombre-archivo.js" backend/app/

# Analizar imports de una carpeta
cd backend/app/database/carpeta/
grep -h "^const.*require" *.js | sort -u

# Actualizar imports externos (models)
sed -i "s|require('../../config/database')|require('../../../../config/database')|g" *.js
sed -i "s|require('../../utils/logger')|require('../../../../utils/logger')|g" *.js
sed -i "s|require('../../utils/helpers')|require('../../../../utils/helpers')|g" *.js
sed -i "s|require('../../utils/rlsContextManager')|require('../../../../utils/rlsContextManager')|g" *.js

# Validar backend
docker restart back && sleep 30
docker ps --filter "name=back" --format "{{.Status}}"
curl -s http://localhost:3000/health | jq -r '.status'

# Tests
docker exec back npm test
docker exec back npm test -- nombre-modulo
```

---

## ✅ Criterios de Éxito

**CORE desacoplado cuando:**
- ❌ No menciona conceptos de dominio específicos
- ✅ Solo consulta tablas universales: `organizaciones`, `usuarios`, `planes`, `subscripciones`
- ✅ Middleware y utils sin lógica de negocio

**TEMPLATE aislado cuando:**
- ✅ Toda la lógica de dominio está en `templates/scheduling-saas/`
- ✅ Puede copiarse a otro proyecto SaaS sin modificar CORE
- ✅ Define sus propios seeds SQL en `sql/templates/scheduling-saas/`

---

## 📌 Próximos Pasos

1. **Nivel 8:** Refactorizar módulos ambiguos (5 pendientes)
2. **Validación final:** Ejecutar suite completa de tests
3. **Documentación:** Guía de uso del starter kit para nuevos proyectos
