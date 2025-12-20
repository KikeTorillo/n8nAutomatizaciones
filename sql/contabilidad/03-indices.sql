-- ====================================================================
-- 📊 MÓDULO CONTABILIDAD - ÍNDICES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: contabilidad
--
-- DESCRIPCIÓN:
-- Índices especializados para optimizar consultas del módulo contabilidad.
-- Incluye índices GIN para búsqueda full-text en cuentas.
--
-- TOTAL: ~25 índices especializados
--
-- ESTRATEGIA:
-- • Índices compuestos para queries frecuentes
-- • Índices parciales para filtros comunes (activo, estado)
-- • Índices covering para evitar table lookups
-- • Índices GIN para búsqueda de texto
--
-- ====================================================================

-- ====================================================================
-- 📚 ÍNDICES: cuentas_contables
-- ====================================================================

-- Búsqueda por organización y estado activo (muy frecuente)
CREATE INDEX idx_cuentas_org_activo
    ON cuentas_contables(organizacion_id, activo)
    WHERE activo = TRUE AND eliminado_en IS NULL;

-- Búsqueda por tipo de cuenta (para reportes)
CREATE INDEX idx_cuentas_org_tipo
    ON cuentas_contables(organizacion_id, tipo);

-- Búsqueda por código agrupador SAT (contabilidad electrónica)
CREATE INDEX idx_cuentas_codigo_agrupador
    ON cuentas_contables(organizacion_id, codigo_agrupador)
    WHERE codigo_agrupador IS NOT NULL;

-- Navegación jerárquica (árbol de cuentas)
CREATE INDEX idx_cuentas_padre
    ON cuentas_contables(cuenta_padre_id)
    WHERE cuenta_padre_id IS NOT NULL;

-- Filtro por nivel (para reportes por nivel)
CREATE INDEX idx_cuentas_org_nivel
    ON cuentas_contables(organizacion_id, nivel);

-- Búsqueda de cuentas del sistema (para asientos automáticos)
CREATE INDEX idx_cuentas_sistema
    ON cuentas_contables(organizacion_id, tipo_cuenta_sistema)
    WHERE es_cuenta_sistema = true;

-- Filtro de cuentas afectables (que permiten movimientos)
CREATE INDEX idx_cuentas_afectable
    ON cuentas_contables(organizacion_id)
    WHERE afectable = TRUE AND activo = TRUE AND eliminado_en IS NULL;

-- Índice covering para listado de cuentas
CREATE INDEX idx_cuentas_listado
    ON cuentas_contables(organizacion_id, codigo)
    INCLUDE (nombre, tipo, naturaleza, nivel, activo);

-- Búsqueda full-text en nombres de cuentas
CREATE INDEX idx_cuentas_nombre_gin
    ON cuentas_contables
    USING gin(to_tsvector('spanish', nombre));

-- ====================================================================
-- 📅 ÍNDICES: periodos_contables
-- ====================================================================

-- Búsqueda por organización, año y mes (muy frecuente)
CREATE INDEX idx_periodos_org_anio_mes
    ON periodos_contables(organizacion_id, anio DESC, mes DESC);

-- Filtro por estado del periodo
CREATE INDEX idx_periodos_estado
    ON periodos_contables(organizacion_id, estado);

-- Búsqueda por rango de fechas
CREATE INDEX idx_periodos_fechas
    ON periodos_contables(organizacion_id, fecha_inicio, fecha_fin);

-- Periodos abiertos (para validaciones)
CREATE INDEX idx_periodos_abiertos
    ON periodos_contables(organizacion_id)
    WHERE estado IN ('abierto', 'reabierto');

-- ====================================================================
-- 📖 ÍNDICES: asientos_contables
-- ====================================================================

-- Búsqueda por organización y fecha (consultas diarias)
CREATE INDEX idx_asientos_org_fecha
    ON asientos_contables(organizacion_id, fecha DESC);

-- Filtro por estado del asiento
CREATE INDEX idx_asientos_estado
    ON asientos_contables(organizacion_id, estado);

-- Filtro por tipo de asiento (manual, venta_pos, compra, etc.)
CREATE INDEX idx_asientos_tipo
    ON asientos_contables(organizacion_id, tipo);

-- Búsqueda de asientos por documento origen (rastreo)
CREATE INDEX idx_asientos_documento
    ON asientos_contables(organizacion_id, documento_tipo, documento_id)
    WHERE documento_tipo IS NOT NULL;

-- Búsqueda por número de asiento (referencia)
CREATE INDEX idx_asientos_numero
    ON asientos_contables(organizacion_id, numero_asiento);

-- Asientos publicados (para reportes)
CREATE INDEX idx_asientos_publicados
    ON asientos_contables(organizacion_id, fecha)
    WHERE estado = 'publicado';

-- Índice covering para listado de asientos
CREATE INDEX idx_asientos_listado
    ON asientos_contables(organizacion_id, fecha DESC, numero_asiento)
    INCLUDE (tipo, concepto, total_debe, total_haber, estado);

-- ====================================================================
-- 💰 ÍNDICES: movimientos_contables
-- ====================================================================

-- Búsqueda por asiento (FK compuesta)
CREATE INDEX idx_movimientos_asiento
    ON movimientos_contables(asiento_id, asiento_fecha);

-- Búsqueda por cuenta (libro mayor)
CREATE INDEX idx_movimientos_cuenta
    ON movimientos_contables(cuenta_id);

-- Búsqueda combinada organización + cuenta (reportes)
CREATE INDEX idx_movimientos_org_cuenta
    ON movimientos_contables(organizacion_id, cuenta_id);

-- Búsqueda por tercero (auxiliares cliente/proveedor)
CREATE INDEX idx_movimientos_tercero
    ON movimientos_contables(tercero_tipo, tercero_id)
    WHERE tercero_id IS NOT NULL;

-- Búsqueda por ciudad (centro de costo)
CREATE INDEX idx_movimientos_ciudad
    ON movimientos_contables(ciudad_id)
    WHERE ciudad_id IS NOT NULL;

-- Índice covering para libro mayor (evita table lookup)
CREATE INDEX idx_movimientos_libro_mayor
    ON movimientos_contables(organizacion_id, cuenta_id, asiento_fecha)
    INCLUDE (debe, haber, concepto, asiento_id);

-- Índice para cálculo de saldos
CREATE INDEX idx_movimientos_saldos
    ON movimientos_contables(cuenta_id, asiento_fecha)
    INCLUDE (debe, haber);

-- ====================================================================
-- 📊 ÍNDICES: saldos_cuentas
-- ====================================================================

-- Búsqueda por organización y periodo (reportes)
CREATE INDEX idx_saldos_org_periodo
    ON saldos_cuentas(organizacion_id, periodo_id);

-- Búsqueda por cuenta (histórico de una cuenta)
CREATE INDEX idx_saldos_cuenta
    ON saldos_cuentas(cuenta_id);

-- Índice covering para balanza de comprobación
CREATE INDEX idx_saldos_balanza
    ON saldos_cuentas(organizacion_id, periodo_id, cuenta_id)
    INCLUDE (saldo_inicial, total_debe, total_haber, saldo_final);

-- ====================================================================
-- ⚙️ ÍNDICES: config_contabilidad
-- ====================================================================

-- Búsqueda por organización (único)
CREATE INDEX idx_config_org
    ON config_contabilidad(organizacion_id);

-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON INDEX idx_cuentas_nombre_gin IS
'Índice GIN para búsqueda full-text en nombres de cuentas.
Uso: WHERE to_tsvector(''spanish'', nombre) @@ to_tsquery(''spanish'', ''caja'')';

COMMENT ON INDEX idx_movimientos_libro_mayor IS
'Índice covering para consultas de libro mayor.
Incluye debe, haber, concepto para evitar table lookup.';

COMMENT ON INDEX idx_asientos_documento IS
'Índice para rastrear asientos por documento origen.
Permite encontrar el asiento de una venta POS o orden de compra específica.';

-- ====================================================================
-- ✅ TOTAL: 27 índices especializados
-- ====================================================================
