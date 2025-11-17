-- ====================================================================
-- 👁️ MÓDULO AUDITORÍA - VISTAS DE CONSULTA
-- ====================================================================
--
-- PROPÓSITO:
-- Vistas optimizadas para reportes y análisis común del sistema
-- de auditoría y eventos.
--
-- COMPONENTES:
-- • 2 vistas de consulta
--
-- CARACTERÍSTICAS:
-- ✅ Vista de resumen por organización
-- ✅ Vista de eventos críticos recientes
-- ✅ Información agregada con JOINs
-- ✅ Filtros automáticos
--
-- USO:
-- • Dashboards administrativos
-- • Reportes de auditoría
-- • Monitoreo de seguridad
-- • Análisis de tendencias
--
-- ORDEN DE CARGA: #9 (después de triggers)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- VISTA 1: RESUMEN DE EVENTOS POR ORGANIZACIÓN
-- ====================================================================
-- Retorna estadísticas agregadas de eventos por organización
-- para dashboards administrativos y análisis de actividad
-- ────────────────────────────────────────────────────────────────────

CREATE VIEW eventos_resumen_organizacion AS
SELECT
    o.id as organizacion_id,
    o.nombre_comercial,
    COUNT(*) as total_eventos,
    COUNT(*) FILTER (WHERE e.gravedad = 'critical') as eventos_criticos,
    COUNT(*) FILTER (WHERE e.gravedad = 'error') as eventos_error,
    COUNT(*) FILTER (WHERE e.tipo_evento::TEXT LIKE 'login_%') as eventos_login,
    COUNT(*) FILTER (WHERE e.tipo_evento::TEXT LIKE 'cita_%') as eventos_citas,
    COUNT(*) FILTER (WHERE e.creado_en::DATE >= CURRENT_DATE - INTERVAL '30 days') as eventos_ultimo_mes,
    MAX(e.creado_en) as ultimo_evento,
    MIN(e.creado_en) as primer_evento
FROM organizaciones o
LEFT JOIN eventos_sistema e ON e.organizacion_id = o.id
WHERE o.activo = true
GROUP BY o.id, o.nombre_comercial
ORDER BY total_eventos DESC;

COMMENT ON VIEW eventos_resumen_organizacion IS
'Vista agregada con estadísticas de eventos por organización para dashboards administrativos.
Incluye:
  - Total de eventos
  - Contadores por gravedad (critical, error)
  - Contadores por tipo (login, citas)
  - Eventos del último mes
  - Fecha del primer y último evento
Filtro: Solo organizaciones activas
Uso: Dashboards administrativos, análisis de actividad';

-- ====================================================================
-- VISTA 2: EVENTOS CRÍTICOS RECIENTES
-- ====================================================================
-- Retorna eventos críticos de los últimos 7 días para
-- monitoreo y alertas del sistema
-- ────────────────────────────────────────────────────────────────────

CREATE VIEW eventos_criticos_recientes AS
SELECT
    e.id,
    e.organizacion_id,
    o.nombre_comercial,
    e.tipo_evento,
    e.gravedad,
    e.descripcion,
    e.usuario_id,
    u.nombre as usuario_nombre,
    e.ip_address,
    e.creado_en,
    e.metadata
FROM eventos_sistema e
JOIN organizaciones o ON e.organizacion_id = o.id
LEFT JOIN usuarios u ON e.usuario_id = u.id
WHERE e.gravedad IN ('error', 'critical')
AND e.creado_en >= NOW() - INTERVAL '7 days'
ORDER BY e.creado_en DESC;

COMMENT ON VIEW eventos_criticos_recientes IS
'Vista de eventos críticos de los últimos 7 días para monitoreo y alertas.
Incluye:
  - Información del evento (tipo, gravedad, descripción)
  - Datos de la organización
  - Información del usuario responsable
  - IP de origen
  - Metadata completo
Filtros:
  - Gravedad: error o critical
  - Rango temporal: Últimos 7 días
Uso: Monitoreo de sistema, alertas de seguridad, troubleshooting';

-- ====================================================================
-- 📊 RESUMEN DE VISTAS
-- ====================================================================
-- Total: 2 vistas de consulta
--
-- eventos_resumen_organizacion:
-- • Estadísticas agregadas por organización
-- • JOINs: organizaciones + eventos_sistema
-- • Filtros: organizaciones activas
-- • Uso: Dashboards administrativos, análisis de actividad
-- • Campos: 10 métricas agregadas
--
-- eventos_criticos_recientes:
-- • Eventos críticos de los últimos 7 días
-- • JOINs: eventos_sistema + organizaciones + usuarios
-- • Filtros: gravedad error/critical, últimos 7 días
-- • Uso: Monitoreo, alertas, troubleshooting
-- • Campos: Información completa del evento
--
-- Beneficios:
-- • Simplifica consultas complejas en el backend
-- • Evita duplicación de lógica de negocio
-- • Mejora legibilidad del código
-- • Facilita mantenimiento y cambios futuros
-- • Optimiza performance con JOINs pre-calculados
--
-- Consideraciones:
-- • Las vistas NO son materializadas (calculadas en tiempo real)
-- • Para grandes volúmenes considerar materialized views
-- • Los índices en las tablas base optimizan las vistas
-- ====================================================================
