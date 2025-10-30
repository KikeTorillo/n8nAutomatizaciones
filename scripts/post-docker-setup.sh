#!/bin/bash
set -e

echo ""
echo "🔄 Post-Docker Setup - Esperando a que los servicios estén listos..."
echo ""

# Función para esperar a que un servicio esté disponible
wait_for_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo "⏳ Esperando a que $service_name esté disponible..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|302\|401"; then
            echo "✅ $service_name está listo!"
            return 0
        fi

        echo "   Intento $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "⚠️  $service_name no responde después de $max_attempts intentos"
    return 1
}

# Esperar a que n8n esté disponible
if wait_for_service "n8n" "http://localhost:5678"; then
    echo ""
    echo "🚀 Ejecutando setup automático de n8n..."
    echo ""

    # Ejecutar setup de n8n owner
    bash "$(dirname "$0")/setup-n8n-owner.sh"

    echo ""
    echo "🔑 Verificando API Key de n8n..."
    echo ""

    # Cargar variables de entorno de forma segura
    if [ -f .env ]; then
        set -a  # Habilitar auto-export de variables
        source .env
        set +a  # Deshabilitar auto-export
    fi

    # Verificar si ya existe API Key y si es válida
    if [ -z "$N8N_API_KEY" ] || [ "$N8N_API_KEY" = "" ]; then
        echo "⚠️  N8N_API_KEY no configurado"
        NEED_NEW_KEY=true
    else
        # Verificar si la API key es válida probando con la API de n8n
        echo "🔍 Verificando validez de API Key existente..."
        API_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:5678/api/v1/workflows" -H "X-N8N-API-KEY: $N8N_API_KEY")

        if [ "$API_TEST" = "200" ]; then
            echo "✅ N8N_API_KEY válido y funcional"
            NEED_NEW_KEY=false
        else
            echo "⚠️  N8N_API_KEY no es válido (HTTP $API_TEST)"
            echo "   (Probablemente se eliminó con dev:fresh)"
            NEED_NEW_KEY=true
        fi
    fi

    if [ "$NEED_NEW_KEY" = true ]; then
        echo "🚀 Generando nueva API Key automáticamente..."
        echo ""

        # Generar API Key automáticamente (con flag para modo automático)
        AUTO_SETUP=1 bash "$(dirname "$0")/create-n8n-apikey.sh"

        # Verificar si se generó correctamente
        if [ -f /tmp/n8n_api_key_latest.txt ]; then
            echo ""
            echo "✅ N8N_API_KEY generado y guardado en .env"
            echo "   Backend se levantará con la configuración correcta..."
        else
            echo "⚠️  No se pudo generar API Key. Ejecuta manualmente: npm run setup:apikey"
        fi
    fi

    echo ""
    echo "✅ Setup completo!"
else
    echo ""
    echo "⚠️  n8n no está disponible. Puedes ejecutar el setup manualmente:"
    echo "   npm run setup:n8n"
fi

echo ""
