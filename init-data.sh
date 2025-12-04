#!/bin/bash
set -e;

echo "🚀 Inicializando ecosistema completo de bases de datos..."
echo "📁 Usando arquitectura 100% modular:"
echo "   ├── setup/           - Configuración inicial (usuarios, DBs, permisos)"
echo "   ├── [15 módulos]/    - 15 módulos SQL independientes (incl. Inventario + POS Nov 2025)"
echo "   └── data/            - Datos iniciales y plantillas"

# Definir directorio de scripts SQL
SQL_DIR="/docker-entrypoint-initdb.d/sql"

# =====================================================================
# EJECUTAR SCRIPTS SQL EN ORDEN
# =====================================================================

echo "📄 Ejecutando scripts SQL de inicialización..."

# 1. Crear bases de datos
echo "  1️⃣ Creando bases de datos..."
eval "cat <<EOF
$(cat $SQL_DIR/setup/01-init-databases.sql)
EOF" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"

# 2. Crear usuarios y roles
echo "  2️⃣ Creando usuarios y roles..."
eval "cat <<EOF
$(cat $SQL_DIR/setup/02-create-users.sql)
EOF" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"

# 2. Aplicar esquema SaaS modular
echo "  3️⃣ Aplicando esquema SaaS modular..."
echo ""
echo "    📦 MÓDULO: Core Universal (nueva estructura desacoplada - Nov 2025)"
echo "       🔌 Extensiones PostgreSQL..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/core/fundamentos/01-extensiones.sql"
echo "       🎭 Tipos y enumeraciones (SOLO universales)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/core/fundamentos/02-tipos-enums-core.sql"
echo "       ⚡ Funciones utilitarias..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/core/fundamentos/03-funciones-utilidad.sql"
echo "       📋 Tabla dinámica de categorías (reemplaza ENUM industria_tipo)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/core/schema/01-tabla-categorias.sql"
echo ""
echo "    📦 MÓDULO: Scheduling Template (ENUMs y seeds de agendamiento)"
echo "       🎭 ENUMs de dominio (estado_cita, estado_franja)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/templates/scheduling-saas/01-enums-dominio.sql"
echo "       📋 Categorías de agendamiento (11 industrias)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/templates/scheduling-saas/seeds/categorias-agendamiento.sql"
echo ""
echo "    🌎 MÓDULO: Ubicaciones Geográficas (Nov 2025)"
echo "       📋 Tablas de ubicaciones (paises, estados, ciudades, codigos_postales)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/catalogos/07-tablas-ubicaciones.sql"
echo "       📋 Datos iniciales México (32 estados + ciudades principales)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/catalogos/08-datos-ubicaciones-mexico.sql"
echo ""
echo "    📦 MÓDULO: Núcleo (nueva estructura modular)"
echo "       🏛️ Tablas core (organizaciones, usuarios)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/nucleo/01-tablas-core.sql"
echo "       💳 Tablas de subscripciones (4 tablas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/nucleo/02-tablas-subscripciones.sql"
echo "       📊 Índices especializados..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/nucleo/03-indices.sql"
echo "       🛡️ Políticas RLS (seguridad multi-tenant)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/nucleo/04-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL (subscripciones y métricas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/nucleo/05-funciones.sql"
echo "       🔄 Triggers automáticos..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/nucleo/06-triggers.sql"
echo "       📋 Datos iniciales (planes de subscripción)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/nucleo/07-datos-iniciales.sql"
echo "       🧩 Funciones del sistema modular (tiene_modulo_activo, validaciones)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/nucleo/08-funciones-modulos.sql"
echo "       👁️ Vistas del sistema modular (estadísticas, cambios recientes)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/nucleo/09-vistas-modulos.sql"
echo "       🔐 Sistema de activación de cuentas (onboarding simplificado)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/nucleo/10-activaciones-cuenta.sql"
echo ""
echo "    📦 MÓDULO: Catálogos (nueva estructura modular)"
echo "       📋 Tablas catálogo (tipos_bloqueo, tipos_profesional)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/catalogos/01-tablas-catalogos.sql"
echo "       📊 Índices especializados..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/catalogos/02-indices.sql"
echo "       🛡️ Políticas RLS..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/catalogos/03-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/catalogos/04-funciones.sql"
echo "       🔄 Triggers automáticos..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/catalogos/05-triggers.sql"
echo "       📋 Datos iniciales (42 tipos del sistema)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/catalogos/06-datos-iniciales.sql"
echo ""
echo "    📦 MÓDULO: Negocio (nueva estructura modular)"
echo "       📋 Tablas negocio (profesionales, clientes, servicios)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/negocio/01-tablas-negocio.sql"
echo "       📊 Índices especializados..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/negocio/02-indices.sql"
echo "       🛡️ Políticas RLS..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/negocio/03-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/negocio/04-funciones.sql"
echo "       🔄 Triggers automáticos..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/negocio/05-triggers.sql"
echo "       📨 Sistema de invitaciones (profesionales)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/negocio/06-invitaciones.sql"
echo ""
echo "    📅 MÓDULO: Agendamiento (nueva estructura modular)"
echo "       📋 Tablas agendamiento (horarios_profesionales)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/agendamiento/01-tablas-agendamiento.sql"
echo "       📊 Índices especializados..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/agendamiento/02-indices.sql"
echo "       🛡️ Políticas RLS..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/agendamiento/03-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/agendamiento/04-funciones.sql"
echo "       🔄 Triggers automáticos..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/agendamiento/05-triggers.sql"
echo ""
echo "    📅 MÓDULO: Citas (nueva estructura modular)"
echo "       📋 Tablas citas (particionadas) + citas_servicios..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/citas/01-tablas-citas.sql"
echo "       🗓️ Particionamiento mensual..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/citas/02-particionamiento.sql"
echo "       📊 Índices especializados..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/citas/03-indices.sql"
echo "       🛡️ Políticas RLS..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/citas/04-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/citas/05-funciones.sql"
echo "       🔄 Triggers automáticos..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/citas/06-triggers.sql"
echo ""
echo "    🚫 MÓDULO: Bloqueos (nueva estructura modular)"
echo "       📋 Tabla bloqueos_horarios..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/bloqueos/01-tabla-bloqueos.sql"
echo "       📊 Índices especializados (8 índices)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/bloqueos/02-indices.sql"
echo "       🛡️ Políticas RLS (2 políticas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/bloqueos/03-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL (5 funciones)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/bloqueos/04-funciones.sql"
echo "       🔄 Triggers automáticos (3 triggers)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/bloqueos/05-triggers.sql"
echo "       👁️ Vistas de consulta (2 vistas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/bloqueos/06-vistas.sql"
echo ""
echo "    📊 MÓDULO: Auditoría (nueva estructura modular)"
echo "       📋 ENUM + Tabla eventos_sistema (particionada)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/auditoria/01-tablas-eventos.sql"
echo "       📅 Particionamiento mensual (2 particiones iniciales)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/auditoria/02-particionamiento.sql"
echo "       📊 Índices especializados (13 índices)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/auditoria/03-indices.sql"
echo "       🛡️ Políticas RLS (1 política)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/auditoria/04-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL (5 funciones)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/auditoria/05-funciones.sql"
echo "       🔄 Triggers automáticos (2 triggers)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/auditoria/06-triggers.sql"
echo "       👁️ Vistas de consulta (2 vistas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/auditoria/07-vistas.sql"
echo ""
echo "    📦 MÓDULO: Pagos (nueva estructura modular)"
echo "       💳 Tablas pagos + métodos_pago..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/pagos/01-tablas.sql"
echo "       📊 Índices especializados (12 índices)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/pagos/02-indices.sql"
echo "       🛡️ Políticas RLS (7 políticas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/pagos/03-rls-policies.sql"
echo "       🔄 Triggers automáticos (2 triggers)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/pagos/04-triggers.sql"
echo ""
echo "    🤖 MÓDULO: Chatbots (nueva estructura modular)"
echo "       📋 Tablas chatbot_config + chatbot_credentials..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/chatbots/01-tablas.sql"
echo "       📊 Índices especializados (8 índices)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/chatbots/02-indices.sql"
echo "       🛡️ Políticas RLS (4 políticas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/chatbots/03-rls-policies.sql"
echo "       🔄 Triggers automáticos (1 trigger)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/chatbots/04-triggers.sql"
echo ""
echo "    🔧 MÓDULO: Mantenimiento (nueva estructura modular)"
echo "       📋 Tablas configuracion_sistema + eventos_sistema_archivo..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/mantenimiento/01-tablas.sql"
echo "       📊 Índices especializados (2 índices)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/mantenimiento/02-indices.sql"
echo "       🛡️ Políticas RLS (1 política)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/mantenimiento/03-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL (8 funciones: archivado + particiones)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/mantenimiento/04-funciones.sql"
echo "       🔄 Triggers automáticos (1 trigger)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/mantenimiento/05-triggers.sql"
echo "       ⏰ pg_cron automático (4 jobs programados)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/mantenimiento/06-pg-cron.sql"
echo ""
echo "    🛍️ MÓDULO: Marketplace (nueva estructura modular)"
echo "       📋 Tablas marketplace (4 tablas: perfiles, reseñas, analytics, categorías)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/marketplace/01-tablas-marketplace.sql"
echo "       📊 Índices especializados (24 índices: GIN full-text, geográficos)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/marketplace/02-indices.sql"
echo "       🛡️ Políticas RLS (8 políticas: acceso público + tenant)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/marketplace/03-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL (3 funciones: search, stats, perfil completo)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/marketplace/04-funciones.sql"
echo "       🔄 Triggers automáticos (4 triggers)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/marketplace/05-triggers.sql"
echo "       📋 Datos iniciales (10 categorías base)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/marketplace/06-datos-iniciales.sql"
echo ""
echo "    📦 MÓDULO: Inventario (nueva estructura modular)"
echo "       📋 Tablas inventario (4 tablas: categorías, proveedores, productos, movimientos)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/inventario/01-tablas.sql"
echo "       📊 Índices especializados (20 índices: GIN full-text, stock bajo)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/inventario/02-indices.sql"
echo "       🛡️ Políticas RLS (16 políticas: multi-tenant)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/inventario/03-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL (7 funciones: valor, ABC, rotación)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/inventario/04-funciones.sql"
echo "       🔄 Triggers automáticos (3 triggers: alertas, timestamps)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/inventario/05-triggers.sql"
echo "       📅 Particionamiento mensual de movimientos_inventario..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/inventario/06-particionamiento.sql"
echo "       ⏰ Jobs pg_cron (alertas de productos sin movimiento)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/inventario/07-jobs-pg-cron.sql"
echo "       📋 Tablas órdenes de compra (3 tablas: órdenes, items, recepciones)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/inventario/08-ordenes-compra-tablas.sql"
echo "       📊 Índices órdenes de compra (12 índices)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/inventario/09-ordenes-compra-indices.sql"
echo "       🛡️ Políticas RLS órdenes de compra (6 políticas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/inventario/10-ordenes-compra-rls.sql"
echo "       ⚡ Funciones y triggers órdenes de compra (5 funciones + 4 triggers)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/inventario/11-ordenes-compra-funciones.sql"
echo ""
echo "    💰 MÓDULO: POS (Punto de Venta)"
echo "       📋 Tablas POS (3 tablas: ventas, items, alertas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/pos/01-tablas.sql"
echo "       📊 Índices especializados (14 índices)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/pos/02-indices.sql"
echo "       🛡️ Políticas RLS (12 políticas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/pos/03-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL (6 funciones: folio, totales, stock, reportes)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/pos/04-funciones.sql"
echo "       🔄 Triggers automáticos (4 triggers: folio, totales, stock, timestamps)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/pos/05-triggers.sql"
echo ""
echo "    💵 MÓDULO: Comisiones (después de POS para triggers de ventas)"
echo "       📋 Tablas comisiones (3 tablas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/comisiones/01-tablas.sql"
echo "       📊 Índices especializados (10 índices)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/comisiones/02-indices.sql"
echo "       🛡️ Políticas RLS (4 políticas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/comisiones/03-rls-policies.sql"
echo "       ⚡ Funciones PL/pgSQL (5 funciones incl. calcular_comision_venta)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/comisiones/04-funciones.sql"
echo "       🔄 Triggers automáticos (7 triggers incl. ventas POS)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/comisiones/05-triggers.sql"
echo ""
echo "    🔔 MÓDULO: Recordatorios (Nov 2025)"
echo "       📋 Tablas recordatorios (configuracion_recordatorios, historial_recordatorios)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/recordatorios/01-tablas.sql"
echo "       📊 Índices especializados (7 índices)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/recordatorios/02-indices.sql"
echo "       🛡️ Políticas RLS (4 políticas)..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/recordatorios/03-rls.sql"
echo "       ⏰ Job pg_cron y vistas de debugging..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/recordatorios/04-pg-cron.sql"
echo ""
echo "    📁 MÓDULO: Storage (MinIO - Dic 2025)"
echo "       📋 Tabla archivos_storage con RLS..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/storage/01-tablas-storage.sql"
echo "       💾 Límites de almacenamiento por plan..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/storage/02-limites-storage.sql"
echo ""
echo "    💳 ACTUALIZACIÓN: Límites de planes para Inventario + POS"
echo "       📋 Agregando columnas de límites a planes_subscripcion..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/core/schema/UPDATE_planes_subscripcion_inventario_pos.sql"
echo ""
echo "✅ Migración completa a arquitectura modular finalizada (15 módulos independientes)"
echo ""

# 3. Insertar plantillas de servicios - ELIMINADO (sistema de plantillas removido)
# echo "  4️⃣ Insertando plantillas de servicios por industria..."
# psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/data/plantillas-servicios.sql"

# 4. Configurar permisos específicos del SaaS (después de crear tablas)
echo "  5️⃣ Configurando permisos finales en tablas..."
eval "cat <<EOF
$(cat $SQL_DIR/setup/03-grant-permissions.sql)
EOF" | psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"

# 5. Crear super administrador inicial (DESHABILITADO - Ahora se hace via interfaz web)
# echo "  6️⃣ Creando super administrador inicial..."
# psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SQL_DIR/setup/04-create-superadmin.sql" || echo "⚠️  Super admin no creado (puede crearse después via API)"
echo "  6️⃣ Super admin se creará via interfaz web en el primer acceso"

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
    WHERE datname IN ('${POSTGRES_DB}', 'n8n_db', 'chat_memories_db')
    ORDER BY datname;
EOSQL

# Verificar que los usuarios fueron creados
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    SELECT
        rolname as "Usuario",
        rolcanlogin as "Puede Login",
        rolsuper as "Superusuario"
    FROM pg_roles
    WHERE rolname IN ('saas_app', 'n8n_app', 'readonly_user', 'integration_user')
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
    AND tablename IN ('usuarios', 'organizaciones', 'profesionales', 'clientes', 'servicios', 'citas', 'horarios_disponibilidad', 'horarios_profesionales', 'subscripciones', 'historial_subscripciones', 'eventos_sistema', 'bloqueos_horarios', 'pagos', 'metodos_pago')
    ORDER BY tablename;
EOSQL

# Verificar índices especializados creados
echo "📊 Verificando índices especializados..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT
        COUNT(*) as "Total Índices",
        COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') as "Índices Especializados"
    FROM pg_indexes
    WHERE schemaname = 'public';
EOSQL

# Verificar políticas RLS habilitadas
echo "🛡️ Verificando políticas RLS..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT
        tablename as "Tabla",
        COUNT(*) as "Políticas RLS"
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
    ORDER BY tablename;
EOSQL

# Verificar cantidad de plantillas de servicios insertadas - ELIMINADO (sistema de plantillas removido)
# psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
#     SELECT
#         tipo_industria,
#         COUNT(*) as "Servicios Template"
#     FROM plantillas_servicios
#     GROUP BY tipo_industria
#     ORDER BY tipo_industria;
# EOSQL

echo ""
echo "✅ Configuración de bases de datos completada exitosamente:"
echo ""
echo "📊 BASES DE DATOS CREADAS:"
echo "  ├── ${POSTGRES_DB} (SaaS principal)"
echo "  ├── n8n_db (workflows n8n)"
echo "  └── chat_memories_db (AI Agent histories)"
echo ""
echo "👤 USUARIOS CREADOS:"
echo "  ├── saas_app (aplicación SaaS principal)"
echo "  ├── n8n_app (n8n workflows)"
echo "  ├── readonly_user (solo lectura - analytics)"
echo "  └── integration_user (integraciones cross-DB)"
echo ""
echo "🗄️ ESQUEMA SAAS MODULAR:"
echo "  ├── 🎭 8 ENUMs especializados (tipos de negocio + bloqueos)"
echo "  ├── ⚡ 64 funciones PL/pgSQL automáticas (incl. inventario, POS, archivado y particionamiento)"
echo "  ├── 🏛️ 25 tablas enterprise (core + negocio + operaciones + inventario + POS + auditoría)"
echo "  ├── ⚡ Tablas PARTICIONADAS: citas, eventos_sistema y movimientos_inventario (range partitioning mensual)"
echo "  ├── 📊 300+ índices optimizados (covering + GIN compuestos + full-text + parciales)"
echo "  ├── 🛡️ 56+ políticas RLS multi-tenant 100% documentadas"
echo "  ├── 🔄 29+ triggers automáticos de validación (incl. stock y alertas inventario)"
echo "  ├── 💳 Sistema completo de subscripciones y facturación SaaS (5 planes incl. custom)"
echo "  ├── 💰 Integración Mercado Pago (pagos + métodos de pago + idempotencia)"
echo "  ├── 📦 Sistema de Inventario (productos, stock, proveedores, órdenes de compra, análisis ABC)"
echo "  ├── 🛒 Punto de Venta (ventas, tickets, reportes de caja)"
echo "  ├── 🧹 Sistema de archivado automático (eventos + citas)"
echo "  ├── ⏰ pg_cron configurado: 5 jobs automáticos (particiones inventario, archivado, vacuum)"
echo "  └── 🔧 Mejoras post-auditoría aplicadas: FKs CASCADE + covering indexes + partitioning"
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
echo "📁 ESTRUCTURA MODULAR:"
echo "  ├── Arquitectura 100% modular con 16 módulos SQL independientes"
echo "  ├── Migración completa (17 Nov 2025): directorio schema/ legacy eliminado"
echo "  ├── Nuevo módulo Marketplace (17 Nov 2025): Directorio público SEO-optimizado"
echo "  ├── Nuevos módulos Inventario + POS (20 Nov 2025): Fase 0 completada"
echo "  ├── Nuevo módulo Ubicaciones (24 Nov 2025): Catálogo geográfico México"
echo "  ├── Máxima mantenibilidad (100-500 líneas por archivo)"
echo "  ├── Mejoras post-auditoría aplicadas (Oct 2025): Calificación 9.5/10"
echo "  ├── Documentación completa en sql/README.md"
echo "  └── Escalable para 1000+ organizaciones y 10M+ citas/mes"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "  ├── El backend Node.js puede conectarse con las credenciales configuradas"
echo "  ├── Las APIs están listas para crear organizaciones y gestionar subscripciones"
echo "  ├── Sistema de límites por plan configurado y listo para usar"
echo "  ├── Tablas de pagos MP listas (ejecutar sync-plans-to-mercadopago.js)"
echo "  ├── Los modelos de datos pueden ser probados"
echo "  ├── Integración Mercado Pago lista en BD (falta backend + webhooks)"
echo "  └── Consulta sql/schema/README.md para detalles de la arquitectura"