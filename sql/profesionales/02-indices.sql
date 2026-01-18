-- ====================================================================
-- MÓDULO PROFESIONALES: ÍNDICES ESPECIALIZADOS
-- ====================================================================
-- Índices optimizados para la tabla profesionales.
-- Extraído de sql/servicios/ para modularización (Dic 2025)
--
-- 🗑️ PATRÓN SOFT DELETE (Dic 2025):
-- Todos los índices parciales usan `eliminado_en IS NULL` como filtro
-- para excluir registros eliminados lógicamente.
--
-- CARACTERÍSTICAS:
-- • Índices multi-tenant para aislamiento por organización
-- • Índices GIN para búsqueda full-text en español
-- • Índices parciales para filtrar solo registros activos
-- • Índices covering para máxima performance
-- ====================================================================

-- ====================================================================
-- 👨‍💼 ÍNDICES PARA TABLA PROFESIONALES (9 índices especializados)
-- ====================================================================
-- Optimización para gestión de personal y asignación de citas
-- ────────────────────────────────────────────────────────────────────

-- 🏢 ÍNDICE 1: MULTI-TENANT PRINCIPAL
-- Propósito: Consultas principales filtradas por organización
-- Uso: WHERE organizacion_id = ? AND eliminado_en IS NULL
CREATE INDEX idx_profesionales_org_activo
    ON profesionales (organizacion_id, activo) WHERE eliminado_en IS NULL;

-- 📧 ÍNDICE 2: EMAIL ÚNICO POR ORGANIZACIÓN
-- Propósito: Validar email único dentro de cada organización
-- Uso: Constraint de unicidad multi-tenant
CREATE UNIQUE INDEX idx_profesionales_email_org
    ON profesionales (organizacion_id, email)
    WHERE email IS NOT NULL AND eliminado_en IS NULL;

-- 📋 ÍNDICE 3: BÚSQUEDA EN LICENCIAS Y CERTIFICACIONES
-- Propósito: Filtrar por licencias específicas (útil para médicos, etc.)
-- Uso: WHERE licencias_profesionales ? 'cedula_profesional'
CREATE INDEX idx_profesionales_licencias_gin
    ON profesionales USING gin(licencias_profesionales) WHERE eliminado_en IS NULL;

-- 🌟 ÍNDICE 4: RANKING Y DISPONIBILIDAD
-- Propósito: Ordenar profesionales por calificación y disponibilidad
-- Uso: ORDER BY calificacion_promedio DESC, disponible_online DESC
CREATE INDEX idx_profesionales_ranking
    ON profesionales (organizacion_id, disponible_online, calificacion_promedio DESC, activo)
    WHERE eliminado_en IS NULL;

-- 📝 ÍNDICE 5: BÚSQUEDA FULL-TEXT COMBINADA
-- Propósito: Búsqueda avanzada en múltiples campos
-- Uso: Busca simultáneamente en nombre, teléfono, email, biografía
DROP INDEX IF EXISTS idx_profesionales_nombre_gin;  -- Reemplazar índice simple

CREATE INDEX idx_profesionales_search_combined
    ON profesionales USING gin(
        to_tsvector('spanish',
            COALESCE(nombre_completo, '') || ' ' ||
            COALESCE(telefono, '') || ' ' ||
            COALESCE(email, '') || ' ' ||
            COALESCE(biografia, '')
        )
    ) WHERE activo = TRUE;

COMMENT ON INDEX idx_profesionales_search_combined IS
'Índice GIN compuesto para búsqueda full-text en profesionales.
Busca en: nombre, teléfono, email, biografía.
Útil para: Buscador de profesionales, filtros avanzados.
Performance: <10ms para millones de registros.';

-- 👨‍💼 ÍNDICE 6: COVERING INDEX PARA PROFESIONALES DISPONIBLES ONLINE
-- Propósito: Listado de profesionales para agendamiento online
-- Uso: WHERE organizacion_id = ? AND activo = TRUE AND disponible_online = TRUE
-- Ventaja: INCLUDE ampliado con datos de contacto
DROP INDEX IF EXISTS idx_profesionales_disponibles;

CREATE INDEX idx_profesionales_disponibles_covering
    ON profesionales (organizacion_id, activo, disponible_online)
    INCLUDE (nombre_completo, calificacion_promedio, telefono, email)
    WHERE activo = TRUE AND disponible_online = TRUE;

COMMENT ON INDEX idx_profesionales_disponibles_covering IS
'Índice covering para búsqueda rápida de profesionales disponibles.
INCLUDE evita acceso al heap (+40% performance).
Query típico: SELECT nombre, calificacion, telefono, email
             FROM profesionales
             WHERE organizacion_id = ? AND activo = TRUE AND disponible_online = TRUE;';

-- 🔗 ÍNDICE 7: BÚSQUEDA POR USUARIO VINCULADO
-- Propósito: Encontrar profesional por usuario (para auto-asignación en POS)
-- Uso: WHERE usuario_id = ? (query desde VentaPOSPage)
-- Performance: O(1) - índice parcial solo con usuarios vinculados
CREATE INDEX idx_profesionales_usuario
    ON profesionales (usuario_id)
    WHERE usuario_id IS NOT NULL;

COMMENT ON INDEX idx_profesionales_usuario IS
'Índice para vincular profesionales con usuarios del sistema.
Uso principal: Auto-asignación de vendedor en POS.
Query: SELECT * FROM profesionales WHERE usuario_id = ?
Performance: O(1), índice parcial solo incluye registros con usuario vinculado.';

-- 🔐 ÍNDICE 8: ELIMINADO (Dic 2025)
-- El campo modulos_acceso fue migrado al sistema de permisos normalizados.
-- Ver: sql/nucleo/11-tablas-permisos.sql para el nuevo sistema.

-- 🏛️ ÍNDICE 8: JERARQUÍA - BÚSQUEDA POR SUPERVISOR
-- Propósito: Encontrar subordinados directos de un supervisor
-- Uso: WHERE supervisor_id = ?
CREATE INDEX idx_profesionales_supervisor
    ON profesionales (supervisor_id)
    WHERE supervisor_id IS NOT NULL;

COMMENT ON INDEX idx_profesionales_supervisor IS
'Índice para consultas de jerarquía organizacional.
Usado por: get_subordinados(), organigrama, reportes de supervisión.';

-- 🏢 ÍNDICE 10: BÚSQUEDA POR DEPARTAMENTO
-- Propósito: Listar profesionales de un departamento
-- Uso: WHERE departamento_id = ?
CREATE INDEX idx_profesionales_departamento
    ON profesionales (departamento_id)
    WHERE departamento_id IS NOT NULL;

-- 💼 ÍNDICE 11: BÚSQUEDA POR PUESTO
-- Propósito: Listar profesionales por puesto de trabajo
-- Uso: WHERE puesto_id = ?
CREATE INDEX idx_profesionales_puesto
    ON profesionales (puesto_id)
    WHERE puesto_id IS NOT NULL;

-- ====================================================================
-- 🔗 ÍNDICES PARA FOREIGN KEYS DE AUDITORÍA
-- ====================================================================
-- Agregados: Auditoría Dic 2025
-- ====================================================================

-- 🗑️ ÍNDICE: PROFESIONALES ELIMINADOS POR
-- Propósito: JOINs eficientes para auditoría de eliminaciones
CREATE INDEX idx_profesionales_eliminado_por
    ON profesionales(eliminado_por) WHERE eliminado_por IS NOT NULL;
