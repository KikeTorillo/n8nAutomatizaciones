#!/bin/bash
set -e

echo "🚀 Script de Setup Automático de n8n Owner"
echo "=========================================="
echo ""

# Cargar variables de entorno
if [ -f .env ]; then
  source .env
else
  echo "❌ Archivo .env no encontrado"
  exit 1
fi

# Configuración por defecto
N8N_OWNER_EMAIL=${N8N_OWNER_EMAIL:-"admin@saas-agendamiento.local"}
N8N_OWNER_FIRST_NAME=${N8N_OWNER_FIRST_NAME:-"Admin"}
N8N_OWNER_LAST_NAME=${N8N_OWNER_LAST_NAME:-"Sistema"}
N8N_OWNER_PASSWORD=${N8N_OWNER_PASSWORD:-$N8N_BASIC_AUTH_PASSWORD}

echo "📋 Configuración:"
echo "  Email: $N8N_OWNER_EMAIL"
echo "  Nombre: $N8N_OWNER_FIRST_NAME $N8N_OWNER_LAST_NAME"
echo ""

# Verificar si n8n ya tiene owner
echo "🔍 Esperando a que n8n esté listo..."

# Esperar a que n8n esté completamente iniciado (máximo 60 segundos)
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null || echo "000")

  if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo "✅ n8n está listo (HTTP $HTTP_STATUS)"
    break
  fi

  echo "⏳ Esperando n8n... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Timeout esperando a que n8n inicie"
  echo "ℹ️  Verifica los logs: docker logs n8n-main"
  exit 1
fi

# Verificar que las migraciones de n8n completaron
echo "⏳ Esperando a que n8n termine las migraciones de BD..."
MAX_MIGRATION_WAIT=30
MIGRATION_COUNT=0
while [ $MIGRATION_COUNT -lt $MAX_MIGRATION_WAIT ]; do
    # Verificar que la tabla 'user' existe (indica migraciones completadas)
    TABLE_EXISTS=$(docker exec postgres_db psql -U n8n_app -d n8n_db -t -c \
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user');" 2>/dev/null | tr -d ' ')

    if [ "$TABLE_EXISTS" = "t" ]; then
        echo "✅ Migraciones de n8n completadas"
        break
    fi

    echo "   Esperando migraciones... ($((MIGRATION_COUNT + 1))/$MAX_MIGRATION_WAIT)"
    sleep 2
    MIGRATION_COUNT=$((MIGRATION_COUNT + 1))
done

if [ $MIGRATION_COUNT -eq $MAX_MIGRATION_WAIT ]; then
    echo "⚠️  Timeout esperando migraciones (60s)"
    echo "ℹ️  Continuando de todas formas..."
fi

echo ""
echo "🔍 Verificando si n8n ya tiene owner..."

OWNER_EXISTS=$(docker exec postgres_db psql -U n8n_app -d n8n_db -t -c \
  "SELECT COUNT(*) FROM \"user\" WHERE \"roleSlug\" = 'global:owner' AND email IS NOT NULL AND email != '';" 2>/dev/null | tr -d ' ' || echo "0")

if [ -z "$OWNER_EXISTS" ]; then
  OWNER_EXISTS=0
fi

if [ "$OWNER_EXISTS" -gt 0 ]; then
  echo "✅ n8n ya tiene un owner configurado"
  echo ""
  docker exec postgres_db psql -U n8n_app -d n8n_db -c \
    "SELECT email, \"firstName\", \"lastName\", \"roleSlug\", settings->>'userActivated' as activated FROM \"user\" WHERE \"roleSlug\" = 'global:owner';"
  echo ""
  echo "ℹ️  Si necesitas reset, elimina el volumen: rm -rf data/n8n/*"
  exit 0
fi

echo "⚠️  n8n requiere configuración del owner"
echo ""

# Método 1: Usar la API de n8n (recomendado)
echo "📡 Intentando setup via API de n8n..."

SETUP_RESPONSE=$(curl -s -X POST http://localhost:5678/rest/owner/setup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$N8N_OWNER_EMAIL\",
    \"firstName\": \"$N8N_OWNER_FIRST_NAME\",
    \"lastName\": \"$N8N_OWNER_LAST_NAME\",
    \"password\": \"$N8N_OWNER_PASSWORD\"
  }" 2>&1)

# Verificar si funcionó
if echo "$SETUP_RESPONSE" | grep -q "id"; then
  echo "✅ Owner creado exitosamente via API!"
  echo ""
  echo "📊 Datos del owner:"
  echo "$SETUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SETUP_RESPONSE"
  echo ""
  echo "🎯 Próximos pasos:"
  echo "  1. Acceder a n8n: http://localhost:5678"
  echo "  2. Login con: $N8N_OWNER_EMAIL / <tu password>"
  echo "  3. Generar API Key: Settings → API → Generate API Key"
  echo "  4. Actualizar .env con: N8N_API_KEY=<key-generada>"
  exit 0
else
  echo "⚠️  API setup falló, intentando método alternativo..."
  echo "Respuesta: $SETUP_RESPONSE"
  echo ""
fi

# Método 2: SQL directo (fallback - requiere hash bcrypt)
echo "🔧 Método SQL directo no implementado aún"
echo ""
echo "📝 Setup Manual Requerido (si n8n no tiene owner):"
echo "  1. Abrir: http://localhost:5678/setup"
echo "  2. Usar credenciales:"
echo "     Email: $N8N_OWNER_EMAIL"
echo "     Nombre: $N8N_OWNER_FIRST_NAME"
echo "     Apellido: $N8N_OWNER_LAST_NAME"
echo "     Password: <usa N8N_BASIC_AUTH_PASSWORD del .env>"
echo ""
echo "ℹ️  Continuando con el levantamiento del backend..."

# No fallar el script si el setup de owner no se pudo hacer automáticamente
# El usuario puede configurarlo manualmente después o ya existía
exit 0
