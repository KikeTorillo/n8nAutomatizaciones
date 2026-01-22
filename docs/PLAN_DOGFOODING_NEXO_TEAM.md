# Plan: Dogfooding Interno - Nexo Team

**Versión:** 4.2.0
**Fecha:** 22 Enero 2026
**Estado:** Fase 0 ✅ | Fase 1 ✅ | Fase 3 ✅ | Fase 2 ⏳ | Fase 5 ⏳

---

## 1. Resumen Ejecutivo

### Objetivo
Permitir que el super_admin tenga su propia organización ("Nexo Team") para gestionar operaciones internas usando los mismos módulos que los clientes, con enfoque en módulo de suscripciones genérico.

### Modelo de Negocio
- **Cobro por usuario activo**: $249/usuario/mes (Pro), $150-200 (Custom)
- **Sin límites de recursos**: Todo ilimitado
- **Trial**: 14 días sin restricciones

### Beneficios
| Beneficio | Descripción |
|-----------|-------------|
| **Un solo código** | Mantenemos 1 módulo de suscripciones, no 2 |
| **Dogfooding real** | Usamos exactamente lo que vendemos |
| **Bugs detectados rápido** | Si falla para Nexo, lo arreglamos antes |

---

## 2. Estado de Fases

| Fase | Descripción | Estado | Progreso |
|------|-------------|--------|----------|
| **Fase 0** | Eliminación Sistema Viejo | ✅ COMPLETADA | 100% |
| **Fase 1** | Super Admin con Organización | ✅ COMPLETADA | 100% |
| **Fase 3** | Módulo Suscripciones (Completo) | ✅ COMPLETADA | 100% |
| **Fase 2** | Vincular CRM con Organizaciones | ⏳ Pendiente | 0% |
| **Fase 5** | Refactor SuperAdmin UI | ⏳ Pendiente | 0% |
| **Fase 4** | Módulos Adicionales | ⏳ Futuro | 0% |

---

## 3. Fase 0: Eliminación Sistema Suscripciones V1 ✅ COMPLETADA

### Objetivo
Eliminar sistema viejo (límites por recurso) para preparar terreno para nuevo módulo (cobro por usuario).

### Cambios Aplicados (22 Enero 2026)

#### SQL (7 archivos modificados)

| Archivo | Cambios |
|---------|---------|
| `sql/nucleo/01-tablas-core.sql` | `plan_actual` ENUM → VARCHAR(20) |
| `sql/nucleo/03-indices.sql` | Eliminados índices tablas viejas (102-183) |
| `sql/nucleo/04-rls-policies.sql` | Eliminadas políticas RLS + fix sintaxis |
| `sql/nucleo/06-triggers.sql` | Eliminados triggers viejos |
| `sql/nucleo/08-funciones-modulos.sql` | Funciones actualizadas (acceso ilimitado) |
| `sql/setup/03-grant-permissions.sql` | Eliminado ALTER TABLE metricas_uso_organizacion |
| `init-data.sh` | Comentados 5 archivos deprecated |

#### Frontend (1 archivo)

| Archivo | Cambios |
|---------|---------|
| `frontend/src/services/api/modules/index.js` | Comentado import subscripcionesApi |

### Sistema Eliminado

**4 Tablas:**
- `planes_subscripcion`
- `subscripciones`
- `metricas_uso_organizacion`
- `historial_subscripciones`

**4 Funciones:**
- `verificar_limite_plan()`
- `tiene_caracteristica_habilitada()`
- `actualizar_metricas_uso()`
- `registrar_cambio_subscripcion()`

**2 ENUMs:**
- `plan_tipo`
- `estado_subscripcion`

### Correcciones Post-Eliminación (22 Ene 2026)

**SuperAdmin Dashboard corregido:**

El dashboard de SuperAdmin (`/superadmin`) daba errores 500 porque consultaba tablas eliminadas.

| Archivo | Problema | Solución |
|---------|----------|----------|
| `superadmin.controller.js` | Query a `subscripciones`, `metricas_uso_organizacion` | Reescrito con tablas existentes |
| `Dashboard.jsx` | Campo `revenue_mensual` → `$NaN` | Reemplazado por "Clientes Totales" |
| `Dashboard.jsx` | Campos `uso_*` no existían | Corregidos a `total_*`, `citas_mes` |
| `Dashboard.jsx` | `organizaciones_morosas`, `organizaciones_trial` | Eliminados (solo queda `suspendidas`) |

**Métricas actuales del Dashboard SuperAdmin:**
- Organizaciones Activas (+ total)
- Usuarios Totales
- Citas Este Mes
- Clientes Totales (+ profesionales)
- Alertas: Solo organizaciones suspendidas
- Top 10 Organizaciones por uso

---

## 4. Fase 1: Super Admin con Organización ✅ COMPLETADA

### Cambios Realizados

| Archivo | Cambio |
|---------|--------|
| `backend/app/modules/core/routes/setup.js` | Crear org "Nexo Team" para super_admin |
| `backend/app/middleware/auth.js` | Bypass requireRole para super_admin |
| `backend/app/middleware/tenant.js` | Super_admin usa org propia si tiene |
| `sql/data/02-datos-iniciales.sql` | Org "Nexo Team" (id=4) en SQL |

### Resultado
- ✅ Super admin tiene organización_id = 4 ("Nexo Team")
- ✅ Puede alternar entre vista plataforma (/superadmin) y su org (/home)
- ✅ Usa mismos módulos que clientes

---

## 5. Fase 3: Módulo Suscripciones-Negocio ✅ COMPLETADO

### 5.1 SQL ✅

**5 Tablas Creadas:**
```sql
✅ planes_suscripcion_org      -- Planes por organización
✅ suscripciones_org           -- Suscripciones de clientes
✅ pagos_suscripcion           -- Historial de pagos
✅ cupones_suscripcion         -- Cupones de descuento
✅ webhooks_suscripcion        -- Webhooks recibidos
```

**8 Funciones Métricas SaaS:**
```sql
✅ calcular_mrr(org_id, fecha)           -- Monthly Recurring Revenue
✅ calcular_arr(org_id, fecha)           -- Annual Recurring Revenue
✅ calcular_churn_rate(org_id, mes)      -- Tasa de cancelación
✅ calcular_ltv(org_id)                  -- Lifetime Value
✅ calcular_tasa_crecimiento_mrr()       -- Crecimiento MRR
✅ obtener_suscriptores_por_estado()     -- Distribución por estado
✅ obtener_top_planes()                  -- Planes más vendidos
✅ obtener_ingresos_por_periodo()        -- Análisis temporal
```

### 5.2 Backend ✅

- **Models (5):** planes, suscripciones, pagos, cupones, metricas
- **Controllers (6):** + webhooks
- **Routes (6):** RESTful con auth + tenant
- **Services (4):** cobro, stripe, mercadopago, notificaciones
- **Cron Jobs (2):** procesar-cobros (6AM), verificar-trials (7AM)
- **Schemas:** 20+ validaciones Joi

### 5.3 Frontend ✅

- **API Client:** `suscripciones-negocio.api.js`
- **Hooks:** usePlanes, useSuscripciones, usePagos, useCupones, useMetricas
- **Páginas:** Dashboard, Planes, Suscripciones (list+detail), Cupones, Pagos, Métricas
- **Componentes:** Cards, Badges, FormDrawers, Charts

### 5.4 Rutas Registradas

```
✅ /suscripciones-negocio/planes
✅ /suscripciones-negocio/suscripciones
✅ /suscripciones-negocio/pagos
✅ /suscripciones-negocio/cupones
✅ /suscripciones-negocio/metricas
✅ /suscripciones-negocio/webhooks/stripe         (público)
✅ /suscripciones-negocio/webhooks/mercadopago    (público)
```

---

## 6. Fase 5: Refactor SuperAdmin UI ⏳ PENDIENTE (NUEVA)

### Objetivo
Alinear el módulo SuperAdmin con los patrones de UI del resto del sistema y eliminar redundancias.

### Problemas Actuales

| Problema | Descripción |
|----------|-------------|
| **UI Legacy** | SuperAdmin no usa componentes reutilizables (ListadoCRUDPage, StatCardGrid, etc.) |
| **Sección Planes redundante** | `/superadmin/planes` duplica funcionalidad de `/suscripciones-negocio/planes` |
| **Dashboard custom** | No usa MetricCard de `components/ui`, tiene implementación propia |
| **Organizaciones** | Lista custom en vez de DataTable + filtros estándar |

### Cambios Propuestos

#### 6.1 Eliminar Sección Planes

**Motivo:** Ya existe módulo completo en `/suscripciones-negocio/planes` con CRUD, métricas y webhooks.

**Archivos a eliminar/modificar:**
```
❌ frontend/src/pages/superadmin/Planes.jsx
❌ backend: Endpoint GET /superadmin/planes (ya retorna data estática)
✏️ frontend/src/pages/superadmin/Layout.jsx - Quitar link "Planes"
```

**Alternativa:** Redirigir `/superadmin/planes` → `/suscripciones-negocio/planes`

#### 6.2 Refactor Dashboard

**De:**
```jsx
// Custom MetricCard inline en Dashboard.jsx
<MetricCard title="..." value={...} icon="🏢" color="blue" />
```

**A:**
```jsx
// Usar StatCardGrid de components/ui
import { StatCardGrid, StatCard } from '@/components/ui';

<StatCardGrid>
  <StatCard title="Organizaciones" value={...} icon={Building2} />
  ...
</StatCardGrid>
```

#### 6.3 Refactor Organizaciones

**De:** Lista custom con map() manual

**A:** Usar `ListadoCRUDPage` o `DataTable` con:
- Filtros avanzados (AdvancedFilterPanel)
- Paginación estándar
- Acciones en fila (ver detalle, suspender, etc.)

#### 6.4 Componentes a Reutilizar

| Componente Actual | Reemplazar Por |
|-------------------|----------------|
| `MetricCard` (custom) | `StatCard` de `components/ui/molecules` |
| Lista orgs manual | `DataTable` de `components/ui/organisms` |
| Layout custom | Considerar `BasePageLayout` |
| Badges inline | `Badge` de `components/ui/atoms` |

### Implementación

| Paso | Tarea | Estimación |
|------|-------|------------|
| 1 | Eliminar/redirigir `/superadmin/planes` | 1 hora |
| 2 | Refactor Dashboard con StatCardGrid | 2 horas |
| 3 | Refactor Organizaciones con DataTable | 3 horas |
| 4 | Agregar filtros y paginación estándar | 2 horas |
| 5 | Testing y ajustes dark mode | 1 hora |

**Total estimado:** 1 día

### Beneficios

- ✅ Consistencia UI en todo el sistema
- ✅ Menos código duplicado
- ✅ Mantenimiento centralizado
- ✅ Dark mode automático (ya implementado en componentes base)

---

## 7. Fase 2: Vincular CRM con Organizaciones ⏳ PENDIENTE

### Objetivo
Permitir que clientes del CRM de Nexo Team se vinculen con organizaciones de la plataforma para ver métricas unificadas.

### Implementación Planeada

**SQL:**
```sql
ALTER TABLE clientes
ADD COLUMN organizacion_vinculada_id INTEGER REFERENCES organizaciones(id);

CREATE FUNCTION obtener_metricas_organizacion_vinculada(...) RETURNS JSONB;
```

**Backend:**
- Método en `cliente.model.js`
- Controller con autorización `super_admin`
- Rutas: `GET /:id/organizacion-vinculada`, `PATCH /:id/vincular-organizacion`

**Frontend:**
- Componente `OrganizacionVinculadaCard.jsx`
- Hooks `useMetricasOrgVinculada`, `useVincularOrganizacion`
- Integración en `ClienteGeneralTab.jsx`

### Duración Estimada
5-7 días (1 semana)

---

## 8. Fase 4: Módulos Adicionales ⏳ FUTURO

**Prioridad Media:**
- Tickets/Soporte: Sistema de tickets desde organizaciones cliente
- Email Marketing: Campañas a suscriptores
- Proyectos: Roadmap interno Nexo

**Patrón:** Mismo dogfooding (Nexo usa primero, luego ofrece a clientes)

---

## 9. Línea de Tiempo

### Completado (22 Enero 2026)

| Fecha | Hito |
|-------|------|
| 21 Ene | Fase 0: Eliminación sistema viejo |
| 21 Ene | Fase 3: SQL + Backend completo |
| 22 Ene | Fase 3: Frontend (API + Hooks + UI) |
| 22 Ene | Fase 3: Validación E2E (CRUD Planes funcional) |
| 22 Ene | Fix: SuperAdmin dashboard (eliminar refs a tablas viejas) |

### Pendiente

| Prioridad | Fase | Estimación |
|-----------|------|------------|
| **Alta** | Fase 5: Refactor SuperAdmin UI | 1 día |
| Media | Fase 2: Vincular CRM con Organizaciones | 5-7 días |
| Baja | Fase 4: Módulos adicionales | TBD |

---

## 10. Testing y Verificación

### Checklist Backend ✅

- [x] Feature flag funciona
- [x] Todos los módulos CRUD sin errores
- [x] Tablas SQL eliminadas/creadas correctamente
- [x] Función SQL `tiene_modulo_activo()` retorna TRUE
- [x] Cron jobs ejecutan sin errores
- [x] Webhooks validan firmas HMAC
- [x] RLS: org A no ve datos de org B
- [x] SuperAdmin dashboard sin errores 500

### Checklist Frontend ✅

- [x] CRUD Planes funcional (crear, editar, eliminar)
- [x] Vista cards y tabla en PlanesPage
- [x] Formulario con validación Zod
- [x] Mapeo correcto de campos backend ↔ frontend
- [x] SuperAdmin dashboard muestra métricas correctas
- [ ] Dashboard métricas suscripciones-negocio (pendiente testing)
- [ ] Dark mode verificado en todos componentes

### Checklist Dogfooding Nexo (Pendiente)

- [ ] Onboarding crea suscripción trial automáticamente
- [ ] Trial 14 días funciona
- [ ] Conversión trial → activa tras payment method
- [ ] Cobro automático mensual procesa
- [ ] Dashboard Nexo muestra MRR total

---

## 11. Archivos Críticos

### Backend
```
backend/app/modules/suscripciones-negocio/
├── manifest.json
├── models/suscripciones.model.js
├── services/cobro.service.js
├── jobs/procesar-cobros.job.js
└── controllers/webhooks.controller.js

backend/app/modules/core/controllers/
└── superadmin.controller.js          # Corregido 22 Ene
```

### Frontend
```
frontend/src/pages/superadmin/
├── Dashboard.jsx                      # Corregido 22 Ene
├── Organizaciones.jsx
└── Layout.jsx                         # Pendiente: quitar link Planes

frontend/src/pages/suscripciones-negocio/
└── (7 páginas completas)
```

### SQL
```
sql/suscripciones-negocio/
├── 01-tablas.sql
└── 02-funciones-metricas.sql
```

---

## 12. Próximos Pasos

### Prioridad Alta
1. **Fase 5: Refactor SuperAdmin UI**
   - Eliminar/redirigir sección Planes
   - Migrar a componentes reutilizables
   - Consistencia con resto del sistema

### Prioridad Media
2. **Dogfooding Nexo Team**
   - Configurar planes reales (Trial/Pro/Custom)
   - Testing flujo completo de suscripción

3. **Fase 2: Vincular CRM**
   - Columna `organizacion_vinculada_id` en clientes
   - UI en ClienteGeneralTab

---

**Fin del Plan v4.2.0**
