-- ====================================================================
-- SISTEMA DE PERMISOS NORMALIZADOS - DATOS INICIALES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: nucleo/permisos
--
-- DESCRIPCIÓN:
-- Datos iniciales del catálogo de permisos y permisos por rol.
-- Define todos los permisos disponibles en el sistema.
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

-- ========================================
-- MÓDULO: INVENTARIO
-- ========================================
('inventario.ver_productos', 'inventario', 'operacion', 'Ver productos', 'Permite ver catálogo de productos', 'booleano', 'false', 300),
('inventario.crear_productos', 'inventario', 'operacion', 'Crear productos', 'Permite crear nuevos productos', 'booleano', 'false', 310),
('inventario.editar_productos', 'inventario', 'operacion', 'Editar productos', 'Permite modificar productos existentes', 'booleano', 'false', 320),
('inventario.eliminar_productos', 'inventario', 'operacion', 'Eliminar productos', 'Permite eliminar productos', 'booleano', 'false', 330),
('inventario.ajustar_stock', 'inventario', 'operacion', 'Ajustar stock', 'Permite realizar ajustes de inventario', 'booleano', 'false', 340),
('inventario.ver_costos', 'inventario', 'operacion', 'Ver costos', 'Permite ver costos de productos', 'booleano', 'false', 350),
('inventario.crear_ordenes_compra', 'inventario', 'operacion', 'Crear órdenes de compra', 'Permite crear órdenes de compra a proveedores', 'booleano', 'false', 360),
('inventario.aprobar_ordenes_compra', 'inventario', 'operacion', 'Aprobar órdenes de compra', 'Permite aprobar órdenes de compra', 'booleano', 'false', 370),
('inventario.limite_aprobacion', 'inventario', 'operacion', 'Límite de aprobación ($)', 'Monto máximo que puede aprobar en órdenes', 'numerico', '0', 380),
('inventario.recibir_mercancia', 'inventario', 'operacion', 'Recibir mercancía', 'Permite registrar recepción de mercancía', 'booleano', 'false', 390),
('inventario.transferir_stock', 'inventario', 'operacion', 'Transferir stock', 'Permite transferir stock entre sucursales', 'booleano', 'false', 400),

-- ========================================
-- MÓDULO: CLIENTES
-- ========================================
('clientes.ver', 'clientes', 'operacion', 'Ver clientes', 'Permite ver lista de clientes', 'booleano', 'true', 500),
('clientes.crear', 'clientes', 'operacion', 'Crear clientes', 'Permite registrar nuevos clientes', 'booleano', 'false', 510),
('clientes.editar', 'clientes', 'operacion', 'Editar clientes', 'Permite modificar datos de clientes', 'booleano', 'false', 520),
('clientes.eliminar', 'clientes', 'operacion', 'Eliminar clientes', 'Permite eliminar clientes', 'booleano', 'false', 530),
('clientes.ver_historial', 'clientes', 'operacion', 'Ver historial de cliente', 'Permite ver historial completo del cliente', 'booleano', 'false', 540),
('clientes.exportar', 'clientes', 'operacion', 'Exportar clientes', 'Permite exportar lista de clientes', 'booleano', 'false', 550),

-- ========================================
-- MÓDULO: PROFESIONALES
-- ========================================
('profesionales.ver', 'profesionales', 'operacion', 'Ver profesionales', 'Permite ver lista de profesionales', 'booleano', 'false', 600),
('profesionales.crear', 'profesionales', 'operacion', 'Crear profesionales', 'Permite registrar nuevos profesionales', 'booleano', 'false', 610),
('profesionales.editar', 'profesionales', 'operacion', 'Editar profesionales', 'Permite modificar datos de profesionales', 'booleano', 'false', 620),
('profesionales.eliminar', 'profesionales', 'operacion', 'Eliminar profesionales', 'Permite dar de baja profesionales', 'booleano', 'false', 630),
('profesionales.gestionar_horarios', 'profesionales', 'operacion', 'Gestionar horarios', 'Permite configurar horarios de profesionales', 'booleano', 'false', 640),
('profesionales.ver_comisiones', 'profesionales', 'operacion', 'Ver comisiones', 'Permite ver comisiones de profesionales', 'booleano', 'false', 650),

-- ========================================
-- MÓDULO: CONTABILIDAD
-- ========================================
('contabilidad.ver_cuentas', 'contabilidad', 'operacion', 'Ver catálogo de cuentas', 'Permite ver catálogo de cuentas contables', 'booleano', 'false', 700),
('contabilidad.crear_asientos', 'contabilidad', 'operacion', 'Crear asientos', 'Permite crear asientos contables manuales', 'booleano', 'false', 710),
('contabilidad.publicar_asientos', 'contabilidad', 'operacion', 'Publicar asientos', 'Permite publicar asientos (contabilizar)', 'booleano', 'false', 720),
('contabilidad.anular_asientos', 'contabilidad', 'operacion', 'Anular asientos', 'Permite anular asientos publicados', 'booleano', 'false', 730),
('contabilidad.cerrar_periodo', 'contabilidad', 'operacion', 'Cerrar periodo', 'Permite cerrar periodos contables', 'booleano', 'false', 740),
('contabilidad.reabrir_periodo', 'contabilidad', 'operacion', 'Reabrir periodo', 'Permite reabrir periodos cerrados', 'booleano', 'false', 750),
('contabilidad.configurar_cuentas', 'contabilidad', 'configuracion', 'Configurar cuentas', 'Permite configurar catálogo de cuentas', 'booleano', 'false', 760),

-- ========================================
-- MÓDULO: REPORTES
-- ========================================
('reportes.ver_ventas', 'reportes', 'operacion', 'Ver reportes de ventas', 'Acceso a reportes de ventas', 'booleano', 'true', 800),
('reportes.ver_citas', 'reportes', 'operacion', 'Ver reportes de citas', 'Acceso a reportes de agendamiento', 'booleano', 'true', 810),
('reportes.ver_inventario', 'reportes', 'operacion', 'Ver reportes de inventario', 'Acceso a reportes de inventario', 'booleano', 'false', 820),
('reportes.ver_financieros', 'reportes', 'operacion', 'Ver reportes financieros', 'Acceso a reportes contables', 'booleano', 'false', 830),
('reportes.ver_consolidados', 'reportes', 'operacion', 'Ver reportes consolidados', 'Acceso a reportes multi-sucursal', 'booleano', 'false', 840),
('reportes.exportar', 'reportes', 'operacion', 'Exportar reportes', 'Permite exportar reportes a Excel/PDF', 'booleano', 'false', 850),

-- ========================================
-- MÓDULO: CONFIGURACIÓN
-- ========================================
('configuracion.general', 'configuracion', 'configuracion', 'Configuración general', 'Acceso a configuración general de la org', 'booleano', 'false', 900),
('configuracion.sucursales', 'configuracion', 'configuracion', 'Gestionar sucursales', 'Permite crear/editar sucursales', 'booleano', 'false', 910),
('configuracion.usuarios', 'configuracion', 'configuracion', 'Gestionar usuarios', 'Permite crear/editar usuarios', 'booleano', 'false', 920),
('configuracion.roles', 'configuracion', 'configuracion', 'Gestionar roles', 'Permite modificar permisos por rol', 'booleano', 'false', 930),
('configuracion.servicios', 'configuracion', 'configuracion', 'Gestionar servicios', 'Permite crear/editar servicios', 'booleano', 'false', 940),
('configuracion.categorias', 'configuracion', 'configuracion', 'Gestionar categorías', 'Permite crear/editar categorías', 'booleano', 'false', 950),
('configuracion.notificaciones', 'configuracion', 'configuracion', 'Configurar notificaciones', 'Permite configurar plantillas de notificación', 'booleano', 'false', 960),
('configuracion.integraciones', 'configuracion', 'configuracion', 'Gestionar integraciones', 'Permite configurar integraciones externas', 'booleano', 'false', 970),
('configuracion.facturacion', 'configuracion', 'configuracion', 'Configurar facturación', 'Permite configurar datos fiscales', 'booleano', 'false', 980)

ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    orden_display = EXCLUDED.orden_display,
    actualizado_en = NOW();


-- ====================================================================
-- PERMISOS POR ROL
-- ====================================================================
-- Define los permisos base para cada rol del sistema.
-- admin/propietario: Acceso completo
-- empleado: Acceso operativo básico
-- bot: Solo lectura y operaciones de citas
-- cliente: Sin acceso al sistema de gestión
-- ====================================================================

-- Limpiar permisos de rol existentes para recarga
-- TRUNCATE permisos_rol;

-- ========================================
-- ROL: super_admin (bypass - no necesita permisos, tiene acceso total)
-- ========================================
-- No se insertan permisos para super_admin porque tiene bypass RLS

-- ========================================
-- ROL: admin / propietario
-- ========================================
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'admin', id, 'true'::JSONB
FROM permisos_catalogo
WHERE tipo_valor = 'booleano' AND activo = TRUE
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;

-- Permisos numéricos para admin
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'admin', id, '100'::JSONB
FROM permisos_catalogo
WHERE codigo = 'pos.max_descuento'
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;

INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'admin', id, '999999'::JSONB
FROM permisos_catalogo
WHERE codigo = 'inventario.limite_aprobacion'
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;

-- Propietario = mismo que admin
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'propietario', id, 'true'::JSONB
FROM permisos_catalogo
WHERE tipo_valor = 'booleano' AND activo = TRUE
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;

INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'propietario', id, '100'::JSONB
FROM permisos_catalogo
WHERE codigo = 'pos.max_descuento'
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;

INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'propietario', id, '999999'::JSONB
FROM permisos_catalogo
WHERE codigo = 'inventario.limite_aprobacion'
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;

-- ========================================
-- ROL: empleado (acceso operativo limitado)
-- ========================================
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'acceso.agendamiento';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'acceso.clientes';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'agendamiento.crear_citas';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'agendamiento.editar_citas';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'agendamiento.completar_citas';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'clientes.ver';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'clientes.crear';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'clientes.editar';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'clientes.ver_historial';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'reportes.ver_ventas';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'reportes.ver_citas';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'reportes.exportar';

-- ========================================
-- ROL: bot (operaciones automatizadas de citas)
-- ========================================
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'bot', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'acceso.agendamiento';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'bot', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'acceso.clientes';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'bot', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'agendamiento.crear_citas';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'bot', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'agendamiento.editar_citas';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'bot', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'clientes.ver';
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'bot', id, 'true'::JSONB FROM permisos_catalogo WHERE codigo = 'clientes.crear';

-- ========================================
-- ROL: cliente (sin acceso a sistema de gestión)
-- ========================================
-- No se insertan permisos para cliente - todos quedan en default (false)


-- ====================================================================
-- PERMISOS DE WORKFLOWS DE APROBACIÓN (Dic 2025)
-- ====================================================================

INSERT INTO permisos_catalogo (codigo, modulo, categoria, nombre, descripcion, tipo_valor, valor_default, orden_display)
VALUES
    ('workflows.aprobar', 'workflows', 'operacion', 'Aprobar solicitudes',
     'Permite aprobar solicitudes de workflow asignadas',
     'booleano', 'false', 850),

    ('workflows.ver_todas', 'workflows', 'operacion', 'Ver todas las aprobaciones',
     'Permite ver todas las aprobaciones de la organización',
     'booleano', 'false', 851),

    ('workflows.gestionar', 'workflows', 'configuracion', 'Gestionar workflows',
     'Permite crear y modificar definiciones de workflows',
     'booleano', 'false', 852)

ON CONFLICT (codigo) DO NOTHING;

-- Asignar permisos de workflows a admin
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'admin', id, 'true'::JSONB
FROM permisos_catalogo
WHERE codigo IN ('workflows.aprobar', 'workflows.ver_todas', 'workflows.gestionar')
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;

-- Asignar permisos de workflows a propietario
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'propietario', id, 'true'::JSONB
FROM permisos_catalogo
WHERE codigo IN ('workflows.aprobar', 'workflows.ver_todas', 'workflows.gestionar')
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;


-- ====================================================================
-- PERMISOS DE PROGRAMA DE LEALTAD (Ene 2026)
-- ====================================================================

INSERT INTO permisos_catalogo (codigo, modulo, categoria, nombre, descripcion, tipo_valor, valor_default, orden_display)
VALUES
    ('pos.configurar_lealtad', 'pos', 'configuracion', 'Configurar programa de lealtad',
     'Permite configurar programa de lealtad, niveles y reglas',
     'booleano', 'false', 298),

    ('pos.ver_puntos_cliente', 'pos', 'operacion', 'Ver puntos de cliente',
     'Permite ver saldo de puntos de clientes',
     'booleano', 'false', 299),

    ('pos.canjear_puntos', 'pos', 'operacion', 'Canjear puntos',
     'Permite canjear puntos por descuento en ventas',
     'booleano', 'false', 300),

    ('pos.ajustar_puntos', 'pos', 'operacion', 'Ajustar puntos manualmente',
     'Permite hacer ajustes manuales de puntos a clientes',
     'booleano', 'false', 301)

ON CONFLICT (codigo) DO NOTHING;

-- Asignar permisos de lealtad a admin
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'admin', id, 'true'::JSONB
FROM permisos_catalogo
WHERE codigo IN ('pos.configurar_lealtad', 'pos.ver_puntos_cliente', 'pos.canjear_puntos', 'pos.ajustar_puntos')
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;

-- Asignar permisos de lealtad a propietario
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'propietario', id, 'true'::JSONB
FROM permisos_catalogo
WHERE codigo IN ('pos.configurar_lealtad', 'pos.ver_puntos_cliente', 'pos.canjear_puntos', 'pos.ajustar_puntos')
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;

-- Empleado puede ver y canjear puntos (no ajustar ni configurar)
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'empleado', id, 'true'::JSONB
FROM permisos_catalogo
WHERE codigo IN ('pos.ver_puntos_cliente', 'pos.canjear_puntos')
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;


-- ====================================================================
-- PERMISOS DE COMBOS Y MODIFICADORES (Ene 2026)
-- ====================================================================

INSERT INTO permisos_catalogo (codigo, modulo, categoria, nombre, descripcion, tipo_valor, valor_default, orden_display)
VALUES
    ('pos.gestionar_combos', 'pos', 'operacion', 'Gestionar combos',
     'Permite crear, editar y eliminar combos/paquetes de productos',
     'booleano', 'false', 302),

    ('pos.gestionar_modificadores', 'pos', 'operacion', 'Gestionar modificadores',
     'Permite crear, editar grupos de modificadores y asignarlos a productos',
     'booleano', 'false', 303)

ON CONFLICT (codigo) DO NOTHING;

-- Asignar permisos de combos/modificadores a admin
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'admin', id, 'true'::JSONB
FROM permisos_catalogo
WHERE codigo IN ('pos.gestionar_combos', 'pos.gestionar_modificadores')
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;

-- Asignar permisos de combos/modificadores a propietario
INSERT INTO permisos_rol (rol, permiso_id, valor)
SELECT 'propietario', id, 'true'::JSONB
FROM permisos_catalogo
WHERE codigo IN ('pos.gestionar_combos', 'pos.gestionar_modificadores')
ON CONFLICT (rol, permiso_id) DO UPDATE SET valor = EXCLUDED.valor;


-- ====================================================================
-- FIN: DATOS INICIALES DE PERMISOS
-- ====================================================================
