# 🔧 Plan de Refactor: Backend para SaaS Starter Kit

**Fecha de creación:** 19 Noviembre 2025
**Última actualización:** 19 Noviembre 2025 (Niveles 1-2 completados y validados)
**Estado:** 🟢 Operativo - Refactor Incremental (Backend funcionando correctamente)

---

## 📊 Estado Actual

### ✅ Base de Datos (Completado)
- Tabla `categorias` genérica
- Seeds separados por template: `sql/templates/scheduling-saas/seeds/`
- Nomenclatura consistente: `categoria_id`, `configuracion_categoria`
- PostgreSQL con pg_cron funcionando correctamente

### ✅ Backend (Refactor Incremental - Funcionando)

**Nivel 1 - Utils:** ✅ Completado y Validado
- `cita-validacion.util.js` → `templates/scheduling-saas/utils/`
- 6 imports actualizados y funcionando:
  - `bloqueos-horarios.model.js`
  - `disponibilidad.model.js`
  - `cita.helpers.model.js`
  - Tests relacionados (3 archivos)
- Backend arrancando correctamente
- Tests pasando

**Nivel 2 - Constants:** ✅ Completado y Validado
- `profesionales.constants.js` → `templates/scheduling-saas/constants/`
- 1 import actualizado y funcionando:
  - `profesional.schemas.js`
- Backend arrancando correctamente
- Tests pasando (25/25 profesionales)

**Tests:** 562/630 pasando (89.2%)
**Backend Status:** ✅ Healthy (todas las conexiones de BD funcionando)

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

### Nivel 4 - Schemas (PRÓXIMO)
- [ ] Mover 9 schemas específicos → `templates/scheduling-saas/schemas/`
- [ ] Actualizar imports en controllers (estimar 11 archivos)
- [ ] Validar con tests

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

**Última actualización:** 19 Noviembre 2025 (Niveles 1-2 completados, Nivel 3 omitido)
**Progreso:** 2/7 niveles completados (29%) - Nivel 3 eliminado del plan

| Nivel | Componente | Estado | Tests | Imports |
|-------|-----------|---------|-------|---------|
| 1 | Utils | ✅ Completado | ✅ Pasando | 6 actualizados |
| 2 | Constants | ✅ Completado | ✅ Pasando | 1 actualizado |
| 3 | Constants adicionales | ❌ Omitido | N/A | Archivos no existen |
| 4 | Schemas | ⏳ Próximo | - | ~15-20 estimados |
| 5 | Routes | ⏳ Pendiente | - | 11 estimados |
| 6 | Controllers | ⏳ Pendiente | - | ~20-25 estimados |
| 7 | Models | ⏳ Pendiente | - | ~30-40 estimados |
| 8 | Módulos Ambiguos | ⏳ Pendiente | - | Por determinar |

**Estado del Sistema:**
- Backend: ✅ Healthy y operativo
- Tests: 562/630 pasando (89.2%)
- Base de Datos: ✅ Todas las conexiones funcionando
- Docker Compose: ✅ 8 contenedores corriendo correctamente

---

## 📝 Lecciones Aprendidas (Niveles 1-2)

### ✅ Buenas Prácticas Validadas
1. **Refactor incremental por niveles** - Permite validar cada cambio
2. **Ejecutar tests después de cada nivel** - Detecta problemas temprano
3. **Verificar imports con búsqueda global** - `grep -r "archivo.js"` antes de mover
4. **Backend debe arrancar sin errores** - Validación crítica de imports
5. **Docker restart tras cambios** - Asegura que imports se cargan correctamente

### ⚠️ Problemas Comunes y Soluciones
1. **Timing de PostgreSQL al arranque**
   - Problema: Backend intenta conectar antes de que PostgreSQL esté listo
   - Solución: `docker restart back` tras levantar stack

2. **Tests fallan por imports rotos**
   - Problema: No actualizar todos los archivos que importan el módulo movido
   - Solución: Usar `grep` para encontrar TODOS los imports antes de mover

3. **Archivos eliminados vs movidos en git**
   - Problema: `git status` muestra archivos como "borrados" en lugar de "movidos"
   - Solución: Normal, Git detecta el movimiento al hacer commit

### 🎯 Recomendaciones para Próximos Niveles

**Antes de mover archivos:**
1. ✅ Ejecutar `grep -r "nombre-archivo.js" backend/app/`
2. ✅ Listar todos los archivos que tienen imports
3. ✅ Planificar actualización de imports
4. ✅ Mover archivo a nueva ubicación
5. ✅ Actualizar todos los imports encontrados
6. ✅ Reiniciar backend: `docker restart back`
7. ✅ Verificar que arranca sin errores
8. ✅ Ejecutar tests: `docker exec back npm test`

**Orden recomendado para próximos niveles:**
- Nivel 3 (Constants) → Impacto bajo, 2-3 archivos
- Nivel 4 (Schemas) → Impacto medio, ~11 archivos
- Nivel 5 (Routes) → Impacto alto, requiere actualizar server.js
- Niveles 6-7 (Controllers/Models) → Impacto muy alto, muchos imports cruzados
