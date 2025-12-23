-- ====================================================================
-- MÓDULO WORKFLOWS - ÍNDICES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: workflows
--
-- DESCRIPCIÓN:
-- Índices optimizados para consultas frecuentes del motor de workflows.
--
-- ====================================================================

-- ====================================================================
-- ÍNDICES PARA workflow_definiciones
-- ====================================================================

-- Buscar workflows activos por organización y tipo de entidad
CREATE INDEX IF NOT EXISTS idx_workflow_definiciones_org_entidad
    ON workflow_definiciones(organizacion_id, entidad_tipo)
    WHERE activo = true;

-- Buscar por código dentro de organización
CREATE INDEX IF NOT EXISTS idx_workflow_definiciones_codigo
    ON workflow_definiciones(organizacion_id, codigo);


-- ====================================================================
-- ÍNDICES PARA workflow_pasos
-- ====================================================================

-- Buscar pasos por workflow y orden
CREATE INDEX IF NOT EXISTS idx_workflow_pasos_workflow_orden
    ON workflow_pasos(workflow_id, orden);

-- Buscar pasos por tipo (útil para encontrar paso inicial)
CREATE INDEX IF NOT EXISTS idx_workflow_pasos_tipo
    ON workflow_pasos(workflow_id, tipo);


-- ====================================================================
-- ÍNDICES PARA workflow_transiciones
-- ====================================================================

-- Buscar transiciones desde un paso origen
CREATE INDEX IF NOT EXISTS idx_workflow_transiciones_origen
    ON workflow_transiciones(paso_origen_id, orden);

-- Buscar por workflow
CREATE INDEX IF NOT EXISTS idx_workflow_transiciones_workflow
    ON workflow_transiciones(workflow_id);


-- ====================================================================
-- ÍNDICES PARA workflow_instancias
-- ====================================================================

-- Buscar instancias en progreso por organización (para bandeja de aprobaciones)
CREATE INDEX IF NOT EXISTS idx_workflow_instancias_pendientes
    ON workflow_instancias(organizacion_id, estado, prioridad DESC, iniciado_en DESC)
    WHERE estado = 'en_progreso';

-- Buscar por entidad específica
CREATE INDEX IF NOT EXISTS idx_workflow_instancias_entidad
    ON workflow_instancias(entidad_tipo, entidad_id);

-- Buscar por paso actual (para identificar quién debe aprobar)
CREATE INDEX IF NOT EXISTS idx_workflow_instancias_paso_actual
    ON workflow_instancias(paso_actual_id)
    WHERE estado = 'en_progreso';

-- Buscar por usuario que inició
CREATE INDEX IF NOT EXISTS idx_workflow_instancias_iniciador
    ON workflow_instancias(iniciado_por, iniciado_en DESC);

-- Buscar instancias completadas por fecha
CREATE INDEX IF NOT EXISTS idx_workflow_instancias_completadas
    ON workflow_instancias(organizacion_id, completado_en DESC)
    WHERE estado IN ('aprobado', 'rechazado');


-- ====================================================================
-- ÍNDICES PARA workflow_historial
-- ====================================================================

-- Buscar historial por instancia (orden cronológico)
CREATE INDEX IF NOT EXISTS idx_workflow_historial_instancia
    ON workflow_historial(instancia_id, ejecutado_en DESC);

-- Buscar acciones por usuario
CREATE INDEX IF NOT EXISTS idx_workflow_historial_usuario
    ON workflow_historial(usuario_id, ejecutado_en DESC)
    WHERE usuario_id IS NOT NULL;

-- Buscar por tipo de acción
CREATE INDEX IF NOT EXISTS idx_workflow_historial_accion
    ON workflow_historial(instancia_id, accion);


-- ====================================================================
-- ÍNDICES PARA workflow_delegaciones
-- ====================================================================

-- Buscar delegaciones activas para un usuario
CREATE INDEX IF NOT EXISTS idx_workflow_delegaciones_activas
    ON workflow_delegaciones(usuario_original_id, fecha_inicio, fecha_fin)
    WHERE activo = true;

-- Buscar delegaciones por delegado (para saber qué puede aprobar)
CREATE INDEX IF NOT EXISTS idx_workflow_delegaciones_delegado
    ON workflow_delegaciones(usuario_delegado_id, fecha_inicio, fecha_fin)
    WHERE activo = true;

-- Buscar por organización y fechas
CREATE INDEX IF NOT EXISTS idx_workflow_delegaciones_org
    ON workflow_delegaciones(organizacion_id, fecha_inicio, fecha_fin)
    WHERE activo = true;


-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
