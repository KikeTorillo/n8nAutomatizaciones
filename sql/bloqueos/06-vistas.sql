-- ====================================================================
-- 👁️ MÓDULO BLOQUEOS - VISTAS DE CONSULTA
-- ====================================================================
--
-- PROPÓSITO:
-- Vistas para facilitar consultas frecuentes sobre bloqueos de horarios,
-- incluyendo información extendida y métricas agregadas.
--
-- COMPONENTES:
-- • 2 vistas de consulta
--
-- CARACTERÍSTICAS:
-- ✅ Información extendida con JOINs
-- ✅ Campos calculados (estado temporal, duración)
-- ✅ Métricas agregadas por organización
-- ✅ Filtrado automático de bloqueos activos
--
-- USO:
-- • Backend/API para consultas optimizadas
-- • Reportes y dashboards
-- • Análisis de impacto de bloqueos
--
-- ORDEN DE CARGA: #8 (después de triggers)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- VISTA 1: BLOQUEOS ACTIVOS CON INFORMACIÓN EXTENDIDA
-- ====================================================================
-- Retorna todos los bloqueos activos con información relacionada
-- de organización, profesional y tipo de bloqueo
-- ────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS v_bloqueos_activos;

CREATE VIEW v_bloqueos_activos AS
SELECT
    b.id,
    b.organizacion_id,
    o.nombre_comercial as organizacion_nombre,
    b.profesional_id,
    p.nombre_completo as profesional_nombre,

    -- Información del tipo de bloqueo
    b.tipo_bloqueo_id,
    tb.codigo as tipo_bloqueo_codigo,
    tb.nombre as tipo_bloqueo_nombre,
    tb.descripcion as tipo_bloqueo_descripcion,

    -- Campos del bloqueo
    b.titulo,
    b.descripcion,
    b.fecha_inicio,
    b.fecha_fin,
    b.hora_inicio,
    b.hora_fin,
    b.es_recurrente,
    b.color_display,
    b.icono,
    b.citas_afectadas,
    b.ingresos_perdidos,
    b.creado_en,

    -- Campos calculados
    CASE
        WHEN b.fecha_fin < CURRENT_DATE THEN 'finalizado'
        WHEN b.fecha_inicio > CURRENT_DATE THEN 'futuro'
        ELSE 'activo'
    END as estado_temporal,

    (b.fecha_fin - b.fecha_inicio + 1) as duracion_dias,

    CASE
        WHEN b.profesional_id IS NULL THEN 'Toda la organización'
        ELSE p.nombre_completo
    END as alcance_display

FROM bloqueos_horarios b
JOIN organizaciones o ON b.organizacion_id = o.id
LEFT JOIN profesionales p ON b.profesional_id = p.id
JOIN tipos_bloqueo tb ON b.tipo_bloqueo_id = tb.id
WHERE b.activo = true;

COMMENT ON VIEW v_bloqueos_activos IS
'Vista de bloqueos activos con información extendida de organización, profesional y tipo de bloqueo.
Incluye campos calculados: estado_temporal, duracion_dias, alcance_display.
Filtro automático: activo=true';

-- ====================================================================
-- VISTA 2: MÉTRICAS DE BLOQUEOS POR ORGANIZACIÓN
-- ====================================================================
-- Retorna métricas agregadas de bloqueos por organización
-- Incluye contadores por tipo, estado temporal e impacto económico
-- ────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS v_metricas_bloqueos;

CREATE VIEW v_metricas_bloqueos AS
SELECT
    bh.organizacion_id,
    COUNT(*) as total_bloqueos,

    -- Contadores por tipo de bloqueo (usando código del catálogo)
    COUNT(*) FILTER (WHERE tb.codigo = 'vacaciones') as total_vacaciones,
    COUNT(*) FILTER (WHERE tb.codigo = 'feriado') as total_feriados,
    COUNT(*) FILTER (WHERE tb.codigo = 'hora_comida') as total_hora_comida,
    COUNT(*) FILTER (WHERE tb.codigo = 'descanso') as total_descansos,

    -- Contadores por estado temporal
    COUNT(*) FILTER (WHERE fecha_inicio > CURRENT_DATE) as bloqueos_futuros,
    COUNT(*) FILTER (WHERE fecha_inicio <= CURRENT_DATE AND fecha_fin >= CURRENT_DATE) as bloqueos_activos,

    -- Métricas de impacto
    SUM(citas_afectadas) as total_citas_afectadas,
    SUM(ingresos_perdidos) as total_ingresos_perdidos,

    -- Duración promedio
    AVG(fecha_fin - fecha_inicio + 1) as duracion_promedio_dias

FROM bloqueos_horarios bh
JOIN tipos_bloqueo tb ON bh.tipo_bloqueo_id = tb.id
WHERE bh.activo = true
GROUP BY bh.organizacion_id;

COMMENT ON VIEW v_metricas_bloqueos IS
'Vista de métricas agregadas de bloqueos por organización.
Incluye: contadores por tipo, estado temporal, impacto en citas e ingresos, duración promedio.
Filtro automático: activo=true';

-- ====================================================================
-- 📊 RESUMEN DE VISTAS
-- ====================================================================
-- Total: 2 vistas de consulta
--
-- v_bloqueos_activos:
-- • Información detallada de cada bloqueo
-- • JOINs: organizaciones, profesionales, tipos_bloqueo
-- • Campos calculados: estado_temporal, duracion_dias, alcance_display
-- • Uso: Listados, calendarios, detalles individuales
--
-- v_metricas_bloqueos:
-- • Métricas agregadas por organización
-- • Contadores por tipo de bloqueo
-- • Impacto económico (citas afectadas, ingresos perdidos)
-- • Uso: Reportes, dashboards, análisis de tendencias
--
-- Beneficios:
-- • Simplifica consultas complejas en el backend
-- • Evita duplicación de lógica de negocio
-- • Mejora legibilidad del código
-- • Facilita mantenimiento y cambios futuros
-- ====================================================================
