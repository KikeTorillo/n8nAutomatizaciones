-- ====================================================================
-- 📊 MÓDULO PAGOS - ÍNDICES ESPECIALIZADOS
-- ====================================================================
--
-- PROPÓSITO:
-- Optimización de consultas para el sistema de pagos Mercado Pago.
--
-- COMPONENTES:
-- • 8 índices en tabla pagos
-- • 4 índices en tabla metodos_pago
-- • 1 índice covering para performance
--
-- PERFORMANCE:
-- ✅ Búsqueda por organización optimizada
-- ✅ Consultas por payment_id_mp instantáneas (idempotencia)
-- ✅ Filtrado por estado y tipo de pago
-- ✅ Ordenamiento por fecha optimizado
-- ✅ Búsqueda de suscripciones activas
--
-- ORDEN DE CARGA: #10 (después de tablas)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- ÍNDICES: TABLA PAGOS
-- ====================================================================

-- 1. Índice principal por organización
CREATE INDEX idx_pagos_organizacion ON pagos(organizacion_id);

-- 2. Búsqueda por payment_id de Mercado Pago (idempotencia en webhooks)
CREATE INDEX idx_pagos_payment_mp ON pagos(payment_id_mp);

-- 3. Búsqueda por subscription_id (solo suscripciones)
CREATE INDEX idx_pagos_subscription_mp ON pagos(subscription_id_mp)
WHERE subscription_id_mp IS NOT NULL;

-- 4. Filtrado por estado del pago
CREATE INDEX idx_pagos_estado ON pagos(estado);

-- 5. Ordenamiento por fecha (más recientes primero)
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago DESC NULLS LAST);

-- 6. Búsqueda por external_reference (vinculación con webhooks)
CREATE INDEX idx_pagos_external_ref ON pagos(external_reference);

-- 7. Filtrado por tipo de pago (solo pagos con tipo definido)
CREATE INDEX idx_pagos_tipo ON pagos(tipo_pago)
WHERE tipo_pago IS NOT NULL;

-- 8. Índice covering para queries comunes (listado de pagos por org)
-- Incluye campos frecuentemente consultados para evitar lookups a tabla
CREATE INDEX idx_pagos_org_covering ON pagos(organizacion_id, fecha_pago DESC)
    INCLUDE (payment_id_mp, monto, estado, tipo_pago);

-- ====================================================================
-- ÍNDICES: TABLA METODOS_PAGO
-- ====================================================================

-- 1. Índice principal por organización
CREATE INDEX idx_metodos_pago_org ON metodos_pago(organizacion_id);

-- 2. Filtrado de métodos activos por organización
CREATE INDEX idx_metodos_pago_activo ON metodos_pago(organizacion_id, activo)
WHERE activo = TRUE;

-- 3. Búsqueda del método principal por organización
CREATE INDEX idx_metodos_pago_principal ON metodos_pago(organizacion_id)
WHERE es_principal = TRUE;

-- 4. Búsqueda por customer_id de Mercado Pago
CREATE INDEX idx_metodos_pago_customer_mp ON metodos_pago(customer_id_mp)
WHERE customer_id_mp IS NOT NULL;

-- ====================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON INDEX idx_pagos_org_covering IS 'Índice covering optimizado para listados de pagos - evita lookups a tabla';
COMMENT ON INDEX idx_pagos_payment_mp IS 'Garantiza búsqueda instantánea para idempotencia en webhooks de Mercado Pago';
COMMENT ON INDEX idx_metodos_pago_principal IS 'Índice parcial para buscar rápidamente el método de pago principal de cada organización';
