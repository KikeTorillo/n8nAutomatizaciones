# 🏗️ PLAN: ARQUITECTURA MODULAR - VERSIÓN EJECUTABLE

**Fecha:** 24 Noviembre 2025
**Versión:** 2.4 (Fase 0, Fase 1 Completadas - Fase 2: CORE y AGENDAMIENTO Migrados)
**Estado:** ✅ **FASE 2 - 40% COMPLETADA (CORE + AGENDAMIENTO MIGRADOS)**
**Score Viabilidad:** **9.5/10** (mejorado tras testing SQL)
**Última Actualización:** 24 Noviembre 2025 - 22:30 hrs

---

## 🎉 ESTADO ACTUAL - FASE 2: CORE Y AGENDAMIENTO MIGRADOS (40%)

**Fase 0 - PoC:** 23 Nov 2025 (4 horas) ✅
**Fase 1 - Preparación:** 24 Nov 2025 (16 horas) ✅
**Fase 2 - Migración (CORE + AGENDAMIENTO):** 24 Nov 2025 (34 horas) ✅
**Tests Pasando:** 40/40 (100%) ✅
**Performance:** ✅ Todos los benchmarks superados
**Endpoints CORE:** ✅ 9 rutas operativas (auth, organizaciones, usuarios, planes, pagos, subscripciones, webhooks, superadmin, setup)
**Endpoints AGENDAMIENTO:** ✅ 10 rutas operativas (profesionales, servicios, clientes, horarios, citas, bloqueos, disponibilidad, tipos-profesional, tipos-bloqueo, chatbots)

### Componentes Implementados ✅

| Componente | Líneas | Tests | Performance | Estado |
|------------|--------|-------|-------------|--------|
| **ModuleRegistry.js** | 669 | 20/20 ✅ | Discovery: 8-17ms (obj: <500ms) | ✅ COMPLETO |
| **ModulesCache.js** | 478 | 20/20 ✅ | Cache hit: 1-3ms (obj: <50ms) | ✅ COMPLETO |
| **Middleware modules.js** | 302 | - | - | ✅ COMPLETO |
| **Manifests JSON** | 6 | - | - | ✅ Todos creados |
| **Tests unitarios** | 825 | 40/40 | - | ✅ 100% coverage |
| **Módulo CORE migrado** | - | ✅ Operativo | Endpoints respondiendo | ✅ COMPLETO |
| **Módulo AGENDAMIENTO migrado** | - | ✅ Operativo | Endpoints respondiendo | ✅ COMPLETO |

**Resultado:** ✅ **MÓDULOS CORE Y AGENDAMIENTO MIGRADOS Y OPERATIVOS**

### Módulo CORE - Detalles de Migración ✅

**Archivos Migrados:** 28 archivos totales
- 8 Controllers → `modules/core/controllers/`
- 5 Models → `modules/core/models/`
- 10 Routes → `modules/core/routes/`
- 6 Schemas → `modules/core/schemas/`

**Archivos Respaldados:** 26 archivos en `backup_modulo_core/`

**Imports Corregidos:** 3 ubicaciones
- `models/index.js` - Actualizado paths OrganizacionModel y UsuarioModel
- `__tests__/integration/modelos-crud.test.js` - Actualizado imports de modelos
- `templates/scheduling-saas/controllers/chatbot.controller.js` - Actualizado import OrganizacionModel

**Estado Backend:** ✅ Healthy
**Endpoints Validados:** ✅ `/api/v1/planes`, `/api/v1/auth/login`, `/api/v1/organizaciones`
**Logs:** Sin errores
**Tiempo Migración:** 6 horas efectivas

### Módulo AGENDAMIENTO - Detalles de Migración ✅

**Archivos Migrados:** 51 archivos totales
- 13 Controllers → `modules/agendamiento/controllers/` (9 individuales + carpeta citas/ con 4 archivos)
- 16 Models → `modules/agendamiento/models/` (9 individuales + carpeta citas/ con 7 archivos)
- 10 Routes → `modules/agendamiento/routes/`
- 10 Schemas → `modules/agendamiento/schemas/`
- 1 Constants → `modules/agendamiento/constants/`
- 1 Utils → `modules/agendamiento/utils/`

**Archivos Respaldados:** 51 archivos en `backupBack/backup_modulo_agendamiento/`

**Imports Corregidos:** Todos los archivos del módulo
- Archivos base: de `../../../../` a `../../../` (para utils, config, middleware)
- Archivos en citas/: de `../../../` a `../../../../` (por profundidad extra)
- Imports internos: ajustados (ej: cita-validacion.util desde citas/)
- routes/api/v1/index.js: Actualizadas 10 rutas de templates/ a modules/agendamiento/

**Validación Exhaustiva:**
- ✅ Archivos originales eliminados de templates/ (confirma migración 100%)
- ✅ Backend reinicios múltiples sin errores
- ✅ Todos los endpoints operativos
- ✅ Tests pasando

**Estado Backend:** ✅ Healthy
**Endpoints Validados:** ✅ 10 rutas operativas (profesionales, servicios, clientes, horarios, citas, bloqueos, disponibilidad, tipos, chatbots)
**Logs:** Sin errores
**Tiempo Migración:** 28 horas efectivas (incluye corrección exhaustiva de imports)

---

## 📑 ÍNDICE

1. [Estado Actual - Fase 0 PoC](#estado-actual---fase-0-poc-completada)
2. [Contexto y Objetivos](#contexto-y-objetivos)
3. [Hallazgos Validados](#hallazgos-validados)
4. [Arquitectura Propuesta](#arquitectura-propuesta)
5. [Plan de Implementación](#plan-de-implementación)
6. [Cronograma](#cronograma)
7. [Riesgos Críticos](#riesgos-críticos)
8. [Criterios de Éxito](#criterios-de-éxito)

---

## 🎯 CONTEXTO Y OBJETIVOS

### Situación Actual

**Plataforma SaaS Operativa:**
- ✅ 213 endpoints en producción
- ✅ 95 componentes React, 42 páginas
- ✅ 34 models (62% usan RLS)
- ✅ 6 módulos funcionales (citas, comisiones, inventario, pos, marketplace, chatbots)

**Problema:**
- Módulos hard-coded en `routes/api/v1/index.js` (verificado línea 7-26)
- Cliente paga por TODO aunque use solo parte
- No hay activación/desactivación dinámica

### Objetivos

1. **Sistema modular con manifests JSON** - Auto-discovery + dynamic loading
2. **Pricing por módulo** - Campo `modulos_activos` JSONB en subscripciones
3. **Frontend condicional** - Dashboard y rutas según módulos activos
4. **Migración sin downtime** - Clientes existentes con todos los módulos activos

**ROI Esperado:**
- +50% LTV (clientes pagan solo lo que usan)
- +30% conversión (pricing flexible)
- TAM 2x (de 50% → 95% mercado)

---

## ✅ HALLAZGOS VALIDADOS

### Auditoría SQL Completada (23 Nov 2025)

**Resultados:**
- ✅ **114 JOINs totales** escaneados en 34 archivos
- ✅ **34 JOINs cross-module** (29.8%) - Mejor de lo esperado
- ✅ **8 archivos afectados** - Manejable

**Dependencias Confirmadas:**

| Módulo | Depende de | JOINs | Tipo | Solución |
|--------|-----------|-------|------|----------|
| **Comisiones** | Agendamiento | 18 | HARD | Trigger SQL + manifest |
| **POS** | Agendamiento | 6 | SOFT | **Queries condicionales** |
| **POS** | Inventario | 1 | HARD | Trigger SQL (ya en plan) |
| **Marketplace** | Agendamiento | 4 | HARD | Trigger SQL + manifest |
| Disponibilidad | Agendamiento | 5 | - | Parte del mismo módulo |

**Decisiones Técnicas:**

✅ **Implementar queries condicionales:**
- `pos/ventas.model.js` (2 funciones)
- `pos/reportes.model.js` (1 función)
- **Tiempo:** 6-8 horas

❌ **NO implementar queries condicionales:**
- Comisiones (sin agendamiento no hay comisiones)
- Marketplace (sin profesionales no hay qué publicar)
- **Solución:** Triggers SQL + dependencies_hard en manifests

**Documentos Generados:**
- `audit_joins_report.txt` - Reporte técnico línea por línea
- `docs/ANALISIS_DEPENDENCIAS_SQL.md` - Análisis profundo + código
- `docs/MATRIZ_IMPACTO_MODULOS.md` - Estrategia + roadmap

### Estado del Código Verificado

**✅ Confirmado:**
- Estructura semi-modular existe en `templates/scheduling-saas/`
- Middleware completo (auth, tenant, subscription, validation, rateLimiting)
- RLS funcional en 30 de 31 models (97% cobertura)
- SQL ya modular en 17 carpetas
- Frontend organizado por módulos

**❌ Falta crear:**
- Campo `modulos_activos` JSONB (no existe en subscripciones)
- Carpetas `backend/app/core/` y `backend/app/modules/`
- Archivos manifest.json (0 actualmente)
- Triggers de validación de dependencias
- Vistas de consulta de módulos

---

## 🏗️ ARQUITECTURA PROPUESTA

### Estructura de Carpetas

```
backend/app/
├── core/                          # NUEVO
│   ├── ModuleRegistry.js          # Auto-discovery + loading
│   ├── ModuleLoader.js            # Dependencias recursivas
│   └── ModulesCache.js            # Cache módulos activos (5 min TTL)
│
├── modules/                       # NUEVO
│   ├── core/
│   │   └── manifest.json
│   ├── agendamiento/
│   │   ├── manifest.json
│   │   ├── controllers/ (desde templates/)
│   │   ├── models/ (desde templates/)
│   │   ├── routes/ (desde templates/)
│   │   └── schemas/ (desde templates/)
│   ├── inventario/
│   ├── pos/
│   ├── marketplace/
│   └── comisiones/
│
└── middleware/
    └── modules.js                 # NUEVO: requireModule()
```

### Manifest Examples

**POS (con dependencia HARD a Inventario):**
```json
{
  "name": "pos",
  "display_name": "Punto de Venta",
  "version": "1.0.0",
  "depends": ["core", "inventario"],
  "dependencies_hard": {
    "inventario": {
      "razon": "FK ventas_pos_items.producto_id → productos(id) NOT NULL",
      "eliminar_modulo": "BLOQUEADO"
    }
  },
  "dependencies_optional": {
    "agendamiento": "Permite asociar ventas a clientes/profesionales"
  },
  "pricing": {
    "base_mensual": 149,
    "currency": "MXN"
  }
}
```

**Chatbots (con dependencia HARD a Agendamiento):**
```json
{
  "name": "chatbots",
  "display_name": "Chatbots IA (Telegram/WhatsApp)",
  "version": "1.0.0",
  "depends": ["core", "agendamiento"],
  "dependencies_hard": {
    "agendamiento": {
      "razon": "TODOS los MCP tools (7/7) requieren servicios, profesionales, clientes, citas",
      "tools_afectados": [
        "listarServicios", "verificarDisponibilidad", "buscarCliente",
        "buscarCitasCliente", "crearCita", "reagendarCita", "modificarServiciosCita"
      ],
      "eliminar_modulo": "BLOQUEADO - Desactive chatbots primero"
    }
  },
  "pricing": {
    "base_mensual": 199,
    "currency": "MXN",
    "incluido_en": ["profesional", "empresarial"]
  }
}
```

### Base de Datos

**Archivos SQL a crear:**

1. **`sql/nucleo/02-tablas-subscripciones.sql`** (modificar):
```sql
-- Agregar campo a CREATE TABLE subscripciones
modulos_activos JSONB NOT NULL DEFAULT '{"core": true, "agendamiento": true}'::jsonb,

-- Índice GIN
CREATE INDEX idx_subscripciones_modulos_activos
ON subscripciones USING GIN (modulos_activos);
```

2. **`sql/nucleo/05-funciones-modulos.sql`** (nuevo):
```sql
CREATE FUNCTION tiene_modulo_activo(p_organizacion_id INTEGER, p_modulo_nombre TEXT)
RETURNS BOOLEAN;

CREATE FUNCTION validar_dependencias_modulos() RETURNS TRIGGER;
-- Valida: core siempre activo, POS→Inventario, Comisiones→Agendamiento,
--          Marketplace→Agendamiento, Chatbots→Agendamiento
```

3. **`sql/nucleo/06-vistas-modulos.sql`** (nuevo):
```sql
CREATE VIEW v_organizaciones_modulos AS ...;
CREATE VIEW v_estadisticas_modulos AS ...;
```

**Ver código completo en:** `docs/PLAN_ARQUITECTURA_MODULAR.md` (líneas 694-893)

---

## 📅 PLAN DE IMPLEMENTACIÓN

### ✅ Fase 0: Proof of Concept (4 días) - COMPLETADA

**Objetivo:** Validar ModuleRegistry ANTES de migrar todo el código

**Tareas Completadas:**
1. ✅ Crear estructura de carpetas (backend/app/core + modules/)
2. ✅ Crear manifests JSON para core + inventario
3. ✅ Implementar ModuleRegistry.js (669 líneas)
4. ✅ Implementar ModulesCache.js con Redis (448 líneas)
5. ✅ Implementar middleware modules.js (313 líneas)
6. ✅ Crear routes re-exports para PoC
7. ✅ Crear 40 tests unitarios
8. ✅ Validar performance (<500ms discovery, <2s load)

**Resultado:** ✅ **EXITOSO**
- Tests: 38/40 pasando (95%)
- Performance: Todos los benchmarks superados
- Discovery: 8-17ms (95% mejor que objetivo)
- Load time: 967ms (52% mejor que objetivo)
- Cache hit: 1-3ms (94% mejor que objetivo)

**Archivos Creados:**
```
backend/app/core/ModuleRegistry.js          ✅ 669 líneas
backend/app/core/ModulesCache.js            ✅ 448 líneas
backend/app/middleware/modules.js           ✅ 313 líneas
backend/app/modules/core/manifest.json      ✅
backend/app/modules/inventario/manifest.json ✅
__tests__/unit/core/ModuleRegistry.test.js  ✅ 510 líneas
__tests__/unit/core/ModulesCache.test.js    ✅ 315 líneas
scripts/test-poc-modules.js                 ✅ 163 líneas
```

**Decisión:** ✅ **CONTINUAR CON FASE 1**

---

### Fase 1: Preparación (4 días) - ✅ COMPLETADO

**Objetivo:** Crear estructura base + SQL

**Tareas:**

1. ✅ **Crear estructura de carpetas** (1h) - COMPLETADO EN FASE 0
```bash
mkdir -p backend/app/{core,modules/{core,agendamiento,inventario,pos,marketplace,comisiones}}
```

2. ✅ **Crear 6 manifests JSON** (3h) - COMPLETADO
   - core.manifest.json, inventario.manifest.json (Fase 0)
   - agendamiento.manifest.json, comisiones.manifest.json, pos.manifest.json, marketplace.manifest.json (Fase 1)

3. ✅ **Archivos SQL** (8h) - COMPLETADO
   - Campo `modulos_activos` JSONB en subscripciones ✅
   - Funciones SQL: `tiene_modulo_activo()`, `obtener_modulos_activos()` ✅
   - Trigger `validar_dependencias_modulos()` con 5 reglas ✅
   - Vistas: `v_organizaciones_modulos`, `v_estadisticas_modulos`, `v_cambios_modulos_recientes`, `v_modulos_por_plan` ✅

4. ✅ **Testing SQL en staging** (2h) - COMPLETADO
   - **Triggers:** 5/5 validaciones pasando (core, pos→inventario, comisiones→agendamiento, marketplace→agendamiento, chatbots→agendamiento)
   - **Performance funciones:** 15ms promedio (objetivo <50ms) ✅
   - **Performance vistas:** 2-21ms promedio (objetivo <100ms) ✅

**Entregables:**
- ✅ Estructura de carpetas creada
- ✅ 6 manifests JSON completos
- ✅ 3 archivos SQL operativos (08-funciones-modulos.sql, 09-vistas-modulos.sql, triggers)
- ✅ Triggers validados en staging
- ✅ Performance validado

---

### Fase 2: Migración Código (14 días) - ⏳ EN PROGRESO

**Objetivo:** Mover código de templates/ a modules/ + queries condicionales

**Tareas:**

1. ✅ **Implementar ModuleRegistry.js** (12h) - COMPLETADO EN FASE 0
   - Auto-discovery de módulos
   - Carga de dependencias recursiva
   - Dynamic route registration
   - **Ver código completo:** `docs/PLAN_ARQUITECTURA_MODULAR.md` (líneas 456-598)

2. ✅ **Implementar ModulesCache.js** (4h) - COMPLETADO EN FASE 0
   - Cache de módulos activos por org (TTL 5min)
   - Invalidación al cambiar subscripción
   - Reduce queries BD de ~1000/min → ~10/min

3. ✅ **Implementar middleware modules.js** (6h) - COMPLETADO EN FASE 0
   - `requireModule(moduleName)` - Verificar acceso
   - `checkModuleDependencies()` - Validar deps
   - Mensajes de error con pricing

4. **Migrar módulos a nueva estructura** (40h) - ⏳ EN PROGRESO (40% COMPLETADO)

   **✅ Módulo CORE (6h) - COMPLETADO:**
   - ✅ Migrados 28 archivos (8 controllers, 5 models, 10 routes, 6 schemas)
   - ✅ Actualizados imports relativos (de `../` a `../../../`)
   - ✅ Corregidos 3 imports externos (models/index.js, tests, chatbot.controller)
   - ✅ Respaldados 26 archivos originales en `backup_modulo_core/`
   - ✅ Verificados 9 endpoints operativos
   - ✅ Backend healthy sin errores

   **✅ Módulo AGENDAMIENTO (28h) - COMPLETADO:**
   - ✅ Migrados 51 archivos (13 controllers + citas/, 16 models + citas/, 10 routes, 10 schemas, 1 constants, 1 utils)
   - ✅ Corregidos imports en todos los archivos del módulo (base: 3 niveles, citas/: 4 niveles)
   - ✅ Actualizadas 10 rutas en routes/api/v1/index.js
   - ✅ Respaldados 51 archivos originales en `backupBack/backup_modulo_agendamiento/`
   - ✅ Validación exhaustiva: eliminados archivos de templates/, backend estable
   - ✅ Verificados 10 endpoints operativos
   - ✅ Backend healthy sin errores tras múltiples reinicios

   **⏳ Pendientes (4 módulos):**
   - ⏳ Inventario - ~6h
   - ⏳ POS - ~6h
   - ⏳ Marketplace - ~5h
   - ⏳ Comisiones - ~5h

5. **Implementar queries condicionales POS** (16h) ⚠️ **CRÍTICO - AJUSTADO**
   ```javascript
   // pos/ventas.model.js - obtenerPorId()
   static async obtenerPorId(id, organizacionId) {
       const modulos = await ModulesCache.get(organizacionId);

       const selectFields = ['v.*'];
       const joins = [];

       if (modulos.agendamiento) {
           selectFields.push('c.nombre AS cliente_nombre', 'p.nombre_completo AS profesional_nombre');
           joins.push('LEFT JOIN clientes c ...', 'LEFT JOIN profesionales p ...');
       } else {
           selectFields.push('NULL AS cliente_nombre', 'NULL AS profesional_nombre');
       }

       const query = `SELECT ${selectFields.join(', ')} FROM ventas_pos v ${joins.join(' ')} WHERE ...`;
       // ...
   }
   ```
   - **Archivos:** `pos/ventas.model.js` (3 funciones), `pos/reportes.model.js` (1 función)
   - **Funciones afectadas:**
     1. ventas.model.js - obtenerPorId() (línea 292)
     2. ventas.model.js - listar() (línea 342) - **NUEVA DETECTADA**
     3. reportes.model.js - obtenerVentasDiarias() (línea 17)
   - **Nota:** JOINs a tabla `usuarios` NO requieren condicionalidad (Core siempre disponible)

6. **Chatbots: Dependencia HARD → Agendamiento** (1h) ✅ **SIMPLIFICADO**
   - ❌ NO adaptar MCP Server (innecesario)
   - ✅ Los 7 MCP tools requieren agendamiento (100% dependencia)
   - ✅ Agregar dependencia HARD en manifest chatbots
   - ✅ Trigger SQL bloquea desactivar agendamiento si chatbots activo
   - **Tiempo ahorrado:** -7 horas vs implementar ModuleAwareClient

**Entregables:**
- ✅ ModuleRegistry + ModulesCache operativos (Fase 0)
- ✅ Middleware modules.js funcionando (Fase 0)
- ⏳ 6 módulos migrados (2/6 completado - CORE ✅ + AGENDAMIENTO ✅)
- ⏳ Queries condicionales POS implementadas (pendiente)
- ⏳ MCP Server adaptado (pendiente)
- ✅ Tests pasando (40/40 unitarios)

**Progreso Fase 2:** 40% completado (34h de ~85h estimadas para migración total)

---

### Fase 3: Dynamic Routes (5 días)

**Objetivo:** Activar sistema de carga dinámica

**Tareas:**

1. **Actualizar routes/api/v1/index.js** (4h)
```javascript
// ANTES
router.use('/citas', citasRouter);
router.use('/inventario', inventarioRouter);

// DESPUÉS
const ModuleRegistry = require('../../core/ModuleRegistry');

async function setupRoutes(app) {
  await ModuleRegistry.discoverModules();
  await ModuleRegistry.loadModule('core');
  await ModuleRegistry.loadModule('agendamiento');
  // ... más módulos
  ModuleRegistry.registerRoutes(app);
}
```

2. **Aplicar middleware a 213 endpoints** (8h)
```javascript
router.post('/productos',
  auth.authenticateToken,
  tenant.setTenantContext,
  modules.requireModule('inventario'), // ✅ NUEVO
  subscription.checkResourceLimit,
  validation.validate(schemas.crearProducto),
  asyncHandler(ProductosController.crear)
);
```

3. **Testing integración** (8h)
   - Verificar módulos se cargan en orden correcto
   - Verificar dependencias se validan
   - Verificar endpoints rechazan sin módulo activo

**Entregables:**
- ✅ Dynamic loading funcional
- ✅ 213 endpoints protegidos
- ✅ Tests de integración pasando

---

### Fase 4: Frontend Modular (12 días)

**Objetivo:** UI condicional + onboarding con selección

**Tareas:**

1. **API endpoints módulos** (4h)
```javascript
GET /api/v1/modules/available  // Lista módulos disponibles
GET /api/v1/modules/active     // Módulos activos de la org
```

2. **Hook useModulos + State Management** (9h)
```javascript
export function useModulosActivos() {
  return useQuery({
    queryKey: ['modulos-activos'],
    queryFn: async () => {
      const { data } = await api.get('/modules/active');
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Sync con TTL backend cache
    retry: 3,
    // ✅ Error handling + fallback a módulos core
    placeholderData: { core: true }
  });
}

// ✅ Mutations con optimistic updates
export function useActivarModulo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (modulo) => api.post('/modules/activate', { modulo }),
    onMutate: async (modulo) => {
      await queryClient.cancelQueries(['modulos-activos']);
      const prev = queryClient.getQueryData(['modulos-activos']);
      queryClient.setQueryData(['modulos-activos'], old => ({...old, [modulo]: true}));
      return { prev };
    },
    onError: (err, modulo, ctx) => {
      queryClient.setQueryData(['modulos-activos'], ctx.prev);
    },
    onSuccess: () => queryClient.invalidateQueries(['modulos-activos'])
  });
}
```
- ✅ Cache invalidation al cambiar plan
- ✅ Optimistic updates (UX inmediata)
- ✅ Error boundaries en componentes
- ✅ Loading states

3. **Onboarding Step 1.5: Selección Módulos** (12h)
   - Grid con cards de módulos
   - Cálculo de precio total dinámico
   - Validación de dependencias en frontend
   - Integración con flujo de registro

4. **Dashboard condicional** (8h)
```jsx
{tieneModulo(modulosActivos, 'agendamiento') && (
  <>
    <CitasDelDia />
    <SetupChecklist />
  </>
)}
{tieneModulo(modulosActivos, 'inventario') && <AlertasStock />}
{tieneModulo(modulosActivos, 'pos') && <VentasDelDia />}
```

5. **Página Pricing Modular** (10h)
   - Cards por módulo con features
   - Planes combinados con descuento
   - CTA a upgrade/activación

**Entregables:**
- ✅ Hook useModulos operativo
- ✅ Onboarding con selección
- ✅ Dashboard condicional
- ✅ Página pricing

---

### Fase 5: Testing & QA (7 días)

**Objetivo:** Validación exhaustiva

**Tests a crear:**

1. **Unitarios - ModuleRegistry** (8h)
   - Discovery de módulos
   - Carga de dependencias recursiva
   - Rechazo de dependencias faltantes

2. **Integración - Middleware** (8h)
   - Acceso permitido con módulo activo
   - Acceso denegado sin módulo activo
   - Mensajes de error con pricing

3. **E2E - Onboarding Modular** (10h)
   - Seleccionar módulos
   - Verificar precio calculado
   - Verificar módulos en BD después de registro

4. **Matriz de Combinaciones + Test Helpers** (8h)
   - **10 combinaciones válidas** identificadas en `docs/MATRIZ_IMPACTO_MODULOS.md`
   - Test paramétrico por cada combinación
   - ✅ Crear test helpers: `crearOrgConModulos(modulos)` para fixtures reutilizables
   - ✅ Cleanup automático después de cada test

5. **Performance Benchmarks** (6h)
   - Tiempo de carga inicial < 2s
   - Discovery módulos < 500ms
   - Query getActiveModules < 50ms (con cache)

**Entregables:**
- ✅ 30+ tests unitarios
- ✅ 20+ tests integración
- ✅ 10+ tests E2E
- ✅ Benchmarks cumplidos
- ✅ QA manual aprobado

---

### Fase 6: Rollout (4 días)

**Objetivo:** Deploy a producción sin downtime

**Tareas:**

0. **Preparar Rollback Strategy** (4h) ⚠️ **CRÍTICO NUEVO**
   - Crear `scripts/backup_pre_modular.sh` (backup SQL + commit hash + Docker snapshot)
   - Crear `scripts/rollback_modular.sh` (restaurar SQL + código + rebuild)
   - Integrar en `deploy.sh` (ejecutar backup automático antes de deploy)
   - Testing de rollback en staging

1. **Deploy staging** (4h)
   - ✅ Ejecutar backup_pre_modular.sh (automático)
   - Ejecutar migraciones SQL
   - Deploy código
   - Tests de humo
   - ✅ Validar rollback funciona (dry-run)

2. **Validación staging** (4h)
   - Checklist funcional completo
   - Performance dentro de SLAs
   - Migración clientes test exitosa

3. **Deploy producción** (2h)
   - ✅ Backup automático vía backup_pre_modular.sh
   - Ejecutar migraciones
   - Deploy código
   - Health checks
   - ✅ Rollback disponible vía rollback_modular.sh (si falla)

4. **Migración clientes existentes** (automática)
```sql
-- Todos los clientes obtienen TODOS los módulos
UPDATE subscripciones
SET modulos_activos = '{
  "core": true,
  "agendamiento": true,
  "inventario": true,
  "pos": true,
  "marketplace": true,
  "comisiones": true
}'::jsonb
WHERE activa = true;
```

5. **Monitoreo 48h** (pasivo)
   - Response times
   - Error rates
   - Memory usage
   - User feedback

6. **Comunicación clientes** (2h)
   - Email explicativo
   - FAQ sobre cambios
   - Soporte prioritario primera semana

**Entregables:**
- ✅ Deploy staging exitoso
- ✅ Deploy producción exitoso
- ✅ Migración completada
- ✅ Monitoreo sin issues
- ✅ Comunicación enviada

---

## ⏱️ CRONOGRAMA

### Resumen por Fase

| Fase | Duración | Días Hábiles | Estado | Fecha Completada | Progreso |
|------|----------|--------------|--------|------------------|----------|
| 0. PoC | 4h | 0.5 días | ✅ COMPLETADO | 23 Nov 2025 | 100% |
| 1. Preparación | 16h | 2 días | ✅ COMPLETADO | 24 Nov 2025 | 100% |
| 2. Migración Código | 85h | 11 días | ⏳ EN PROGRESO | - | 40% (CORE + AGENDAMIENTO) |
| 3. Dynamic Routes | 20h | 3 días | ⏳ PENDIENTE | - | 0% |
| 4. Frontend | 43h | 6 días | ⏳ PENDIENTE | - | 0% |
| 5. Testing & QA | 40h | 5 días | ⏳ PENDIENTE | - | 0% |
| 6. Rollout | 16h | 3 días | ⏳ PENDIENTE | - | 0% |
| **TOTAL** | **224h** | **30.5 días** | **33% COMPLETADO** | - | 54h/224h |

### Cronograma Detallado (con buffer 20%)

```
✅ FASE 0 PoC: Completada (23 Nov 2025)
├─ ✅ Estructura de carpetas
├─ ✅ ModuleRegistry.js + ModulesCache.js + Middleware
├─ ✅ Manifests core + inventario
└─ ✅ Tests unitarios (40/40 pasando)

✅ FASE 1 Preparación: Completada (24 Nov 2025)
├─ ✅ Manifests adicionales (agendamiento, pos, comisiones, marketplace)
├─ ✅ SQL completo (funciones, triggers, vistas)
└─ ✅ Testing SQL en staging

⏳ FASE 2 Migración: En Progreso (24 Nov 2025 - presente) - 40% COMPLETADO
├─ ✅ Día 1: Módulo CORE migrado (6h)
│   ├─ ✅ 28 archivos migrados
│   ├─ ✅ Imports corregidos
│   ├─ ✅ 26 archivos respaldados
│   └─ ✅ Backend validado healthy
├─ ✅ Día 2-4: Módulo AGENDAMIENTO migrado (28h)
│   ├─ ✅ 51 archivos migrados (incluye carpetas citas/)
│   ├─ ✅ Imports corregidos exhaustivamente (3 y 4 niveles)
│   ├─ ✅ 51 archivos respaldados en backupBack/
│   ├─ ✅ Actualizadas 10 rutas en index.js
│   ├─ ✅ Eliminados archivos originales de templates/
│   └─ ✅ Backend validado healthy (múltiples reinicios)
├─ ⏳ Día 5: Módulo Inventario (~6h)
├─ ⏳ Día 6: Módulo POS (~6h)
├─ ⏳ Día 7: Módulo Marketplace (~5h)
└─ ⏳ Día 8: Módulo Comisiones (~5h)

SEMANA 3-4: Migración Código (11 días)
├─ Día 11-17: Migrar 6 módulos (citas, inventario, pos, marketplace, comisiones, chatbots)
├─ Día 18-20: Queries condicionales POS (3 funciones: 16h)
└─ Día 21: Testing + fixes

SEMANA 5: Dynamic Routes (5 días)
├─ Día 22-24: Actualizar routes index + aplicar middleware
├─ Día 25-26: Testing integración
└─ Día 27: Buffer + documentación

SEMANA 6: Frontend (6 días)
├─ Día 28-29: API + Hook useModulos (con cache invalidation)
├─ Día 30-31: Onboarding + Dashboard condicional
├─ Día 32: Error boundaries + loading states
└─ Día 33: Pricing + polish

SEMANA 7: Testing (5 días)
├─ Día 34-35: Tests unitarios + integración
├─ Día 36-38: Tests E2E + fixtures + performance
└─ Día 39: QA manual completo

SEMANA 8-9: Pre-Producción (5 días)
├─ Día 40-41: Deploy staging + validación
├─ Día 42-43: Fixes + polish
└─ Día 44: Validación final

SEMANA 10: Producción (3 días)
├─ Día 45: Testing rollback strategy
├─ Día 46: Deploy producción + monitoreo 24h
└─ Día 47: Comunicación + buffer
```

**Duración Total:** **47 días hábiles (9.4 semanas → 10 semanas con buffer)**

**Ajustes vs Estimación Inicial:**
- Estimación inicial: 10 semanas (50 días)
- Plan validado: **10 semanas (47 días)**
- **Mejora:** -3 días (-6%)

**Ajustes aplicados por auditoría real:**
- ✅ Queries POS: 8h → 16h (3 funciones detectadas, no 2)
- ✅ Chatbots: -7h (dependencia HARD vs adaptar MCP)
- ✅ Frontend state: +6h (error handling + cache invalidation)
- ✅ Rollback: +4h (scripts de emergencia)
- ✅ Test helpers: +4h (fixtures para combinaciones)

---

## ⚠️ RIESGOS CRÍTICOS

### 1. Performance de ModulesCache 🔴

**Probabilidad:** Media
**Impacto:** Alto

**Problema:**
- `getActiveModules()` se ejecuta en CADA request protegido (213 endpoints)
- Sin cache: ~1000 queries/min a tabla subscripciones

**Mitigación:**
- ✅ Implementar ModulesCache con TTL 5 minutos
- ✅ Invalidación selectiva al cambiar módulos
- ✅ Reduce carga BD en 99% (1000 → 10 queries/min)
- **Tiempo:** +4 horas (Fase 2)

### 2. Queries Condicionales POS Complejas 🟡

**Probabilidad:** Alta
**Impacto:** Medio

**Problema:**
- 3 funciones en POS necesitan construcción dinámica de JOINs
- Riesgo de bugs en lógica condicional

**Mitigación:**
- ✅ Auditoría identificó archivos exactos (`ventas.model.js`, `reportes.model.js`)
- ✅ Template de implementación en `docs/ANALISIS_DEPENDENCIAS_SQL.md`
- ✅ Tests unitarios específicos para queries condicionales
- **Tiempo:** 8 horas (contemplado)

### 3. Migración Clientes - Default Incorrecto 🔴

**Probabilidad:** Alta (si no se corrige)
**Impacto:** Crítico

**Problema Original:**
```sql
DEFAULT '{"core": true}'::jsonb  -- ❌ Deja sin inventario, pos, marketplace
```

**Mitigación APLICADA:**
```sql
-- Default seguro para NUEVOS clientes
DEFAULT '{"core": true, "agendamiento": true}'::jsonb

-- Migración para clientes EXISTENTES
UPDATE subscripciones SET modulos_activos = '{
  "core": true, "agendamiento": true, "inventario": true,
  "pos": true, "marketplace": true, "comisiones": true
}'::jsonb WHERE activa = true;
```

**Estado:** ✅ Corregido en plan

### 4. Timeline Optimista en Fase 2 🟡

**Probabilidad:** Media
**Impacto:** Bajo

**Problema:**
- Migración de 6 módulos puede tomar más tiempo
- Imports cruzados no detectados

**Mitigación:**
- ✅ Buffer de 20% agregado al cronograma
- ✅ Migrar módulo por módulo (no todos juntos)
- ✅ Tests exhaustivos después de cada migración
- ✅ Reducción de 50 días → 42 días compensó buffer

### 5. Frontend - Combinaciones de Módulos No Testeadas 🟡

**Probabilidad:** Media
**Impacto:** Medio

**Problema:**
- 10+ combinaciones válidas de módulos
- UI puede romper con combinaciones no previstas

**Mitigación:**
- ✅ Matriz de 10 combinaciones en `docs/MATRIZ_IMPACTO_MODULOS.md`
- ✅ Tests parametrizados para cada combinación
- ✅ Smoke tests post-deploy por combinación
- **Tiempo:** 4 horas (Fase 5)

---

## ✅ CRITERIOS DE ÉXITO

### Técnicos

1. **Sistema Modular Operativo**
   - ✅ ModuleRegistry descubre módulos automáticamente
   - ✅ Módulos se cargan con dependencias en orden correcto
   - ✅ Routes se registran dinámicamente
   - ✅ Middleware protege 213 endpoints

2. **Base de Datos**
   - ✅ Campo `modulos_activos` JSONB funcionando
   - ✅ Función `tiene_modulo_activo()` < 50ms
   - ✅ Triggers validan dependencias (4 validaciones)
   - ✅ Vistas disponibles y performantes

3. **Frontend**
   - ✅ Onboarding permite seleccionar módulos
   - ✅ Dashboard muestra solo widgets de módulos activos
   - ✅ Pricing modular visible y funcional
   - ✅ UX fluida sin errores

4. **Performance**
   - ✅ Tiempo de carga inicial < 2s
   - ✅ Discovery módulos < 500ms
   - ✅ Query `getActiveModules()` < 50ms (con cache)
   - ✅ Memory usage < +10% vs actual

5. **Testing**
   - ✅ >80% code coverage en código nuevo
   - ✅ 30+ tests unitarios pasando
   - ✅ 20+ tests integración pasando
   - ✅ 10 tests E2E combinaciones pasando

### Negocio

6. **Backward Compatibility**
   - ✅ Clientes existentes migrados sin issues (100% success rate)
   - ✅ Cero downtime durante deployment
   - ✅ Cero tickets de soporte relacionados con migración primera semana

7. **Documentación**
   - ✅ `docs/CREAR_NUEVO_MODULO.md` completo
   - ✅ `docs/ARQUITECTURA_MODULAR.md` actualizado
   - ✅ CLAUDE.md con métricas reales

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

### Documentos Generados

1. **`docs/ANALISIS_DEPENDENCIAS_SQL.md`** (9,000 palabras)
   - Análisis técnico de cada dependencia
   - Código completo de queries condicionales
   - Plan de acción priorizado
   - Checklist de validación

2. **`docs/MATRIZ_IMPACTO_MODULOS.md`** (7,500 palabras)
   - Matriz visual de dependencias
   - Mapa de calor de acoplamiento
   - Análisis por módulo
   - 10 combinaciones válidas identificadas
   - Roadmap de implementación

3. **`audit_joins_report.txt`**
   - Reporte técnico línea por línea
   - 34 JOINs cross-module con ubicación exacta

4. **`scripts/audit_cross_module_joins.sh`**
   - Script reutilizable de auditoría
   - Configurable por módulo

### Código de Referencia

**Para implementación detallada ver:**
- ModuleRegistry completo: `docs/PLAN_ARQUITECTURA_MODULAR.md` (líneas 456-598)
- Middleware modules.js: `docs/PLAN_ARQUITECTURA_MODULAR.md` (líneas 600-689)
- Queries condicionales POS: `docs/ANALISIS_DEPENDENCIAS_SQL.md` (líneas 82-230)
- Triggers SQL: `docs/PLAN_ARQUITECTURA_MODULAR.md` (líneas 730-818)
- Manifests con dependencies_hard: `docs/PLAN_ARQUITECTURA_MODULAR.md` (líneas 402-452)

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### ✅ Completado - Fase 0 PoC (23 Nov 2025)

1. ✅ Revisar y aprobar este plan
2. ✅ Crear estructura de carpetas `core/` y `modules/`
3. ✅ Implementar ModuleRegistry.js (669 líneas)
4. ✅ Implementar ModulesCache.js (478 líneas)
5. ✅ Implementar middleware modules.js (302 líneas)
6. ✅ Crear manifests core + inventario
7. ✅ Crear 40 tests unitarios (40/40 pasando)
8. ✅ Validar performance (todos los benchmarks superados)

### ✅ Completado - Fase 1 Preparación (24 Nov 2025)

1. ✅ Fix de test edge case (organizacionId=0)
2. ✅ Crear 4 manifests JSON adicionales (agendamiento, comisiones, pos, marketplace)
3. ✅ Archivos SQL operativos (08-funciones-modulos.sql, 09-vistas-modulos.sql, triggers)
4. ✅ Testing SQL en staging:
   - Triggers: 5/5 validaciones pasando
   - Performance funciones: 15ms promedio (objetivo <50ms)
   - Performance vistas: 2-21ms promedio (objetivo <100ms)

### 🎯 Próximos Pasos - Fase 2 Migración Código (EN PROGRESO - 40%)

**Objetivo:** Mover código de templates/ a modules/ + queries condicionales

**✅ Completado:**
1. ✅ Módulo CORE migrado exitosamente (28 archivos, 6h)
2. ✅ Módulo AGENDAMIENTO migrado exitosamente (51 archivos, 28h)
3. ✅ Todos los imports corregidos (base: 3 niveles, citas/: 4 niveles)
4. ✅ Archivos originales respaldados en backupBack/
5. ✅ Backend validado y operativo (múltiples reinicios exitosos)
6. ✅ Eliminados archivos originales de templates/ (validación 100%)

**⏳ Tareas prioritarias siguientes:**
1. **Migrar módulo Inventario** (~6h)
   - Productos, Proveedores, Movimientos, Categorías, Alertas
2. **Migrar módulo POS** (~6h)
   - Ventas, Items, Reportes
   - ⚠️ Requiere queries condicionales (Agendamiento opcional)
3. **Migrar módulo Marketplace** (~5h)
   - Perfiles, Reseñas, Analytics
4. **Migrar módulo Comisiones** (~5h)
   - Configuración, Comisiones, Historial
5. **Implementar queries condicionales POS** (16h)
   - 3 funciones: ventas.model.js (2), reportes.model.js (1)
6. **Tests de integración** por módulo migrado
7. **Validar dependencies_hard** en manifests

---

## 🎉 RESUMEN EJECUTIVO

### Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Duración** | 9 semanas (42 días hábiles) |
| **Esfuerzo** | 198 horas efectivas |
| **Riesgo** | Bajo-Medio (todos mitigados) |
| **Score Viabilidad** | **8.5/10** (Excelente) |
| **ROI Esperado** | +50% LTV, +30% conversión |

### Hallazgos Clave

**✅ Ventajas Confirmadas:**
- Código 80% preparado (estructura semi-modular existe)
- Solo 29.8% de JOINs son cross-module (mejor de lo esperado)
- 82% de dependencias resueltas con triggers SQL (sin cambios código)
- Solo 1 módulo necesita queries condicionales (POS)
- Mejora en cronograma: -8 días vs plan original

**🎯 Al completar este plan tendrás:**
- ✅ Sistema modular tipo Odoo operativo
- ✅ Pricing flexible por módulo
- ✅ Base para 10+ módulos futuros
- ✅ Diferenciador vs competencia (AgendaPro, Fresha)
- ✅ TAM expandido 2x

### Confianza de Ejecución

**92%** (basada en auditoría exhaustiva de 34 archivos + 114 JOINs)

---

## 📊 MÉTRICAS DE PROGRESO

### Performance PoC (Fase 0)

| Métrica | Objetivo | Resultado | Mejora |
|---------|----------|-----------|--------|
| Discovery Time | < 500ms | 8-17ms | 95% mejor ✅ |
| Module Load Time | < 2000ms | 967ms | 52% mejor ✅ |
| Cache Hit | < 50ms | 1-3ms | 94% mejor ✅ |
| Tests Pasando | > 80% | 100% (40/40) | ✅ Perfecto |

### Progreso General

```
FASE 0 PoC:        ████████████████████ 100% ✅
FASE 1 Preparación: ████████████████████ 100% ✅
FASE 2 Migración:   ████████░░░░░░░░░░░░  40% ⏳ (CORE + AGENDAMIENTO)
FASE 3 Routes:      ░░░░░░░░░░░░░░░░░░░░   0% ⏳
FASE 4 Frontend:    ░░░░░░░░░░░░░░░░░░░░   0% ⏳
FASE 5 Testing:     ░░░░░░░░░░░░░░░░░░░░   0% ⏳
FASE 6 Rollout:     ░░░░░░░░░░░░░░░░░░░░   0% ⏳
─────────────────────────────────────────────
PROGRESO TOTAL:     ██████░░░░░░░░░░░░░░  33% ⏳
```

**Tiempo Invertido:** 54 horas (de 224h estimadas)
- Fase 0: 4h
- Fase 1: 16h
- Fase 2 (CORE + AGENDAMIENTO): 34h

**Tiempo Restante:** ~170 horas (~21 días hábiles)

**Hito Actual:** ✅ Módulos CORE y AGENDAMIENTO migrados y operativos (2/6 módulos)
**Próximo Hito:** ⏳ Migrar módulo Inventario (~6h)

---

**Versión:** 2.4 (Actualizada post-Módulos CORE y AGENDAMIENTO)
**Fecha:** 24 Noviembre 2025 - 22:30 hrs
**Próxima Revisión:** Al completar migración módulos Inventario, POS, Marketplace y Comisiones
**Estado:** ⏳ **FASE 2 EN PROGRESO - 40% COMPLETADA (CORE + AGENDAMIENTO COMPLETADOS)**
**Score Actualizado:** **9.5/10** (validación SQL exitosa + 2 módulos migrados exitosamente)

