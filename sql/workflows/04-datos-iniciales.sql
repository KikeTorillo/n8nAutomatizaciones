-- ====================================================================
-- MÓDULO WORKFLOWS - DATOS INICIALES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: workflows
--
-- DESCRIPCIÓN:
-- Datos iniciales para el sistema de workflows:
-- • Tipos de notificación para aprobaciones
-- • Workflow predeterminado para órdenes de compra
--
-- ====================================================================

-- ====================================================================
-- TIPOS DE NOTIFICACIÓN PARA WORKFLOWS
-- ====================================================================

INSERT INTO notificaciones_tipos (tipo, categoria, nombre, descripcion, icono_default, nivel_default, default_in_app, default_email, orden)
VALUES
    ('aprobacion_pendiente', 'sistema', 'Aprobación pendiente',
     'Tienes una solicitud pendiente de aprobar',
     'check-circle', 'warning', true, true, 73),

    ('aprobacion_completada', 'sistema', 'Solicitud aprobada',
     'Tu solicitud fue aprobada exitosamente',
     'check-circle', 'success', true, true, 74),

    ('aprobacion_rechazada', 'sistema', 'Solicitud rechazada',
     'Tu solicitud fue rechazada',
     'x-circle', 'error', true, true, 75),

    ('aprobacion_escalada', 'sistema', 'Aprobación escalada',
     'Una solicitud ha sido escalada para tu revisión',
     'alert-triangle', 'warning', true, true, 76),

    ('aprobacion_expirada', 'sistema', 'Solicitud expirada',
     'Una solicitud de aprobación ha expirado',
     'clock', 'warning', true, false, 77)

ON CONFLICT (tipo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    icono_default = EXCLUDED.icono_default,
    nivel_default = EXCLUDED.nivel_default;


-- ====================================================================
-- WORKFLOW PREDETERMINADO: APROBACIÓN DE ÓRDENES DE COMPRA
-- ====================================================================
-- Este workflow se crea automáticamente para todas las organizaciones.
-- Condición: total > limite_aprobacion del usuario
-- Aprobadores: usuarios con rol admin o propietario
-- ====================================================================

-- Función para crear workflow default en una organización
CREATE OR REPLACE FUNCTION crear_workflow_oc_default(p_organizacion_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_workflow_id INTEGER;
    v_paso_inicio_id INTEGER;
    v_paso_aprobacion_id INTEGER;
    v_paso_fin_aprobado_id INTEGER;
    v_paso_fin_rechazado_id INTEGER;
BEGIN
    -- Verificar si ya existe
    SELECT id INTO v_workflow_id
    FROM workflow_definiciones
    WHERE organizacion_id = p_organizacion_id
      AND codigo = 'aprobacion_oc_monto';

    IF v_workflow_id IS NOT NULL THEN
        RETURN v_workflow_id;
    END IF;

    -- Crear definición del workflow
    INSERT INTO workflow_definiciones (
        organizacion_id,
        codigo,
        nombre,
        descripcion,
        entidad_tipo,
        condicion_activacion,
        activo
    ) VALUES (
        p_organizacion_id,
        'aprobacion_oc_monto',
        'Aprobación de OC por monto',
        'Requiere aprobación cuando el monto de la orden de compra excede el límite del usuario',
        'orden_compra',
        '{"campo": "total", "operador": ">", "valor_ref": "limite_aprobacion"}'::JSONB,
        true
    )
    RETURNING id INTO v_workflow_id;

    -- Crear paso: INICIO
    -- StartNode: 64px alto, handle al centro (32px)
    -- Para alinear con ApprovalNode (80px, handle a 40px): y = 208
    INSERT INTO workflow_pasos (
        workflow_id, codigo, nombre, descripcion, tipo, config, orden, posicion_x, posicion_y
    ) VALUES (
        v_workflow_id,
        'inicio',
        'Inicio',
        'Punto de entrada del workflow',
        'inicio',
        '{}'::JSONB,
        0,
        100,  -- posicion_x
        211   -- posicion_y (ajustado para alinear handle con aprobacion - StartNode 66px, ApprovalNode 89px)
    )
    RETURNING id INTO v_paso_inicio_id;

    -- Crear paso: APROBACIÓN por admin/propietario
    -- ApprovalNode: ~80px alto, handle entrada al 50% (40px)
    -- Handles salida: aprobar al 30% (24px), rechazar al 70% (56px)
    INSERT INTO workflow_pasos (
        workflow_id, codigo, nombre, descripcion, tipo, config, orden, posicion_x, posicion_y
    ) VALUES (
        v_workflow_id,
        'aprobacion_admin',
        'Aprobación de Administrador',
        'Un administrador o propietario debe aprobar la orden de compra',
        'aprobacion',
        '{
            "aprobadores_tipo": "rol",
            "aprobadores": ["admin", "propietario"],
            "timeout_horas": 72,
            "accion_timeout": null
        }'::JSONB,
        1,
        350,  -- posicion_x
        200   -- posicion_y
    )
    RETURNING id INTO v_paso_aprobacion_id;

    -- Crear paso: FIN (aprobado)
    -- EndNode: 64px alto, handle al centro (32px)
    -- Debe alinear con handle "aprobar" del ApprovalNode (y=200+24=224)
    -- Posicion: 224 - 32 = 192
    INSERT INTO workflow_pasos (
        workflow_id, codigo, nombre, descripcion, tipo, config, orden, posicion_x, posicion_y
    ) VALUES (
        v_workflow_id,
        'fin_aprobado',
        'Orden Aprobada',
        'La orden de compra fue aprobada y será enviada',
        'fin',
        '{
            "accion": "cambiar_estado",
            "estado_nuevo": "enviada"
        }'::JSONB,
        2,
        600,  -- posicion_x
        192   -- posicion_y (alineado con handle "aprobar")
    )
    RETURNING id INTO v_paso_fin_aprobado_id;

    -- Crear paso: FIN (rechazado)
    -- Debe alinear con handle "rechazar" del ApprovalNode (y=200+56=256)
    -- Posicion: 256 - 32 = 224
    INSERT INTO workflow_pasos (
        workflow_id, codigo, nombre, descripcion, tipo, config, orden, posicion_x, posicion_y
    ) VALUES (
        v_workflow_id,
        'fin_rechazado',
        'Orden Rechazada',
        'La orden de compra fue rechazada',
        'fin',
        '{
            "accion": "cambiar_estado",
            "estado_nuevo": "rechazada"
        }'::JSONB,
        3,
        600,  -- posicion_x
        224   -- posicion_y (alineado con handle "rechazar")
    )
    RETURNING id INTO v_paso_fin_rechazado_id;

    -- Crear transición: inicio -> aprobacion
    INSERT INTO workflow_transiciones (
        workflow_id, paso_origen_id, paso_destino_id, etiqueta, orden
    ) VALUES (
        v_workflow_id,
        v_paso_inicio_id,
        v_paso_aprobacion_id,
        'siguiente',
        0
    );

    -- Crear transición: aprobacion -> fin_aprobado (cuando se aprueba)
    INSERT INTO workflow_transiciones (
        workflow_id, paso_origen_id, paso_destino_id, etiqueta, condicion, orden
    ) VALUES (
        v_workflow_id,
        v_paso_aprobacion_id,
        v_paso_fin_aprobado_id,
        'aprobar',
        '{"decision": "aprobar"}'::JSONB,
        0
    );

    -- Crear transición: aprobacion -> fin_rechazado (cuando se rechaza)
    INSERT INTO workflow_transiciones (
        workflow_id, paso_origen_id, paso_destino_id, etiqueta, condicion, orden
    ) VALUES (
        v_workflow_id,
        v_paso_aprobacion_id,
        v_paso_fin_rechazado_id,
        'rechazar',
        '{"decision": "rechazar"}'::JSONB,
        1
    );

    RETURN v_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crear_workflow_oc_default IS 'Crea el workflow predeterminado de aprobación de OC para una organización';


-- ====================================================================
-- TRIGGER: Crear workflow automáticamente para nuevas organizaciones
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_crear_workflow_oc_nueva_org()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear workflow de OC para la nueva organización
    PERFORM crear_workflow_oc_default(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solo crear el trigger si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_crear_workflow_oc_nueva_org'
    ) THEN
        CREATE TRIGGER trg_crear_workflow_oc_nueva_org
            AFTER INSERT ON organizaciones
            FOR EACH ROW
            EXECUTE FUNCTION trigger_crear_workflow_oc_nueva_org();
    END IF;
END $$;


-- ====================================================================
-- CREAR WORKFLOWS PARA ORGANIZACIONES EXISTENTES
-- ====================================================================

DO $$
DECLARE
    v_org_id INTEGER;
BEGIN
    -- Iterar sobre todas las organizaciones existentes
    FOR v_org_id IN SELECT id FROM organizaciones WHERE activo = true
    LOOP
        PERFORM crear_workflow_oc_default(v_org_id);
    END LOOP;
END $$;


-- ====================================================================
-- NOTA: Los permisos de workflows se agregan en:
-- sql/nucleo/13-datos-permisos.sql (después de crear permisos_catalogo)
-- ====================================================================


-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
