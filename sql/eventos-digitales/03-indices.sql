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
    WHERE activo = true;

-- Ordenamiento por fecha del evento
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_fecha
    ON eventos_digitales(fecha_evento)
    WHERE activo = true;

-- Filtro por tipo de evento
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_tipo
    ON eventos_digitales(tipo)
    WHERE activo = true;

-- Eventos publicados (para listados públicos)
CREATE INDEX IF NOT EXISTS idx_eventos_digitales_publicados
    ON eventos_digitales(publicado_en)
    WHERE estado = 'publicado' AND activo = true;

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
    WHERE activo = true;

-- ====================================================================
-- MESA DE REGALOS
-- ====================================================================

-- Listado por evento
CREATE INDEX IF NOT EXISTS idx_mesa_regalos_evento
    ON mesa_regalos_evento(evento_id);

-- Ordenamiento
CREATE INDEX IF NOT EXISTS idx_mesa_regalos_evento_orden
    ON mesa_regalos_evento(evento_id, orden)
    WHERE activo = true;

-- Filtro por disponibilidad (no comprados)
CREATE INDEX IF NOT EXISTS idx_mesa_regalos_disponibles
    ON mesa_regalos_evento(evento_id, comprado)
    WHERE activo = true AND comprado = false;

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
-- PLANTILLAS (sin RLS pero con índices útiles)
-- ====================================================================

-- Filtro por tipo de evento
CREATE INDEX IF NOT EXISTS idx_plantillas_evento_tipo
    ON plantillas_evento(tipo_evento)
    WHERE activo = true;

-- Ordenamiento para listado
CREATE INDEX IF NOT EXISTS idx_plantillas_evento_orden
    ON plantillas_evento(orden, nombre)
    WHERE activo = true;

-- ====================================================================
-- COMENTARIOS DE ÍNDICES
-- ====================================================================
COMMENT ON INDEX idx_invitados_evento_token IS
    'Índice único crítico para búsqueda de invitados por token en rutas públicas';

COMMENT ON INDEX idx_invitados_evento_etiquetas IS
    'Índice GIN para búsqueda eficiente en array de etiquetas JSONB';

COMMENT ON INDEX idx_eventos_digitales_publicados IS
    'Índice parcial para listar solo eventos publicados y activos';
