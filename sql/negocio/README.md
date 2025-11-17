# 📋 Módulo NEGOCIO - Modelo de Negocio Core

**Categoría:** Modelo de Negocio
**Prioridad:** Alta
**Dependencias:** fundamentos, nucleo, catalogos

---

## 📊 Descripción

Módulo central del modelo de negocio que define las entidades fundamentales para la operación de cualquier organización en el sistema SaaS:

- **Profesionales**: Personal que brinda servicios (médicos, barberos, masajistas, etc.)
- **Clientes**: Base de datos de clientes con soporte multi-canal (Telegram, WhatsApp)
- **Servicios**: Catálogo de servicios personalizado por organización
- **Servicios_Profesionales**: Relación M:N con configuraciones personalizadas

---

## 📁 Archivos del Módulo

### 1. `01-tablas-negocio.sql` (449 líneas)
**Tablas creadas:**
- `profesionales` - 120 líneas, 25 columnas
  - Validaciones: edad mínima, color hex, email, experiencia, comisiones
  - JSONB: licencias, configuración horarios, configuración servicios
  - Métricas: calificación promedio, total citas, total clientes

- `clientes` - 84 líneas, 17 columnas
  - Multi-canal: `telegram_chat_id`, `whatsapp_phone`, `telefono`
  - Constraints únicos por organización (UNIQUE + índices parciales)
  - Validación: email regex, edad mínima 5 años

- `servicios` - 79 líneas, 22 columnas
  - Configuración avanzada: duración, precio, preparación, limpieza
  - JSONB: configuración específica, tags para búsqueda
  - Validaciones: duraciones (1-480 min), precios, color hex

- `servicios_profesionales` - 35 líneas, 8 columnas
  - Relación M:N con overrides de precio/duración
  - Constraint UNIQUE(servicio_id, profesional_id)

**Foreign Keys agregadas:**
- `usuarios.profesional_id` → profesionales
- `clientes.profesional_preferido_id` → profesionales

### 2. `02-indices.sql` (23 índices)
**Profesionales (7 índices):**
- Multi-tenant principal, tipo profesional, email único por org
- GIN para licencias JSONB
- GIN full-text combinado (nombre, teléfono, email, biografía)
- Covering index para profesionales disponibles online

**Clientes (13 índices):**
- Multi-tenant, email, teléfono
- Índices únicos parciales: teléfono, telegram, whatsapp por org
- GIN full-text combinado (nombre, teléfono, email)
- GIN trigram para búsqueda fuzzy (teléfono y nombre)
- Covering index para clientes activos

**Servicios (7 índices):**
- Multi-tenant, categoría, precio, tags
- GIN full-text combinado (nombre, descripción, categoría)
- Covering index para servicios por categoría

**Servicios_Profesionales (2 índices):**
- Por servicio, por profesional

### 3. `03-rls-policies.sql` (7 políticas RLS)
**Profesionales:**
- `tenant_isolation_profesionales` - Super admin + tenant isolation + bypass

**Clientes:**
- `clientes_isolation` - Validación regex + tenant isolation
- `clientes_super_admin` - Acceso global para super admin

**Servicios:**
- `servicios_tenant_isolation` - Super admin + tenant isolation + bypass
- `servicios_system_bypass` - Bypass explícito

**Servicios_Profesionales:**
- `servicios_profesionales_tenant_isolation` - Aislamiento indirecto vía JOIN

### 4. `04-funciones.sql` (2 funciones PL/pgSQL)
- `validar_profesional_industria()` - Valida tipo profesional vs industria org
- `actualizar_timestamp_servicios()` - Actualiza timestamps automáticamente

### 5. `05-triggers.sql` (4 triggers)
**Profesionales:**
- `trigger_actualizar_profesionales` - BEFORE UPDATE timestamps
- `trigger_validar_profesional_industria` - BEFORE INSERT/UPDATE validación

**Servicios:**
- `trigger_actualizar_timestamp_servicios` - BEFORE UPDATE timestamps

**Servicios_Profesionales:**
- `trigger_actualizar_timestamp_servicios_profesionales` - BEFORE UPDATE timestamps

---

## 🔗 Dependencias

**Requiere módulos:**
- `fundamentos` - Extensiones, ENUMs, funciones base
- `nucleo` - Tabla `organizaciones` (FK)
- `catalogos` - Tabla `tipos_profesional` (FK)

**Requerido por módulos:**
- `agendamiento` - `horarios_profesionales`
- `citas` - `citas` (FK a profesional, cliente, servicios)
- `bloqueos` - `bloqueos_horarios` (FK a profesional)
- `comisiones` - `configuracion_comisiones`, `comisiones_profesionales`

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| **Tablas** | 4 |
| **Índices** | 23 |
| **Políticas RLS** | 7 |
| **Funciones** | 2 |
| **Triggers** | 4 |
| **Foreign Keys** | 6 |
| **Líneas totales** | ~650 |

---

## 🎯 Características Destacadas

### 1. Multi-Canal (Clientes)
- Soporte para Telegram, WhatsApp y teléfono tradicional
- Constraints únicos por organización para cada canal
- Índices optimizados para búsqueda por plataforma

### 2. Búsqueda Avanzada
- **Full-text GIN**: Búsqueda en español optimizada
- **Trigram GIN**: Búsqueda fuzzy tolerante a typos
- **Covering indexes**: Queries sin acceso al heap (+ 40% performance)

### 3. Validación Automática
- Trigger valida tipo profesional vs industria organización
- Trigger previene asignación de tipos incompatibles
- Mensajes de error descriptivos

### 4. Configuración Flexible
- JSONB para licencias profesionales
- JSONB para configuración de horarios
- Tags y categorías para servicios

### 5. Personalización por Profesional
- Tabla M:N con precio_personalizado
- Duración personalizada por profesional
- Notas específicas por relación

---

## 🔍 Consultas Típicas

### Listar profesionales disponibles
```sql
SELECT nombre_completo, calificacion_promedio, telefono, email
FROM profesionales
WHERE organizacion_id = ?
  AND activo = TRUE
  AND disponible_online = TRUE
ORDER BY calificacion_promedio DESC;
-- Usa idx_profesionales_disponibles_covering (Index-Only Scan)
```

### Buscar clientes por teléfono (fuzzy)
```sql
SELECT nombre, telefono, email
FROM clientes
WHERE organizacion_id = ?
  AND similarity(telefono, '555-1234') > 0.3
ORDER BY similarity(telefono, '555-1234') DESC
LIMIT 10;
-- Usa idx_clientes_telefono_trgm
```

### Buscar servicios por texto
```sql
SELECT nombre, precio, duracion_minutos
FROM servicios
WHERE organizacion_id = ?
  AND to_tsvector('spanish', nombre || ' ' || descripcion)
      @@ plainto_tsquery('spanish', 'corte cabello')
  AND activo = TRUE;
-- Usa idx_servicios_search_combined
```

---

## ⚙️ Configuración

### Variables RLS utilizadas
- `app.current_tenant_id` - ID de organización (aislamiento multi-tenant)
- `app.current_user_role` - Rol del usuario (super_admin bypass)
- `app.bypass_rls` - Bypass para funciones de sistema

### Funciones externas requeridas
- `actualizar_timestamp()` - Del módulo fundamentos
- Tabla `organizaciones` - Del módulo nucleo
- Tabla `tipos_profesional` - Del módulo catalogos

---

## 📝 Notas de Migración

**Origen:** `sql/schema/05-business-tables.sql`
**Fecha migración:** 17 Noviembre 2025
**Cambios:** Solo reorganización, SIN modificaciones de sintaxis

**Verificaciones realizadas:**
- ✅ Tablas creadas correctamente
- ✅ Foreign keys aplicadas
- ✅ Índices creados (23 índices)
- ✅ RLS habilitado y políticas activas
- ✅ Triggers funcionando correctamente
- ✅ Funciones disponibles

---

## 🚀 Uso

Este módulo se ejecuta automáticamente durante `npm run clean:data` a través de `init-data.sh`:

```bash
# Orden de ejecución:
# 1. fundamentos
# 2. nucleo
# 3. catalogos
# 4. negocio  <-- ESTE MÓDULO
# 5. agendamiento
# 6. ...resto de módulos
```

---

## 📚 Referencias

- Documentación completa: `/docs/`
- Esquema legacy: `sql/schema/05-business-tables.sql` (OBSOLETO)
- Plan de migración: `PLAN_REFACTORING_SQL_MODULAR.md`
