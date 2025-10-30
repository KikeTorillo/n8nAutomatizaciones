#!/bin/bash

# =========================================
# Script de Deployment para PROD-LOCAL
# Uso: bash deploy.local.sh [comando]
# =========================================

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
COMPOSE_FILE="docker-compose.prod.local.yml"
ENV_SOURCE=".env.prod.local"

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "$COMPOSE_FILE no encontrado. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

# Función: Copiar .env si no existe
setup_env() {
    if [ ! -f .env ]; then
        log_info "Copiando $ENV_SOURCE a .env..."
        cp "$ENV_SOURCE" .env
        log_success ".env creado desde $ENV_SOURCE"
    else
        log_info ".env ya existe, usando configuración actual"
    fi
}

# Función: Levantar servicios
deploy_up() {
    log_info "Construyendo y levantando servicios (PROD-LOCAL)..."

    # Build imágenes
    docker compose -f "$COMPOSE_FILE" build

    # Paso 1: Levantar infraestructura (PostgreSQL, Redis, n8n)
    log_info "Paso 1/4: Levantando infraestructura (PostgreSQL, Redis, n8n)..."
    docker compose -f "$COMPOSE_FILE" up -d postgres redis n8n-main n8n-worker

    log_info "Esperando que la infraestructura esté lista (30s)..."
    sleep 30

    # Paso 2: Ejecutar post-docker-setup (crear owner n8n + API key)
    log_info "Paso 2/4: Configurando n8n (owner + API key)..."
    if [ -f "scripts/post-docker-setup.sh" ]; then
        bash scripts/post-docker-setup.sh
        log_success "n8n configurado correctamente"

        # Validar que la API key fue generada
        log_info "Validando N8N_API_KEY..."
        if [ ! -f /tmp/n8n_api_key_latest.txt ]; then
            log_error "API Key no fue generada. Verifica los logs de post-docker-setup.sh"
            exit 1
        fi

        # Recargar N8N_API_KEY del .env y exportarla
        if [ -f .env ]; then
            log_info "Recargando N8N_API_KEY del .env..."
            export N8N_API_KEY=$(grep "^N8N_API_KEY=" .env | cut -d'=' -f2)

            # Validar que la API key es válida contra n8n
            API_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
                -X GET "http://localhost:5678/api/v1/workflows" \
                -H "X-N8N-API-KEY: $N8N_API_KEY" 2>/dev/null || echo "000")

            if [ "$API_TEST" = "200" ]; then
                log_success "N8N_API_KEY validada contra n8n (HTTP 200)"
            else
                log_warning "No se pudo validar API key contra n8n (HTTP $API_TEST)"
                log_warning "Continuando deployment (la API key podría estar correcta)"
            fi
        fi
    else
        log_warning "scripts/post-docker-setup.sh no encontrado, saltando configuración de n8n"
    fi

    # Paso 3: Levantar aplicación (backend, mcp-server, frontend)
    log_info "Paso 3/4: Levantando aplicación (backend, mcp-server, frontend)..."
    docker compose -f "$COMPOSE_FILE" up -d backend mcp-server frontend

    # Paso 4: Verificar que backend cargó la API key correcta
    log_info "Paso 4/4: Verificando configuración del backend..."
    sleep 5

    # Validar que el backend tiene la API key correcta
    BACKEND_API_KEY=$(docker exec back printenv N8N_API_KEY 2>/dev/null || echo "")
    ENV_API_KEY=$(grep "^N8N_API_KEY=" .env 2>/dev/null | cut -d'=' -f2)

    if [ "$BACKEND_API_KEY" = "$ENV_API_KEY" ]; then
        log_success "Backend cargó N8N_API_KEY correctamente"
    else
        log_warning "Backend tiene API key diferente al .env"
        log_info "Recargando backend con configuración actualizada..."
        docker compose -f "$COMPOSE_FILE" up -d --force-recreate --no-deps backend
        sleep 5
        log_success "Backend recargado con configuración actualizada"
    fi

    log_success "Servicios levantados exitosamente!"
    echo ""
    log_info "Esperando que los servicios estén listos (15s)..."
    sleep 15

    # Verificar status
    echo ""
    log_info "Estado de los contenedores:"
    docker compose -f "$COMPOSE_FILE" ps
}

# Función: Ver logs
view_logs() {
    log_info "Mostrando logs (Ctrl+C para salir)..."
    docker compose -f "$COMPOSE_FILE" logs -f
}

# Función: Ver status
view_status() {
    log_info "Estado de los servicios (PROD-LOCAL):"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    log_info "Health checks:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
}

# Función: Restart
restart_services() {
    log_info "Reiniciando servicios..."
    docker compose -f "$COMPOSE_FILE" restart
    log_success "Servicios reiniciados!"
}

# Función: Stop
stop_services() {
    log_info "Deteniendo servicios..."
    docker compose -f "$COMPOSE_FILE" stop
    log_success "Servicios detenidos!"
}

# Función: Down (eliminar contenedores)
down_services() {
    log_warning "Esto detendrá y ELIMINARÁ los contenedores (los datos en volúmenes se mantienen)"
    read -p "¿Estás seguro? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Eliminando contenedores..."
        docker compose -f "$COMPOSE_FILE" down
        log_success "Contenedores eliminados!"
    else
        log_info "Operación cancelada"
    fi
}

# Función: Rebuild (reconstruir sin cache)
rebuild_services() {
    log_info "Reconstruyendo imágenes sin cache..."
    docker compose -f "$COMPOSE_FILE" build --no-cache

    log_info "Reiniciando servicios..."
    docker compose -f "$COMPOSE_FILE" up -d

    log_success "Servicios reconstruidos y reiniciados!"
}

# Función: Backup database
backup_database() {
    BACKUP_FILE="backup_prod_local_$(date +%Y%m%d_%H%M%S).sql"
    log_info "Creando backup de la base de datos..."
    docker exec postgres_db pg_dump -U admin postgres > "$BACKUP_FILE"
    log_success "Backup creado: $BACKUP_FILE"
}

# Función: Health check
health_check() {
    log_info "Verificando salud de los servicios (PROD-LOCAL)..."
    echo ""

    # Frontend
    echo -n "Frontend (8080): "
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|301\|302"; then
        log_success "OK"
    else
        log_error "FAIL"
    fi

    # Backend
    echo -n "Backend (3000): "
    if curl -s http://localhost:3000/health | grep -q "healthy"; then
        log_success "OK"
    else
        log_error "FAIL"
    fi

    # n8n
    echo -n "n8n (5678): "
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5678 | grep -q "200\|401"; then
        log_success "OK"
    else
        log_error "FAIL"
    fi

    # MCP Server
    echo -n "MCP Server (3100): "
    if curl -s http://localhost:3100/health | grep -q "healthy"; then
        log_success "OK"
    else
        log_error "FAIL"
    fi
}

# Función: Clean (limpiar todo)
clean_all() {
    log_warning "⚠️  CUIDADO: Esto eliminará contenedores, volúmenes, imágenes y datos"
    log_warning "Solo usar para empezar completamente de cero"
    echo ""
    read -p "¿Estás ABSOLUTAMENTE seguro? Escribe 'SI' para confirmar: " confirm

    if [ "$confirm" = "SI" ]; then
        log_info "Deteniendo y eliminando contenedores..."
        docker compose -f "$COMPOSE_FILE" down -v

        log_info "Eliminando volúmenes de datos..."
        rm -rf data/postgres/* data/n8n/* data/redis/* 2>/dev/null || true

        log_info "Eliminando imágenes..."
        docker compose -f "$COMPOSE_FILE" down --rmi all

        log_success "Limpieza completa realizada"
        log_info "Para volver a levantar: bash deploy.local.sh deploy"
    else
        log_info "Operación cancelada"
    fi
}

# Función: Mostrar ayuda
show_help() {
    echo "🚀 Script de Deployment para PROD-LOCAL"
    echo ""
    echo "Uso: bash deploy.local.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  deploy       - Setup .env + build + up (deployment completo)"
    echo "  up           - Levantar servicios (build + up)"
    echo "  down         - Bajar y eliminar contenedores"
    echo "  restart      - Reiniciar servicios"
    echo "  stop         - Detener servicios"
    echo "  logs         - Ver logs en tiempo real"
    echo "  status       - Ver estado de servicios"
    echo "  rebuild      - Rebuild sin cache + restart"
    echo "  backup       - Backup de PostgreSQL"
    echo "  health       - Health check de todos los servicios"
    echo "  clean        - Limpiar todo (contenedores + volúmenes + imágenes)"
    echo "  help         - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  bash deploy.local.sh deploy   # Primer deployment"
    echo "  bash deploy.local.sh logs     # Ver logs"
    echo "  bash deploy.local.sh health   # Verificar salud"
    echo ""
    echo "Este script simula el deployment de VPS en local para testing."
    echo "Usa docker-compose.prod.local.yml (multi-stage builds)"
}

# Main
case "${1:-help}" in
    deploy)
        log_info "🚀 Iniciando deployment completo (PROD-LOCAL)..."
        setup_env
        deploy_up
        health_check
        echo ""
        log_success "🎉 Deployment completado!"
        log_info "Accede a tu aplicación en:"
        echo "  - Frontend: http://localhost:8080"
        echo "  - Backend: http://localhost:3000"
        echo "  - n8n: http://localhost:5678"
        echo ""
        log_info "Este ambiente simula producción con imágenes optimizadas"
        ;;
    up)
        deploy_up
        ;;
    down)
        down_services
        ;;
    restart)
        restart_services
        ;;
    stop)
        stop_services
        ;;
    logs)
        view_logs
        ;;
    status)
        view_status
        ;;
    rebuild)
        rebuild_services
        ;;
    backup)
        backup_database
        ;;
    health)
        health_check
        ;;
    clean)
        clean_all
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Comando desconocido: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
