-- ====================================================================
-- 📊 MÓDULO MANTENIMIENTO - ÍNDICES ESPECIALIZADOS
-- ====================================================================
--
-- PROPÓSITO:
-- Optimización de consultas para archivado y gestión de datos antiguos.
--
-- COMPONENTES:
-- • 1 índice en citas.archivada (parcial)
-- • 1 índice compuesto para archivado de citas
--
-- PERFORMANCE:
-- ✅ Filtrado rápido de citas archivadas
-- ✅ Identificación eficiente de citas candidatas a archivo
--
-- ORDEN DE CARGA: #12 (después de tablas)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- ÍNDICES: TABLA CITAS (ARCHIVADO)
-- ====================================================================

-- 1. Índice parcial para citas archivadas
-- Propósito: Excluir citas archivadas en queries activas
-- Uso: WHERE archivada = TRUE
CREATE INDEX IF NOT EXISTS idx_citas_archivada
    ON citas(archivada)
    WHERE archivada = TRUE;

COMMENT ON INDEX idx_citas_archivada IS
'Índice parcial para filtrar citas archivadas.
Permite excluir rápidamente citas antiguas en queries de producción.';

-- 2. Índice compuesto para identificar candidatas a archivo
-- Propósito: Función archivar_citas_antiguas()
-- Uso: WHERE estado IN (...) AND archivada = FALSE
CREATE INDEX IF NOT EXISTS idx_citas_fecha_estado_archivado
    ON citas(fecha_cita, estado, archivada)
    WHERE estado IN ('completada', 'cancelada', 'no_asistio')
    AND archivada = FALSE;

COMMENT ON INDEX idx_citas_fecha_estado_archivado IS
'Índice compuesto para identificar citas candidatas a archivado.
Usado por función archivar_citas_antiguas() para marcar citas antiguas.';
