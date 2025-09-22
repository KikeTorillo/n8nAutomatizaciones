-- =====================================================================
-- CONFIGURACIÓN DE PERMISOS ESPECÍFICOS PARA APLICACIÓN SAAS
-- Archivo: setup/03-grant-permissions.sql
-- Descripción: Configura permisos específicos después de crear el schema
-- ORDEN: Ejecutar después de aplicar el schema completo
-- =====================================================================

-- Conectar a la base de datos SaaS principal
\c ${POSTGRES_DB};

-- =====================================================================
-- PERMISOS ESPECÍFICOS PARA saas_app
-- =====================================================================

-- Permisos en todas las tablas principales
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO saas_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO saas_app;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO saas_app;

-- Permisos por defecto para nuevos objetos
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO saas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO saas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO saas_app;

-- =====================================================================
-- ACTUALIZAR PERMISOS PARA USUARIOS EXISTENTES
-- =====================================================================

-- Actualizar permisos de solo lectura para nuevas tablas
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- Actualizar permisos de integración para nuevas tablas
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO integration_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO integration_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO integration_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO integration_user;

-- =====================================================================
-- CONFIGURACIÓN ESPECÍFICA PARA RLS (ROW LEVEL SECURITY)
-- =====================================================================

-- El RLS ya está configurado en el esquema principal
-- Aquí podemos agregar configuraciones adicionales si es necesario

-- =====================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================================

COMMENT ON SCHEMA public IS 'Esquema principal de la aplicación SaaS multi-tenant';
COMMENT ON ROLE saas_app IS 'Usuario principal de la aplicación SaaS con permisos completos';
COMMENT ON ROLE readonly_user IS 'Usuario de solo lectura para analytics y reportes';
COMMENT ON ROLE integration_user IS 'Usuario para integraciones cross-database con permisos limitados';