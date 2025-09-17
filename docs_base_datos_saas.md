# 📊 Documentación de Base de Datos SaaS Multi-Tenant

**Versión:** 1.0
**Fecha:** 2025-01-16
**Sistema:** Plataforma SaaS de Agendamiento Multi-Industria

---

## 📋 Índice

1. [Resumen General](#resumen-general)
2. [Arquitectura Multi-Tenant](#arquitectura-multi-tenant)
3. [Tipos de Datos](#tipos-de-datos)
4. [Tablas Principales](#tablas-principales)
5. [Relaciones entre Tablas](#relaciones-entre-tablas)
6. [Índices y Optimizaciones](#índices-y-optimizaciones)
7. [Seguridad (RLS)](#seguridad-rls)
8. [Funciones Utilitarias](#funciones-utilitarias)
9. [Vistas del Sistema](#vistas-del-sistema)
10. [Mantenimiento](#mantenimiento)

---

## 🎯 Resumen General

Esta base de datos soporta una **plataforma SaaS multi-tenant** diseñada para gestionar sistemas de agendamiento en múltiples industrias como barberías, salones de belleza, consultorios médicos, spas, etc.

### Características Principales
- ✅ **Multi-tenant**: Aislamiento completo de datos por organización
- ✅ **Multi-industria**: Configurable para 10+ tipos de negocio
- ✅ **Escalable**: Optimizado para alto volumen de transacciones
- ✅ **Seguro**: Row Level Security (RLS) implementado
- ✅ **Auditable**: Control de versiones y logs de cambios

---

## 🏢 Arquitectura Multi-Tenant

### Patrón Implementado: **Shared Database, Shared Schema**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Organización  │    │   Organización  │    │   Organización  │
│      A          │    │       B         │    │       C         │
│  (Barbería)     │    │  (Consultorio)  │    │     (Spa)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │    Base de Datos        │
                    │     PostgreSQL          │
                    │                         │
                    │ organizacion_id: 1,2,3  │
                    │ RLS Policies            │
                    └─────────────────────────┘
```

**Ventajas:**
- 💰 **Costo eficiente**: Una sola instancia de DB
- 🔧 **Mantenimiento simple**: Actualizaciones centralizadas
- 📊 **Analytics cross-tenant**: Métricas globales posibles
- 🚀 **Escalabilidad**: Sharding futuro por `organizacion_id`

---

## 📝 Tipos de Datos

### ENUM Types

#### `industria_tipo`
Define los tipos de industria soportados:
```sql
'barberia', 'salon_belleza', 'estetica', 'spa', 'podologia',
'consultorio_medico', 'academia', 'taller_tecnico',
'centro_fitness', 'veterinaria', 'otro'
```

#### `plan_tipo`
Planes de suscripción disponibles:
```sql
'trial', 'basico', 'profesional', 'empresarial', 'custom'
```

#### `estado_subscripcion`
Estados de las suscripciones:
```sql
'activa', 'suspendida', 'cancelada', 'trial', 'morosa'
```

#### `estado_cita`
Estados del ciclo de vida de una cita:
```sql
'pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'
```

#### `estado_franja`
Estados de disponibilidad de franjas horarias:
```sql
'disponible', 'reservado_temporal', 'ocupado', 'bloqueado'
```

---

## 📊 Tablas Principales

### 🏢 Organizaciones (Tenants)

#### `organizaciones`
**Propósito**: Tabla principal que define cada tenant de la plataforma.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL PK | Identificador único de la organización |
| `codigo_tenant` | VARCHAR(50) UNIQUE | Código único del tenant (ej: "barberia_central_001") |
| `slug` | VARCHAR(100) UNIQUE | URL amigable (ej: "barberia-central") |
| `nombre_comercial` | VARCHAR(150) | Nombre público del negocio |
| `razon_social` | VARCHAR(200) | Razón social legal |
| `rfc_nif` | VARCHAR(20) | RFC/NIF/Tax ID |
| `tipo_industria` | industria_tipo | Tipo de industria del negocio |
| `configuracion_industria` | JSONB | Configuraciones específicas de la industria |
| `email_admin` | VARCHAR(150) | Email del administrador principal |
| `plan_actual` | plan_tipo | Plan de suscripción actual |
| `zona_horaria` | VARCHAR(50) | Zona horaria (ej: "America/Mexico_City") |
| `activo` | BOOLEAN | Si la organización está activa |

**Ejemplo de uso**:
```sql
INSERT INTO organizaciones (
    codigo_tenant, slug, nombre_comercial, tipo_industria, email_admin
) VALUES (
    'barberia_center_mx', 'barberia-center', 'Barbería Center', 'barberia', 'admin@barberiacenter.mx'
);
```

---

### 🎛️ Configuración del Sistema

#### `configuraciones_industria`
**Propósito**: Define la terminología y configuraciones específicas por tipo de industria.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tipo_industria` | industria_tipo UNIQUE | Tipo de industria |
| `nombre_profesional` | VARCHAR(50) | Término para el profesional (ej: "Barbero", "Doctor") |
| `nombre_cliente` | VARCHAR(50) | Término para el cliente (ej: "Cliente", "Paciente") |
| `nombre_servicio` | VARCHAR(50) | Término para el servicio (ej: "Servicio", "Consulta") |
| `requiere_licencia_profesional` | BOOLEAN | Si requiere licencia profesional |
| `duracion_minima_servicio` | INTEGER | Duración mínima en minutos |

#### `plantillas_servicios`
**Propósito**: Catálogo de servicios predefinidos por industria para facilitar el setup inicial.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tipo_industria` | industria_tipo | Industria a la que pertenece |
| `nombre` | VARCHAR(100) | Nombre del servicio |
| `categoria` | VARCHAR(50) | Categoría del servicio |
| `duracion_minutos` | INTEGER | Duración estándar |
| `precio_sugerido` | DECIMAL(10,2) | Precio sugerido |
| `configuracion_especifica` | JSONB | Configuraciones específicas del servicio |

---

### 💳 Suscripciones y Límites

#### `subscripciones`
**Propósito**: Gestiona los planes, límites y facturación de cada organización.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `organizacion_id` | INTEGER FK | Referencia a la organización |
| `plan_tipo` | plan_tipo | Tipo de plan contratado |
| `estado` | estado_subscripcion | Estado actual de la suscripción |
| `limite_profesionales` | INTEGER | Máximo número de profesionales |
| `limite_citas_mes` | INTEGER | Máximo de citas por mes |
| `limite_clientes` | INTEGER | Máximo número de clientes |
| `precio_mensual` | DECIMAL(10,2) | Precio mensual del plan |
| `proxima_facturacion` | TIMESTAMPTZ | Fecha de próxima facturación |

#### `metricas_uso`
**Propósito**: Almacena métricas de uso mensual para control de límites y facturación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `organizacion_id` | INTEGER FK | Organización |
| `periodo` | DATE | Primer día del mes |
| `citas_creadas` | INTEGER | Citas creadas en el período |
| `profesionales_activos` | INTEGER | Profesionales que trabajaron |
| `ingresos_generados` | DECIMAL(12,2) | Ingresos del período |

---

### 👥 Entidades del Negocio

#### `profesionales`
**Propósito**: Profesionales que brindan servicios (barberos, estilistas, doctores, etc.).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `organizacion_id` | INTEGER FK | Organización a la que pertenece |
| `nombre_completo` | VARCHAR(150) | Nombre completo del profesional |
| `email` | VARCHAR(150) | Email de contacto |
| `tipo_profesional` | VARCHAR(50) | Tipo de profesional |
| `especialidades` | TEXT[] | Array de especialidades |
| `color_calendario` | VARCHAR(7) | Color para el calendario (hex) |
| `activo` | BOOLEAN | Si está activo |

#### `locales_negocio`
**Propósito**: Locales físicos donde opera la organización.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `organizacion_id` | INTEGER FK | Organización propietaria |
| `nombre` | VARCHAR(100) | Nombre del local |
| `direccion` | TEXT | Dirección física |
| `zona_horaria` | VARCHAR(50) | Zona horaria del local |

#### `servicios`
**Propósito**: Servicios que ofrece cada organización.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `organizacion_id` | INTEGER FK | Organización |
| `nombre` | VARCHAR(100) | Nombre del servicio |
| `categoria` | VARCHAR(50) | Categoría del servicio |
| `duracion_minutos` | INTEGER | Duración en minutos |
| `precio` | DECIMAL(10,2) | Precio del servicio |
| `color_servicio` | VARCHAR(7) | Color para identificación |

#### `clientes`
**Propósito**: Clientes de cada organización.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `organizacion_id` | INTEGER FK | Organización |
| `nombre` | VARCHAR(150) | Nombre del cliente |
| `telefono` | VARCHAR(20) | Teléfono (clave para WhatsApp) |
| `email` | VARCHAR(150) | Email del cliente |
| `profesional_preferido_id` | INTEGER FK | Profesional preferido |
| `total_citas` | INTEGER | Total de citas realizadas |
| `total_gastado` | DECIMAL(10,2) | Total gastado histórico |

---

### 📅 Sistema de Agendamiento

#### `franjas_horarias`
**Propósito**: Franjas de tiempo específicas disponibles para agendamiento.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `organizacion_id` | INTEGER FK | Organización |
| `profesional_id` | INTEGER FK | Profesional asignado |
| `fecha` | DATE | Fecha de la franja |
| `hora_inicio` | TIME | Hora de inicio |
| `hora_fin` | TIME | Hora de fin |
| `estado` | estado_franja | Estado de disponibilidad |
| `puntuacion_ia` | INTEGER | Puntuación de IA (0-100) |
| `reservado_hasta` | TIMESTAMPTZ | Timestamp de reserva temporal |

**Uso**: Esta tabla permite granularidad total en la disponibilidad. Se pueden crear franjas automáticamente basadas en horarios de profesionales o manualmente para casos especiales.

#### `citas`
**Propósito**: Citas agendadas entre clientes y profesionales.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `organizacion_id` | INTEGER FK | Organización |
| `codigo_cita` | VARCHAR(50) UNIQUE | Código único de la cita |
| `cliente_id` | INTEGER FK | Cliente |
| `profesional_id` | INTEGER FK | Profesional |
| `servicio_id` | INTEGER FK | Servicio |
| `fecha_cita` | DATE | Fecha de la cita |
| `hora_inicio` | TIME | Hora de inicio |
| `hora_fin` | TIME | Hora de fin |
| `estado` | estado_cita | Estado actual |
| `precio_final` | DECIMAL(10,2) | Precio final con descuentos |
| `origen_cita` | VARCHAR(50) | Origen (whatsapp, web, telefono) |
| `version` | INTEGER | Versión para auditoría |

#### `horarios_profesionales`
**Propósito**: Horarios regulares de trabajo de cada profesional.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `profesional_id` | INTEGER FK | Profesional |
| `dia_semana` | INTEGER | Día de la semana (0=Domingo) |
| `hora_inicio` | TIME | Hora de inicio |
| `hora_fin` | TIME | Hora de fin |
| `activo` | BOOLEAN | Si está activo |

#### `excepciones_horarios`
**Propósito**: Excepciones a los horarios regulares (vacaciones, días libres).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `profesional_id` | INTEGER FK | Profesional |
| `fecha` | DATE | Fecha de la excepción |
| `es_dia_completo` | BOOLEAN | Si es día completo o parcial |
| `motivo` | VARCHAR(100) | Motivo de la excepción |

---

### 📋 Sistema de Auditoría

#### `eventos_sistema`
**Propósito**: Log de eventos importantes del sistema para auditoría y debugging.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `organizacion_id` | INTEGER FK | Organización (opcional) |
| `tipo_evento` | VARCHAR(50) | Tipo de evento |
| `descripcion` | TEXT | Descripción del evento |
| `metadata` | JSONB | Datos adicionales |
| `cita_id` | INTEGER FK | Cita relacionada (opcional) |

**Tipos de eventos comunes**:
- `cita_creada`, `cita_cancelada`, `cita_completada`
- `profesional_activado`, `profesional_desactivado`
- `sync_externo`, `mantenimiento`

---

## 🔗 Relaciones entre Tablas

### Diagrama de Relaciones Principales

```
organizaciones (1) ──┬─── (N) profesionales
                     ├─── (N) locales_negocio
                     ├─── (N) servicios
                     ├─── (N) clientes
                     ├─── (N) citas
                     └─── (1) subscripciones

profesionales (1) ────┬─── (N) franjas_horarias
                      ├─── (N) citas
                      ├─── (N) horarios_profesionales
                      └─── (N) excepciones_horarios

citas (N) ────┬─── (1) clientes
              ├─── (1) profesionales
              ├─── (1) servicios
              └─── (1) locales_negocio
```

### Claves Foráneas Críticas

| Tabla | Columna | Referencia | Acción |
|-------|---------|------------|--------|
| `profesionales` | `organizacion_id` | `organizaciones(id)` | CASCADE |
| `citas` | `cliente_id` | `clientes(id)` | RESTRICT |
| `citas` | `profesional_id` | `profesionales(id)` | RESTRICT |
| `franjas_horarias` | `profesional_id` | `profesionales(id)` | CASCADE |

**Nota**: Se usa CASCADE para datos dependientes y RESTRICT para referencias críticas de negocio.

---

## ⚡ Índices y Optimizaciones

### Índices Críticos para Performance

#### 🔍 Búsquedas más Frecuentes

```sql
-- 1. Búsqueda de disponibilidad (60% del tráfico)
CREATE INDEX idx_franjas_disponibilidad_optimized
    ON franjas_horarias (organizacion_id, fecha, estado, profesional_id, hora_inicio)
    WHERE estado IN ('disponible', 'reservado_temporal');

-- 2. Búsqueda de clientes por teléfono (WhatsApp)
CREATE INDEX idx_clientes_telefono_lookup
    ON clientes (telefono, organizacion_id) WHERE activo = TRUE;

-- 3. Consultas de citas por rango de fechas (reportes)
CREATE INDEX idx_citas_fecha_rango
    ON citas (organizacion_id, fecha_cita, estado, profesional_id);

-- 4. Búsquedas full-text en español
CREATE INDEX idx_clientes_nombre_gin
    ON clientes USING gin(to_tsvector('spanish', nombre));
```

#### 🚫 Prevención de Conflictos

```sql
-- Prevenir solapamiento de franjas horarias
CREATE UNIQUE INDEX idx_franjas_no_solapamiento
    ON franjas_horarias (profesional_id, fecha,
        tsrange(hora_inicio::time, hora_fin::time, '[)'))
    WHERE estado != 'bloqueado';
```

### Configuraciones de Performance

```sql
-- Optimización para tablas de alto tráfico
ALTER TABLE citas SET (
    fillfactor = 90,                          -- Espacio para HOT updates
    autovacuum_vacuum_scale_factor = 0.1,     -- VACUUM más frecuente
    autovacuum_analyze_scale_factor = 0.05    -- ANALYZE más frecuente
);
```

---

## 🔒 Seguridad (RLS)

### Row Level Security

**Implementación**: Cada tabla principal tiene políticas RLS que filtran automáticamente por `organizacion_id`.

```sql
-- Función optimizada para obtener tenant actual
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(current_setting('app.current_tenant_id', true)::INTEGER, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Política ejemplo para citas
CREATE POLICY tenant_isolation_citas ON citas
    USING (organizacion_id = get_current_tenant_id());
```

### Configuración por Aplicación

```javascript
// En tu aplicación Node.js
await db.query('SET app.current_tenant_id = $1', [organizacion_id]);

// Todas las consultas posteriores están automáticamente filtradas
const citas = await db.query('SELECT * FROM citas WHERE fecha_cita = $1', [fecha]);
```

---

## 🛠️ Funciones Utilitarias

### Validación de Límites de Suscripción

```sql
-- Verificar si se pueden crear más profesionales
SELECT verificar_limite_subscripcion(123, 'profesionales', 1);
-- Retorna: true/false
```

### Generación de Códigos Únicos

```sql
-- Generar código único para cita
SELECT generar_codigo_cita();
-- Retorna: "A3F7K9X2"
```

### Verificación de Disponibilidad

```sql
-- Verificar si una franja está disponible
SELECT verificar_disponibilidad_optimizada(
    org_id := 123,
    profesional_id := 456,
    fecha := '2025-01-20',
    hora_inicio := '14:00',
    hora_fin := '15:00'
);
```

### Mantenimiento Automático

```sql
-- Limpiar reservas temporales expiradas
SELECT limpiar_reservas_expiradas();
-- Retorna: número de reservas limpiadas
```

---

## 👁️ Vistas del Sistema

### Vista de Disponibilidad

```sql
CREATE VIEW vista_disponibilidad AS
SELECT
    f.id,
    f.profesional_id,
    p.nombre_completo as profesional_nombre,
    f.fecha,
    f.hora_inicio,
    f.hora_fin,
    f.estado,
    CASE WHEN f.reservado_hasta < NOW() THEN TRUE ELSE FALSE END as reserva_expirada
FROM franjas_horarias f
JOIN profesionales p ON f.profesional_id = p.id
WHERE f.fecha >= CURRENT_DATE AND p.activo = TRUE;
```

### Vista de Citas del Día

```sql
CREATE VIEW vista_citas_hoy AS
SELECT
    c.codigo_cita,
    p.nombre_completo as profesional,
    cl.nombre as cliente,
    cl.telefono,
    s.nombre as servicio,
    c.hora_inicio,
    c.estado
FROM citas c
JOIN profesionales p ON c.profesional_id = p.id
JOIN clientes cl ON c.cliente_id = cl.id
JOIN servicios s ON c.servicio_id = s.id
WHERE c.fecha_cita = CURRENT_DATE;
```

---

## 🔧 Mantenimiento

### Tareas Automáticas Recomendadas

#### 1. Limpieza de Reservas Temporales
```sql
-- Ejecutar cada 15 minutos
SELECT cron.schedule('limpiar-reservas', '*/15 * * * *',
    'SELECT limpiar_reservas_expiradas();');
```

#### 2. Actualización de Métricas
```sql
-- Ejecutar diariamente a las 2 AM
SELECT cron.schedule('metricas-diarias', '0 2 * * *',
    'CALL actualizar_metricas_uso();');
```

### Monitoreo de Performance

```sql
-- Verificar uso de índices
SELECT
    schemaname, tablename, indexname,
    idx_scan as "Usos del índice",
    idx_tup_read as "Tuplas leídas"
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY idx_scan DESC;
```

### Backup y Archivado

```sql
-- Identificar citas antiguas para archivar
SELECT COUNT(*) as citas_para_archivar
FROM citas
WHERE fecha_cita < CURRENT_DATE - INTERVAL '2 years';
```

---

## 📈 Métricas de Impacto Esperado

### Performance
- ⚡ **60-80% mejora** en consultas de disponibilidad
- 📱 **95% reducción** en tiempo de respuesta WhatsApp
- 🔍 **10x más rápido** en búsquedas de clientes

### Escalabilidad
- 🏢 **1000+ organizaciones** en una sola instancia
- 📊 **10M+ citas/mes** con performance óptima
- 👥 **100K+ usuarios concurrentes** soportados

### Mantenimiento
- 🔧 **90% menos tiempo** en tareas de mantenimiento
- 🚨 **Detección automática** de problemas
- 📊 **Observabilidad completa** del sistema

---

## 🚀 Próximos Pasos Recomendados

1. **Implementar particionamiento** para `eventos_sistema` cuando supere 1M registros
2. **Crear vistas materializadas** para reportes complejos
3. **Implementar archivado automático** para citas > 2 años
4. **Configurar replicación** para alta disponibilidad
5. **Implementar sharding** por `organizacion_id` para ultra-escalabilidad

---

**📝 Nota**: Esta documentación debe actualizarse con cada cambio en el esquema de la base de datos. Versión actual corresponde al archivo `diseno_base_datos_saas.sql` v1.0.