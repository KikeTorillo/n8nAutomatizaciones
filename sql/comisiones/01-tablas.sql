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
    sucursal_id INTEGER,  -- NULL = config global de org, con valor = config de sucursal
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- 🎯 SCOPE DE APLICACIÓN (servicios o productos)
    aplica_a VARCHAR(20) DEFAULT 'servicio' CHECK (aplica_a IN ('servicio', 'producto', 'ambos')),

    -- 📋 PARA SERVICIOS (citas)
    servicio_id INTEGER REFERENCES servicios(id) ON DELETE CASCADE,

    -- 📦 PARA PRODUCTOS (ventas POS)
    -- NOTA: Sin FK porque módulo inventario se inicializa DESPUÉS de comisiones (orden alfabético)
    -- La integridad referencial se valida en backend (ConfiguracionComisionesModel)
    producto_id INTEGER,
    categoria_producto_id INTEGER,

    -- ⚙️ CONFIGURACIÓN DE COMISIÓN
    tipo_comision VARCHAR(20) NOT NULL CHECK (tipo_comision IN ('porcentaje', 'monto_fijo')),
    valor_comision DECIMAL(10, 2) NOT NULL CHECK (valor_comision >= 0),
    activo BOOLEAN DEFAULT true,

    -- 🗑️ SOFT DELETE (Dic 2025)
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- 📝 METADATA
    notas TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    -- ✅ CONSTRAINTS
    -- Unique por profesional + scope específico
    UNIQUE(organizacion_id, profesional_id, servicio_id, producto_id, categoria_producto_id),

    -- Porcentaje máximo 100%
    CHECK (
        (tipo_comision = 'porcentaje' AND valor_comision <= 100) OR
        (tipo_comision = 'monto_fijo')
    ),

    -- Mutual exclusivity: servicio XOR producto XOR categoría XOR global
    CHECK (
        (servicio_id IS NOT NULL AND producto_id IS NULL AND categoria_producto_id IS NULL AND aplica_a = 'servicio') OR
        (servicio_id IS NULL AND producto_id IS NOT NULL AND categoria_producto_id IS NULL AND aplica_a = 'producto') OR
        (servicio_id IS NULL AND producto_id IS NULL AND categoria_producto_id IS NOT NULL AND aplica_a = 'producto') OR
        (servicio_id IS NULL AND producto_id IS NULL AND categoria_producto_id IS NULL AND aplica_a IN ('servicio', 'producto', 'ambos'))
    )
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE configuracion_comisiones IS 'Configuración de esquemas de comisiones por profesional. Soporta servicios (citas) y productos (ventas POS)';

COMMENT ON COLUMN configuracion_comisiones.aplica_a IS
'servicio: Aplica a servicios/citas
producto: Aplica a productos/ventas POS
ambos: Configuración global que aplica a todo (solo para configs globales sin servicio/producto específico)';

COMMENT ON COLUMN configuracion_comisiones.servicio_id IS
'ID de servicio específico. NULL = aplica a todos los servicios (ver aplica_a).
Prioridad: específica (servicio_id) > global (servicio_id NULL).
Solo válido cuando aplica_a = ''servicio''';

COMMENT ON COLUMN configuracion_comisiones.producto_id IS
'ID de producto específico. NULL = aplica a todos los productos (ver categoria_producto_id).
Prioridad: producto_id > categoria_producto_id > global.
Solo válido cuando aplica_a = ''producto''';

COMMENT ON COLUMN configuracion_comisiones.categoria_producto_id IS
'ID de categoría de productos. Si especificado, aplica a todos los productos de esa categoría.
Prioridad: producto_id > categoria_producto_id > global.
Solo válido cuando aplica_a = ''producto''';

COMMENT ON COLUMN configuracion_comisiones.tipo_comision IS
'porcentaje: % del precio del servicio/producto (0-100%)
monto_fijo: cantidad fija por cita/venta (independiente del precio)';

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
    sucursal_id INTEGER,  -- Sucursal donde se generó la comisión
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- 🔀 ORIGEN DE LA COMISIÓN
    origen VARCHAR(20) NOT NULL DEFAULT 'cita' CHECK (origen IN ('cita', 'venta')),

    -- 🔗 FK A CITA (tabla particionada) - NULLABLE para origen='venta'
    cita_id INTEGER,
    fecha_cita DATE,
    FOREIGN KEY (cita_id, fecha_cita) REFERENCES citas(id, fecha_cita) ON DELETE CASCADE,

    -- 🔗 FK A VENTA POS - NULLABLE para origen='cita'
    -- NOTA: Sin FK porque módulo POS se inicializa DESPUÉS de comisiones (orden alfabético)
    -- La integridad referencial se valida en backend
    venta_id INTEGER,

    -- 💰 CÁLCULO DE COMISIÓN
    monto_base DECIMAL(10, 2) NOT NULL CHECK (monto_base >= 0),
    tipo_comision VARCHAR(20) NOT NULL CHECK (tipo_comision IN ('porcentaje', 'monto_fijo', 'mixto')),
    valor_comision DECIMAL(10, 2) NOT NULL,
    monto_comision DECIMAL(10, 2) NOT NULL CHECK (monto_comision >= 0),

    -- 📋 DETALLE (JSONB con breakdown completo)
    -- Para origen='cita': [{servicio_id, nombre, precio, tipo_comision, valor_comision, comision_calculada}]
    detalle_servicios JSONB,
    -- Para origen='venta': [{producto_id, nombre, cantidad, subtotal, tipo_comision, valor_comision, comision_calculada}]
    detalle_productos JSONB,

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
    -- Debe tener cita_id O venta_id según origen
    CHECK (
        (origen = 'cita' AND cita_id IS NOT NULL AND fecha_cita IS NOT NULL AND venta_id IS NULL) OR
        (origen = 'venta' AND venta_id IS NOT NULL AND cita_id IS NULL)
    ),
    -- Fecha pago solo si pagada
    CHECK (
        (estado_pago = 'pagada' AND fecha_pago IS NOT NULL) OR
        (estado_pago != 'pagada' AND fecha_pago IS NULL)
    ),
    -- Detalle según origen
    CHECK (
        (origen = 'cita' AND detalle_servicios IS NOT NULL) OR
        (origen = 'venta' AND detalle_productos IS NOT NULL)
    )
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE comisiones_profesionales IS
'Registro histórico de comisiones generadas automáticamente.
Soporta dos orígenes:
- cita: Trigger trigger_calcular_comision_cita (AFTER UPDATE estado)
- venta: Trigger trigger_calcular_comision_venta (AFTER INSERT/UPDATE)
Anti-duplicados: Trigger valida existencia antes de insertar';

COMMENT ON COLUMN comisiones_profesionales.origen IS
'cita: Comisión generada por servicio completado en cita
venta: Comisión generada por venta de productos en POS';

COMMENT ON COLUMN comisiones_profesionales.venta_id IS
'ID de venta POS asociada (solo si origen = venta).
NULL cuando origen = cita.';

COMMENT ON COLUMN comisiones_profesionales.monto_base IS
'Precio total de la cita/venta (suma de servicios/productos).
Calculado automáticamente en el momento de completar.';

COMMENT ON COLUMN comisiones_profesionales.tipo_comision IS
'porcentaje: Todos los items usan % del precio
monto_fijo: Todos los items usan cantidad fija
mixto: Combina porcentaje y monto fijo (múltiples items con diferentes tipos)';

COMMENT ON COLUMN comisiones_profesionales.valor_comision IS
'Si tipo=porcentaje: Valor del % aplicado
Si tipo=monto_fijo: Monto fijo aplicado
Si tipo=mixto: 0 (no aplica, ver detalle)';

COMMENT ON COLUMN comisiones_profesionales.monto_comision IS
'Comisión total calculada (suma de comisiones de todos los items).
Este es el monto final a pagar al profesional.';

COMMENT ON COLUMN comisiones_profesionales.detalle_servicios IS
'JSON con breakdown por servicio (solo si origen = cita):
[{
  servicio_id: INTEGER,
  nombre: STRING,
  precio: DECIMAL,
  tipo_comision: STRING,
  valor_comision: DECIMAL,
  comision_calculada: DECIMAL
}]
IMPORTANTE: JSONB ya viene parseado desde PostgreSQL, NO usar JSON.parse() en frontend';

COMMENT ON COLUMN comisiones_profesionales.detalle_productos IS
'JSON con breakdown por producto (solo si origen = venta):
[{
  producto_id: INTEGER,
  nombre: STRING,
  cantidad: INTEGER,
  subtotal: DECIMAL,
  tipo_comision: STRING,
  valor_comision: DECIMAL,
  comision_calculada: DECIMAL
}]
IMPORTANTE: JSONB ya viene parseado desde PostgreSQL';

COMMENT ON COLUMN comisiones_profesionales.estado_pago IS
'pendiente: No pagada aún
pagada: Comisión procesada y pagada
cancelada: Cita/venta cancelada (comisión no aplica)';

COMMENT ON COLUMN comisiones_profesionales.fecha_cita IS
'Fecha de la cita asociada (solo si origen = cita).
Requerida para FK compuesta a tabla particionada citas.
NULL cuando origen = venta.';

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

    -- 🎯 SCOPE (para identificar qué tipo de configuración cambió)
    aplica_a VARCHAR(20),
    servicio_id INTEGER,
    producto_id INTEGER,
    categoria_producto_id INTEGER,

    -- 📊 VALORES ANTERIORES (para UPDATE y DELETE)
    tipo_comision_anterior VARCHAR(20),
    valor_comision_anterior DECIMAL(10, 2),
    activo_anterior BOOLEAN,
    aplica_a_anterior VARCHAR(20),

    -- 📊 VALORES NUEVOS (para INSERT y UPDATE)
    tipo_comision_nuevo VARCHAR(20),
    valor_comision_nuevo DECIMAL(10, 2),
    activo_nuevo BOOLEAN,
    aplica_a_nuevo VARCHAR(20),

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
