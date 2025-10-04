#!/bin/bash
# ====================================================================
# 🧪 SCRIPT MAESTRO: EJECUTAR TODOS LOS TESTS
# ====================================================================
# Descripción: Ejecuta secuencialmente todos los tests de validación
# Uso: ./sql/tests/run-all-tests.sh
# ====================================================================

# Nota: No usamos set -e porque los WARNINGs de PostgreSQL no deben detener la ejecución

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración de base de datos
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-admin}"
DB_PASSWORD="${DB_PASSWORD:-adminpassword}"
DOCKER_CONTAINER="${DOCKER_CONTAINER:-postgres_db}"

# Exportar password para psql
export PGPASSWORD="$DB_PASSWORD"

# Detectar si estamos usando Docker
USE_DOCKER=false
if docker ps --filter "name=$DOCKER_CONTAINER" --filter "status=running" | grep -q "$DOCKER_CONTAINER"; then
    USE_DOCKER=true
    echo -e "${CYAN}🐳 Modo Docker detectado: usando contenedor $DOCKER_CONTAINER${NC}"
fi

# Directorio de tests
TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$TESTS_DIR/test-results-$(date +%Y%m%d-%H%M%S).log"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${PURPLE}🧪 SUITE DE TESTS - SISTEMA SAAS MULTI-TENANT${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${CYAN}📅 Fecha:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${CYAN}🗄️  Base de datos:${NC} $DB_NAME@$DB_HOST:$DB_PORT"
echo -e "${CYAN}👤 Usuario:${NC} $DB_USER"
echo -e "${CYAN}📝 Log:${NC} $LOG_FILE"
echo ""

# Función para ejecutar un test
run_test() {
    local test_file=$1
    local test_name=$2
    local test_num=$3

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}🧪 TEST $test_num: $test_name${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Registrar en log
    echo "========================================" >> "$LOG_FILE"
    echo "TEST $test_num: $test_name" >> "$LOG_FILE"
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Ejecutar test
    if [ "$USE_DOCKER" = true ]; then
        # Copiar archivo al contenedor
        docker cp "$TESTS_DIR/$test_file" "$DOCKER_CONTAINER:/tmp/test.sql" > /dev/null 2>&1

        # Ejecutar desde el contenedor
        if docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
            -f /tmp/test.sql >> "$LOG_FILE" 2>&1; then
            echo -e "${GREEN}✅ TEST $test_num PASÓ${NC}"
            echo ""
            docker exec "$DOCKER_CONTAINER" rm /tmp/test.sql > /dev/null 2>&1
            return 0
        else
            echo -e "${RED}❌ TEST $test_num FALLÓ${NC}"
            echo -e "${YELLOW}⚠️  Revisa el log para detalles: $LOG_FILE${NC}"
            echo ""
            docker exec "$DOCKER_CONTAINER" rm /tmp/test.sql > /dev/null 2>&1
            return 1
        fi
    else
        # Ejecutar desde el host
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            -f "$TESTS_DIR/$test_file" >> "$LOG_FILE" 2>&1; then
            echo -e "${GREEN}✅ TEST $test_num PASÓ${NC}"
            echo ""
            return 0
        else
            echo -e "${RED}❌ TEST $test_num FALLÓ${NC}"
            echo -e "${YELLOW}⚠️  Revisa el log para detalles: $LOG_FILE${NC}"
            echo ""
            return 1
        fi
    fi
}

# Contador de tests
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=5

# Timestamp inicio
START_TIME=$(date +%s)

# ====================================================================
# EJECUTAR TESTS SECUENCIALMENTE
# ====================================================================

# TEST 01: Validación de Setup
if run_test "01-validacion-setup.sql" "Validación de Configuración Inicial" "01"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
    echo -e "${RED}⚠️  Test 01 falló. Los siguientes tests pueden fallar también.${NC}"
    echo ""
fi

# TEST 02: Onboarding
if run_test "02-test-onboarding.sql" "Flujos de Onboarding" "02"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
    echo -e "${RED}⚠️  Test 02 falló. Los siguientes tests necesitan datos de onboarding.${NC}"
    echo ""
fi

# TEST 03: Agendamiento
if run_test "03-test-agendamiento.sql" "Flujos de Agendamiento de Citas" "03"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

# TEST 04: Seguridad Multi-Tenant
if run_test "04-test-seguridad-multitenant.sql" "Seguridad Multi-Tenant (RLS)" "04"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

# TEST 05: Performance
if run_test "05-test-performance.sql" "Performance y Optimización" "05"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

# Timestamp fin
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# ====================================================================
# RESUMEN FINAL
# ====================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${PURPLE}📊 RESUMEN DE TESTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Tests pasados:${NC} $TESTS_PASSED/$TESTS_TOTAL"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Tests fallidos:${NC} $TESTS_FAILED/$TESTS_TOTAL"
fi
echo -e "${CYAN}⏱️  Duración total:${NC} ${DURATION}s"
echo -e "${CYAN}📝 Log completo:${NC} $LOG_FILE"
echo ""

# Guardar resumen en log
{
    echo ""
    echo "========================================"
    echo "RESUMEN FINAL"
    echo "========================================"
    echo ""
    echo "Tests pasados: $TESTS_PASSED/$TESTS_TOTAL"
    echo "Tests fallidos: $TESTS_FAILED/$TESTS_TOTAL"
    echo "Duración: ${DURATION}s"
    echo "Fecha fin: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
} >> "$LOG_FILE"

# Código de salida
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOS LOS TESTS PASARON EXITOSAMENTE${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  ALGUNOS TESTS FALLARON${NC}"
    echo -e "${YELLOW}Revisa el log para más detalles: $LOG_FILE${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 1
fi
