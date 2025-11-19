# Módulo Catálogos - Catálogos Dinámicos Multi-Tenant

## 📋 Descripción

Este módulo contiene tablas de catálogos dinámicos que reemplazan ENUMs estáticos para mayor flexibilidad en el sistema SaaS multi-tenant. Soporta tipos del sistema (globales) y tipos personalizados por organización.

## 📁 Archivos del Módulo

| Archivo | Propósito | LOC |
|---------|-----------|-----|
| `01-tablas-catalogos.sql` | Tablas tipos_bloqueo y tipos_profesional | ~140 |
| `02-indices.sql` | 9 índices especializados (únicos + GIN) | ~70 |
| `03-rls-policies.sql` | 2 políticas RLS multi-tenant | ~70 |
| `04-funciones.sql` | 4 funciones PL/pgSQL (timestamps + protección) | ~120 |
| `05-triggers.sql` | 4 triggers automáticos | ~50 |
| `06-datos-iniciales.sql` | 42 tipos del sistema (9 bloqueos + 33 profesionales) | ~230 |

**Total**: ~680 líneas de código SQL

## 🏗️ Componentes Principales

### Tablas Catálogo (2)

1. **tipos_bloqueo**
   - Catálogo dinámico de tipos de bloqueo de horarios
   - 9 tipos del sistema + tipos personalizados por organización
   - Configuración de comportamiento (permite_todo_el_dia, permite_horario_especifico)
   - Soft delete para preservar históricos
   - Protección de tipos del sistema via trigger

2. **tipos_profesional**
   - Catálogo dinámico de tipos de profesional
   - 33 tipos del sistema organizados en 11 categorías + tipos personalizados
   - Validación de compatibilidad con industrias (array)
   - Iconos y colores para frontend
   - Soft delete para preservar históricos
   - Protección de tipos del sistema via trigger

### Índices Especializados (9 índices)

**tipos_bloqueo (3 índices):**
- `idx_tipos_bloqueo_codigo_org_unique` - Unicidad código por organización
- `idx_tipos_bloqueo_sistema_codigo_unique` - Unicidad código tipos del sistema
- `idx_tipos_bloqueo_organizacion` - Búsquedas por organización

**tipos_profesional (6 índices):**
- `idx_tipos_profesional_codigo_org_unique` - Unicidad código por organización
- `idx_tipos_profesional_sistema_codigo_unique` - Unicidad código tipos del sistema
- `idx_tipos_profesional_organizacion` - Búsquedas por organización
- `idx_tipos_profesional_sistema` - Tipos del sistema
- `idx_tipos_profesional_categoria` - Búsquedas por categoría
- `idx_tipos_profesional_industrias` - GIN index para búsquedas en array

**Estrategia**: Índices únicos parciales + GIN para arrays

### Políticas RLS (2 políticas)

1. **tipos_bloqueo_tenant_isolation**: Aislamiento multi-tenant
   - Super admin: acceso global
   - Tipos del sistema (NULL): visibles para todos
   - Tipos personalizados: solo su organización

2. **tipos_profesional_tenant_isolation**: Aislamiento multi-tenant
   - Super admin: acceso global
   - Tipos del sistema (NULL): visibles para todos
   - Tipos personalizados: solo su organización

### Funciones PL/pgSQL (4 funciones)

1. **actualizar_timestamp_tipos_bloqueo()**: Actualiza actualizado_en automáticamente
2. **proteger_tipos_sistema()**: Protege tipos del sistema en tipos_bloqueo
3. **actualizar_timestamp_tipos_profesional()**: Actualiza actualizado_en automáticamente
4. **proteger_tipos_profesional_sistema()**: Protege tipos del sistema en tipos_profesional

### Triggers Automáticos (4 triggers)

**tipos_bloqueo (2 triggers):**
- `trigger_actualizar_timestamp_tipos_bloqueo` - Timestamps automáticos
- `trigger_proteger_tipos_sistema` - Protección de tipos del sistema

**tipos_profesional (2 triggers):**
- `trigger_actualizar_timestamp_tipos_profesional` - Timestamps automáticos
- `trigger_proteger_tipos_profesional_sistema` - Protección de tipos del sistema

### Datos Iniciales

**tipos_bloqueo (9 tipos):**
- vacaciones, feriado, mantenimiento, evento_especial, emergencia
- personal, organizacional, hora_comida, descanso

**tipos_profesional (33 tipos en 11 categorías):**
- Barbería (2): barbero, estilista_masculino
- Salón de Belleza (4): estilista, colorista, manicurista, peinados_eventos
- Estética (3): esteticista, cosmetologo, depilacion_laser
- Spa (4): masajista, terapeuta_spa, aromaterapeuta, reflexologo
- Podología (2): podologo, asistente_podologia
- Médico (3): doctor_general, enfermero, recepcionista_medica
- Academia (3): instructor, profesor, tutor
- Taller Técnico (4): tecnico_auto, tecnico_electronico, mecanico, soldador
- Fitness (4): entrenador_personal, instructor_yoga, instructor_pilates, nutricionista
- Veterinaria (3): veterinario, asistente_veterinario, groomer
- Otro (1): otro

## 🔄 Orden de Ejecución

Los archivos **DEBEN** ejecutarse en este orden:

```
1. core/fundamentos/01-extensiones.sql         (extensiones PostgreSQL)
2. core/fundamentos/02-tipos-enums-core.sql    (ENUMs universales)
3. core/fundamentos/03-funciones-utilidad.sql  (funciones base)
4. nucleo/01-tablas-core.sql              (organizaciones)
5. nucleo/02-tablas-subscripciones.sql    (subscripciones)
6. nucleo/03-indices.sql                  (índices núcleo)
7. nucleo/04-rls-policies.sql             (RLS núcleo)
8. nucleo/05-funciones.sql                (funciones núcleo)
9. nucleo/06-triggers.sql                 (triggers núcleo)
10. nucleo/07-datos-iniciales.sql         (planes)
11. catalogos/01-tablas-catalogos.sql     (tipos_bloqueo, tipos_profesional)
12. catalogos/02-indices.sql              (índices especializados)
13. catalogos/03-rls-policies.sql         (seguridad multi-tenant)
14. catalogos/04-funciones.sql            (funciones PL/pgSQL)
15. catalogos/05-triggers.sql             (triggers automáticos)
16. catalogos/06-datos-iniciales.sql      (42 tipos del sistema)
```

## 📊 Dependencias

### Depende de (módulos anteriores)

- **fundamentos**: Requiere función `actualizar_timestamp()` (aunque no se usa, cada catálogo tiene su propia función)
- **nucleo**: Requiere tabla `organizaciones` para FK `organizacion_id`

### Requerido por (módulos posteriores)

- **negocio**: Tabla `profesionales` referencia `tipos_profesional.id`
- **bloqueos**: Tabla `bloqueos_horarios` referencia `tipos_bloqueo.id`

## 🎯 Características Clave

1. **Flexibilidad Multi-Tenant**: Tipos del sistema compartidos + tipos personalizados por organización
2. **Protección de Datos del Sistema**: Triggers previenen modificación/eliminación de tipos del sistema
3. **Soft Delete**: Preserva históricos sin eliminar físicamente
4. **Validación de Integridad**: Constraints validan formato de códigos
5. **Búsquedas Optimizadas**: Índices GIN para búsquedas en arrays
6. **Seguridad RLS**: Aislamiento completo multi-tenant

## 🔒 Seguridad

- **RLS habilitado** en ambas tablas
- **Políticas tenant-isolation** para aislamiento por organización
- **Triggers de protección** para tipos del sistema
- **Validación de formato** en códigos (regex: `^[a-z0-9_]+$` para bloqueos, `^[a-z_]+$` para profesionales)
- **Bypass controlado** para operaciones del sistema

## 📝 Notas de Migración

**Fecha migración**: 16 Noviembre 2025

**Origen**: `sql/schema/04-catalog-tables.sql`

**Cambios**:
- Separación modular por tipo de componente (tablas, índices, RLS, funciones, triggers, datos)
- Documentación mejorada con COMMENT ON
- Validación completa al final de datos iniciales
- README completo con dependencias y características

**Validación**: Script valida 9 tipos bloqueo + 33 tipos profesional + triggers + RLS
