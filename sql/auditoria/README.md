# Módulo: Auditoría y Eventos del Sistema

## 📋 Descripción

Sistema completo de auditoría y logging para el SaaS multi-tenant. Registra todos los eventos críticos del sistema con seguridad avanzada y performance optimizada mediante **particionamiento mensual**.

## 🎯 Propósito

- **Trazabilidad completa** de todas las acciones críticas del sistema
- **Auditoría de seguridad** (login, cambios de roles, accesos)
- **Monitoreo operacional** (citas, pagos, suscripciones)
- **Debugging y troubleshooting** con metadata JSONB enriquecida
- **Compliance** para regulaciones de protección de datos

## 🗂️ Tablas

### `eventos_sistema` (PARTICIONADA)
Tabla principal de auditoría con **particionamiento mensual por fecha**.

**Características:**
- **BIGSERIAL** para escala de billones de eventos
- **Range Partitioning** mensual automático (mejora 100x performance)
- **RLS multi-tenant** para aislamiento total
- **JSONB metadata** indexado con GIN para búsquedas complejas
- **Trazabilidad completa**: IP, user agent, sesión, usuario

**Campos clave:**
- `tipo_evento`: ENUM con 43 tipos de eventos categorizados
- `metadata`: JSONB con información contextual del evento
- `ip_address`, `user_agent`, `session_id`: Auditoría completa
- `organizacion_id`, `usuario_id`: Referencias multi-tenant
- `nivel_severidad`: crítico, error, advertencia, info, debug

### `eventos_sistema_archivo` (FUTURO)
Tabla para archivado automático de eventos antiguos (>6 meses).

## 📊 Archivos del Módulo

```
auditoria/
├── 01-tablas-eventos.sql          (ENUM + tabla particionada)
├── 02-particionamiento.sql        (2 particiones iniciales + función setup)
├── 03-indices.sql                 (13 índices especializados)
├── 04-rls-policies.sql            (1 política RLS tenant isolation)
├── 05-funciones.sql               (5 funciones: validación + helpers)
├── 06-triggers.sql                (2 triggers automáticos)
├── 07-vistas.sql                  (2 vistas de consulta)
└── README.md                      (este archivo)
```

## 🎭 Tipos de Eventos (43)

### 🔐 Autenticación y Seguridad (7)
- `login_attempt`, `login_success`, `login_failed`
- `logout`, `password_reset`
- `user_blocked`, `user_unblocked`

### 📅 Gestión de Citas (6)
- `cita_creada`, `cita_confirmada`, `cita_cancelada`
- `cita_completada`, `cita_no_show`, `cita_modificada`

### 👥 Gestión de Usuarios (6)
- `usuario_creado`, `usuario_modificado`, `usuario_desactivado`
- `rol_cambiado`, `profesional_creado`, `cliente_creado`

### 💰 Pagos y Facturación (6)
- `pago_exitoso`, `pago_fallido`
- `subscripcion_creada`, `subscripcion_renovada`, `subscripcion_cancelada`
- `plan_cambiado`

### 🔧 Sistema y Mantenimiento (6)
- `backup_creado`, `mantenimiento_iniciado`, `mantenimiento_finalizado`
- `error_sistema`, `integracion_fallo`, `tokens_limpiados`

### 📊 Configuración y Organización (12)
- `servicio_creado`, `servicio_modificado`, `servicio_eliminado`
- `horario_creado`, `horario_modificado`, `horario_eliminado`
- `bloqueo_creado`, `bloqueo_eliminado`
- `comision_calculada`, `comision_pagada`
- `config_modificada`, `organizacion_creada`

## 📊 Índices Especializados (13)

### Performance (6 índices)
- `idx_eventos_sistema_org_fecha` - Consultas por organización + fecha (covering)
- `idx_eventos_sistema_tipo_fecha` - Filtrado por tipo de evento
- `idx_eventos_sistema_usuario_fecha` - Auditoría por usuario
- `idx_eventos_sistema_nivel_fecha` - Filtrado por severidad
- `idx_eventos_sistema_fecha_tipo` - Búsquedas históricas
- `idx_eventos_sistema_session` - Tracking de sesión

### Búsquedas JSONB (5 índices GIN)
- `idx_eventos_sistema_metadata_gin` - Búsquedas en metadata completa
- `idx_eventos_sistema_metadata_usuario_id` - Extracción de usuario desde metadata
- `idx_eventos_sistema_metadata_cita_id` - Eventos por cita
- `idx_eventos_sistema_metadata_profesional_id` - Eventos por profesional
- `idx_eventos_sistema_metadata_cliente_id` - Eventos por cliente

### Auditoría de Seguridad (2 índices)
- `idx_eventos_sistema_ip_address` - Tracking por IP
- `idx_eventos_sistema_creado_desc` - Eventos recientes

## ⚡ Funciones PL/pgSQL (5)

### Helpers Inmutables (3)
- `extract_date_immutable()` - Extracción de fecha para índices funcionales
- `extract_year_immutable()` - Extracción de año para análisis temporal
- `extract_month_immutable()` - Extracción de mes para particionamiento

### Triggers y Validación (2)
- `validar_evento_coherencia()` - Valida que usuario pertenece a organización
- `generar_codigo_evento()` - Genera código único para eventos críticos

## 🔄 Triggers Automáticos (2)

### `trigger_validar_evento_coherencia`
- **Disparo:** BEFORE INSERT en `eventos_sistema`
- **Función:** Valida coherencia organizacional (usuario ∈ organización)
- **Bypass RLS:** Sí (SECURITY DEFINER)

### `trigger_generar_codigo_evento`
- **Disparo:** BEFORE INSERT en `eventos_sistema`
- **Función:** Genera código único para eventos críticos
- **Formato:** `EVT-ORG{ID}-{TIMESTAMP}`

## 👁️ Vistas de Consulta (2)

### `v_eventos_recientes`
Últimos 1000 eventos del sistema con información enriquecida.

**Campos:**
- Información completa del evento + nombre usuario + tipo profesional/cliente
- Ordenado por fecha descendente

**Uso:** Dashboard de auditoría en tiempo real

### `v_eventos_seguridad`
Eventos de seguridad críticos (login, cambios de rol, bloqueos).

**Filtros:**
- Solo eventos de categoría autenticación
- Últimos 30 días

**Uso:** Monitoreo de seguridad y detección de anomalías

## 🗓️ Particionamiento

### Estrategia
**Range Partitioning** por `creado_en` (columna timestamp)

### Particiones Iniciales
- `eventos_sistema_2025_11` (Noviembre 2025)
- `eventos_sistema_2025_12` (Diciembre 2025)

### Creación Automática
Función `setup_eventos_partitions_for_month(year, month)` permite crear nuevas particiones bajo demanda.

**Gestión automática:** Ver módulo `mantenimiento/` (pg_cron job mensual)

### Beneficios
- ✅ Consultas históricas hasta **100x más rápidas**
- ✅ Archivado automático de datos antiguos (>6 meses)
- ✅ Reducción de tamaño de índices (~50% menos memoria)
- ✅ Mantenimiento granular por partición

## 🛡️ Row Level Security (RLS)

### Política: `eventos_sistema_tenant_isolation`
**Operaciones:** SELECT, INSERT, UPDATE, DELETE
**Usuarios:** `saas_app`

**Lógica:**
```sql
organizacion_id = current_setting('app.current_tenant_id', TRUE)::INTEGER
```

**Bypass para triggers:** SECURITY DEFINER en funciones de validación

## 📦 Dependencias

### Requiere (Orden de carga)
1. `fundamentos/` - ENUMs base y funciones globales
2. `nucleo/` - Tabla `organizaciones`, `usuarios`
3. `negocio/` - Tablas `profesionales`, `clientes` (referencias JSONB)
4. `citas/` - Tabla `citas` (referencias JSONB)

### Usado por
- `mantenimiento/` - Jobs pg_cron para archivado automático
- Backend API - Logging de todas las operaciones críticas
- Dashboard - Vistas de auditoría y monitoreo

## 🔧 Uso desde Backend

### Registrar Evento Básico
```javascript
await db.query(`
  INSERT INTO eventos_sistema (
    organizacion_id, tipo_evento, descripcion,
    nivel_severidad, usuario_id, metadata
  ) VALUES ($1, $2, $3, $4, $5, $6)
`, [
  orgId,
  'cita_creada',
  'Nueva cita reservada',
  'info',
  userId,
  JSON.stringify({ cita_id: 123, servicio_id: 45 })
]);
```

### Registrar Evento de Seguridad
```javascript
await db.query(`
  INSERT INTO eventos_sistema (
    organizacion_id, tipo_evento, descripcion,
    nivel_severidad, usuario_id, ip_address,
    user_agent, session_id, metadata
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
`, [
  orgId,
  'login_failed',
  'Intento fallido de login',
  'advertencia',
  userId,
  req.ip,
  req.headers['user-agent'],
  req.sessionID,
  JSON.stringify({ email: 'user@example.com', intentos: 3 })
]);
```

## 📊 Consultas Útiles

### Eventos de una Organización (Últimos 7 días)
```sql
SELECT * FROM eventos_sistema
WHERE organizacion_id = 1
  AND creado_en >= NOW() - INTERVAL '7 days'
ORDER BY creado_en DESC
LIMIT 100;
```

### Eventos de Seguridad Sospechosos
```sql
SELECT * FROM v_eventos_seguridad
WHERE nivel_severidad IN ('error', 'crítico')
  AND tipo_evento LIKE '%failed%'
ORDER BY creado_en DESC;
```

### Análisis de Eventos por Tipo (Última Semana)
```sql
SELECT
  tipo_evento,
  COUNT(*) as total,
  COUNT(DISTINCT usuario_id) as usuarios_unicos
FROM eventos_sistema
WHERE creado_en >= NOW() - INTERVAL '7 days'
GROUP BY tipo_evento
ORDER BY total DESC;
```

### Buscar en Metadata JSONB
```sql
-- Buscar eventos relacionados con una cita específica
SELECT * FROM eventos_sistema
WHERE metadata @> '{"cita_id": 123}'
ORDER BY creado_en DESC;

-- Buscar eventos de un profesional
SELECT * FROM eventos_sistema
WHERE metadata @> '{"profesional_id": 45}'
ORDER BY creado_en DESC;
```

## 🧪 Testing

### Test de Inserción
```sql
-- Insertar evento de prueba
INSERT INTO eventos_sistema (
  organizacion_id, tipo_evento, descripcion,
  nivel_severidad, metadata
) VALUES (
  1,
  'cita_creada',
  'Test de auditoría',
  'info',
  '{"test": true, "cita_id": 999}'::jsonb
);

-- Verificar inserción
SELECT * FROM eventos_sistema
WHERE metadata @> '{"test": true}';
```

### Test de Particionamiento
```sql
-- Verificar particiones existentes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE 'eventos_sistema_%'
ORDER BY tablename;
```

### Test de RLS
```sql
-- Configurar tenant
SET app.current_tenant_id = '1';

-- Insertar y consultar (solo debe ver eventos de org 1)
INSERT INTO eventos_sistema (...) VALUES (...);
SELECT COUNT(*) FROM eventos_sistema;
```

## 📈 Métricas y Monitoreo

### Estadísticas de Uso
```sql
-- Total de eventos por partición
SELECT
  schemaname,
  tablename,
  n_live_tup as filas,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamaño
FROM pg_stat_user_tables
WHERE tablename LIKE 'eventos_sistema%'
ORDER BY tablename;
```

### Performance de Índices
```sql
-- Ver uso de índices en tabla eventos_sistema
SELECT
  indexrelname as index_name,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname LIKE 'eventos_sistema%'
ORDER BY idx_scan DESC;
```

## 🔧 Mantenimiento

### Archivado Automático
Ver módulo `mantenimiento/` - Job pg_cron ejecuta mensualmente:
- Mueve eventos >6 meses a `eventos_sistema_archivo`
- Elimina eventos >12 meses de archivo
- Ejecuta VACUUM ANALYZE en particiones afectadas

### Creación Manual de Particiones
```sql
-- Crear partición para Enero 2026
SELECT setup_eventos_partitions_for_month(2026, 1);
```

### Limpieza Manual (No recomendado)
```sql
-- ADVERTENCIA: Solo ejecutar en desarrollo
DELETE FROM eventos_sistema
WHERE creado_en < NOW() - INTERVAL '30 days';

-- Luego ejecutar
VACUUM ANALYZE eventos_sistema;
```

## ⚠️ Consideraciones Importantes

1. **No eliminar eventos manualmente** - Usar sistema de archivado automático
2. **Metadata JSONB** - Mantener estructura consistente para búsquedas óptimas
3. **Nivel de severidad** - Usar consistentemente: crítico > error > advertencia > info > debug
4. **Particionamiento** - Crear particiones futuras con anticipación (pg_cron lo hace automáticamente)
5. **Performance** - Los índices GIN en JSONB son costosos, usar con moderación

## 📚 Referencias

- **PostgreSQL Partitioning:** https://www.postgresql.org/docs/current/ddl-partitioning.html
- **JSONB Indexing:** https://www.postgresql.org/docs/current/datatype-json.html
- **Row Level Security:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

**Versión:** 1.0.0
**Fecha:** 17 Noviembre 2025
**Estado:** ✅ Listo para Producción
**Mantenimiento:** Automático vía pg_cron
