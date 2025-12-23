# Plan de Gaps Arquitectónicos - Nexo ERP

> **Fecha**: Diciembre 2025
> **Última Revisión**: 21 Diciembre 2025
> **Objetivo**: Cerrar gaps arquitectónicos para competir con Odoo/Power Street
> **Estado**: 🚧 En Progreso - Fase 3B SQL Completada

---

## 📊 Estado Actual del Proyecto

| Fase | Nombre | SQL | Backend | Frontend | Estado |
|------|--------|-----|---------|----------|--------|
| 1 | Workflows de Aprobación | ⬜ | ⬜ | ⬜ | Pendiente |
| 2A | Reportes Multi-Sucursal | ⬜ | ⬜ | ⬜ | Pendiente |
| 2B | Centros de Costo | 🟡 | ⬜ | ⬜ | Parcial (`ciudad_id` eliminado) |
| 3A | Departamentos por Sucursal | ⬜ | ⬜ | ⬜ | Pendiente |
| 3B | Permisos Normalizados | ✅ | 🟡 | ⬜ | SQL Completo, Backend Parcial |

**Leyenda**: ⬜ Pendiente | 🟡 En Progreso | ✅ Completado

---

## ⚡ Resumen de Acciones Críticas - COMPLETADAS

Las siguientes eliminaciones fueron ejecutadas en el código:

| Fase | Archivo | Campo Eliminado | Reemplazo | Estado |
|------|---------|-----------------|-----------|--------|
| 2B | `sql/contabilidad/01-tablas.sql` | `ciudad_id` | `centro_costo_id` | ✅ Eliminado |
| 2B | `sql/contabilidad/03-indices.sql` | `idx_movimientos_ciudad` | N/A | ✅ Eliminado |
| 3B | `sql/profesionales/01-tablas.sql` | `modulos_acceso` | Sistema normalizado | ✅ Eliminado |
| 3B | `sql/profesionales/02-indices.sql` | `idx_profesionales_modulos_gin` | N/A | ✅ Eliminado |
| 3B | `sql/sucursales/01-tablas.sql` | `rol_sucursal`, `permisos_override` | `permisos_usuario_sucursal` | ✅ Eliminado |
| 3B | `sql/organizacion/02-indices.sql` | `idx_profesionales_agendamiento/pos/inventario` | N/A | ✅ Eliminados |

### Archivos SQL Nuevos Creados (Fase 3B)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `sql/nucleo/11-tablas-permisos.sql` | 3 tablas + índices + RLS | ✅ Creado |
| `sql/nucleo/12-funciones-permisos.sql` | 5 funciones + triggers | ✅ Creado |
| `sql/nucleo/13-datos-permisos.sql` | 72 permisos + asignaciones | ✅ Creado |

### Verificación en Base de Datos

```
✅ 72 permisos en catálogo
✅ 162 asignaciones de permisos a roles
✅ 4 roles configurados: admin, propietario, empleado, bot
```

---

## NOTA IMPORTANTE: Inicio desde Cero

Este proyecto se levantará **desde cero**, por lo que:
- No se requieren scripts de migración de datos
- Los esquemas SQL se incluyen directamente en los archivos de creación
- No hay preocupación por compatibilidad hacia atrás con datos existentes
- Se pueden implementar las mejores prácticas desde el inicio sin restricciones legacy

---

## Resumen Ejecutivo

Análisis de la arquitectura actual de Nexo identificó 5 gaps principales que limitan la escalabilidad hacia empresas medianas. Este documento define el plan de implementación priorizado.

### Arquitectura Actual (Fortalezas)

```
Organización (tenant con RLS)
├── Sucursales (1:N) - Multi-sucursal nativo
│   ├── inventario_compartido
│   └── servicios_heredados
├── Departamentos (1:N jerárquico)
│   └── Puestos (1:N)
├── Usuarios (1:N) → usuarios_sucursales (M:N)
└── Profesionales (1:N) → profesionales_sucursales (M:N)
```

### Gaps Identificados

| # | Gap | Prioridad | Esfuerzo | Fase |
|---|-----|-----------|----------|------|
| 1 | Workflows de Aprobación | Alta | Grande | Fase 1 |
| 2 | Consolidación Reportes Multi-Sucursal | Media | Medio | Fase 2 |
| 3 | Centros de Costo | Media | Medio | Fase 2 |
| 4 | Departamentos por Sucursal | Baja | Pequeño | Fase 3 |
| 5 | Permisos Granulares Normalizados | Baja | Medio | Fase 3 |

---

## Análisis de Compatibilidad

Análisis del impacto de cada fase considerando la arquitectura actual del backend y frontend.

### Resumen de Impacto por Fase

| Fase | Estado | Impacto Backend | Impacto Frontend | Notas |
|------|--------|-----------------|------------------|-------|
| 1 - Workflows | ✅ Seguro | Nuevo módulo independiente | Nuevas páginas | Sin cambios a código existente |
| 2A - Reportes | ✅ Seguro | Nuevos endpoints y vistas | Nuevo dashboard | Vistas materializadas no modifican tablas |
| 2B - Centros Costo | ✅ Seguro* | Nueva tabla + FK opcionales | Selector en formularios | *Diseñar desde cero sin `ciudad_id` |
| 3A - Deptos/Sucursal | ✅ Seguro | Columna nullable | Selector opcional | Backward compatible |
| 3B - Permisos | ✅ Seguro** | Nuevo sistema | UI de permisos | **Implementar desde cero sin JSONB |

### Fase 1: Workflows - Análisis Detallado

**Backend:**
- Nuevo módulo `modules/workflows/` con 6 archivos (routes, controller, model, service, validators, middleware)
- Sin dependencias con módulos existentes
- Integración opcional con `notificaciones` existente

**Frontend:**
- Nuevas páginas en `/configuracion/workflows`
- Nueva sección `/bandeja-aprobaciones`
- Componentes reutilizables: `WorkflowEditor`, `ApprovalCard`, `WorkflowStatusBadge`

**Conclusión:** Implementación aislada, sin riesgo.

### Fase 2A: Reportes Multi-Sucursal - Análisis Detallado

**Backend:**
- Nuevos endpoints en `modules/reportes/` (ya existe estructura base)
- Vistas materializadas son read-only, no modifican tablas origen
- pg_cron ya está configurado para otros jobs

**Frontend:**
- Nuevo dashboard `/reportes/consolidado`
- Extensión de componentes de gráficas existentes
- Exportación Excel/PDF usa libs ya integradas

**Conclusión:** Bajo riesgo, extensión de funcionalidad existente.

### Fase 2B: Centros de Costo - Análisis Detallado

**Situación original (con datos existentes):**
- `movimientos_contables.ciudad_id` se usaba como pseudo-centro de costo
- Conflicto potencial al agregar `centro_costo_id`

**Ventaja de inicio desde cero:**
- Eliminar `ciudad_id` de `movimientos_contables`
- Diseñar `centro_costo_id` como campo estándar desde el inicio
- Sin migración de datos legacy

**Diseño recomendado:**
```sql
-- En movimientos_contables (nuevo diseño):
centro_costo_id INTEGER REFERENCES centros_costo(id)  -- Reemplaza ciudad_id
-- ciudad_id se elimina completamente
```

**Conclusión:** Seguro con inicio desde cero.

### Fase 3A: Departamentos por Sucursal - Análisis Detallado

**Backend:**
- Columna `sucursal_id` nullable en `departamentos`
- Queries existentes siguen funcionando (NULL = global)
- Filtro adicional opcional en listados

**Frontend:**
- Selector de sucursal opcional en formulario de departamento
- Sin cambios en otros módulos

**Conclusión:** Cambio menor, backward compatible.

### Fase 3B: Permisos Normalizados - Análisis Detallado

**Situación original (con datos existentes):**
- `profesionales.modulos_acceso` → JSONB con estructura variable
- `usuarios_sucursales.permisos_override` → JSONB
- Migrar JSONB a tablas normalizadas requería scripts complejos

**Ventaja de inicio desde cero:**
- Implementar sistema normalizado desde el día 1
- Sin campos JSONB para permisos
- Tablas: `permisos_catalogo`, `permisos_rol`, `permisos_usuario_sucursal`
- Función `obtener_permiso()` disponible desde el inicio

**Diseño recomendado:**
- Eliminar `modulos_acceso` de `profesionales`
- Eliminar `permisos_override` de `usuarios_sucursales`
- Usar exclusivamente el sistema normalizado

**Conclusión:** Seguro con inicio desde cero, diseño limpio.

### Orden de Implementación Recomendado

```
1. Fase 1: Workflows (independiente, alto valor)
   └── Motor de aprobaciones para órdenes de compra y descuentos

2. Fase 2A: Reportes (extensión natural)
   └── Dashboard consolidado multi-sucursal

3. Fase 2B: Centros de Costo (diseño limpio)
   └── Sin ciudad_id legacy, usar centro_costo_id desde inicio

4. Fase 3A: Departamentos por Sucursal
   └── Columna opcional, bajo esfuerzo

5. Fase 3B: Permisos Normalizados
   └── Sistema limpio sin JSONB desde el inicio
```

---

## Fase 1: Motor de Workflows de Aprobación

### Objetivo
Implementar un sistema de workflows configurable que permita definir flujos de aprobación para cualquier entidad del sistema.

### Casos de Uso Prioritarios

1. **Órdenes de Compra**
   ```
   Empleado crea → Gerente aprueba (>$5,000) → Finanzas valida → Ejecutar
   ```

2. **Descuentos en POS**
   ```
   Cajero solicita descuento >20% → Gerente aprueba → Aplicar
   ```

3. **Cancelación de Citas**
   ```
   Recepcionista cancela → Notificar cliente → Registrar motivo
   ```

4. **Solicitudes de Vacaciones** (futuro)
   ```
   Empleado solicita → Supervisor aprueba → RRHH registra
   ```

### Modelo de Datos

```sql
-- ====================================================================
-- MÓDULO WORKFLOWS - TABLAS PRINCIPALES
-- ====================================================================

-- Definición de workflows por organización
CREATE TABLE workflow_definiciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Configuración
    entidad VARCHAR(50) NOT NULL,  -- 'ordenes_compra', 'descuentos', 'citas', etc.
    evento_trigger VARCHAR(50) NOT NULL,  -- 'crear', 'actualizar', 'campo_cambio'
    campo_trigger VARCHAR(50),  -- Para 'campo_cambio': nombre del campo

    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,

    -- Auditoría
    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organizacion_id, codigo)
);

-- Pasos/Nodos del workflow
CREATE TABLE workflow_pasos (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflow_definiciones(id) ON DELETE CASCADE,

    -- Posición
    orden INTEGER NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,

    -- Tipo de paso
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
        'inicio',           -- Punto de entrada
        'aprobacion',       -- Requiere aprobación manual
        'condicion',        -- Bifurcación automática
        'accion',           -- Ejecuta acción automática
        'notificacion',     -- Envía notificación
        'fin'               -- Punto de salida
    )),

    -- Configuración de aprobación (si tipo = 'aprobacion')
    aprobador_tipo VARCHAR(30) CHECK (aprobador_tipo IN (
        'rol',              -- Cualquier usuario con el rol
        'usuario',          -- Usuario específico
        'supervisor',       -- Supervisor del solicitante
        'gerente_sucursal', -- Gerente de la sucursal
        'gerente_depto',    -- Gerente del departamento
        'campo_entidad'     -- Campo de la entidad (ej: ordenes_compra.aprobador_id)
    )),
    aprobador_valor VARCHAR(100),  -- ID de usuario, nombre de rol, nombre de campo

    -- Condiciones (si tipo = 'condicion')
    condicion_expresion JSONB,  -- {"campo": "monto", "operador": ">", "valor": 5000}

    -- Acción automática (si tipo = 'accion')
    accion_tipo VARCHAR(50),  -- 'cambiar_estado', 'enviar_email', 'webhook', 'funcion'
    accion_config JSONB,

    -- Timeouts
    timeout_horas INTEGER,  -- NULL = sin timeout
    accion_timeout VARCHAR(30) CHECK (accion_timeout IN ('aprobar', 'rechazar', 'escalar', 'notificar')),

    -- Siguiente paso (para flujo lineal)
    siguiente_paso_aprobado INTEGER REFERENCES workflow_pasos(id),
    siguiente_paso_rechazado INTEGER REFERENCES workflow_pasos(id),

    UNIQUE(workflow_id, codigo),
    UNIQUE(workflow_id, orden)
);

-- Transiciones condicionales (para bifurcaciones)
CREATE TABLE workflow_transiciones (
    id SERIAL PRIMARY KEY,
    paso_origen_id INTEGER NOT NULL REFERENCES workflow_pasos(id) ON DELETE CASCADE,
    paso_destino_id INTEGER NOT NULL REFERENCES workflow_pasos(id) ON DELETE CASCADE,

    -- Condición para esta transición
    condicion JSONB NOT NULL,  -- {"campo": "monto", "operador": ">=", "valor": 10000}
    prioridad INTEGER DEFAULT 0,  -- Mayor prioridad se evalúa primero

    UNIQUE(paso_origen_id, paso_destino_id)
);

-- Instancias de workflow en ejecución
CREATE TABLE workflow_instancias (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflow_definiciones(id),
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),

    -- Entidad asociada
    entidad_tipo VARCHAR(50) NOT NULL,
    entidad_id INTEGER NOT NULL,

    -- Estado actual
    paso_actual_id INTEGER REFERENCES workflow_pasos(id),
    estado VARCHAR(30) NOT NULL DEFAULT 'en_proceso' CHECK (estado IN (
        'en_proceso',
        'completado',
        'rechazado',
        'cancelado',
        'expirado'
    )),

    -- Metadata
    datos_contexto JSONB DEFAULT '{}',  -- Snapshot de datos al iniciar

    -- Auditoría
    iniciado_por INTEGER REFERENCES usuarios(id),
    iniciado_en TIMESTAMPTZ DEFAULT NOW(),
    completado_en TIMESTAMPTZ,

    -- Índice para búsqueda rápida
    UNIQUE(entidad_tipo, entidad_id, workflow_id, estado)  -- Solo una instancia activa por entidad
);

-- Historial de acciones/decisiones
CREATE TABLE workflow_historial (
    id BIGSERIAL PRIMARY KEY,
    instancia_id INTEGER NOT NULL REFERENCES workflow_instancias(id) ON DELETE CASCADE,
    paso_id INTEGER NOT NULL REFERENCES workflow_pasos(id),

    -- Acción tomada
    accion VARCHAR(30) NOT NULL CHECK (accion IN (
        'iniciado',
        'aprobado',
        'rechazado',
        'devuelto',
        'escalado',
        'timeout',
        'automatico',
        'cancelado'
    )),

    -- Quién actuó
    actor_id INTEGER REFERENCES usuarios(id),  -- NULL para acciones automáticas
    actor_tipo VARCHAR(30) DEFAULT 'usuario' CHECK (actor_tipo IN ('usuario', 'sistema', 'timeout')),

    -- Detalles
    comentario TEXT,
    datos_adicionales JSONB,

    -- Timestamp
    ejecutado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Para auditoría
    ip_origen INET,
    user_agent TEXT
);

-- Delegaciones temporales (vacaciones, etc.)
CREATE TABLE workflow_delegaciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),

    delegador_id INTEGER NOT NULL REFERENCES usuarios(id),
    delegado_id INTEGER NOT NULL REFERENCES usuarios(id),

    -- Alcance
    workflow_id INTEGER REFERENCES workflow_definiciones(id),  -- NULL = todos los workflows

    -- Vigencia
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    motivo VARCHAR(200),

    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    CHECK(fecha_fin >= fecha_inicio),
    CHECK(delegador_id != delegado_id)
);

-- ====================================================================
-- ÍNDICES
-- ====================================================================

CREATE INDEX idx_wf_definiciones_org ON workflow_definiciones(organizacion_id) WHERE activo = TRUE;
CREATE INDEX idx_wf_definiciones_entidad ON workflow_definiciones(organizacion_id, entidad) WHERE activo = TRUE;

CREATE INDEX idx_wf_pasos_workflow ON workflow_pasos(workflow_id, orden);
CREATE INDEX idx_wf_pasos_tipo ON workflow_pasos(workflow_id, tipo);

CREATE INDEX idx_wf_instancias_entidad ON workflow_instancias(entidad_tipo, entidad_id);
CREATE INDEX idx_wf_instancias_estado ON workflow_instancias(organizacion_id, estado) WHERE estado = 'en_proceso';
CREATE INDEX idx_wf_instancias_paso ON workflow_instancias(paso_actual_id) WHERE estado = 'en_proceso';

CREATE INDEX idx_wf_historial_instancia ON workflow_historial(instancia_id, ejecutado_en DESC);
CREATE INDEX idx_wf_historial_actor ON workflow_historial(actor_id, ejecutado_en DESC) WHERE actor_id IS NOT NULL;

CREATE INDEX idx_wf_delegaciones_activas ON workflow_delegaciones(delegador_id, fecha_inicio, fecha_fin)
    WHERE activo = TRUE;

-- ====================================================================
-- RLS POLICIES
-- ====================================================================

ALTER TABLE workflow_definiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_pasos ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instancias ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_delegaciones ENABLE ROW LEVEL SECURITY;

-- Políticas base (aislamiento por organización)
CREATE POLICY wf_definiciones_isolation ON workflow_definiciones
    FOR ALL TO saas_app
    USING (organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0));

CREATE POLICY wf_instancias_isolation ON workflow_instancias
    FOR ALL TO saas_app
    USING (organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0));
```

### API Backend

```
POST   /api/workflows                    - Crear definición de workflow
GET    /api/workflows                    - Listar workflows de la org
GET    /api/workflows/:id                - Obtener workflow con pasos
PUT    /api/workflows/:id                - Actualizar workflow
DELETE /api/workflows/:id                - Eliminar workflow

POST   /api/workflows/:id/instancias     - Iniciar instancia manualmente
GET    /api/workflows/pendientes         - Mis aprobaciones pendientes
POST   /api/workflows/instancias/:id/aprobar   - Aprobar paso actual
POST   /api/workflows/instancias/:id/rechazar  - Rechazar paso actual
POST   /api/workflows/instancias/:id/devolver  - Devolver al paso anterior

GET    /api/workflows/instancias/:id/historial - Ver historial de instancia
```

### Componentes Frontend

```
/configuracion/workflows           - Lista de workflows
/configuracion/workflows/nuevo     - Editor visual de workflow
/configuracion/workflows/:id       - Editar workflow existente

/bandeja-aprobaciones              - Dashboard de aprobaciones pendientes
/bandeja-aprobaciones/:id          - Detalle de aprobación + acciones
```

### Tareas de Implementación

- [ ] **SQL**: Crear tablas y políticas RLS
- [ ] **SQL**: Funciones para evaluar condiciones JSONB
- [ ] **SQL**: Trigger genérico para iniciar workflows
- [ ] **Backend**: Modelo y rutas CRUD workflows
- [ ] **Backend**: Servicio de motor de workflows
- [ ] **Backend**: Job para timeouts automáticos
- [ ] **Frontend**: Editor visual de workflows (drag & drop)
- [ ] **Frontend**: Bandeja de aprobaciones
- [ ] **Frontend**: Widget de estado en formularios
- [ ] **Notificaciones**: Integrar con sistema de notificaciones existente
- [ ] **Tests**: Unitarios para motor de evaluación
- [ ] **Tests**: E2E para flujos completos

### Estimación

| Componente | Tiempo Estimado |
|------------|-----------------|
| Base de datos | 2 días |
| Backend API | 4 días |
| Motor de workflows | 3 días |
| Frontend editor | 5 días |
| Frontend bandeja | 2 días |
| Integraciones | 2 días |
| Testing | 2 días |
| **Total** | **~20 días** |

---

## Fase 2A: Consolidación de Reportes Multi-Sucursal

### Objetivo
Proporcionar reportes comparativos y consolidados para organizaciones con múltiples sucursales.

### Modelo de Datos

```sql
-- ====================================================================
-- METAS POR SUCURSAL
-- ====================================================================

CREATE TABLE metas_sucursales (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,

    -- Periodo
    periodo_tipo VARCHAR(20) NOT NULL CHECK (periodo_tipo IN ('diario', 'semanal', 'mensual', 'trimestral', 'anual')),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,

    -- Tipo de meta
    tipo_meta VARCHAR(50) NOT NULL,  -- 'ventas', 'citas_completadas', 'clientes_nuevos', 'ticket_promedio'

    -- Valores
    valor_meta NUMERIC(14,2) NOT NULL,
    valor_minimo NUMERIC(14,2),  -- Umbral mínimo aceptable
    valor_stretch NUMERIC(14,2), -- Meta ambiciosa

    -- Auditoría
    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(sucursal_id, periodo_tipo, periodo_inicio, tipo_meta)
);

-- ====================================================================
-- VISTAS MATERIALIZADAS PARA REPORTES
-- ====================================================================

-- Ventas consolidadas por sucursal/mes
CREATE MATERIALIZED VIEW vm_ventas_sucursales_mensual AS
SELECT
    v.organizacion_id,
    v.sucursal_id,
    s.nombre AS sucursal_nombre,
    s.es_matriz,
    DATE_TRUNC('month', v.fecha)::DATE AS periodo,

    -- Métricas de ventas
    COUNT(*) AS num_transacciones,
    SUM(v.total) AS total_ventas,
    SUM(v.descuento_total) AS total_descuentos,
    AVG(v.total) AS ticket_promedio,

    -- Métricas de productos
    SUM(vi.cantidad) AS unidades_vendidas,
    COUNT(DISTINCT v.cliente_id) AS clientes_unicos

FROM ventas_pos v
JOIN sucursales s ON v.sucursal_id = s.id
LEFT JOIN ventas_pos_items vi ON vi.venta_id = v.id
WHERE v.estado = 'completada'
GROUP BY v.organizacion_id, v.sucursal_id, s.nombre, s.es_matriz, DATE_TRUNC('month', v.fecha);

CREATE UNIQUE INDEX idx_vm_ventas_pk ON vm_ventas_sucursales_mensual(organizacion_id, sucursal_id, periodo);
CREATE INDEX idx_vm_ventas_org ON vm_ventas_sucursales_mensual(organizacion_id, periodo);

-- Citas consolidadas por sucursal/mes
CREATE MATERIALIZED VIEW vm_citas_sucursales_mensual AS
SELECT
    c.organizacion_id,
    c.sucursal_id,
    s.nombre AS sucursal_nombre,
    DATE_TRUNC('month', c.fecha_cita)::DATE AS periodo,

    -- Conteos por estado
    COUNT(*) FILTER (WHERE c.estado = 'completada') AS citas_completadas,
    COUNT(*) FILTER (WHERE c.estado = 'cancelada') AS citas_canceladas,
    COUNT(*) FILTER (WHERE c.estado = 'no_asistio') AS citas_no_asistio,
    COUNT(*) AS citas_totales,

    -- Métricas financieras
    SUM(c.precio_total) FILTER (WHERE c.estado = 'completada') AS ingresos_citas,
    AVG(c.precio_total) FILTER (WHERE c.estado = 'completada') AS ticket_promedio,

    -- Métricas operativas
    AVG(c.duracion_total_minutos) FILTER (WHERE c.estado = 'completada') AS duracion_promedio,
    COUNT(DISTINCT c.cliente_id) AS clientes_unicos,
    COUNT(DISTINCT c.profesional_id) AS profesionales_activos

FROM citas c
LEFT JOIN sucursales s ON c.sucursal_id = s.id
GROUP BY c.organizacion_id, c.sucursal_id, s.nombre, DATE_TRUNC('month', c.fecha_cita);

CREATE UNIQUE INDEX idx_vm_citas_pk ON vm_citas_sucursales_mensual(organizacion_id, sucursal_id, periodo);

-- ====================================================================
-- FUNCIÓN PARA REFRESCAR VISTAS
-- ====================================================================

CREATE OR REPLACE FUNCTION refresh_vistas_reportes()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vm_ventas_sucursales_mensual;
    REFRESH MATERIALIZED VIEW CONCURRENTLY vm_citas_sucursales_mensual;
END;
$$ LANGUAGE plpgsql;

-- Programar refresh cada hora (pg_cron)
-- SELECT cron.schedule('refresh-reportes', '0 * * * *', 'SELECT refresh_vistas_reportes()');
```

### API Reportes

```
GET /api/reportes/consolidado/ventas?periodo=2025-12
GET /api/reportes/consolidado/citas?periodo=2025-12
GET /api/reportes/comparativo/sucursales?desde=2025-01&hasta=2025-12
GET /api/reportes/metas/cumplimiento?periodo=2025-12
```

### Tareas de Implementación

- [ ] Crear tabla `metas_sucursales`
- [ ] Crear vistas materializadas
- [ ] Configurar pg_cron para refresh
- [ ] API de reportes consolidados
- [ ] Dashboard multi-sucursal en frontend
- [ ] Exportación a Excel/PDF

### Estimación: ~8 días

---

## Fase 2B: Centros de Costo

### Objetivo
Permitir asignación de ingresos/gastos a centros de costo más granulares que la sucursal.

### ⚠️ Acción Requerida: Eliminar ciudad_id de movimientos_contables

**Archivo a modificar**: `sql/contabilidad/01-tablas.sql`

El campo `ciudad_id` (línea ~374) actualmente se usa como pseudo centro de costo.
Debe ser **eliminado completamente** y reemplazado por `centro_costo_id`.

```sql
-- ❌ ELIMINAR esta línea de movimientos_contables:
ciudad_id INTEGER REFERENCES ciudades(id),  -- Ciudad/sucursal del movimiento

-- ✅ REEMPLAZAR por:
centro_costo_id INTEGER REFERENCES centros_costo(id) ON DELETE SET NULL,
```

**Justificación**: Al iniciar desde cero, no hay razón para mantener un campo legacy.
El nuevo `centro_costo_id` ofrece mayor flexibilidad (proyectos, líneas de negocio, etc.).

### Modelo de Datos

```sql
-- ====================================================================
-- CENTROS DE COSTO
-- ====================================================================

CREATE TABLE centros_costo (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Clasificación
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
        'sucursal',      -- Mapea a una sucursal
        'departamento',  -- Área funcional
        'proyecto',      -- Proyecto temporal
        'linea_negocio', -- Línea de productos/servicios
        'cliente',       -- Centro por cliente (B2B)
        'otro'
    )),

    -- Relaciones opcionales
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,
    departamento_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,

    -- Jerarquía
    parent_id INTEGER REFERENCES centros_costo(id) ON DELETE SET NULL,
    nivel INTEGER DEFAULT 1,  -- Calculado automáticamente
    path_codigo VARCHAR(200), -- 'CORP/NORTE/VENTAS' para queries jerárquicas

    -- Presupuesto
    presupuesto_anual NUMERIC(14,2),
    presupuesto_mensual NUMERIC(14,2) GENERATED ALWAYS AS (presupuesto_anual / 12) STORED,

    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    fecha_inicio DATE,
    fecha_fin DATE,  -- Para proyectos temporales

    -- Auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organizacion_id, codigo)
);

-- Trigger para calcular path_codigo y nivel
CREATE OR REPLACE FUNCTION calcular_path_centro_costo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.nivel := 1;
        NEW.path_codigo := NEW.codigo;
    ELSE
        SELECT nivel + 1, path_codigo || '/' || NEW.codigo
        INTO NEW.nivel, NEW.path_codigo
        FROM centros_costo
        WHERE id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_centros_costo_path
    BEFORE INSERT OR UPDATE OF parent_id, codigo ON centros_costo
    FOR EACH ROW EXECUTE FUNCTION calcular_path_centro_costo();

-- ====================================================================
-- INTEGRACIÓN CON TABLAS TRANSACCIONALES (Diseño desde cero)
-- ====================================================================
-- Nota: Las siguientes columnas se agregan directamente en los CREATE TABLE
-- de sus respectivos módulos, no como ALTER TABLE.

-- En movimientos_contables (sql/contabilidad/01-tablas-contabilidad.sql):
-- centro_costo_id INTEGER REFERENCES centros_costo(id) ON DELETE SET NULL
-- (Nota: ciudad_id NO se incluye - usar centro_costo_id exclusivamente)

-- En ventas_pos (sql/pos/01-tablas-ventas.sql):
-- centro_costo_id INTEGER REFERENCES centros_costo(id) ON DELETE SET NULL

-- En ordenes_compra (sql/inventario/01-tablas-inventario.sql):
-- centro_costo_id INTEGER REFERENCES centros_costo(id) ON DELETE SET NULL

-- Índices recomendados en cada tabla:
CREATE INDEX idx_movimientos_centro_costo ON movimientos_contables(centro_costo_id)
    WHERE centro_costo_id IS NOT NULL;

-- Vista de saldos por centro de costo
CREATE VIEW v_saldos_centros_costo AS
SELECT
    cc.organizacion_id,
    cc.id AS centro_costo_id,
    cc.codigo,
    cc.nombre,
    cc.tipo,
    cc.path_codigo,
    cc.presupuesto_mensual,
    DATE_TRUNC('month', mc.fecha)::DATE AS periodo,
    SUM(mc.debe) AS total_debe,
    SUM(mc.haber) AS total_haber,
    SUM(mc.debe) - SUM(mc.haber) AS saldo
FROM centros_costo cc
LEFT JOIN movimientos_contables mc ON mc.centro_costo_id = cc.id
GROUP BY cc.id, cc.organizacion_id, cc.codigo, cc.nombre, cc.tipo,
         cc.path_codigo, cc.presupuesto_mensual, DATE_TRUNC('month', mc.fecha);
```

### Tareas de Implementación

#### Paso 1: Eliminar ciudad_id de movimientos_contables ✅ COMPLETADO (21 Dic 2025)
- [x] **SQL**: Eliminar `ciudad_id INTEGER REFERENCES ciudades(id)` de `sql/contabilidad/01-tablas.sql`
- [x] **SQL**: Eliminar índice `idx_movimientos_ciudad` de `sql/contabilidad/03-indices.sql`

#### Paso 2: Crear sistema de centros de costo (PENDIENTE)
- [ ] **SQL**: Crear tabla `centros_costo` en `sql/contabilidad/`
- [ ] **SQL**: Trigger para path jerárquico automático
- [ ] **SQL**: Agregar `centro_costo_id` a tablas transaccionales:
  - `movimientos_contables` (reemplazo de ciudad_id)
  - `ventas_pos` (opcional)
  - `ordenes_compra` (opcional)
- [ ] **SQL**: Vista `v_saldos_centros_costo`

#### Paso 3: Integración backend/frontend (PENDIENTE)
- [ ] **Backend**: CRUD de centros de costo
- [ ] **Frontend**: Selector de centro de costo en formularios de ventas/contabilidad
- [ ] **Frontend**: Reportes por centro de costo

### Estimación Restante: ~5 días

---

## Fase 3A: Departamentos por Sucursal

### Objetivo
Permitir que departamentos existan a nivel de sucursal, no solo a nivel organización.

### Diseño (desde cero)

```sql
-- En sql/nucleo/01-tablas-base.sql, la tabla departamentos incluye:
CREATE TABLE departamentos (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Relación opcional con sucursal
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE CASCADE,
    -- NULL = departamento global de la organización
    -- Con valor = departamento específico de sucursal

    -- ... resto de columnas
    parent_id INTEGER REFERENCES departamentos(id),
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,

    UNIQUE(organizacion_id, codigo)
);

CREATE INDEX idx_departamentos_sucursal ON departamentos(sucursal_id)
    WHERE sucursal_id IS NOT NULL;
```

### Comportamiento
- `sucursal_id = NULL` → Departamento global de la organización
- `sucursal_id = X` → Departamento específico de esa sucursal
- Compatible con estructura jerárquica existente (parent_id)

### Estimación: ~2 días

---

## Fase 3B: Permisos Granulares Normalizados

### Objetivo
Implementar un sistema de permisos normalizado desde el inicio para mejor queryability, auditoría y mantenibilidad.

### ⚠️ Acción Requerida: Eliminar Campos JSONB de Permisos

Los siguientes campos JSONB deben ser **eliminados completamente** de los archivos SQL:

#### 1. Eliminar `modulos_acceso` de profesionales

**Archivo**: `sql/profesionales/01-tablas.sql` (líneas 103-111)

```sql
-- ❌ ELIMINAR completamente esta sección:
-- ====================================================================
-- 🎛️ SECCIÓN: CONTROL DE ACCESO A MÓDULOS (★ CONTROL PRINCIPAL ★)
-- ====================================================================
-- Determina QUÉ puede hacer el empleado. NO depende del campo tipo.
-- ────────────────────────────────────────────────────────────────────
modulos_acceso JSONB DEFAULT '{"agendamiento": true, "pos": false, "inventario": false}',
                                           -- agendamiento: puede atender citas
                                           -- pos: puede registrar ventas
                                           -- inventario: puede gestionar stock
```

**También eliminar** los comentarios relacionados (líneas 186-187):
```sql
-- ❌ ELIMINAR:
COMMENT ON COLUMN profesionales.modulos_acceso IS
'★ Control principal de acceso. Determina qué módulos puede usar el empleado.';
```

#### 2. Eliminar `permisos_override` de usuarios_sucursales

**Archivo**: `sql/sucursales/01-tablas.sql` (líneas 117-121)

```sql
-- ❌ ELIMINAR estas líneas:
-- 🔐 PERMISOS OVERRIDE (opcional)
-- NULL = usa rol base del usuario
-- Con valor = override para esta sucursal específica
rol_sucursal rol_usuario DEFAULT NULL,
permisos_override JSONB DEFAULT '{}',
```

**También eliminar** los comentarios relacionados (líneas 135-136):
```sql
-- ❌ ELIMINAR:
COMMENT ON COLUMN usuarios_sucursales.rol_sucursal IS 'Override del rol base del usuario para esta sucursal. NULL = usar rol base.';
COMMENT ON COLUMN usuarios_sucursales.permisos_override IS 'Permisos específicos adicionales para esta sucursal';
```

### Justificación

| Campo Eliminado | Reemplazo | Beneficio |
|-----------------|-----------|-----------|
| `modulos_acceso` | `permisos_catalogo` + `permisos_rol` | Queryable, auditable, extensible |
| `permisos_override` | `permisos_usuario_sucursal` | Normalizado, con historial de quién otorgó |
| `rol_sucursal` | `permisos_usuario_sucursal` | Granularidad a nivel permiso, no rol completo |

### Modelo Normalizado

```sql
-- Catálogo de permisos
CREATE TABLE permisos_catalogo (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo_valor VARCHAR(20) DEFAULT 'booleano' CHECK (tipo_valor IN ('booleano', 'numerico', 'texto', 'lista')),
    valor_default JSONB,
    orden_display INTEGER DEFAULT 0
);

-- Permisos por rol (plantilla)
CREATE TABLE permisos_rol (
    id SERIAL PRIMARY KEY,
    rol rol_usuario NOT NULL,
    permiso_id INTEGER NOT NULL REFERENCES permisos_catalogo(id),
    valor JSONB NOT NULL,
    UNIQUE(rol, permiso_id)
);

-- Override por usuario en sucursal específica
CREATE TABLE permisos_usuario_sucursal (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    permiso_id INTEGER NOT NULL REFERENCES permisos_catalogo(id),
    valor JSONB NOT NULL,
    otorgado_por INTEGER REFERENCES usuarios(id),
    otorgado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, sucursal_id, permiso_id)
);

-- Función para obtener permiso efectivo
CREATE OR REPLACE FUNCTION obtener_permiso(
    p_usuario_id INTEGER,
    p_sucursal_id INTEGER,
    p_codigo_permiso VARCHAR(50)
) RETURNS JSONB AS $$
DECLARE
    v_valor JSONB;
    v_rol rol_usuario;
BEGIN
    -- 1. Buscar override específico
    SELECT valor INTO v_valor
    FROM permisos_usuario_sucursal pus
    JOIN permisos_catalogo pc ON pus.permiso_id = pc.id
    WHERE pus.usuario_id = p_usuario_id
    AND pus.sucursal_id = p_sucursal_id
    AND pc.codigo = p_codigo_permiso;

    IF FOUND THEN RETURN v_valor; END IF;

    -- 2. Buscar por rol del usuario
    SELECT u.rol INTO v_rol FROM usuarios u WHERE u.id = p_usuario_id;

    SELECT pr.valor INTO v_valor
    FROM permisos_rol pr
    JOIN permisos_catalogo pc ON pr.permiso_id = pc.id
    WHERE pr.rol = v_rol AND pc.codigo = p_codigo_permiso;

    IF FOUND THEN RETURN v_valor; END IF;

    -- 3. Retornar default del catálogo
    SELECT valor_default INTO v_valor
    FROM permisos_catalogo WHERE codigo = p_codigo_permiso;

    RETURN COALESCE(v_valor, 'false'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE;
```

### Datos Iniciales del Catálogo

```sql
-- Insertar en sql/nucleo/XX-datos-permisos.sql
INSERT INTO permisos_catalogo (codigo, modulo, nombre, tipo_valor, valor_default) VALUES
-- Acceso a módulos
('pos', 'acceso', 'Acceso a Punto de Venta', 'booleano', 'false'),
('inventario', 'acceso', 'Acceso a Inventario', 'booleano', 'false'),
('agendamiento', 'acceso', 'Acceso a Agendamiento', 'booleano', 'true'),
('contabilidad', 'acceso', 'Acceso a Contabilidad', 'booleano', 'false'),
('reportes', 'acceso', 'Acceso a Reportes', 'booleano', 'false'),

-- Permisos específicos
('puede_cancelar_citas', 'agendamiento', 'Puede cancelar citas', 'booleano', 'false'),
('max_descuento', 'pos', 'Descuento máximo permitido (%)', 'numerico', '0'),
('puede_devolver', 'pos', 'Puede procesar devoluciones', 'booleano', 'false'),
('puede_aprobar_compras', 'inventario', 'Puede aprobar órdenes de compra', 'booleano', 'false'),
('limite_aprobacion', 'inventario', 'Límite de aprobación ($)', 'numerico', '0');
```

### Tareas de Implementación

#### Paso 1: Eliminar campos JSONB ✅ COMPLETADO (21 Dic 2025)
- [x] **SQL**: Eliminar `modulos_acceso` de `sql/profesionales/01-tablas.sql`
- [x] **SQL**: Eliminar `permisos_override` y `rol_sucursal` de `sql/sucursales/01-tablas.sql`
- [x] **SQL**: Eliminar índices relacionados (`idx_profesionales_modulos_gin`, etc.)
- [x] **SQL**: Eliminar comentarios relacionados de ambos archivos

#### Paso 2: Crear sistema normalizado SQL ✅ COMPLETADO (21 Dic 2025)
- [x] **SQL**: Crear tablas `permisos_catalogo`, `permisos_rol`, `permisos_usuario_sucursal`
  - Archivo: `sql/nucleo/11-tablas-permisos.sql`
- [x] **SQL**: Función `obtener_permiso()` + funciones auxiliares
  - Archivo: `sql/nucleo/12-funciones-permisos.sql`
  - Funciones: `obtener_permiso()`, `tiene_permiso()`, `obtener_valor_permiso_numerico()`, `obtener_permisos_usuario()`, `verificar_permiso_middleware()`
- [x] **SQL**: Datos iniciales del catálogo (72 permisos, 10 módulos, 4 roles)
  - Archivo: `sql/nucleo/13-datos-permisos.sql`
- [x] **SQL**: Agregar a `init-data.sh` para auto-ejecución

#### Paso 3: Backend 🟡 EN PROGRESO
- [x] **Backend**: Modelo `permisos.model.js`
  - Archivo: `backend/app/modules/permisos/models/permisos.model.js`
- [x] **Backend**: Controlador `permisos.controller.js`
  - Archivo: `backend/app/modules/permisos/controllers/permisos.controller.js`
- [x] **Backend**: Rutas y schemas de validación
  - Archivos: `backend/app/modules/permisos/routes/`, `backend/app/modules/permisos/schemas/`
- [x] **Backend**: Middleware de verificación de permisos
  - Archivo: `backend/app/middleware/permisos.js`
  - Exports: `verificarPermiso()`, `verificarAlgunPermiso()`, `verificarTodosPermisos()`, `verificarLimiteNumerico()`
- [x] **Backend**: Manifest para auto-registro de rutas
  - Archivo: `backend/app/modules/permisos/manifest.json`
- [ ] **Backend**: Probar endpoints de API
- [ ] **Backend**: Integrar middleware en rutas existentes

#### Paso 4: Frontend (PENDIENTE)
- [ ] **Frontend**: UI de gestión de permisos por rol
- [ ] **Frontend**: UI de override de permisos por usuario/sucursal
- [ ] **Frontend**: Selector de permisos en formularios de usuario

### Estimación Restante: ~3 días (Backend testing + Frontend)

---

## Cronograma Propuesto

> **Nota**: Al iniciar desde cero, todas las fases se implementan directamente en el diseño inicial.
> Los tiempos reflejan el desarrollo, no migraciones.

```
Fase 1: Workflows de Aprobación (~20 días)
├── SQL: Tablas y políticas RLS (2 días)
├── Backend: Motor de workflows (7 días)
└── Frontend: Editor + bandeja (11 días)

Fase 2A: Reportes Multi-Sucursal (~8 días)
├── SQL: Vistas materializadas + pg_cron (2 días)
├── Backend: API reportes consolidados (3 días)
└── Frontend: Dashboard multi-sucursal (3 días)

Fase 2B: Centros de Costo (~6 días)
├── SQL: Tabla + triggers + vistas (2 días)
├── Backend: CRUD centros de costo (2 días)
└── Frontend: Selectores + reportes (2 días)

Fase 3A: Departamentos por Sucursal (~2 días)
├── SQL: Columna sucursal_id + índice (0.5 días)
├── Backend: Filtro opcional (0.5 días)
└── Frontend: Selector en formulario (1 día)

Fase 3B: Permisos Normalizados (~5 días)
├── SQL: 3 tablas + función obtener_permiso (1.5 días)
├── Backend: API + middleware (2 días)
└── Frontend: UI gestión permisos (1.5 días)

TOTAL ESTIMADO: ~41 días de desarrollo
```

---

## Métricas de Éxito

| Fase | Métrica | Objetivo |
|------|---------|----------|
| Workflows | Workflows activos por org | >2 en 30 días post-launch |
| Workflows | Tiempo promedio de aprobación | <4 horas |
| Reportes | Uso de dashboard consolidado | >50% de orgs multi-sucursal |
| Centros Costo | Orgs con >3 centros configurados | >20% de orgs Pro |

---

## Dependencias y Riesgos

### Dependencias
- **Workflows**: Sistema de notificaciones existente
- **Reportes**: pg_cron configurado para refresh
- **Centros Costo**: Módulo contabilidad funcional

### Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Complejidad del editor visual de workflows | Media | Alto | MVP con editor simple, mejorar iterativamente |
| Performance de vistas materializadas | Baja | Medio | Índices apropiados, refresh incremental |
| Curva de aprendizaje sistema de permisos | Baja | Bajo | Documentación clara, UI intuitiva |

---

## Referencias

- [Análisis BD Nexo - Diciembre 2025](./ANALISIS_BD_NEXO.md)
- [Odoo Workflow Engine](https://www.odoo.com/documentation/18.0/developer/reference/backend/workflows.html)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
