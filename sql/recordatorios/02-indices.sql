-- ====================================================================
-- 🔔 MÓDULO RECORDATORIOS - ÍNDICES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 25 Noviembre 2025
-- Módulo: recordatorios
--
-- DESCRIPCIÓN:
-- Índices optimizados para consultas frecuentes del sistema de
-- recordatorios. Prioriza las consultas del job de procesamiento
-- que se ejecuta cada 5 minutos.
--
-- ====================================================================

-- ====================================================================
-- ÍNDICES: configuracion_recordatorios
-- ====================================================================

-- Índice principal por organización (ya cubierto por UK)
-- La constraint UNIQUE ya crea un índice implícito

-- Índice para buscar configs activas
CREATE INDEX IF NOT EXISTS idx_config_recordatorios_habilitado
ON configuracion_recordatorios(habilitado)
WHERE habilitado = TRUE;

-- ====================================================================
-- ÍNDICES: historial_recordatorios
-- ====================================================================

-- ÍNDICE CRÍTICO: Job de procesamiento de recordatorios pendientes
-- Usado cada 5 minutos para encontrar recordatorios por enviar
CREATE INDEX IF NOT EXISTS idx_historial_recordatorios_pendientes
ON historial_recordatorios(programado_para)
WHERE estado = 'pendiente';

-- Índice para consultas por organización y fecha
CREATE INDEX IF NOT EXISTS idx_historial_recordatorios_org_fecha
ON historial_recordatorios(organizacion_id, creado_en DESC);

-- Índice para consultas por cita (ver historial de una cita)
CREATE INDEX IF NOT EXISTS idx_historial_recordatorios_cita
ON historial_recordatorios(cita_id);

-- Índice para consultas por estado (dashboard, reportes)
CREATE INDEX IF NOT EXISTS idx_historial_recordatorios_estado
ON historial_recordatorios(organizacion_id, estado);

-- Índice para consultas por sender (historial de un cliente)
CREATE INDEX IF NOT EXISTS idx_historial_recordatorios_sender
ON historial_recordatorios(sender, creado_en DESC);

-- Índice para reintentos fallidos
CREATE INDEX IF NOT EXISTS idx_historial_recordatorios_reintentos
ON historial_recordatorios(programado_para, intento_numero)
WHERE estado = 'fallido' AND intento_numero < 3;

-- ====================================================================
-- ÍNDICE EN TABLA CITAS: Recordatorios pendientes
-- ====================================================================
-- Este índice ya existe según el análisis, pero lo reforzamos aquí
-- para documentación. Si ya existe, el IF NOT EXISTS lo ignora.
-- ====================================================================

-- Índice parcial para citas que necesitan recordatorio
-- Optimiza el JOIN con historial_recordatorios
-- NOTA: No se puede usar NOW() en predicados (no es IMMUTABLE)
-- El filtro de fecha futura se aplica en la query
CREATE INDEX IF NOT EXISTS idx_citas_recordatorios_pendientes_v2
ON citas(fecha_cita, organizacion_id)
WHERE estado IN ('pendiente', 'confirmada')
  AND recordatorio_enviado = FALSE;
