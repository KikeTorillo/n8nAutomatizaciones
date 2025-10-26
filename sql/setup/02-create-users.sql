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

-- Permisos para chat_memories_db (manejada por n8n_app)
\c chat_memories_db;
GRANT ALL PRIVILEGES ON DATABASE chat_memories_db TO n8n_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO n8n_app;
GRANT CREATE ON SCHEMA public TO n8n_app;

-- =====================================================================
-- CONFIGURACIÓN DE SEGURIDAD Y PERFORMANCE
-- =====================================================================

-- Connection Limits (prevenir agotamiento de pool de conexiones)
ALTER ROLE saas_app CONNECTION LIMIT 100;
ALTER ROLE n8n_app CONNECTION LIMIT 50;
ALTER ROLE readonly_user CONNECTION LIMIT 20;
ALTER ROLE integration_user CONNECTION LIMIT 10;

-- Statement Timeouts (timeout de queries individuales)
ALTER ROLE saas_app SET statement_timeout = '30s';
ALTER ROLE n8n_app SET statement_timeout = '60s';
ALTER ROLE readonly_user SET statement_timeout = '60s';
ALTER ROLE integration_user SET statement_timeout = '45s';

-- Idle Transaction Timeouts (evitar transacciones colgadas)
ALTER ROLE saas_app SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE n8n_app SET idle_in_transaction_session_timeout = '120s';
ALTER ROLE readonly_user SET idle_in_transaction_session_timeout = '120s';
ALTER ROLE integration_user SET idle_in_transaction_session_timeout = '90s';

-- Logging de Queries Lentas (detectar problemas de performance)
ALTER ROLE saas_app SET log_min_duration_statement = '1000';  -- Log queries > 1s
ALTER ROLE n8n_app SET log_min_duration_statement = '2000';   -- Log queries > 2s
ALTER ROLE readonly_user SET log_min_duration_statement = '5000';  -- Reportes pueden ser lentos
ALTER ROLE integration_user SET log_min_duration_statement = '2000';

-- Configuración específica de roles
ALTER ROLE readonly_user SET transaction_read_only = on;

-- =====================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================================

COMMENT ON ROLE saas_app IS 'Usuario principal de la aplicación SaaS con permisos completos';
COMMENT ON ROLE n8n_app IS 'Usuario para workflows de n8n y automatizaciones';
COMMENT ON ROLE readonly_user IS 'Usuario de solo lectura para reportes y analytics';
COMMENT ON ROLE integration_user IS 'Usuario para integraciones entre sistemas';