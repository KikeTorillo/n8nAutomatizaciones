# Plan: Limpieza Automática de Chat Memory

## Objetivo
Implementar limpieza automática de mensajes antiguos en la base de datos `chat_memories_db` usando `pg_cron`, manteniendo los últimos 7 días de conversaciones.

---

## Estado Actual

| Componente | Estado |
|------------|--------|
| Base de datos | `chat_memories_db` |
| Tabla | `n8n_chat_histories` |
| Columnas | `id`, `session_id`, `message` (JSONB) |
| pg_cron | Ya instalado en PostgreSQL |

### Problema
- La tabla `n8n_chat_histories` crece indefinidamente
- Mensajes antiguos pueden causar confusión en el contexto del AI
- No hay mecanismo de limpieza automática

---

## Solución Propuesta

### Estrategia
1. Agregar columna `created_at` a la tabla (si no existe)
2. Crear función de limpieza que:
   - Elimine mensajes con más de 7 días de antigüedad
   - Mantenga al menos el último mensaje de cada sesión (para recordar el nombre del cliente)
3. Programar job de pg_cron para ejecutar diariamente a las 3:00 AM

---

## Implementación

### Paso 1: Agregar columna `created_at`

```sql
-- Conectar a chat_memories_db
\c chat_memories_db

-- Agregar columna created_at si no existe
ALTER TABLE n8n_chat_histories
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Crear índice para optimizar consultas por fecha
CREATE INDEX IF NOT EXISTS idx_chat_histories_created_at
ON n8n_chat_histories(created_at);

-- Crear índice compuesto para la limpieza
CREATE INDEX IF NOT EXISTS idx_chat_histories_session_created
ON n8n_chat_histories(session_id, created_at DESC);
```

### Paso 2: Crear función de limpieza

```sql
-- Función que limpia mensajes antiguos pero mantiene el último de cada sesión
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

    -- Contar sesiones que serán afectadas
    SELECT COUNT(DISTINCT session_id) INTO v_sesiones_afectadas
    FROM n8n_chat_histories
    WHERE created_at < v_fecha_corte;

    -- Eliminar mensajes antiguos EXCEPTO el más reciente de cada sesión
    WITH mensajes_a_mantener AS (
        -- Obtener el ID del mensaje más reciente de cada sesión
        SELECT DISTINCT ON (session_id) id
        FROM n8n_chat_histories
        ORDER BY session_id, id DESC
    ),
    eliminados AS (
        DELETE FROM n8n_chat_histories
        WHERE created_at < v_fecha_corte
        AND id NOT IN (SELECT id FROM mensajes_a_mantener)
        RETURNING id
    )
    SELECT COUNT(*) INTO v_mensajes_eliminados FROM eliminados;

    RETURN QUERY SELECT v_mensajes_eliminados, v_sesiones_afectadas;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION limpiar_chat_memory_antiguos IS
'Elimina mensajes de chat con más de N días de antigüedad,
manteniendo siempre el último mensaje de cada sesión para preservar contexto del cliente.';
```

### Paso 3: Crear job de pg_cron

```sql
-- Conectar a la base de datos donde está pg_cron (generalmente postgres)
\c postgres

-- Programar limpieza diaria a las 3:00 AM
SELECT cron.schedule(
    'limpiar-chat-memory-diario',           -- nombre del job
    '0 3 * * *',                             -- cron: 3:00 AM todos los días
    $$SELECT * FROM chat_memories_db.public.limpiar_chat_memory_antiguos(7)$$
);

-- Verificar que el job fue creado
SELECT * FROM cron.job WHERE jobname = 'limpiar-chat-memory-diario';
```

### Paso 4: Verificación y monitoreo

```sql
-- Ver jobs programados
SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname LIKE '%chat%';

-- Ver historial de ejecuciones
SELECT jobid, runid, job_pid, status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'limpiar-chat-memory-diario')
ORDER BY start_time DESC
LIMIT 10;

-- Ejecutar manualmente para probar
SELECT * FROM limpiar_chat_memory_antiguos(7);
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `sql/chatbots/05-mantenimiento.sql` | Crear | Script con función y job de limpieza |

---

## Pruebas

### Test 1: Verificar columna created_at
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'n8n_chat_histories' AND column_name = 'created_at';
```

### Test 2: Ejecutar limpieza manual
```sql
-- Ver cuántos mensajes se eliminarían (sin eliminar)
SELECT COUNT(*) as mensajes_antiguos
FROM n8n_chat_histories
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';

-- Ejecutar limpieza
SELECT * FROM limpiar_chat_memory_antiguos(7);
```

### Test 3: Verificar que se mantiene último mensaje
```sql
-- Después de la limpieza, cada sesión debe tener al menos 1 mensaje
SELECT session_id, COUNT(*) as mensajes
FROM n8n_chat_histories
GROUP BY session_id
HAVING COUNT(*) = 0;  -- Debe retornar 0 filas
```

---

## Configuración Recomendada

| Parámetro | Valor | Justificación |
|-----------|-------|---------------|
| Días de retención | 7 | Balance entre memoria útil y limpieza |
| Hora de ejecución | 3:00 AM | Bajo tráfico |
| Frecuencia | Diaria | Suficiente para mantener tabla limpia |

---

## Rollback

Si necesitas deshacer los cambios:

```sql
-- Eliminar job de pg_cron
SELECT cron.unschedule('limpiar-chat-memory-diario');

-- Eliminar función
DROP FUNCTION IF EXISTS limpiar_chat_memory_antiguos(INTEGER);

-- Eliminar índices (opcional)
DROP INDEX IF EXISTS idx_chat_histories_created_at;
DROP INDEX IF EXISTS idx_chat_histories_session_created;

-- NO eliminar la columna created_at (puede contener datos útiles)
```

---

## Notas Adicionales

1. **Retención configurable**: La función acepta parámetro `dias_retencion` para ajustar sin modificar código
2. **Preservación de contexto**: Siempre mantiene el último mensaje de cada sesión
3. **Monitoreo**: Los resultados se pueden ver en `cron.job_run_details`
4. **Timezone**: Usa `TIMESTAMPTZ` para manejar correctamente zonas horarias

---

## Checklist de Implementación

- [ ] Agregar columna `created_at` a `n8n_chat_histories`
- [ ] Crear índices de optimización
- [ ] Crear función `limpiar_chat_memory_antiguos`
- [ ] Programar job en pg_cron
- [ ] Verificar ejecución del job
- [ ] Documentar en CLAUDE.md

---

**Creado**: 3 Diciembre 2025
**Estado**: Pendiente de implementación
