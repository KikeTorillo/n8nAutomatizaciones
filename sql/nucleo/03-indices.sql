-- ====================================================================
-- MÓDULO NÚCLEO: ÍNDICES ESPECIALIZADOS
-- ====================================================================
-- Índices optimizados para tablas core y subscripciones.
-- Estrategia: Covering indexes + índices parciales + GIN compuestos
--
-- Migrado de: sql/schema/07-indexes.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- ÍNDICES PARA USUARIOS
-- ====================================================================

-- Propósito: Login de usuarios (consulta MÁS frecuente del sistema)
-- Índice parcial que solo indexa usuarios activos
CREATE UNIQUE INDEX idx_usuarios_email_unique
    ON usuarios (email) WHERE activo = TRUE;

-- Propósito: Listar usuarios por organización y filtrar por rol
-- Covering index para evitar table lookups
CREATE INDEX idx_usuarios_org_rol_activo
    ON usuarios (organizacion_id, rol, activo) WHERE activo = TRUE;

-- Propósito: Vincular usuarios con sus perfiles profesionales
-- Índice parcial solo para usuarios que SÍ tienen profesional_id
CREATE INDEX idx_usuarios_profesional_id
    ON usuarios (profesional_id) WHERE profesional_id IS NOT NULL;

-- Propósito: Identificar usuarios bloqueados o con intentos fallidos
-- Para funcionalidad de seguridad (rate limiting, bloqueos)
CREATE INDEX idx_usuarios_seguridad
    ON usuarios (intentos_fallidos, bloqueado_hasta)
    WHERE intentos_fallidos > 0 OR bloqueado_hasta IS NOT NULL;

-- Propósito: Recuperación de contraseña (lookup por token)
-- Índice parcial solo para tokens válidos no expirados
CREATE INDEX idx_usuarios_reset_token
    ON usuarios (token_reset_password, token_reset_expira)
    WHERE token_reset_password IS NOT NULL AND token_reset_usado_en IS NULL;

-- Propósito: Verificación de email (lookup por token)
-- Índice parcial solo para tokens válidos no usados
CREATE INDEX idx_usuarios_verificacion_email_token
    ON usuarios (token_verificacion_email, token_verificacion_expira)
    WHERE token_verificacion_email IS NOT NULL AND token_verificacion_usado_en IS NULL;

-- Propósito: Métricas y listados de usuarios para admins
-- Dashboard de actividad de usuarios
CREATE INDEX idx_usuarios_dashboard
    ON usuarios (organizacion_id, ultimo_login, activo)
    WHERE activo = TRUE;

-- Propósito: Búsqueda fuzzy de usuarios por nombre
-- Índice GIN para búsquedas full-text en español
CREATE INDEX idx_usuarios_nombre_gin
    ON usuarios USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(apellidos, '')))
    WHERE activo = TRUE;

-- Propósito: Listar usuarios activos vinculados a organizaciones
-- Para queries que filtran por organización
CREATE INDEX IF NOT EXISTS idx_usuarios_organizacion_activos
    ON usuarios(organizacion_id)
    WHERE activo = TRUE;

-- Propósito: Búsqueda eficiente de usuarios bot
-- Índice parcial para usuarios con rol=bot activos (1 por organización)
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_org
    ON usuarios(rol, organizacion_id)
    WHERE rol = 'bot' AND activo = TRUE;

-- ====================================================================
-- ÍNDICES PARA ORGANIZACIONES
-- ====================================================================

-- Propósito: Login y lookups por código de tenant
-- Índice parcial solo para organizaciones activas
CREATE UNIQUE INDEX idx_organizaciones_codigo_tenant
    ON organizaciones (codigo_tenant) WHERE activo = TRUE;

-- Propósito: URLs personalizadas para organizaciones
-- Índice parcial solo para slugs activos no nulos
CREATE UNIQUE INDEX idx_organizaciones_slug
    ON organizaciones (slug) WHERE activo = TRUE AND slug IS NOT NULL;

-- Propósito: Reportes y estadísticas por categoría de organización (Nov 2025: migrado a tabla dinámica)
-- Agrupaciones y filtros por categoría
CREATE INDEX idx_organizaciones_categoria
    ON organizaciones (categoria_id, activo) WHERE activo = TRUE;

-- Propósito: Filtrar organizaciones con perfil de marketplace activo
-- Para reportes y estadísticas de marketplace (Nov 2025)
CREATE INDEX idx_organizaciones_marketplace
    ON organizaciones(tiene_perfil_marketplace)
    WHERE tiene_perfil_marketplace = TRUE;

-- ====================================================================
-- ÍNDICES PARA PLANES_SUBSCRIPCION
-- ====================================================================

-- Propósito: Búsqueda de planes por código
-- Índice parcial solo para planes activos
CREATE INDEX idx_planes_subscripcion_codigo ON planes_subscripcion(codigo_plan) WHERE activo = true;

-- Propósito: Filtrado y ordenamiento por precio
-- Para comparativas de planes en UI
CREATE INDEX idx_planes_subscripcion_precio ON planes_subscripcion(precio_mensual, precio_anual);

-- Propósito: Integración con Mercado Pago
-- Lookup por ID de plan en MP
CREATE INDEX idx_planes_mp_plan_id ON planes_subscripcion(mp_plan_id) WHERE mp_plan_id IS NOT NULL;

-- ====================================================================
-- ÍNDICES PARA METRICAS_USO_ORGANIZACION
-- ====================================================================

-- Propósito: Lookup directo por organización (FK index)
CREATE INDEX idx_metricas_uso_organizacion ON metricas_uso_organizacion(organizacion_id);

-- Propósito: Queries de métricas mensuales
-- Para reseteo automático mensual
CREATE INDEX idx_metricas_uso_mes_actual ON metricas_uso_organizacion(mes_actual);

-- ====================================================================
-- ÍNDICES PARA SUBSCRIPCIONES
-- ====================================================================

-- Propósito: Lookup de subscripción activa por organización
-- Índice parcial solo para subscripciones activas
CREATE INDEX idx_subscripciones_organizacion_activa ON subscripciones(organizacion_id) WHERE activa = true;

-- Propósito: Job automático de facturación (próximos pagos)
-- Índice parcial solo para subscripciones activas con auto-renovación
CREATE INDEX idx_subscripciones_proximo_pago ON subscripciones(fecha_proximo_pago) WHERE activa = true AND auto_renovacion = true;

-- Propósito: Análisis de churn (subscripciones canceladas)
-- Índice parcial solo para subscripciones inactivas
CREATE INDEX idx_subscripciones_canceladas ON subscripciones(fecha_cancelacion, motivo_cancelacion) WHERE NOT activa;

-- Propósito: Reportes por plan (cuántas subscripciones tiene cada plan)
CREATE INDEX idx_subscripciones_plan ON subscripciones(plan_id);

-- Propósito: Integración con gateway de pago
-- Lookup por customer_id para webhooks
CREATE INDEX idx_subscripciones_gateway ON subscripciones(gateway_pago, customer_id_gateway) WHERE gateway_pago IS NOT NULL;

-- Propósito: Consultas combinadas de planes y estado
-- Covering index para evitar table lookups (AGREGADO: auditoría 2025-10-02)
CREATE INDEX idx_subscripciones_org_plan_estado ON subscripciones(organizacion_id, plan_id, estado, activa) WHERE activa = true;

-- ====================================================================
-- ÍNDICES PARA HISTORIAL_SUBSCRIPCIONES
-- ====================================================================

-- Propósito: Timeline de eventos por organización
-- Ordenado DESC para mostrar eventos recientes primero
CREATE INDEX idx_historial_subscripciones_org_fecha ON historial_subscripciones(organizacion_id, ocurrido_en DESC);

-- Propósito: Análisis por tipo de evento (upgrades, downgrades, cancelaciones)
CREATE INDEX idx_historial_subscripciones_tipo_evento ON historial_subscripciones(tipo_evento, ocurrido_en DESC);

-- Propósito: Historial completo de una subscripción específica
CREATE INDEX idx_historial_subscripciones_sub ON historial_subscripciones(subscripcion_id, ocurrido_en DESC);

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON INDEX idx_usuarios_email_unique IS
'Índice único para login. CRÍTICO para performance de autenticación.
Solo indexa usuarios activos para reducir tamaño.';

COMMENT ON INDEX idx_usuarios_reset_token IS
'Índice parcial para recuperación de contraseña.
Solo indexa tokens válidos (no usados, no expirados).';

COMMENT ON INDEX idx_usuarios_rol_org IS
'Índice parcial para búsqueda eficiente de usuarios bot.
Solo indexa usuarios con rol=bot activos (1 por organización).
Usado por: MCP server, chatbot authentication.';

COMMENT ON INDEX idx_organizaciones_codigo_tenant IS
'Índice único para lookup de tenant por código.
CRÍTICO para performance de RLS (set app.current_tenant_id).';

COMMENT ON INDEX idx_subscripciones_proximo_pago IS
'Índice para job automático de facturación (pg_cron).
Solo indexa subscripciones activas con auto-renovación habilitada.';
