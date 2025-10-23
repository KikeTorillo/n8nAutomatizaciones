#!/bin/bash
set -e

echo ""
echo "🔑 Script de Creación Automática de n8n API Key"
echo "================================================"
echo ""

# Cargar variables de entorno
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Variables
# Usar localhost si estamos fuera de docker, o N8N_API_URL si está definido
N8N_URL="http://localhost:5678"
EMAIL="${N8N_OWNER_EMAIL:-admin@saas-agendamiento.local}"
PASSWORD="${N8N_BASIC_AUTH_PASSWORD}"
COOKIE_FILE="/tmp/n8n_cookies_$$.txt"

# Validar que tenemos la contraseña
if [ -z "$PASSWORD" ]; then
    echo "❌ Error: N8N_BASIC_AUTH_PASSWORD no está configurado en .env"
    exit 1
fi

# Función de limpieza
cleanup() {
    rm -f "$COOKIE_FILE"
}
trap cleanup EXIT

echo "📡 Conectando a n8n: $N8N_URL"
echo ""

# Paso 1: Login
echo "🔐 Paso 1/3: Autenticando en n8n..."
LOGIN_RESPONSE=$(curl -s -X POST "${N8N_URL}/rest/login" \
    -H "Content-Type: application/json" \
    -c "$COOKIE_FILE" \
    -d "{
        \"emailOrLdapLoginId\": \"$EMAIL\",
        \"password\": \"$PASSWORD\"
    }")

# Verificar login exitoso
if echo "$LOGIN_RESPONSE" | grep -q '"id"'; then
    USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   ✅ Login exitoso (User ID: $USER_ID)"
else
    echo "   ❌ Error en login:"
    echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
    exit 1
fi

echo ""

# Paso 2: Obtener scopes válidos
echo "🔍 Paso 2/3: Obteniendo scopes disponibles..."
SCOPES_RESPONSE=$(curl -s -X GET "${N8N_URL}/rest/api-keys/scopes" \
    -b "$COOKIE_FILE")

# Verificar que obtuvimos los scopes
if echo "$SCOPES_RESPONSE" | grep -q '"data"'; then
    SCOPES_ARRAY=$(echo "$SCOPES_RESPONSE" | grep -o '"data":\[.*\]' | sed 's/"data"://')
    SCOPES_COUNT=$(echo "$SCOPES_ARRAY" | grep -o ',' | wc -l)
    SCOPES_COUNT=$((SCOPES_COUNT + 1))
    echo "   ✅ Obtenidos $SCOPES_COUNT scopes disponibles"
else
    echo "   ❌ Error obteniendo scopes:"
    echo "$SCOPES_RESPONSE"
    exit 1
fi

echo ""

# Paso 3: Crear API Key
echo "🔑 Paso 3/3: Creando API Key..."
API_KEY_RESPONSE=$(curl -s -X POST "${N8N_URL}/rest/api-keys" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_FILE" \
    -d "{
        \"label\": \"Sistema Backend - Auto-generated\",
        \"expiresAt\": null,
        \"scopes\": $SCOPES_ARRAY
    }")

# Verificar creación exitosa
if echo "$API_KEY_RESPONSE" | grep -q '"rawApiKey"'; then
    RAW_API_KEY=$(echo "$API_KEY_RESPONSE" | grep -o '"rawApiKey":"[^"]*"' | cut -d'"' -f4)
    API_KEY_ID=$(echo "$API_KEY_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    LABEL=$(echo "$API_KEY_RESPONSE" | grep -o '"label":"[^"]*"' | cut -d'"' -f4)

    echo "   ✅ API Key creada exitosamente"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Detalles de la API Key:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "   ID:         $API_KEY_ID"
    echo "   Label:      $LABEL"
    echo "   Expiration: Never"
    echo "   Scopes:     $SCOPES_COUNT (full access)"
    echo ""
    echo "   🔑 API Key:"
    echo "   $RAW_API_KEY"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Guardar en archivo temporal para referencia
    echo "$RAW_API_KEY" > /tmp/n8n_api_key_latest.txt

    # Actualizar .env automáticamente
    echo "📝 Actualizando .env automáticamente..."
    sed -i "s|^N8N_API_KEY=.*|N8N_API_KEY=$RAW_API_KEY|" .env
    echo "✅ N8N_API_KEY actualizado en .env"
    echo ""

    # Mostrar hint solo si se ejecuta manualmente (no desde post-docker-setup)
    if [ -z "$AUTO_SETUP" ]; then
        echo "💡 Nota: Si el backend ya está corriendo, reinícialo para aplicar cambios:"
        echo "   docker compose restart backend"
        echo ""
    fi

else
    echo "   ❌ Error creando API Key:"
    echo "$API_KEY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$API_KEY_RESPONSE"
    exit 1
fi

echo "✅ Proceso completado exitosamente!"
echo ""
