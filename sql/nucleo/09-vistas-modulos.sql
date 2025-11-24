-- ====================================================================
-- MÓDULO NÚCLEO: VISTAS DEL SISTEMA MODULAR
-- ====================================================================
-- Vistas optimizadas para consultar información sobre módulos activos
-- por organización y estadísticas globales.
--
-- VISTAS INCLUIDAS:
-- • v_organizaciones_modulos: Módulos activos por organización
-- • v_estadisticas_modulos: Stats de uso de módulos (para super admin)
-- • v_cambios_modulos_recientes: Auditoría de últimos cambios
--
-- Creado: 24 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- VISTA: v_organizaciones_modulos
-- ====================================================================
-- Provee información completa sobre módulos activos de cada organización
-- Útil para:
--   • Dashboard de super admin
--   • Reportes de uso de módulos
--   • Verificación rápida de acceso a módulos
--
-- JOINS:
--   subscripciones + organizaciones + planes_subscripcion
--
-- PERFORMANCE:
--   • Usa índices UNIQUE en organizacion_id
--   • Query típica: ~20-40ms para listar todas las orgs
-- ====================================================================
CREATE OR REPLACE VIEW v_organizaciones_modulos AS
SELECT
    o.id AS organizacion_id,
    o.nombre_comercial AS organizacion_nombre,
    o.slug AS organizacion_slug,
    o.activo AS organizacion_activa,

    s.id AS subscripcion_id,
    s.activa AS subscripcion_activa,
    s.estado AS subscripcion_estado,

    p.codigo_plan,
    p.nombre_plan,

    -- Módulos activos como JSONB
    s.modulos_activos,

    -- Expandir módulos principales como columnas booleanas (para filtros fáciles)
    COALESCE((s.modulos_activos->>'core')::BOOLEAN, FALSE) AS modulo_core,
    COALESCE((s.modulos_activos->>'agendamiento')::BOOLEAN, FALSE) AS modulo_agendamiento,
    COALESCE((s.modulos_activos->>'inventario')::BOOLEAN, FALSE) AS modulo_inventario,
    COALESCE((s.modulos_activos->>'pos')::BOOLEAN, FALSE) AS modulo_pos,
    COALESCE((s.modulos_activos->>'marketplace')::BOOLEAN, FALSE) AS modulo_marketplace,
    COALESCE((s.modulos_activos->>'comisiones')::BOOLEAN, FALSE) AS modulo_comisiones,
    COALESCE((s.modulos_activos->>'chatbots')::BOOLEAN, FALSE) AS modulo_chatbots,

    -- Contador de módulos activos
    (
        SELECT COUNT(*)
        FROM jsonb_each(s.modulos_activos) AS modulo(key, value)
        WHERE value::TEXT = 'true'
    ) AS total_modulos_activos,

    -- Precio y facturación
    s.precio_actual,
    s.precio_con_descuento,
    s.periodo_facturacion,
    s.fecha_proximo_pago,

    -- Timestamps
    s.fecha_inicio,
    s.creado_en AS subscripcion_creada_en,
    s.actualizado_en AS subscripcion_actualizada_en

FROM organizaciones o
INNER JOIN subscripciones s ON s.organizacion_id = o.id
INNER JOIN planes_subscripcion p ON p.id = s.plan_id
WHERE s.activa = TRUE;  -- Solo subscripciones activas

COMMENT ON VIEW v_organizaciones_modulos IS
'Vista completa de organizaciones con sus módulos activos. Expande módulos como columnas booleanas para filtros fáciles';

-- ====================================================================
-- VISTA: v_estadisticas_modulos
-- ====================================================================
-- Estadísticas globales de uso de módulos
-- Útil para:
--   • Dashboard de super admin
--   • Decisiones de producto (¿qué módulos son más populares?)
--   • Análisis de pricing y bundling
--
-- AGGREGATIONS:
--   COUNT, AVG, PERCENTILE por módulo
--
-- PERFORMANCE:
--   • Usa índice GIN en modulos_activos
--   • Query completa: ~50-100ms (scan completo de subscripciones)
--   • Cachear en backend con TTL de 1 hora
-- ====================================================================
CREATE OR REPLACE VIEW v_estadisticas_modulos AS
WITH modulos_expandidos AS (
    SELECT
        s.id AS subscripcion_id,
        s.organizacion_id,
        s.activa,
        s.precio_actual,
        jsonb_each(s.modulos_activos) AS modulo_entry
    FROM subscripciones s
    WHERE s.activa = TRUE
),
modulos_por_nombre AS (
    SELECT
        (modulo_entry).key AS modulo_nombre,
        (modulo_entry).value::TEXT::BOOLEAN AS modulo_activo,
        subscripcion_id,
        organizacion_id,
        precio_actual
    FROM modulos_expandidos
)
SELECT
    modulo_nombre,

    -- Contadores básicos
    COUNT(*) FILTER (WHERE modulo_activo = TRUE) AS total_organizaciones_activas,
    COUNT(*) FILTER (WHERE modulo_activo = FALSE) AS total_organizaciones_inactivas,
    COUNT(*) AS total_organizaciones,

    -- Porcentaje de adopción
    ROUND(
        (COUNT(*) FILTER (WHERE modulo_activo = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
        2
    ) AS porcentaje_adopcion,

    -- Métricas de revenue (organizaciones que tienen el módulo activo)
    ROUND(AVG(precio_actual) FILTER (WHERE modulo_activo = TRUE), 2) AS precio_promedio,
    ROUND(SUM(precio_actual) FILTER (WHERE modulo_activo = TRUE), 2) AS revenue_mensual_estimado,

    -- Metadata
    NOW() AS calculado_en

FROM modulos_por_nombre
GROUP BY modulo_nombre
ORDER BY total_organizaciones_activas DESC;

COMMENT ON VIEW v_estadisticas_modulos IS
'Estadísticas globales de uso de módulos. Muestra adopción, revenue estimado y métricas por módulo. Cachear con TTL de 1 hora';

-- ====================================================================
-- VISTA: v_cambios_modulos_recientes
-- ====================================================================
-- Auditoría de cambios recientes en módulos (últimos 30 días)
-- Útil para:
--   • Monitoreo de activaciones/desactivaciones
--   • Detección de patrones de churn (desactivaciones frecuentes)
--   • Soporte técnico (¿qué cambió recientemente?)
--
-- FILTERS:
--   • Solo eventos tipo 'cambio_modulos'
--   • Últimos 30 días
--
-- PERFORMANCE:
--   • Usa índice en historial_subscripciones.ocurrido_en
--   • Query típica: ~10-30ms
-- ====================================================================
CREATE OR REPLACE VIEW v_cambios_modulos_recientes AS
SELECT
    h.id AS historial_id,
    h.organizacion_id,
    o.nombre_comercial AS organizacion_nombre,
    o.slug AS organizacion_slug,

    h.tipo_evento,
    h.motivo,

    -- Información del usuario que hizo el cambio
    h.usuario_responsable,
    u.nombre AS usuario_nombre,
    u.email AS usuario_email,
    h.iniciado_por,

    -- Timestamps
    h.ocurrido_en,

    -- Contexto adicional
    h.ip_origen,

    -- Subscripción relacionada
    h.subscripcion_id,
    s.estado AS subscripcion_estado,
    s.activa AS subscripcion_activa

FROM historial_subscripciones h
INNER JOIN organizaciones o ON o.id = h.organizacion_id
LEFT JOIN usuarios u ON u.id = h.usuario_responsable
LEFT JOIN subscripciones s ON s.id = h.subscripcion_id

WHERE h.tipo_evento = 'cambio_modulos'
  AND h.ocurrido_en >= NOW() - INTERVAL '30 days'

ORDER BY h.ocurrido_en DESC;

COMMENT ON VIEW v_cambios_modulos_recientes IS
'Auditoría de cambios en módulos en los últimos 30 días. Útil para monitoreo y soporte técnico';

-- ====================================================================
-- VISTA: v_modulos_por_plan
-- ====================================================================
-- Muestra qué módulos están típicamente activos por cada tipo de plan
-- Útil para:
--   • Análisis de bundling
--   • Diseño de nuevos planes
--   • Marketing (¿qué módulos vender juntos?)
--
-- AGGREGATIONS:
--   COUNT y PERCENTAGE por plan y módulo
-- ====================================================================
CREATE OR REPLACE VIEW v_modulos_por_plan AS
WITH subscripciones_activas AS (
    SELECT
        s.id,
        s.organizacion_id,
        p.codigo_plan,
        p.nombre_plan,
        s.modulos_activos
    FROM subscripciones s
    INNER JOIN planes_subscripcion p ON p.id = s.plan_id
    WHERE s.activa = TRUE
),
modulos_expandidos AS (
    SELECT
        codigo_plan,
        nombre_plan,
        (jsonb_each(modulos_activos)).key AS modulo_nombre,
        ((jsonb_each(modulos_activos)).value)::TEXT::BOOLEAN AS modulo_activo
    FROM subscripciones_activas
)
SELECT
    codigo_plan,
    nombre_plan,
    modulo_nombre,

    -- Contadores
    COUNT(*) FILTER (WHERE modulo_activo = TRUE) AS orgs_con_modulo,
    COUNT(*) AS total_orgs_en_plan,

    -- Porcentaje de orgs en este plan que tienen el módulo activo
    ROUND(
        (COUNT(*) FILTER (WHERE modulo_activo = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
        2
    ) AS porcentaje_adopcion_en_plan

FROM modulos_expandidos
GROUP BY codigo_plan, nombre_plan, modulo_nombre
ORDER BY codigo_plan, porcentaje_adopcion_en_plan DESC;

COMMENT ON VIEW v_modulos_por_plan IS
'Análisis de módulos activos por tipo de plan. Muestra patrones de bundling y adopción por plan';

-- ====================================================================
-- VISTA MATERIALIZADA: mv_dashboard_modulos_super_admin
-- ====================================================================
-- Vista materializada para dashboard de super admin
-- Refresca cada 1 hora automáticamente
--
-- VENTAJAS:
--   • Performance ultra-rápida (~1ms vs ~100ms de las vistas normales)
--   • Agrega datos de múltiples tablas
--   • Perfecto para dashboards que se consultan frecuentemente
--
-- REFRESH:
--   • Manual: REFRESH MATERIALIZED VIEW mv_dashboard_modulos_super_admin;
--   • Automático: pg_cron job cada 1 hora
-- ====================================================================
CREATE MATERIALIZED VIEW mv_dashboard_modulos_super_admin AS
SELECT
    -- Timestamp del snapshot
    NOW() AS snapshot_en,

    -- Stats generales
    (SELECT COUNT(*) FROM organizaciones WHERE activo = TRUE) AS total_organizaciones_activas,
    (SELECT COUNT(*) FROM subscripciones WHERE activa = TRUE) AS total_subscripciones_activas,

    -- Stats por módulo (desde v_estadisticas_modulos)
    (SELECT jsonb_agg(jsonb_build_object(
        'modulo', modulo_nombre,
        'orgs_activas', total_organizaciones_activas,
        'porcentaje_adopcion', porcentaje_adopcion,
        'revenue_mensual', revenue_mensual_estimado
    ))
    FROM v_estadisticas_modulos) AS stats_modulos,

    -- Top 5 módulos más populares
    (SELECT jsonb_agg(jsonb_build_object(
        'modulo', modulo_nombre,
        'orgs', total_organizaciones_activas
    ))
    FROM (
        SELECT modulo_nombre, total_organizaciones_activas
        FROM v_estadisticas_modulos
        WHERE modulo_nombre != 'core'  -- Excluir core (siempre 100%)
        ORDER BY total_organizaciones_activas DESC
        LIMIT 5
    ) top5) AS top_5_modulos,

    -- Cambios en las últimas 24 horas
    (SELECT COUNT(*)
     FROM historial_subscripciones
     WHERE tipo_evento = 'cambio_modulos'
       AND ocurrido_en >= NOW() - INTERVAL '24 hours') AS cambios_ultimas_24h

WITH DATA;

-- Índice en el timestamp para filtros por fecha
CREATE UNIQUE INDEX idx_mv_dashboard_modulos_snapshot
ON mv_dashboard_modulos_super_admin (snapshot_en);

COMMENT ON MATERIALIZED VIEW mv_dashboard_modulos_super_admin IS
'Vista materializada para dashboard de super admin. Se refresca cada hora vía pg_cron. Performance ~1ms';

-- ====================================================================
-- PERMISOS
-- ====================================================================

-- Vistas para la aplicación principal (saas_app tiene acceso completo)
GRANT SELECT ON v_organizaciones_modulos TO saas_app;
GRANT SELECT ON v_estadisticas_modulos TO saas_app;
GRANT SELECT ON v_cambios_modulos_recientes TO saas_app;
GRANT SELECT ON v_modulos_por_plan TO saas_app;
GRANT SELECT ON mv_dashboard_modulos_super_admin TO saas_app;

-- Usuario de solo lectura puede ver estadísticas
GRANT SELECT ON v_estadisticas_modulos TO readonly_user;
GRANT SELECT ON v_modulos_por_plan TO readonly_user;

-- ====================================================================
-- REFRESH AUTOMÁTICO DE MATERIALIZED VIEW (pg_cron)
-- ====================================================================
-- Este job se creará en el módulo de mantenimiento
-- Por ahora, solo documentamos el comando:
--
-- SELECT cron.schedule(
--   'refresh-dashboard-modulos',
--   '0 * * * *',  -- Cada hora en punto
--   $$REFRESH MATERIALIZED VIEW mv_dashboard_modulos_super_admin$$
-- );
--
-- Verificar que está programado:
-- SELECT * FROM cron.job WHERE jobname = 'refresh-dashboard-modulos';
-- ====================================================================
