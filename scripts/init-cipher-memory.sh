#!/bin/bash
# Inicializa la memoria de Cipher con contexto del proyecto Nexo ERP

set -e
cd /home/kike/Documentos/n8nAutomatizaciones

# Cargar solo variables necesarias del .env
if [ -f .env ]; then
    export OPENAI_API_KEY=$(grep '^OPENAI_API_KEY=' .env | cut -d'=' -f2)
    export OPENROUTER_API_KEY=$(grep '^OPENROUTER_API_KEY=' .env | cut -d'=' -f2)
fi

# Variables específicas para Cipher
export VECTOR_STORE_TYPE=qdrant
export VECTOR_STORE_URL=http://localhost:6333
export OLLAMA_BASE_URL=http://localhost:11434

echo "🧠 Inicializando memoria de Cipher..."

# Esperar a que los servicios estén listos
echo "⏳ Esperando servicios..."
for i in {1..30}; do
    if curl -s http://localhost:6333/health > /dev/null 2>&1 && \
       curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Servicios listos"
        break
    fi
    echo "   Intento $i/30..."
    sleep 2
done

# Verificar servicios
curl -s http://localhost:6333/health > /dev/null || { echo "❌ Qdrant no disponible"; exit 1; }
curl -s http://localhost:11434/api/tags > /dev/null || { echo "❌ Ollama no disponible"; exit 1; }

# Función para enviar a Cipher
send_to_cipher() {
    local message="$1"
    echo "   → Guardando..."
    cipher --no-verbose "Guarda: $message" -a memAgent/cipher.yml 2>/dev/null || true
    sleep 1
}

echo ""
echo "📚 [1/5] Cargando información general del proyecto..."
send_to_cipher "Nexo ERP es un Sistema de Gestión Empresarial SaaS Multi-Tenant para Latinoamérica. Stack: React 18 + Vite (frontend), Node.js + Express (backend), PostgreSQL 17 con RLS. Tiene 10 módulos: core, agendamiento, inventario, eventos-digitales, contabilidad, pos, comisiones, marketplace, storage, recordatorios."

echo "🔐 [2/5] Cargando reglas de seguridad..."
send_to_cipher "Reglas críticas de seguridad en Nexo: 1) RLS SIEMPRE usando RLSContextManager.query() o .transaction(). 2) Variable de tenant: app.current_tenant_id. 3) withBypass solo para JOINs multi-tabla o super_admin. 4) asyncHandler obligatorio en todas las routes."

echo "🔄 [3/5] Cargando orden de middlewares..."
send_to_cipher "Orden de middlewares en backend: auth.authenticateToken → tenant.setTenantContext → controller. Los middlewares están en backend/app/middleware/. Roles: super_admin (bypass todo), admin/propietario (CRUD org), empleado (módulos en modulos_acceso), bot (READ + citas)."

echo "⚛️ [4/5] Cargando patrones frontend..."
send_to_cipher "Patrones frontend: 1) Sanitizar strings vacíos a undefined antes de enviar (Joi rechaza empty strings). 2) Invalidar queries con queryClient.invalidateQueries() tras mutaciones. 3) Limpiar cache con queryClient.clear() en Login/Logout. 4) Mobile-first con Tailwind: flex flex-col sm:flex-row."

echo "🐛 [5/5] Cargando troubleshooting común..."
send_to_cipher "Troubleshooting Nexo: Error 'Organización no encontrada' = usar withBypass. Error 'field not allowed to be empty' = sanitizar a undefined. Cambios no reflejan = docker restart + Ctrl+Shift+R. RLS policy violation = verificar app.current_tenant_id."

echo ""
echo "✅ Memoria inicializada correctamente"
echo ""
echo "📊 Estado de Qdrant:"
curl -s http://localhost:6333/collections/knowledge_memory | jq '{puntos: .result.points_count, estado: .result.status}'
