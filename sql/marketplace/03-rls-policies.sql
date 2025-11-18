-- ====================================================================
-- MÓDULO MARKETPLACE: POLÍTICAS ROW LEVEL SECURITY
-- ====================================================================
-- Implementa aislamiento multi-tenant CON acceso público controlado.
--
-- CARACTERÍSTICAS ÚNICAS:
-- • Perfiles y reseñas: Lectura pública SIN autenticación
-- • Analytics: INSERT público, SELECT solo tenant
-- • Categorías: Lectura pública, gestión super_admin
-- • Gestión: Solo admin/propietario de su organización
--
-- TABLAS CON RLS (4):
-- • marketplace_perfiles - 2 políticas (pública + tenant)
-- • marketplace_reseñas - 3 políticas (pública + creación + gestión)
-- • marketplace_analytics - 2 políticas (insert público + select tenant)
-- • marketplace_categorias - 2 políticas (pública + super_admin)
--
-- SEGURIDAD:
-- • Validación regex de tenant_id (previene SQL injection)
-- • Acceso público limitado a registros activos/publicados
-- • Moderación de contenido por admin
--
-- Fecha creación: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ====================================================================

ALTER TABLE marketplace_perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_perfiles FORCE ROW LEVEL SECURITY;

ALTER TABLE marketplace_reseñas ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reseñas FORCE ROW LEVEL SECURITY;

ALTER TABLE marketplace_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_analytics FORCE ROW LEVEL SECURITY;

ALTER TABLE marketplace_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_categorias FORCE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICAS: marketplace_perfiles (2 políticas)
-- ====================================================================

-- POLÍTICA 1: LECTURA PÚBLICA (SIN AUTENTICACIÓN)
-- Permite que cualquier usuario vea perfiles activos y visibles
-- Usado por: Página pública del directorio, SEO crawlers
CREATE POLICY marketplace_perfiles_public_read
ON marketplace_perfiles
FOR SELECT
TO PUBLIC  -- ⚠️ Acceso público sin autenticación
USING (
    activo = true
    AND visible_en_directorio = true
);

-- POLÍTICA 2: GESTIÓN POR TENANT
-- Admin/propietario gestiona su perfil, super_admin puede acceder a todos
-- Usado por: Dashboard de admin, panel de configuración, endpoint activar (super_admin)
CREATE POLICY marketplace_perfiles_tenant_manage
ON marketplace_perfiles
FOR ALL
TO saas_app
USING (
    -- Super admin tiene acceso total
    current_setting('app.current_user_role', true) = 'super_admin'
    -- Bypass RLS para operaciones de sistema
    OR current_setting('app.bypass_rls', true) = 'true'
    -- Tenant isolation: Solo admin/propietario de su organización
    OR (
        -- Validación REGEX para prevenir SQL injection
        current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
        AND organizacion_id = COALESCE(
            NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER,
            0
        )
    )
);

-- ====================================================================
-- POLÍTICAS: marketplace_reseñas (3 políticas)
-- ====================================================================

-- POLÍTICA 1: LECTURA PÚBLICA (SIN AUTENTICACIÓN)
-- Permite que cualquier usuario vea reseñas publicadas
-- Usado por: Página pública de negocio, listados de reseñas
CREATE POLICY marketplace_reseñas_public_read
ON marketplace_reseñas
FOR SELECT
TO PUBLIC  -- ⚠️ Acceso público sin autenticación
USING (
    estado = 'publicada'
);

-- POLÍTICA 2: CREACIÓN POR CLIENTE
-- Cliente autenticado puede crear reseña en su organización
-- Usado por: POST /api/v1/marketplace/reseñas (requiere cita completada)
CREATE POLICY marketplace_reseñas_cliente_create
ON marketplace_reseñas
FOR INSERT
TO saas_app
WITH CHECK (
    -- Validación REGEX para prevenir SQL injection
    current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
    AND organizacion_id = COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER,
        0
    )
);

-- POLÍTICA 3: GESTIÓN POR ADMIN
-- Admin gestiona reseñas de su org, super_admin puede acceder a todas
-- Usado por: Dashboard de admin, panel de moderación
CREATE POLICY marketplace_reseñas_admin_manage
ON marketplace_reseñas
FOR ALL
TO saas_app
USING (
    -- Super admin tiene acceso total
    current_setting('app.current_user_role', true) = 'super_admin'
    -- Bypass RLS para operaciones de sistema
    OR current_setting('app.bypass_rls', true) = 'true'
    -- Tenant isolation: Solo admin de su organización
    OR (
        -- Validación REGEX para prevenir SQL injection
        current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
        AND organizacion_id = COALESCE(
            NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER,
            0
        )
    )
);

-- ====================================================================
-- POLÍTICAS: marketplace_analytics (2 políticas)
-- ====================================================================

-- POLÍTICA 1: SELECT SOLO PARA TENANT
-- Solo la organización puede ver sus propias estadísticas
-- Usado por: GET /api/v1/marketplace/analytics/dashboard
CREATE POLICY marketplace_analytics_tenant_read
ON marketplace_analytics
FOR SELECT
TO saas_app
USING (
    -- Validación REGEX para prevenir SQL injection
    current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
    AND organizacion_id = COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER,
        0
    )
);

-- POLÍTICA 2: INSERT PÚBLICO (TRACKING ANÓNIMO)
-- Cualquiera puede insertar eventos de analytics
-- Usado por: POST /api/v1/marketplace/analytics/evento (sin auth)
-- NOTA: IP hasheada en backend, GDPR-compliant
CREATE POLICY marketplace_analytics_public_insert
ON marketplace_analytics
FOR INSERT
TO PUBLIC  -- ⚠️ Acceso público sin autenticación
WITH CHECK (true);  -- Cualquiera puede insertar eventos

-- ====================================================================
-- POLÍTICAS: marketplace_categorias (2 políticas)
-- ====================================================================

-- POLÍTICA 1: LECTURA PÚBLICA (SIN AUTENTICACIÓN)
-- Permite que cualquier usuario vea categorías activas
-- Usado por: Directorio público, filtros de búsqueda
CREATE POLICY marketplace_categorias_public_read
ON marketplace_categorias
FOR SELECT
TO PUBLIC  -- ⚠️ Acceso público sin autenticación
USING (
    activo = true
);

-- POLÍTICA 2: GESTIÓN POR SUPER_ADMIN
-- Solo super_admin puede crear/modificar categorías + bypass para sistema
-- Usado por: Panel de administración global, operaciones de sistema
CREATE POLICY marketplace_categorias_superadmin_manage
ON marketplace_categorias
FOR ALL
TO saas_app
USING (
    current_setting('app.current_user_role', true) = 'super_admin'
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

-- Política de perfiles (pública)
COMMENT ON POLICY marketplace_perfiles_public_read ON marketplace_perfiles IS
'Acceso público SIN autenticación para perfiles activos y visibles.
Permite: SEO crawlers, usuarios anónimos, motores de búsqueda.
Usado por: Directorio público, páginas de negocio.
Seguridad: Solo registros con activo=TRUE y visible_en_directorio=TRUE.';

-- Política de perfiles (tenant)
COMMENT ON POLICY marketplace_perfiles_tenant_manage ON marketplace_perfiles IS
'Gestión de perfil por admin/propietario + super_admin + bypass RLS.
Validación REGEX en tenant_id previene SQL injection.
Permite: Admin/propietario → Crear/editar perfil propio.
        Super_admin → Activar/desactivar cualquier perfil.
        Bypass RLS → Operaciones de sistema (triggers).
Usado por: Panel de configuración, endpoint PATCH /activar, operaciones de sistema.';

-- Política de reseñas (pública)
COMMENT ON POLICY marketplace_reseñas_public_read ON marketplace_reseñas IS
'Acceso público SIN autenticación para reseñas publicadas.
Solo muestra reseñas con estado=publicada (no pendientes/reportadas).
Usado por: Página pública de negocio, listados de reseñas.
Moderación: Admin puede ocultar reseñas cambiando estado.';

-- Política de reseñas (creación)
COMMENT ON POLICY marketplace_reseñas_cliente_create ON marketplace_reseñas IS
'Cliente autenticado puede crear reseña en su organización.
Validación de cita completada se hace en backend.
Una sola reseña por cita (constraint UNIQUE).
Usado por: POST /api/v1/marketplace/reseñas.';

-- Política de reseñas (gestión)
COMMENT ON POLICY marketplace_reseñas_admin_manage ON marketplace_reseñas IS
'Admin gestiona reseñas + super_admin + bypass RLS.
Permite: Admin → Ver todas las reseñas de su org, responder, moderar.
        Super_admin → Acceso a todas las reseñas.
        Bypass RLS → Operaciones de sistema.
Usado por: Dashboard de admin, panel de moderación.
Estados: publicada, pendiente, reportada, oculta.';

-- Política de analytics (select)
COMMENT ON POLICY marketplace_analytics_tenant_read ON marketplace_analytics IS
'Solo la organización ve sus propias estadísticas.
Aislamiento multi-tenant estricto en analytics.
Usado por: Dashboard de analytics, reportes.
Datos: vistas, clics, fuentes de tráfico.';

-- Política de analytics (insert público)
COMMENT ON POLICY marketplace_analytics_public_insert ON marketplace_analytics IS
'INSERT público para tracking anónimo de eventos.
GDPR-compliant: IP hasheada en backend, no almacena IPs reales.
Usado por: POST /api/v1/marketplace/analytics/evento (sin auth).
Eventos: vista_perfil, clic_agendar, clic_telefono, etc.';

-- Política de categorías (pública)
COMMENT ON POLICY marketplace_categorias_public_read ON marketplace_categorias IS
'Acceso público SIN autenticación para categorías activas.
Usado por: Directorio público, filtros, navegación.
Datos: 10 categorías base + custom.';

-- Política de categorías (super_admin)
COMMENT ON POLICY marketplace_categorias_superadmin_manage ON marketplace_categorias IS
'Solo super_admin gestiona catálogo global + bypass RLS.
Previene que admins de organizaciones modifiquen categorías globales.
Permite: Super_admin → Gestionar catálogo global.
        Bypass RLS → Operaciones de sistema (seeds, triggers).
Usado por: Panel de administración global, scripts de inicialización.';
