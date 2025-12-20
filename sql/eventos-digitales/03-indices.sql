-- ====================================================================
-- MÓDULO EVENTOS DIGITALES - ÍNDICES
-- ====================================================================
-- Índices optimizados para las consultas más frecuentes
--
-- Fecha creación: 4 Diciembre 2025
-- ====================================================================

-- ====================================================================
-- EVENTOS DIGITALES
-- ====================================================================

-- Índice principal para RLS y listados por organización
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_org
    ON eventos_digitales(organizacion_id);

-- Búsqueda por slug (rutas públicas)
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_slug
    ON eventos_digitales(slug);

-- Índice compuesto para búsqueda slug + org (unique constraint ya lo cubre, pero explícito)
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_org_slug
    ON eventos_digitales(organizacion_id, slug);

-- Filtro por estado (solo eventos activos)
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_estado
    ON eventos_digitales(estado)
    WHERE eliminado_en IS NULL;

-- Ordenamiento por fecha del evento
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_fecha
    ON eventos_digitales(fecha_evento)
    WHERE eliminado_en IS NULL;

-- ====================================================================
-- ÍNDICES OPTIMIZADOS PARA CONSULTAS POR FECHA (Dic 2025)
-- ====================================================================
-- Corrección de auditoría: índices compuestos para consultas multi-tenant
-- ====================================================================

-- Consultas de agenda por organización y fecha
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_org_fecha
    ON eventos_digitales(organizacion_id, fecha_evento)
    WHERE eliminado_en IS NULL AND estado != 'cancelado';

-- Covering index para listados de eventos (evita acceso al heap)
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_org_fecha_covering
    ON eventos_digitales(organizacion_id, fecha_evento, estado)
    INCLUDE (nombre, tipo, slug, portada_url)
    WHERE eliminado_en IS NULL;

-- Consultas de eventos publicados (dashboard)
-- NOTA: No se puede usar CURRENT_DATE en predicado (no es IMMUTABLE)
-- El filtro de fecha se hace en la query, el índice optimiza estado='publicado'
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_publicados_fecha
    ON eventos_digitales(organizacion_id, fecha_evento DESC, estado)
    WHERE eliminado_en IS NULL
      AND estado = 'publicado';

COMMENT ON INDEX idx_eventos_digitales_org_fecha IS
'Índice multi-tenant para consultas de eventos por fecha. Excluye cancelados y eliminados.';

COMMENT ON INDEX idx_eventos_digitales_org_fecha_covering IS
'Covering index para listados de eventos. INCLUDE evita acceso al heap (+40% performance).';

COMMENT ON INDEX idx_eventos_digitales_publicados_fecha IS
'Índice parcial para eventos publicados ordenados por fecha. El filtro fecha >= NOW() se aplica en la query.';

-- Filtro por tipo de evento
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_tipo
    ON eventos_digitales(tipo)
    WHERE eliminado_en IS NULL;

-- Eventos publicados (para listados públicos)
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_publicados
    ON eventos_digitales(publicado_en)
    WHERE estado = 'publicado' AND eliminado_en IS NULL;

-- ====================================================================
-- INVITADOS EVENTO
-- ====================================================================

-- Índice principal para RLS
CREATE INDEX IF NOT EXISTS idx_invitados_evento_org
    ON invitados_evento(organizacion_id);

-- Listado de invitados por evento
CREATE INDEX IF NOT EXISTS idx_invitados_evento_evento
    ON invitados_evento(evento_id);

-- Índice compuesto org + evento para listados
CREATE INDEX IF NOT EXISTS idx_invitados_evento_org_evento
    ON invitados_evento(organizacion_id, evento_id);

-- Búsqueda por token (rutas públicas - CRÍTICO para performance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitados_evento_token
    ON invitados_evento(token);

-- Filtro por estado RSVP (dashboard de confirmaciones)
CREATE INDEX IF NOT EXISTS idx_invitados_evento_estado_rsvp
    ON invitados_evento(evento_id, estado_rsvp);

-- Búsqueda por teléfono (para verificar duplicados)
CREATE INDEX IF NOT EXISTS idx_invitados_evento_telefono
    ON invitados_evento(telefono)
    WHERE telefono IS NOT NULL;

-- Búsqueda por email
CREATE INDEX IF NOT EXISTS idx_invitados_evento_email
    ON invitados_evento(email)
    WHERE email IS NOT NULL;

-- Filtro por grupo familiar
CREATE INDEX IF NOT EXISTS idx_invitados_evento_grupo
    ON invitados_evento(evento_id, grupo_familiar)
    WHERE grupo_familiar IS NOT NULL;

-- Índice GIN para búsqueda en etiquetas JSONB
CREATE INDEX IF NOT EXISTS idx_invitados_evento_etiquetas
    ON invitados_evento USING GIN (etiquetas);

-- ====================================================================
-- UBICACIONES EVENTO
-- ====================================================================

-- Listado por evento
CREATE INDEX IF NOT EXISTS idx_ubicaciones_evento_evento
    ON ubicaciones_evento(evento_id);

-- Ordenamiento
CREATE INDEX IF NOT EXISTS idx_ubicaciones_evento_orden
    ON ubicaciones_evento(evento_id, orden)
    WHERE eliminado_en IS NULL;

-- ====================================================================
-- MESA DE REGALOS
-- ====================================================================

-- Listado por evento
CREATE INDEX IF NOT EXISTS idx_mesa_regalos_evento
    ON mesa_regalos_evento(evento_id);

-- Ordenamiento
CREATE INDEX IF NOT EXISTS idx_mesa_regalos_evento_orden
    ON mesa_regalos_evento(evento_id, orden)
    WHERE eliminado_en IS NULL;

-- Filtro por disponibilidad (no comprados)
CREATE INDEX IF NOT EXISTS idx_mesa_regalos_disponibles
    ON mesa_regalos_evento(evento_id, comprado)
    WHERE eliminado_en IS NULL AND comprado = FALSE;

-- ====================================================================
-- FELICITACIONES
-- ====================================================================

-- Listado por evento
CREATE INDEX IF NOT EXISTS idx_felicitaciones_evento
    ON felicitaciones_evento(evento_id);

-- Solo felicitaciones aprobadas (vista pública)
CREATE INDEX IF NOT EXISTS idx_felicitaciones_aprobadas
    ON felicitaciones_evento(evento_id, creado_en DESC)
    WHERE aprobado = true;

-- ====================================================================
-- MESAS EVENTO (Seating Chart)
-- ====================================================================

-- Listado por evento
CREATE INDEX IF NOT EXISTS idx_mesas_evento_evento
    ON mesas_evento(evento_id)
    WHERE eliminado_en IS NULL;

-- Índice para buscar invitados por mesa
CREATE INDEX IF NOT EXISTS idx_invitados_evento_mesa
    ON invitados_evento(mesa_id)
    WHERE mesa_id IS NOT NULL;

-- Índice compuesto evento + mesa para listados de asignación
CREATE INDEX IF NOT EXISTS idx_invitados_evento_evento_mesa
    ON invitados_evento(evento_id, mesa_id)
    WHERE eliminado_en IS NULL;

-- ====================================================================
-- PLANTILLAS (sin RLS pero con índices útiles)
-- ====================================================================

-- Filtro por tipo de evento
CREATE INDEX IF NOT EXISTS idx_plantillas_evento_tipo
    ON plantillas_evento(tipo_evento)
    WHERE eliminado_en IS NULL;

-- Filtro por categoría (infantil, elegante, moderno, etc.)
CREATE INDEX IF NOT EXISTS idx_plantillas_evento_categoria
    ON plantillas_evento(categoria)
    WHERE eliminado_en IS NULL AND categoria IS NOT NULL;

-- Filtro por subcategoría (superheroes, princesas, kpop, etc.)
CREATE INDEX IF NOT EXISTS idx_plantillas_evento_subcategoria
    ON plantillas_evento(subcategoria)
    WHERE eliminado_en IS NULL AND subcategoria IS NOT NULL;

-- Índice compuesto para filtros combinados
CREATE INDEX IF NOT EXISTS idx_plantillas_evento_tipo_cat
    ON plantillas_evento(tipo_evento, categoria)
    WHERE eliminado_en IS NULL;

-- Ordenamiento para listado
CREATE INDEX IF NOT EXISTS idx_plantillas_evento_orden
    ON plantillas_evento(orden, nombre)
    WHERE eliminado_en IS NULL;

-- ====================================================================
-- COMENTARIOS DE ÍNDICES
-- ====================================================================
COMMENT ON INDEX idx_invitados_evento_token IS
    'Índice único crítico para búsqueda de invitados por token en rutas públicas';

COMMENT ON INDEX idx_invitados_evento_etiquetas IS
    'Índice GIN para búsqueda eficiente en array de etiquetas JSONB';

COMMENT ON INDEX idx_eventos_digitales_publicados IS
    'Índice parcial para listar solo eventos publicados y activos';
