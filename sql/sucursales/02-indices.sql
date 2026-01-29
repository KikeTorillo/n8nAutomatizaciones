-- ====================================================================
-- MODULO SUCURSALES: INDICES
-- ====================================================================
-- Índices optimizados para consultas frecuentes del módulo sucursales.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- INDICES: sucursales
-- ====================================================================
CREATE INDEX idx_sucursales_org ON sucursales(organizacion_id);
CREATE INDEX idx_sucursales_activas ON sucursales(organizacion_id) WHERE activo = TRUE AND eliminado_en IS NULL;
CREATE INDEX idx_sucursales_estado ON sucursales(estado_id) WHERE estado_id IS NOT NULL;
CREATE INDEX idx_sucursales_ciudad ON sucursales(ciudad_id) WHERE ciudad_id IS NOT NULL;

-- ====================================================================
-- INDICES: usuarios_sucursales
-- ====================================================================
CREATE INDEX idx_usuarios_sucursales_usuario ON usuarios_sucursales(usuario_id);
CREATE INDEX idx_usuarios_sucursales_sucursal ON usuarios_sucursales(sucursal_id);
CREATE INDEX idx_usuarios_sucursales_activos ON usuarios_sucursales(sucursal_id) WHERE activo = TRUE;
CREATE INDEX idx_usuarios_sucursales_gerentes ON usuarios_sucursales(sucursal_id) WHERE es_gerente = TRUE;

-- ====================================================================
-- INDICES: profesionales_sucursales
-- ====================================================================
CREATE INDEX idx_profesionales_sucursales_profesional ON profesionales_sucursales(profesional_id);
CREATE INDEX idx_profesionales_sucursales_sucursal ON profesionales_sucursales(sucursal_id);
CREATE INDEX idx_profesionales_sucursales_activos ON profesionales_sucursales(sucursal_id) WHERE activo = TRUE;

-- ====================================================================
-- INDICES: servicios_sucursales
-- ====================================================================
CREATE INDEX idx_servicios_sucursales_servicio ON servicios_sucursales(servicio_id);
CREATE INDEX idx_servicios_sucursales_sucursal ON servicios_sucursales(sucursal_id);
CREATE INDEX idx_servicios_sucursales_activos ON servicios_sucursales(sucursal_id) WHERE activo = TRUE;

-- ====================================================================
-- NOTA: Índices de stock_sucursales ELIMINADOS (Enero 2026)
-- La nueva arquitectura usa stock_ubicaciones
-- ====================================================================

-- ====================================================================
-- INDICES: usuarios_ubicaciones (Enero 2026)
-- ====================================================================
CREATE INDEX idx_usuarios_ubicaciones_usuario ON usuarios_ubicaciones(usuario_id);
CREATE INDEX idx_usuarios_ubicaciones_ubicacion ON usuarios_ubicaciones(ubicacion_id);
CREATE INDEX idx_usuarios_ubicaciones_org ON usuarios_ubicaciones(organizacion_id);

-- Índice parcial para búsqueda rápida de ubicación default del usuario
CREATE INDEX idx_usuarios_ubicaciones_default ON usuarios_ubicaciones(usuario_id)
    WHERE es_default = true AND activo = true;

-- Índice para filtrar ubicaciones activas por usuario
CREATE INDEX idx_usuarios_ubicaciones_activos ON usuarios_ubicaciones(usuario_id)
    WHERE activo = true;

-- ====================================================================
-- INDICES: transferencias_stock
-- ====================================================================
CREATE INDEX idx_transferencias_org ON transferencias_stock(organizacion_id);
CREATE INDEX idx_transferencias_origen ON transferencias_stock(sucursal_origen_id);
CREATE INDEX idx_transferencias_destino ON transferencias_stock(sucursal_destino_id);
CREATE INDEX idx_transferencias_estado ON transferencias_stock(estado);
CREATE INDEX idx_transferencias_pendientes ON transferencias_stock(sucursal_destino_id)
    WHERE estado = 'enviado';
CREATE INDEX idx_transferencias_fecha ON transferencias_stock(creado_en DESC);

-- ====================================================================
-- INDICES: transferencias_stock_items
-- ====================================================================
CREATE INDEX idx_transferencias_items_transferencia ON transferencias_stock_items(transferencia_id);
CREATE INDEX idx_transferencias_items_producto ON transferencias_stock_items(producto_id);

-- ====================================================================
-- INDICES COMPUESTOS ADICIONALES
-- ====================================================================
-- Índice para búsquedas de transferencias por organización y rango de fechas
CREATE INDEX idx_transferencias_org_fecha ON transferencias_stock(organizacion_id, creado_en DESC);

-- ====================================================================
-- FIN: INDICES DE SUCURSALES
-- ====================================================================
