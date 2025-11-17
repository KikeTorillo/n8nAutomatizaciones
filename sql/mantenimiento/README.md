# Módulo: Mantenimiento y Archivado Automático

## 📋 Descripción

Sistema completo de **mantenimiento automático** del SaaS con configuración centralizada, archivado de datos antiguos y gestión inteligente de particiones PostgreSQL.

## 🎯 Propósito

- **Configuración global** del sistema (singleton pattern)
- **Archivado automático** de eventos >12 meses
- **Soft delete** de citas >24 meses
- **Gestión de particiones** mensual automática
- **Jobs pg_cron** para mantenimiento sin intervención manual
- **Optimización de performance** mediante limpieza periódica

## 🗂️ Tablas

### `configuracion_sistema` (Singleton)
Configuración global del sistema - **solo 1 fila permitida**.

**Características:**
- **Singleton pattern** con constraint CHECK (id = 1)
- **N8N_API_KEY** con hot-reload (cache 60s backend)
- **SMTP config** para emails transaccionales
- **RLS extremo**: Solo super_admin puede modificar
- **Metadata JSONB** para configs futuras

**Campos clave:**
- `n8n_api_key`: API Key de n8n (>50 caracteres)
- `n8n_owner_email`: Email del owner en n8n
- `super_admin_id`: FK al super_admin del sistema
- `smtp_config`: JSONB con configuración SMTP
- `metadata`: JSONB flexible para futuras configs

### `eventos_sistema_archivo`
Tabla de archivo para eventos antiguos (>12 meses).

**Características:**
- **Estructura idéntica** a `eventos_sistema`
- **Sin RLS ni triggers** (solo lectura)
- **Compliance** y consultas históricas
- **Performance** sin impactar tabla principal

### `citas.archivada` (Columna adicional)
Soft delete para citas antiguas completadas/canceladas.

**Características:**
- **Boolean flag** para marcar citas archivadas
- **Índice parcial** para excluir en queries activas
- **Conserva historial** completo en BD

## 📊 Archivos del Módulo

```
mantenimiento/
├── 01-tablas.sql              (3 tablas/columnas)
├── 02-indices.sql             (2 índices parciales)
├── 03-rls-policies.sql        (1 política RLS super_admin only)
├── 04-funciones.sql           (8 funciones: archivado + particiones)
├── 05-triggers.sql            (1 trigger updated_at)
├── 06-pg-cron.sql             (4 jobs programados + monitoreo)
└── README.md                  (este archivo)
```

## ⚡ Funciones de Archivado (3)

### 1. `archivar_eventos_antiguos(meses)`
Mueve eventos antiguos a tabla de archivo.

**Parámetros:**
- `p_meses_antiguedad`: Default 12 meses

**Proceso:**
1. Calcula fecha de corte
2. INSERT INTO eventos_sistema_archivo (con bypass RLS)
3. DELETE FROM eventos_sistema
4. Retorna estadísticas

**Uso:**
```sql
-- Archivar eventos >12 meses (default)
SELECT * FROM archivar_eventos_antiguos();

-- Archivar eventos >6 meses
SELECT * FROM archivar_eventos_antiguos(6);
```

### 2. `archivar_citas_antiguas(meses)`
Marca citas antiguas como archivadas (soft delete).

**Parámetros:**
- `p_meses_antiguedad`: Default 24 meses

**Criterios:**
- `estado IN ('completada', 'cancelada', 'no_asistio')`
- `fecha_cita < fecha_corte`
- `archivada = FALSE`

**Uso:**
```sql
-- Archivar citas >24 meses (default)
SELECT * FROM archivar_citas_antiguas();

-- Ver citas activas
SELECT * FROM citas WHERE archivada = FALSE;
```

### 3. `estadisticas_archivado()`
Muestra estadísticas y sugerencias de archivado.

**Retorna:**
- eventos_sistema: Total + candidatos a archivo
- citas: Total + archivadas
- eventos_sistema_archivo: Histórico

**Uso:**
```sql
SELECT * FROM estadisticas_archivado();
```

## 🗂️ Funciones de Particiones (5)

### 4. `crear_particiones_futuras_citas(meses)`
Crea particiones mensuales de citas para el futuro.

**Parámetros:**
- `p_meses_adelante`: Default 6 meses

**Proceso:**
1. Calcula rango mensual
2. Genera nombre: `citas_YYYY_MM`
3. Crea partición si no existe

**Uso:**
```sql
-- Crear 6 meses adelante (default)
SELECT * FROM crear_particiones_futuras_citas();

-- Crear 12 meses adelante
SELECT * FROM crear_particiones_futuras_citas(12);
```

### 5. `crear_particiones_futuras_eventos(meses)`
Crea particiones mensuales de eventos_sistema para el futuro.

**Parámetros:**
- `p_meses_adelante`: Default 6 meses

**Proceso:** Idéntico a citas pero para eventos_sistema

**Uso:**
```sql
SELECT * FROM crear_particiones_futuras_eventos();
```

### 6. `eliminar_particiones_antiguas(meses)`
Elimina particiones muy antiguas (citas + eventos).

**⚠️ CUIDADO:** Elimina datos permanentemente

**Parámetros:**
- `p_meses_antiguedad`: Default 24 meses

**Proceso:**
1. Busca particiones antiguas
2. Cuenta registros
3. DROP TABLE por partición
4. Retorna estadísticas

**Uso:**
```sql
-- ADVERTENCIA: Archivar antes de eliminar
SELECT * FROM archivar_eventos_antiguos(12);
SELECT * FROM eliminar_particiones_antiguas(24);
```

### 7. `listar_particiones()`
Lista todas las particiones con métricas.

**Retorna:**
- Nombre de partición
- Registros
- Tamaño MB
- Rango de fechas
- Estado (actual, futura, historica)

**Uso:**
```sql
-- Ver todas las particiones
SELECT * FROM listar_particiones();

-- Ver particiones por estado
SELECT estado, COUNT(*), SUM(registros), SUM(tamano_mb)
FROM listar_particiones()
GROUP BY estado;
```

### 8. `mantener_particiones(meses_adelante, meses_antiguos)`
Función combinada: crea futuras + elimina antiguas.

**Parámetros:**
- `p_meses_adelante`: Default 6
- `p_meses_antiguedad`: Default 24

**Proceso:**
1. Crea particiones futuras (citas + eventos)
2. Elimina particiones antiguas
3. Retorna resumen

**Uso:**
```sql
-- Mantenimiento completo (defaults)
SELECT * FROM mantener_particiones();

-- Mantenimiento personalizado
SELECT * FROM mantener_particiones(12, 36);
```

## ⏰ Jobs pg_cron (4 Programados)

### Job 1: Mantenimiento Particiones (Mensual)
- **Schedule:** `30 0 1 * *` (Día 1 a las 00:30)
- **Función:** `mantener_particiones(6, 24)`
- **Acciones:**
  - Crea particiones para próximos 6 meses
  - Elimina particiones >24 meses

### Job 2: Archivado Eventos (Mensual)
- **Schedule:** `0 1 2 * *` (Día 2 a las 01:00)
- **Función:** `archivar_eventos_antiguos(12)`
- **Acción:** Archiva eventos >12 meses

### Job 3: Archivado Citas (Trimestral)
- **Schedule:** `0 2 1 1,4,7,10 *` (Ene/Abr/Jul/Oct a las 02:00)
- **Función:** `archivar_citas_antiguas(24)`
- **Acción:** Marca citas >24 meses como archivadas

### Job 4: Vacuum Particiones (Semanal)
- **Schedule:** `0 3 * * 0` (Domingos a las 03:00)
- **Acción:** `VACUUM ANALYZE citas; VACUUM ANALYZE eventos_sistema;`
- **Propósito:** Optimizar almacenamiento y estadísticas

## 📊 Monitoreo de Jobs

### Ver Estado de Jobs
```sql
-- Estado de todos los jobs de mantenimiento
SELECT * FROM ver_estado_jobs_mantenimiento();

-- Ver jobs activos
SELECT * FROM v_cron_jobs_activos;

-- Ver historial de ejecuciones
SELECT * FROM v_cron_job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### Verificar Próxima Ejecución
```sql
-- Ver schedule de todos los jobs
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname LIKE '%mantenimiento%' OR jobname LIKE '%archivado%';
```

### Ver Errores Recientes
```sql
SELECT
    j.jobname,
    r.start_time,
    r.status,
    r.return_message
FROM cron.job j
JOIN cron.job_run_details r ON j.jobid = r.jobid
WHERE r.status = 'failed'
ORDER BY r.start_time DESC
LIMIT 10;
```

## 🛡️ Row Level Security

### Política: `configuracion_sistema_access`
**Restricción:** Solo super_admin o bypass_rls

```sql
-- Solo super_admin puede leer/modificar
current_setting('app.current_user_role', true) = 'super_admin'
OR current_setting('app.bypass_rls', true) = 'true'
```

**Protege:**
- N8N_API_KEY
- SMTP credentials
- Configuración crítica del sistema

## 📦 Dependencias

### Requiere (Orden de carga)
1. `fundamentos/` - Función `actualizar_timestamp()`
2. `nucleo/` - Tabla `usuarios` (FK super_admin_id)
3. `auditoria/` - Tabla `eventos_sistema` (para archivado)
4. `citas/` - Tabla `citas` (para archivado)

### Usado por
- Backend API - Lectura de configuración (N8N_API_KEY con cache)
- pg_cron - Ejecución automática de jobs
- DBA - Mantenimiento manual cuando necesario

## 🔧 Configuración Inicial

### 1. Instalar pg_cron en PostgreSQL

**Docker (Dockerfile.postgres):**
```dockerfile
FROM postgres:17
RUN apt-get update && apt-get install -y postgresql-17-cron
```

**postgresql.conf:**
```conf
shared_preload_libraries = 'pg_cron'
cron.database_name = 'postgres'  # Base de datos principal
```

### 2. Configurar N8N_API_KEY (Backend)

```javascript
// configService.js
async getN8nApiKey() {
  const cached = this.cache.get('n8n_api_key');
  if (cached) return cached;

  const result = await db.query(`
    SELECT n8n_api_key FROM configuracion_sistema WHERE id = 1
  `);

  const apiKey = result.rows[0]?.n8n_api_key;
  this.cache.set('n8n_api_key', apiKey, 60); // Cache 60s
  return apiKey;
}
```

### 3. Actualizar N8N_API_KEY (Super Admin)

```sql
-- Solo super_admin puede ejecutar
UPDATE configuracion_sistema
SET n8n_api_key = 'eyJhbGci...nueva-api-key...',
    n8n_configured = TRUE,
    n8n_last_sync = NOW(),
    actualizado_por = 1  -- ID del super_admin
WHERE id = 1;
```

## 📊 Consultas Útiles

### Ver Configuración Actual
```sql
-- Solo visible para super_admin
SELECT
    n8n_configured,
    n8n_owner_email,
    smtp_configurado,
    LENGTH(n8n_api_key) as api_key_length,
    actualizado_en
FROM configuracion_sistema
WHERE id = 1;
```

### Dashboard de Archivado
```sql
-- Ver estado general de archivado
SELECT * FROM estadisticas_archivado();

-- Ver particiones por estado
SELECT
    estado,
    COUNT(*) as particiones,
    SUM(registros) as total_registros,
    ROUND(SUM(tamano_mb), 2) as total_mb
FROM listar_particiones()
GROUP BY estado;
```

### Análisis de Citas Archivadas
```sql
SELECT
    CASE
        WHEN archivada = TRUE THEN 'Archivadas'
        ELSE 'Activas'
    END as estado,
    COUNT(*) as total,
    MIN(fecha_cita) as fecha_mas_antigua,
    MAX(fecha_cita) as fecha_mas_reciente
FROM citas
GROUP BY archivada;
```

## 🧪 Testing

### Test de Singleton
```sql
-- Insertar segunda fila (DEBE FALLAR)
INSERT INTO configuracion_sistema (id) VALUES (2);
-- ERROR: new row violates check constraint "chk_singleton_id"

-- Verificar solo existe 1 fila
SELECT COUNT(*) FROM configuracion_sistema;
-- Resultado: 1
```

### Test de Archivado Manual
```sql
-- 1. Ver estadísticas ANTES
SELECT * FROM estadisticas_archivado();

-- 2. Ejecutar archivado de eventos
SELECT * FROM archivar_eventos_antiguos(12);

-- 3. Ver estadísticas DESPUÉS
SELECT * FROM estadisticas_archivado();

-- 4. Verificar eventos archivados
SELECT COUNT(*) FROM eventos_sistema_archivo;
```

### Test de Particiones
```sql
-- 1. Listar particiones actuales
SELECT * FROM listar_particiones();

-- 2. Crear particiones futuras
SELECT * FROM crear_particiones_futuras_citas(3);

-- 3. Verificar creación
SELECT * FROM listar_particiones()
WHERE estado = 'futura';
```

### Test de Jobs pg_cron
```sql
-- Verificar jobs configurados
SELECT jobname, schedule, active
FROM cron.job;

-- Ver última ejecución de cada job
SELECT * FROM ver_estado_jobs_mantenimiento();

-- Ejecutar job manualmente (testing)
SELECT * FROM mantener_particiones(6, 24);
```

## ⚠️ Consideraciones Importantes

### Seguridad
- ✅ **NUNCA exponer** N8N_API_KEY en logs
- ✅ **Solo super_admin** puede modificar configuración
- ✅ **Cache de 60s** en backend para hot-reload sin restart
- ✅ **Rotar API keys** periódicamente

### Performance
- ✅ Archivado reduce tamaño de tabla principal
- ✅ Particiones mejoran queries hasta **100x**
- ✅ VACUUM semanal optimiza almacenamiento
- ✅ Índices parciales excluyen citas archivadas

### Mantenimiento
- ✅ Jobs automáticos NO requieren intervención manual
- ✅ Monitorear con `ver_estado_jobs_mantenimiento()`
- ✅ Backups antes de eliminar particiones
- ✅ Archivar ANTES de eliminar

## 🔧 Troubleshooting

### pg_cron no está instalado
```sql
-- Verificar extensión
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Si no existe, instalar
CREATE EXTENSION pg_cron;
```

### Jobs no se ejecutan
```sql
-- Verificar configuración
SHOW shared_preload_libraries;  -- Debe incluir 'pg_cron'
SHOW cron.database_name;         -- Debe ser la BD correcta

-- Verificar zona horaria
SHOW cron.timezone;
```

### Job falló
```sql
-- Ver errores recientes
SELECT
    jobname,
    start_time,
    status,
    return_message
FROM cron.job j
JOIN cron.job_run_details r ON j.jobid = r.jobid
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### Reactivar Job
```sql
-- Desactivar job
SELECT cron.unschedule('mantenimiento-particiones-mensual');

-- Reactivar job
SELECT cron.schedule(
    'mantenimiento-particiones-mensual',
    '30 0 1 * *',
    $$SELECT * FROM mantener_particiones(6, 24)$$
);
```

## 📈 Métricas de Performance

### Impacto del Archivado
```sql
-- Comparar tamaño tabla principal vs archivo
SELECT
    'eventos_sistema' as tabla,
    COUNT(*) as registros,
    pg_size_pretty(pg_total_relation_size('eventos_sistema')) as tamaño
FROM eventos_sistema
UNION ALL
SELECT
    'eventos_sistema_archivo',
    COUNT(*),
    pg_size_pretty(pg_total_relation_size('eventos_sistema_archivo'))
FROM eventos_sistema_archivo;
```

### Beneficio de Particiones
```sql
-- Ver distribución de datos por partición
SELECT
    particion,
    registros,
    tamano_mb,
    ROUND(100.0 * registros / SUM(registros) OVER(), 2) as porcentaje_registros
FROM listar_particiones()
WHERE tabla_padre = 'citas'
ORDER BY particion DESC;
```

## 📚 Referencias

- **PostgreSQL Partitioning:** https://www.postgresql.org/docs/current/ddl-partitioning.html
- **pg_cron Extension:** https://github.com/citusdata/pg_cron
- **VACUUM Analyze:** https://www.postgresql.org/docs/current/sql-vacuum.html

---

**Versión:** 1.0.0
**Fecha:** 17 Noviembre 2025
**Estado:** ✅ Listo para Producción
**Jobs Automáticos:** 4 programados (pg_cron)
**Funciones:** 8 (3 archivado + 5 particiones)
