#!/bin/bash
set -e;

echo "Creando bases de datos para n8n, Evolution API y Chat Memories..."

# Crear bases de datos necesarias
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE n8n_db;
  CREATE DATABASE evolution_db;
  CREATE DATABASE chat_memories_db;
  
  -- Crear extensiones necesarias
  \c n8n_db;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  \c evolution_db;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  \c chat_memories_db;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  -- n8n creará automáticamente la tabla n8n_chat_histories cuando sea necesaria
  
  -- Volver a la base por defecto
  \c postgres;
EOSQL

echo "Bases de datos creadas exitosamente:"
echo "- n8n_db (para n8n workflows y configuraciones)"
echo "- evolution_db (para Evolution API y WhatsApp data)"
echo "- chat_memories_db (para chat histories del AI Agent)"