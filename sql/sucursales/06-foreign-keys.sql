-- ====================================================================
-- MODULO SUCURSALES: FOREIGN KEYS
-- ====================================================================
-- Agrega las FK de sucursal_id a todas las tablas que lo requieren.
-- Este archivo debe ejecutarse DESPUÉS de crear la tabla sucursales.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- CITAS Y BLOQUEOS
-- ====================================================================
ALTER TABLE citas
ADD CONSTRAINT fk_citas_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

ALTER TABLE bloqueos_horarios
ADD CONSTRAINT fk_bloqueos_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- INVENTARIO
-- ====================================================================
ALTER TABLE productos
ADD CONSTRAINT fk_productos_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

ALTER TABLE movimientos_inventario
ADD CONSTRAINT fk_movimientos_inv_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- POS
-- ====================================================================
ALTER TABLE ventas_pos
ADD CONSTRAINT fk_ventas_pos_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- NEGOCIO
-- ====================================================================
ALTER TABLE clientes
ADD CONSTRAINT fk_clientes_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- CHATBOTS
-- ====================================================================
ALTER TABLE chatbot_config
ADD CONSTRAINT fk_chatbot_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- MARKETPLACE
-- ====================================================================
ALTER TABLE marketplace_perfiles
ADD CONSTRAINT fk_marketplace_perfiles_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

ALTER TABLE marketplace_reseñas
ADD CONSTRAINT fk_marketplace_resenas_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

ALTER TABLE marketplace_analytics
ADD CONSTRAINT fk_marketplace_analytics_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- RECORDATORIOS
-- ====================================================================
ALTER TABLE configuracion_recordatorios
ADD CONSTRAINT fk_config_recordatorios_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- COMISIONES
-- ====================================================================
ALTER TABLE configuracion_comisiones
ADD CONSTRAINT fk_config_comisiones_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

ALTER TABLE comisiones_profesionales
ADD CONSTRAINT fk_comisiones_prof_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- CONTABILIDAD
-- ====================================================================
ALTER TABLE asientos_contables
ADD CONSTRAINT fk_asientos_contables_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

ALTER TABLE movimientos_contables
ADD CONSTRAINT fk_movimientos_contables_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- EVENTOS DIGITALES
-- ====================================================================
ALTER TABLE eventos_digitales
ADD CONSTRAINT fk_eventos_digitales_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- STORAGE
-- ====================================================================
ALTER TABLE archivos_storage
ADD CONSTRAINT fk_archivos_storage_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- WEBSITE
-- ====================================================================
ALTER TABLE website_config
ADD CONSTRAINT fk_website_config_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ====================================================================
-- INDICES PARA FK
-- ====================================================================
-- Agregar índices para las columnas sucursal_id para mejorar JOINs

CREATE INDEX IF NOT EXISTS idx_citas_sucursal ON citas(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bloqueos_sucursal ON bloqueos_horarios(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_productos_sucursal ON productos(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mov_inv_sucursal ON movimientos_inventario(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ventas_pos_sucursal ON ventas_pos(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_sucursal ON clientes(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chatbot_sucursal ON chatbot_config(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mp_perfiles_sucursal ON marketplace_perfiles(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mp_resenas_sucursal ON marketplace_reseñas(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mp_analytics_sucursal ON marketplace_analytics(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_config_recordatorios_sucursal ON configuracion_recordatorios(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_config_comisiones_sucursal ON configuracion_comisiones(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comisiones_prof_sucursal ON comisiones_profesionales(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asientos_sucursal ON asientos_contables(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mov_contables_sucursal ON movimientos_contables(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_dig_sucursal ON eventos_digitales(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_archivos_sucursal ON archivos_storage(sucursal_id) WHERE sucursal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_website_sucursal ON website_config(sucursal_id) WHERE sucursal_id IS NOT NULL;

-- ====================================================================
-- USUARIOS_UBICACIONES (Enero 2026)
-- ====================================================================
-- FK diferida porque ubicaciones_almacen se crea después de usuarios_ubicaciones
-- en el orden de ejecución de scripts SQL.
ALTER TABLE usuarios_ubicaciones
ADD CONSTRAINT fk_usuarios_ubicaciones_ubicacion
FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones_almacen(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_usuarios_ubicaciones_ubicacion_fk
ON usuarios_ubicaciones(ubicacion_id);

-- ====================================================================
-- FIN: FOREIGN KEYS DE SUCURSALES
-- ====================================================================
