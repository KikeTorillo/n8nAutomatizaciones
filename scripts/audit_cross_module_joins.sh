#!/bin/bash

# ============================================================================
# SCRIPT DE AUDITORÍA DE JOINS MULTI-MÓDULO
# ============================================================================
# Fecha: 23 Noviembre 2025
# Propósito: Identificar todos los JOINs entre tablas de diferentes módulos
# Salida: audit_joins_report.txt con análisis detallado
# ============================================================================

echo "🔍 AUDITORÍA DE JOINS MULTI-MÓDULO"
echo "=================================="
echo ""

# Colores para output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorios a escanear
MODELS_DIR="backend/app/templates/scheduling-saas/models"
CONTROLLERS_DIR="backend/app/templates/scheduling-saas/controllers"
OUTPUT_FILE="audit_joins_report.txt"

# Tablas por módulo
declare -A MODULE_TABLES

# Módulo: AGENDAMIENTO (core negocio)
MODULE_TABLES[agendamiento]="profesionales|servicios|clientes|horarios_profesionales|citas|citas_servicios|bloqueos_horarios"

# Módulo: INVENTARIO
MODULE_TABLES[inventario]="productos|categorias_productos|proveedores|movimientos_inventario|inventario_actual|alertas_stock"

# Módulo: POS
MODULE_TABLES[pos]="ventas_pos|ventas_pos_items"

# Módulo: MARKETPLACE
MODULE_TABLES[marketplace]="perfiles_marketplace|reseñas_marketplace|analytics_marketplace|categorias_marketplace"

# Módulo: COMISIONES
MODULE_TABLES[comisiones]="configuracion_comisiones|comisiones_profesionales|historial_comisiones"

# Módulo: CORE (siempre activo)
MODULE_TABLES[core]="organizaciones|usuarios|planes_subscripcion|subscripciones"

# Función para detectar módulo de una tabla
get_module_for_table() {
    local table=$1
    for module in "${!MODULE_TABLES[@]}"; do
        if [[ "$table" =~ ^(${MODULE_TABLES[$module]})$ ]]; then
            echo "$module"
            return
        fi
    done
    echo "unknown"
}

# Limpiar archivo de salida
> "$OUTPUT_FILE"

echo "📊 CONFIGURACIÓN DE AUDITORÍA" | tee -a "$OUTPUT_FILE"
echo "============================" | tee -a "$OUTPUT_FILE"
echo "Directorios escaneados:" | tee -a "$OUTPUT_FILE"
echo "  - $MODELS_DIR" | tee -a "$OUTPUT_FILE"
echo "  - $CONTROLLERS_DIR" | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

echo "Módulos configurados:" | tee -a "$OUTPUT_FILE"
for module in "${!MODULE_TABLES[@]}"; do
    echo "  [$module] ${MODULE_TABLES[$module]}" | tee -a "$OUTPUT_FILE"
done
echo "" | tee -a "$OUTPUT_FILE"

# ============================================================================
# PASO 1: Buscar todos los JOINs en archivos .js
# ============================================================================

echo "🔎 PASO 1: Buscando JOINs en archivos..." | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

TEMP_JOINS="temp_joins.txt"

# Buscar LEFT JOIN, INNER JOIN, RIGHT JOIN, FULL JOIN
grep -rn -E "(LEFT|INNER|RIGHT|FULL)\s+JOIN" \
    "$MODELS_DIR" "$CONTROLLERS_DIR" 2>/dev/null | \
    grep -v node_modules | \
    grep -E "\.js:" > "$TEMP_JOINS"

TOTAL_JOINS=$(wc -l < "$TEMP_JOINS")
echo "✅ Encontrados $TOTAL_JOINS JOINs totales" | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

# ============================================================================
# PASO 2: Analizar cada JOIN y clasificar
# ============================================================================

echo "📋 PASO 2: Analizando JOINs multi-módulo..." | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

declare -A CROSS_MODULE_JOINS
declare -A FILE_JOIN_COUNT

while IFS= read -r line; do
    # Extraer archivo, línea y contenido
    FILE=$(echo "$line" | cut -d: -f1)
    LINE_NUM=$(echo "$line" | cut -d: -f2)
    CONTENT=$(echo "$line" | cut -d: -f3-)

    # Extraer tabla del JOIN (patrón: JOIN tabla_nombre)
    JOINED_TABLE=$(echo "$CONTENT" | grep -oE "JOIN\s+(\w+)" | sed 's/JOIN\s*//')

    if [ -z "$JOINED_TABLE" ]; then
        continue
    fi

    # Determinar módulo del archivo
    if [[ "$FILE" == *"/citas/"* ]]; then
        FILE_MODULE="agendamiento"
    elif [[ "$FILE" == *"/comisiones/"* ]]; then
        FILE_MODULE="comisiones"
    elif [[ "$FILE" == *"/inventario/"* ]]; then
        FILE_MODULE="inventario"
    elif [[ "$FILE" == *"/pos/"* ]]; then
        FILE_MODULE="pos"
    elif [[ "$FILE" == *"/marketplace/"* ]]; then
        FILE_MODULE="marketplace"
    elif [[ "$FILE" == *"profesional"* ]] || [[ "$FILE" == *"servicio"* ]] || [[ "$FILE" == *"cliente"* ]]; then
        FILE_MODULE="agendamiento"
    else
        FILE_MODULE="core"
    fi

    # Determinar módulo de la tabla
    TABLE_MODULE=$(get_module_for_table "$JOINED_TABLE")

    # Si el módulo de la tabla es diferente al del archivo, es cross-module
    if [ "$TABLE_MODULE" != "$FILE_MODULE" ] && [ "$TABLE_MODULE" != "core" ] && [ "$TABLE_MODULE" != "unknown" ]; then
        KEY="$FILE_MODULE -> $TABLE_MODULE"
        CROSS_MODULE_JOINS[$KEY]="${CROSS_MODULE_JOINS[$KEY]}\n[$FILE:$LINE_NUM] JOIN $JOINED_TABLE"

        # Contar por archivo
        FILE_JOIN_COUNT[$FILE]=$((${FILE_JOIN_COUNT[$FILE]:-0} + 1))
    fi
done < "$TEMP_JOINS"

# ============================================================================
# PASO 3: Generar reporte detallado
# ============================================================================

echo "📄 PASO 3: Generando reporte detallado..." | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

echo "============================================================================" >> "$OUTPUT_FILE"
echo "REPORTE DE DEPENDENCIAS SQL ENTRE MÓDULOS" >> "$OUTPUT_FILE"
echo "============================================================================" >> "$OUTPUT_FILE"
echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Sección 1: Resumen por dependencia
echo "📊 RESUMEN DE DEPENDENCIAS ENTRE MÓDULOS" >> "$OUTPUT_FILE"
echo "=========================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

TOTAL_CROSS=0
for key in "${!CROSS_MODULE_JOINS[@]}"; do
    COUNT=$(echo -e "${CROSS_MODULE_JOINS[$key]}" | grep -c "JOIN")
    TOTAL_CROSS=$((TOTAL_CROSS + COUNT))

    echo "⚠️  $key: $COUNT JOINs" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"
echo "TOTAL JOINS CROSS-MODULE: $TOTAL_CROSS" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Sección 2: Detalle por dependencia
echo "📋 DETALLE DE CADA DEPENDENCIA" >> "$OUTPUT_FILE"
echo "===============================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

for key in "${!CROSS_MODULE_JOINS[@]}"; do
    echo "────────────────────────────────────────────────────────────────" >> "$OUTPUT_FILE"
    echo "🔗 DEPENDENCIA: $key" >> "$OUTPUT_FILE"
    echo "────────────────────────────────────────────────────────────────" >> "$OUTPUT_FILE"
    echo -e "${CROSS_MODULE_JOINS[$key]}" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
done

# Sección 3: Archivos más afectados
echo "📁 ARCHIVOS MÁS AFECTADOS (Top 10)" >> "$OUTPUT_FILE"
echo "===================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

for file in "${!FILE_JOIN_COUNT[@]}"; do
    echo "${FILE_JOIN_COUNT[$file]} $file"
done | sort -rn | head -10 >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"

# Sección 4: Recomendaciones
echo "💡 RECOMENDACIONES" >> "$OUTPUT_FILE"
echo "==================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "1. QUERIES CONDICIONALES: Implementar construcción dinámica de JOINs" >> "$OUTPUT_FILE"
echo "   basados en módulos activos para TODAS las dependencias identificadas." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "2. PRIORIZACIÓN:" >> "$OUTPUT_FILE"
echo "   🔴 CRÍTICO: POS → Agendamiento (clientes, profesionales)" >> "$OUTPUT_FILE"
echo "   🔴 CRÍTICO: POS → Inventario (productos) [FK HARD]" >> "$OUTPUT_FILE"
echo "   🟡 IMPORTANTE: Marketplace → Agendamiento (profesionales, servicios)" >> "$OUTPUT_FILE"
echo "   🟡 IMPORTANTE: Comisiones → Agendamiento (citas, profesionales)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "3. TIEMPO ESTIMADO:" >> "$OUTPUT_FILE"
echo "   - Análisis detallado: 2 horas" >> "$OUTPUT_FILE"
echo "   - Implementación queries condicionales: $((TOTAL_CROSS / 5)) - $((TOTAL_CROSS / 3)) horas" >> "$OUTPUT_FILE"
echo "   - Testing: 4 horas" >> "$OUTPUT_FILE"
echo "   - TOTAL: $((TOTAL_CROSS / 5 + 6)) - $((TOTAL_CROSS / 3 + 6)) horas" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Limpiar archivo temporal
rm -f "$TEMP_JOINS"

# ============================================================================
# PASO 4: Mostrar resumen en consola
# ============================================================================

echo -e "${GREEN}✅ Auditoría completada${NC}"
echo ""
echo -e "${BLUE}📊 RESUMEN:${NC}"
echo "  - Total JOINs encontrados: $TOTAL_JOINS"
echo "  - JOINs cross-module: $TOTAL_CROSS"
echo "  - Archivos afectados: ${#FILE_JOIN_COUNT[@]}"
echo ""
echo -e "${YELLOW}📄 Reporte completo guardado en: $OUTPUT_FILE${NC}"
echo ""

# Mostrar top 5 dependencias
echo -e "${BLUE}🔝 Top 5 Dependencias Cross-Module:${NC}"
for key in "${!CROSS_MODULE_JOINS[@]}"; do
    COUNT=$(echo -e "${CROSS_MODULE_JOINS[$key]}" | grep -c "JOIN")
    echo "  ⚠️  $key: $COUNT JOINs"
done | sort -t: -k2 -rn | head -5

echo ""
echo -e "${GREEN}✅ Siguiente paso:${NC} Revisar $OUTPUT_FILE y planificar queries condicionales"
echo ""
