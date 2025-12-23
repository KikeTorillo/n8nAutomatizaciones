# Plan de Gaps Arquitectónicos - Nexo ERP

> **Última Revisión**: 23 Diciembre 2025

---

## Validación E2E Completa - 23 Diciembre 2025

### Prueba End-to-End del Sistema de Workflows

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1 | Crear proveedor "Proveedor Prueba E2E" | ✅ Creado |
| 2 | Crear producto "Producto Test Workflow" $1,500 | ✅ Creado |
| 3 | Crear OC-2025-0001 por $100,000 | ✅ Sin workflow (< límite admin $999,999) |
| 4 | Crear OC-2025-0002 por $1,500,000 | ✅ Workflow activado (> límite) |
| 5 | Verificar estado "pendiente_aprobacion" | ✅ Correcto |
| 6 | Bandeja de aprobaciones muestra solicitud | ✅ Funcional |
| 7 | Aprobar solicitud con comentario | ✅ Aprobado |
| 8 | Orden cambia a estado "enviada" | ✅ Correcto |
| 9 | Historial registra: inicio → aprobado | ✅ Audit trail completo |

**Resultado: SISTEMA VALIDADO E2E** 🎉

### Hallazgo durante prueba

**Módulo "workflows" no activo por defecto**: El módulo workflows no estaba en la lista de módulos activos de la subscripción trial. Fue necesario agregarlo manualmente:

```sql
UPDATE subscripciones
SET modulos_activos = modulos_activos || '{"workflows": true}'::jsonb
WHERE organizacion_id = 1;
```

**Recomendación**: Agregar "workflows" a los módulos incluidos en el plan trial, o crear una UI para activarlo desde la página de módulos.

---

## Auditoría de Calidad - 23 Diciembre 2025

### Resumen Ejecutivo

| Fase | Código | UI | Funcionalidad | Calidad |
|------|--------|-----|---------------|---------|
| 1 - Workflows | ✅ Completo | ✅ Funcional | ✅ **E2E Validado** | **A+** |
| 2 - Módulos | ✅ Completo | ✅ Funcional | ✅ Operativo | **A** |
| 3 - Permisos | ✅ Completo | ✅ Funcional | ✅ Operativo | **A** |
| 4 - Multi-Moneda | ✅ Completo | ✅ Funcional | ✅ Operativo | **A** |

**Calificación General: A+ (Excelente - 4 Fases Completadas)**

### Hallazgos por Fase

#### Fase 1: Workflows de Aprobación
- **SQL**: 6 tablas con RLS, triggers, funciones de evaluación (`puede_aprobar_workflow`, `evaluar_condicion_workflow`)
- **Backend**: `WorkflowEngine` con soporte para aprobar/rechazar, notificaciones, timeout 72h
- **Frontend**: Bandeja de aprobaciones con tabs (Pendientes/Historial), filtros, modales de acción
- **Integración**: Permiso `inventario.limite_aprobacion` ($) evalúa si se requiere aprobación
- **Validado E2E**: Flujo completo probado con orden de $1.5M aprobada exitosamente

#### Fase 2: Gestión de Módulos
- **Backend**: CRUD completo con validación de dependencias
- **Frontend**: 9 módulos con toggles, dependencias visibles, bloqueo inteligente
- **Validaciones**:
  - ✅ "Requiere: inventario" (POS)
  - ✅ "Requerido por: Punto de Venta" (toggle deshabilitado)
  - ✅ Dependencias opcionales mostradas

#### Fase 3: Permisos Normalizados
- **SQL**: 3 tablas normalizadas (catálogo, rol, usuario_sucursal)
- **Backend**: API completa para listar/asignar permisos
- **Frontend**:
  - Selector de 4 roles (Admin, Propietario, Empleado, Bot)
  - **65+ permisos** en 10 módulos
  - Toggles para booleanos, valores numéricos (% descuento, $ límite)
  - Búsqueda de permisos funcional

#### Fase 4: Multi-Moneda
- **SQL**: 4 tablas (monedas, tasas_cambio, precios_servicio_moneda, precios_producto_moneda)
- **Backend**: API REST con 6 endpoints para monedas, tasas y conversión
- **Frontend**:
  - `formatCurrency()` dinámico por organización (corregido de COP a MXN)
  - Hook `useCurrency()` para componentes React
  - Selector de moneda y zona horaria en Configuración → Mi Negocio
- **Monedas activas**: MXN, COP, USD (+ 4 más en catálogo)

### Observaciones Técnicas

1. **Arquitectura sólida**: RLS correctamente implementado en todas las tablas nuevas
2. **Código limpio**: Uso consistente de `RLSContextManager`, `asyncHandler`, patrones establecidos
3. **UI coherente**: Dark mode, colores primary-*, componentes reutilizables
4. **Logs limpios**: Backend sin errores 500, solo warnings de Google OAuth (no crítico)

### Recomendaciones

1. ~~Agregar datos semilla para pruebas E2E de workflows~~ **COMPLETADO** - Validación E2E realizada
2. Considerar tests automatizados para el `WorkflowEngine`
3. Documentar los códigos de permisos en el catálogo
4. ~~Agregar módulo "workflows" a la UI de gestión de módulos~~ **COMPLETADO**
5. ~~Incluir "workflows" en los módulos por defecto del plan trial~~ **COMPLETADO**

---

## Estado del Proyecto

| Fase | Nombre | SQL | Backend | Frontend | Estado |
|------|--------|-----|---------|----------|--------|
| 1 | Workflows de Aprobación | ✅ | ✅ | ✅ | **Completado** |
| 2 | Gestión de Módulos | ✅ | ✅ | ✅ | **Completado** |
| 3 | Permisos Normalizados | ✅ | ✅ | ✅ | **Completado** |
| 4 | Multi-Moneda | ✅ | ✅ | ✅ | **Completado** |
| 5 | Webhooks Salientes | ⬜ | ⬜ | ⬜ | Pendiente |
| 6 | Internacionalización (i18n) | 🟡 | ⬜ | ⬜ | BD lista |
| 7 | Reportes Multi-Sucursal | ⬜ | ⬜ | ⬜ | Pendiente |
| 8 | Centros de Costo | ⬜ | ⬜ | ⬜ | Pendiente |
| 9 | API Pública Documentada | ⬜ | ⬜ | ⬜ | Futuro |

**Leyenda**: ⬜ Pendiente | 🟡 Parcial | ✅ Completado

---

## Fases Completadas

### Fase 1: Workflows de Aprobación ✅

Sistema de aprobaciones configurable para órdenes de compra y otras entidades.

**Archivos clave:**
- `sql/workflows/` - 4 archivos SQL (tablas, índices, funciones, datos)
- `backend/app/modules/workflows/` - WorkflowEngine + rutas
- `frontend/src/pages/aprobaciones/` - Bandeja de aprobaciones

### Fase 2: Gestión de Módulos ✅

API y UI para activar/desactivar módulos por organización.

**Archivos clave:**
- `backend/app/modules/core/controllers/modulos.controller.js`
- `frontend/src/pages/configuracion/ModulosPage.jsx`

### Fase 3: Permisos Normalizados ✅

Sistema de permisos con catálogo, asignación por rol y overrides por usuario/sucursal.

**Archivos clave:**
- `sql/nucleo/11-tablas-permisos.sql` - 3 tablas (catalogo, rol, usuario_sucursal)
- `sql/nucleo/12-funciones-permisos.sql` - Funciones de evaluación
- `backend/app/modules/permisos/` - API completa
- `frontend/src/pages/configuracion/PermisosPage.jsx` - UI de gestión

---

### Fase 4: Multi-Moneda ✅

Sistema de multi-moneda con tasas de cambio y formateo dinámico por organización.

**Archivos clave:**
- `sql/nucleo/15-tablas-monedas.sql` - Tablas: monedas, tasas_cambio, precios_*_moneda
- `backend/app/modules/core/models/monedas.model.js` - CRUD y conversión
- `backend/app/modules/core/controllers/monedas.controller.js` - API REST
- `backend/app/modules/core/routes/monedas.routes.js` - Rutas
- `frontend/src/utils/currency.js` - Configuración de monedas + formateo dinámico
- `frontend/src/hooks/useCurrency.js` - Hook para componentes React

**Funcionalidades implementadas:**
- ✅ Catálogo de 7 monedas (MXN, COP, USD, ARS, CLP, PEN, EUR)
- ✅ Tasas de cambio con historial
- ✅ API de conversión de montos
- ✅ `formatCurrency()` dinámico por organización (default: MXN)
- ✅ Hook `useCurrency()` para componentes
- ✅ Endpoint `/me` expone moneda de la organización
- ✅ Infraestructura para precios multi-moneda (productos/servicios)

**Monedas activas:** MXN, COP, USD

---

## Fase 5: Webhooks Salientes (Pendiente)

### Problema

Nexo solo recibe webhooks (Mercado Pago → Nexo), pero no puede notificar a sistemas externos cuando ocurren eventos.

### Estado Actual

- ✅ Webhooks entrantes: Mercado Pago
- ❌ Webhooks salientes: No existe

### Solución Requerida

**SQL:**
```sql
CREATE TABLE webhook_subscripciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER REFERENCES organizaciones(id),
    url VARCHAR(500) NOT NULL,
    eventos TEXT[] NOT NULL, -- {'cita.creada', 'venta.completada', ...}
    secreto VARCHAR(100), -- Para firmar payloads
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_entregas (
    id BIGSERIAL PRIMARY KEY,
    subscripcion_id INTEGER REFERENCES webhook_subscripciones(id),
    evento VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, enviado, fallido
    intentos INTEGER DEFAULT 0,
    ultimo_intento TIMESTAMPTZ,
    respuesta_codigo INTEGER,
    respuesta_body TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

**Backend:**
- [ ] Event dispatcher genérico (EventEmitter o Bull queue)
- [ ] Worker para envío de webhooks con retry
- [ ] Firma HMAC-SHA256 de payloads
- [ ] API para gestionar subscripciones

**Eventos Prioritarios:**
- `cita.creada`, `cita.confirmada`, `cita.cancelada`
- `venta.completada`, `venta.cancelada`
- `cliente.creado`
- `orden_compra.aprobada`, `orden_compra.rechazada`

---

## Fase 6: Internacionalización - i18n (Parcial)

### Estado Actual

- ✅ **BD preparada**: Tablas `paises`, `estados` con `zona_horaria`
- ✅ **Organizaciones**: Campos `idioma`, `moneda`, `zona_horaria`
- ❌ **Frontend**: 100% español hardcoded
- ❌ **Backend**: Helpers existen pero no se usan

### Solución Requerida

**Frontend:**
```bash
npm install i18next react-i18next
```

- [ ] Configurar i18next con detección de idioma
- [ ] Crear archivos de traducción: `es-MX.json`, `es-CO.json`, `en.json`
- [ ] Componente `<Trans>` o hook `useTranslation()`
- [ ] `formatCurrency()` y `formatDate()` dinámicos por locale

**Backend:**
- [ ] Activar `DateHelper` con timezone de organización
- [ ] Mensajes de error traducibles
- [ ] Validadores por país (teléfono, RFC/NIT/CUIT)

### Idiomas Prioritarios

| Código | Idioma |
|--------|--------|
| es-MX | Español (México) |
| es-CO | Español (Colombia) |
| en | Inglés |

---

## Fase 7: Reportes Multi-Sucursal (Pendiente)

### Problema

No hay vistas consolidadas para comparar métricas entre sucursales.

### Estado Actual

- ✅ `DashboardSucursalesPage.jsx` existe con métricas básicas
- ❌ Sin vistas materializadas para performance
- ❌ Sin comparativas período a período

### Solución Requerida

**SQL:**
```sql
-- Vista materializada para consolidación diaria
CREATE MATERIALIZED VIEW mv_ventas_sucursal_dia AS
SELECT
    sucursal_id,
    DATE(fecha) as fecha,
    COUNT(*) as total_ventas,
    SUM(total) as monto_total,
    AVG(total) as ticket_promedio
FROM ventas
WHERE estado = 'completada'
GROUP BY sucursal_id, DATE(fecha);

-- Refresh con pg_cron
SELECT cron.schedule('refresh_mv_ventas', '0 2 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ventas_sucursal_dia');
```

**Frontend:**
- [ ] Dashboard comparativo con gráficas
- [ ] Filtros por período y sucursales
- [ ] Export a Excel/PDF

---

## Fase 8: Centros de Costo (Pendiente)

### Problema

No hay forma de asignar gastos/ingresos a centros de costo para análisis de rentabilidad.

### Estado Actual

- Solo existe un comentario en `sql/contabilidad/01-tablas.sql:375`
- La tabla NO está creada

### Solución Requerida

**SQL:**
```sql
CREATE TABLE centros_costo (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER REFERENCES organizaciones(id),
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    padre_id INTEGER REFERENCES centros_costo(id), -- Jerarquía
    activo BOOLEAN DEFAULT true,
    UNIQUE(organizacion_id, codigo)
);

-- Agregar FK en asientos_contables
ALTER TABLE asientos_contables
ADD COLUMN centro_costo_id INTEGER REFERENCES centros_costo(id);
```

**Backend:**
- [ ] CRUD de centros de costo
- [ ] Asignación en asientos contables

**Frontend:**
- [ ] Gestión de centros de costo
- [ ] Selector en formularios de contabilidad
- [ ] Reportes por centro de costo

---

## Fase 9: API Pública Documentada (Futuro)

### Objetivo

Exponer APIs documentadas para que desarrolladores externos integren Nexo con sus sistemas.

### Componentes

1. **OpenAPI/Swagger**
   - Generar spec automáticamente desde código
   - UI interactiva en `/api/docs`

2. **Autenticación para Terceros**
   - API Keys por organización
   - OAuth 2.0 (opcional)
   - Rate limiting por key

3. **Portal de Desarrolladores**
   - Documentación de endpoints
   - Ejemplos de código
   - SDKs (JavaScript, Python)

### Prioridad

Esta fase es de **baja prioridad** mientras el producto está en desarrollo. Se implementará cuando haya necesidad de integraciones externas.

---

## Notas Técnicas

### RLS Context
Usar siempre `RLSContextManager.query()` o `.transaction()`. Solo usar `withBypass()` para JOINs multi-tabla o super_admin.

### HMR en Docker
Hot Module Reload NO funciona en Docker. Siempre reiniciar contenedor + Ctrl+Shift+R.

### Arquitectura Multi-Tenant
- 122 políticas RLS en PostgreSQL
- 4 tablas particionadas por `organizacion_id`
- Aislamiento garantizado a nivel de base de datos
