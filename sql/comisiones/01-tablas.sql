-- ====================================================================
-- 💵 MÓDULO COMISIONES - TABLAS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 17 Noviembre 2025
-- Módulo: comisiones
--
-- DESCRIPCIÓN:
-- Sistema completo de comisiones para profesionales con cálculo automático
-- al completar citas. Soporta comisiones por porcentaje o monto fijo,
-- configuración global por profesional o específica por servicio.
--
-- TABLAS (3):
-- • configuracion_comisiones: Esquemas de comisión por profesional/servicio
-- • comisiones_profesionales: Registro histórico de comisiones generadas
-- • historial_configuracion_comisiones: Auditoría de cambios en configuración
--
-- CARACTERÍSTICAS PRINCIPALES:
-- • Trigger automático: Calcula comisión al completar cita
-- • Configuración flexible: Global (profesional) o específica (servicio)
-- • Tipos de comisión: porcentaje (0-100%), monto fijo, o mixto
-- • JSONB detalle_servicios: Breakdown completo por servicio
-- • RLS multi-tenant: Admin ve todo, empleado solo sus comisiones
-- • Auditoría completa: Historial de cambios con usuario modificador
--
-- ====================================================================

-- ====================================================================
-- TABLA 1: configuracion_comisiones
-- ====================================================================
-- Almacena la configuración de comisiones por profesional y/o servicio.
--
-- PRIORIDAD DE CONFIGURACIÓN:
-- 1. Específica: servicio_id = X → Solo ese servicio
-- 2. Global: servicio_id = NULL → Todos los servicios del profesional
--
-- TIPOS DE COMISIÓN:
-- • porcentaje: 0-100% del precio del servicio
-- • monto_fijo: Cantidad fija por cita (independiente del precio)
-- ====================================================================

CREATE TABLE configuracion_comisiones (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    servicio_id INTEGER REFERENCES servicios(id) ON DELETE CASCADE,

    -- ⚙️ CONFIGURACIÓN DE COMISIÓN
    tipo_comision VARCHAR(20) NOT NULL CHECK (tipo_comision IN ('porcentaje', 'monto_fijo')),
    valor_comision DECIMAL(10, 2) NOT NULL CHECK (valor_comision >= 0),
    activo BOOLEAN DEFAULT true,

    -- 📝 METADATA
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, profesional_id, servicio_id),
    CHECK (
        (tipo_comision = 'porcentaje' AND valor_comision <= 100) OR
        (tipo_comision = 'monto_fijo')
    )
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE configuracion_comisiones IS 'Configuración de esquemas de comisiones por profesional/servicio';

COMMENT ON COLUMN configuracion_comisiones.servicio_id IS
'NULL = comisión global del profesional.
Si especificado = comisión específica del servicio (sobrescribe global).
Prioridad: específica > global.';

COMMENT ON COLUMN configuracion_comisiones.tipo_comision IS
'porcentaje: % del precio del servicio (0-100%)
monto_fijo: cantidad fija por cita (independiente del precio)';

COMMENT ON COLUMN configuracion_comisiones.valor_comision IS
'Si tipo=porcentaje: 0-100 (porcentaje del precio)
Si tipo=monto_fijo: cantidad en moneda local';

COMMENT ON COLUMN configuracion_comisiones.activo IS
'Permite desactivar configuración sin eliminarla (soft disable)';

-- ====================================================================
-- TABLA 2: comisiones_profesionales
-- ====================================================================
-- Registro histórico de comisiones generadas automáticamente por trigger.
--
-- CARACTERÍSTICAS:
-- • Trigger automático: Se crea al completar cita (estado → completada)
-- • FK compuesta a citas particionadas: (cita_id, fecha_cita)
-- • JSONB detalle_servicios: Breakdown completo por servicio
-- • Estado de pago: pendiente → pagada → cancelada
-- • Anti-duplicados: Trigger valida existencia antes de insertar
--
-- TIPO DE COMISIÓN FINAL:
-- • porcentaje: Todos los servicios usan porcentaje
-- • monto_fijo: Todos los servicios usan monto fijo
-- • mixto: Combina porcentaje y monto fijo (múltiples servicios)
-- ====================================================================

CREATE TABLE comisiones_profesionales (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- 🔗 FK COMPUESTA A TABLA PARTICIONADA CITAS
    -- IMPORTANTE: citas está particionada por fecha_cita, por lo tanto
    -- debemos incluir fecha_cita en la FK para satisfacer el constraint
    cita_id INTEGER NOT NULL,
    fecha_cita DATE NOT NULL,
    FOREIGN KEY (cita_id, fecha_cita) REFERENCES citas(id, fecha_cita) ON DELETE CASCADE,

    -- 💰 CÁLCULO DE COMISIÓN
    monto_base DECIMAL(10, 2) NOT NULL CHECK (monto_base >= 0),
    tipo_comision VARCHAR(20) NOT NULL CHECK (tipo_comision IN ('porcentaje', 'monto_fijo', 'mixto')),
    valor_comision DECIMAL(10, 2) NOT NULL,
    monto_comision DECIMAL(10, 2) NOT NULL CHECK (monto_comision >= 0),

    -- 📋 DETALLE DE SERVICIOS (JSONB con breakdown completo)
    -- Estructura: [{servicio_id, nombre, precio, tipo_comision, valor_comision, comision_calculada}]
    detalle_servicios JSONB NOT NULL,

    -- 💳 ESTADO DE PAGO
    estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagada', 'cancelada')),
    fecha_pago DATE,
    metodo_pago VARCHAR(50),
    referencia_pago VARCHAR(100),
    notas_pago TEXT,
    pagado_por INTEGER REFERENCES usuarios(id),

    -- ⏰ TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS ADICIONALES
    CHECK (
        (estado_pago = 'pagada' AND fecha_pago IS NOT NULL) OR
        (estado_pago != 'pagada' AND fecha_pago IS NULL)
    )
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE comisiones_profesionales IS
'Registro histórico de comisiones generadas automáticamente al completar citas.
Creación: Trigger trigger_calcular_comision_cita (AFTER UPDATE estado)
Anti-duplicados: Trigger valida existencia antes de insertar';

COMMENT ON COLUMN comisiones_profesionales.monto_base IS
'Precio total de la cita (suma de todos los servicios).
Calculado desde tabla citas_servicios en el momento de completar cita.';

COMMENT ON COLUMN comisiones_profesionales.tipo_comision IS
'porcentaje: Todos los servicios usan % del precio
monto_fijo: Todos los servicios usan cantidad fija
mixto: Combina porcentaje y monto fijo (múltiples servicios con diferentes tipos)';

COMMENT ON COLUMN comisiones_profesionales.valor_comision IS
'Si tipo=porcentaje: Valor del % aplicado
Si tipo=monto_fijo: Monto fijo aplicado
Si tipo=mixto: 0 (no aplica, ver detalle_servicios)';

COMMENT ON COLUMN comisiones_profesionales.monto_comision IS
'Comisión total calculada (suma de comisiones de todos los servicios).
Este es el monto final a pagar al profesional.';

COMMENT ON COLUMN comisiones_profesionales.detalle_servicios IS
'JSON con breakdown por servicio:
[{
  servicio_id: INTEGER,
  nombre: STRING,
  precio: DECIMAL,
  tipo_comision: STRING,
  valor_comision: DECIMAL,
  comision_calculada: DECIMAL
}]
IMPORTANTE: JSONB ya viene parseado desde PostgreSQL, NO usar JSON.parse() en frontend';

COMMENT ON COLUMN comisiones_profesionales.estado_pago IS
'pendiente: No pagada aún
pagada: Comisión procesada y pagada
cancelada: Cita cancelada (comisión no aplica)';

COMMENT ON COLUMN comisiones_profesionales.fecha_cita IS
'Fecha de la cita asociada. Requerida para FK compuesta a tabla particionada citas.
IMPORTANTE: Debe incluirse siempre que se referencie comisiones_profesionales.';

-- ====================================================================
-- TABLA 3: historial_configuracion_comisiones
-- ====================================================================
-- Auditoría de cambios en configuración de comisiones.
--
-- CARACTERÍSTICAS:
-- • Trigger automático: Registra INSERT/UPDATE/DELETE
-- • Bypass RLS: Inserción de sistema (SECURITY DEFINER)
-- • Rastreo completo: Valores anteriores y nuevos
-- • Usuario modificador: Rastreo de quién hizo el cambio
-- ====================================================================

CREATE TABLE historial_configuracion_comisiones (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    configuracion_id INTEGER REFERENCES configuracion_comisiones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL,
    servicio_id INTEGER,

    -- 📊 VALORES ANTERIORES (para UPDATE y DELETE)
    tipo_comision_anterior VARCHAR(20),
    valor_comision_anterior DECIMAL(10, 2),
    activo_anterior BOOLEAN,

    -- 📊 VALORES NUEVOS (para INSERT y UPDATE)
    tipo_comision_nuevo VARCHAR(20),
    valor_comision_nuevo DECIMAL(10, 2),
    activo_nuevo BOOLEAN,

    -- 📝 METADATA DE AUDITORÍA
    accion VARCHAR(20) CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
    modificado_por INTEGER REFERENCES usuarios(id),
    modificado_en TIMESTAMPTZ DEFAULT NOW(),
    razon TEXT
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE historial_configuracion_comisiones IS
'Auditoría de cambios en configuración de comisiones.
Trigger: auditoria_configuracion_comisiones() (AFTER INSERT/UPDATE, BEFORE DELETE)
Bypass RLS: Inserción automática de sistema';

COMMENT ON COLUMN historial_configuracion_comisiones.accion IS
'INSERT: Nueva configuración creada
UPDATE: Configuración modificada
DELETE: Configuración eliminada';

COMMENT ON COLUMN historial_configuracion_comisiones.modificado_por IS
'Usuario que realizó el cambio (obtenido de current_setting app.user_id)';

COMMENT ON COLUMN historial_configuracion_comisiones.razon IS
'Opcional: Razón del cambio (para auditoría y compliance)';
