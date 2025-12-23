-- ====================================================================
-- 📅 MÓDULO CITAS - ÍNDICES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 16 Noviembre 2025
-- Módulo: citas
--
-- DESCRIPCIÓN:
-- Índices especializados para optimizar consultas de citas y servicios.
-- Performance crítica para agenda, dashboard y reportes.
--
-- ÍNDICES TABLA CITAS (11 índices):
-- • idx_citas_codigo_unico: UNIQUE para búsqueda por código
-- • idx_citas_org_fecha: Agenda organizacional
-- • idx_citas_organizacion_fecha: Vista principal agenda
-- • idx_citas_profesional_agenda: Agenda del profesional (solapamientos)
-- • idx_citas_cliente_historial: Historial de cliente
-- • idx_citas_estado_workflow: Reportes por estado
-- • idx_citas_recordatorios_pendientes: Job de recordatorios
-- • idx_citas_search: Búsqueda full-text
-- • idx_citas_dia_covering: Dashboard citas del día
-- • idx_citas_metricas_mes: Reportes mensuales
-- • idx_citas_rango_fechas: Búsqueda por rango fechas
--
-- ÍNDICES TABLA CITAS_SERVICIOS (3 índices):
-- • idx_citas_servicios_cita_id: JOIN principal (evita N+1)
-- • idx_citas_servicios_servicio_id: Filtrado por servicio
-- • idx_citas_servicios_covering: Index-Only Scan
--
-- ====================================================================

-- ====================================================================
-- 📊 ÍNDICES PARA TABLA CITAS (PARTICIONADA)
-- ====================================================================
-- Los índices se crean a nivel de tabla padre y se propagan automáticamente
-- a todas las particiones. PostgreSQL crea índices locales en cada partición.
-- ====================================================================

-- ✅ ÍNDICE UNIQUE para codigo_cita (incluye fecha_cita para particionamiento)
-- Creado en 01-tablas-citas.sql dentro de CREATE TABLE
CREATE UNIQUE INDEX idx_citas_codigo_unico ON citas (codigo_cita, fecha_cita);

-- Índice en organizacion_id + fecha_cita para consultas frecuentes
-- Creado en 01-tablas-citas.sql dentro de CREATE TABLE
CREATE INDEX idx_citas_org_fecha ON citas (organizacion_id, fecha_cita);

-- 🏢 ÍNDICE 1: AGENDA ORGANIZACIONAL
-- Propósito: Vista principal de agenda por organización y fecha
-- Uso: WHERE organizacion_id = ? AND fecha_cita = ? ORDER BY hora_inicio
CREATE INDEX idx_citas_organizacion_fecha
    ON citas (organizacion_id, fecha_cita, hora_inicio)
    WHERE estado != 'cancelada';

-- 👨‍⚕️ ÍNDICE 2: AGENDA DEL PROFESIONAL
-- Propósito: Agenda individual del profesional (crítico para solapamientos)
-- Uso: WHERE profesional_id = ? AND fecha_cita = ? AND estado IN (...)
CREATE INDEX idx_citas_profesional_agenda
    ON citas (profesional_id, fecha_cita, hora_inicio, hora_fin)
    WHERE estado IN ('confirmada', 'en_curso');

-- 🧑‍💼 ÍNDICE 3: HISTORIAL DEL CLIENTE
-- Propósito: Ver todas las citas de un cliente ordenadas por fecha
-- Uso: WHERE cliente_id = ? ORDER BY fecha_cita DESC
CREATE INDEX idx_citas_cliente_historial
    ON citas (cliente_id, fecha_cita DESC)
    INCLUDE (profesional_id, estado, precio_total, duracion_total_minutos)
    WHERE estado IN ('completada', 'cancelada', 'no_asistio');

-- 🔄 ÍNDICE 4: WORKFLOW DE ESTADOS
-- Propósito: Consultas por estado de cita para reportes y dashboards
-- Uso: WHERE organizacion_id = ? AND estado = ? AND fecha_cita = ?
CREATE INDEX idx_citas_estado_workflow
    ON citas (organizacion_id, estado, fecha_cita);

-- 🔔 ÍNDICE 5: RECORDATORIOS PENDIENTES
-- Propósito: Job de envío de recordatorios de citas
-- Uso: WHERE recordatorio_enviado = FALSE AND estado = 'confirmada'
CREATE INDEX idx_citas_recordatorios_pendientes
    ON citas (fecha_recordatorio, fecha_cita, organizacion_id, cliente_id)
    WHERE recordatorio_enviado = FALSE AND estado = 'confirmada';

-- 🔍 ÍNDICE 6: BÚSQUEDA FULL-TEXT
-- Propósito: Búsqueda de citas por notas y código
-- Uso: Búsqueda global de citas por contenido
CREATE INDEX idx_citas_search
    ON citas USING gin(
        to_tsvector('spanish', COALESCE(notas_cliente, '') || ' ' ||
                              COALESCE(notas_profesional, '') || ' ' ||
                              COALESCE(codigo_cita, ''))
    );

-- 📊 ÍNDICE 7: COVERING INDEX PARA CITAS DEL DÍA
-- Propósito: Dashboard operacional de citas del día
-- Uso: SELECT * FROM citas WHERE organizacion_id = ? AND fecha_cita = ?
CREATE INDEX idx_citas_dia_covering
    ON citas (organizacion_id, fecha_cita, estado)
    INCLUDE (cliente_id, profesional_id, hora_inicio, hora_fin, notas_cliente, precio_total, duracion_total_minutos)
    WHERE estado IN ('confirmada', 'en_curso');

-- 📊 ÍNDICE 8: MÉTRICAS MENSUALES DE CITAS
-- Propósito: Reportes mensuales de citas activas y completadas
-- Uso: SELECT COUNT(*) FROM citas WHERE organizacion_id = ? AND fecha_cita >= ?
CREATE INDEX idx_citas_metricas_mes
    ON citas (organizacion_id, fecha_cita, estado)
    WHERE estado IN ('confirmada', 'completada', 'en_curso');

-- 📅 ÍNDICE 9: BÚSQUEDA DE CITAS POR RANGO DE FECHAS
-- Propósito: Dashboard de citas, calendarios, reportes
-- Uso: WHERE organizacion_id = ? AND fecha_cita BETWEEN ? AND ?
CREATE INDEX idx_citas_rango_fechas
    ON citas (organizacion_id, fecha_cita, estado)
    INCLUDE (cliente_id, profesional_id, hora_inicio, hora_fin, precio_total, duracion_total_minutos);

-- 🏢 ÍNDICE 10: FILTRO POR SUCURSAL (MULTI-SUCURSAL)
-- Propósito: Filtrar citas por sucursal en calendario y reportes
-- Uso: WHERE organizacion_id = ? AND sucursal_id = ? AND fecha_cita = ?
CREATE INDEX idx_citas_sucursal
    ON citas (organizacion_id, sucursal_id, fecha_cita)
    WHERE sucursal_id IS NOT NULL;

-- ====================================================================
-- 🔗 ÍNDICES PARA TABLA CITAS_SERVICIOS
-- ====================================================================
-- Optimización para relación M:N entre citas y servicios
-- Impacto: +10x performance en listados (evita query N+1)
-- ====================================================================

-- 🔑 ÍNDICE 1: BÚSQUEDA POR CITA (MÁS CRÍTICO)
-- Propósito: Obtener todos los servicios de una cita (JOIN principal)
-- Uso: WHERE cita_id = ? ORDER BY orden_ejecucion
CREATE INDEX idx_citas_servicios_cita_id
    ON citas_servicios (cita_id, orden_ejecucion);

-- 🔍 ÍNDICE 2: FILTRADO POR SERVICIO
-- Propósito: Encontrar citas que incluyan un servicio específico
-- Uso: WHERE servicio_id = ?
CREATE INDEX idx_citas_servicios_servicio_id
    ON citas_servicios (servicio_id);

-- ⚡ ÍNDICE 3: COVERING INDEX (MÁXIMO PERFORMANCE)
-- Propósito: Query sin acceder al heap (Index-Only Scan)
-- Uso: SELECT cita_id, servicio_id, precio_aplicado, duracion_minutos FROM...
CREATE INDEX idx_citas_servicios_covering
    ON citas_servicios (cita_id, servicio_id)
    INCLUDE (orden_ejecucion, precio_aplicado, duracion_minutos, descuento);

-- ====================================================================
-- 📝 COMENTARIOS DE ÍNDICES
-- ====================================================================

COMMENT ON INDEX idx_citas_codigo_unico IS
'Índice UNIQUE para búsqueda rápida por código de cita. Incluye fecha_cita para particionamiento.';

COMMENT ON INDEX idx_citas_org_fecha IS
'Índice base para consultas frecuentes por organización y fecha.';

COMMENT ON INDEX idx_citas_organizacion_fecha IS
'Vista principal de agenda. Excluye canceladas para mejor selectividad.';

COMMENT ON INDEX idx_citas_profesional_agenda IS
'Agenda del profesional - crítico para validación de solapamientos.';

COMMENT ON INDEX idx_citas_cliente_historial IS
'Historial de citas del cliente. Covering index con campos principales.';

COMMENT ON INDEX idx_citas_estado_workflow IS
'Reportes y dashboards por estado. Usado en métricas de citas.';

COMMENT ON INDEX idx_citas_recordatorios_pendientes IS
'Índice parcial optimizado para job de recordatorios. Solo indexa citas confirmadas sin recordatorio enviado.';

COMMENT ON INDEX idx_citas_search IS
'Búsqueda full-text en notas y código de cita. GIN index para queries con to_tsquery().';

COMMENT ON INDEX idx_citas_dia_covering IS
'Covering index para dashboard de citas del día. Evita acceso al heap (+40% performance).';

COMMENT ON INDEX idx_citas_metricas_mes IS
'Optimiza reportes mensuales. Índice parcial solo para estados relevantes en métricas.';

COMMENT ON INDEX idx_citas_rango_fechas IS
'Covering index para consultas de citas por rango de fechas. Performance +40% en queries de calendario.';

COMMENT ON INDEX idx_citas_servicios_cita_id IS
'Índice compuesto para obtener servicios de una cita ordenados. Evita N+1 query problem.';

COMMENT ON INDEX idx_citas_servicios_servicio_id IS
'Índice para filtrar citas por servicio. Usado en reportes de servicios más vendidos.';

COMMENT ON INDEX idx_citas_servicios_covering IS
'Covering index con campos más consultados. Permite Index-Only Scan para cálculos de totales.';

-- ====================================================================
-- 🔗 ÍNDICES PARA FOREIGN KEYS DE AUDITORÍA
-- ====================================================================
-- Optimización para JOINs con columnas de auditoría
-- Se propagan automáticamente a particiones
-- Agregados: Auditoría Dic 2025
-- ====================================================================

-- ✏️ ÍNDICE: CITAS CREADAS POR
-- Propósito: Auditoría de quién creó las citas
CREATE INDEX idx_citas_creado_por
    ON citas(creado_por);

-- ✏️ ÍNDICE: CITAS ACTUALIZADAS POR
-- Propósito: Auditoría de quién modificó las citas
CREATE INDEX idx_citas_actualizado_por
    ON citas(actualizado_por) WHERE actualizado_por IS NOT NULL;
