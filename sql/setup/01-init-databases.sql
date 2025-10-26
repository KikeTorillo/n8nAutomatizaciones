-- =====================================================================
-- INICIALIZACIÓN DE BASES DE DATOS
-- Archivo: setup/01-init-databases.sql
-- Descripción: Crea bases de datos específicas y configura extensiones
-- =====================================================================

-- =====================================================================
-- CREAR BASES DE DATOS ESPECÍFICAS
-- =====================================================================

-- Base de datos principal SaaS (ya existe como $POSTGRES_DB)
-- Aquí se aplicará el schema desde schema/

-- Base de datos para n8n workflows
CREATE DATABASE n8n_db;

-- Base de datos para Chat Memories (AI Agent)
CREATE DATABASE chat_memories_db;

-- =====================================================================
-- CONFIGURAR EXTENSIONES POR BASE DE DATOS
-- =====================================================================

-- Extensiones para n8n_db
\c n8n_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para búsquedas fuzzy
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- Para índices optimizados
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Para exclusion constraints

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
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================================

COMMENT ON DATABASE n8n_db IS 'Base de datos para workflows y automatizaciones de n8n';
COMMENT ON DATABASE chat_memories_db IS 'Base de datos para memorias del agente AI';