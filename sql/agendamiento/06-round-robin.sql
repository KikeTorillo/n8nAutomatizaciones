-- =====================================================================
-- ROUND-ROBIN: Campo orden_rotacion en servicios_profesionales
-- =====================================================================
-- Archivo: sql/agendamiento/06-round-robin.sql
-- Fecha: Enero 2026
-- Descripción: Agrega campo orden_rotacion para auto-asignación round-robin
--              de profesionales en citas
-- =====================================================================

-- Agregar campo orden_rotacion a servicios_profesionales
-- Este campo define la prioridad de asignación cuando el cliente no selecciona profesional
ALTER TABLE servicios_profesionales
ADD COLUMN IF NOT EXISTS orden_rotacion INTEGER DEFAULT 0;

COMMENT ON COLUMN servicios_profesionales.orden_rotacion IS
    'Orden para round-robin (menor = mayor prioridad). Usado cuando el cliente no selecciona profesional.';

-- Índice para ordenamiento eficiente en round-robin
-- Optimiza: ORDER BY orden_rotacion ASC, profesional_id ASC
CREATE INDEX IF NOT EXISTS idx_servicios_profesionales_orden
ON servicios_profesionales (servicio_id, orden_rotacion ASC, profesional_id ASC)
WHERE activo = true;

COMMENT ON INDEX idx_servicios_profesionales_orden IS
    'Índice para consulta eficiente de profesionales en orden round-robin por servicio';

-- Inicializar orden_rotacion con el ID del profesional para registros existentes
-- Esto asegura un orden determinístico inicial
UPDATE servicios_profesionales
SET orden_rotacion = profesional_id
WHERE orden_rotacion = 0 OR orden_rotacion IS NULL;
