-- ====================================================================
-- MÓDULO PRECIOS: PERMISOS
-- ====================================================================
-- Permisos para gestión de monedas, tasas y listas de precios.
--
-- Fase 5 - Diciembre 2025
-- ====================================================================

-- ====================================================================
-- CATÁLOGO DE PERMISOS - MONEDAS Y TASAS
-- ====================================================================

INSERT INTO permisos_catalogo (codigo, modulo, categoria, nombre, descripcion, tipo_valor, valor_default, orden_display) VALUES

-- Permisos de Monedas
('monedas.ver', 'monedas', 'operacion', 'Ver monedas', 'Permite ver el catálogo de monedas', 'booleano', 'false', 800),
('monedas.editar', 'monedas', 'operacion', 'Editar monedas', 'Permite activar/desactivar monedas', 'booleano', 'false', 810),

-- Permisos de Tasas de Cambio
('tasas.ver', 'tasas', 'operacion', 'Ver tasas de cambio', 'Permite ver tasas de cambio', 'booleano', 'false', 820),
('tasas.crear', 'tasas', 'operacion', 'Crear tasas', 'Permite crear nuevas tasas de cambio', 'booleano', 'false', 830),
('tasas.editar', 'tasas', 'operacion', 'Editar tasas', 'Permite modificar tasas de cambio existentes', 'booleano', 'false', 840),
('tasas.eliminar', 'tasas', 'operacion', 'Eliminar tasas', 'Permite eliminar tasas de cambio', 'booleano', 'false', 850),

-- Permisos de Listas de Precios
('listas_precios.ver', 'listas_precios', 'operacion', 'Ver listas de precios', 'Permite ver listas de precios', 'booleano', 'false', 860),
('listas_precios.crear', 'listas_precios', 'operacion', 'Crear listas', 'Permite crear nuevas listas de precios', 'booleano', 'false', 870),
('listas_precios.editar', 'listas_precios', 'operacion', 'Editar listas', 'Permite modificar listas de precios', 'booleano', 'false', 880),
('listas_precios.eliminar', 'listas_precios', 'operacion', 'Eliminar listas', 'Permite eliminar listas de precios', 'booleano', 'false', 890),
('listas_precios.asignar', 'listas_precios', 'operacion', 'Asignar a clientes', 'Permite asignar listas de precios a clientes', 'booleano', 'false', 900)

ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    orden_display = EXCLUDED.orden_display;

-- ====================================================================
-- PERMISOS POR ROL
-- ====================================================================

-- Admin y Propietario: todos los permisos de precios
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'admin', id, 'true'::jsonb
FROM permisos_catalogo
WHERE modulo IN ('monedas', 'tasas', 'listas_precios')
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = 'true';

INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'propietario', id, 'true'::jsonb
FROM permisos_catalogo
WHERE modulo IN ('monedas', 'tasas', 'listas_precios')
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = 'true';

-- Empleado: solo ver
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::jsonb
FROM permisos_catalogo
WHERE codigo IN ('monedas.ver', 'tasas.ver', 'listas_precios.ver')
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = 'true';

-- ====================================================================
-- FIN: PERMISOS DE PRECIOS
-- ====================================================================
