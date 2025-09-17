#!/bin/bash
set -e;

echo "🚀 Inicializando ecosistema completo de bases de datos..."

# Crear bases de datos, usuarios y configurar permisos
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

-- =====================================================================
-- CREAR USUARIOS ESPECÍFICOS POR APLICACIÓN
-- =====================================================================

echo "👤 Creando usuarios específicos por aplicación..."

-- Usuario para la aplicación SaaS principal
CREATE ROLE saas_app WITH LOGIN PASSWORD 'saas_secure_2025';
ALTER ROLE saas_app SET search_path TO public;

-- Usuario para n8n
CREATE ROLE n8n_app WITH LOGIN PASSWORD 'n8n_secure_2025';
ALTER ROLE n8n_app SET search_path TO public;

-- Usuario para Evolution API
CREATE ROLE evolution_app WITH LOGIN PASSWORD 'evolution_secure_2025';
ALTER ROLE evolution_app SET search_path TO public;

-- Usuario para Chat Memories (AI Agent)
CREATE ROLE chat_app WITH LOGIN PASSWORD 'chat_secure_2025';
ALTER ROLE chat_app SET search_path TO public;

-- Usuario de solo lectura para reportes y analytics
CREATE ROLE readonly_user WITH LOGIN PASSWORD 'readonly_2025';
ALTER ROLE readonly_user SET search_path TO public;

-- Usuario para integraciones entre sistemas
CREATE ROLE integration_user WITH LOGIN PASSWORD 'integration_2025';
ALTER ROLE integration_user SET search_path TO public;

-- =====================================================================
-- CREAR BASES DE DATOS ESPECÍFICAS
-- =====================================================================

echo "🗄️ Creando bases de datos específicas..."

-- Base de datos principal SaaS (ya existe como \$POSTGRES_DB)
-- Aquí se aplicará el schema desde diseno_base_datos_saas.sql

-- Base de datos para n8n workflows
CREATE DATABASE n8n_db OWNER n8n_app;

-- Base de datos para Evolution API (WhatsApp)
CREATE DATABASE evolution_db OWNER evolution_app;

-- Base de datos para Chat Memories (AI Agent)
CREATE DATABASE chat_memories_db OWNER chat_app;

-- =====================================================================
-- CONFIGURAR EXTENSIONES POR BASE DE DATOS
-- =====================================================================

echo "🔧 Configurando extensiones..."

-- Extensiones para n8n_db
\c n8n_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para búsquedas fuzzy
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- Para índices optimizados

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
\c \${POSTGRES_DB};
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================================
-- CONFIGURAR PERMISOS ESPECÍFICOS
-- =====================================================================

echo "🔐 Configurando permisos de seguridad..."

-- Permisos para la base SaaS principal
\c \${POSTGRES_DB};
GRANT CONNECT ON DATABASE \${POSTGRES_DB} TO saas_app;
GRANT USAGE ON SCHEMA public TO saas_app;
GRANT CREATE ON SCHEMA public TO saas_app;
-- Los permisos específicos de tablas se otorgarán cuando se ejecute el schema

-- Permisos para n8n_db
\c n8n_db;
GRANT ALL PRIVILEGES ON DATABASE n8n_db TO n8n_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO n8n_app;
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
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO evolution_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO evolution_app;

-- Configurar permisos por defecto para evolution_db
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO evolution_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO evolution_app;

-- Permisos para chat_memories_db
\c chat_memories_db;
GRANT ALL PRIVILEGES ON DATABASE chat_memories_db TO chat_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO chat_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chat_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chat_app;

-- Configurar permisos por defecto para chat_memories_db
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO chat_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO chat_app;

-- =====================================================================
-- PERMISOS PARA USUARIO DE SOLO LECTURA
-- =====================================================================

echo "📊 Configurando usuario de solo lectura para analytics..."

-- Acceso de solo lectura a todas las bases de datos
GRANT CONNECT ON DATABASE \${POSTGRES_DB} TO readonly_user;
GRANT CONNECT ON DATABASE n8n_db TO readonly_user;
GRANT CONNECT ON DATABASE evolution_db TO readonly_user;
GRANT CONNECT ON DATABASE chat_memories_db TO readonly_user;

-- Permisos de solo lectura en la base SaaS principal
\c \${POSTGRES_DB};
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

echo "🔗 Configurando usuario de integración cross-database..."

-- El usuario de integración puede leer de todas las bases
GRANT CONNECT ON DATABASE \${POSTGRES_DB} TO integration_user;
GRANT CONNECT ON DATABASE n8n_db TO integration_user;
GRANT CONNECT ON DATABASE evolution_db TO integration_user;
GRANT CONNECT ON DATABASE chat_memories_db TO integration_user;

-- Permisos específicos por base para integraciones
\c \${POSTGRES_DB};
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

echo "⚙️ Creando tabla de configuración de conexiones..."

\c \${POSTGRES_DB};
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
('saas_app', '\${POSTGRES_DB}', 'saas_app', 'Base de datos principal del sistema SaaS'),
('n8n', 'n8n_db', 'n8n_app', 'Base de datos para workflows n8n'),
('evolution_api', 'evolution_db', 'evolution_app', 'Base de datos para Evolution API y WhatsApp'),
('chat_memories', 'chat_memories_db', 'chat_app', 'Base de datos para historiales de chat AI'),
('analytics', '\${POSTGRES_DB}', 'readonly_user', 'Usuario de solo lectura para reportes'),
('integration', '\${POSTGRES_DB}', 'integration_user', 'Usuario para integraciones cross-database');

-- Otorgar permisos a la tabla de configuración
GRANT SELECT ON db_connections_config TO saas_app, readonly_user, integration_user;

-- Volver a la base por defecto
\c postgres;

EOSQL

echo "✅ Configuración de bases de datos completada exitosamente:"
echo ""
echo "📊 BASES DE DATOS CREADAS:"
echo "  ├── \${POSTGRES_DB} (SaaS principal)"
echo "  ├── n8n_db (workflows n8n)"
echo "  ├── evolution_db (WhatsApp/Evolution API)"
echo "  └── chat_memories_db (AI Agent histories)"
echo ""
echo "👤 USUARIOS CREADOS:"
echo "  ├── saas_app (aplicación SaaS principal)"
echo "  ├── n8n_app (n8n workflows)"
echo "  ├── evolution_app (Evolution API)"
echo "  ├── chat_app (Chat memories AI)"
echo "  ├── readonly_user (solo lectura - analytics)"
echo "  └── integration_user (integraciones cross-DB)"
echo ""
echo "🔐 SEGURIDAD:"
echo "  ├── Cada aplicación tiene su propio usuario"
echo "  ├── Permisos mínimos necesarios por servicio"
echo "  ├── Usuario de solo lectura para reportes"
echo "  └── Usuario de integración con permisos específicos"
echo ""
echo "⚙️ CONFIGURACIÓN:"
echo "  └── Tabla 'db_connections_config' creada con configuraciones de conexión"