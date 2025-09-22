-- =====================================================================
-- CREACIÓN DE USUARIOS Y ROLES
-- Archivo: setup/02-create-users.sql
-- Descripción: Crea usuarios específicos por aplicación con configuración
-- =====================================================================

-- =====================================================================
-- CREAR USUARIOS ESPECÍFICOS POR APLICACIÓN
-- =====================================================================

-- Usuario para la aplicación SaaS principal
CREATE ROLE saas_app WITH LOGIN PASSWORD '${SAAS_APP_PASSWORD}';
ALTER ROLE saas_app SET search_path TO public;

-- Usuario para n8n
CREATE ROLE n8n_app WITH LOGIN PASSWORD '${N8N_APP_PASSWORD}';
ALTER ROLE n8n_app SET search_path TO public;

-- Usuario para Evolution API
CREATE ROLE evolution_app WITH LOGIN PASSWORD '${EVOLUTION_APP_PASSWORD}';
ALTER ROLE evolution_app SET search_path TO public;

-- Usuario de solo lectura para reportes y analytics
CREATE ROLE readonly_user WITH LOGIN PASSWORD '${READONLY_USER_PASSWORD}';
ALTER ROLE readonly_user SET search_path TO public;

-- Usuario para integraciones entre sistemas
CREATE ROLE integration_user WITH LOGIN PASSWORD '${INTEGRATION_USER_PASSWORD}';
ALTER ROLE integration_user SET search_path TO public;

-- =====================================================================
-- ASIGNAR OWNERSHIP DE BASES DE DATOS
-- =====================================================================

-- Asignar ownership de las bases de datos a sus usuarios correspondientes
ALTER DATABASE n8n_db OWNER TO n8n_app;
ALTER DATABASE evolution_db OWNER TO evolution_app;
ALTER DATABASE chat_memories_db OWNER TO n8n_app;

-- =====================================================================
-- CONFIGURAR PERMISOS BÁSICOS DE CONEXIÓN
-- =====================================================================

-- Permisos para la base SaaS principal
\c ${POSTGRES_DB};
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO saas_app;
GRANT USAGE ON SCHEMA public TO saas_app;
GRANT CREATE ON SCHEMA public TO saas_app;

-- Permisos de conexión para usuarios de solo lectura e integración
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO integration_user;
GRANT USAGE ON SCHEMA public TO integration_user;

-- Permisos para n8n_db
\c n8n_db;
GRANT ALL PRIVILEGES ON DATABASE n8n_db TO n8n_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO n8n_app;
GRANT CREATE ON SCHEMA public TO n8n_app;
GRANT USAGE ON SCHEMA public TO n8n_app;

-- Configurar permisos por defecto para nuevos objetos en n8n_db
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO n8n_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO n8n_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO n8n_app;

-- Permisos para evolution_db
\c evolution_db;
GRANT ALL PRIVILEGES ON DATABASE evolution_db TO evolution_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO evolution_app;
GRANT CREATE ON SCHEMA public TO evolution_app;
GRANT USAGE ON SCHEMA public TO evolution_app;

-- Configurar permisos por defecto para evolution_db
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO evolution_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO evolution_app;

-- Permisos para chat_memories_db (manejada por n8n_app)
\c chat_memories_db;
GRANT ALL PRIVILEGES ON DATABASE chat_memories_db TO n8n_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO n8n_app;
GRANT CREATE ON SCHEMA public TO n8n_app;

-- =====================================================================
-- CONFIGURACIÓN DE SEGURIDAD
-- =====================================================================

-- Configurar timeouts y límites de conexión
ALTER ROLE saas_app SET statement_timeout = '30s';
ALTER ROLE n8n_app SET statement_timeout = '60s';
ALTER ROLE evolution_app SET statement_timeout = '30s';
ALTER ROLE readonly_user SET statement_timeout = '60s';
ALTER ROLE readonly_user SET transaction_read_only = on;
ALTER ROLE integration_user SET statement_timeout = '45s';

-- =====================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================================

COMMENT ON ROLE saas_app IS 'Usuario principal de la aplicación SaaS con permisos completos';
COMMENT ON ROLE n8n_app IS 'Usuario para workflows de n8n y automatizaciones';
COMMENT ON ROLE evolution_app IS 'Usuario para Evolution API (WhatsApp)';
COMMENT ON ROLE readonly_user IS 'Usuario de solo lectura para reportes y analytics';
COMMENT ON ROLE integration_user IS 'Usuario para integraciones entre sistemas';