-- ====================================================================
-- MÓDULO WEBSITE: POLÍTICAS RLS (Row Level Security)
-- ====================================================================
-- Seguridad multi-tenant para el módulo website.
--
-- ESTRATEGIA:
-- • Lectura pública: Sitios publicados son accesibles sin auth
-- • Escritura privada: Solo la organización dueña puede modificar
-- • Super admin: Bypass completo para soporte
--
-- POLÍTICAS (9):
-- • website_config: 3 políticas (public_read, org_all, superadmin)
-- • website_paginas: 3 políticas (public_read, org_all, superadmin)
-- • website_bloques: 3 políticas (public_read, org_all, superadmin)
--
-- Fecha creación: 6 Diciembre 2025
-- ====================================================================

-- ====================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ====================================================================

ALTER TABLE website_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_paginas ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_bloques ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICAS PARA website_config
-- ====================================================================

-- Lectura pública: Cualquiera puede ver sitios publicados
CREATE POLICY website_config_public_read ON website_config
    FOR SELECT
    USING (publicado = true);

-- CRUD completo para la organización dueña
CREATE POLICY website_config_org_all ON website_config
    FOR ALL
    USING (
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    )
    WITH CHECK (
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

-- Bypass para super_admin
CREATE POLICY website_config_superadmin ON website_config
    FOR ALL
    USING (
        current_setting('app.bypass_rls', true) = 'true'
    )
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- POLÍTICAS PARA website_paginas
-- ====================================================================

-- Lectura pública: Páginas publicadas de sitios publicados
CREATE POLICY website_paginas_public_read ON website_paginas
    FOR SELECT
    USING (
        publicada = true
        AND EXISTS (
            SELECT 1 FROM website_config wc
            WHERE wc.id = website_paginas.website_id
            AND wc.publicado = true
        )
    );

-- CRUD completo para la organización dueña
CREATE POLICY website_paginas_org_all ON website_paginas
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM website_config wc
            WHERE wc.id = website_paginas.website_id
            AND wc.organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM website_config wc
            WHERE wc.id = website_paginas.website_id
            AND wc.organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

-- Bypass para super_admin
CREATE POLICY website_paginas_superadmin ON website_paginas
    FOR ALL
    USING (
        current_setting('app.bypass_rls', true) = 'true'
    )
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- POLÍTICAS PARA website_bloques
-- ====================================================================

-- Lectura pública: Bloques visibles de páginas publicadas de sitios publicados
CREATE POLICY website_bloques_public_read ON website_bloques
    FOR SELECT
    USING (
        visible = true
        AND EXISTS (
            SELECT 1 FROM website_paginas wp
            JOIN website_config wc ON wc.id = wp.website_id
            WHERE wp.id = website_bloques.pagina_id
            AND wp.publicada = true
            AND wc.publicado = true
        )
    );

-- CRUD completo para la organización dueña
CREATE POLICY website_bloques_org_all ON website_bloques
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM website_paginas wp
            JOIN website_config wc ON wc.id = wp.website_id
            WHERE wp.id = website_bloques.pagina_id
            AND wc.organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM website_paginas wp
            JOIN website_config wc ON wc.id = wp.website_id
            WHERE wp.id = website_bloques.pagina_id
            AND wc.organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

-- Bypass para super_admin
CREATE POLICY website_bloques_superadmin ON website_bloques
    FOR ALL
    USING (
        current_setting('app.bypass_rls', true) = 'true'
    )
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- GRANTS: Permisos para usuarios de aplicación
-- ====================================================================

-- Usuario saas_app (backend principal)
GRANT SELECT, INSERT, UPDATE, DELETE ON website_config TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON website_paginas TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON website_bloques TO saas_app;

-- Usuario readonly (reportes)
GRANT SELECT ON website_config TO readonly_user;
GRANT SELECT ON website_paginas TO readonly_user;
GRANT SELECT ON website_bloques TO readonly_user;
