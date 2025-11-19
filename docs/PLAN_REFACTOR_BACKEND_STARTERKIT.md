# 🔧 Plan de Refactor: Backend para SaaS Starter Kit

**Fecha de creación:** 19 Noviembre 2025
**Última actualización:** 19 Noviembre 2025 - 21:35 UTC (Nivel 4 en progreso: 3/12 schemas)
**Estado:** 🟢 Operativo - Refactor Incremental en ejecución

---

## 📊 Estado Actual

### ✅ Base de Datos (Completado)
- Tabla `categorias` genérica
- Seeds separados por template: `sql/templates/scheduling-saas/seeds/`
- Nomenclatura consistente: `categoria_id`, `configuracion_categoria`
- PostgreSQL con pg_cron funcionando correctamente

### ✅ Backend - Refactor en Progreso

**Completado:**
- ✅ Nivel 1: Utils (1 archivo)
- ✅ Nivel 2: Constants (1 archivo)
- ❌ Nivel 3: OMITIDO (archivos no existen)
- 🔄 Nivel 4: Schemas (3/12 completados)

**Schemas movidos:**
- ✅ `tipos-bloqueo.schemas.js`
- ✅ `tipos-profesional.schemas.js`
- ✅ `disponibilidad.schemas.js`

**Schemas pendientes (9):**
- `bloqueos-horarios.schemas.js` (6.9K)
- `cliente.schemas.js` (9.9K)
- `chatbot.schemas.js` (11K)
- `profesional.schemas.js` (12K)
- `servicio.schemas.js` (12K)
- `comisiones.schemas.js` (12K)
- `horario-profesional.schemas.js` (13K)
- `cita.schemas.js` (17K) ⚠️
- `marketplace.schemas.js` (17K) ⚠️

**Estado:** Backend ✅ Healthy | Tests: 562/630 (89.2%)

### 🎯 Objetivo

Separar código **CORE** (reutilizable) de código **TEMPLATE** (específico de agendamiento) mediante refactor incremental.

---

## 🗂 Estructura Actual

```
backend/app/
├── [CORE - Universal]
│   ├── middleware/        # Auth, tenant, validation, rateLimit, asyncHandler
│   ├── utils/             # rlsContextManager, helpers, passwordHelper
│   ├── services/          # Mercado Pago, email, n8n, config
│   └── controllers/       # auth, usuario, plan, superadmin, webhook, pagos
│
└── templates/
    └── scheduling-saas/   # ❌ Específico de agendamiento
        ├── constants/
        │   └── profesionales.constants.js    # ✅ Movido (Nivel 2)
        │
        ├── utils/
        │   └── cita-validacion.util.js       # ✅ Movido (Nivel 1)
        │
        └── [Pendientes de mover]
            ├── controllers/  (11 controllers + 3 carpetas modulares)
            ├── models/       (11 models + 3 carpetas modulares)
            ├── schemas/      (9 schemas)
            ├── routes/       (11 routes)
            └── constants/    (2 archivos adicionales)
```

---

## 🔍 Hallazgos de Auditoría

### ✅ CORE - Confirmado Universal

**Middleware:** `auth.js`, `tenant.js`, `rateLimiting.js`, `validation.js`, `asyncHandler.js`, `errorHandler.js`

**Utils:** `rlsContextManager.js`, `helpers.js`, `passwordHelper.js`

**Controllers:** `auth.controller.js`, `usuario.controller.js`, `plan.controller.js`, `webhook.controller.js`, `pagos.controller.js`

**Services:** `mercadopago.service.js`, `emailService.js`, `tokenBlacklistService.js`, `configService.js`

**Models:** `usuario.model.js`, `plan.model.js`, `subscripcion.model.js`, `pago.model.js`

---

### ❌ TEMPLATE - Completamente Específico de Agendamiento

**Controllers:** `citas/`, `profesionales`, `servicios`, `clientes`, `horarios-profesionales`, `bloqueos-horarios`, `disponibilidad`, `comisiones/`, `tipos-profesional`, `tipos-bloqueo`

**Models:** `cita/`, `profesional`, `servicio`, `cliente`, `horarios-profesionales`, `bloqueos-horarios`, `disponibilidad`, `comisiones/`, `tipos-profesional`, `tipos-bloqueo`

**Schemas:** `cita`, `profesional`, `servicio`, `cliente`, `horarios-profesionales`, `bloqueos-horarios`, `disponibilidad`, `comisiones`

**Routes:** `citas.js`, `profesionales.js`, `servicios.js`, `clientes.js`, `horarios-profesionales.js`, `bloqueos-horarios.js`, `disponibilidad.js`, `comisiones.js`, `tipos-profesional.js`, `tipos-bloqueo.js`

**Constants:** `cita.constants.js`, `servicio.constants.js`

**Utils:** ✅ Ya movidos (`cita-validacion.util.js`)

**Constants:** ✅ Ya movidos (`profesionales.constants.js`)

---

### ⚠️ AMBIGUOS - Requieren Refactor

**Evaluación: El plan original subestimó el acoplamiento. Estos módulos tienen lógica hardcodeada específica de agendamiento:**

#### 1. `middleware/subscription.js`
- **Problema:** Validación de límites hardcodeada para agendamiento
- **Código:** Valida `profesionales`, `servicios`, `citas_mes`
- **Conclusión:** ❌ COMPLETAMENTE ESPECÍFICO (no genérico)

#### 2. `organizacion.controller.js` + `organizacion.model.js`
- **Problema:** Método `obtenerProgresoSetup()` con pasos de agendamiento
- **Código:** Queries a tablas `profesionales`, `servicios`, `horarios_profesionales`
- **Conclusión:** ❌ TIENE LÓGICA ESPECÍFICA (mixto)

#### 3. `chatbot.controller.js` + `n8nMcpCredentialsService.js`
- **Problema:** System prompt y MCP tools específicos de agendamiento
- **Código:** Tools como `verificarDisponibilidad`, `crearCita`, `reagendarCita`
- **Conclusión:** ❌ COMPLETAMENTE ESPECÍFICO

#### 4. `marketplace/` (controllers, models, schemas, routes)
- **Problema:** Diseñado para agendamiento (perfiles, reseñas de profesionales)
- **Código:** Tablas `marketplace_perfiles` con campos como `servicios_destacados`
- **Conclusión:** ❌ COMPLETAMENTE ESPECÍFICO

#### 5. `organizacion.constants.js`
- **Problema:** `SELECT_FIELDS` incluye `configuracion_categoria`
- **Conclusión:** ⚠️ Revisar si depende de agendamiento


---

## 📝 Próximos Niveles de Refactor

### Nivel 3 - Constants Restantes ❌ OMITIDO
**Decisión:** Archivos `cita.constants.js` y `servicio.constants.js` no existen.
**Evaluación:** Constantes inline tienen duplicación mínima (2-3 repeticiones) que no justifica extracción.
**Acción:** Saltar directo a Nivel 4.

### Nivel 4 - Schemas (🔄 EN PROGRESO - 3/12)

**Patrón validado:**
1. Buscar imports: `grep -rn "NOMBRE.schemas" backend/app/routes/`
2. Mover archivo a `templates/scheduling-saas/schemas/`
3. Actualizar import en route: `../../../schemas/` → `../../../templates/scheduling-saas/schemas/`
4. **CRÍTICO:** Actualizar imports internos del schema: `../middleware/` → `../../../middleware/`
5. Reiniciar backend: `docker restart back && sleep 20`
6. Verificar healthy: `docker ps | grep back`
7. Commit individual

**⚠️ Lección clave:** Los schemas importan `../middleware/validation` que debe actualizarse desde su nueva ubicación.

### Nivel 5 - Routes
- [ ] Mover 11 routes específicas → `templates/scheduling-saas/routes/api/v1/`
- [ ] Actualizar `server.js` o router principal
- [ ] Validar con tests

### Nivel 6 - Controllers
- [ ] Mover 11 controllers + 3 carpetas modulares → `templates/scheduling-saas/controllers/`
- [ ] Actualizar imports en routes
- [ ] Validar con tests

### Nivel 7 - Models
- [ ] Mover 11 models + 3 carpetas modulares → `templates/scheduling-saas/models/`
- [ ] Actualizar imports en controllers
- [ ] Validar con tests

### Nivel 8 - Módulos Ambiguos (Decisión requerida)
- [ ] `middleware/subscription.js` → Mover o generalizar
- [ ] `organizacion.controller.js` → Extraer método `obtenerProgresoSetup()`
- [ ] `chatbot.controller.js` + MCP → Mover a template
- [ ] `marketplace/` → Mover a template
- [ ] `organizacion.constants.js` → Revisar dependencias

---

## ✅ Criterios de Éxito

**CORE correctamente desacoplado cuando:**
- ❌ No menciona conceptos de dominio: "profesionales", "citas", "servicios"
- ✅ Queries solo a tablas universales: `organizaciones`, `usuarios`, `planes`
- ✅ Middleware y utils sin lógica específica de negocio

**TEMPLATE correctamente aislado cuando:**
- ✅ Toda la lógica de dominio está en `templates/scheduling-saas/`
- ✅ Puede copiarse a otro proyecto sin modificar CORE
- ✅ Define sus propios seeds SQL en `sql/templates/scheduling-saas/`

---

## 🔧 Notas de Implementación

### Patrón de Imports Actualizado
```javascript
// Desde CORE accediendo a TEMPLATE (rutas relativas)
const CitaValidacionUtil = require('../templates/scheduling-saas/utils/cita-validacion.util');
const { LIMITES, FORMAS_PAGO } = require('../templates/scheduling-saas/constants/profesionales.constants');

// Desde TEMPLATE accediendo a CORE
const { ResponseHelper } = require('../../../utils/helpers');
const RLSContextManager = require('../../../utils/rlsContextManager');
```

### Estado de Archivos Movidos
```
✅ templates/scheduling-saas/
   ├── utils/
   │   └── cita-validacion.util.js      # ✅ Movido, 6 imports actualizados
   └── constants/
       └── profesionales.constants.js   # ✅ Movido, 1 import actualizado
```

### Ejecución de Tests
```bash
# SIEMPRE ejecutar dentro del contenedor (DB_HOST=postgres)
docker exec back npm test

# Específico por módulo
docker exec back npm test -- profesionales
```

### Migración Schema tipo_industria → categoria_id
- Test helper actualizado: `createTestOrganizacion()` acepta `categoria_id` o `categoria_codigo`
- Default: `categoria_id = 1` (barbería)
- Impacto: 562/630 tests pasando (89.2%)
- Estado: ✅ Validado y funcionando en producción

---

## 📈 Resumen de Progreso

**Progreso:** ~30% del refactor total | **Backend:** ✅ Operativo

| Nivel | Estado | Archivos |
|-------|--------|----------|
| 1. Utils | ✅ Completado | 1/1 |
| 2. Constants | ✅ Completado | 1/1 |
| 3. Constants | ❌ Omitido | N/A |
| 4. Schemas | 🔄 En Progreso | 3/12 (25%) |
| 5. Routes | ⏳ Pendiente | 0/11 |
| 6. Controllers | ⏳ Pendiente | 0/17 |
| 7. Models | ⏳ Pendiente | 0/17 |
| 8. Ambiguos | ⏳ Pendiente | 0/5 |

**Estado del Sistema:**
- Backend: ✅ Healthy y operativo
- Tests: 562/630 pasando (89.2%)
- Base de Datos: ✅ Todas las conexiones funcionando
- Docker Compose: ✅ 8 contenedores corriendo correctamente

---

## 📝 Lecciones Críticas

### ✅ Patrón de Movimiento Validado
1. `grep -rn "archivo.js" backend/app/` → Encontrar TODOS los imports
2. `mv` archivo a `templates/scheduling-saas/`
3. Actualizar imports en routes/controllers
4. **CRÍTICO:** Actualizar imports internos del archivo movido
5. `docker restart back && sleep 20` → Verificar healthy
6. Commit individual con mensaje descriptivo

### ⚠️ Trampas Comunes
- **Schemas importan `../middleware/validation`** → Debe ser `../../../middleware/validation`
- Git muestra "borrados" pero detecta rename al commit → Normal
- Backend tarda ~20s en arrancar → Esperar antes de verificar
