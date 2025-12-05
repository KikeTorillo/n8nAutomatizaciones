-- ====================================================================
-- MÓDULO CONTABILIDAD - TABLAS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: contabilidad
--
-- DESCRIPCIÓN:
-- Sistema de contabilidad integrado con POS e Inventario.
-- Catálogo de cuentas alineado al Código Agrupador del SAT (México).
-- Asientos contables automáticos desde ventas y compras.
-- Partida doble con validación de cuadre.
--
-- TABLAS (6):
-- • cuentas_contables: Catálogo de cuentas por organización
-- • periodos_contables: Control de periodos abiertos/cerrados
-- • asientos_contables: Libro diario (particionada por fecha)
-- • movimientos_contables: Líneas debe/haber de cada asiento
-- • config_contabilidad: Configuración por organización
-- • saldos_cuentas: Saldos mensuales para reportes rápidos
--
-- CARACTERÍSTICAS PRINCIPALES:
-- • Código Agrupador SAT México (Anexo 24)
-- • Asientos automáticos desde POS y Órdenes de Compra
-- • Partida doble con validación de cuadre
-- • Periodos contables con cierre mensual
-- • RLS multi-tenant
--
-- ====================================================================

-- ====================================================================
-- TABLA 1: cuentas_contables
-- ====================================================================
-- Catálogo de cuentas contables por organización.
-- Alineado al Código Agrupador del SAT (México).
--
-- JERARQUÍA DE NIVELES:
-- Nivel 1: Clasificación (Activo, Pasivo, Capital, Ingreso, Costo, Gasto)
-- Nivel 2: Grupo (Activo Circulante, Pasivo Corto Plazo, etc.)
-- Nivel 3: Subgrupo (Caja, Bancos, Clientes, etc.)
-- Nivel 4-6: Cuentas detalle
--
-- CUENTAS DEL SISTEMA:
-- Cuentas marcadas como es_cuenta_sistema=true son utilizadas
-- automáticamente para asientos desde POS, Inventario, Comisiones.
-- ====================================================================

CREATE TABLE cuentas_contables (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📋 CLASIFICACIÓN SAT
    codigo VARCHAR(30) NOT NULL,                    -- "1.1.01" código interno jerárquico
    codigo_agrupador VARCHAR(20),                   -- "101.01" código SAT (Anexo 24)

    -- 📝 DESCRIPCIÓN
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,

    -- 🎯 TIPO Y NATURALEZA
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN (
        'activo',           -- Bienes y derechos
        'pasivo',           -- Obligaciones
        'capital',          -- Patrimonio
        'ingreso',          -- Ventas y otros ingresos
        'costo',            -- Costo de ventas
        'gasto'             -- Gastos operativos
    )),
    naturaleza VARCHAR(10) NOT NULL CHECK (naturaleza IN ('deudora', 'acreedora')),

    -- 🌳 JERARQUÍA
    nivel INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 6),
    cuenta_padre_id INTEGER REFERENCES cuentas_contables(id) ON DELETE CASCADE,

    -- ⚙️ CONFIGURACIÓN
    afectable BOOLEAN DEFAULT true,                  -- Permite movimientos directos
    requiere_auxiliar BOOLEAN DEFAULT false,         -- Requiere subcuenta para movimientos
    permite_movimientos_manuales BOOLEAN DEFAULT true,

    -- 🔗 VINCULACIÓN AUTOMÁTICA (para asientos automáticos desde POS/Inventario)
    es_cuenta_sistema BOOLEAN DEFAULT false,         -- Cuenta del sistema (no editable)
    tipo_cuenta_sistema VARCHAR(50),                 -- Identificador para asientos automáticos
    -- Valores: ventas, costo_ventas, inventario, clientes, proveedores,
    --          iva_trasladado, iva_acreditable, bancos, caja, comisiones_gasto, descuentos

    -- 📊 SALDOS ACUMULADOS (actualizados por triggers)
    saldo_inicial DECIMAL(15, 2) DEFAULT 0,
    saldo_deudor DECIMAL(15, 2) DEFAULT 0,
    saldo_acreedor DECIMAL(15, 2) DEFAULT 0,
    saldo_final DECIMAL(15, 2) DEFAULT 0,

    -- 📅 TIMESTAMPS
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, codigo),
    CONSTRAINT uk_codigo_agrupador_org UNIQUE(organizacion_id, codigo_agrupador)
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE cuentas_contables IS
'Catálogo de cuentas contables por organización.
Alineado al Código Agrupador del SAT (México) según Anexo 24.
Soporta hasta 6 niveles de jerarquía.';

COMMENT ON COLUMN cuentas_contables.codigo IS
'Código interno jerárquico de la cuenta (ej: 1.1.01, 1.1.02).
Debe ser único por organización.';

COMMENT ON COLUMN cuentas_contables.codigo_agrupador IS
'Código del Anexo 24 del SAT para contabilidad electrónica.
Ejemplos: 101.01 (Caja), 102.01 (Bancos), 201.01 (Proveedores).
Requerido para generar XML de contabilidad electrónica.';

COMMENT ON COLUMN cuentas_contables.tipo IS
'Clasificación contable:
- activo: Bienes y derechos (naturaleza deudora)
- pasivo: Obligaciones (naturaleza acreedora)
- capital: Patrimonio neto (naturaleza acreedora)
- ingreso: Ventas y otros ingresos (naturaleza acreedora)
- costo: Costo de ventas (naturaleza deudora)
- gasto: Gastos operativos (naturaleza deudora)';

COMMENT ON COLUMN cuentas_contables.naturaleza IS
'Naturaleza de la cuenta para cálculo de saldos:
- deudora: Saldo = Debe - Haber (Activo, Costo, Gasto)
- acreedora: Saldo = Haber - Debe (Pasivo, Capital, Ingreso)';

COMMENT ON COLUMN cuentas_contables.afectable IS
'true = Permite movimientos contables directos.
false = Solo agrupa subcuentas (cuenta de mayor).';

COMMENT ON COLUMN cuentas_contables.es_cuenta_sistema IS
'true = Cuenta utilizada por el sistema para asientos automáticos.
No puede ser eliminada ni modificar su tipo_cuenta_sistema.';

COMMENT ON COLUMN cuentas_contables.tipo_cuenta_sistema IS
'Identificador para vincular con asientos automáticos:
ventas, costo_ventas, inventario, clientes, proveedores,
iva_trasladado, iva_acreditable, bancos, caja, comisiones_gasto, descuentos';


-- ====================================================================
-- TABLA 2: periodos_contables
-- ====================================================================
-- Control de periodos contables para cierre mensual.
--
-- ESTADOS:
-- • abierto: Permite crear/editar asientos
-- • en_cierre: Proceso de cierre en curso (bloqueado)
-- • cerrado: No permite modificaciones
-- • reabierto: Temporalmente abierto (requiere permiso admin)
-- ====================================================================

CREATE TABLE periodos_contables (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📅 PERIODO
    anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,

    -- ⚙️ ESTADO
    estado VARCHAR(20) DEFAULT 'abierto' CHECK (estado IN (
        'abierto',          -- Permite movimientos
        'en_cierre',        -- Proceso de cierre en curso
        'cerrado',          -- Cerrado, no permite movimientos
        'reabierto'         -- Reabierto temporalmente (requiere permiso)
    )),

    -- 📊 TOTALES DEL PERIODO (calculados al cerrar)
    total_debe DECIMAL(15, 2) DEFAULT 0,
    total_haber DECIMAL(15, 2) DEFAULT 0,
    total_asientos INTEGER DEFAULT 0,

    -- 🔒 CIERRE
    cerrado_por INTEGER REFERENCES usuarios(id),
    cerrado_en TIMESTAMPTZ,
    notas_cierre TEXT,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, anio, mes),
    CHECK (fecha_fin > fecha_inicio)
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE periodos_contables IS
'Control de periodos contables para cierre mensual y anual.
Cada organización tiene un registro por mes.
Los periodos cerrados no permiten modificaciones a asientos.';

COMMENT ON COLUMN periodos_contables.estado IS
'Estado del periodo:
- abierto: Permite crear y editar asientos
- en_cierre: Proceso de cierre en curso (bloqueado temporalmente)
- cerrado: No permite ninguna modificación
- reabierto: Abierto temporalmente por admin para correcciones';


-- ====================================================================
-- TABLA 3: asientos_contables (Libro Diario)
-- ====================================================================
-- Particionada por fecha para mejor rendimiento en consultas históricas.
--
-- TIPOS DE ASIENTO:
-- • manual: Captura manual por usuario
-- • venta_pos: Generado automáticamente al completar venta POS
-- • compra: Generado al recibir orden de compra
-- • comision: Generado al pagar comisiones
-- • ajuste: Ajustes contables manuales
-- • cierre: Asientos de cierre de periodo
-- • apertura: Asientos de apertura de ejercicio
--
-- ESTADOS:
-- • borrador: En captura, puede no cuadrar aún
-- • publicado: Contabilizado, debe cuadrar, no editable
-- • anulado: Anulado (se genera contra-asiento)
-- ====================================================================

CREATE TABLE asientos_contables (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📋 INFORMACIÓN DEL ASIENTO
    numero_asiento INTEGER NOT NULL,                 -- Secuencial por organización
    fecha DATE NOT NULL,

    -- 🎯 CLASIFICACIÓN
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
        'manual',           -- Captura manual
        'venta_pos',        -- Automático desde POS
        'compra',           -- Automático desde órdenes de compra
        'comision',         -- Automático desde comisiones
        'ajuste',           -- Ajuste contable
        'cierre',           -- Asiento de cierre
        'apertura',         -- Asiento de apertura
        'depreciacion',     -- Depreciación de activos (futuro)
        'nomina'            -- Nómina (futuro)
    )),

    -- 📝 DESCRIPCIÓN
    concepto TEXT NOT NULL,
    referencia VARCHAR(100),                         -- Número de factura, folio POS, etc.

    -- 🔗 DOCUMENTO ORIGEN (para asientos automáticos)
    documento_tipo VARCHAR(50),                      -- venta_pos, orden_compra, comision
    documento_id INTEGER,                            -- ID del documento origen

    -- 💰 TOTALES (calculados por trigger desde movimientos)
    total_debe DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_haber DECIMAL(15, 2) NOT NULL DEFAULT 0,

    -- ⚙️ ESTADO
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN (
        'borrador',         -- En captura, editable
        'publicado',        -- Contabilizado, no editable
        'anulado'           -- Anulado (genera contra-asiento)
    )),

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    publicado_en TIMESTAMPTZ,
    anulado_en TIMESTAMPTZ,

    -- 👤 AUDITORÍA
    creado_por INTEGER REFERENCES usuarios(id),
    publicado_por INTEGER REFERENCES usuarios(id),
    anulado_por INTEGER REFERENCES usuarios(id),
    motivo_anulacion TEXT,

    -- ✅ CONSTRAINTS
    PRIMARY KEY (id, fecha),                         -- PK compuesta para particionamiento
    UNIQUE(organizacion_id, numero_asiento, fecha),  -- Incluye fecha para particionamiento
    -- El cuadre se valida en trigger al publicar
    CHECK (
        estado = 'borrador' OR
        (estado IN ('publicado', 'anulado') AND total_debe = total_haber)
    )
) PARTITION BY RANGE (fecha);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE asientos_contables IS
'Libro diario de asientos contables.
Particionada por fecha para mejor rendimiento.
Los asientos automáticos se generan desde POS y Órdenes de Compra.';

COMMENT ON COLUMN asientos_contables.numero_asiento IS
'Número secuencial único por organización.
Generado automáticamente por trigger.';

COMMENT ON COLUMN asientos_contables.tipo IS
'Tipo de asiento:
- manual: Capturado manualmente
- venta_pos: Generado al completar venta en POS
- compra: Generado al recibir orden de compra
- comision: Generado al pagar comisiones
- ajuste, cierre, apertura: Asientos especiales';

COMMENT ON COLUMN asientos_contables.documento_tipo IS
'Tipo de documento origen para asientos automáticos:
venta_pos, orden_compra, comision_pago';

COMMENT ON COLUMN asientos_contables.documento_id IS
'ID del documento que generó el asiento automático.
Permite rastrear el origen del asiento.';

COMMENT ON COLUMN asientos_contables.estado IS
'Estado del asiento:
- borrador: Editable, puede no cuadrar
- publicado: Contabilizado, debe cuadrar, no editable
- anulado: Genera contra-asiento automático';


-- ====================================================================
-- TABLA 4: movimientos_contables
-- ====================================================================
-- Líneas de cada asiento contable (debe/haber).
-- Cada asiento debe tener al menos 2 líneas (partida doble).
--
-- REGLAS:
-- • Cada línea tiene DEBE o HABER, nunca ambos
-- • La suma de DEBE debe igualar la suma de HABER
-- • Se puede asociar a un tercero (cliente/proveedor)
-- • Se puede asociar a una ubicación (centro de costo)
-- ====================================================================

CREATE TABLE movimientos_contables (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 🔗 RELACIÓN CON ASIENTO (FK compuesta por particionamiento)
    asiento_id INTEGER NOT NULL,
    asiento_fecha DATE NOT NULL,
    FOREIGN KEY (asiento_id, asiento_fecha) REFERENCES asientos_contables(id, fecha) ON DELETE CASCADE,

    -- 🔗 CUENTA CONTABLE
    cuenta_id INTEGER NOT NULL REFERENCES cuentas_contables(id),

    -- 💰 MOVIMIENTO (uno u otro, nunca ambos)
    debe DECIMAL(15, 2) DEFAULT 0 CHECK (debe >= 0),
    haber DECIMAL(15, 2) DEFAULT 0 CHECK (haber >= 0),

    -- 📝 DETALLE
    concepto TEXT,                                   -- Descripción específica de la línea
    referencia VARCHAR(100),                         -- Referencia adicional

    -- 🔗 TERCERO (cliente o proveedor)
    tercero_tipo VARCHAR(20) CHECK (tercero_tipo IN ('cliente', 'proveedor')),
    tercero_id INTEGER,                              -- ID de cliente o proveedor

    -- 📊 CENTRO DE COSTO (por ubicación)
    ciudad_id INTEGER REFERENCES ciudades(id),       -- Ciudad/sucursal del movimiento

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CHECK (debe > 0 OR haber > 0),                   -- Al menos uno debe tener valor
    CHECK (NOT (debe > 0 AND haber > 0))             -- No ambos en la misma línea
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE movimientos_contables IS
'Líneas de movimientos por asiento contable (partida doble).
Cada línea representa un cargo (debe) o abono (haber) a una cuenta.';

COMMENT ON COLUMN movimientos_contables.debe IS
'Monto cargado a la cuenta (lado izquierdo del asiento).
Para cuentas deudoras: aumenta el saldo.
Para cuentas acreedoras: disminuye el saldo.';

COMMENT ON COLUMN movimientos_contables.haber IS
'Monto abonado a la cuenta (lado derecho del asiento).
Para cuentas deudoras: disminuye el saldo.
Para cuentas acreedoras: aumenta el saldo.';

COMMENT ON COLUMN movimientos_contables.tercero_tipo IS
'Tipo de tercero asociado al movimiento:
- cliente: Para cuentas por cobrar
- proveedor: Para cuentas por pagar';

COMMENT ON COLUMN movimientos_contables.tercero_id IS
'ID del cliente o proveedor según tercero_tipo.
Permite generar auxiliares por tercero.';


-- ====================================================================
-- TABLA 5: config_contabilidad
-- ====================================================================
-- Configuración contable por organización.
-- Define las cuentas default para asientos automáticos.
-- Una configuración por organización.
-- ====================================================================

CREATE TABLE config_contabilidad (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL UNIQUE REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 🌍 LOCALIZACIÓN
    pais VARCHAR(2) DEFAULT 'MX',
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- 📋 CATÁLOGO DE CUENTAS
    plan_cuentas VARCHAR(50) DEFAULT 'sat_mexico',   -- sat_mexico, personalizado
    usa_codigo_agrupador_sat BOOLEAN DEFAULT true,

    -- 📊 CONFIGURACIÓN FISCAL (México)
    regimen_fiscal VARCHAR(10),                      -- 601, 603, 612, 626, etc.
    tasa_iva DECIMAL(5, 2) DEFAULT 16.00,
    tasa_isr_retencion DECIMAL(5, 2) DEFAULT 0,

    -- 🔄 MÉTODO DE COSTEO INVENTARIO
    metodo_costeo VARCHAR(20) DEFAULT 'promedio' CHECK (metodo_costeo IN (
        'promedio',         -- Costo promedio ponderado
        'peps',             -- Primeras entradas, primeras salidas (FIFO)
        'identificado'      -- Costo identificado
    )),

    -- 🔗 CUENTAS DEFAULT PARA ASIENTOS AUTOMÁTICOS
    -- Estas cuentas se usan cuando se generan asientos desde POS, Inventario, etc.
    cuenta_ventas_id INTEGER REFERENCES cuentas_contables(id),
    cuenta_costo_ventas_id INTEGER REFERENCES cuentas_contables(id),
    cuenta_inventario_id INTEGER REFERENCES cuentas_contables(id),
    cuenta_clientes_id INTEGER REFERENCES cuentas_contables(id),
    cuenta_proveedores_id INTEGER REFERENCES cuentas_contables(id),
    cuenta_iva_trasladado_id INTEGER REFERENCES cuentas_contables(id),
    cuenta_iva_acreditable_id INTEGER REFERENCES cuentas_contables(id),
    cuenta_bancos_id INTEGER REFERENCES cuentas_contables(id),
    cuenta_caja_id INTEGER REFERENCES cuentas_contables(id),
    cuenta_comisiones_gasto_id INTEGER REFERENCES cuentas_contables(id),
    cuenta_descuentos_id INTEGER REFERENCES cuentas_contables(id),

    -- ⚙️ OPCIONES
    generar_asientos_automaticos BOOLEAN DEFAULT true,   -- Generar desde POS/Compras
    permitir_asientos_descuadrados BOOLEAN DEFAULT false,
    requiere_referencia_asiento BOOLEAN DEFAULT false,
    secuencia_asiento INTEGER DEFAULT 1,                 -- Siguiente número de asiento

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    configurado_por INTEGER REFERENCES usuarios(id)
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE config_contabilidad IS
'Configuración contable por organización.
Define cuentas default para asientos automáticos desde POS e Inventario.
Una configuración por organización.';

COMMENT ON COLUMN config_contabilidad.regimen_fiscal IS
'Régimen fiscal SAT México:
601 - General de Ley Personas Morales
603 - Personas Morales con Fines no Lucrativos
612 - Personas Físicas con Actividades Empresariales
626 - Régimen Simplificado de Confianza (RESICO)';

COMMENT ON COLUMN config_contabilidad.metodo_costeo IS
'Método de costeo para inventarios:
- promedio: Costo promedio ponderado
- peps: Primeras Entradas, Primeras Salidas (FIFO)
- identificado: Costo específico por lote';

COMMENT ON COLUMN config_contabilidad.generar_asientos_automaticos IS
'Si es true, genera asientos automáticamente al:
- Completar venta en POS
- Recibir mercancía de orden de compra
- Pagar comisiones';

COMMENT ON COLUMN config_contabilidad.secuencia_asiento IS
'Siguiente número de asiento a generar.
Incrementado automáticamente por función obtener_siguiente_numero_asiento().';


-- ====================================================================
-- TABLA 6: saldos_cuentas
-- ====================================================================
-- Saldos mensuales por cuenta para reportes rápidos.
-- Actualizado por triggers al publicar asientos.
-- Evita recalcular saldos en cada consulta de reportes.
-- ====================================================================

CREATE TABLE saldos_cuentas (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    cuenta_id INTEGER NOT NULL REFERENCES cuentas_contables(id) ON DELETE CASCADE,
    periodo_id INTEGER NOT NULL REFERENCES periodos_contables(id) ON DELETE CASCADE,

    -- 📊 SALDOS DEL PERIODO
    saldo_inicial DECIMAL(15, 2) DEFAULT 0,          -- Saldo al inicio del periodo
    total_debe DECIMAL(15, 2) DEFAULT 0,             -- Sum(debe) del periodo
    total_haber DECIMAL(15, 2) DEFAULT 0,            -- Sum(haber) del periodo
    saldo_final DECIMAL(15, 2) DEFAULT 0,            -- Calculado según naturaleza

    -- 📈 ESTADÍSTICAS
    cantidad_movimientos INTEGER DEFAULT 0,

    -- 📅 TIMESTAMPS
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, cuenta_id, periodo_id)
);

-- 📝 COMENTARIOS DE DOCUMENTACIÓN
COMMENT ON TABLE saldos_cuentas IS
'Saldos mensuales por cuenta para reportes rápidos.
Actualizado automáticamente por triggers al publicar asientos.
Usado para generar balanza de comprobación sin recalcular.';

COMMENT ON COLUMN saldos_cuentas.saldo_inicial IS
'Saldo al inicio del periodo.
Heredado del saldo_final del periodo anterior.';

COMMENT ON COLUMN saldos_cuentas.saldo_final IS
'Saldo al final del periodo.
Calculado según naturaleza de la cuenta:
- Deudora: saldo_inicial + total_debe - total_haber
- Acreedora: saldo_inicial + total_haber - total_debe';


-- ====================================================================
-- FIN DE TABLAS
-- ====================================================================
