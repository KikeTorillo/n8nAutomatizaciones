-- ====================================================================
-- MÓDULO WORKFLOWS - TABLAS PRINCIPALES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: workflows
--
-- DESCRIPCIÓN:
-- Sistema de workflows de aprobación configurable para Nexo ERP.
-- Permite definir flujos de aprobación para órdenes de compra,
-- descuentos y otras entidades del sistema.
--
-- TABLAS:
-- • workflow_definiciones: Configuración de workflows por organización
-- • workflow_pasos: Nodos del workflow (inicio, aprobación, fin, etc.)
-- • workflow_transiciones: Conexiones entre pasos
-- • workflow_instancias: Ejecuciones activas de workflows
-- • workflow_historial: Audit trail de decisiones
-- • workflow_delegaciones: Manejo de ausencias/vacaciones
--
-- ====================================================================

-- ====================================================================
-- TABLA: workflow_definiciones
-- Definición de workflows disponibles por organización
-- ====================================================================

CREATE TABLE IF NOT EXISTS workflow_definiciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Configuración de activación
    entidad_tipo VARCHAR(50) NOT NULL,
    -- Valores: 'orden_compra', 'venta_pos', 'descuento_pos', 'cita'

    condicion_activacion JSONB,
    -- Ejemplo: { "campo": "total", "operador": ">", "valor_ref": "limite_aprobacion" }
    -- valor_ref puede ser: número fijo, nombre de permiso, o campo de la entidad

    -- Estado
    activo BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,

    -- Auditoría
    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Restricciones
    CONSTRAINT uk_workflow_definiciones_codigo UNIQUE(organizacion_id, codigo)
);

COMMENT ON TABLE workflow_definiciones IS 'Definiciones de workflows de aprobación por organización';
COMMENT ON COLUMN workflow_definiciones.entidad_tipo IS 'Tipo de entidad: orden_compra, venta_pos, descuento_pos, cita';
COMMENT ON COLUMN workflow_definiciones.condicion_activacion IS 'Condición JSONB para activar el workflow automáticamente';


-- ====================================================================
-- TABLA: workflow_pasos
-- Nodos/pasos del workflow
-- ====================================================================

CREATE TABLE IF NOT EXISTS workflow_pasos (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflow_definiciones(id) ON DELETE CASCADE,

    -- Identificación
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Tipo de paso
    tipo VARCHAR(30) NOT NULL,
    -- Valores permitidos:
    -- 'inicio': Punto de entrada del workflow
    -- 'aprobacion': Requiere decisión manual de un aprobador
    -- 'condicion': Bifurcación automática basada en expresión
    -- 'accion': Ejecuta acción automática (cambiar estado, notificar, etc.)
    -- 'fin': Punto de salida del workflow

    -- Configuración según tipo (JSONB flexible)
    config JSONB NOT NULL DEFAULT '{}',
    -- Para 'aprobacion':
    --   { "aprobadores_tipo": "rol|usuario|permiso",
    --     "aprobadores": ["admin", "propietario"],
    --     "permiso_requerido": "inventario.aprobar_ordenes_compra",
    --     "timeout_horas": 72,
    --     "accion_timeout": "escalar|rechazar|aprobar_auto" }
    --
    -- Para 'condicion':
    --   { "expresion": { "campo": "monto", "operador": ">", "valor": 50000 },
    --     "paso_si": "codigo_paso_true",
    --     "paso_no": "codigo_paso_false" }
    --
    -- Para 'accion':
    --   { "tipo": "cambiar_estado|notificar|webhook",
    --     "estado_nuevo": "enviada",
    --     "notificacion": { "tipo": "aprobacion_completada", "usuarios": "solicitante" } }

    -- Orden para visualización
    orden INTEGER DEFAULT 0,

    -- Restricciones
    CONSTRAINT uk_workflow_pasos_codigo UNIQUE(workflow_id, codigo),
    CONSTRAINT chk_workflow_pasos_tipo CHECK (tipo IN ('inicio', 'aprobacion', 'condicion', 'accion', 'fin'))
);

COMMENT ON TABLE workflow_pasos IS 'Pasos/nodos de un workflow';
COMMENT ON COLUMN workflow_pasos.tipo IS 'Tipo: inicio, aprobacion, condicion, accion, fin';
COMMENT ON COLUMN workflow_pasos.config IS 'Configuración específica según el tipo de paso';


-- ====================================================================
-- TABLA: workflow_transiciones
-- Conexiones entre pasos del workflow
-- ====================================================================

CREATE TABLE IF NOT EXISTS workflow_transiciones (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflow_definiciones(id) ON DELETE CASCADE,

    -- Conexión origen -> destino
    paso_origen_id INTEGER NOT NULL REFERENCES workflow_pasos(id) ON DELETE CASCADE,
    paso_destino_id INTEGER NOT NULL REFERENCES workflow_pasos(id) ON DELETE CASCADE,

    -- Etiqueta de la transición
    etiqueta VARCHAR(50),
    -- Valores típicos: 'aprobar', 'rechazar', 'si', 'no', 'siguiente', 'escalar'

    -- Condición opcional para esta transición
    condicion JSONB,
    -- Ejemplo: { "decision": "aprobar" } para transiciones de aprobación

    -- Orden de evaluación (menor = primero)
    orden INTEGER DEFAULT 0,

    -- Restricciones
    CONSTRAINT uk_workflow_transiciones UNIQUE(paso_origen_id, paso_destino_id, etiqueta)
);

COMMENT ON TABLE workflow_transiciones IS 'Transiciones/conexiones entre pasos del workflow';
COMMENT ON COLUMN workflow_transiciones.etiqueta IS 'Etiqueta: aprobar, rechazar, si, no, siguiente, escalar';


-- ====================================================================
-- TABLA: workflow_instancias
-- Ejecuciones activas de workflows
-- ====================================================================

CREATE TABLE IF NOT EXISTS workflow_instancias (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    workflow_id INTEGER NOT NULL REFERENCES workflow_definiciones(id),

    -- Entidad relacionada
    entidad_tipo VARCHAR(50) NOT NULL,
    entidad_id INTEGER NOT NULL,

    -- Estado actual
    paso_actual_id INTEGER REFERENCES workflow_pasos(id),
    estado VARCHAR(30) NOT NULL DEFAULT 'en_progreso',
    -- Valores: 'en_progreso', 'aprobado', 'rechazado', 'cancelado', 'expirado'

    -- Datos del contexto (snapshot al iniciar)
    contexto JSONB DEFAULT '{}',
    -- Ejemplo para OC: { "folio": "OC-2025-0001", "total": 15000, "proveedor": "Proveedor X" }

    -- Resultado final (decisión + metadatos)
    resultado JSONB,
    -- Ejemplo: { "decision": "aprobado", "comentario": "OK", "aprobado_por": 2 }

    -- Seguimiento temporal
    iniciado_por INTEGER REFERENCES usuarios(id),
    iniciado_en TIMESTAMPTZ DEFAULT NOW(),
    fecha_limite TIMESTAMPTZ,
    -- Fecha límite para timeout/expiración automática
    completado_en TIMESTAMPTZ,
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Prioridad (para ordenar en bandeja)
    prioridad INTEGER DEFAULT 0,
    -- 0 = normal, 1 = alta, 2 = urgente

    -- Restricciones
    CONSTRAINT chk_workflow_instancias_estado CHECK (
        estado IN ('en_progreso', 'aprobado', 'rechazado', 'cancelado', 'expirado')
    )
);

-- Índice único: solo una instancia activa por entidad
CREATE UNIQUE INDEX IF NOT EXISTS uk_workflow_instancias_activa
    ON workflow_instancias(entidad_tipo, entidad_id)
    WHERE estado = 'en_progreso';

COMMENT ON TABLE workflow_instancias IS 'Instancias/ejecuciones activas de workflows';
COMMENT ON COLUMN workflow_instancias.contexto IS 'Snapshot de datos relevantes al momento de iniciar';
COMMENT ON COLUMN workflow_instancias.resultado IS 'Resultado final: decisión, comentario, quién aprobó/rechazó';
COMMENT ON COLUMN workflow_instancias.fecha_limite IS 'Fecha límite para timeout/expiración automática';
COMMENT ON COLUMN workflow_instancias.prioridad IS '0=normal, 1=alta, 2=urgente';


-- ====================================================================
-- TABLA: workflow_historial
-- Audit trail de todas las acciones
-- ====================================================================

CREATE TABLE IF NOT EXISTS workflow_historial (
    id BIGSERIAL PRIMARY KEY,
    instancia_id INTEGER NOT NULL REFERENCES workflow_instancias(id) ON DELETE CASCADE,

    -- Paso donde ocurrió la acción
    paso_id INTEGER NOT NULL REFERENCES workflow_pasos(id),

    -- Acción tomada
    accion VARCHAR(30) NOT NULL,
    -- Valores: 'iniciado', 'aprobado', 'rechazado', 'escalado', 'automatico', 'expirado', 'cancelado'

    -- Quién tomó la acción
    usuario_id INTEGER REFERENCES usuarios(id),
    -- NULL para acciones automáticas del sistema

    -- Cuándo
    ejecutado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Detalles
    comentario TEXT,
    datos JSONB DEFAULT '{}',
    -- Puede incluir: ip_origen, user_agent, datos adicionales

    -- Restricciones
    CONSTRAINT chk_workflow_historial_accion CHECK (
        accion IN ('iniciado', 'aprobado', 'rechazado', 'escalado', 'automatico', 'expirado', 'cancelado', 'devuelto')
    )
);

COMMENT ON TABLE workflow_historial IS 'Historial/audit trail de todas las acciones en workflows';
COMMENT ON COLUMN workflow_historial.accion IS 'Acción: iniciado, aprobado, rechazado, escalado, automatico, expirado, cancelado';


-- ====================================================================
-- TABLA: workflow_delegaciones
-- Delegaciones temporales (vacaciones, ausencias)
-- ====================================================================

CREATE TABLE IF NOT EXISTS workflow_delegaciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Quién delega y a quién
    usuario_original_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    usuario_delegado_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Alcance de la delegación
    workflow_id INTEGER REFERENCES workflow_definiciones(id) ON DELETE CASCADE,
    -- NULL = aplica a todos los workflows

    -- Vigencia
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,

    -- Detalles
    motivo TEXT,
    activo BOOLEAN DEFAULT true,

    -- Auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    -- Restricciones
    CONSTRAINT chk_workflow_delegaciones_fechas CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT chk_workflow_delegaciones_diferente CHECK (usuario_original_id != usuario_delegado_id)
);

COMMENT ON TABLE workflow_delegaciones IS 'Delegaciones temporales de aprobación por ausencia/vacaciones';
COMMENT ON COLUMN workflow_delegaciones.workflow_id IS 'NULL = aplica a todos los workflows de la organización';


-- ====================================================================
-- RLS POLICIES
-- ====================================================================

ALTER TABLE workflow_definiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_pasos ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instancias ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_delegaciones ENABLE ROW LEVEL SECURITY;

-- Política base: aislamiento por organización con soporte para bypass
CREATE POLICY workflow_definiciones_tenant_isolation ON workflow_definiciones
    FOR ALL TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

CREATE POLICY workflow_instancias_tenant_isolation ON workflow_instancias
    FOR ALL TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

CREATE POLICY workflow_delegaciones_tenant_isolation ON workflow_delegaciones
    FOR ALL TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- workflow_pasos hereda de workflow_definiciones
CREATE POLICY workflow_pasos_tenant_isolation ON workflow_pasos
    FOR ALL TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR workflow_id IN (
            SELECT id FROM workflow_definiciones
            WHERE organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- workflow_transiciones hereda de workflow_definiciones
CREATE POLICY workflow_transiciones_tenant_isolation ON workflow_transiciones
    FOR ALL TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR workflow_id IN (
            SELECT id FROM workflow_definiciones
            WHERE organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- workflow_historial hereda de workflow_instancias
CREATE POLICY workflow_historial_tenant_isolation ON workflow_historial
    FOR ALL TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR instancia_id IN (
            SELECT id FROM workflow_instancias
            WHERE organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );


-- ====================================================================
-- TRIGGERS DE ACTUALIZACIÓN
-- ====================================================================

-- Trigger para actualizar timestamp en workflow_definiciones
CREATE OR REPLACE FUNCTION trigger_workflow_definiciones_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workflow_definiciones_updated
    BEFORE UPDATE ON workflow_definiciones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_workflow_definiciones_updated();

-- Trigger para actualizar timestamp en workflow_instancias
CREATE OR REPLACE FUNCTION trigger_workflow_instancias_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workflow_instancias_updated
    BEFORE UPDATE ON workflow_instancias
    FOR EACH ROW
    EXECUTE FUNCTION trigger_workflow_instancias_updated();


-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
