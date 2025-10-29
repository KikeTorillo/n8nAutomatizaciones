#!/bin/bash

# =========================================
# Script de Deployment para VPS
# Uso: bash deploy.sh [comando]
# =========================================

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
if [ ! -f "docker-compose.prod.yml" ]; then
    log_error "docker-compose.prod.yml no encontrado. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

# Función: Copiar .env si no existe
setup_env() {
    if [ ! -f .env ]; then
        log_info "Copiando .env.prod a .env..."
        cp .env.prod .env
        log_success ".env creado desde .env.prod"
        log_warning "IMPORTANTE: Verifica las variables de entorno antes de continuar"
        log_warning "Edita .env y configura valores reales (passwords, secrets, etc.)"
        echo ""
        read -p "¿Deseas editar .env ahora? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        log_info ".env ya existe, usando configuración actual"
    fi
}

# Función: Levantar servicios
deploy_up() {
    log_info "Construyendo y levantando servicios..."

    # Paso 0: Preparar directorios con permisos correctos
    log_info "Paso 0/4: Preparando directorios de datos..."
    if [ ! -d "data/n8n" ]; then
        log_info "Creando data/n8n con permisos correctos..."
        mkdir -p data/n8n
        chown -R 1000:1000 data/n8n
        log_success "data/n8n creado con permisos correctos (usuario node:1000)"
    else
        log_info "data/n8n ya existe, verificando permisos..."
        chown -R 1000:1000 data/n8n
    fi

    # Build imágenes
    docker compose -f docker-compose.prod.yml build

    # Paso 1: Levantar infraestructura (PostgreSQL, Redis, n8n)
    log_info "Paso 1/4: Levantando infraestructura (PostgreSQL, Redis, n8n)..."
    docker compose -f docker-compose.prod.yml up -d postgres redis n8n-main n8n-worker

    log_info "Esperando que la infraestructura esté lista (30s)..."
    sleep 30

    # Paso 2: Ejecutar post-docker-setup (crear owner n8n + API key)
    log_info "Paso 2/4: Configurando n8n (owner + API key)..."
    if [ -f "scripts/post-docker-setup.sh" ]; then
        bash scripts/post-docker-setup.sh
        log_success "n8n configurado correctamente"

        # Recargar N8N_API_KEY del .env y exportarla
        if [ -f .env ]; then
            log_info "Recargando N8N_API_KEY del .env..."
            export N8N_API_KEY=$(grep "^N8N_API_KEY=" .env | cut -d'=' -f2)
            log_success "N8N_API_KEY exportada al entorno"
        fi
    else
        log_warning "scripts/post-docker-setup.sh no encontrado, saltando configuración de n8n"
    fi

    # Paso 3: Levantar aplicación (backend, mcp-server, frontend)
    log_info "Paso 3/4: Levantando aplicación (backend, mcp-server, frontend)..."
    docker compose -f docker-compose.prod.yml up -d backend mcp-server frontend

    # Paso 4: Recrear backend para cargar la nueva API key
    log_info "Paso 4/4: Recargando backend con API key actualizada..."
    sleep 5
    docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps backend
    log_success "Backend recargado con configuración actualizada"

    log_success "Servicios levantados exitosamente!"
    echo ""
    log_info "Esperando que los servicios estén listos (15s)..."
    sleep 15

    # Verificar status
    echo ""
    log_info "Estado de los contenedores:"
    docker compose -f docker-compose.prod.yml ps
}

# Función: Ver logs
view_logs() {
    log_info "Mostrando logs (Ctrl+C para salir)..."
    docker compose -f docker-compose.prod.yml logs -f
}

# Función: Ver status
view_status() {
    log_info "Estado de los servicios:"
    docker compose -f docker-compose.prod.yml ps
    echo ""
    log_info "Health checks:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
}

# Función: Restart
restart_services() {
    log_info "Reiniciando servicios..."
    docker compose -f docker-compose.prod.yml restart
    log_success "Servicios reiniciados!"
}

# Función: Stop
stop_services() {
    log_info "Deteniendo servicios..."
    docker compose -f docker-compose.prod.yml stop
    log_success "Servicios detenidos!"
}

# Función: Down (eliminar contenedores)
down_services() {
    log_warning "Esto detendrá y ELIMINARÁ los contenedores (los datos en volúmenes se mantienen)"
    read -p "¿Estás seguro? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Eliminando contenedores..."
        docker compose -f docker-compose.prod.yml down
        log_success "Contenedores eliminados!"
    else
        log_info "Operación cancelada"
    fi
}

# Función: Update (pull + rebuild)
update_services() {
    log_info "Actualizando desde GitHub..."
    git pull origin main

    log_info "Reconstruyendo imágenes..."
    docker compose -f docker-compose.prod.yml build

    log_info "Reiniciando servicios..."
    docker compose -f docker-compose.prod.yml up -d

    log_success "Servicios actualizados!"
}

# Función: Backup database
backup_database() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    log_info "Creando backup de la base de datos..."
    docker exec postgres_db pg_dump -U admin postgres > "$BACKUP_FILE"
    log_success "Backup creado: $BACKUP_FILE"
}

# Función: Health check
health_check() {
    log_info "Verificando salud de los servicios..."
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

# Función: Mostrar ayuda
show_help() {
    echo "🚀 Script de Deployment para VPS"
    echo ""
    echo "Uso: bash deploy.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  deploy       - Setup .env + build + up (deployment completo)"
    echo "  up           - Levantar servicios (build + up)"
    echo "  down         - Bajar y eliminar contenedores"
    echo "  restart      - Reiniciar servicios"
    echo "  stop         - Detener servicios"
    echo "  logs         - Ver logs en tiempo real"
    echo "  status       - Ver estado de servicios"
    echo "  update       - Git pull + rebuild + restart"
    echo "  backup       - Backup de PostgreSQL"
    echo "  health       - Health check de todos los servicios"
    echo "  help         - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  bash deploy.sh deploy   # Primer deployment"
    echo "  bash deploy.sh logs     # Ver logs"
    echo "  bash deploy.sh update   # Actualizar código"
}

# Main
case "${1:-help}" in
    deploy)
        log_info "🚀 Iniciando deployment completo..."
        setup_env
        deploy_up
        health_check
        echo ""
        log_success "🎉 Deployment completado!"
        log_info "Accede a tu aplicación en:"

        # Leer variables de entorno del .env
        if [ -f .env ]; then
            source .env
            # Extraer dominio base de CORS_ORIGIN (quitar https://)
            DOMAIN=$(echo "$CORS_ORIGIN" | sed 's|https://||' | sed 's|http://||')

            if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
                # URLs con dominio de producción
                echo "  - Frontend: https://$DOMAIN"
                echo "  - Backend API: https://api.$DOMAIN"
                echo "  - n8n: https://n8n.$DOMAIN"
            else
                # Fallback a localhost si no hay dominio configurado
                echo "  - Frontend: http://localhost:8080"
                echo "  - Backend: http://localhost:3000"
                echo "  - n8n: http://localhost:5678"
            fi
        else
            # Fallback si no existe .env
            echo "  - Frontend: http://localhost:8080"
            echo "  - Backend: http://localhost:3000"
            echo "  - n8n: http://localhost:5678"
        fi
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
    update)
        update_services
        ;;
    backup)
        backup_database
        ;;
    health)
        health_check
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
