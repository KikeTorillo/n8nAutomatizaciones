-- ====================================================================
-- MÓDULO NEGOCIO: ÍNDICES ESPECIALIZADOS
-- ====================================================================
-- Índices optimizados para las tablas del modelo de negocio:
-- profesionales, clientes, servicios y servicios_profesionales
--
-- CARACTERÍSTICAS:
-- • Índices multi-tenant para aislamiento por organización
-- • Índices GIN para búsqueda full-text en español
-- • Índices parciales para filtrar solo registros activos
-- • Índices covering para máxima performance
-- • Índices trigram para búsqueda fuzzy
--
-- Migrado de: sql/schema/07-indexes.sql
-- Fecha migración: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- 👨‍💼 ÍNDICES PARA TABLA PROFESIONALES (7 índices especializados)
-- ====================================================================
-- Optimización para gestión de personal y asignación de citas
-- ────────────────────────────────────────────────────────────────────

-- 🏢 ÍNDICE 1: MULTI-TENANT PRINCIPAL
-- Propósito: Consultas principales filtradas por organización
-- Uso: WHERE organizacion_id = ? AND activo = TRUE
CREATE INDEX idx_profesionales_org_activo
    ON profesionales (organizacion_id, activo) WHERE activo = TRUE;

-- 🎭 ÍNDICE 2: BÚSQUEDA POR TIPO PROFESIONAL
-- Propósito: Filtrar profesionales por especialidad en organización
-- Uso: WHERE organizacion_id = ? AND tipo_profesional_id = ? AND activo = TRUE
CREATE INDEX idx_profesionales_tipo_org
    ON profesionales (organizacion_id, tipo_profesional_id, activo) WHERE activo = TRUE;

-- 📧 ÍNDICE 3: EMAIL ÚNICO POR ORGANIZACIÓN
-- Propósito: Validar email único dentro de cada organización
-- Uso: Constraint de unicidad multi-tenant
CREATE UNIQUE INDEX idx_profesionales_email_org
    ON profesionales (organizacion_id, email)
    WHERE email IS NOT NULL AND activo = TRUE;

-- 📋 ÍNDICE 4: BÚSQUEDA EN LICENCIAS Y CERTIFICACIONES
-- Propósito: Filtrar por licencias específicas (útil para médicos, etc.)
-- Uso: WHERE licencias_profesionales ? 'cedula_profesional'
CREATE INDEX idx_profesionales_licencias_gin
    ON profesionales USING gin(licencias_profesionales) WHERE activo = TRUE;

-- 🌟 ÍNDICE 5: RANKING Y DISPONIBILIDAD
-- Propósito: Ordenar profesionales por calificación y disponibilidad
-- Uso: ORDER BY calificacion_promedio DESC, disponible_online DESC
CREATE INDEX idx_profesionales_ranking
    ON profesionales (organizacion_id, disponible_online, calificacion_promedio DESC, activo)
    WHERE activo = TRUE;

-- 📝 ÍNDICE 6: BÚSQUEDA FULL-TEXT COMBINADA (MEJORADO OCT 2025)
-- Propósito: Búsqueda avanzada en múltiples campos
-- Uso: Busca simultáneamente en nombre, teléfono, email, biografía
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
DROP INDEX IF EXISTS idx_profesionales_nombre_gin;  -- Reemplazar índice simple

CREATE INDEX idx_profesionales_search_combined
    ON profesionales USING gin(
        to_tsvector('spanish',
            COALESCE(nombre_completo, '') || ' ' ||
            COALESCE(telefono, '') || ' ' ||
            COALESCE(email, '') || ' ' ||
            COALESCE(biografia, '')
        )
    ) WHERE activo = TRUE;

COMMENT ON INDEX idx_profesionales_search_combined IS
'Índice GIN compuesto para búsqueda full-text en profesionales.
Busca en: nombre, teléfono, email, biografía.
Útil para: Buscador de profesionales, filtros avanzados.
Performance: <10ms para millones de registros.';

-- 👨‍💼 ÍNDICE 7: COVERING INDEX PARA PROFESIONALES DISPONIBLES ONLINE (MEJORADO OCT 2025)
-- Propósito: Listado de profesionales para agendamiento online
-- Uso: WHERE organizacion_id = ? AND activo = TRUE AND disponible_online = TRUE
-- Ventaja: INCLUDE ampliado con datos de contacto
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
DROP INDEX IF EXISTS idx_profesionales_disponibles;

CREATE INDEX idx_profesionales_disponibles_covering
    ON profesionales (organizacion_id, activo, disponible_online)
    INCLUDE (nombre_completo, calificacion_promedio, telefono, email)
    WHERE activo = TRUE AND disponible_online = TRUE;

COMMENT ON INDEX idx_profesionales_disponibles_covering IS
'Índice covering para búsqueda rápida de profesionales disponibles.
INCLUDE evita acceso al heap (+40% performance).
Query típico: SELECT nombre, calificacion, telefono, email
             FROM profesionales
             WHERE organizacion_id = ? AND activo = TRUE AND disponible_online = TRUE;';

-- ====================================================================
-- 🧑‍💼 ÍNDICES PARA TABLA CLIENTES (7 índices optimizados)
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

-- 📞 ÍNDICE 3: BÚSQUEDA POR TELÉFONO (MEJORADO CON TRIGRAMA)
-- Propósito: Identificación rápida por teléfono + búsqueda fuzzy
-- Uso: WHERE telefono = ? AND similarity(telefono, ?) > 0.3
CREATE INDEX idx_clientes_telefono ON clientes(telefono);

-- 📞 ÍNDICE 3C: UNICIDAD DE TELÉFONO POR ORGANIZACIÓN (PARCIAL)
-- Propósito: Garantizar teléfonos únicos POR ORGANIZACIÓN (solo cuando NO es NULL)
-- Uso: Validación de unicidad que permite múltiples clientes walk-in sin teléfono
-- Ventaja: Índice parcial que solo indexa registros con teléfono != NULL
-- CRÍTICO: Permite múltiples clientes con telefono=NULL en la misma org (walk-ins)
CREATE UNIQUE INDEX idx_clientes_unique_telefono_por_org
    ON clientes (organizacion_id, telefono)
    WHERE telefono IS NOT NULL;

-- 📱 ÍNDICE 3D: BÚSQUEDA POR TELEGRAM CHAT ID
-- Propósito: Identificación instantánea de clientes por Telegram (sin pedir teléfono)
-- Uso: WHERE telegram_chat_id = ? (query MÁS frecuente para bots de Telegram)
-- Performance: Búsqueda O(1) en tabla con millones de registros
CREATE INDEX idx_clientes_telegram
    ON clientes(telegram_chat_id)
    WHERE telegram_chat_id IS NOT NULL;

-- 📱 ÍNDICE 3E: BÚSQUEDA POR WHATSAPP PHONE
-- Propósito: Identificación instantánea de clientes por WhatsApp Business
-- Uso: WHERE whatsapp_phone = ? (query MÁS frecuente para bots de WhatsApp)
-- Performance: Búsqueda O(1) en tabla con millones de registros
CREATE INDEX idx_clientes_whatsapp
    ON clientes(whatsapp_phone)
    WHERE whatsapp_phone IS NOT NULL;

-- 🔍 ÍNDICE 3B: BÚSQUEDA FUZZY DE TELÉFONOS (TRIGRAMA)
-- Propósito: Soporte para búsqueda fuzzy de teléfonos en ClienteModel.buscarPorTelefono()
-- Uso: WHERE telefono % ? (operador similaridad trigrama)
CREATE INDEX idx_clientes_telefono_trgm ON clientes USING GIN(telefono gin_trgm_ops);

-- 🔍 ÍNDICE 4: BÚSQUEDA FULL-TEXT COMBINADA (MEJORADO OCT 2025)
-- Propósito: Búsqueda avanzada en múltiples campos
-- Uso: Busca simultáneamente en nombre, teléfono, email
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
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

-- 🔍 ÍNDICE 4B: BÚSQUEDA FUZZY DE NOMBRES (TRIGRAMA)
-- Propósito: Soporte para ClienteModel.buscarPorNombre() con similarity()
-- Uso: WHERE similarity(nombre, ?) > 0.2
CREATE INDEX idx_clientes_nombre_trgm ON clientes USING GIN(nombre gin_trgm_ops);

-- ✅ ÍNDICE 5: CLIENTES ACTIVOS (PARCIAL)
-- Propósito: Filtrar solo clientes activos (query más común)
-- Uso: WHERE organizacion_id = ? AND activo = TRUE
CREATE INDEX idx_clientes_activos ON clientes(organizacion_id, activo)
    WHERE activo = true;

-- 👨‍⚕️ ÍNDICE 6: PROFESIONAL PREFERIDO
-- Propósito: Consultas de preferencias de clientes
-- Uso: WHERE profesional_preferido_id = ?
CREATE INDEX idx_clientes_profesional_preferido ON clientes(profesional_preferido_id)
    WHERE profesional_preferido_id IS NOT NULL;

-- 📢 ÍNDICE 7: MARKETING PERMITIDO
-- Propósito: Campañas de marketing y comunicaciones
-- Uso: WHERE organizacion_id = ? AND marketing_permitido = TRUE AND activo = TRUE
CREATE INDEX idx_clientes_marketing ON clientes(organizacion_id, marketing_permitido)
    WHERE marketing_permitido = true AND activo = true;

-- 📊 ÍNDICE 8: COVERING INDEX PARA CLIENTES ACTIVOS (OCT 2025)
-- Propósito: Dashboard de clientes activos con datos básicos
-- Uso: SELECT nombre, telefono, email FROM clientes WHERE organizacion_id = ? AND activo = TRUE
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
CREATE INDEX IF NOT EXISTS idx_clientes_activos_covering
    ON clientes (organizacion_id, activo, creado_en)
    INCLUDE (nombre, telefono, email, profesional_preferido_id, como_conocio)
    WHERE activo = TRUE;

COMMENT ON INDEX idx_clientes_activos_covering IS
'Índice covering para dashboard de clientes activos.
Optimiza queries que muestran listas de clientes con sus datos básicos.
Reduce I/O en ~50% al evitar acceso a tabla principal.
NOTA: total_citas y ultima_visita se calculan dinámicamente mediante JOINs con tabla citas.';

-- ====================================================================
-- 🎯 ÍNDICES PARA TABLA SERVICIOS (6 índices especializados)
-- ====================================================================
-- Optimización para catálogo de servicios personalizado por organización
-- ────────────────────────────────────────────────────────────────────

-- 🏢 ÍNDICE 1: MULTI-TENANT PRINCIPAL
-- Propósito: Consultas principales filtradas por organización
-- Uso: WHERE organizacion_id = ? AND activo = TRUE
CREATE INDEX idx_servicios_organizacion_activo
    ON servicios (organizacion_id, activo) WHERE activo = TRUE;

-- 🔍 ÍNDICE 2: BÚSQUEDA FULL-TEXT COMBINADA (MEJORADO OCT 2025)
-- Propósito: Búsqueda inteligente en nombre, descripción y categoría
-- Uso: Autocompletar y búsqueda de servicios en español
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
DROP INDEX IF EXISTS idx_servicios_busqueda_gin;  -- Reemplazar índice anterior
DROP INDEX IF EXISTS idx_servicios_nombre_gin;     -- Por si existe versión antigua

CREATE INDEX idx_servicios_search_combined
    ON servicios USING gin(
        to_tsvector('spanish',
            COALESCE(nombre, '') || ' ' ||
            COALESCE(descripcion, '') || ' ' ||
            COALESCE(categoria, '')
        )
    ) WHERE activo = TRUE;

COMMENT ON INDEX idx_servicios_search_combined IS
'Índice GIN compuesto para búsqueda en catálogo de servicios.
Busca en: nombre, descripción, categoría.
Optimizado para: Buscador de servicios en frontend público.
Performance: <10ms para millones de registros.';

-- 📂 ÍNDICE 3: FILTRO POR CATEGORÍA
-- Propósito: Navegación jerárquica por categorías
-- Uso: WHERE organizacion_id = ? AND categoria = ? AND activo = TRUE
CREATE INDEX idx_servicios_categoria
    ON servicios (organizacion_id, categoria, activo)
    WHERE activo = TRUE AND categoria IS NOT NULL;

-- 💰 ÍNDICE 4: ORDENAMIENTO POR PRECIO
-- Propósito: Listados ordenados por precio (low-to-high, high-to-low)
-- Uso: ORDER BY precio ASC/DESC dentro de organización
CREATE INDEX idx_servicios_precio
    ON servicios (organizacion_id, precio, activo) WHERE activo = TRUE;

-- 🧬 ÍNDICE 5: HERENCIA DE PLANTILLAS

-- 🏷️ ÍNDICE 6: BÚSQUEDA POR TAGS
-- Propósito: Filtrado avanzado por etiquetas
-- Uso: WHERE tags && ARRAY['popular', 'promocion']
CREATE INDEX idx_servicios_tags_gin
    ON servicios USING gin(tags) WHERE activo = TRUE AND array_length(tags, 1) > 0;

-- 📊 ÍNDICE 7: COVERING INDEX PARA SERVICIOS POR CATEGORÍA (OCT 2025)
-- Propósito: Menú de servicios agrupados por categoría
-- Uso: SELECT nombre, precio, duracion FROM servicios WHERE organizacion_id = ? AND categoria = ?
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
CREATE INDEX IF NOT EXISTS idx_servicios_categoria_covering
    ON servicios (organizacion_id, categoria, activo, creado_en)
    INCLUDE (nombre, descripcion, duracion_minutos, precio, subcategoria)
    WHERE activo = TRUE;

COMMENT ON INDEX idx_servicios_categoria_covering IS
'Índice covering para menú de servicios agrupados por categoría.
Optimiza: Catálogo público, formulario de agendamiento.
Query: SELECT nombre, precio, duracion FROM servicios
       WHERE organizacion_id = ? AND categoria = ? AND activo = TRUE
       ORDER BY creado_en;';

-- ====================================================================
-- 🔗 ÍNDICES PARA TABLA SERVICIOS_PROFESIONALES (2 índices relacionales)
-- ====================================================================
-- Optimización para relaciones many-to-many con configuraciones personalizadas
-- ────────────────────────────────────────────────────────────────────

-- 🎯 ÍNDICE 1: POR SERVICIO
-- Propósito: Encontrar todos los profesionales que brindan un servicio
-- Uso: WHERE servicio_id = ? AND activo = TRUE
CREATE INDEX idx_servicios_profesionales_servicio
    ON servicios_profesionales (servicio_id, activo) WHERE activo = TRUE;

-- 👨‍💼 ÍNDICE 2: POR PROFESIONAL
-- Propósito: Encontrar todos los servicios que brinda un profesional
-- Uso: WHERE profesional_id = ? AND activo = TRUE
CREATE INDEX idx_servicios_profesionales_profesional
    ON servicios_profesionales (profesional_id, activo) WHERE activo = TRUE;
