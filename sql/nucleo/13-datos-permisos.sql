-- ====================================================================
-- SISTEMA DE PERMISOS NORMALIZADOS - DATOS INICIALES
-- ====================================================================
--
-- Versión: 2.0.0 (FASE 7 - Roles Dinámicos)
-- Fecha: Enero 2026
-- Módulo: nucleo/permisos
--
-- DESCRIPCIÓN:
-- Datos iniciales del catálogo de permisos.
-- FASE 7: Los permisos por rol se asignan dinámicamente cuando se crean
--         roles de organización, no con INSERTs estáticos.
--
-- MÓDULOS CUBIERTOS:
-- • acceso: Acceso general a módulos
-- • agendamiento: Gestión de citas
-- • pos: Punto de venta
-- • inventario: Gestión de inventario
-- • contabilidad: Módulo contable
-- • reportes: Acceso a reportes
-- • configuracion: Configuración del sistema
-- • clientes: Gestión de clientes
-- • profesionales: Gestión de profesionales
-- • workflows: Aprobaciones
--
-- ====================================================================

-- ====================================================================
-- CATÁLOGO DE PERMISOS
-- ====================================================================

INSERT INTO permisos_catalogo (codigo, modulo, categoria, nombre, descripcion, tipo_valor, valor_default, orden_display) VALUES

-- ========================================
-- MÓDULO: ACCESO (acceso a módulos principales)
-- ========================================
('acceso.agendamiento', 'acceso', 'acceso', 'Acceso a Agendamiento', 'Permite acceder al módulo de citas y agenda', 'booleano', 'true', 10),
('acceso.pos', 'acceso', 'acceso', 'Acceso a Punto de Venta', 'Permite acceder al módulo de ventas POS', 'booleano', 'false', 20),
('acceso.inventario', 'acceso', 'acceso', 'Acceso a Inventario', 'Permite acceder al módulo de inventario y productos', 'booleano', 'false', 30),
('acceso.contabilidad', 'acceso', 'acceso', 'Acceso a Contabilidad', 'Permite acceder al módulo contable', 'booleano', 'false', 40),
('acceso.reportes', 'acceso', 'acceso', 'Acceso a Reportes', 'Permite acceder a reportes y estadísticas', 'booleano', 'false', 50),
('acceso.configuracion', 'acceso', 'acceso', 'Acceso a Configuración', 'Permite acceder a configuración del sistema', 'booleano', 'false', 60),
('acceso.clientes', 'acceso', 'acceso', 'Acceso a Clientes', 'Permite ver y gestionar clientes', 'booleano', 'true', 70),
('acceso.profesionales', 'acceso', 'acceso', 'Acceso a Profesionales', 'Permite ver y gestionar profesionales', 'booleano', 'false', 80),
('acceso.comisiones', 'acceso', 'acceso', 'Acceso a Comisiones', 'Permite ver y gestionar comisiones', 'booleano', 'false', 90),
('acceso.marketplace', 'acceso', 'acceso', 'Acceso a Marketplace', 'Permite gestionar perfil en marketplace', 'booleano', 'false', 100),

-- ========================================
-- MÓDULO: AGENDAMIENTO
-- ========================================
('agendamiento.crear_citas', 'agendamiento', 'operacion', 'Crear citas', 'Permite crear nuevas citas', 'booleano', 'false', 110),
('agendamiento.editar_citas', 'agendamiento', 'operacion', 'Editar citas', 'Permite modificar citas existentes', 'booleano', 'false', 120),
('agendamiento.cancelar_citas', 'agendamiento', 'operacion', 'Cancelar citas', 'Permite cancelar citas', 'booleano', 'false', 130),
('agendamiento.ver_todas_citas', 'agendamiento', 'operacion', 'Ver todas las citas', 'Permite ver citas de todos los profesionales', 'booleano', 'false', 140),
('agendamiento.reagendar_sin_restriccion', 'agendamiento', 'operacion', 'Reagendar sin restricción', 'Permite reagendar sin límite de tiempo', 'booleano', 'false', 150),
('agendamiento.completar_citas', 'agendamiento', 'operacion', 'Completar citas', 'Permite marcar citas como completadas', 'booleano', 'false', 160),
('agendamiento.gestionar_bloqueos', 'agendamiento', 'operacion', 'Gestionar bloqueos', 'Permite crear/editar bloqueos de horario', 'booleano', 'false', 170),

-- ========================================
-- MÓDULO: POS (Punto de Venta)
-- ========================================
('pos.crear_ventas', 'pos', 'operacion', 'Crear ventas', 'Permite registrar ventas en POS', 'booleano', 'false', 200),
('pos.aplicar_descuentos', 'pos', 'operacion', 'Aplicar descuentos', 'Permite aplicar descuentos a ventas', 'booleano', 'false', 210),
('pos.max_descuento', 'pos', 'operacion', 'Descuento máximo (%)', 'Porcentaje máximo de descuento permitido', 'numerico', '0', 220),
('pos.anular_ventas', 'pos', 'operacion', 'Anular ventas', 'Permite anular ventas completadas', 'booleano', 'false', 230),
('pos.devolver_productos', 'pos', 'operacion', 'Procesar devoluciones', 'Permite procesar devoluciones de productos', 'booleano', 'false', 240),
('pos.ver_historial', 'pos', 'operacion', 'Ver historial de ventas', 'Permite ver historial de ventas', 'booleano', 'false', 250),
('pos.abrir_caja', 'pos', 'operacion', 'Abrir caja', 'Permite abrir turno de caja', 'booleano', 'false', 260),
('pos.cerrar_caja', 'pos', 'operacion', 'Cerrar caja', 'Permite cerrar turno de caja', 'booleano', 'false', 270),
('pos.corte_caja', 'pos', 'operacion', 'Realizar corte de caja', 'Permite realizar corte/arqueo de caja', 'booleano', 'false', 280),
('pos.reimprimir_tickets', 'pos', 'operacion', 'Reimprimir tickets', 'Permite reimprimir tickets de venta', 'booleano', 'false', 290),
('pos.gestionar_caja', 'pos', 'operacion', 'Gestionar caja', 'Permite abrir, cerrar y gestionar sesiones de caja', 'booleano', 'false', 295),
('pos.gestionar_cupones', 'pos', 'operacion', 'Gestionar cupones', 'Permite crear y administrar cupones de descuento', 'booleano', 'false', 296),
('pos.gestionar_promociones', 'pos', 'operacion', 'Gestionar promociones', 'Permite crear y administrar promociones automaticas', 'booleano', 'false', 297),
('pos.configurar_lealtad', 'pos', 'configuracion', 'Configurar programa de lealtad', 'Permite configurar programa de lealtad, niveles y reglas', 'booleano', 'false', 298),
('pos.ver_puntos_cliente', 'pos', 'operacion', 'Ver puntos de cliente', 'Permite ver saldo de puntos de clientes', 'booleano', 'false', 299),
('pos.canjear_puntos', 'pos', 'operacion', 'Canjear puntos', 'Permite canjear puntos por descuento en ventas', 'booleano', 'false', 300),
('pos.ajustar_puntos', 'pos', 'operacion', 'Ajustar puntos manualmente', 'Permite hacer ajustes manuales de puntos a clientes', 'booleano', 'false', 301),
('pos.gestionar_combos', 'pos', 'operacion', 'Gestionar combos', 'Permite crear, editar y eliminar combos/paquetes de productos', 'booleano', 'false', 302),
('pos.gestionar_modificadores', 'pos', 'operacion', 'Gestionar modificadores', 'Permite crear, editar grupos de modificadores y asignarlos a productos', 'booleano', 'false', 303),

-- ========================================
-- MÓDULO: INVENTARIO
-- ========================================
('inventario.ver_productos', 'inventario', 'operacion', 'Ver productos', 'Permite ver catálogo de productos', 'booleano', 'false', 400),
('inventario.crear_productos', 'inventario', 'operacion', 'Crear productos', 'Permite crear nuevos productos', 'booleano', 'false', 410),
('inventario.editar_productos', 'inventario', 'operacion', 'Editar productos', 'Permite modificar productos existentes', 'booleano', 'false', 420),
('inventario.eliminar_productos', 'inventario', 'operacion', 'Eliminar productos', 'Permite eliminar productos', 'booleano', 'false', 430),
('inventario.ajustar_stock', 'inventario', 'operacion', 'Ajustar stock', 'Permite realizar ajustes de inventario', 'booleano', 'false', 440),
('inventario.ver_costos', 'inventario', 'operacion', 'Ver costos', 'Permite ver costos de productos', 'booleano', 'false', 450),
('inventario.crear_ordenes_compra', 'inventario', 'operacion', 'Crear órdenes de compra', 'Permite crear órdenes de compra a proveedores', 'booleano', 'false', 460),
('inventario.aprobar_ordenes_compra', 'inventario', 'operacion', 'Aprobar órdenes de compra', 'Permite aprobar órdenes de compra', 'booleano', 'false', 470),
('inventario.limite_aprobacion', 'inventario', 'operacion', 'Límite de aprobación ($)', 'Monto máximo que puede aprobar en órdenes', 'numerico', '0', 480),
('inventario.recibir_mercancia', 'inventario', 'operacion', 'Recibir mercancía', 'Permite registrar recepción de mercancía', 'booleano', 'false', 490),
('inventario.transferir_stock', 'inventario', 'operacion', 'Transferir stock', 'Permite transferir stock entre sucursales', 'booleano', 'false', 500),

-- ========================================
-- MÓDULO: CLIENTES
-- ========================================
('clientes.ver', 'clientes', 'operacion', 'Ver clientes', 'Permite ver lista de clientes', 'booleano', 'true', 600),
('clientes.crear', 'clientes', 'operacion', 'Crear clientes', 'Permite registrar nuevos clientes', 'booleano', 'false', 610),
('clientes.editar', 'clientes', 'operacion', 'Editar clientes', 'Permite modificar datos de clientes', 'booleano', 'false', 620),
('clientes.eliminar', 'clientes', 'operacion', 'Eliminar clientes', 'Permite eliminar clientes', 'booleano', 'false', 630),
('clientes.ver_historial', 'clientes', 'operacion', 'Ver historial de cliente', 'Permite ver historial completo del cliente', 'booleano', 'false', 640),
('clientes.exportar', 'clientes', 'operacion', 'Exportar clientes', 'Permite exportar lista de clientes', 'booleano', 'false', 650),

-- ========================================
-- MÓDULO: PROFESIONALES
-- ========================================
('profesionales.ver', 'profesionales', 'operacion', 'Ver profesionales', 'Permite ver lista de profesionales', 'booleano', 'false', 700),
('profesionales.crear', 'profesionales', 'operacion', 'Crear profesionales', 'Permite registrar nuevos profesionales', 'booleano', 'false', 710),
('profesionales.editar', 'profesionales', 'operacion', 'Editar profesionales', 'Permite modificar datos de profesionales', 'booleano', 'false', 720),
('profesionales.eliminar', 'profesionales', 'operacion', 'Eliminar profesionales', 'Permite dar de baja profesionales', 'booleano', 'false', 730),
('profesionales.gestionar_horarios', 'profesionales', 'operacion', 'Gestionar horarios', 'Permite configurar horarios de profesionales', 'booleano', 'false', 740),
('profesionales.ver_comisiones', 'profesionales', 'operacion', 'Ver comisiones', 'Permite ver comisiones de profesionales', 'booleano', 'false', 750),

-- ========================================
-- MÓDULO: CONTABILIDAD
-- ========================================
('contabilidad.ver_cuentas', 'contabilidad', 'operacion', 'Ver catálogo de cuentas', 'Permite ver catálogo de cuentas contables', 'booleano', 'false', 800),
('contabilidad.crear_asientos', 'contabilidad', 'operacion', 'Crear asientos', 'Permite crear asientos contables manuales', 'booleano', 'false', 810),
('contabilidad.publicar_asientos', 'contabilidad', 'operacion', 'Publicar asientos', 'Permite publicar asientos (contabilizar)', 'booleano', 'false', 820),
('contabilidad.anular_asientos', 'contabilidad', 'operacion', 'Anular asientos', 'Permite anular asientos publicados', 'booleano', 'false', 830),
('contabilidad.cerrar_periodo', 'contabilidad', 'operacion', 'Cerrar periodo', 'Permite cerrar periodos contables', 'booleano', 'false', 840),
('contabilidad.reabrir_periodo', 'contabilidad', 'operacion', 'Reabrir periodo', 'Permite reabrir periodos cerrados', 'booleano', 'false', 850),
('contabilidad.configurar_cuentas', 'contabilidad', 'configuracion', 'Configurar cuentas', 'Permite configurar catálogo de cuentas', 'booleano', 'false', 860),

-- ========================================
-- MÓDULO: REPORTES
-- ========================================
('reportes.ver_ventas', 'reportes', 'operacion', 'Ver reportes de ventas', 'Acceso a reportes de ventas', 'booleano', 'true', 900),
('reportes.ver_citas', 'reportes', 'operacion', 'Ver reportes de citas', 'Acceso a reportes de agendamiento', 'booleano', 'true', 910),
('reportes.ver_inventario', 'reportes', 'operacion', 'Ver reportes de inventario', 'Acceso a reportes de inventario', 'booleano', 'false', 920),
('reportes.ver_financieros', 'reportes', 'operacion', 'Ver reportes financieros', 'Acceso a reportes contables', 'booleano', 'false', 930),
('reportes.ver_consolidados', 'reportes', 'operacion', 'Ver reportes consolidados', 'Acceso a reportes multi-sucursal', 'booleano', 'false', 940),
('reportes.exportar', 'reportes', 'operacion', 'Exportar reportes', 'Permite exportar reportes a Excel/PDF', 'booleano', 'false', 950),

-- ========================================
-- MÓDULO: CONFIGURACIÓN
-- ========================================
('configuracion.general', 'configuracion', 'configuracion', 'Configuración general', 'Acceso a configuración general de la org', 'booleano', 'false', 1000),
('configuracion.sucursales', 'configuracion', 'configuracion', 'Gestionar sucursales', 'Permite crear/editar sucursales', 'booleano', 'false', 1010),
('configuracion.usuarios', 'configuracion', 'configuracion', 'Gestionar usuarios', 'Permite crear/editar usuarios', 'booleano', 'false', 1020),
('configuracion.roles', 'configuracion', 'configuracion', 'Gestionar roles', 'Permite modificar permisos por rol', 'booleano', 'false', 1030),
('configuracion.servicios', 'configuracion', 'configuracion', 'Gestionar servicios', 'Permite crear/editar servicios', 'booleano', 'false', 1040),
('configuracion.categorias', 'configuracion', 'configuracion', 'Gestionar categorías', 'Permite crear/editar categorías', 'booleano', 'false', 1050),
('configuracion.notificaciones', 'configuracion', 'configuracion', 'Configurar notificaciones', 'Permite configurar plantillas de notificación', 'booleano', 'false', 1060),
('configuracion.integraciones', 'configuracion', 'configuracion', 'Gestionar integraciones', 'Permite configurar integraciones externas', 'booleano', 'false', 1070),
('configuracion.facturacion', 'configuracion', 'configuracion', 'Configurar facturación', 'Permite configurar datos fiscales', 'booleano', 'false', 1080),

-- ========================================
-- MÓDULO: WORKFLOWS
-- ========================================
('workflows.aprobar', 'workflows', 'operacion', 'Aprobar solicitudes', 'Permite aprobar solicitudes de workflow asignadas', 'booleano', 'false', 1100),
('workflows.ver_todas', 'workflows', 'operacion', 'Ver todas las aprobaciones', 'Permite ver todas las aprobaciones de la organización', 'booleano', 'false', 1110),
('workflows.gestionar', 'workflows', 'configuracion', 'Gestionar workflows', 'Permite crear y modificar definiciones de workflows', 'booleano', 'false', 1120)

ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    orden_display = EXCLUDED.orden_display,
    actualizado_en = NOW();


-- ====================================================================
-- FUNCIÓN: Asignar permisos default a un rol según su nivel jerárquico
-- ====================================================================
-- Esta función se llama automáticamente cuando se crea un nuevo rol.
-- Asigna permisos basándose en el nivel jerárquico:
-- - nivel >= 80 (admin/propietario): todos los permisos
-- - nivel >= 50 (gerente): lectura + operaciones básicas
-- - nivel >= 10 (empleado): solo operaciones básicas
-- - nivel < 10 (cliente/bot): permisos específicos
--
-- NOTA: El trigger que usa esta función se crea en 16-tabla-roles.sql
--       después de crear la tabla roles.
-- ====================================================================

CREATE OR REPLACE FUNCTION asignar_permisos_default_a_rol(
    p_rol_id INTEGER,
    p_nivel_jerarquia INTEGER,
    p_codigo_rol VARCHAR(50) DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_permiso RECORD;
    v_valor BOOLEAN;
BEGIN
    -- Iterar sobre todos los permisos del catálogo
    FOR v_permiso IN
        SELECT id, codigo, tipo_valor, valor_default
        FROM permisos_catalogo
        WHERE activo = TRUE
    LOOP
        -- Determinar valor según nivel jerárquico
        IF p_nivel_jerarquia >= 80 THEN
            -- Admin/Propietario: todos los permisos booleanos = true
            IF v_permiso.tipo_valor = 'booleano' THEN
                v_valor := TRUE;
            END IF;
        ELSIF p_nivel_jerarquia >= 50 THEN
            -- Gerente: permisos de lectura + algunos de escritura
            v_valor := v_permiso.codigo IN (
                -- Accesos
                'acceso.agendamiento', 'acceso.clientes', 'acceso.pos',
                'acceso.inventario', 'acceso.reportes',
                -- Agendamiento
                'agendamiento.crear_citas', 'agendamiento.editar_citas',
                'agendamiento.cancelar_citas', 'agendamiento.completar_citas',
                'agendamiento.ver_todas_citas',
                -- Clientes
                'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.ver_historial',
                -- POS
                'pos.crear_ventas', 'pos.aplicar_descuentos', 'pos.ver_historial',
                'pos.abrir_caja', 'pos.cerrar_caja', 'pos.ver_puntos_cliente', 'pos.canjear_puntos',
                -- Inventario
                'inventario.ver_productos', 'inventario.crear_ordenes_compra',
                -- Reportes
                'reportes.ver_ventas', 'reportes.ver_citas', 'reportes.exportar',
                -- Profesionales
                'profesionales.ver', 'profesionales.ver_comisiones'
            );
        ELSIF p_nivel_jerarquia >= 10 THEN
            -- Empleado: solo operaciones básicas
            v_valor := v_permiso.codigo IN (
                'acceso.agendamiento', 'acceso.clientes',
                'agendamiento.crear_citas', 'agendamiento.editar_citas', 'agendamiento.completar_citas',
                'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.ver_historial',
                'reportes.ver_ventas', 'reportes.ver_citas', 'reportes.exportar'
            );
        ELSIF p_codigo_rol = 'bot' THEN
            -- Bot: permisos específicos de automatización
            v_valor := v_permiso.codigo IN (
                'acceso.agendamiento', 'acceso.clientes',
                'agendamiento.crear_citas', 'agendamiento.editar_citas',
                'clientes.ver', 'clientes.crear'
            );
        ELSE
            -- Cliente u otros: sin permisos (usan defaults del catálogo)
            v_valor := FALSE;
        END IF;

        -- Insertar permiso si es booleano y tiene valor TRUE
        IF v_permiso.tipo_valor = 'booleano' AND v_valor THEN
            INSERT INTO permisos_rol (rol_id, permiso_id, valor)
            VALUES (p_rol_id, v_permiso.id, to_jsonb(v_valor))
            ON CONFLICT (rol_id, permiso_id) DO UPDATE SET valor = to_jsonb(v_valor);
        END IF;

        -- Permisos numéricos para admin/propietario
        IF p_nivel_jerarquia >= 80 THEN
            IF v_permiso.codigo = 'pos.max_descuento' THEN
                INSERT INTO permisos_rol (rol_id, permiso_id, valor)
                VALUES (p_rol_id, v_permiso.id, '100'::JSONB)
                ON CONFLICT (rol_id, permiso_id) DO UPDATE SET valor = '100'::JSONB;
            ELSIF v_permiso.codigo = 'inventario.limite_aprobacion' THEN
                INSERT INTO permisos_rol (rol_id, permiso_id, valor)
                VALUES (p_rol_id, v_permiso.id, '999999'::JSONB)
                ON CONFLICT (rol_id, permiso_id) DO UPDATE SET valor = '999999'::JSONB;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION asignar_permisos_default_a_rol(INTEGER, INTEGER, VARCHAR) IS
'Asigna permisos default a un rol basándose en su nivel jerárquico.
Llamada automáticamente por trigger en 16-tabla-roles.sql al crear roles de organización.';


-- ====================================================================
-- VERIFICACIÓN (solo catálogo, los roles se verifican en 16-tabla-roles.sql)
-- ====================================================================
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM permisos_catalogo WHERE activo = TRUE;
    RAISE NOTICE 'Total de permisos en catálogo: %', v_count;
END $$;


-- ====================================================================
-- FIN: DATOS INICIALES DE PERMISOS (FASE 7)
-- ====================================================================
