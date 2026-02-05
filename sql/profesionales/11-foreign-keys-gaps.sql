-- ====================================================================
-- MÓDULO PROFESIONALES: FOREIGN KEYS PARA CATÁLOGOS
-- ====================================================================
-- FKs diferidas que requieren tablas de catálogos creadas previamente.
-- Ejecutar DESPUÉS de: 09-motivos-salida.sql, 10-categorias-pago.sql
-- y sql/catalogos/ubicaciones-trabajo/01-tablas.sql
-- ====================================================================

-- FK a motivos_salida
ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_motivo_salida
FOREIGN KEY (motivo_salida_id) REFERENCES motivos_salida(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- FK a categorias_pago
ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_categoria_pago
FOREIGN KEY (categoria_pago_id) REFERENCES categorias_pago(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- FKs a ubicaciones_trabajo (7 días)
ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_ubicacion_lunes
FOREIGN KEY (ubicacion_lunes_id) REFERENCES ubicaciones_trabajo(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_ubicacion_martes
FOREIGN KEY (ubicacion_martes_id) REFERENCES ubicaciones_trabajo(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_ubicacion_miercoles
FOREIGN KEY (ubicacion_miercoles_id) REFERENCES ubicaciones_trabajo(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_ubicacion_jueves
FOREIGN KEY (ubicacion_jueves_id) REFERENCES ubicaciones_trabajo(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_ubicacion_viernes
FOREIGN KEY (ubicacion_viernes_id) REFERENCES ubicaciones_trabajo(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_ubicacion_sabado
FOREIGN KEY (ubicacion_sabado_id) REFERENCES ubicaciones_trabajo(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_ubicacion_domingo
FOREIGN KEY (ubicacion_domingo_id) REFERENCES ubicaciones_trabajo(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Comentarios de documentación
COMMENT ON COLUMN profesionales.motivo_salida_id IS
'GAP-001: FK a catálogo de motivos de salida. Reemplaza motivo_baja (texto libre).';

COMMENT ON COLUMN profesionales.categoria_pago_id IS
'GAP-004: Categoría de pago para nómina. Define permisos de comisiones, bonos, viáticos.';

COMMENT ON COLUMN profesionales.ubicacion_lunes_id IS
'GAP-003: Ubicación de trabajo para lunes (trabajo híbrido). NULL = no trabaja o usa default.';

COMMENT ON COLUMN profesionales.ubicacion_martes_id IS
'GAP-003: Ubicación de trabajo para martes.';

COMMENT ON COLUMN profesionales.ubicacion_miercoles_id IS
'GAP-003: Ubicación de trabajo para miércoles.';

COMMENT ON COLUMN profesionales.ubicacion_jueves_id IS
'GAP-003: Ubicación de trabajo para jueves.';

COMMENT ON COLUMN profesionales.ubicacion_viernes_id IS
'GAP-003: Ubicación de trabajo para viernes.';

COMMENT ON COLUMN profesionales.ubicacion_sabado_id IS
'GAP-003: Ubicación de trabajo para sábado.';

COMMENT ON COLUMN profesionales.ubicacion_domingo_id IS
'GAP-003: Ubicación de trabajo para domingo.';
