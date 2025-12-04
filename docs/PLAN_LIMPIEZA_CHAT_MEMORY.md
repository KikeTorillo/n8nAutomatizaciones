# Plan: Limpieza Automática de Chat Memory

## Objetivo
Limpieza automática de `n8n_chat_histories` usando `pg_cron`, reteniendo 7 días de conversaciones.

---

## Contexto

| Item | Valor |
|------|-------|
| Base de datos | `chat_memories_db` |
| Tabla | `n8n_chat_histories` |
| Columnas | `id`, `session_id`, `message` (JSONB) |

**Problema**: La tabla crece indefinidamente y mensajes antiguos pueden confundir al AI.

---

## Implementación

### Paso 1: Preparar tabla

```sql
-- Ejecutar en chat_memories_db
\c chat_memories_db

-- Agregar columna de timestamp
ALTER TABLE n8n_chat_histories
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Índices para optimizar limpieza
CREATE INDEX IF NOT EXISTS idx_chat_histories_created_at
ON n8n_chat_histories(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_histories_session_created
ON n8n_chat_histories(session_id, created_at DESC);
```

### Paso 2: Crear función de limpieza

```sql
-- Ejecutar en chat_memories_db
CREATE OR REPLACE FUNCTION limpiar_chat_memory_antiguos(dias_retencion INTEGER DEFAULT 7)
RETURNS TABLE(
    mensajes_eliminados BIGINT,
    sesiones_afectadas BIGINT
) AS $$
DECLARE
    v_mensajes_eliminados BIGINT;
    v_sesiones_afectadas BIGINT;
    v_fecha_corte TIMESTAMPTZ;
BEGIN
    v_fecha_corte := CURRENT_TIMESTAMP - (dias_retencion || ' days')::INTERVAL;

    -- Contar sesiones afectadas
    SELECT COUNT(DISTINCT session_id) INTO v_sesiones_afectadas
    FROM n8n_chat_histories
    WHERE created_at < v_fecha_corte;

    -- Eliminar mensajes antiguos EXCEPTO el último de cada sesión
    WITH ultimos_mensajes AS (
        SELECT session_id, MAX(id) as ultimo_id
        FROM n8n_chat_histories
        GROUP BY session_id
    ),
    eliminados AS (
        DELETE FROM n8n_chat_histories h
        WHERE h.created_at < v_fecha_corte
        AND NOT EXISTS (
            SELECT 1 FROM ultimos_mensajes u
            WHERE u.session_id = h.session_id AND u.ultimo_id = h.id
        )
        RETURNING h.id
    )
    SELECT COUNT(*) INTO v_mensajes_eliminados FROM eliminados;

    -- Limpiar dead tuples
    EXECUTE 'VACUUM ANALYZE n8n_chat_histories';

    RETURN QUERY SELECT v_mensajes_eliminados, v_sesiones_afectadas;
END;
$$ LANGUAGE plpgsql;
```

### Paso 3: Programar job pg_cron

```sql
-- IMPORTANTE: pg_cron debe estar instalado en chat_memories_db
-- Verificar en postgresql.conf: cron.database_name = 'chat_memories_db'
-- O ejecutar desde la BD donde está pg_cron con dblink

-- Opción A: Si pg_cron está en chat_memories_db
\c chat_memories_db
SELECT cron.schedule(
    'limpiar-chat-memory-diario',
    '0 3 * * *',  -- 3:00 AM diario
    $$SELECT * FROM limpiar_chat_memory_antiguos(7)$$
);

-- Opción B: Si pg_cron está en otra BD (ej: postgres), usar dblink
\c postgres
SELECT cron.schedule(
    'limpiar-chat-memory-diario',
    '0 3 * * *',
    $$SELECT dblink('dbname=chat_memories_db', 'SELECT * FROM limpiar_chat_memory_antiguos(7)')$$
);
```

---

## Verificación

```sql
-- Ver job creado
SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname LIKE '%chat%';

-- Ver historial de ejecuciones
SELECT status, return_message, start_time, end_time - start_time as duracion
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'limpiar-chat-memory-diario')
ORDER BY start_time DESC LIMIT 5;

-- Test manual
SELECT * FROM limpiar_chat_memory_antiguos(7);
```

---

## Rollback

```sql
SELECT cron.unschedule('limpiar-chat-memory-diario');
DROP FUNCTION IF EXISTS limpiar_chat_memory_antiguos(INTEGER);
-- Índices y columna created_at se mantienen (útiles para futuro)
```

---

## Configuración

| Parámetro | Valor | Nota |
|-----------|-------|------|
| Retención | 7 días | Ajustable vía parámetro |
| Ejecución | 3:00 AM | Bajo tráfico |
| Frecuencia | Diaria | Suficiente para tabla limpia |

---

## Checklist

- [ ] Agregar columna `created_at`
- [ ] Crear índices
- [ ] Crear función `limpiar_chat_memory_antiguos`
- [ ] Programar job pg_cron
- [ ] Verificar primera ejecución
- [ ] Actualizar CLAUDE.md

---

**Estado**: Pendiente de implementación
