-- ====================================================================
-- MÓDULO PROFESIONALES: CATÁLOGO DE MOTIVOS DE SALIDA
-- ====================================================================
-- Catálogo dinámico de razones de terminación de empleados
-- Similar a tipos_bloqueo: tipos del sistema + tipos personalizados
-- Enero 2026
-- ====================================================================

-- ============================================================
-- TABLA: motivos_salida
-- ============================================================
-- Catálogo de motivos de salida/terminación de empleados
-- Soporta tipos del sistema (organizacion_id IS NULL) + tipos personalizados

CREATE TABLE IF NOT EXISTS motivos_salida (
    -- 🔑 IDENTIFICADOR
    id SERIAL PRIMARY KEY,

    -- 🏢 MULTI-TENANT (NULL = tipo del sistema global)
    organizacion_id INTEGER REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📋 IDENTIFICACIÓN
    codigo VARCHAR(50) NOT NULL,              -- 'renuncia', 'jubilacion', 'despido', etc
    nombre VARCHAR(100) NOT NULL,             -- "Renuncia Voluntaria", "Jubilación"
    descripcion TEXT,

    -- ⚙️ CONFIGURACIÓN
    es_sistema BOOLEAN DEFAULT false,         -- true = No eliminable, protegido
    requiere_documentacion BOOLEAN DEFAULT false,  -- true = Requiere documentos adjuntos
    requiere_aprobacion BOOLEAN DEFAULT false,     -- true = Requiere aprobación de RRHH
    afecta_finiquito BOOLEAN DEFAULT true,         -- true = Afecta cálculo de finiquito

    -- 🎨 UI
    color VARCHAR(7) DEFAULT '#6B7280',       -- Color para UI (hex)
    icono VARCHAR(50) DEFAULT 'log-out',      -- Icono Lucide
    orden_display INTEGER DEFAULT 0,          -- Orden visualización en select

    -- ⚙️ ESTADO
    activo BOOLEAN DEFAULT true,

    -- 📝 METADATOS
    metadata JSONB DEFAULT '{}',

    -- 🕐 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT motivos_salida_codigo_valido CHECK (codigo ~ '^[a-z0-9_]+$'),
    CONSTRAINT motivos_salida_codigo_org UNIQUE (organizacion_id, codigo),
    CONSTRAINT motivos_salida_color_valido CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Índice para búsqueda por organización (activos)
CREATE INDEX IF NOT EXISTS idx_motivos_salida_org
    ON motivos_salida(organizacion_id)
    WHERE activo = true;

-- Índice para tipos del sistema (disponibles para todas las orgs)
CREATE INDEX IF NOT EXISTS idx_motivos_salida_sistema
    ON motivos_salida(organizacion_id)
    WHERE organizacion_id IS NULL AND activo = true;

-- Índice para ordenamiento en UI
CREATE INDEX IF NOT EXISTS idx_motivos_salida_orden
    ON motivos_salida(organizacion_id, orden_display);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE motivos_salida ENABLE ROW LEVEL SECURITY;

-- Política: Ver tipos del sistema + tipos de mi organización
CREATE POLICY motivos_salida_select_policy ON motivos_salida
    FOR SELECT
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id IS NULL  -- Tipos del sistema siempre visibles
    );

-- Política: Solo modificar tipos de mi organización (no sistema)
CREATE POLICY motivos_salida_modify_policy ON motivos_salida
    FOR ALL
    USING (
        (organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
         AND es_sistema = false)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================
-- TRIGGER: Actualizar timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_motivos_salida_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_motivos_salida_updated ON motivos_salida;
CREATE TRIGGER trigger_motivos_salida_updated
    BEFORE UPDATE ON motivos_salida
    FOR EACH ROW
    EXECUTE FUNCTION trigger_motivos_salida_updated_at();

-- ============================================================
-- DATOS INICIALES: TIPOS DEL SISTEMA
-- ============================================================
-- Estos son tipos del sistema (organizacion_id IS NULL)
-- Disponibles para todas las organizaciones

INSERT INTO motivos_salida (organizacion_id, codigo, nombre, descripcion, es_sistema, requiere_documentacion, afecta_finiquito, color, orden_display)
VALUES
    -- Renuncias y retiros voluntarios
    (NULL, 'renuncia_voluntaria', 'Renuncia Voluntaria',
     'El empleado renuncia a su puesto por decisión propia',
     true, true, true, '#10B981', 10),

    (NULL, 'renuncia_acuerdo', 'Renuncia de Común Acuerdo',
     'Terminación acordada entre ambas partes con negociación',
     true, true, true, '#3B82F6', 20),

    (NULL, 'jubilacion', 'Jubilación',
     'El empleado se jubila por edad o tiempo de servicio',
     true, true, true, '#8B5CF6', 30),

    -- Terminaciones por causa de la empresa
    (NULL, 'despido_justificado', 'Despido Justificado',
     'Terminación por causa justa imputable al empleado (Art. 47 LFT)',
     true, true, false, '#EF4444', 40),

    (NULL, 'despido_injustificado', 'Despido Injustificado',
     'Terminación sin causa justa, requiere indemnización',
     true, true, true, '#F97316', 50),

    (NULL, 'recorte_personal', 'Recorte de Personal',
     'Reducción de plantilla por reestructuración organizacional',
     true, true, true, '#F59E0B', 55),

    -- Otras causas
    (NULL, 'clausura_negocio', 'Clausura de Negocio',
     'Cierre definitivo de la organización o sucursal',
     true, false, true, '#6B7280', 60),

    (NULL, 'fin_contrato', 'Fin de Contrato Temporal',
     'Terminación natural del contrato por tiempo determinado',
     true, true, false, '#0EA5E9', 65),

    (NULL, 'periodo_prueba', 'No Supera Periodo de Prueba',
     'El empleado no cumplió expectativas durante periodo de prueba',
     true, true, false, '#F43F5E', 70),

    (NULL, 'licencia_excedencia', 'Licencia sin Sueldo / Excedencia',
     'Suspensión del empleo por licencia extendida sin goce de sueldo',
     true, true, false, '#64748B', 75),

    (NULL, 'abandono_trabajo', 'Abandono de Trabajo',
     'El empleado dejó de presentarse sin justificación (3+ días)',
     true, false, false, '#DC2626', 80),

    (NULL, 'muerte', 'Fallecimiento',
     'Terminación por fallecimiento del empleado',
     true, true, true, '#1F2937', 85),

    (NULL, 'incapacidad_permanente', 'Incapacidad Permanente',
     'Terminación por incapacidad permanente total o parcial',
     true, true, true, '#7C3AED', 90)
ON CONFLICT (organizacion_id, codigo) DO NOTHING;

-- ============================================================
-- COMENTARIOS
-- ============================================================

COMMENT ON TABLE motivos_salida IS
'Catálogo dinámico de motivos de salida/terminación de empleados.
Soporta tipos del sistema (globales) y tipos personalizados por organización.
Similar a tipos_bloqueo pero para gestión de bajas de empleados.
Enero 2026';

COMMENT ON COLUMN motivos_salida.codigo IS
'Código único del motivo (minúsculas, números, guiones bajos). Ej: renuncia_voluntaria';

COMMENT ON COLUMN motivos_salida.es_sistema IS
'true = Tipo del sistema, no puede ser eliminado ni modificado por usuarios';

COMMENT ON COLUMN motivos_salida.requiere_documentacion IS
'true = Al asignar este motivo, se requiere subir documentos de respaldo';

COMMENT ON COLUMN motivos_salida.afecta_finiquito IS
'true = Este tipo de baja genera derecho a finiquito/indemnización';

COMMENT ON COLUMN motivos_salida.orden_display IS
'Orden de visualización en selectores de UI (menor = primero)';
