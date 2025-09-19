#!/bin/bash
set -e;

echo "🚀 Inicializando ecosistema completo de bases de datos..."

# Definir directorio de scripts SQL
SQL_DIR="/docker-entrypoint-initdb.d/sql"

# =====================================================================
# EJECUTAR SCRIPTS SQL EN ORDEN
# =====================================================================

echo "📄 Ejecutando scripts SQL de inicialización..."

# 1. Crear usuarios y bases de datos
echo "  1️⃣ Creando usuarios y bases de datos..."
# Usar expansión de variables bash - el enfoque más confiable
eval "cat <<EOF
$(cat $SQL_DIR/01-init-users-databases.sql)
EOF" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"

# 2. Aplicar esquema SaaS principal
echo "  2️⃣ Aplicando esquema SaaS principal..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/02-saas-schema.sql"

# 3. Insertar plantillas de servicios
echo "  3️⃣ Insertando plantillas de servicios por industria..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/03-plantillas-servicios.sql"

# 4. Configurar permisos específicos del SaaS (después de crear tablas)
echo "  4️⃣ Configurando permisos finales en tablas..."
eval "cat <<EOF
$(cat $SQL_DIR/04-permisos-saas.sql)
EOF" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"

# =====================================================================
# VALIDACIÓN POST-INSTALACIÓN
# =====================================================================

echo "🔍 Validando instalación..."

# Verificar que las bases de datos fueron creadas
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    SELECT
        datname as "Base de Datos",
        pg_size_pretty(pg_database_size(datname)) as "Tamaño"
    FROM pg_database
    WHERE datname IN ('${POSTGRES_DB}', 'n8n_db', 'evolution_db', 'chat_memories_db')
    ORDER BY datname;
EOSQL

# Verificar que los usuarios fueron creados
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    SELECT
        rolname as "Usuario",
        rolcanlogin as "Puede Login",
        rolsuper as "Superusuario"
    FROM pg_roles
    WHERE rolname IN ('saas_app', 'n8n_app', 'evolution_app', 'readonly_user', 'integration_user')
    ORDER BY rolname;
EOSQL

# Verificar que las tablas principales fueron creadas en la base SaaS
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT
        schemaname as "Esquema",
        tablename as "Tabla",
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Tamaño"
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('organizaciones', 'clientes', 'profesionales', 'servicios', 'citas', 'franjas_horarias')
    ORDER BY tablename;
EOSQL

# Verificar cantidad de plantillas de servicios insertadas
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT
        tipo_industria,
        COUNT(*) as "Servicios Template"
    FROM plantillas_servicios
    GROUP BY tipo_industria
    ORDER BY tipo_industria;
EOSQL

echo ""
echo "✅ Configuración de bases de datos completada exitosamente:"
echo ""
echo "📊 BASES DE DATOS CREADAS:"
echo "  ├── ${POSTGRES_DB} (SaaS principal)"
echo "  ├── n8n_db (workflows n8n)"
echo "  ├── evolution_db (WhatsApp/Evolution API)"
echo "  └── chat_memories_db (AI Agent histories)"
echo ""
echo "👤 USUARIOS CREADOS:"
echo "  ├── saas_app (aplicación SaaS principal)"
echo "  ├── n8n_app (n8n workflows)"
echo "  ├── evolution_app (Evolution API)"
echo "  ├── readonly_user (solo lectura - analytics)"
echo "  └── integration_user (integraciones cross-DB)"
echo ""
echo "🗄️ ESQUEMA SAAS:"
echo "  ├── 8+ tablas principales creadas"
echo "  ├── Índices optimizados aplicados"
echo "  ├── Row Level Security (RLS) habilitado"
echo "  ├── Triggers de auditoría configurados"
echo "  └── Plantillas de servicios cargadas"
echo ""
echo "🔐 SEGURIDAD:"
echo "  ├── Cada aplicación tiene su propio usuario"
echo "  ├── Permisos mínimos necesarios por servicio"
echo "  ├── Usuario de solo lectura para reportes"
echo "  ├── RLS configurado para multi-tenancy"
echo "  └── Usuario de integración con permisos específicos"
echo ""
echo "⚙️ CONFIGURACIÓN:"
echo "  └── Tabla 'db_connections_config' creada con configuraciones de conexión"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "  ├── El backend Node.js puede conectarse con las credenciales configuradas"
echo "  ├── Las APIs están listas para crear organizaciones y datos"
echo "  └── Los modelos de datos pueden ser probados"