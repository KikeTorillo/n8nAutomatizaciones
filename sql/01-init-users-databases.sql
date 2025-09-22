-- =====================================================================
-- INICIALIZACIÓN DE USUARIOS Y BASES DE DATOS
-- Archivo: 01-init-users-databases.sql
-- Descripción: Crea usuarios específicos, bases de datos y configura permisos
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
-- CREAR BASES DE DATOS ESPECÍFICAS
-- =====================================================================

-- Base de datos principal SaaS (ya existe como $POSTGRES_DB)
-- Aquí se aplicará el schema desde diseno_base_datos_saas.sql

-- Base de datos para n8n workflows
CREATE DATABASE n8n_db OWNER n8n_app;

-- Base de datos para Evolution API (WhatsApp)
CREATE DATABASE evolution_db OWNER evolution_app;

-- Base de datos para Chat Memories (AI Agent) - manejada por n8n_app
CREATE DATABASE chat_memories_db OWNER n8n_app;

-- =====================================================================
-- CONFIGURAR EXTENSIONES POR BASE DE DATOS
-- =====================================================================

-- Extensiones para n8n_db
\c n8n_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para búsquedas fuzzy
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- Para índices optimizados
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Para exclusion constraints

-- Extensiones para evolution_db
\c evolution_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Extensiones para chat_memories_db
\c chat_memories_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- CREATE EXTENSION IF NOT EXISTS "vector"; -- Descomenta si usas embeddings AI

-- Extensiones para la base principal SaaS
\c ${POSTGRES_DB};
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Para exclusion constraints

-- =====================================================================
-- CONFIGURAR PERMISOS ESPECÍFICOS
-- =====================================================================

-- Permisos para la base SaaS principal
\c ${POSTGRES_DB};
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO saas_app;
GRANT USAGE ON SCHEMA public TO saas_app;
GRANT CREATE ON SCHEMA public TO saas_app;
-- Los permisos específicos de tablas se otorgarán cuando se ejecute el schema

-- Permisos para n8n_db
\c n8n_db;
GRANT ALL PRIVILEGES ON DATABASE n8n_db TO n8n_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO n8n_app;
GRANT CREATE ON SCHEMA public TO n8n_app;
GRANT USAGE ON SCHEMA public TO n8n_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n8n_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n8n_app;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO n8n_app;

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
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO evolution_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO evolution_app;

-- Configurar permisos por defecto para evolution_db
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO evolution_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO evolution_app;

-- Permisos para chat_memories_db (manejada por n8n_app)
\c chat_memories_db;
-- n8n_app ya es el owner, así que tiene todos los permisos automáticamente
GRANT ALL PRIVILEGES ON DATABASE chat_memories_db TO n8n_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO n8n_app;
GRANT CREATE ON SCHEMA public TO n8n_app;
GRANT USAGE ON SCHEMA public TO n8n_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n8n_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO n8n_app;

-- Configurar permisos por defecto para chat_memories_db
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO n8n_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO n8n_app;

-- =====================================================================
-- PERMISOS PARA USUARIO DE SOLO LECTURA
-- =====================================================================

-- Acceso de solo lectura a todas las bases de datos
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO readonly_user;
GRANT CONNECT ON DATABASE n8n_db TO readonly_user;
GRANT CONNECT ON DATABASE evolution_db TO readonly_user;
GRANT CONNECT ON DATABASE chat_memories_db TO readonly_user;

-- Permisos de solo lectura en la base SaaS principal
\c ${POSTGRES_DB};
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- Permisos de solo lectura en n8n_db
\c n8n_db;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- Permisos de solo lectura en evolution_db
\c evolution_db;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- Permisos de solo lectura en chat_memories_db
\c chat_memories_db;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- =====================================================================
-- PERMISOS PARA USUARIO DE INTEGRACIÓN
-- =====================================================================

-- El usuario de integración puede leer de todas las bases
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO integration_user;
GRANT CONNECT ON DATABASE n8n_db TO integration_user;
GRANT CONNECT ON DATABASE evolution_db TO integration_user;
GRANT CONNECT ON DATABASE chat_memories_db TO integration_user;

-- Permisos específicos por base para integraciones
\c ${POSTGRES_DB};
GRANT USAGE ON SCHEMA public TO integration_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO integration_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO integration_user;

\c n8n_db;
GRANT USAGE ON SCHEMA public TO integration_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO integration_user;

\c evolution_db;
GRANT USAGE ON SCHEMA public TO integration_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO integration_user;

-- =====================================================================
-- CREAR TABLA DE CONFIGURACIÓN DE CONEXIONES
-- =====================================================================

\c ${POSTGRES_DB};
CREATE TABLE IF NOT EXISTS db_connections_config (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) UNIQUE NOT NULL,
    database_name VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL,
    host VARCHAR(100) DEFAULT 'postgres',
    port INTEGER DEFAULT 5432,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuraciones de conexión
INSERT INTO db_connections_config (service_name, database_name, username, description) VALUES
('saas_app', '${POSTGRES_DB}', 'saas_app', 'Base de datos principal del sistema SaaS'),
('n8n', 'n8n_db', 'n8n_app', 'Base de datos para workflows n8n'),
('evolution_api', 'evolution_db', 'evolution_app', 'Base de datos para Evolution API y WhatsApp'),
('chat_memories', 'chat_memories_db', 'n8n_app', 'Base de datos para historiales de chat AI - manejada por n8n_app'),
('analytics', '${POSTGRES_DB}', 'readonly_user', 'Usuario de solo lectura para reportes'),
('integration', '${POSTGRES_DB}', 'integration_user', 'Usuario para integraciones cross-database');

-- Otorgar permisos a la tabla de configuración
GRANT SELECT ON db_connections_config TO saas_app, readonly_user, integration_user;