-- ====================================================================
-- 💵 MÓDULO COMISIONES - ÍNDICES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 17 Noviembre 2025
-- Módulo: comisiones
--
-- DESCRIPCIÓN:
-- Índices especializados para optimizar queries del sistema de comisiones.
-- Soporta RLS multi-tenant, dashboard de profesionales, y reportes admin.
--
-- ÍNDICES (10 total):
-- • configuracion_comisiones: 4 índices (org, profesional, servicio, activo)
-- • comisiones_profesionales: 6 índices (org, profesional, cita, estado, JSONB, fecha)
--
-- CARACTERÍSTICAS:
-- • Índices parciales: Solo registros activos o pendientes (menor tamaño)
-- • Índice GIN en JSONB: Búsquedas analíticas en detalle_servicios
-- • Covering index: Index-only scans para reportes
-- • Soporte RLS: Filtrado por organizacion_id
--
-- ====================================================================

-- ====================================================================
-- 🔍 ÍNDICES PARA TABLA: configuracion_comisiones
-- ====================================================================

-- ÍNDICE 1: ORGANIZACIÓN
-- Propósito: Filtrar configuraciones por organización (RLS + queries frecuentes)
-- Uso: WHERE organizacion_id = ?
CREATE INDEX IF NOT EXISTS idx_config_comisiones_org
    ON configuracion_comisiones(organizacion_id);

COMMENT ON INDEX idx_config_comisiones_org IS
'Índice para filtrar configuraciones por organización.
Usado por RLS en todas las queries.
Performance: O(log n) en búsquedas por organización.';

-- ÍNDICE 2: PROFESIONAL
-- Propósito: Buscar configuración por profesional (usado por trigger)
-- Uso: WHERE profesional_id = ?
CREATE INDEX IF NOT EXISTS idx_config_comisiones_prof
    ON configuracion_comisiones(profesional_id);

COMMENT ON INDEX idx_config_comisiones_prof IS
'Índice para buscar configuración por profesional.
CRÍTICO: Usado por función obtener_configuracion_comision() en trigger.
Query frecuente: Dashboard admin, trigger calcular_comision_cita()
Performance: O(log n) en búsquedas por profesional.';

-- ÍNDICE 3: SERVICIO (PARCIAL)
-- Propósito: Buscar configuración específica de servicio
-- Uso: WHERE servicio_id = ?
CREATE INDEX IF NOT EXISTS idx_config_comisiones_serv
    ON configuracion_comisiones(servicio_id)
    WHERE servicio_id IS NOT NULL;

COMMENT ON INDEX idx_config_comisiones_serv IS
'Índice parcial para configuraciones específicas de servicio.
Solo indexa registros con servicio_id NOT NULL (configuraciones específicas).
Excluye configuraciones globales (servicio_id IS NULL) para reducir tamaño.
Usado por función obtener_configuracion_comision() en trigger.';

-- ÍNDICE 4: CONFIGURACIONES ACTIVAS (PARCIAL)
-- Propósito: Listar solo configuraciones activas
-- Uso: WHERE activo = TRUE
CREATE INDEX IF NOT EXISTS idx_config_comisiones_activo
    ON configuracion_comisiones(activo)
    WHERE activo = true;

COMMENT ON INDEX idx_config_comisiones_activo IS
'Índice parcial para configuraciones activas.
Usado en función obtener_configuracion_comision() para filtrar configs válidas.
Performance: Índice pequeño (solo registros activos), queries muy rápidas.';

-- ====================================================================
-- 🔍 ÍNDICES PARA TABLA: comisiones_profesionales
-- ====================================================================

-- ÍNDICE 1: ORGANIZACIÓN
-- Propósito: Filtrar comisiones por organización (RLS)
-- Uso: WHERE organizacion_id = ?
CREATE INDEX IF NOT EXISTS idx_comisiones_org
    ON comisiones_profesionales(organizacion_id);

COMMENT ON INDEX idx_comisiones_org IS
'Índice para filtrar comisiones por organización.
Usado por RLS en todas las queries.
Performance: O(log n) en búsquedas por organización.';

-- ÍNDICE 2: PROFESIONAL
-- Propósito: Dashboard personal de profesional (query frecuente)
-- Uso: WHERE profesional_id = ?
CREATE INDEX IF NOT EXISTS idx_comisiones_prof
    ON comisiones_profesionales(profesional_id);

COMMENT ON INDEX idx_comisiones_prof IS
'Índice para dashboard personal de profesional.
Query MUY frecuente: empleados consultando sus comisiones.
Uso: GET /api/v1/comisiones/profesional/:id
Performance: O(log n) en búsquedas por profesional.';

-- ÍNDICE 3: CITA (PARA ANTI-DUPLICADOS)
-- Propósito: Verificar si ya existe comisión para una cita (trigger)
-- Uso: WHERE cita_id = ?
CREATE INDEX IF NOT EXISTS idx_comisiones_cita
    ON comisiones_profesionales(cita_id);

COMMENT ON INDEX idx_comisiones_cita IS
'Índice para verificar existencia de comisión por cita.
CRÍTICO: Usado por trigger calcular_comision_cita() para evitar duplicados.
Query: EXISTS (SELECT 1 FROM comisiones_profesionales WHERE cita_id = ?)
Performance: O(log n) en búsquedas por cita.';

-- ÍNDICE 4: ESTADO DE PAGO
-- Propósito: Filtrar comisiones por estado (pendiente/pagada/cancelada)
-- Uso: WHERE estado_pago = ?
CREATE INDEX IF NOT EXISTS idx_comisiones_estado
    ON comisiones_profesionales(estado_pago);

COMMENT ON INDEX idx_comisiones_estado IS
'Índice para filtrar comisiones por estado de pago.
Usado en dashboard admin: listar pendientes, pagadas, canceladas.
Uso: GET /api/v1/comisiones?estado_pago=pendiente
Performance: O(log n) en búsquedas por estado.';

-- ÍNDICE 5: DETALLE_SERVICIOS (GIN para búsquedas JSONB)
-- Propósito: Búsquedas analíticas en JSONB (servicio_id, tipo_comision)
-- Uso: WHERE detalle_servicios @> '[{"servicio_id": 1}]'::jsonb
CREATE INDEX IF NOT EXISTS idx_comisiones_detalle_servicios
    ON comisiones_profesionales USING GIN (detalle_servicios);

COMMENT ON INDEX idx_comisiones_detalle_servicios IS
'Índice GIN para búsquedas avanzadas en JSONB detalle_servicios.
Permite queries como:
- WHERE detalle_servicios @> ''[{"servicio_id": 1}]''::jsonb
- WHERE detalle_servicios ? ''servicio_id''
Uso: Reportes analíticos, dashboards avanzados.
Performance: Eficiente para búsquedas en estructuras JSONB complejas.';

-- ÍNDICE 6: FECHA + ESTADO (COVERING INDEX para reportes)
-- Propósito: Reportes por período (index-only scan)
-- Uso: WHERE creado_en BETWEEN ? AND ? AND estado_pago = ?
CREATE INDEX IF NOT EXISTS idx_comisiones_fecha_estado_covering
    ON comisiones_profesionales(creado_en, estado_pago)
    INCLUDE (profesional_id, monto_comision, tipo_comision);

COMMENT ON INDEX idx_comisiones_fecha_estado_covering IS
'Covering index para reportes por período.
Permite index-only scans (no requiere acceso a tabla).
Query optimizada: Reportes mensuales, trimestrales, anuales.
Uso: GET /api/v1/comisiones/reporte?fecha_inicio=X&fecha_fin=Y
Performance: Index-only scan, 3-5x más rápido que scan normal.
Columnas incluidas: profesional_id, monto_comision, tipo_comision';

-- ====================================================================
-- 🔍 ÍNDICES ADICIONALES PARA PRODUCTOS (COMISIONES UNIFICADAS)
-- ====================================================================

-- ÍNDICE 5: PRODUCTO (PARCIAL)
-- Propósito: Buscar configuración específica de producto
-- Uso: WHERE producto_id = ?
CREATE INDEX IF NOT EXISTS idx_config_comisiones_producto
    ON configuracion_comisiones(producto_id)
    WHERE producto_id IS NOT NULL;

COMMENT ON INDEX idx_config_comisiones_producto IS
'Índice parcial para configuraciones específicas de producto.
Solo indexa registros con producto_id NOT NULL.
Usado por función obtener_configuracion_comision_producto() en trigger.';

-- ÍNDICE 6: CATEGORÍA PRODUCTO (PARCIAL)
-- Propósito: Buscar configuración por categoría de producto
-- Uso: WHERE categoria_producto_id = ?
CREATE INDEX IF NOT EXISTS idx_config_comisiones_categoria
    ON configuracion_comisiones(categoria_producto_id)
    WHERE categoria_producto_id IS NOT NULL;

COMMENT ON INDEX idx_config_comisiones_categoria IS
'Índice parcial para configuraciones por categoría de productos.
Solo indexa registros con categoria_producto_id NOT NULL.
Usado por función obtener_configuracion_comision_producto() en trigger.';

-- ÍNDICE 7: APLICA_A + ACTIVO (COMPUESTO)
-- Propósito: Filtrar configs activas por scope (servicio/producto/ambos)
-- Uso: WHERE aplica_a = ? AND activo = TRUE
CREATE INDEX IF NOT EXISTS idx_config_comisiones_aplica
    ON configuracion_comisiones(organizacion_id, profesional_id, aplica_a, activo)
    WHERE activo = true;

COMMENT ON INDEX idx_config_comisiones_aplica IS
'Índice compuesto para filtrar configs activas por scope.
Usado para búsqueda de configuraciones globales por aplica_a.
Cubre queries de cascada en triggers de citas y ventas.';

-- ====================================================================
-- 🔍 ÍNDICES ADICIONALES PARA VENTAS POS
-- ====================================================================

-- ÍNDICE 7: ORIGEN (para filtrar por tipo de comisión)
-- Propósito: Filtrar comisiones por origen (cita vs venta)
-- Uso: WHERE origen = ?
CREATE INDEX IF NOT EXISTS idx_comisiones_origen
    ON comisiones_profesionales(organizacion_id, origen, estado_pago);

COMMENT ON INDEX idx_comisiones_origen IS
'Índice para filtrar comisiones por origen (cita/venta).
Usado en dashboard y reportes para separar comisiones por tipo.
Incluye estado_pago para queries combinadas frecuentes.';

-- ÍNDICE 8: VENTA_ID (PARCIAL)
-- Propósito: Anti-duplicados para trigger de ventas
-- Uso: WHERE venta_id = ?
CREATE INDEX IF NOT EXISTS idx_comisiones_venta
    ON comisiones_profesionales(venta_id)
    WHERE venta_id IS NOT NULL;

COMMENT ON INDEX idx_comisiones_venta IS
'Índice parcial para verificar existencia de comisión por venta.
CRÍTICO: Usado por trigger calcular_comision_venta() para evitar duplicados.
Query: EXISTS (SELECT 1 FROM comisiones_profesionales WHERE venta_id = ?)';

-- ÍNDICE 9: DETALLE_PRODUCTOS (GIN para búsquedas JSONB)
-- Propósito: Búsquedas analíticas en detalle_productos
-- Uso: WHERE detalle_productos @> '[{"producto_id": 1}]'::jsonb
CREATE INDEX IF NOT EXISTS idx_comisiones_detalle_productos
    ON comisiones_profesionales USING GIN (detalle_productos)
    WHERE detalle_productos IS NOT NULL;

COMMENT ON INDEX idx_comisiones_detalle_productos IS
'Índice GIN para búsquedas avanzadas en JSONB detalle_productos.
Permite queries analíticas por producto específico.
Solo indexa registros con origen = venta (detalle_productos NOT NULL).';

-- ====================================================================
-- 📊 RESUMEN DE ÍNDICES
-- ====================================================================
-- TOTAL: 16 índices especializados
--
-- configuracion_comisiones (7):
-- ├── idx_config_comisiones_org         → RLS multi-tenant
-- ├── idx_config_comisiones_prof        → Trigger + dashboard
-- ├── idx_config_comisiones_serv        → Trigger (configuración específica servicio)
-- ├── idx_config_comisiones_activo      → Filtrado rápido configs activas
-- ├── idx_config_comisiones_producto    → Trigger (configuración específica producto)
-- ├── idx_config_comisiones_categoria   → Trigger (configuración por categoría)
-- └── idx_config_comisiones_aplica      → Filtrado por scope (servicio/producto/ambos)
--
-- comisiones_profesionales (9):
-- ├── idx_comisiones_org                → RLS multi-tenant
-- ├── idx_comisiones_prof               → Dashboard profesional
-- ├── idx_comisiones_cita               → Anti-duplicados (trigger citas)
-- ├── idx_comisiones_estado             → Filtros dashboard
-- ├── idx_comisiones_detalle_servicios  → Búsquedas analíticas JSONB (servicios)
-- ├── idx_comisiones_fecha_estado_covering → Reportes (index-only scan)
-- ├── idx_comisiones_origen             → Filtrar por tipo (cita/venta)
-- ├── idx_comisiones_venta              → Anti-duplicados (trigger ventas)
-- └── idx_comisiones_detalle_productos  → Búsquedas analíticas JSONB (productos)
--
-- ====================================================================
