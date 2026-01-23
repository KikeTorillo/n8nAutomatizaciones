-- ====================================================================
-- MÓDULO PRECIOS: PERMISOS
-- ====================================================================
-- Permisos para gestión de monedas, tasas y listas de precios.
--
-- FASE 7 (Ene 2026): Actualizado para roles dinámicos.
-- Los permisos se asignan automáticamente por el trigger en 13-datos-permisos.sql
-- cuando se crean roles de organización.
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
-- ASIGNAR PERMISOS A ROLES EXISTENTES (FASE 7)
-- ====================================================================
-- Los permisos de precios se agregan a la función asignar_permisos_default_a_rol.
-- Para roles que ya existen, usamos el mismo patrón del trigger.
-- ====================================================================

-- Actualizar la función para incluir permisos de precios
-- Esto se hace actualizando la lista en 13-datos-permisos.sql
-- Por ahora, asignamos manualmente a roles existentes

DO $$
DECLARE
    v_rol RECORD;
    v_permiso RECORD;
BEGIN
    -- Para roles de organización con nivel >= 80 (admin/propietario): todos los permisos de precios
    FOR v_rol IN
        SELECT id FROM roles
        WHERE organizacion_id IS NOT NULL
          AND nivel_jerarquia >= 80
          AND activo = TRUE
    LOOP
        FOR v_permiso IN
            SELECT id FROM permisos_catalogo
            WHERE modulo IN ('monedas', 'tasas', 'listas_precios') AND activo = TRUE
        LOOP
            INSERT INTO permisos_rol (rol_id, permiso_id, valor)
            VALUES (v_rol.id, v_permiso.id, 'true'::jsonb)
            ON CONFLICT (rol_id, permiso_id) DO UPDATE SET valor = 'true'::jsonb;
        END LOOP;
    END LOOP;

    -- Para empleados (nivel 10): solo permisos de ver
    FOR v_rol IN
        SELECT id FROM roles
        WHERE organizacion_id IS NOT NULL
          AND nivel_jerarquia >= 10 AND nivel_jerarquia < 50
          AND activo = TRUE
    LOOP
        FOR v_permiso IN
            SELECT id FROM permisos_catalogo
            WHERE codigo IN ('monedas.ver', 'tasas.ver', 'listas_precios.ver') AND activo = TRUE
        LOOP
            INSERT INTO permisos_rol (rol_id, permiso_id, valor)
            VALUES (v_rol.id, v_permiso.id, 'true'::jsonb)
            ON CONFLICT (rol_id, permiso_id) DO UPDATE SET valor = 'true'::jsonb;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Permisos de precios asignados a roles existentes';
END $$;


-- ====================================================================
-- FIN: PERMISOS DE PRECIOS (FASE 7)
-- ====================================================================
