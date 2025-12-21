-- ====================================================================
-- MODULO NOTIFICACIONES: TABLAS
-- ====================================================================
-- Sistema de notificaciones persistentes in-app.
-- Centro de notificaciones con historial, estados y acciones.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- TABLA: notificaciones
-- ====================================================================
-- Notificaciones individuales para cada usuario.
-- Soporta diferentes tipos, niveles y acciones.
-- ====================================================================
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Contenido
    tipo VARCHAR(50) NOT NULL,
    categoria VARCHAR(30) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,

    -- Presentacion
    icono VARCHAR(50),
    nivel VARCHAR(20) DEFAULT 'info',
    imagen_url TEXT,

    -- Estado
    leida BOOLEAN DEFAULT FALSE,
    leida_en TIMESTAMPTZ,
    archivada BOOLEAN DEFAULT FALSE,
    archivada_en TIMESTAMPTZ,

    -- Accion
    accion_url TEXT,
    accion_texto VARCHAR(50),
    accion_datos JSONB,

    -- Referencia a entidad origen
    entidad_tipo VARCHAR(50),
    entidad_id INTEGER,

    -- Control
    expira_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_notif_nivel CHECK (nivel IN ('info', 'success', 'warning', 'error')),
    CONSTRAINT chk_notif_categoria CHECK (categoria IN (
        'citas', 'inventario', 'pagos', 'clientes', 'profesionales',
        'marketplace', 'sistema', 'eventos', 'comisiones', 'suscripcion'
    ))
);

COMMENT ON TABLE notificaciones IS
'Notificaciones persistentes in-app. Cada usuario tiene su propio feed de notificaciones.';

COMMENT ON COLUMN notificaciones.tipo IS
'Tipo especifico: cita_nueva, stock_bajo, pago_recibido, resena_nueva, etc.';

COMMENT ON COLUMN notificaciones.categoria IS
'Categoria general para agrupar: citas, inventario, pagos, sistema, etc.';

COMMENT ON COLUMN notificaciones.nivel IS
'Nivel visual: info (azul), success (verde), warning (amarillo), error (rojo).';

COMMENT ON COLUMN notificaciones.accion_url IS
'URL de destino al hacer clic. Ej: /citas/123, /inventario/productos/456';

COMMENT ON COLUMN notificaciones.accion_datos IS
'Datos adicionales para la accion. JSONB para flexibilidad.';

COMMENT ON COLUMN notificaciones.entidad_tipo IS
'Tipo de entidad relacionada: cita, cliente, producto, venta, etc.';

COMMENT ON COLUMN notificaciones.expira_en IS
'Fecha de expiracion. Notificaciones expiradas se archivan automaticamente.';

-- ====================================================================
-- TABLA: notificaciones_preferencias
-- ====================================================================
-- Preferencias de notificacion por usuario y tipo.
-- Permite personalizar canales (in_app, email, push, whatsapp).
-- ====================================================================
CREATE TABLE IF NOT EXISTS notificaciones_preferencias (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Tipo de notificacion
    tipo_notificacion VARCHAR(50) NOT NULL,

    -- Canales habilitados
    in_app BOOLEAN DEFAULT TRUE,
    email BOOLEAN DEFAULT FALSE,
    push BOOLEAN DEFAULT FALSE,
    whatsapp BOOLEAN DEFAULT FALSE,

    -- Control
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint de unicidad
    CONSTRAINT unique_pref_usuario_tipo UNIQUE (usuario_id, tipo_notificacion)
);

COMMENT ON TABLE notificaciones_preferencias IS
'Preferencias de notificacion por usuario. Define canales habilitados para cada tipo.';

COMMENT ON COLUMN notificaciones_preferencias.tipo_notificacion IS
'Tipo de notificacion: cita_nueva, stock_bajo, pago_recibido, etc.';

COMMENT ON COLUMN notificaciones_preferencias.in_app IS
'Notificacion visible en el centro de notificaciones (campana).';

COMMENT ON COLUMN notificaciones_preferencias.email IS
'Enviar por email. Requiere configuracion de email en organizacion.';

COMMENT ON COLUMN notificaciones_preferencias.push IS
'Notificacion push (futuro - requiere PWA o app nativa).';

COMMENT ON COLUMN notificaciones_preferencias.whatsapp IS
'Enviar por WhatsApp. Requiere integracion de chatbot activa.';

-- ====================================================================
-- TABLA: notificaciones_plantillas
-- ====================================================================
-- Plantillas de notificacion por organizacion.
-- Permite personalizar mensajes por tipo de notificacion.
-- ====================================================================
CREATE TABLE IF NOT EXISTS notificaciones_plantillas (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificacion
    tipo_notificacion VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,

    -- Contenido (soporta variables con {{variable}})
    titulo_template VARCHAR(200) NOT NULL,
    mensaje_template TEXT NOT NULL,

    -- Configuracion
    icono VARCHAR(50),
    nivel VARCHAR(20) DEFAULT 'info',
    activo BOOLEAN DEFAULT TRUE,

    -- Control
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    -- Constraint de unicidad
    CONSTRAINT unique_plantilla_org_tipo UNIQUE (organizacion_id, tipo_notificacion)
);

COMMENT ON TABLE notificaciones_plantillas IS
'Plantillas personalizables de notificacion por organizacion.';

COMMENT ON COLUMN notificaciones_plantillas.titulo_template IS
'Template del titulo. Soporta variables: {{cliente_nombre}}, {{servicio}}, {{fecha}}, etc.';

COMMENT ON COLUMN notificaciones_plantillas.mensaje_template IS
'Template del mensaje. Soporta variables como el titulo.';

-- ====================================================================
-- DATOS INICIALES: Tipos de notificacion predefinidos
-- ====================================================================
-- Insertar en tabla de referencia para documentar tipos disponibles.
-- ====================================================================

-- Crear tabla de tipos de notificacion (referencia/documentacion)
CREATE TABLE IF NOT EXISTS notificaciones_tipos (
    tipo VARCHAR(50) PRIMARY KEY,
    categoria VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono_default VARCHAR(50),
    nivel_default VARCHAR(20) DEFAULT 'info',

    -- Canales habilitados por defecto
    default_in_app BOOLEAN DEFAULT TRUE,
    default_email BOOLEAN DEFAULT FALSE,
    default_push BOOLEAN DEFAULT FALSE,

    activo BOOLEAN DEFAULT TRUE,
    orden INTEGER DEFAULT 0
);

COMMENT ON TABLE notificaciones_tipos IS
'Catalogo de tipos de notificacion disponibles en el sistema.';

-- Insertar tipos predefinidos
INSERT INTO notificaciones_tipos (tipo, categoria, nombre, descripcion, icono_default, nivel_default, default_email, orden)
VALUES
    -- Citas
    ('cita_nueva', 'citas', 'Nueva cita agendada', 'Se agenda una nueva cita', 'calendar-plus', 'info', false, 1),
    ('cita_cancelada', 'citas', 'Cita cancelada', 'Una cita fue cancelada', 'calendar-x', 'warning', true, 2),
    ('cita_modificada', 'citas', 'Cita modificada', 'Se modifico una cita existente', 'calendar-clock', 'info', false, 3),
    ('cita_recordatorio', 'citas', 'Recordatorio de cita', 'Recordatorio de citas proximas', 'bell', 'info', false, 4),
    ('cita_completada', 'citas', 'Cita completada', 'Una cita fue marcada como completada', 'calendar-check', 'success', false, 5),
    ('cita_no_show', 'citas', 'Cliente no se presento', 'El cliente no se presento a la cita', 'user-x', 'warning', false, 6),

    -- Inventario
    ('stock_bajo', 'inventario', 'Stock bajo', 'Un producto esta por debajo del minimo', 'package-minus', 'warning', true, 10),
    ('stock_agotado', 'inventario', 'Stock agotado', 'Un producto se agoto', 'package-x', 'error', true, 11),
    ('stock_recibido', 'inventario', 'Stock recibido', 'Se recibio mercancia', 'package-plus', 'success', false, 12),
    ('orden_compra_creada', 'inventario', 'Orden de compra creada', 'Nueva orden de compra', 'shopping-cart', 'info', false, 13),

    -- Pagos
    ('pago_recibido', 'pagos', 'Pago recibido', 'Se recibio un pago', 'credit-card', 'success', false, 20),
    ('pago_fallido', 'pagos', 'Pago fallido', 'Fallo un intento de pago', 'credit-card', 'error', true, 21),
    ('reembolso_procesado', 'pagos', 'Reembolso procesado', 'Se proceso un reembolso', 'rotate-ccw', 'info', true, 22),

    -- Clientes
    ('cliente_nuevo', 'clientes', 'Nuevo cliente', 'Se registro un nuevo cliente', 'user-plus', 'success', false, 30),
    ('cliente_cumpleanos', 'clientes', 'Cumpleanos de cliente', 'Un cliente cumple anos hoy', 'cake', 'info', false, 31),

    -- Marketplace
    ('resena_nueva', 'marketplace', 'Nueva resena', 'Recibes una nueva resena', 'star', 'info', true, 40),
    ('resena_negativa', 'marketplace', 'Resena negativa', 'Resena de 1-2 estrellas', 'star', 'warning', true, 41),

    -- Comisiones
    ('comision_generada', 'comisiones', 'Comision generada', 'Se genero una comision', 'coins', 'info', false, 50),
    ('comision_pagada', 'comisiones', 'Comision pagada', 'Se pago una comision', 'coins', 'success', false, 51),

    -- Suscripcion
    ('suscripcion_por_vencer', 'suscripcion', 'Suscripcion por vencer', 'Tu suscripcion vence pronto', 'alert-circle', 'warning', true, 60),
    ('suscripcion_vencida', 'suscripcion', 'Suscripcion vencida', 'Tu suscripcion ha vencido', 'alert-triangle', 'error', true, 61),
    ('suscripcion_renovada', 'suscripcion', 'Suscripcion renovada', 'Tu suscripcion fue renovada', 'check-circle', 'success', true, 62),

    -- Sistema
    ('sistema_mantenimiento', 'sistema', 'Mantenimiento programado', 'Mantenimiento del sistema', 'tool', 'warning', true, 70),
    ('sistema_actualizacion', 'sistema', 'Nueva actualizacion', 'Nueva version disponible', 'download', 'info', false, 71),
    ('sistema_bienvenida', 'sistema', 'Bienvenido', 'Mensaje de bienvenida', 'hand-wave', 'success', false, 72)
ON CONFLICT (tipo) DO NOTHING;

-- ====================================================================
-- FIN: TABLAS NOTIFICACIONES
-- ====================================================================
