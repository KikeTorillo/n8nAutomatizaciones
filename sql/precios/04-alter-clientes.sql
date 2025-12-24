-- ====================================================================
-- MÓDULO PRECIOS: MODIFICACIÓN TABLA CLIENTES
-- ====================================================================
-- Agrega campo lista_precios_id para asignar listas de precios
-- a clientes específicos.
--
-- Fase 5 - Diciembre 2025
-- ====================================================================

-- Agregar columna lista_precios_id a clientes
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS lista_precios_id INTEGER REFERENCES listas_precios(id) ON DELETE SET NULL;

-- Comentario
COMMENT ON COLUMN clientes.lista_precios_id IS
'Lista de precios asignada al cliente. NULL = usa lista default de la organización.';

-- Índice para búsqueda
CREATE INDEX IF NOT EXISTS idx_clientes_lista_precios
ON clientes(lista_precios_id)
WHERE lista_precios_id IS NOT NULL;

-- ====================================================================
-- FIN: MODIFICACIÓN TABLA CLIENTES
-- ====================================================================
