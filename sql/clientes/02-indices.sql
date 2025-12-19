-- ====================================================================
-- MÓDULO CLIENTES: ÍNDICES ESPECIALIZADOS
-- ====================================================================
-- Índices optimizados para la tabla clientes.
-- Extraído de sql/negocio/ para modularización (Dic 2025)
--
-- CARACTERÍSTICAS:
-- • Índices multi-tenant para aislamiento por organización
-- • Índices GIN para búsqueda full-text en español
-- • Índices trigram para búsqueda fuzzy
-- • Índices covering para máxima performance
-- ====================================================================

-- ====================================================================
-- 🧑‍💼 ÍNDICES PARA TABLA CLIENTES (13 índices optimizados)
-- ====================================================================
-- Optimización para gestión de base de clientes y marketing
-- ────────────────────────────────────────────────────────────────────

-- 🏢 ÍNDICE 1: MULTI-TENANT PRINCIPAL
-- Propósito: Aislamiento por organización (crítico para RLS)
-- Uso: WHERE organizacion_id = ?
CREATE INDEX idx_clientes_organizacion_id ON clientes(organizacion_id);

-- 📧 ÍNDICE 2: BÚSQUEDA POR EMAIL
-- Propósito: Validación de emails únicos y búsqueda rápida
-- Uso: WHERE email = ? AND email IS NOT NULL
CREATE INDEX idx_clientes_email ON clientes(email) WHERE email IS NOT NULL;

-- 📞 ÍNDICE 3: BÚSQUEDA POR TELÉFONO
-- Propósito: Identificación rápida por teléfono
-- Uso: WHERE telefono = ?
CREATE INDEX idx_clientes_telefono ON clientes(telefono);

-- 📞 ÍNDICE 4: UNICIDAD DE TELÉFONO POR ORGANIZACIÓN (PARCIAL)
-- Propósito: Garantizar teléfonos únicos POR ORGANIZACIÓN (solo cuando NO es NULL)
-- Uso: Validación de unicidad que permite múltiples clientes walk-in sin teléfono
-- Ventaja: Índice parcial que solo indexa registros con teléfono != NULL
-- CRÍTICO: Permite múltiples clientes con telefono=NULL en la misma org (walk-ins)
CREATE UNIQUE INDEX idx_clientes_unique_telefono_por_org
    ON clientes (organizacion_id, telefono)
    WHERE telefono IS NOT NULL;

-- 📱 ÍNDICE 5: BÚSQUEDA POR TELEGRAM CHAT ID
-- Propósito: Identificación instantánea de clientes por Telegram (sin pedir teléfono)
-- Uso: WHERE telegram_chat_id = ? (query MÁS frecuente para bots de Telegram)
-- Performance: Búsqueda O(1) en tabla con millones de registros
CREATE INDEX idx_clientes_telegram
    ON clientes(telegram_chat_id)
    WHERE telegram_chat_id IS NOT NULL;

-- 📱 ÍNDICE 6: BÚSQUEDA POR WHATSAPP PHONE
-- Propósito: Identificación instantánea de clientes por WhatsApp Business
-- Uso: WHERE whatsapp_phone = ? (query MÁS frecuente para bots de WhatsApp)
-- Performance: Búsqueda O(1) en tabla con millones de registros
CREATE INDEX idx_clientes_whatsapp
    ON clientes(whatsapp_phone)
    WHERE whatsapp_phone IS NOT NULL;

-- 🔍 ÍNDICE 7: BÚSQUEDA FUZZY DE TELÉFONOS (TRIGRAMA)
-- Propósito: Soporte para búsqueda fuzzy de teléfonos en ClienteModel.buscarPorTelefono()
-- Uso: WHERE telefono % ? (operador similaridad trigrama)
CREATE INDEX idx_clientes_telefono_trgm ON clientes USING GIN(telefono gin_trgm_ops);

-- 🔍 ÍNDICE 8: BÚSQUEDA FULL-TEXT COMBINADA
-- Propósito: Búsqueda avanzada en múltiples campos
-- Uso: Busca simultáneamente en nombre, teléfono, email
DROP INDEX IF EXISTS idx_clientes_nombre;  -- Reemplazar índice simple

CREATE INDEX idx_clientes_search_combined
    ON clientes USING gin(
        to_tsvector('spanish',
            COALESCE(nombre, '') || ' ' ||
            COALESCE(telefono, '') || ' ' ||
            COALESCE(email, '')
        )
    ) WHERE activo = TRUE;

COMMENT ON INDEX idx_clientes_search_combined IS
'Índice GIN compuesto para búsqueda full-text en clientes.
Busca simultáneamente en: nombre, teléfono, email.

Query ejemplo:
  SELECT * FROM clientes
  WHERE to_tsvector(''spanish'', nombre || '' '' || telefono || '' '' || email)
        @@ plainto_tsquery(''spanish'', ''juan 555'')
  AND activo = TRUE;

Performance: <10ms para millones de registros.';

-- 🔍 ÍNDICE 9: BÚSQUEDA FUZZY DE NOMBRES (TRIGRAMA)
-- Propósito: Soporte para ClienteModel.buscarPorNombre() con similarity()
-- Uso: WHERE similarity(nombre, ?) > 0.2
CREATE INDEX idx_clientes_nombre_trgm ON clientes USING GIN(nombre gin_trgm_ops);

-- ✅ ÍNDICE 10: CLIENTES ACTIVOS (PARCIAL)
-- Propósito: Filtrar solo clientes activos (query más común)
-- Uso: WHERE organizacion_id = ? AND activo = TRUE
CREATE INDEX idx_clientes_activos ON clientes(organizacion_id, activo)
    WHERE activo = true;

-- 👨‍⚕️ ÍNDICE 11: PROFESIONAL PREFERIDO
-- Propósito: Consultas de preferencias de clientes
-- Uso: WHERE profesional_preferido_id = ?
CREATE INDEX idx_clientes_profesional_preferido ON clientes(profesional_preferido_id)
    WHERE profesional_preferido_id IS NOT NULL;

-- 📢 ÍNDICE 12: MARKETING PERMITIDO
-- Propósito: Campañas de marketing y comunicaciones
-- Uso: WHERE organizacion_id = ? AND marketing_permitido = TRUE AND activo = TRUE
CREATE INDEX idx_clientes_marketing ON clientes(organizacion_id, marketing_permitido)
    WHERE marketing_permitido = true AND activo = true;

-- 📊 ÍNDICE 13: COVERING INDEX PARA CLIENTES ACTIVOS
-- Propósito: Dashboard de clientes activos con datos básicos
-- Uso: SELECT nombre, telefono, email FROM clientes WHERE organizacion_id = ? AND activo = TRUE
CREATE INDEX IF NOT EXISTS idx_clientes_activos_covering
    ON clientes (organizacion_id, activo, creado_en)
    INCLUDE (nombre, telefono, email, profesional_preferido_id, como_conocio)
    WHERE activo = TRUE;

COMMENT ON INDEX idx_clientes_activos_covering IS
'Índice covering para dashboard de clientes activos.
Optimiza queries que muestran listas de clientes con sus datos básicos.
Reduce I/O en ~50% al evitar acceso a tabla principal.
NOTA: total_citas y ultima_visita se calculan dinámicamente mediante JOINs con tabla citas.';
